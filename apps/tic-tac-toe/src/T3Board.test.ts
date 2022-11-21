import { expect, it } from 'vitest';
import { getBoard, posToIndex, indexToPos } from './T3Board';

it('posToIndex', () => {
  expect(posToIndex(0, 0)).toEqual(0);
  expect(posToIndex(1, 0)).toEqual(1);
  expect(posToIndex(0, 1)).toEqual(3);
});

it('indexToPos', () => {
  expect(indexToPos(0)).toEqual([0, 0]);
  expect(indexToPos(1)).toEqual([1, 0]);
  expect(indexToPos(3)).toEqual([0, 1]);
});

it('basic', () => {
  const t = getBoard();
  const t2 = getBoard();

  expect(t).toEqual({
    cells: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    whoWon: 0,
    nextToPlay: [],
  });

  t.cells[1] = 2;
  t.whoWon = 3;
  t.nextToPlay.push(4);
  t.nextToPlay.push(5);

  expect(t).toEqual({
    cells: [0, 2, 0, 0, 0, 0, 0, 0, 0],
    whoWon: 3,
    nextToPlay: [4, 5],
  });

  expect(t.cells.length).toEqual(9);

  const diffs = t.sync();
  //console.log( 'diffs:', JSON.stringify(diffs) );
  t2.patch(diffs);

  expect(t).toEqual(t2);
});

it('api cell calls', () => {
  const t = getBoard();
  const t2 = getBoard();

  t.setCell(0, 1, 2);
  t.setCell(1, 0, 3);

  expect(t).toEqual({
    cells: [0, 3, 0, 2, 0, 0, 0, 0, 0],
    whoWon: 0,
    nextToPlay: [],
  });

  const diffs = t.sync();
  //console.log( 'diffs:', JSON.stringify(diffs) );

  t2.patch(diffs);

  expect(t2).toEqual(t);
});

it('api isFull', () => {
  const t = getBoard();
  expect(t.isFull()).toBeFalsy();
  t.setCell(0, 0, 1);
  t.setCell(1, 0, 2);
  t.setCell(2, 0, 1);
  t.setCell(0, 1, 2);
  t.setCell(1, 1, 1);
  t.setCell(2, 1, 2);
  t.setCell(0, 2, 1);
  t.setCell(1, 2, 2);
  expect(t.isFull()).toBeFalsy();
  t.setCell(2, 2, 1);
  expect(t.isFull()).toBeTruthy();
});

it('api hasWon', () => {
  let t = getBoard();
  expect(t.hasWon(1)).toBeFalsy();
  expect(t.hasWon(2)).toBeFalsy();

  // horizontal #0
  t.setCell(0, 0, 1);
  t.setCell(1, 0, 1);
  t.setCell(2, 0, 1);
  expect(t.hasWon(1)).toBeTruthy();
  expect(t.hasWon(2)).toBeFalsy();

  // vertical #0
  t = getBoard();
  t.setCell(0, 0, 2);
  t.setCell(0, 1, 2);
  t.setCell(0, 2, 2);
  expect(t.hasWon(2)).toBeTruthy();
  expect(t.hasWon(1)).toBeFalsy();

  // diagonal #0
  t = getBoard();
  t.setCell(0, 0, 1);
  t.setCell(1, 1, 1);
  t.setCell(2, 2, 1);
  expect(t.hasWon(1)).toBeTruthy();
  expect(t.hasWon(2)).toBeFalsy();
});
