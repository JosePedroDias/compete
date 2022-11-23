import WebSocket from 'ws';

import { competeClient } from 'compete-client';
import { tableDims, fps } from './constants';

import Alea from 'alea';
const rng = Alea();

import { createNoise2D } from 'simplex-noise';
const n2d = createNoise2D(rng);

// @ts-ignore
global.WebSocket = WebSocket;

//let st: any = undefined;
let myId: number;
let frameNo = 0;

const ws = competeClient({
  onMessage: (msg: any) => {
    //console.log('MSG', msg);
    switch (msg.op) {
      case 'my-id':
        myId = msg.id;
        console.log(`id:${myId}`);
        break;
      case 'other-id':
        break;
      case 'player-left':
        console.warn(`player left: ${msg.id}`);
        break;
      case 'update-state':
        //st = new GoFishState(msg.state as GoFishState);
        //console.log('st', st);
        break;
      case 'next-to-play':
        if (msg.id === myId) {
          //setTimeout(play, 2000);
        }
        break;
      default:
        console.warn(`unsupported opcode: ${msg.op}`);
    }
  },
});

setInterval(() => {
  const x = frameNo * 0.025;
  const p2 = [
    100 * (n2d(x, 0) - 0.5),
    -0.5 * tableDims[1] + 100 * (n2d(x, 1) - 0.5),
  ];

  ws.send({ op: 'position', value: p2 });

  ++frameNo;
}, 1000 / fps);
