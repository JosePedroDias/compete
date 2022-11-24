// override math functions so different browsers and node all return the same values
// @ts-ignore
import trigfills from 'trigfills';
trigfills.setmaths();
import Matter from 'matter-js';
const { Engine, Bodies, Composite, Events, Body } = Matter;

import {
  tableDims,
  edgeR,
  puckR,
  pusherR,
  goalWidth,
  goalWallWidth,
  fps,
} from './constants';

export function simulate() {
  const scoreboard = [0, 0];

  const engine = Engine.create();
  engine.gravity.y = 0;
  engine.gravity.x = 0;
  //engine.positionIterations = 3; // 6 is default (lower = less precision but more lightweight?)
  //engine.velocityIterations = 2; // 4 is default

  let resetPuck = false;

  function play(sampleName) {
    eventsToSend.push(['play', sampleName]);
  }

  function updateScoreboard(scoreboardValue) {
    eventsToSend.push(['update-scoreboard', scoreboardValue]);
  }

  function setupPhysics() {
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
    const pusher2Bd = Bodies.circle(
      0,
      -0.5 * tableDims[1],
      pusherR,
      optsMoving,
    );
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

  ////

  const p1 = [0, 0.33 * tableDims[1]];
  const p2 = [0, -0.33 * tableDims[1]];
  let eventsToSend = [];

  //let frameNo = 0;
  //const MAX_LENGTH = 60;

  //let inputs: any[] = [];
  //let currentInput: any[] = [];

  //let frames: any[] = [];
  let currentFrame = [];

  function toV2(v) {
    return [v.x, v.y];
  }

  //setInterval(() => {
  //inputs.push(currentInput);
  //currentInput = [];
  //if (inputs.length > MAX_LENGTH) inputs.shift();

  //++frameNo;
  //frames.push(currentFrame);
  //currentFrame = [];
  //if (frames.length > MAX_LENGTH) frames.shift();

  //if (frameNo === 180) debugger;
  //}, 1000 / fps);

  /* function restoreBody(body: Body, backup: any) {
    Body.setAngularVelocity(body, backup.angularVelocity);
    Body.setAngle(body, backup.angle);
    Body.setVelocity(body, { x: backup.velocity[0], y: backup.velocity[1] });
    Body.setPosition(body, { x: backup.position[0], y: backup.position[1] });
    Body.setInertia(body, backup.inertia);
  } */

  /* function restoreBodies() {
    const frame = frames[0];
    restoreBody(puckBd, frame[0]);
    restoreBody(pusher1Bd, frame[1]);
    restoreBody(pusher2Bd, frame[2]);
  } */

  function backupBody(body) {
    /* currentFrame.push({
      position: toV2(body.position),
      angle: body.angle,
      velocity: toV2(body.velocity),
      angularVelocity: body.angularVelocity,
      inertia: body.inertia,
    }); */
    currentFrame.push(toV2(body.position));
  }

  Events.on(engine, 'afterUpdate', () => {
    currentFrame = [];
    backupBody(puckBd);
    backupBody(pusher1Bd);
    backupBody(pusher2Bd);
  });

  const VEL_FACTOR = 0.4;

  Events.on(engine, 'afterUpdate', () => {
    Body.setVelocity(pusher1Bd, {
      x: VEL_FACTOR * (p1[0] - pusher1Bd.position.x),
      y: VEL_FACTOR * (p1[1] - pusher1Bd.position.y),
    });

    Body.setVelocity(pusher2Bd, {
      x: VEL_FACTOR * (p2[0] - pusher2Bd.position.x),
      y: VEL_FACTOR * (p2[1] - pusher2Bd.position.y),
    });

    //currentInput.push(p1);
    //currentInput.push(p2);

    if (resetPuck) {
      Body.setPosition(puckBd, { x: 0, y: 0 });
      Body.setVelocity(puckBd, { x: 0, y: 0 });
      setTimeout(() => play('set_down'), 200);
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
          play('hit');
          break;
        case 'puck_pusher':
        case 'pusher_pusher':
          play('wall');
          break;
        case 'goal_puck':
          {
            const idx = (p.bodyA.label === 'goal' ? p.bodyA : p.bodyB).plugin
              .goalIndex;
            ++scoreboard[idx];
            updateScoreboard(scoreboard);
            play('goal');
            resetPuck = true;
          }
          break;
        case 'goal_pusher':
          break;
        default:
          console.warn(coll);
      }
    }
  });

  return function doStep(input) {
    const [a, b] = input;
    p1[0] = a[0];
    p1[1] = a[1];
    p2[0] = b[0];
    p2[1] = b[1];

    Engine.update(engine, 1000 / fps);

    //console.log(currentFrame);

    const output = {
      positions: currentFrame,
      events: eventsToSend,
    };

    eventsToSend = [];

    return output;
  };
}
