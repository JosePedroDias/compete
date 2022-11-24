import { Application, Container, Sprite, Texture, utils } from 'pixi.js';
import { Howl, Howler } from 'howler';

import { competeClient, PingStats } from 'compete-client';
import { V2 } from 'compete-utils';
import { tableDims, fps, AirHockeyState } from './constants';

const W = 1024;
const H = 1024;
const W2 = W / 2;
const H2 = H / 2;

////

// html hacky overlay
const onlineStatusEl = document.getElementById('online-status') as HTMLElement;
const rosterEl = document.getElementById('roster') as HTMLElement;
const pingEl = document.getElementById('ping') as HTMLElement;
const scoreEl = document.getElementById('score') as HTMLElement;
function updateOnlineStatus(status: string) {
  if (onlineStatusEl.firstChild)
    onlineStatusEl.firstChild.nodeValue = status === 'open' ? 'yes' : 'no';
}

function updateRoster(othersCount: number) {
  if (rosterEl.firstChild)
    rosterEl.firstChild.nodeValue = othersCount ? 'with opponent' : 'alone';
}

function updatePing(ping: PingStats) {
  if (pingEl.firstChild)
    pingEl.firstChild.nodeValue = isNaN(ping.average)
      ? '...'
      : Object.entries(ping)
          .map(
            ([k, v]) =>
              `${k === 'average' ? 'avg' : k}:${
                k === 'average' ? v.toFixed(1) : v
              }`,
          )
          .join(' ');
}

function updateScore(score: V2) {
  if (scoreEl.firstChild) scoreEl.firstChild.nodeValue = score.join(' : ');
}
////

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

const ws = competeClient({
  onMessage(msg: any) {
    switch (msg.op) {
      case 'update-state':
        {
          const st = msg.state as AirHockeyState;
          const [puckPos, pusher1Pos, pusher2Pos] = st.positions;
          puckSp.position.set(puckPos[0], puckPos[1]);
          pusher1Sp.position.set(pusher1Pos[0], pusher1Pos[1]);
          pusher2Sp.position.set(pusher2Pos[0], pusher2Pos[1]);

          for (const sample of st.sfxToPlay) gameSfx.get(sample)?.play();
          updateScore(st.scoreboard);
        }
        break;
      default:
        console.warn(`unsupported opcode: ${msg.op}`);
    }
  },
  onStateChange(st: string) {
    console.log(`state is now ${st}`);
    updateOnlineStatus(st);
  },
  onRosterChange(kind: string, playerId: number) {
    console.log(`${playerId} ${kind}`);
    updateRoster(ws.getOtherIds().length);
  },
});

setInterval(() => {
  ws.send({ op: 'position', value: p1 }, true);
}, 1000 / fps);

setInterval(() => {
  updatePing(ws.getPing());
}, 2000);
