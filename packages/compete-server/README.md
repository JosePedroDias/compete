# compete server

Be sure to visit the [docs](https://josepedrodias.github.io/compete/packages/compete-server/docs/index.html).


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

## room API (compete)

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

## low level API (wrapper)

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
