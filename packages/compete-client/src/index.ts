/**
 * This module defines the compete multiplayer game client
 * that's suitable for browser or nodejs usage (granted WebSocket was globally set)
 */

import { pack, unpack } from 'msgpackr';

export type CompeteClientOptions = {
  /**
   * This callback will be executed every time we receive a new message from the websocket server
   * @param data
   */
  onMessage(data: any): void;
  /**
   * The address of the websocket server
   */
  address?: string;
};

export type CompeteClientAPI = {
  /**
   * Sends a message to the websocket server using message pack
   * @param o the data to send
   */
  send(o: any): void;
};

export function competeClient(options: CompeteClientOptions): CompeteClientAPI {
  const { onMessage, address } = options;

  // @ts-ignore
  const ws = new WebSocket(address || 'ws://127.0.0.1:9001');
  ws.binaryType = 'arraybuffer'; // to get an arraybuffer instead of a blob

  ws.addEventListener('open', () => {
    console.log('open');
  });

  ws.addEventListener('close', () => {
    console.log('close');
  });

  ws.addEventListener('error', (ev: any) => {
    console.error(ev);
  });

  ws.addEventListener('message', (ev: any) => {
    const data = unpack(new Uint8Array(ev.data));
    onMessage(data);
  });

  return {
    send(o: any): void {
      ws.send(pack(o));
    },
  };
}
