import WebSocket from 'ws';

import { competeClient } from 'compete-client';
import { GoFishState } from './GoFishState';

// @ts-ignore
global.WebSocket = WebSocket;

let st: GoFishState;

function play() {
  const myHand = st.getHand(ws.getId());
  const otherParticipantIds = st.participants.filter((id) => id !== ws.getId());

  console.log(`my hand: ${myHand.map((c) => c.toString()).join(', ')}`);

  const idx = Math.floor(Math.random() * myHand.length);

  const card = myHand[idx];
  const to =
    otherParticipantIds[Math.floor(Math.random() * otherParticipantIds.length)];

  console.log(`asking for ${card.rank}s...`);
  ws.send({ op: 'ask', cardId: card.id, to });
}

const ws = competeClient({
  onMessage(msg: any) {
    //console.log('MSG', msg);
    switch (msg.op) {
      case 'update-state':
        st = new GoFishState(msg.state as GoFishState);
        //console.log('st', st);
        break;
      case 'next-to-play':
        if (msg.id === ws.getId()) {
          setTimeout(play, 2000);
        }
        break;
      case 'ask2':
        {
          const { to, rank } = msg as { to: number; rank: string };
          if (to === ws.getId()) {
            console.log(`I was asked ${rank}s`);
          }
        }
        break;
      default:
        console.warn(`unsupported opcode: ${msg.op}`);
    }
  },
  onStateChange(st: string) {
    if (st === 'closed') process.exit(0);
  },
  onRosterChange(kind: string, _playerId: number) {
    if (kind === 'left') process.exit(0);
  },
});
