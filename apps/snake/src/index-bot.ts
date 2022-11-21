import WebSocket from 'ws';
import { competeClient } from 'compete-client/dist';
import { Board } from 'compete-utils/dist/Board';

// @ts-ignore
global.WebSocket = WebSocket;

let board: Board<string>;

let myId: number;

const KEYS = ['up', 'down', 'left', 'right'];

function play() {
  const keyIdx = Math.floor(Math.random() * 4);
  const key = KEYS[keyIdx];
  ws.send({ op: 'key', key });
}

let timer: NodeJS.Timer;

const ws = competeClient((msg: any) => {
  switch (msg.op) {
    case 'own-id':
      myId = msg.id;
      console.log(`id:${myId}`);
      break;
    case 'game-over':
      break;
    case 'board-init':
      board = new Board(msg.w, msg.h, ' ');
      if (!timer) {
        timer = setInterval(play, 500);
      }
      break;
    case 'board-diff':
      board.patch(msg.diff);
      console.log(board.toString());
      break;
    default:
      console.warn(`unsupported opcode: ${msg.op}`);
  }
});
