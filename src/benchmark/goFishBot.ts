import WebSocket from 'ws';
import { uwsClient } from '../generic/uwsClient';
import { Card } from '../generic/cards/cards';
import { GoFishState } from '../gofish/GoFishState';

// @ts-ignore
global.WebSocket = WebSocket;

let st: GoFishState;

let myId: number;

function processCard(c: Card) {
  const cc = new Card(c.id, c.back, c.suit, c.rank);
  cc.owner = c.owner;
  cc.setPosition(c.position[0], c.position[1]);
  cc.setRotation(c.rotation);
  //cc.setFacingDown(c.facingDown);
  return cc;
}

function play() {
  //console.log(st);

  const participantIds = st.hands.map(
    (h:Card[]) => h[0].owner as number
  );

  const otherParticipantIds = participantIds.filter(id => id !== myId);

  const myHandIndex = participantIds.indexOf(myId);

  const myCards = st.hands[myHandIndex];

  //console.log(myCards);
  console.log(myCards.map(c => c.toString()));

  const idx = Math.floor( Math.random() * myCards.length);

  const card = myCards[idx];
  const to = otherParticipantIds[ Math.floor( Math.random() * otherParticipantIds.length) ];

  ws.send({ op: 'ask', card: card.id, to });
}

let timer:NodeJS.Timer;

// @ts-ignore
const ws = uwsClient((msg:any) => {
  switch (msg.op) {
    case 'my-id':
      myId = msg.id;
      console.log(`id:${myId}`);
      break;
    case 'player-left':
      console.warn(`player left: ${msg.id}`);
      break;
    case 'update-state':
      if (!st) {
        //st = msg.state as GoFishState;

        const st0 = msg.state;
        st = {
          stockPile: st0.stockPile.map(processCard),
          hands: st0.hands.map((h:any) => h.map(processCard)),
        };

        if (!timer) {
          timer = setInterval(play, 500);
        }
      } else {
        // TODO
      }
      break;
    default:
      console.warn(`unsupported opcode: ${msg.op}`);
  }
});
