# multiplayer server + auxiliary modules

Borrowed some ideas from [nakama](https://heroiclabs.com/opensource/) (aseptic API, state change as a pure function)
and some from [colyseus](https://www.colyseus.io/) (auxiliary stuff for diffing state, with a different approach).


# Highlights

## group players in rooms

```js
// example roomOpts
{
    maxRooms: 3,   // can server up to 3 simultaneous rooms in this instance
    minPlayers: 2, // min players in a room required for a game to start
    maxPlayers: 5, // max players in a room able to have in a room (TODO: does the game restart if participants number increase? up to a new cb function to decide?)
    tickRate: 2,   // number of times per second the state is recomputed and served back to participant players
}
```

## room API (uwsRoomWrapper)

```js
onGameStart: (room: Room) => St; // computes the initial game state from room state
onGameEnd: (room: Room, st: St) => void; // called once game ends (TODO: not doing much ATM)
onGameTick: (room: Room, events: Event[], st: St) => St; // receives the existing game state and all the events received from players since the last tick and returns a new state
adaptState?: (st: St, id: number) => St; // send a modified state view for each participant player. identity function if omitted.
```

## what's a room?
```js
participants: Set<WebSocket2>(); // set of players that take part in this game
```

## low level API (uwsWrapper)

```js
onJoin?: (ws: WebSocket2) => void;                  // called when player joins the server
onLeave?: (ws: WebSocket2, code: number) => void;   // called when player leaves the server
onMessage?: (ws: WebSocket2, message: any) => void; // receives data from msgpack

// it also exposes additional symbols:
idToWsInstance: Map<number, WebSocket2>(); // allowing us to address any connected client granted we know its id
broadcast(msg: any, ignoreMe?: WebSocket2); // send a message to every connected player (or all but ignoreMe)
```

## what does WebSocket2 expose?

The WebSocket2 class abstracts a client connection
It exposes just these 2:
```js
id:number   // unique id for the running session
send(o:any) // sends data with msgpack
```


# Other goodies

## sync/patch objects and arrays between server and clients

if you wrap an array or object with trackObject, it will make sure attribute changes (either object attributes or array positions) will get tracked
and for arrays the most relevant ops are abstracted too (`push`/`pop`, `shift`/`unshift`, `insertAt`/`removeAt`)

by the time the `.sync()` function is called, all changes since the last sync are given to you to send over the wire and apply with `.patch()`

If one is careful enough to wrap children correctly, this algorithm works well recursively. Take a look at [trackObject.test.ts](src/generic/trackObject.test.ts).

## forget/recover to enforce hidden state

TODO: eventually generalize or just keep as a recipe?

In card games it's very common for players not to be able to know their opposite player hands.
This card abstraction assumes the card is known at server-side and `.forget()` and `.recall()` is used with the optional `adaptState()` game room wrapper method
to temporarily hide the card value of cards you're not supposed to see.

Take a look at [cards.test.ts](src/generic/cards/cards.test.ts).

# Ideas behind this
- don't send players what they should not see/know
- try and keep coherence and loose coupling whenever possible
- abstracting a game properly makes it easier to build a solid multiplayer game

# Eventual TODOs
- other potential games:
    - continuous 2D MP game with fog of war (tanks?)
    - simplest FPS with personalized state
- other potential features:
    - throttle events and errors (spam too much or generate errors -> kicked)
    - expose prometheus metrics?
    - support auth?
    - support agones?
# existing applications/games

The games we have here are just exercises to stress the concepts and API, they're not by any means the important part of this repo.
So far these were started:
- **tictactoe** - simple, slow 2p game will full state visible by everyone. state diff uses `trackObject` object wrapper. See [T3Board's getBoard()](src/tictactoe/T3Board.ts)
- **snake** - faster, 2-n player game with full state visible. (Uses [board](src/generic/Board.ts), the initial hand made approach that I later generalized with `trackObject`) TODO: rewrite?
- **gofish** - 2-n slow player game where state views are personalized. uses `forget()`/`recover()` and `adaptState()`. See [GoFishState's getView()](src/gofish/GoFishState.ts)


# local setup

```
npm install

npm run format
npm run test
```

## dev

```
npm run dev-server-tictactoe
# or
npm run dev-server-snake
# or
npm run dev-server-gofish

npm run dev
```

## build

TODO!
