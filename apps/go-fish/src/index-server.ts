import { roomWrapper, Room, Event, WebSocket2 } from 'compete-server';
import { GoFishState } from './GoFishState';

roomWrapper<GoFishState>({
  wsOpts: {
    maxPayloadLength: 4 * 1024, // bytes?
    idleTimeout: 60, // secs?
  },
  roomOpts: {
    maxRooms: 4,
    minPlayers: 2,
    maxPlayers: 5,
    tickRate: 1,
  },
  onJoin(ws: WebSocket2, room: Room) {
    ws.send({ op: 'my-id', id: ws.id });
    room.broadcast({ op: 'other-id', id: ws.id }, ws);
  },
  onLeave(ws: WebSocket2, room: Room, _code: number) {
    room.broadcast({ op: 'player-left', id: ws.id }, ws);
  },
  adaptState(st: GoFishState, id: number) {
    return st.getView(id);
  },
  onGameStart(room: Room) {
    console.log('onGameStart');

    const st = new GoFishState(room.participants.map((ws) => ws.id));

    setTimeout(() => {
      console.log(`next to play is ${st.nextToPlay[0]}`);
      room.broadcast({ op: 'next-to-play', id: st.nextToPlay[0] });
    }, 2000);

    //console.log(st);

    //st.nextToPlay.push(participants[0]);
    //st.nextToPlay.push(participants[1]);

    return st;
  },
  onGameEnd(_room: Room, _st: GoFishState) {
    console.log('onGameEnd');
  },
  onGameTick(room: Room, events: Event[], st: GoFishState) {
    let expectingId = st.nextToPlay[0];
    for (const { data, from } of events) {
      if (from.id !== expectingId) {
        console.log(`ignoring request from ${from.id}`);
      } else {
        console.log(from.id, data);
        switch (data.op) {
          case 'ask':
            {
              const { cardId, to } = data as { cardId: string; to: number };
              const card = st.getHandCard(from.id, cardId);
              if (card) {
                room.broadcast({ op: 'ask2', to, rank: card.rank });
                expectingId = -1; // to prevent multiple calls
              }
            }
            break;
          default:
            console.log('ignored unsupported opcode: ', data.op);
        }

        if (expectingId === -1) {
          st.nextPlayer();
          console.log(`next to play is ${st.nextToPlay[0]}`);
          room.broadcast({ op: 'next-to-play', id: st.nextToPlay[0] });
        }
      }
    }
    return st;
  },
});
