import {
  cardHeuristicFactory,
  getDeck,
  shuffle,
  dealCards,
  Card,
} from '../generic/cards/cards';
import { TO, trackObject } from '../generic/trackObject';

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
      c.owner = '' + owner;
    }
  }

  return { stockPile: deck, hands };
}

export type GFSTO = TO<GoFishState>;

export function trackState({ stockPile, hands }: GoFishState): GFSTO {
  function trackPile(cards: Card[]) {
    const cards2 = cards.map((c) => trackObject(c));
    return trackObject(cards2);
  }

  const stockPile2 = trackPile(stockPile);

  const hands2 = hands.map(trackPile);

  return trackObject({
    stockPile: stockPile2,
    hands: trackObject(hands2),
  });
}
