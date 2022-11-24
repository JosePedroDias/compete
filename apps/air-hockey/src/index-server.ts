import { AirHockeyState } from './constants';
import { roomWrapper, Room, Event, WebSocket2 } from 'compete-server';
import { V2 } from 'compete-utils';
//import { simulate, SimulateFn, SimulateOutput } from './simulate';
import { simulate /*, SimulateFn, SimulateOutput*/ } from './simulate-plain.js';

const roomSims: Map<Room, any /*SimulateFn*/> = new Map();

roomWrapper<AirHockeyState>({
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
  onGameStart(room: Room) {
    console.log('onGameStart');

    roomSims.set(room, simulate());

    return {
      signs: room.participants.map((w) => w.id) as [number, number],
      inputs: [
        [0, 0],
        [0, 0],
      ],
      positions: [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      scoreboard: [0, 0],
      sfxToPlay: [],
    };
  },
  onGameEnd(room: Room, _st: AirHockeyState) {
    console.log('onGameEnd');
    roomSims.delete(room);
  },
  onGameTick(room: Room, _events: Event[], st: AirHockeyState) {
    for (const { data, from } of _events) {
      switch (data.op) {
        case 'position':
          {
            const idx = room.participants.indexOf(from);
            const pos: V2 = data.value;
            st.inputs[idx] = pos;
          }
          break;
        default:
          console.log(`ignored unsupported opcode: ${data.op}`);
      }
    }

    const doStep = roomSims.get(room);

    if (!doStep) {
      console.log('could not retrieve simulation?');
      return st;
    }

    st.sfxToPlay = [];
    const { positions, events } = doStep(st.inputs);
    if (positions.length === 3) {
      st.positions = positions;
    }
    for (const [kind, value] of events) {
      if (kind === 'play') {
        st.sfxToPlay.push(value);
      } else if (kind === 'update-scoreboard') {
        st.scoreboard = value;
      }
    }

    return st;
  },
});
