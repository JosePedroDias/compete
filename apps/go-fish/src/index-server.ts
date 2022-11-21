import { compete, Room, Event } from 'compete-server';
import { getBasicSetup, getView } from './GoFishState';

const { /*idToWsInstance,*/ broadcast } = compete<any>({
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
  onJoin(ws) {
    ws.send({ op: 'my-id', id: ws.id });
    broadcast({ op: 'other-id', id: ws.id }, ws as any);
  },
  onLeave(ws) {
    broadcast({ op: 'player-left', id: ws.id }, ws as any);
  },
  adaptState(st, id) {
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
  onGameEnd(_room: Room, _st) {
    console.log('onGameEnd');
  },
  onGameTick(_room: Room, events: Event[], st) {
    for (const { data, from } of events) {
      console.log(from, data);
    }
    return st;
  },
});
