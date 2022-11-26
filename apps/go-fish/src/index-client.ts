import { Application, Container, DEG_TO_RAD, utils } from 'pixi.js';

import { competeClient } from 'compete-client';
import { Card, getCardVisual } from 'compete-utils';
import { GoFishState } from './GoFishState';

utils.skipHello();

const W = 1280;
const H = 1024;
const W2 = W / 2;
const H2 = H / 2;

const app = new Application({
  width: W,
  height: H,
  antialias: true,
  resolution: devicePixelRatio,
  autoDensity: true,
});

// @ts-ignore
document.body.appendChild(app.view);

const tableCtn = new Container();
tableCtn.position.set(W2, H2);
tableCtn.pivot.set(W2, H2);
app.stage.addChild(tableCtn);

let cardId: string;
let participantId: number;

function onCardClick(c: Card, _cv: Container) {
  if (c.owner !== ws.getId()) {
    console.log('ignore');
    return;
  }
  cardId = c.id;
  console.log('asking for', c);
  ws.send({ op: 'ask', cardId: cardId, to: participantId || 0 });
}

function syncStateWithVisuals({ stockPile, hands }: GoFishState) {
  for (const c of [...stockPile, ...hands.flatMap((c) => c)]) {
    const cv = getCardVisual(c, onCardClick);
    cv.scale.set(0.5);
    tableCtn.addChild(cv);
  }
}

let st: GoFishState;
const ws = competeClient({
  onMessage: (msg) => {
    switch (msg.op) {
      case 'update-state':
        if (!st) {
          st = new GoFishState(msg.state as GoFishState);

          // SEE PLAYER #N PERSPECTIVE
          const D_ANGLE = -360 / st.participants.length;
          const currentPlayerIndex = st.participants.indexOf(ws.getId());
          tableCtn.rotation = currentPlayerIndex * D_ANGLE * DEG_TO_RAD;

          syncStateWithVisuals(st);
        } else {
          // TODO
        }
        break;
      case 'next-to-play':
        if (msg.id === ws.getId()) console.log('Our time to play!');
        break;
      case 'ask2':
        {
          const { to, rank } = msg as { to: number; rank: string };
          if (to === ws.getId()) {
            console.log(`I was asked ${rank}s`);
          }
        }
        break;
      default:
        console.warn(`unsupported opcode: ${msg.op}`);
    }
  },
});
