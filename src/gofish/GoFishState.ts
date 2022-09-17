import {
  cardHeuristicFactory,
  getDeck,
  shuffle,
  dealCards,
  Card,
} from '../generic/cards/cards';

const W2 = 1280 / 2;
const H2 = 1024 / 2; // TODO SQUARE?

export type GoFishState = {
  stockPile: Card[];
  hands: Card[][];
};

export function getBasicSetup(participants: number[]): GoFishState {
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

  return { stockPile: deck, hands };
}

export function getView({ stockPile, hands }: GoFishState, id: number) {
  function processCard(c: Card) {
    if (c.rank && c.owner && c.owner !== id) c.forget();
    if (!c.rank && (!c.owner || c.owner === id)) c.recover();
  }

  for (const c of stockPile) processCard(c);
  for (const h of hands) {
    for (const c of h) processCard(c);
  }
}
