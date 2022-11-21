//import { compete, WebSocket2 } from 'compete-server/dist/index';
import { wrapper, WebSocket2 } from 'compete-server/dist/competeWrapper';
import { Board } from 'compete-utils/dist/Board';
import { Snake, CHAR_EMPTY, CHAR_FOOD, CHAR_OBSTACLE } from './Snake';

const W = 80;
const H = 36;

const TICK_RATE_MS = 1000 / 10; // 10 times/second

const ADD_FOOD_EVERY_N_TICKS = 30;
const ADD_OBSTACLE_EVERY_N_TICKS = 120;

let ticksLeftForFood = ADD_FOOD_EVERY_N_TICKS;
let ticksLeftForObstacle = ADD_OBSTACLE_EVERY_N_TICKS;

const board = new Board(W, H, CHAR_EMPTY); // REFERENCE FOR NEW CLIENTS

let snakes = new Map(); // id -> snake

function addSnake(id: number): void {
  const snake = new Snake(board, () => {
    broadcast({ op: 'game-over' });
    setTimeout(reset, 1000);
  });

  snakes.set(id, snake);
}

function removeSnake(id: number): void {
  const snake = snakes.get(id);

  for (const [x, y] of snake.ps) {
    board.setCell(x, y, CHAR_EMPTY);
  }

  snakes.delete(id);
}

function reset() {
  snakes = new Map();
  board.fill(CHAR_EMPTY);
  for (const id of idToWsInstance.keys()) addSnake(id);
}

function onTick() {
  --ticksLeftForFood;
  if (ticksLeftForFood === 0) {
    const [x, y] = board.getRandomCellWithValue(CHAR_EMPTY);
    board.setCell(x, y, CHAR_FOOD);
    ticksLeftForFood = ADD_FOOD_EVERY_N_TICKS;
  }

  --ticksLeftForObstacle;
  if (ticksLeftForObstacle === 0) {
    const [x, y] = board.getRandomCellWithValue(CHAR_EMPTY);
    board.setCell(x, y, CHAR_OBSTACLE);
    ticksLeftForObstacle = ADD_OBSTACLE_EVERY_N_TICKS;
  }

  for (const snake of snakes.values()) snake.move();

  const diff = board.sync();

  if (diff.length > 0) {
    broadcast({ op: 'board-diff', diff });
  }
}

setInterval(onTick, TICK_RATE_MS);

const { idToWsInstance, broadcast } = wrapper({
  wsOpts: {
    maxPayloadLength: 4 * 1024, // bytes?
    idleTimeout: 60, // secs?
  },
  /* roomOpts: {
    maxRooms: 1,
    minPlayers: 2,
    maxPlayers: 5,
    tickRate: 2,
  }, */
  onJoin(ws: WebSocket2) {
    ws.send({ op: 'own-id', id: ws.id });
    ws.send({ op: 'board-init', w: W, h: H });
    reset();
  },
  // @ts-ignore
  onMessage(ws: WebSocket2, data) {
    switch (data.op) {
      case 'key':
        {
          const snake = snakes.get(ws.id);
          snake.dir = data.key;
        }
        break;
      default:
        console.log(`unsupported opcode: ${data.op}`);
    }
  },
  onLeave(ws: WebSocket2, _code: any) {
    removeSnake(ws.id);
  },
});

reset();
