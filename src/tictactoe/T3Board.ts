import { trackObject } from '../generic/trackObject';

export type Position = [number, number];

export function indexToPos(idx: number): Position {
  const y = Math.floor(idx / 3);
  return [idx - 3 * y, y];
}

export function posToIndex(x: number, y: number): number {
  return y * 3 + x;
}

type Seq = [number, number, number];

const HORIZONTALS: Seq[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
];

const VERTICALS: Seq[] = [
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
];

const DIAGONALS: Seq[] = [
  [0, 4, 8],
  [2, 4, 6],
];

const ALL_SEQUENCES: Seq[] = [...HORIZONTALS, ...VERTICALS, ...DIAGONALS];

export type T3Board = {
  sync: () => any;
  patch: (diffs: any) => void;

  cells: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  nextToPlay: number[];
  whoWon: number;

  getCell(x: number, y: number): number;
  setCell(x: number, y: number, v: number): void;
  isFull(): boolean;
  hasWon(v: number): boolean;
};

const api = {
  getCell: function (x: number, y: number): number {
    // @ts-ignore
    return this.cells[posToIndex(x, y)];
  },
  setCell: function (x: number, y: number, v: number): void {
    // @ts-ignore
    this.cells[posToIndex(x, y)] = v;
  },
  isFull: function (): boolean {
    // @ts-ignore
    for (const c of this.cells) {
      if (c === 0) return false;
    }
    return true;
  },
  hasWon: function (v: number): boolean {
    // @ts-ignore
    for (const seq of ALL_SEQUENCES) {
      inner: for (const [n, idx] of Object.entries(seq)) {
        // @ts-ignore
        if (this.cells[idx] !== v) break inner;
        if (n === '2') return true;
      }
    }
    return false;
  },
};

export function getBoard(): T3Board {
  const cells = new Array(9);
  cells.fill(0);

  const o = Object.create(api);
  o.cells = trackObject(cells); // diffs.c[0]
  o.nextToPlay = trackObject([]); // diffs.c[1]
  o.whoWon = 0;

  return trackObject(o) as T3Board;
}
