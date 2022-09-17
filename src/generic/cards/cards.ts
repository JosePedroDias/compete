const DEG_TO_RAD = Math.PI / 180; // no pixi dependency please

import { v4 as uuid } from 'uuid';

export enum Suit {
  Diamonds = 'D', // red
  Spades = 'S', // black
  Hearts = 'H', // red
  Clubs = 'C', // black
}

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

export enum Back {
  Blue = 'B1',
  Red = 'B2',
}

export class Card {
  suit?: Suit;
  rank?: Rank;
  back: Back;
  id: string;
  facingDown = false;
  position: [number, number] = [0, 0];
  rotation = 0;
  onUpdate: () => void = () => {};
  onDispose: () => void = () => {};

  constructor(id = '', back: Back = Back.Blue, suit?: Suit, rank?: Rank) {
    this.id = id ? id : uuid();
    this.back = back;
    this.suit = suit;
    this.rank = rank;
    if (!rank) {
      this.facingDown = true;
    }

    // caching previous values in function context

    this.forget = function() {
      if (!this.rank) throw new Error('Card had no value!');
      rank = this.rank;
      suit = this.suit;
      delete this.rank;
      delete this.suit;
      this.onUpdate();
    }

    this.recover = function(_suit?:Suit, _rank?:Rank) {
      if (this.rank) throw new Error('Card has value value already!');
      this.rank = _rank || rank;
      this.suit = _suit || suit;
      this.onUpdate();
    }
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
  recover(_suit?:Suit, _rank?:Rank) {}

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

// fisher-yates
export function shuffle<T>(arr:T[], inPlace=false) {
  if (!inPlace) {
    arr = Array.from(arr);
  }
  let m = arr.length;
  let t:T;
  let i:number;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr;
}

export function place(cards:Card[], [x, y]:[number, number]) {
  for (const c of cards) {
    c.setPosition(x, y);
  }
}

export function face(cards:Card[], facingDown:boolean, forgetRecover=false) {
  for (const c of cards) {
    c.setFacingDown(facingDown);
    if (forgetRecover) {
      if (facingDown) c.forget();
      else c.recover();
    }
  }
}

export function arc(cards:Card[], [_x, _y]:[number, number], [dx, dy]:[number,number], _degrees:number, dDegrees:number) {
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

export function reorder(cards:Card[], heuristicFn:(c:Card)=>number) {
  cards.sort((a:Card, b:Card) => heuristicFn(a) - heuristicFn(b));
}

const _suitsOrder:string[] = Object.values(Suit);
const _rankOrder:string[] = [ Rank.Ace, Rank.King, Rank.Queen, Rank.Jack, Rank.Ten, Rank.Nine, Rank.Eight, Rank.Seven, Rank.Six, Rank.Five, Rank.Four, Rank.Three, Rank.Two, Rank.Joker ];
export function cardHeuristicFactory(suitsFirst=true, suitsOrder:string[]=_suitsOrder, rankOrder:string[]=_rankOrder): (c:Card)=>number {
  const suitScale = suitsFirst ? 20 : 1;
  const rankScale = suitsFirst ?  1 : 4;
  return (c) => 
    suitScale * (suitsOrder.indexOf(c.suit || '') + 1) +
    rankScale * (rankOrder.indexOf(c.rank || '') + 1);
}
