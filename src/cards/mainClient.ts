import { Application, utils } from 'pixi.js';

import { arc, cardHeuristicFactory, face, getDeck, reorder, shuffle } from '../generic/cards/cards';
import { getCardVisual, reorderVisuals } from '../generic/cards/theme';

utils.skipHello();

const W = 1024;
const H = 768;
const W2 = W/2;
const H2 = H/2;

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

const minX = 90;
const maxX = 960;
const minY = 110;
const dX = 70;
const dY = 180;

let x = minX;
let y = minY;
for (const c of deck) {
  const cv = getCardVisual(c);
  cv.scale.set(0.5);
  c.setPosition(x, y);
  app.stage.addChild(cv);
  x += dX;
  if (x > maxX) {
    x = minX;
    y += dY;
  }
}

const CARDS_PER_HAND = 5;

const hand1 = deck.splice(0, CARDS_PER_HAND);
const hand2 = deck.splice(0, CARDS_PER_HAND);

reorder(hand1, cardHeuristicFactory(false));
reorderVisuals(hand1, app.stage);

arc(deck, [W2, H2], [0.4, -0.4], 0, 0);

arc(hand1, [W2, 0.85 * H], [20, 4], 0, 6);

face(hand2, true);
arc(hand2, [W2, 0.15 * H], [-20, 4], 180, 6);

// @ts-ignore
window.d = deck;
