# compete server

Be sure to visit the [docs](https://josepedrodias.github.io/compete/packages/compete-server/docs/index.html).

The example games you can find under the `apps` folder should help grasp how to design compete games.

This package drives an http/ws server in nodejs which uses and serializes messages using message pack.
The server is based on [uWebSockets.js](https://github.com/uNetworking/uWebSockets.js/).
Message serialization is done with [msgpackr](https://github.com/kriszyp/msgpackr).

## how to use

Example guess game. This design is over-engineered as we don't need tick rate and batching events processing for a guess game. 😅
Also not competitive. See actual example games for better examples. 🙏

```ts
import { roomWrapper } from 'compete-server';

export type GuessState = {
  target: number;
  numberOfGuesses: number;
  numberOfWins: number;
  feedback: string[];
};

function intBetween1And100() {
  return Math.floor( 100 * Math.random() + 1 );
}

// if you manage to define a type for your state, set it as the roomWrapper parameter
roomWrapper<any>({
  roomOpts: {
    maxRooms: 3, // server only caters for up to 3 rooms at the same time
    minPlayers: 2, // a game needs exactly 2 players
    maxPlayers: 2,
    tickRate: 2 // will process ticks twice per second
  },
  onGameStart(_room: Room) {
    console.log('onGameStart');
    return {
      target: intBetween1And100(),
      numberOfGuesses: 0,
      numberOfWins: 0,
      feedback: []
    }
  },
  onGameEnd(_room: Room, _st: any) {
    console.log('onGameEnd');
  },
  // notice that state updates only start happening once a game starts.
  // the server can configure that to be at 1 player but most require 2 or more.
  onGameTick(room: Room, _events: Event[], st: any) {
    console.log('onGameTick');
    for (const { data, from } of _events) {
      switch (data.op) {
        case 'guess':
          {
            const v = data.value;
            ++st.numberOfGuesses;
            let fb;
            if (v < st.target) { fb = `${v} is too low`; }
            else if (v > st.target) { fb = `${v} is too high`; }
            else {
              ++st.numberOfWins;
              st.target = intBetween1And100();
            }
            st.feedback.push(fb);
          }
          break;
        default:
          console.log(`ignored unsupported opcode: ${data.op}`);
      }
    }

    return st;
  },
  adaptState(st:any) {
    return {
      numberOfGuesses: st.numberOfGuesses;
      feedback: st.feedback;
    };
  }
});
```

TODO: explain purpose of events array - bulk process, potential place for throttling clients

## core opcodes

### ping

server -> client

```ts
{ op: 'ping', serverNow: number }
// serverNow - epoch milliseconds of when the server fired the ping message
```

Sent from core `wrapper`, so available whether game uses `roomWrapper` or `wrapper`.  
Is auto-managed by the client, which exposes ping stats as the result of `ws.getPing()`.  
Client automatically responds with pong so the server can calculate RTT on his side too.

### pong

client -> server

```ts
{ op: 'pong', serverNow: number, clientNow: number }
// serverNow - epoch milliseconds of when the server fired the ping message
// clientNow - epoch milliseconds of when the client fired the pong message as result of having received a ping
```

Sent from core `wrapper`, so available whether game uses `roomWrapper` or `wrapper`.  
Is auto-managed by the client, which exposes ping stats as the result of `ws.getPing()`.  
Client automatically responds with pong so the server can calculate RTT on his side too.

### my-id

server -> client

```ts
{ op: 'my-id', id: number }
// id - the unique id this player has in the server
```

Only sent if `roomWrapper` is used.  
Is auto-managed by the client, which exposes its value in `ws.getMyId()`.

### other-id-joined

server -> client

```ts
{ op: 'other-id-joined', id: number }
// id - the unique id the other player has in the server
```

Only sent if `roomWrapper` is used.  
Is auto-managed by the client, which exposes other players in the room as the result of `ws.getOtherIds()`.

### other-id-left

server -> client

```ts
{ op: 'other-id-left', id: number }
// id - the unique id the other player has in the server
```

Only sent if `roomWrapper` is used.  
Is auto-managed by the client, which exposes other players in the room as the result of `ws.getOtherIds()`.

### update-state

server -> client

```ts
{ op: 'update-state', state: any }
// state - the state view the client gets from the server after every tick from a room server as long as a game is taking place
```

Only sent if `roomWrapper` is used.  
It is NOT auto-managed - it's up to game logic to handle state updates.  
If the roomWrapper has `adaptState` an function, clients receive dedicated views, otherwise all players get the same shared state
### error-server-full

server -> client

```ts
{ op: 'error-server-full', text: string }
// text - the human readable error message from the server
```

Only sent if `roomWrapper` is used.  
Will happen at connection stage if server is out of rooms.  
Client will leave the connection if this happens.
