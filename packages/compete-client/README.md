# compete client

Be sure to visit the [docs](https://josepedrodias.github.io/compete/packages/compete-client/docs/index.html).

The example games you can find under the `apps` folder should help grasp how to design compete games.

Message serialization is done with [msgpackr](https://github.com/kriszyp/msgpackr).
You can use complete clients in nodejs. You just need to expose [ws](https://github.com/websockets/ws)'s WebSocket implementation as `global.WebSocket`, as I've been doing in game bots.


## how to use

```ts
import { competeClient } from 'compete-client';

const ws = competeClient({
  logMessages: true, // will spam your console O:)
  onMessage(msg: any) {
    switch (msg.op) {
      case 'update-state':
        {
          console.log('got state:', msg.state);
        }
        break;
      default:
        console.warn(`unsupported opcode: ${msg.op}`);
    }
  },
  onStateChange(state: string) {
    console.log(`state is now ${state}`);
  },
  onRosterChange() {
    const others = ws.getOtherIds();
    console.log(`additional players in the room: ${others.join(', ')} (total: ${others.length + 1})`);
  }
});

const value = Math.floor( 100 * Math.random() + 1 ); // a number between 1 and 100.
ws.send({ op: 'guess', value });
```
