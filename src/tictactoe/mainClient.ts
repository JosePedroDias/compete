import { uwsClient } from '../generic/uwsClient';

import { grid, label } from './ui';
import { Board } from '../generic/Board';

const CLEAN_LABEL_MS = 2500;
let cleanTimer: any;

const boardEl = document.getElementById('board') as HTMLElement;

function onClick(position: [number, number]) {
  ws.send({ op: 'play', position });
  //updateGrid(position, { value: 'X' });
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

//const st = trackObject(new TicTacToeState());
const st = new Board<number>(3, 3, 0);

const ws = uwsClient((msg) => {
  if (msg.op === 'update-state') {
    const diffs = msg.state;
    // @ts-ignore
    st.patch(diffs);
    console.log(st);
  }
});
