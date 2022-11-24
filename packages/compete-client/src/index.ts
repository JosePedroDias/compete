/**
 * This module defines the compete multiplayer game client
 * that's suitable for browser or nodejs usage (granted WebSocket was globally set)
 */

import { pack, unpack } from 'msgpackr';

export type PingStats = { min: number; max: number; average: number };

export type CompeteClientOptions = {
  /**
   * The address of the websocket server
   * Defaults to `ws(s)://(web server's hostname):9001`
   */
  address?: string;

  /**
   * Will log incoming messages as warnings if true
   */
  logMessages?: boolean;

  /**
   * This callback will be executed every time we receive a new message from the websocket server
   *
   * @param data
   */
  onMessage(data: any): void;

  /**
   * This callback will be execute if an error occurs
   *
   * @param error
   */
  onError?: (error: any) => void;

  /**
   * Executed when state changes
   *
   * @param state
   */
  onStateChange?: (state: 'open' | 'closed') => void;

  /**
   * called if room participants join or leave
   */
  onRosterChange?: (kind: 'left' | 'joined', playerId: number) => void;
};

export type CompeteClientAPI = {
  /**
   * Sends a message to the websocket server using message pack
   * @param msg the message to send
   * @returns true if message was sent immediately, false if it was queued for later
   */
  send(msg: any): boolean;

  /**
   * call this to attempt resuming a closed connection
   */
  reconnect(): void;

  /**
   * by default outgoing messages get queued for sending once the connection is restored. call this to discard them
   */
  discardQueuedMessages(): void;

  /**
   * gets our own unique id in the server
   */
  getId(): number;

  /**
   * gets the other player ids we know are in the same room as we are
   */
  getOtherIds(): number[];

  /**
   * returns the ping stats. numbers are RTT/2 in milliseconds
   */
  getPing(): PingStats;
};

/**
 *
 * @param competeClientOptions
 */
export function competeClient({
  onMessage,
  onStateChange,
  onRosterChange,
  onError,
  address,
  logMessages,
}: CompeteClientOptions): CompeteClientAPI {
  function connect() {
    if (!address) {
      if (typeof window === 'undefined') {
        address = 'ws://localhost:9001';
      } else {
        address = `${location.protocol === 'http:' ? 'ws:' : 'wss:'}//${
          location.hostname
        }:9001`;
      }
    }
    const ws = new WebSocket(address);
    ws.binaryType = 'arraybuffer'; // to get an arraybuffer instead of a blob
    return ws;
  }

  const ws: WebSocket = connect();

  let queuedMessages: any[] = [];
  let myId: number;
  const otherIds: Set<number> = new Set();

  const PING_MAX_ITEMS = 5;
  const pingReadings: number[] = [];

  function sendMsg(msg: any, doNotQueue = false): boolean {
    if (!ws.OPEN) {
      if (!doNotQueue) queuedMessages.push(msg);
      return false;
    } else {
      ws.send(pack(msg));
      return true;
    }
  }

  ws.addEventListener('open', () => {
    onStateChange && onStateChange('open');

    let msg;
    while ((msg = queuedMessages.shift())) sendMsg(msg);
  });

  ws.addEventListener('close', () => {
    onStateChange && onStateChange('closed');
  });

  ws.addEventListener('error', (ev: any) => {
    onError && onError(ev);
  });

  ws.addEventListener('message', (ev: any) => {
    let data;
    try {
      data = unpack(new Uint8Array(ev.data));
    } catch (_) {
      return;
    }

    if (typeof data !== 'object' || !data.op) return;

    if (logMessages) console.warn(data);

    switch (data.op) {
      case 'ping':
        {
          const serverNow = data.serverNow;
          const clientNow = Date.now();
          const rttOver2 = clientNow - serverNow;
          pingReadings.unshift(rttOver2);
          if (pingReadings.length > PING_MAX_ITEMS) pingReadings.pop();
          sendMsg({ op: 'pong', serverNow, clientNow }, true);
        }
        break;
      case 'my-id':
        myId = data.id;
        break;
      case 'other-id-joined':
        otherIds.add(data.id);
        onRosterChange && onRosterChange('joined', data.id);
        break;
      case 'other-id-left':
        otherIds.delete(data.id);
        onRosterChange && onRosterChange('left', data.id);
        break;
      case 'error-server-full':
        onError && onError(data.text);
        ws.close();
        break;
      default:
        onMessage(data);
    }
  });

  return {
    send(msg: any): boolean {
      return sendMsg(msg);
    },
    discardQueuedMessages(): void {
      queuedMessages = [];
    },
    reconnect(): void {
      if (ws.readyState === WebSocket.CLOSED) connect();
    },
    getId(): number {
      return myId;
    },
    getOtherIds(): number[] {
      return Array.from(otherIds);
    },
    getPing(): PingStats {
      const min = Math.min(...pingReadings);
      const max = Math.max(...pingReadings);
      const average =
        pingReadings.reduce((prev, curr) => prev + curr, 0) /
        pingReadings.length;
      return { min, max, average };
    },
  };
}
