import {
  SSLApp,
  App,
  WebSocket,
  SHARED_COMPRESSOR,
  CompressOptions,
} from 'uWebSockets.js';

import { pack, unpack } from 'msgpackr';

/**
 * AppOpts is the set of options internal uWebSockets expects
 */
export type AppOpts = {
  key_file_name?: string;
  cert_file_name?: string;
  passphrase?: string;
};

/**
 * WS related uWebSockets options
 */
export type WSOpts = {
  compression?: CompressOptions;
  maxPayloadLength?: number;
  idleTimeout?: number;
};

/**
 * An enriched websocket instance (holds a unique id per client beside send method)
 */
export type WebSocket2 = {
  /**
   * unique id for the player in the game server
   */
  id: number;
  /**
   * Sends a message to this player
   *
   * @param msg the message to send
   */
  send(msg: any): void;
};

/**
 * Expected interface to pass to wrapper function
 */
export type WrapperObj = {
  /**
   * port number the server will use
   */
  port?: number;
  appOpts?: AppOpts;
  wsOpts: WSOpts;
  /**
   * function that gets called every time a player joins
   */
  onJoin: (ws: WebSocket2) => void;
  /**
   * function that gets called every time a player sends a message
   */
  onMessage: (ws: WebSocket2, message: any) => void;
  /**
   * function that gets called every time a player leaves
   */
  onLeave: (ws: WebSocket2, code: number) => void;
};

/**
 * This is the lower level game server abstraction. Features only basic websocket functionality
 *
 * @param wrapperObj
 */
export function wrapper({
  port = 9001,
  appOpts = {},
  wsOpts = {},
  onJoin,
  onMessage,
  onLeave,
}: WrapperObj) {
  const _App = appOpts.key_file_name ? SSLApp : App;

  let maxId = 1;
  function getId() {
    return maxId++;
  }

  const idToWs = new Map<number, WebSocket2>(); // id -> ws

  const PING_INTERVAL_MS = 1000;
  setInterval(() => {
    const serverNow = Date.now();
    for (const ws of idToWs.values()) {
      ws.send({ op: 'ping', serverNow });
    }
  }, PING_INTERVAL_MS);

  /**
   * Sends a message to everyone in the server (optionally but one)
   *
   * @param msg message to send
   * @param ignoreMe optional. if sent, this recipient will be skipped from broadcast
   */
  function broadcast(msg: any, ignoreMe?: WebSocket2) {
    const msgO = pack(msg);
    const wss = Array.from(idToWs.values());
    for (const ws of wss) {
      // @ts-ignore
      if (ws !== ignoreMe) ws._send(msgO, true);
    }
  }

  _App(appOpts)
    .ws('/*', {
      compression: SHARED_COMPRESSOR,
      ...wsOpts,

      open: (ws: WebSocket) => {
        ws._send = ws.send;
        ws.send = (data: any) => ws._send(pack(data), true);

        ws.id = getId();
        idToWs.set(ws.id, ws as any as WebSocket2);
        //console.log(`ws open: ${ws.id}`);

        onJoin(ws as any as WebSocket2);
      },

      message: (_ws: WebSocket, message: any, isBinary: boolean) => {
        if (!isBinary) return; // we expect all incoming messages to be binary msgpack encoded

        const ws = _ws as any as WebSocket2;
        const data = unpack(Buffer.from(message));

        if (typeof data !== 'object' || !data.op) return;
        
        switch (data.op) {
          case 'pong':
            {
              const serverNow2 = Date.now();
              const { serverNow, clientNow } = data as {
                serverNow: number;
                clientNow: number;
              };
              const rttOver2 = clientNow - serverNow;
              const rttOver2_ = serverNow2 - clientNow;
              const rtt = rttOver2 + rttOver2_;
              console.warn(`pong id:${ws.id}, rtt:${rtt}`);
            }
            break;
          default:
            onMessage(ws, data);
        }
      },

      /* drain: (ws) => {
            console.log(`ws backpressure: ${ws.getBufferedAmount()}`);
        }, */

      close: (ws: WebSocket, code: any, _message: any) => {
        idToWs.delete(ws.id);
        //console.log(`ws closed ${ws.id} ok`);

        onLeave(ws as any as WebSocket2, code);
      },
    })
    /* .any('/*', (res, req) => {
        res.end('Nothing to see here!');
    }) */
    .listen(port, (token: any) => {
      if (token) {
        console.log(`Listening to port ${port}`);
      } else {
        console.log(`Failed to listen to ${port}`);
      }
    });

  return { idToWs, broadcast };
}
