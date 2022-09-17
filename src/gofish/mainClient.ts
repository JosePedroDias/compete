import { Application, Container, DEG_TO_RAD, utils } from 'pixi.js';
import { uwsClient } from '../generic/uwsClient';

import {
  Card,
  cardHeuristicFactory,
  face,
  getDeck,
  dealCards,
  shuffle,
} from '../generic/cards/cards';
import { getCardVisual } from '../generic/cards/theme';

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

document.body.appendChild(app.view);

const tableCtn = new Container();
tableCtn.position.set(W2, H2);
tableCtn.pivot.set(W2, H2);
app.stage.addChild(tableCtn);

const deck = getDeck(false, undefined, 0);
shuffle(deck, true);

function onClick(c: Card, cv: Container) {
  console.log('click', c, cv); // TODO SEND EVENTS
}

const NUM_PLAYERS = 5;
const CURRENT_PLAYER = 0;
const D_ANGLE = -360 / NUM_PLAYERS;

const hands = dealCards(
  deck,
  [W2, H2],
  5,
  NUM_PLAYERS,
  cardHeuristicFactory(false),
);

for (let i = 0; i < NUM_PLAYERS; ++i) {
  if (i !== CURRENT_PLAYER) face(hands[i], true, true);
}
face(deck, true, true);

// SEE PLAYER #N PERSPECTIVE
tableCtn.rotation = CURRENT_PLAYER * D_ANGLE * DEG_TO_RAD;

// @ts-ignore
window.cards = { deck, hands };

for (const pile of [deck, ...hands]) {
  for (const c of pile) {
    const cv = getCardVisual(c, onClick);
    cv.scale.set(0.5);
    tableCtn.addChild(cv);
  }
}

let myId: number;
const ws = uwsClient((msg) => {
  switch (msg.op) {
    case 'my-id':
      myId = msg.id;
      document.title = `id:${myId}`;
      break;
    case 'player-left':
      console.warn(`player left: ${msg.id}`);
      break;
    case 'update-state':
      break;
    default:
      console.warn(`unsupported opcode: ${msg.op}`);
  }
});
