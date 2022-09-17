import { Application, Container, utils } from 'pixi.js';

import {
  arc,
  Card,
  cardHeuristicFactory,
  face,
  getDeck,
  reorder,
  shuffle,
} from '../generic/cards/cards';
import { getCardVisual, reorderVisuals } from '../generic/cards/theme';
import { fromPolar } from '../generic/geometry';

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

const deck = getDeck(false, undefined, 0);
shuffle(deck, true);

function onClick(c: Card, cv: Container) {
  console.log('click', c, cv); // TODO SEND EVENTS
}

for (const c of deck) {
  const cv = getCardVisual(c, onClick);
  cv.scale.set(0.5);
  app.stage.addChild(cv);
}

const CARDS_PER_HAND = 5;
const NUM_PLAYERS = 5;

const D_ANGLE = 360 / NUM_PLAYERS;
let angle = 90;

const hands = [];
for (let i = 0; i < NUM_PLAYERS; ++i) {
  const hand = deck.splice(0, CARDS_PER_HAND);
  reorder(hand, cardHeuristicFactory(false));
  reorderVisuals(hand, app.stage);

  const [dx, dy] = fromPolar([Math.min(W2, H2) * 0.8, angle]);
  const [dx2, dy2] = fromPolar([21, 17 + (angle - 90)]);
  arc(hand, [W2 + dx, H2 + dy], [dx2, dy2], angle - 90, 6);

  if (i !== 0) face(hand, true, true);

  hands.push(hand);
  angle += D_ANGLE;
}

face(deck, true);
arc(deck, [W2, H2], [0.4, -0.4], 0, 0);

// @ts-ignore
window.cards = { deck, hands };
