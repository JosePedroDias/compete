import { Application, Container, Sprite, Texture, utils } from 'pixi.js';
import { Howl, Howler } from 'howler';
import Alea from 'alea';
import { createNoise2D } from 'simplex-noise';

import { tableDims, fps } from './constants';
import { V2 } from 'compete-utils';
import { simulate } from './simulate';

const W = 1024;
const H = 1024;
const W2 = W / 2;
const H2 = H / 2;

let p1: V2 = [0, 0.5 * tableDims[1]];
let p2: V2 = [0, -0.5 * tableDims[1]];

utils.skipHello();

export const gameTextures = new Map<string, Texture>();
export const gameSfx = new Map<string, Howl>();
function loadResources() {
  const texKeys = ['puck', 'pusher-cyan', 'pusher-purple', 'table'];
  for (const key of texKeys) {
    const texture = Texture.from(`/sprites/${key}.png`);
    gameTextures.set(key, texture);
  }

  const sfxKeys = ['hit', 'wall', 'goal', 'set_down'];
  for (const key of sfxKeys) {
    const sample = new Howl({ src: [`/sfx/${key}.mp3`] });
    gameSfx.set(key, sample);
  }
}
loadResources();

Howler.volume(0.6);

function fakePlayer() {
  const rng = Alea();
  const n2d = createNoise2D(rng);
  let frameNo = 0;

  setInterval(() => {
    const x = frameNo * 0.02;
    const r0 = n2d(x, 0) - 0.5;
    const r1 = n2d(x, 1) - 0.5;
    p2 = [tableDims[0] * (0.5 + 0.95 * r0), tableDims[1] * (-0.25 + 0.52 * r1)];
    ++frameNo;
  }, 1000 / fps);
}
fakePlayer();

const app = new Application({
  width: W,
  height: H,
  antialias: true,
  resolution: devicePixelRatio,
  autoDensity: true,
  backgroundColor: 0xff333333,
});

// @ts-ignore
document.body.appendChild(app.view);

const ctn = new Container();

const puckSp = new Sprite(gameTextures.get('puck'));
const pusher1Sp = new Sprite(gameTextures.get('pusher-cyan'));
const pusher2Sp = new Sprite(gameTextures.get('pusher-purple'));
const tableSp = new Sprite(gameTextures.get('table'));

puckSp.anchor.set(0.5);
pusher1Sp.anchor.set(0.5);
pusher2Sp.anchor.set(0.5);
tableSp.anchor.set(0.5);

ctn.position.set(W2, H2);

ctn.addChild(tableSp);
ctn.addChild(puckSp);
ctn.addChild(pusher1Sp);
ctn.addChild(pusher2Sp);

app.stage.addChild(ctn);

app.stage.cursor = 'none';
app.stage.interactive = true;

const doStep = simulate();

app.stage.on('pointermove', (ev) => {
  const pos = ev.data.global;
  p1 = [pos.x - W2, pos.y - H2];
});

setInterval(() => {
  const { positions, events } = doStep([p1, p2]);
  const [puckPos, pusher1Pos, pusher2Pos] = positions;
  puckSp.position.set(puckPos[0], puckPos[1]);
  pusher1Sp.position.set(pusher1Pos[0], pusher1Pos[1]);
  pusher2Sp.position.set(pusher2Pos[0], pusher2Pos[1]);

  for (const [ev, val] of events) {
    if (ev === 'play') gameSfx.get(val)?.play();
    else if (ev === 'update-scoreboard') console.log(`score:`, val);
  }
}, 1000 / fps);
