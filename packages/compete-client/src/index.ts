/**
 * This module defines the compete multiplayer game client
 * that's suitable for browser or nodejs usage (granted WebSocket was globally set)
 */

import { pack, unpack } from 'msgpackr';

export type CompeteClientOptions = {
  /**
   * The address of the websocket server
   * Defaults to `ws(s)://(web server's hostname):9001`
   */
  address?: string;

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
};

/**
 *
 * @param competeClientOptions
 */
export function competeClient({
  onMessage,
  onStateChange,
  onError,
  address,
}: CompeteClientOptions): CompeteClientAPI {
  function connect() {
    const ws = new WebSocket(
      address ||
        `${location.protocol === 'http:' ? 'ws:' : 'wss:'}//${
          location.hostname
        }:9001`,
    );
    ws.binaryType = 'arraybuffer'; // to get an arraybuffer instead of a blob
    return ws;
  }

  const ws: WebSocket = connect();

  let queuedMessages: any[] = [];
  let myId: number;
  const otherIds: Set<number> = new Set();

  function sendMsg(msg: any): boolean {
    if (!ws.OPEN) {
      queuedMessages.push(msg);
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
    const data = unpack(new Uint8Array(ev.data));

    switch (data.op) {
      case 'my-id':
        myId = data.id;
        break;
      case 'other-id-joined':
        otherIds.add(data.id);
        break;
      case 'other-id-left':
        otherIds.delete(data.id);
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
  };
}
