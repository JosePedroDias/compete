// override math functions so different browsers and node all return the same values
import trigfills from 'trigfills';
trigfills.setmaths();

import { Application, Container, Sprite, Texture, utils } from 'pixi.js';
import { Engine, Bodies, Composite, Events, Body, Vector } from 'matter-js';
import { Howl, Howler } from 'howler';

import Alea from 'alea';
const rng = Alea();

import { createNoise2D } from 'simplex-noise';
const n2d = createNoise2D(rng);

import { V2 } from 'compete-utils';

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

// matter

const scoreboard = [0, 0];

const W = 1280;
const H = 1024;
const W2 = W / 2;
const H2 = H / 2;

const puckR = 28;
const pusherR = 46;

const tableDims = [234, 381]; // half widths
const goalWidth = 2 * tableDims[0] * 0.39;
const goalWallWidth = (2 * tableDims[0] - goalWidth) / 2;
const edgeR = 50;

const engine = Engine.create();
engine.gravity.y = 0;
engine.gravity.x = 0;
engine.positionIterations = 3; // 6 is default (lower = less precision but more lightweight?)
engine.velocityIterations = 2; // 4 is default

let resetPuck = false;

function setupPhysics(): [Body, Body, Body] {
  const optsWalls = {
    isStatic: true,
  };

  const goalTopBd = Bodies.rectangle(
    0,
    -tableDims[1] - 2 * edgeR,
    goalWidth,
    2 * edgeR,
    optsWalls,
  );
  goalTopBd.label = 'goal';
  goalTopBd.plugin.goalIndex = 0;

  const edgeTopLeftBd = Bodies.rectangle(
    -0.5 * (goalWidth + goalWallWidth),
    -tableDims[1] - edgeR,
    goalWallWidth,
    2 * edgeR,
    optsWalls,
  );
  edgeTopLeftBd.label = 'edge';

  const edgeTopRightBd = Bodies.rectangle(
    0.5 * (goalWidth + goalWallWidth),
    -tableDims[1] - edgeR,
    goalWallWidth,
    2 * edgeR,
    optsWalls,
  );
  edgeTopRightBd.label = 'edge';

  const goalBottomBd = Bodies.rectangle(
    0,
    tableDims[1] + 2 * edgeR,
    goalWidth,
    2 * edgeR,
    optsWalls,
  );
  goalBottomBd.label = 'goal';
  goalBottomBd.plugin.goalIndex = 1;

  const edgeBottomLeftBd = Bodies.rectangle(
    -0.5 * (goalWidth + goalWallWidth),
    tableDims[1] + edgeR,
    goalWallWidth,
    2 * edgeR,
    optsWalls,
  );
  edgeBottomLeftBd.label = 'edge';

  const edgeBottomRightBd = Bodies.rectangle(
    0.5 * (goalWidth + goalWallWidth),
    tableDims[1] + edgeR,
    goalWallWidth,
    2 * edgeR,
    optsWalls,
  );
  edgeBottomRightBd.label = 'edge';

  const edgeLeftBd = Bodies.rectangle(
    -tableDims[0] - edgeR,
    0,
    2 * edgeR,
    2 * tableDims[1],
    optsWalls,
  );
  edgeLeftBd.label = 'edge';

  const edgeRightBd = Bodies.rectangle(
    tableDims[0] + edgeR,
    0,
    2 * edgeR,
    2 * tableDims[1],
    optsWalls,
  );
  edgeRightBd.label = 'edge';

  const optsMoving = {
    friction: 0.001,
    frictionAir: 0.001,
    restitution: 0.9,
    angle: -Math.PI * 0.5,
  };

  const puckBd = Bodies.circle(0, 0, puckR, optsMoving);
  puckBd.label = 'puck';
  const pusher1Bd = Bodies.circle(0, 0.5 * tableDims[1], pusherR, optsMoving);
  pusher1Bd.label = 'pusher';
  const pusher2Bd = Bodies.circle(0, -0.5 * tableDims[1], pusherR, optsMoving);
  pusher2Bd.label = 'pusher';

  Composite.add(engine.world, [
    edgeTopLeftBd,
    goalTopBd,
    edgeTopRightBd,
    edgeBottomLeftBd,
    goalBottomBd,
    edgeBottomRightBd,
    edgeLeftBd,
    edgeRightBd,
    puckBd,
    pusher1Bd,
    pusher2Bd,
  ]);

  return [puckBd, pusher1Bd, pusher2Bd];
}
const [puckBd, pusher1Bd, pusher2Bd] = setupPhysics();

let replaying = false;

let frameNo = 0;
const fps = 60;
const MAX_LENGTH = 60;

let inputs: any[] = [];
let currentInput: any[] = [];

let frames: any[] = [];
let currentFrame: any[] = [];

document.addEventListener('keyup', (ev) => {
  if (ev.key !== 'r') return;
  ev.preventDefault();
  ev.stopPropagation();
  replaying = true;
});

setInterval(() => {
  if (!replaying) {
    inputs.push(currentInput);
    currentInput = [];
    if (inputs.length > MAX_LENGTH) inputs.shift();
  }

  Engine.update(engine, 1000 / fps);
  ++frameNo;
  frames.push(currentFrame);
  currentFrame = [];
  if (frames.length > MAX_LENGTH) frames.shift();

  //if (frameNo === 180) debugger;
}, 1000 / fps);

function toV2(v: Vector): [number, number] {
  return [v.x, v.y];
}

function restoreBody(body: Body, backup: any) {
  Body.setAngularVelocity(body, backup.angularVelocity);
  Body.setAngle(body, backup.angle);
  Body.setVelocity(body, { x: backup.velocity[0], y: backup.velocity[1] });
  Body.setPosition(body, { x: backup.position[0], y: backup.position[1] });
  Body.setInertia(body, backup.inertia);
}

function restoreBodies() {
  const frame = frames[0];
  restoreBody(puckBd, frame[0]);
  restoreBody(pusher1Bd, frame[1]);
  restoreBody(pusher2Bd, frame[2]);
}

function bodyToSprite(body: Body, sprite: Sprite) {
  sprite.position.x = body.position.x;
  sprite.position.y = body.position.y;

  currentFrame.push({
    position: toV2(body.position),
    angle: body.angle,
    velocity: toV2(body.velocity),
    angularVelocity: body.angularVelocity,
    inertia: body.inertia,
  });
}

Events.on(engine, 'afterUpdate', () => {
  bodyToSprite(puckBd, puckSp);
  bodyToSprite(pusher1Bd, pusher1Sp);
  bodyToSprite(pusher2Bd, pusher2Sp);
});

/// pixi

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
let p1: V2 = [0, 0.5 * tableDims[1]];
const p2: V2 = [0, -0.5 * tableDims[1]];

app.stage.on('pointermove', (ev) => {
  const pos = ev.data.global;
  p1 = [pos.x - W2, pos.y - H2];
});

const VEL_FACTOR = 0.4;

Events.on(engine, 'afterUpdate', () => {
  {
    const x = frameNo * 0.025;
    p2[0] = 100 * (n2d(x, 0) - 0.5);
    p2[1] = -0.5 * tableDims[1] + 100 * (n2d(x, 1) - 0.5);
  }

  if (replaying) {
    restoreBodies();
    frames = [];
    inputs = [];
    replaying = false;
  }

  Body.setVelocity(pusher1Bd, {
    x: VEL_FACTOR * (p1[0] - pusher1Sp.position.x),
    y: VEL_FACTOR * (p1[1] - pusher1Sp.position.y),
  });

  Body.setVelocity(pusher2Bd, {
    x: VEL_FACTOR * (p2[0] - pusher2Sp.position.x),
    y: VEL_FACTOR * (p2[1] - pusher2Sp.position.y),
  });

  currentInput.push(p1);
  currentInput.push(p2);

  if (resetPuck) {
    Body.setPosition(puckBd, { x: 0, y: 0 });
    Body.setVelocity(puckBd, { x: 0, y: 0 });
    setTimeout(() => gameSfx.get('set_down')?.play(), 200);
    resetPuck = false;
  }
});

Events.on(engine, 'collisionStart', (ev) => {
  for (const p of ev.pairs) {
    const labels = [p.bodyA.label, p.bodyB.label];
    labels.sort();
    const coll = labels.join('_');
    switch (coll) {
      case 'edge_pusher':
      case 'edge_puck':
        gameSfx.get('hit')?.play();
        break;
      case 'puck_pusher':
      case 'pusher_pusher':
        gameSfx.get('wall')?.play();
        break;
      case 'goal_puck':
        const idx = (p.bodyA.label === 'goal' ? p.bodyA : p.bodyB).plugin.goalIndex;
        ++scoreboard[idx];
        console.log(`scoreboard: ${scoreboard[0]}:${scoreboard[1]}`);
        gameSfx.get('goal')?.play();
        resetPuck = true;
        break;
      case 'goal_pusher':
        break;
      default:
        console.warn(coll);
    }
  }
});
