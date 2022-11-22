import {
  Card,
  getDeck,
  dealCards,
  shuffle,
  cardHeuristicFactory,
} from 'compete-utils';

const W2 = 1280 / 2;
const H2 = 1024 / 2; // TODO SQUARE?

function cardify(c: Card): Card {
  return new Card(c);
}

export class GoFishState {
  stockPile: Card[];
  hands: Card[][];
  participants: number[];
  nextToPlay: number[];

  constructor(arg: number[] | GoFishState) {
    if ((arg as any).stockPile) {
      const other = arg as GoFishState;
      this.stockPile = other.stockPile.map(cardify);
      this.hands = other.hands.map((h) => h.map(cardify));
      this.participants = Array.from(other.participants);
      this.nextToPlay = Array.from(other.nextToPlay);
    } else {
      const participants = arg as number[];
      const numPlayers = participants.length;
      const cardsPerPlayer = numPlayers < 4 ? 7 : 5;

      const deck = getDeck(false, undefined, 0);
      shuffle(deck, true);

      const hands = dealCards(
        deck,
        [W2, H2],
        cardsPerPlayer,
        numPlayers,
        cardHeuristicFactory(false),
      );

      for (const [i, hand] of Object.entries(hands)) {
        const owner = participants[+i];
        for (const c of hand) {
          c.owner = owner;
        }
      }

      this.stockPile = deck;
      this.hands = hands;
      this.participants = Array.from(participants);
      this.nextToPlay = Array.from(participants);
    }
  }

  clone(): GoFishState {
    return new GoFishState(this);
  }

  getHand(playerId: number): Card[] {
    const idx = this.participants.indexOf(playerId);
    return this.hands[idx];
  }

  getHandCard(playerId: number, cardId: string): Card | undefined {
    const hand = this.getHand(playerId);
    return hand.find((c) => c.id === cardId);
  }

  nextPlayer() {
    const id = this.nextToPlay.shift();
    id && this.nextToPlay.push(id);
  }

  getView(playerId: number): GoFishState {
    const view = this.clone();

    function processCard(c: Card) {
      if (c.rank && c.owner && c.owner !== playerId) c.forget();
      if (!c.rank && (!c.owner || c.owner === playerId)) c.recall();
    }

    for (const c of view.stockPile) processCard(c);
    for (const h of view.hands) {
      for (const c of h) processCard(c);
    }

    return view;
  }
}
