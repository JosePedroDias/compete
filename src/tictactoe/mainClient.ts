import { uwsClient } from "../generic/uwsClient";

import { grid, label } from "./ui";

const CLEAN_LABEL_MS = 2500;
let cleanTimer:any;

function onClick(position:[number, number]) {
  console.log('onclick', position);
  ws.send({op: 'play', position });
  //updateGrid(position, {value:'X'});
}

const [labelEl, updateLabel_] = label();
document.body.appendChild(labelEl);

function updateLabel(txt:string) {
    if (cleanTimer) {
      clearTimeout(cleanTimer);
      cleanTimer = 0;
    }

    updateLabel_(txt);

    cleanTimer = setTimeout(() => updateLabel_(' '), CLEAN_LABEL_MS);
}

const [gridEl, updateGrid] = grid(3, 3, { onClick });
document.body.appendChild(gridEl);

const boardEl = document.getElementById('board') as HTMLElement;

// updateLabel('batatas');

const ws = uwsClient((msg) => {
  //console.log('message', msg);
});


/* import { Board } from '../generic/Board';
import { grid, label } from "./ui";
import { pack, unpack } from 'msgpackr';

const CLEAN_LABEL_MS = 2500;
let cleanTimer:any;

function onClick(index:number) {
    room.send('play', index);
}

const [labelEl, updateLabel_] = label();
document.body.appendChild(labelEl);

function updateLabel(txt:string) {
    if (cleanTimer) {
        clearTimeout(cleanTimer);
        cleanTimer = undefined;
    }

    updateLabel_(txt);

    cleanTimer = setTimeout(() => updateLabel_(' '), CLEAN_LABEL_MS);
}

const [gridEl, updateGrid] = grid(3, 3, { onClick });
document.body.appendChild(gridEl);


let board: Board<string>;

document.body.addEventListener('keydown', (ev) => {
  const key = ev.key;
  if (key.substring(0, 5) === 'Arrow') {
    const k = key.substring(5).toLowerCase();
    send({ op: 'key', key: k });
    ev.preventDefault();
    ev.stopPropagation();
  }
});

const boardEl = document.getElementById('board') as HTMLElement;

const ws = new WebSocket('ws://127.0.0.1:9001');
ws.binaryType = 'arraybuffer'; // to get an arraybuffer instead of a blob

function send(o: any): void {
  ws.send(pack(o));
}

ws.addEventListener('open', () => {
  console.log('open');
});

ws.addEventListener('close', () => {
  console.log('close');
});

ws.addEventListener('error', (ev) => {
  console.error(ev);
});

ws.addEventListener('message', (ev) => {
  try {
    const data = unpack(new Uint8Array(ev.data));
    switch (data.op) {
      case 'own-id':
        break;
      case 'board-init':
        board = new Board(data.w, data.h, ' ');
        break;
      case 'board-diff':
        board.patch(data.diff);
        (boardEl.firstChild as Text).nodeValue = board.toString();
        break;
      default:
        console.log(`unsupported opcode: ${data.op}!`);
    }
  } catch (ex) {
    console.error('expected msgpack object', ex);
  }
});
 */
