import { expect, describe, it } from 'vitest';

import { Card, getDeck, Suit, Rank, Back } from './cards';

describe('card basics', () => {
  it('ctor', () => {
    const c = new Card('1234', Back.Blue, Suit.Diamonds, Rank.King);
    expect(c.toString()).toEqual('DK');
  });

  it('computed id without initial value', () => {
    const c = new Card(undefined, Back.Blue);
    expect(c.toString()).toEqual('BLANK');
    expect(typeof c.id).toEqual('string');
  });

  it('forget/recall', () => {
    const c = new Card(undefined, Back.Blue, Suit.Spades, Rank.Ace);
    expect(c.toString()).toEqual('SA');

    c.forget();
    expect(c.toString()).toEqual('BLANK');
    expect(() => c.forget()).toThrow();

    c.recall();
    expect(c.toString()).toEqual('SA');
    expect(() => c.recall()).toThrow();
  });
});

describe('getDeck', () => {
  it('regular 52', () => {
    const d = getDeck(false);
    expect(d.length).toEqual(52);
    expect(d.join(',')).toEqual(
      'DA,D2,D3,D4,D5,D6,D7,D8,D9,DT,DJ,DQ,DK,SA,S2,S3,S4,S5,S6,S7,S8,S9,ST,SJ,SQ,SK,HA,H2,H3,H4,H5,H6,H7,H8,H9,HT,HJ,HQ,HK,CA,C2,C3,C4,C5,C6,C7,C8,C9,CT,CJ,CQ,CK',
    );
  });

  it('with jokers', () => {
    const d = getDeck(true);
    expect(d.length).toEqual(54);
    expect(d.join(',')).toEqual(
      'DA,D2,D3,D4,D5,D6,D7,D8,D9,DT,DJ,DQ,DK,DR,SA,S2,S3,S4,S5,S6,S7,S8,S9,ST,SJ,SQ,SK,SR,HA,H2,H3,H4,H5,H6,H7,H8,H9,HT,HJ,HQ,HK,CA,C2,C3,C4,C5,C6,C7,C8,C9,CT,CJ,CQ,CK',
    );
  });
});
