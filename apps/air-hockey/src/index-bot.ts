import WebSocket from 'ws';
import Alea from 'alea';
import { createNoise2D } from 'simplex-noise';

import { competeClient } from 'compete-client';
import { tableDims, fps } from './constants';

const rng = Alea();
const n2d = createNoise2D(rng);

// @ts-ignore
global.WebSocket = WebSocket;

//let st: any = undefined;
let myId: number;
let frameNo = 0;
//let st:AirHockeyState;

const ws = competeClient({
  onMessage(msg: any) {
    //console.log('MSG', msg);
    switch (msg.op) {
      case 'my-id':
        myId = msg.id;
        console.log(`id:${myId}`);
        break;
      case 'other-id':
        break;
      case 'player-left':
        process.exit(0);
        break;
      case 'update-state':
        //const st = msg.state as AirHockeyState;
        //console.log('st', st);
        //console.log(`score: ${st.scoreboard.join(':')}, positions: ${st.positions.join('|')}`);
        break;
      default:
        console.warn(`unsupported opcode: ${msg.op}`);
    }
  },
  onStateChange(st: string) {
    if (st === 'closed') process.exit(0);
  },
});

setInterval(() => {
  const x = frameNo * 0.02;
  const r0 = n2d(x, 0) - 0.5;
  const r1 = n2d(x, 1) - 0.5;
  const p2 = [
    tableDims[0] * (0.5 + 0.95 * r0),
    tableDims[1] * (-0.25 + 0.52 * r1),
  ];
  ws.send({ op: 'position', value: p2 });
  ++frameNo;
}, 1000 / fps);
