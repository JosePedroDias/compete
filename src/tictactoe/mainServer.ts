import { Board } from '../generic/Board';
import { Room, Event, roomWrapper } from '../generic/uwsRoomWrapper';

type B = Board<number>;

roomWrapper<B>({
  wsOpts: {
    maxPayloadLength: 4 * 1024, // bytes?
    idleTimeout: 60, // secs?
  },
  roomOpts: {
    maxRooms: 4,
    minPlayers: 2,
    maxPlayers: 2,
    tickRate: 2,
  },
  onGameStart(_room: Room):B {
    console.log('onGameStart');
    // @ts-ignore
    return new Board<number>(3, 3, 0);
  },
  onGameEnd(_room: Room, _st:B) {
    console.log('onGameEnd');
  },
  onGameTick(_room: Room, events: Event[], st:B):B {
    for (const { from, ts, data: { position } } of events) {
      console.log(from, ts, position);
      st.setCell(position[0], position[1], from);
    }
    return st;
  }
});
