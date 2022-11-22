import { roomWrapper, Room, Event, WebSocket2 } from 'compete-server';
import { getBasicSetup, getView, GoFishState } from './GoFishState';

roomWrapper<GoFishState>({
  wsOpts: {
    maxPayloadLength: 4 * 1024, // bytes?
    idleTimeout: 60, // secs?
  },
  roomOpts: {
    maxRooms: 1,
    minPlayers: 2,
    maxPlayers: 5,
    tickRate: 2,
  },
  onJoin(ws: WebSocket2, room: Room) {
    ws.send({ op: 'my-id', id: ws.id });
    room.broadcast({ op: 'other-id', id: ws.id }, ws);
  },
  onLeave(ws: WebSocket2, room: Room, _code: number) {
    room.broadcast({ op: 'player-left', id: ws.id }, ws);
  },
  adaptState(st: GoFishState, id: number) {
    getView(st, id);
    return st;
  },
  onGameStart(room: Room) {
    console.log('onGameStart');

    const participants: number[] = Array.from(room.participants).map(
      (ws) => ws.id,
    );

    const st = getBasicSetup(participants);

    //console.log(st);

    //st.nextToPlay.push(participants[0]);
    //st.nextToPlay.push(participants[1]);

    return st;
  },
  onGameEnd(_room: Room, _st: GoFishState) {
    console.log('onGameEnd');
  },
  onGameTick(_room: Room, events: Event[], st: GoFishState) {
    for (const { data, from } of events) {
      console.log(from, data);
    }
    return st;
  },
});
