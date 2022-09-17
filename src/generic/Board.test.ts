import { expect, it } from 'vitest';

import { Board } from './Board';

it('board sync', () => {
  const b = new Board(3, 2, '#');
  expect(b.yetToSync).toEqual(new Map());

  b.setCell(0, 0, 'a');

  expect(b.yetToSync).toEqual(new Map([[0, 'a']]));
  expect(b.sync()).toEqual([[0, 'a']]);
  expect(b.yetToSync).toEqual(new Map());
  expect(b.sync()).toEqual([]);

  b.setCell(0, 0, 'x');
  b.setCell(1, 0, 'y');

  expect(b.yetToSync).toEqual(
    new Map([
      [0, 'x'],
      [1, 'y'],
    ]),
  );
  expect(b.sync()).toEqual([
    [0, 'x'],
    [1, 'y'],
  ]);
  expect(b.yetToSync).toEqual(new Map());

  b.setCell(1, 0, 'y');

  expect(b.yetToSync).toEqual(new Map());
});
