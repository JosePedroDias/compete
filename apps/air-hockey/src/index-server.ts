import { roomWrapper, Room, Event, WebSocket2 } from 'compete-server';

type Asd = any;

roomWrapper<Asd>({
  wsOpts: {
    maxPayloadLength: 4 * 1024, // bytes?
    idleTimeout: 60, // secs?
  },
  roomOpts: {
    maxRooms: 2,
    minPlayers: 2,
    maxPlayers: 2,
    tickRate: 60,
  },
  onJoin(ws: WebSocket2, room: Room) {
    ws.send({ op: 'my-id', id: ws.id });
    room.broadcast({ op: 'other-id', id: ws.id }, ws);
  },
  onLeave(ws: WebSocket2, room: Room, _code: number) {
    room.broadcast({ op: 'player-left', id: ws.id }, ws);
  },
  onGameStart(_room: Room) {
    console.log('onGameStart');

    const st = {};

    return st;
  },
  onGameEnd(_room: Room, _st: Asd) {
    console.log('onGameEnd');
  },
  onGameTick(_room: Room, _events: Event[], st: Asd) {
    return st;
  },
});
