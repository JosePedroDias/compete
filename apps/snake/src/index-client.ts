import { competeClient } from 'compete-client/dist/index';
import { Board } from 'compete-utils/dist/Board';

let board: Board<string>;

document.body.addEventListener('keydown', (ev) => {
  const key = ev.key;
  if (key.substring(0, 5) === 'Arrow') {
    const k = key.substring(5).toLowerCase();
    ws.send({ op: 'key', key: k });
    ev.preventDefault();
    ev.stopPropagation();
  }
});

const boardEl = document.getElementById('board') as HTMLElement;

const ws = competeClient((msg) => {
  switch (msg.op) {
    case 'own-id':
      break;
    case 'board-init':
      board = new Board(msg.w, msg.h, ' ');
      break;
    case 'board-diff':
      board.patch(msg.diff);
      (boardEl.firstChild as Text).nodeValue = board.toString();
      break;
    default:
      console.log(`unsupported opcode: ${msg.op}!`);
  }
});
