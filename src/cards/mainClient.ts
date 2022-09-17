import { Application, Sprite, Text, Texture, utils } from 'pixi.js';

import { Card, getDeck } from '../generic/cards/cards';

//declare module "*.svg" { }

//import folder from '../generic/cards/artwork';
//import c3Svg from '/cards/C3.svg';
//import d4Svg from '../generic/cards/artwork/D4.svg';

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

function getCardVisual(_c: Card) {
  const imgUrl = new URL('/cards/C3.svg', import.meta.url).href;
  const cardTexture = Texture.from(imgUrl);

  //const cardTexture = Texture.from(`/${_c.toString()}.svg`);  

  const card = new Sprite(cardTexture);
  card.position.set(100, 100);
  card.scale.set(0.5);
  app.stage.addChild(card);
  return card;
}

//const cardPaths = [c3Svg, d4Svg];

/* let x = 20;
for (const svg of cardPaths) {
  const cardTexture = Texture.from(svg);
  const card = new Sprite(cardTexture);
  card.position.set(x, 400);
  card.scale.set(0.5);
  app.stage.addChild(card);
  x += 30;
} */

const minX = 20;
const maxX = 500;
const minY = 50;
const dX = 40;
const dY = 100;

const deck = getDeck(false);
let x = minX;
let y = minY;
for (const c of deck) {
  const cv = getCardVisual(c);
  cv.position.set(x, y);
  x += dX;
  if (x > maxX) {
    x = minX;
    y += dY;
  }
}
