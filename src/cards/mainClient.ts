import { Application, Text, utils } from 'pixi.js';

import { getDeck } from '../generic/cards/cards';
import { getCardVisual } from '../generic/cards/theme';

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

const deck = getDeck(false, undefined, 0.33);

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

// @ts-ignore
window.d = deck;
