import { Application, Sprite, Text, Texture, utils } from 'pixi.js';

import { Card, getDeck } from '../generic/cards/cards';

utils.skipHello();

const app = new Application({
  width: 1024,
  height: 768,
  antialias: true,
  resolution: devicePixelRatio,
  autoDensity: true,
});

document.body.appendChild(app.view);

const txt = new Text('FPS', {
  fill: 0xffffff,
  fontSize: 14,
  fontFamily: 'monospace',
});

txt.position.set(20, 20);
app.stage.addChild(txt);

function getCardVisual(c: Card) {
  const imgUrl = new URL(`/cards/${c.toString()}.svg`, import.meta.url).href;
  const cardTexture = Texture.from(imgUrl);
  const card = new Sprite(cardTexture);
  card.position.set(100, 100);
  card.scale.set(0.5);
  app.stage.addChild(card);
  return card;
}

const minX = 90;
const maxX = 960;
const minY = 110;
const dX = 70;
const dY = 180;

const deck = getDeck(false);
console.log(deck);
let x = minX;
let y = minY;
for (const c of deck) {
  const cv = getCardVisual(c);
  cv.anchor.set(0.5);
  cv.position.set(x, y);
  x += dX;
  if (x > maxX) {
    x = minX;
    y += dY;
  }
}
