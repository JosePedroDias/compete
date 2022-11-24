import { Application, Container, Sprite, Texture, utils } from 'pixi.js';
import { Howl, Howler } from 'howler';

import { competeClient } from 'compete-client';
import { V2 } from 'compete-utils';
import { tableDims, fps, AirHockeyState } from './constants';

const W = 1024;
const H = 1024;
const W2 = W / 2;
const H2 = H / 2;

let p1: V2 = [0, 0.5 * tableDims[1]];

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

app.stage.on('pointermove', (ev) => {
  const pos = ev.data.global;
  p1 = [pos.x - W2, pos.y - H2];
});

let myId: number;

const ws = competeClient({
  onMessage(msg: any) {
    switch (msg.op) {
      case 'my-id':
        myId = msg.id;
        console.log(`id:${myId}`);
        break;
      case 'other-id':
        break;
      case 'update-state':
        {
          const st = msg.state as AirHockeyState;
          const [puckPos, pusher1Pos, pusher2Pos] = st.positions;
          puckSp.position.set(puckPos[0], puckPos[1]);
          pusher1Sp.position.set(pusher1Pos[0], pusher1Pos[1]);
          pusher2Sp.position.set(pusher2Pos[0], pusher2Pos[1]);

          for (const sample of st.sfxToPlay) {
            gameSfx.get(sample)?.play();
          }
        }
        break;
      default:
        console.warn(`unsupported opcode: ${msg.op}`);
    }
  },
  onStateChange(st: string) {
    if (st === 'closed') process.exit(0);
  },
});

setInterval(() => {
  ws.send({ op: 'position', value: p1 });
}, 1000 / fps);
