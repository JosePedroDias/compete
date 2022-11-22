import { roomWrapper, Room, Event, WebSocket2 } from 'compete-server';

import { T3Board, getBoard } from './T3Board';

roomWrapper<T3Board>({
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
  onJoin(ws: WebSocket2, room: Room) {
    ws.send({ op: 'my-id', id: ws.id });
    room.roomBroadcast({ op: 'other-id', id: ws.id }, ws);
  },
  onLeave(ws: WebSocket2, room: Room) {
    room.roomBroadcast({ op: 'player-left', id: ws.id }, ws);
  },
  onGameStart(room: Room): T3Board {
    console.log('onGameStart');
    const st = getBoard();
    const participants: number[] = Array.from(room.participants).map(
      (ws) => ws.id,
    );
    st.nextToPlay.push(participants[0]);
    st.nextToPlay.push(participants[1]);
    return st;
  },
  onGameEnd(_room: Room, _st: T3Board) {
    console.log('onGameEnd');
  },
  onGameTick(room: Room, events: Event[], st: T3Board): T3Board {
    const nextId = st.nextToPlay[0];
    for (const {
      from,
      ts,
      data: { position },
    } of events) {
      console.log(from, ts, position);
      const [x, y] = position;

      const ws2 = room.wsFromId(from);

      if (from !== nextId) {
        const message = 'ignoring move (not your turn)';
        ws2?.send({ op: 'bad-move', message });
        console.log(message);
      } else if (st.getCell(x, y) !== 0) {
        const message = 'ignoring move (cell is not empty)';
        ws2?.send({ op: 'bad-move', message });
        console.log(message);
      } else {
        st.setCell(x, y, from);
        const e = st.nextToPlay.shift() as number;
        st.nextToPlay.push(e);

        if (st.hasWon(nextId)) {
          const message = `${nextId} won!`;
          room.roomBroadcast({ op: 'announce', message });
          console.log(message);
          st.whoWon = nextId;
          setTimeout(() => {
            room.hasStarted = false;
            // TODO call onGameEnd
          }, 50);
        } else if (st.isFull()) {
          const message = `board is full!`;
          room.roomBroadcast({ op: 'announce', message });
          console.log(message);
          setTimeout(() => {
            room.hasStarted = false;
            // TODO call onGameEnd
          }, 50);
        }
      }
    }
    return st;
  },
});
