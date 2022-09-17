import { uwsClient } from '../generic/uwsClient';

import { grid, label } from './ui';
import { getBoard, indexToPos, T3Board } from './T3Board';

const CLEAN_LABEL_MS = 2500;
let cleanTimer: any;

function onClick(position: [number, number]) {
  ws.send({ op: 'play', position });
}

const [labelEl, updateLabel_] = label();
document.body.appendChild(labelEl);

function updateLabel(txt: string) {
  if (cleanTimer) {
    clearTimeout(cleanTimer);
    cleanTimer = 0;
  }

  updateLabel_(txt);

  cleanTimer = setTimeout(() => updateLabel_(' '), CLEAN_LABEL_MS);
}

const [gridEl, updateGrid] = grid(3, 3, { onClick });
document.body.appendChild(gridEl);

const st: T3Board = getBoard();

let myId: number;
const ws = uwsClient((msg) => {
  switch (msg.op) {
    case 'announce':
      updateLabel(msg.message);
      console.warn(msg.message);
      break;
    case 'bad-move':
      console.warn(msg.message);
      break;
    case 'my-id':
      myId = msg.id;
      document.title = `id:${myId}`;
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
          console.log(JSON.parse(JSON.stringify(st)));
        }
      }
      break;
    default:
      console.warn(`unsupported opcode: ${msg.op}`);
  }
});
