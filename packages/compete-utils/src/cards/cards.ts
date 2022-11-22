/**
 * This module focuses on abstract representation of cards and operations on them
 */

import { v4 as uuid } from 'uuid';
import { fromPolar } from '../geometry';

const DEG_TO_RAD = Math.PI / 180; // no pixi dependency please

/**
 * Represents a suit of cards
 */
export enum Suit {
  Diamonds = 'D', // red
  Spades = 'S', // black
  Hearts = 'H', // red
  Clubs = 'C', // black
}

/**
 * Represents a rank of cards
 */
export enum Rank {
  Ace = 'A',
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = 'T',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Joker = 'R',
}

/**
 * Represents all the possible back designs cards can have
 */
export enum Back {
  Blue = 'B1',
  Red = 'B2',
}

/**
 * The abstract definition of a playing card
 *
 * We use the recall/forget feature to allow the server to keep the full card info but manage which players can know it and which can be oblivious of this face value
 * The constructor holds a context where those attributes can be temporarily stored, so that public serialization prevents them from being broadcasted
 */
export class Card {
  suit?: Suit;
  rank?: Rank;
  back: Back;
  id: string;
  owner?: number;
  facingDown = false;
  position: [number, number] = [0, 0];
  rotation = 0;
  onUpdate: () => void = () => {};
  onDispose: () => void = () => {};

  constructor(id = '', back: Back = Back.Blue, suit?: Suit, rank?: Rank) {
    this.id = id ? id : uuid();
    this.back = back;

    if (suit) {
      this.suit = suit;
    }
    if (rank) {
      this.rank = rank;
    }

    if (!rank) {
      this.facingDown = true;
    }

    // caching previous values in function context
    this.forget = function () {
      if (!this.rank) throw new Error('Card had no value!');
      rank = this.rank;
      suit = this.suit;
      delete this.rank;
      delete this.suit;
      this.onUpdate();
    };

    this.recall = function (_suit?: Suit, _rank?: Rank) {
      if (this.rank) throw new Error('Card has value value already!');
      this.rank = _rank || rank;
      this.suit = _suit || suit;
      this.onUpdate();
    };
  }

  setPosition(x: number, y: number) {
    this.position[0] = x;
    this.position[1] = y;
    this.onUpdate(); // TODO throttle on tick? use isDirty instead?
  }

  setRotation(rotation: number) {
    this.rotation = rotation;
    this.onUpdate();
  }

  setRotationDegrees(degrees: number) {
    this.setRotation(DEG_TO_RAD * degrees);
  }

  setFacingDown(isDown: boolean) {
    this.facingDown = isDown;
    this.onUpdate();
  }

  // this method will be overridden by constructor
  forget() {}

  // this method will be overridden by constructor
  recall(_suit?: Suit, _rank?: Rank) {}

  toString() {
    if (!this.rank) return `BLANK`;
    return `${this.suit}${this.rank}`;
  }

  dispose() {
    this.onDispose();
    this.onUpdate = () => {};
    this.onDispose = () => {};
  }

  setUpdateAndDispose(updateFn: () => void, disposeFn: () => void) {
    this.onUpdate = updateFn;
    this.onDispose = disposeFn;
    updateFn();
  }
}

/**
 * Auxiliary function to return a set of cards
 * @param withJokers pass true to have jokers in the set
 * @param back pass back to define the card back variant for all the cards in the set
 * @param oddOfUnknown
 */
export function getDeck(
  withJokers: boolean,
  back: Back = Back.Blue,
  oddOfUnknown = 0,
): Card[] {
  const cards: Card[] = [];

  for (const suit of Object.values(Suit)) {
    for (const rank of Object.values(Rank)) {
      if (
        rank === Rank.Joker &&
        (!withJokers || suit === Suit.Hearts || suit === Suit.Clubs)
      )
        continue;

      if (Math.random() < oddOfUnknown) cards.push(new Card('', back));
      else cards.push(new Card('', back, suit, rank));
    }
  }

  return cards;
}

/**
 * Fisher-Yates shuffle algorithm
 *
 * @param arr the array of cards
 * @param inPlace if true, shuffling is done in place, otherwise a new shuffled array is returned
 */
export function shuffle<T>(arr: T[], inPlace = false) {
  if (!inPlace) {
    arr = Array.from(arr);
  }
  let m = arr.length;
  let t: T;
  let i: number;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr;
}

export function place(cards: Card[], [x, y]: [number, number]) {
  for (const c of cards) {
    c.setPosition(x, y);
  }
}

/**
 * Change the side facing up
 *
 * @param cards cards to affect
 * @param facingDown facing down state to set
 * @param forgetRecover if true, the actual face value is forgotten
 */
export function face(
  cards: Card[],
  facingDown: boolean,
  forgetRecover = false,
) {
  for (const c of cards) {
    c.setFacingDown(facingDown);
    if (forgetRecover) {
      if (facingDown) c.forget();
      else c.recall();
    }
  }
}

/**
 * Layout a set of cards as an arc
 *
 * @param cards cards to affect
 * @param center center of the arc
 * @param delta delta position between cards
 * @param _degrees base degrees for the cards in the arc (orientation)
 * @param dDegrees delta degrees to affect per card
 */
export function arc(
  cards: Card[],
  [_x, _y]: [number, number],
  [dx, dy]: [number, number],
  _degrees: number,
  dDegrees: number,
) {
  const l = cards.length;
  let x = _x - dx * l * 0.5;
  let y = _y - dy * l * 0.5;
  let degrees = _degrees - dDegrees * l * 0.5;
  for (const c of cards) {
    c.setPosition(x, y);
    c.setRotationDegrees(degrees);
    x += dx;
    y += dy;
    degrees += dDegrees;
  }
}

/**
 * Reorders cards using a given heuristic
 *
 * @param cards cards to reorder
 * @param heuristicFn heuristic to apply to each card as criteria for sorting
 */
export function reorder(cards: Card[], heuristicFn: (c: Card) => number) {
  cards.sort((a: Card, b: Card) => heuristicFn(a) - heuristicFn(b));
}

const _suitsOrder: string[] = Object.values(Suit);
const _rankOrder: string[] = [
  Rank.Ace,
  Rank.King,
  Rank.Queen,
  Rank.Jack,
  Rank.Ten,
  Rank.Nine,
  Rank.Eight,
  Rank.Seven,
  Rank.Six,
  Rank.Five,
  Rank.Four,
  Rank.Three,
  Rank.Two,
  Rank.Joker,
];

/**
 * Returns an heuristic which can be used to correctly order cards in an array
 *
 * @param suitsFirst whether to prioritize suits over ranks
 * @param suitsOrder which order different suits get ordered
 * @param rankOrder which order different ranks get ordered
 */
export function cardHeuristicFactory(
  suitsFirst = true,
  suitsOrder: string[] = _suitsOrder,
  rankOrder: string[] = _rankOrder,
): (c: Card) => number {
  const suitScale = suitsFirst ? 20 : 1;
  const rankScale = suitsFirst ? 1 : 4;
  return (c) =>
    suitScale * (suitsOrder.indexOf(c.suit || '') + 1) +
    rankScale * (rankOrder.indexOf(c.rank || '') + 1);
}

/**
 * Deals card hands as arcs around a center point
 *
 * @param deck array of cards to get cards from
 * @param param1 center point
 * @param cardsPerHand number of cards to give each player
 * @param numPlayers  number of players to assign cards
 * @param heuristicFn heuristic function to use to order cards in each hand
 */
export function dealCards(
  deck: Card[],
  [W2, H2]: [number, number],
  cardsPerHand: number,
  numPlayers: number,
  heuristicFn: (c: Card) => number,
): Card[][] {
  const D_ANGLE = 360 / numPlayers;
  let angle = 90;

  const hands = [];
  for (let i = 0; i < numPlayers; ++i) {
    const hand = deck.splice(0, cardsPerHand);
    reorder(hand, heuristicFn);

    const [dx, dy] = fromPolar([Math.min(W2, H2) * 0.8, angle]);
    const [dx2, dy2] = fromPolar([21, 17 + (angle - 90)]);
    arc(hand, [W2 + dx, H2 + dy], [dx2, dy2], angle - 90, 6);

    hands.push(hand);
    angle += D_ANGLE;
  }

  face(deck, true);
  arc(deck, [W2, H2], [0.4, -0.4], 0, 0);

  return hands;
}
