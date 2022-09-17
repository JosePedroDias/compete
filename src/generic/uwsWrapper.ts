import {
  SSLApp,
  App,
  WebSocket,
  SHARED_COMPRESSOR,
  CompressOptions,
} from 'uWebSockets.js';
import { pack, unpack } from 'msgpackr';

export type AppOpts = {
  key_file_name?: string;
  cert_file_name?: string;
  passphrase?: string;
};

export type WSOpts = {
  compression?: CompressOptions;
  maxPayloadLength?: number;
  idleTimeout?: number;
};

export type WebSocket2 = {
  id: number;
  send(msg: any): void;
};

export type WrapperObj = {
  port?: number;
  appOpts?: AppOpts;
  wsOpts: WSOpts;
  onJoin: (ws: WebSocket2) => void;
  onMessage: (ws: WebSocket2, message: any) => void;
  onLeave: (ws: WebSocket2, code: number) => void;
};

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

  const idToWsInstance = new Map<number, WebSocket2>(); // id -> ws

  function broadcast(msg: any, ignoreMe?: WebSocket2) {
    const msgO = pack(msg);
    const wss = Array.from(idToWsInstance.values());
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
        ws.send = (data) => ws._send(pack(data), true);

        ws.id = getId();
        idToWsInstance.set(ws.id, ws as any as WebSocket2);
        //console.log(`ws open: ${ws.id}`);

        onJoin(ws as any as WebSocket2);
      },

      message: (ws: WebSocket, message: any, isBinary: boolean) => {
        if (!isBinary) {
          return; // console.warn(`ignored non-binary incoming message: ${ab2str(message)}`);
        }

        onMessage(ws as any as WebSocket2, unpack(Buffer.from(message)));
      },

      /* drain: (ws) => {
            console.log(`ws backpressure: ${ws.getBufferedAmount()}`);
        }, */

      close: (ws: WebSocket, code, _message) => {
        idToWsInstance.delete(ws.id);
        //console.log(`ws closed ${ws.id} ok`);

        onLeave(ws as any as WebSocket2, code);
      },
    })
    /* .any('/*', (res, req) => {
        res.end('Nothing to see here!');
    }) */
    .listen(port, (token) => {
      if (token) {
        console.log(`Listening to port ${port}`);
      } else {
        console.log(`Failed to listen to ${port}`);
      }
    });

  return { idToWsInstance, broadcast };
}
