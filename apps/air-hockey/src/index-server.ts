import { AirHockeyState, GAME_PROTOCOL } from './constants';
import { roomWrapper, Room, Event, HttpRequest } from 'compete-server';
import { V2 } from 'compete-utils';
//import { simulate, SimulateFn, SimulateOutput } from './simulate';
import { simulate /*, SimulateFn, SimulateOutput*/ } from './simulate-plain.js';

const roomSims: Map<Room, any /*SimulateFn*/> = new Map();

roomWrapper<AirHockeyState>({
  gameProtocol: GAME_PROTOCOL,

  // curl 'http://127.0.0.1:9001/metrics' -H 'x-secret: 42'
  validateMetricsRequest(req: HttpRequest): boolean {
    return req.getHeader('x-secret') === '42';
  },

  validateWebsocketRequest(req: HttpRequest): boolean {
    const validOrigins = [
      '', // bot
      'http://localhost:4173', //
      'http://localhost:5173', // dev
      'http://192.168.1.3:4173', //
      'http://192.168.1.3:5173', // dev
      'http://josepedrodias.com:4173',
    ];
    const origin = req.getHeader('origin');
    return validOrigins.includes(origin);
  },

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
