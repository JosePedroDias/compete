import { Board } from '../generic/Board';
import { pack, unpack } from 'msgpackr';

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
