import { Application, Container, utils } from 'pixi.js';

import { arc, Card, cardHeuristicFactory, face, getDeck, reorder, shuffle } from '../generic/cards/cards';
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

function onClick(c:Card, cv:Container) {
  console.log('click', c, cv);
}

for (const c of deck) {
  const cv = getCardVisual(c, onClick);
  cv.scale.set(0.5);
  app.stage.addChild(cv);
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
//window.d = deck;

//app.stage.interactiveChildren = true;
//app.stage.interactive = true;

/* app.stage.on('pointerdown', (ev) => {
  console.log(ev);
}); */
