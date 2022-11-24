import WebSocket from 'ws';

import { competeClient } from 'compete-client';

import { getBoard, indexToPos, T3Board } from './T3Board';

// @ts-ignore
global.WebSocket = WebSocket;

function renderBoard(st: {
  cells: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
}): void {
  const c = st.cells;
  console.log(`${c[0]} ${c[1]} ${c[2]}
${c[3]} ${c[4]} ${c[5]}
${c[6]} ${c[7]} ${c[8]}`);
}

function updateLabel(msg: string) {
  console.log(`update label: ${msg}`);
}

function updateGrid(pos: [number, number], o: { value: string }): void {
  const [x, y] = pos;
  const value = o.value;
  console.log(`update grid: ${x}, ${y}: ${value}`);
}

const st: T3Board = getBoard();
let myId: number;

function play() {
  const x = Math.floor(Math.random() * 3);
  const y = Math.floor(Math.random() * 3);
  ws.send({ op: 'play', position: [x, y] });
}

let timer: NodeJS.Timer;

const ws = competeClient({
  onMessage(msg: any) {
    switch (msg.op) {
      case 'announce':
        updateLabel(msg.message);
        console.warn(msg);
        break;
      case 'bad-move':
        console.warn(msg.message);
        break;
      case 'my-id':
        myId = msg.id;
        console.log(`id:${myId}`);
        break;
      case 'player-left':
        console.warn(`player left: ${msg.id}`);
        break;
      case 'update-state':
        {
          const diffs = msg.state;
          // @ts-ignore
          st.patch(diffs);

          const cellDiffs = diffs.c[0];
          for (const [k, v] of cellDiffs) {
            const [x, y] = indexToPos(+k);
            updateGrid([x, y], { value: v });
          }

          const nextToPlayDiffs = diffs.c[1];
          if (nextToPlayDiffs.length > 0) {
            updateLabel(`next to play is ${st.nextToPlay[0]}`);
          }

          if (cellDiffs.length || nextToPlayDiffs.length) {
            //console.log(JSON.parse(JSON.stringify(st)));
            renderBoard(st);
          }

          if (!timer) {
            timer = setInterval(play, 500);
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
  onRosterChange(kind: string, _playerId: number) {
    if (kind === 'left') process.exit(0);
  },
});
