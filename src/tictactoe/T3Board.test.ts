import { expect, it } from 'vitest';
import { getBoard } from './T3Board';

it('asd', () => {
  const t = getBoard();
  const t2 = getBoard();

  expect(t).toEqual({
    cells: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    whoWon: 0,
    nextToPlay: []
  });

  t.cells[1] = 2;
  t.whoWon = 3;
  t.nextToPlay.push(4);
  t.nextToPlay.push(5);

  expect(t).toEqual({
    cells: [0, 2, 0, 0, 0, 0, 0, 0, 0],
    whoWon: 3,
    nextToPlay: [4, 5]
  });

  expect(t.cells.length).toEqual(9);

  const diffs = t.sync();
  //console.log( 'diffs:', JSON.stringify(diffs) );
  t2.patch(diffs);

  expect(t).toEqual(t2);
});
