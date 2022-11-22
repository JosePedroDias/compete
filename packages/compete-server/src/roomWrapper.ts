import { wrapper, WebSocket2, WrapperObj } from './wrapper';
export type { WebSocket2 } from './wrapper';

/**
 * Defines the room options
 */
export type RoomOpts = {
  /**
   * minimum players allowed in a room on a running game round
   */
  minPlayers: number;
  /**
   * maximum players allowed in a room
   */
  maxPlayers: number;
  /**
   * maximum number of rooms the game server allows to exist at the same time
   */
  maxRooms: number;
  /**
   * number of times the tick function is called per second
   */
  tickRate: number; // fps
};

/**
 * The set of options the room wrapper expects
 */
export type RoomWrapperObj<St> = Omit<
  WrapperObj,
  'onJoin' | 'onMessage' | 'onLeave'
> & {
  roomOpts: RoomOpts;
  onJoin?: (ws: WebSocket2) => void;
  //onMessage?: (ws: WebSocket2, message: any) => void;
  onLeave?: (ws: WebSocket2, code: number) => void;
  /**
   * called when a game start
   */
  onGameStart: (room: Room) => St;
  /**
   * called on every tick
   * receives all inbound events which took place since last tick
   */
  onGameTick: (room: Room, events: Event[], st: St) => St;
  /**
   * called when a game ends
   */
  onGameEnd: (room: Room, st: St) => void;
  /**
   * allows to taylor the state to each player
   */
  adaptState?: (st: St, id: number) => St;
};

/**
 * A room holds a set of participants, the attribute whether the round has started and an auxiliary timer
 */
export class Room {
  participants = new Set<WebSocket2>();
  hasStarted = false; // internal usage only
  timer?: NodeJS.Timer; // internal usage only
}

/**
 * An event in the record of an inbound message which hasn't yet been processed (they are before each tick)
 */
export type Event = {
  ts: number;
  from: number;
  data: any;
};

const rooms: Room[] = [];
const idToRoom = new Map<number, Room>();

/**
 * Adds additional features besides basic wrapper
 * Clusters players in groups,
 * Fires gameStart and gameEnd according to criteria
 * Runs onTick according to the tick rate
 * Uses adapt state if it is defiend
 *
 * @param roomWrapperOptions
 */
export function roomWrapper<St>({
  port = 9001,
  appOpts = {},
  wsOpts = {},
  roomOpts = { maxRooms: 1, minPlayers: 1, maxPlayers: 16, tickRate: 10 },
  onJoin = () => {},
  //onMessage = () => {},
  onLeave = () => {},
  onGameStart,
  onGameTick,
  onGameEnd,
  adaptState = (st, _id) => st,
}: RoomWrapperObj<St>) {
  const gameStates = new Map<Room, St>();
  const gameEvents = new Map<Room, Event[]>();

  function getRoom(ws: WebSocket2): Room | undefined {
    console.log('getRoom', ws.id);
    let room = rooms.find(
      (room) =>
        !room.hasStarted && room.participants.size < roomOpts.maxPlayers,
    );
    if (!room) {
      if (rooms.length >= roomOpts.maxRooms) {
        return undefined;
      }
      console.log('  creating new room');
      room = new Room();
      rooms.push(room);
    } else {
      console.log('  reusing room');
    }

    room.participants.add(ws);
    idToRoom.set(ws.id, room);

    if (room.participants.size >= roomOpts.minPlayers) {
      room.hasStarted = true;
      let st: St = onGameStart(room);
      const events: Event[] = [];
      gameStates.set(room, st);
      gameEvents.set(room, events);

      room.timer = setInterval(() => {
        const r = room as Room;
        st = onGameTick(r, events, st);
        events.splice(0, events.length);
        gameStates.set(r, st);

        if (room && room.participants.size > 0) {
          // @ts-ignore
          if (st.sync) {
            // @ts-ignore
            const sync = st.sync();
            for (const ws of room.participants) {
              ws.send({ op: 'update-state', state: sync });
            }
          } else {
            for (const ws of room.participants) {
              ws.send({ op: 'update-state', state: adaptState(st, ws.id) });
            }
          }
        }
      }, 1000 / roomOpts.tickRate);
    }

    return room;
  }

  function leaveRoom(ws: WebSocket2): Room | undefined {
    console.log('leaveRoom', ws.id);
    const room = idToRoom.get(ws.id);
    if (!room) return undefined;

    room.participants.delete(ws);
    idToRoom.delete(ws.id);

    if (room.hasStarted && room.participants.size < roomOpts.minPlayers) {
      //rooms.splice(rooms.indexOf(room), 1);
      clearInterval(room.timer);
      const st: St = gameStates.get(room) as St;
      room.hasStarted = false;
      onGameEnd(room, st);
    }

    if (room.participants.size === 0) {
      console.log('  deleting room');
      rooms.splice(rooms.indexOf(room), 1);
    }

    return room;
  }

  return wrapper({
    port,
    appOpts,
    wsOpts,
    onJoin(ws) {
      if (!getRoom(ws)) {
        throw new Error(
          `Server has no capability of spawning more than ${roomOpts.maxRooms} rooms!`,
        );
      }
      onJoin(ws);
    },
    onLeave(ws, code) {
      leaveRoom(ws);
      onLeave(ws, code);
    },
    onMessage(ws, message) {
      const room = idToRoom.get(ws.id);
      if (!room || !room.hasStarted) {
        console.log('ignoring message', message);
      } else {
        const events = gameEvents.get(room) as Event[];
        events.push({ from: ws.id, ts: Date.now(), data: message });
      }
    },
  });
}
