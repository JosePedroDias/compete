import { wrapper, WebSocket2, WrapperObj } from './uwsWrapper';
export type { WebSocket2 } from './uwsWrapper';

export type RoomOpts = {
  minPlayers: number;
  maxPlayers: number;
  maxRooms: number;
  tickRate: number; // fps
};

export type RoomWrapperObj<St> = Omit<
  WrapperObj,
  'onOpen' | 'onMessage' | 'onClose'
> & {
  roomOpts: RoomOpts;
  onOpen?: (ws: WebSocket2) => void;
  //onMessage?: (ws: WebSocket2, message: any) => void;
  onClose?: (ws: WebSocket2, code: number) => void;
  onGameStart: (room: Room) => St;
  onGameTick: (room: Room, events: Event[], st: St) => St;
  onGameEnd: (room: Room, st: St) => void;
};

export class Room {
  hasStarted = false;
  participants = new Set<WebSocket2>();
  timer?: NodeJS.Timer;
}

export type Event = {
  ts: number;
  from: number;
  data: any;
};

const rooms: Room[] = [];
const idToRoom = new Map<number, Room>();

export function roomWrapper<St>({
  port = 9001,
  appOpts = {},
  wsOpts = {},
  roomOpts = { maxRooms: 1, minPlayers: 1, maxPlayers: 16, tickRate: 10 },
  onOpen = () => {},
  onClose = () => {},
  //onMessage = () => {},
  onGameStart,
  onGameTick,
  onGameEnd,
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
          const sync = st.sync();
          for (const ws of room.participants) {
            ws.send({ op: 'update-state', state: sync });
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
    onOpen(ws) {
      if (!getRoom(ws)) {
        throw new Error(
          `Server has no capability of spawning more than ${roomOpts.maxRooms} rooms!`,
        );
      }
      onOpen(ws);
    },
    onClose(ws, code) {
      leaveRoom(ws);
      onClose(ws, code);
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
