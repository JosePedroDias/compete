//import {theme} from './cardzp-theme';

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

/* export type Suit = D |

export const SUITS = 'DHSC'.split('');
export const RANKS = '23456789TJQKA'.split(''); // cards arte SUIT+RANK. jokers are J1 and J2. backs are B1 and B2.
export const DECK_BACK_COLORS = 'B1 B2'.split(' '); // blue red
 */
export class Card {
  suit: Suit;
  rank: Rank;
  back: Back;

  constructor(_suit: Suit, _rank: Rank, _back: Back) {
    this.suit = _suit;
    this.rank = _rank;
    this.back = _back;
  }

  toString() {
    return `${this.suit}${this.rank}`;
  }
}

export function getDeck(withJokers: boolean, back: Back = Back.Blue): Card[] {
  const cards: Card[] = [];

  for (const suit of Object.values(Suit)) {
    for (const rank of Object.values(Rank)) {
      if (
        rank === Rank.Joker &&
        (!withJokers || suit === Suit.Hearts || suit === Suit.Clubs)
      )
        continue;
      cards.push(new Card(suit, rank, back));
    }
  }

  return cards;
}

/* 
function _setupSprite(name) {
    const texture = theme[name];
    const card = new Sprite(texture);
    card.anchor.set(0.5, 0.5);
    //card.scale.set(scale, scale);
    return card;
}

function _setupVisualCard(name, opts) { // { highlight, backColor, isFacingDown }
    const face = _setupSprite(name);

    const highlight = _setupSprite('HIGHLIGHT');
    highlight.tint = 0x00FF00;
    highlight.alpha = 2/3;

    const back = _setupSprite(opts.backColor);
    
    const shadow = _setupSprite('SHADOW');
    
    const card = new Container();
    card.addChild(shadow);
    card.addChild(back);
    card.addChild(face);
    card.addChild(highlight);

    if (opts.isFacingDown) {
        face.alpha = 0;
        face.visible = false;
    } else {
        back.alpha = 0;
        back.visible = false;
    }

    highlight.visible = false;

    card._shadow = shadow;
    card._back = back;
    card._face = face;
    card._highlight = highlight;

    return card;
}

// card api
function toCard(o, suit, rank) {
    const e = o._el;
    // visual
    Object.defineProperty(o, 'facingDown', {get: function isFacingDown() { return e._back.visible; }});

    o.setFaceVisible = function(isVisible, duration) {
        if (o.facingDown !== !!isVisible) return console.log('ignored: noop');

        if ( (e._face.alpha !== 0 && e._face.alpha !== 1) || (e._back.alpha !== 0 && e._back.alpha !== 1)) return console.log('ignored: animating');

        console.log(o.toString() + ' will be facing ' + (isVisible ? 'up' : 'down') + (duration ? ' duration' + duration : ''));

        swapOrder([e._face, e._back]);

        const becomingVisibleSide = e[ isVisible ? '_face' : '_back' ];
        const nowHiddenSide = e[ isVisible ? '_back' : '_face' ];

        becomingVisibleSide.visible = true;

        if (!duration) {
            becomingVisibleSide.alpha = 1;
            nowHiddenSide.alpha = 0;
            nowHiddenSide.visible = false;
            return;
        }

        new Tween(becomingVisibleSide, { alpha: 1 }, duration).call(function() { // TODO BUGGY!
            nowHiddenSide.alpha = 0;
            nowHiddenSide.visible = false;
        });
    }

    o.flip = function(duration) { o.setFaceVisible(o.facingDown, duration); };

    o.toString = function() {
        return o.suit + o.rank;
    }

    // logical
    Object.defineProperty(o, 'suit', {get: function getSuit() { return suit; }});
    Object.defineProperty(o, 'rank', {get: function getRank() { return rank; }});

    return o;
}

export function createCard(opts) { // { rank, suit, isJoker, backColor, isFacingDown }
    let rank = opts.rank
    let suit = opts.suit;

    if (opts.isJoker) {
        suit = 'J';
        if (!rank) {
            rank = '1';
        }
    }
    if (!opts.backColor) {
        opts.backColor = DECK_BACK_COLORS[0];
    }
    const card = { suit: suit, rank: rank, isJoker: opts.isJoker };
    card._el = _setupVisualCard(suit + rank, { backColor: opts.backColor, isFacingDown: opts.isFacingDown });

    return toCard(card, suit, rank);
}

// cards api
function toCards(o) {
    // visual
    //Object.defineProperty(o, 'facingDown', {get: function isFacingDown() { return o._el._back.visible; }});

    // logical
    //Object.defineProperty(o, 'suit', {get: function getSuit() { return suit; }});
    //Object.defineProperty(o, 'rank', {get: function getRank() { return rank; }});

    o.take = function(n) {
        const l = o.length;
        if (n > l) throw new Error('Not enough cards');
        const result = o.splice(l-n, n);
        return toCards(result);
    }

    o.takeFromStart = function(n) {
        const l = o.length;
        if (n > l) throw new Error('Not enough cards');
        const result = o.splice(0, n);
        return toCards(result);
    }

    o.join = function(o2) {
        return toCards(o.concat(o2));
    }

    o.toString = function() {
        return o.map(function(card) { return card.toString(); });
    }

    o.flip = function(duration) {
        o.forEach(function(card) { card.flip(duration); });
    }

    return o;
}


export function createDeck(opts) { // { ranks, jokers, backColor, isFacingDown }
    const suits = SUITS;
    const ranks = opts.ranks || RANKS;
    const backColor = opts.backColor || DECK_BACK_COLORS[0];
    const isFacingDown = opts.isFacingDown;

    let i, j;
    const cards = [];

    for (i in suits) {
        for (j in ranks) {
            const card = createCard({ suit: suits[i], rank: ranks[j], backColor: backColor, isFacingDown: isFacingDown });
            cards.push(card);
        }
    }

    if (opts.jokers) {
        let card;

        card = createCard({ isJoker: true, rank: '1', backColor: backColor, isFacingDown: isFacingDown });
        cards.push(card);

        card = createCard({ isJoker: true, rank: '2', backColor: backColor, isFacingDown: isFacingDown });
        cards.push(card);
    }

    return toCards(cards);
}

export function shuffle(cards) {
    const rng = Math.random;
    let m = cards.length, t, i;
    while (m) {
        i = Math.floor(rng() * m--);
        t = cards[m];
        cards[m] = cards[i];
        cards[i] = t;
    }
    return cards;
}

export function lerp(i, a, b) {
    return (1-i) * a + i * b;
}

function _lerpObject(i, a, b) {
    const o = {};
    Object.keys(a).forEach(function(k) {
        o[k] = lerp(i, a[k], b[k]);
    });
    return o;
}

export function linearSpread(arr, opts) { // { pi, pf, duration?, onEnd? }
    function fn(i, len) {
        const r = i/len;
        return _lerpObject(r, opts.pi, opts.pf);
    }
    for (let i = 0; i < arr.length; ++i) {
        const el = arr[i]._el;
        const p = fn(i, arr.length);
        if (!opts.duration) el.position.set(p.x, p.y);
        else new Tween(el, p, opts.duration);
    }
    if (opts.onEnd) {
        if (opts.duration) new Tween({}, {}, opts.duration).call(opts.onEnd);
        else opts.onEnd();
    }
}

export function customSpread(arr, opts) { // { getP, duration?, onEnd? }
    function fn(i, len) {
        const r = i/len;
        return opts.getP(r);
    }
    for (let i = 0; i < arr.length; ++i) {
        const el = arr[i]._el;
        const p = fn(i, arr.length);
        if (!opts.duration) el.position.set(p.x, p.y);
        else new Tween(el, p, opts.duration);
    }
    if (opts.onEnd) {
        if (opts.duration) new Tween({}, {}, opts.duration).call(opts.onEnd);
        else opts.onEnd();
    }
}

export function getVisuals(arr) {
    return arr.map(e => e._el);
}

const asc = (a, b) => a < b ? -1 : a > b ? 1 : 0;

function swapOrder(arr) { // assumes 2 items of same parent. keeps rest of children untouched
    if (arr.length === 0) return;
    if (arr[0]._el) arr = getVisuals(arr);
    const parent = arr[0].parent;
    const indexA = parent.children.indexOf(arr[0]);
    const indexB = parent.children.indexOf(arr[1]);
    if (indexA < indexB) {
        parent.addChildAt(arr[0], indexB);
    } else {
        parent.addChildAt(arr[1], indexA);
    }
}

// assumes all items being children of the same parent!
export function reorderThese(arr, inversed) { // WARNING: reorders the whole group of children
    if (arr.length === 0) return;
    if (arr[0]._el) arr = getVisuals(arr);
    const parent = arr[0].parent;
    const currentOrder = [];
    if (inversed) {
        arr = arr.slice().reverse();
    }
    arr.forEach(function(spr) {
        const currentIndex = parent.children.indexOf(spr);
        currentOrder.push(currentIndex);
    });
    arr.forEach(function(spr) {
        parent.removeChild(spr);
    });
    currentOrder.sort(asc);
    arr.forEach(function(spr, i) {
        parent.addChildAt(spr, currentOrder[i]);
    });
}

// AUX

// without side-effects
export function reverse(arr_) {
    const arr = arr_.slice();
    return arr.reverse();
}

export function normalize(p) {
    const l = Math.sqrt(p.x*p.x + p.y+p.y);
    return { x: p.x/l, y: p.y/l };
} */

/*
face
face/several suits in the center
number top left
suit top left
back
card
shadow
*/
