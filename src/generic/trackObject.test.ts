import { expect, it } from 'vitest';

import { trackObject } from './trackObject';

it('trackObject sync', () => {
  const o = { x: 2, y: 'x' };
  const p: any = trackObject(o);
  expect(o.x).toEqual(2);
  expect(o.y).toEqual('x');
  // @ts-ignore
  expect(o.z).toEqual(undefined);
  expect(p.x).toEqual(2);
  expect(p.y).toEqual('x');
  expect(p.z).toEqual(undefined);

  p.x = 3;
  p.y = 'x';
  expect(p.sync()).toEqual([['x', 3]]);
  expect(p.x).toEqual(3);
  expect(p.y).toEqual('x');
});

it('trackObject patch', () => {
  const o = { x: 2, y: 'x' };
  const p: any = trackObject(o);

  p.patch([
    ['x', 3],
    ['y', 'X'],
  ]);
  expect(o.x).toEqual(3);
  expect(o.y).toEqual('X');
  expect(p.x).toEqual(3);
  expect(p.y).toEqual('X');
});

it('trackObject array methods', () => {
  const arr = ['a', 'b'];
  const arr2: any = trackObject(Array.from(arr));
  const p: any = trackObject(arr);

  p.push('c'); // a b c
  p.shift(); // b c
  p.unshift('d'); // d b c
  p.pop(); // d b

  expect(arr).toEqual(['d', 'b']);
  expect(p).toEqual(['d', 'b']);

  const diffs = p.sync();
  arr2.patch(diffs);
  expect(arr).toEqual(arr2);
});

it('2 levels', () => {
  const st: any = trackObject({
    a: 1,
    b: trackObject(['c']),
  });

  const st2: any = trackObject({
    a: 1,
    b: trackObject(['c']),
  });

  expect(st).toEqual({ a: 1, b: ['c'] });

  st.a = 2;
  st.b.push('d');

  expect(st).toEqual({ a: 2, b: ['c', 'd'] });

  const sync = st.sync();
  expect(sync).toEqual({ c: [[['push', 'd']]], m: [['a', 2]] });
  st2.patch(sync);
  expect(st).toEqual(st2);
});
