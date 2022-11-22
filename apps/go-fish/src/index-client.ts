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
  //console.log('click', c, cv); // TODO SEND EVENTS
  if (c.owner !== myId) {
    console.log('ignore');
    return;
  }
  cardId = c.id;
  console.log('saved', c);
  ws.send({ op: 'ask', card: cardId, to: participantId || 0 });
}

function importState({ stockPile, hands }: GoFishState) {
  for (const pile of [stockPile, ...hands]) {
    for (const c of pile) {
      const cv = getCardVisual(c, onCardClick);
      cv.scale.set(0.5);
      tableCtn.addChild(cv);
    }
  }
}

function processCard(c: Card) {
  const cc = new Card(c.id, c.back, c.suit, c.rank);
  cc.owner = c.owner;
  cc.setPosition(c.position[0], c.position[1]);
  cc.setRotation(c.rotation);
  //cc.setFacingDown(c.facingDown);
  return cc;
}

let myId: number;
let st: GoFishState;
const ws = competeClient({
  onMessage: (msg) => {
    switch (msg.op) {
      case 'my-id':
        myId = msg.id;
        document.title = `id:${myId}`;
        break;
      case 'player-left':
        console.warn(`player left: ${msg.id}`);
        break;
      case 'update-state':
        if (!st) {
          const st0 = msg.state as GoFishState;

          st = {
            stockPile: st0.stockPile.map(processCard),
            hands: st0.hands.map((h) => h.map(processCard)),
          };

          const participantIds: number[] = st.hands.map(
            (h) => h[0].owner as number,
          );
          const currentPlayer = participantIds.indexOf(myId);

          // SEE PLAYER #N PERSPECTIVE
          const D_ANGLE = -360 / participantIds.length;
          tableCtn.rotation = currentPlayer * D_ANGLE * DEG_TO_RAD;

          importState(st);
          // @ts-ignore
          window.st = st;
        } else {
          // TODO
        }

        break;
      default:
        console.warn(`unsupported opcode: ${msg.op}`);
    }
  },
});
