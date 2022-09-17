import { trackObject } from "../generic/trackObject";

export type Position = [number, number];

export function indexToPos(idx:number):Position {
  const y = Math.floor(idx /3);
  return [
    idx - 3*y,
    y
  ];
}

export function posToIndex([x, y]:Position):number {
  return y*3 + x;
}

export type T3Board = {
  sync: ()=>any,
  patch: (diffs:any)=>void,
  cells: [number, number, number, number, number, number, number, number, number],
  nextToPlay:number[],
  whoWon:number
}

export function getBoard():T3Board {
  const cells = new Array(9);
  cells.fill(0);
  return trackObject({
    nextToPlay: trackObject([]),
    whoWon: 0,
    cells: trackObject(cells)
  }) as T3Board;
}
