import { Room, Event, roomWrapper } from '../generic/uwsRoomWrapper';
import { TicTacToeState } from "./TicTacToeState";

/* const playersMap:{[key: string]: WebSocket2} = {};
const orderOfPlay:string[] = [];
const initialOrderOfPlay:string[] = [];

function getNextToPlay():string {
  const next = orderOfPlay.shift();
  // @ts-ignore
  orderOfPlay.push(next);
  // @ts-ignore
  return next;
}

function getValueFromId(id:string):number {
  const idx = initialOrderOfPlay.indexOf(id);
  if (idx === -1) {
    throw new Error('Unexpected id');
  }
  return idx + 1;
} */

roomWrapper<TicTacToeState>({
  wsOpts: {
    maxPayloadLength: 4 * 1024, // bytes?
    idleTimeout: 60, // secs?
  },
  roomOpts: {
    maxRooms: 4,
    minPlayers: 2,
    maxPlayers: 2,
    tickRate: 2
  },
  onGameStart(_room:Room) {
    console.log('onGameStart');
    return new TicTacToeState();
  },
  onGameEnd(_room:Room, st:TicTacToeState) {
    console.log('onGameEnd');
    return st;
  },
  onGameTick(_room:Room, events:Event[], st:TicTacToeState) {
    console.log('onGameTick', events.length);
    return st;
  },
});
