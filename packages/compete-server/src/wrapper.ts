import {
  SSLApp,
  App,
  WebSocket,
  SHARED_COMPRESSOR,
  HttpResponse,
  HttpRequest,
  us_socket_context_t,
} from 'uWebSockets.js';

import { pack, unpack } from 'msgpackr';

import {
  getNodeStats,
  getAppStats,
  increaseNumConnections,
  decreaseNumConnections,
} from './metrics';

export type { HttpRequest } from 'uWebSockets.js';

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
  maxPayloadLength?: number;
  idleTimeout?: number;

  //sendPingsAutomatically: boolean;
  //ping: (ws: WebSocket, message: ArrayBuffer) => void
  //pong: (ws: WebSocket, message: ArrayBuffer) => void
};

export type PingStats = { min: number; max: number; average: number };

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

  /**
   * returns the ping stats. numbers are RTT in milliseconds
   */
  getPing(): PingStats;
};

/**
 * Expected interface to pass to wrapper function
 */
export type WrapperObj = {
  /**
   * port number the server will use
   */
  port?: number;

  /**
   * shared game string both the server and client should use
   * to prevent connections from outdated clients or clients from different games altogether.
   * if the server has is set it will validate the client sends it.
   */
  gameProtocol?: string;

  /**
   * define this function to prevent everyone from reading metrics (limit on host or shared secret header being present)
   */
  validateMetricsRequest?(req: HttpRequest): boolean;

  /**
   * define this function to prevent incoming game traffic from coming from unauthorized hosts (ex: 3rd party mirroring our game with ads)
   */
  validateWebsocketRequest?(req: HttpRequest): boolean;

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
  gameProtocol,
  validateMetricsRequest,
  validateWebsocketRequest,
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
  const PING_MAX_ITEMS = 5;
  const pingReadings: Map<number, number[]> = new Map(); // id -> latest RTTs

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
      sendPingsAutomatically: false, // TODO TESTING
      ...wsOpts,

      // from https://github.com/uNetworking/uWebSockets.js/blob/master/examples/Upgrade.js
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Protocol_upgrade_mechanism
      upgrade(
        res: HttpResponse,
        req: HttpRequest,
        context: us_socket_context_t,
      ) {
        const url = req.getUrl();
        const receivedGameProtocol = url.substring(1);
        let error: string | undefined;

        console.log('validateWebsocketRequest', validateWebsocketRequest);

        if (validateWebsocketRequest && !validateWebsocketRequest(req)) {
          console.log(
            `prevented upgrade from unauthorized host ${req.getHeader(
              'origin',
            )}`,
          );
          error = 'unauthorized host';
        } else if (gameProtocol && receivedGameProtocol !== gameProtocol) {
          console.log(
            `upgrade rejected (got '${receivedGameProtocol}' and expected '${gameProtocol}')`,
          );
          error = 'game protocol not found or incorrect';
        }

        if (error) {
          res.writeHeader('content-type', 'text/plain');
          res.writeStatus('403 Forbidden');
          res.end(`403 Forbidden - ${error}`, true);
        } else {
          res.upgrade(
            { url },
            req.getHeader('sec-websocket-key'),
            req.getHeader('sec-websocket-protocol'),
            req.getHeader('sec-websocket-extensions'),
            context,
          );
        }
      },

      open(_ws: WebSocket) {
        // hydrate ws with additional attributes and methods
        _ws._send = _ws.send;
        _ws.send = (data: any) => _ws._send(pack(data), true);
        _ws.getPing = function () {
          const pr = pingReadings.get(this.id) || [];
          const min = Math.min(...pr);
          const max = Math.max(...pr);
          const average = pr.reduce((prev, curr) => prev + curr, 0) / pr.length;
          return { min, max, average };
        };
        _ws.id = getId();

        const ws = _ws as any as WebSocket2;

        idToWs.set(ws.id, ws);
        pingReadings.set(ws.id, []);

        increaseNumConnections();

        //console.log(`ws open: ${ws.id}`);
        onJoin(ws);
      },

      message(_ws: WebSocket, message: any, isBinary: boolean) {
        const ws = _ws as any as WebSocket2;

        if (!isBinary) return; // we expect all incoming messages to be binary msgpack encoded

        let data;
        try {
          data = unpack(Buffer.from(message));
        } catch (_) {
          return;
        }

        if (typeof data !== 'object' || !data.op) return;

        switch (data.op) {
          case 'pong':
            {
              const serverNow2 = Date.now();
              const { serverNow } = data as { serverNow: number };

              const rtt = serverNow2 - serverNow;
              //console.warn(`pong id:${ws.id}, rtt:${rtt}`);

              let pr = pingReadings.get(ws.id);
              if (!pr) {
                // should not happen but...
                pr = [];
                pingReadings.set(ws.id, pr);
              }
              pr.unshift(rtt);
              if (pr.length > PING_MAX_ITEMS) pr.pop();
              //console.warn(`pong ${ws.id} -> ${JSON.stringify(ws.getPing())}`);
            }
            break;
          default:
            onMessage(ws, data);
        }
      },

      /* drain: (ws) => {
        console.log(`ws backpressure: ${ws.getBufferedAmount()}`);
      }, */

      close(_ws: WebSocket, code: any, _message: any) {
        const ws = _ws as any as WebSocket2;

        idToWs.delete(ws.id);
        pingReadings.delete(ws.id);

        decreaseNumConnections();

        //console.log(`ws closed ${ws.id} ok`);
        onLeave(ws, code);
      },
    })
    .get('/metrics', (res: HttpResponse, req: HttpRequest) => {
      if (!validateMetricsRequest || validateMetricsRequest(req)) {
        res.writeHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            app: getAppStats(),
            node: getNodeStats(),
          }),
          true,
        );
      } else {
        console.log('prevented unauthorized metrics request.');
        res.writeHeader('content-type', 'text/plain');
        res.writeStatus('404 Not Found');
        res.end('404 Not Found', true);
      }
    })
    .any('/*', (res, _req) => {
      res.writeHeader('content-type', 'text/plain');
      res.writeStatus('404 Not Found');
      res.end('404 Not Found', true);
    })
    .listen(port, (token: any) => {
      if (token) {
        console.log(`Listening to port ${port}`);
      } else {
        console.log(`Failed to listen to ${port}`);
      }
    });

  return { idToWs, broadcast };
}
