import { Board } from 'compete-utils';

export const CHAR_EMPTY = ' ';
export const CHAR_SNAKE = 'O';
export const CHAR_FOOD = '*';
export const CHAR_OBSTACLE = '#';

export const dirLookup: Map<string, [number, number]> = new Map();
dirLookup.set('left', [-1, 0]);
dirLookup.set('right', [1, 0]);
dirLookup.set('up', [0, -1]);
dirLookup.set('down', [0, 1]);

export class Snake {
  b: Board<string>;
  ps: [number, number][];
  growEvery: number;
  toGrow: number;
  onDied: () => void;
  dir = '';
  died = false;

  constructor(b: Board<string>, onDied: () => void) {
    this.b = b;

    this.growEvery = 10;
    this.toGrow = this.growEvery;

    this.ps = [];
    const pos = b.getRandomCellWithValue(CHAR_EMPTY);
    this.ps.push(pos);

    this.onDied = onDied;

    b.setCell(pos[0], pos[1], CHAR_SNAKE);
  }

  isValidPosition([x, y]: [number, number]): boolean {
    return x >= 0 && y >= 0 && x < this.b.w && y < this.b.h;
  }

  move() {
    if (this.died) return;

    const b = this.b;

    const tip: [number, number] = Array.from(this.ps[0]) as [number, number];
    const dP = dirLookup.get(this.dir);

    if (!dP) return;

    tip[0] += dP[0];
    tip[1] += dP[1];

    let grows = false;

    let collided = !this.isValidPosition(tip);
    if (!collided) {
      const v = this.b.getCell(tip[0], tip[1]);
      if (v === CHAR_FOOD) {
        grows = true;
      } else if (v !== CHAR_EMPTY) {
        collided = true;
      }
    }

    if (collided) {
      this.died = true;
      this.onDied && this.onDied();
      return;
    }

    this.ps.unshift(tip);
    b.setCell(tip[0], tip[1], CHAR_SNAKE);

    --this.toGrow;

    if (this.toGrow === 0) {
      grows = true;
      this.toGrow = this.growEvery;
    }

    if (!grows) {
      const tail: [number, number] = this.ps.pop() as [number, number];
      b.setCell(tail[0], tail[1], CHAR_EMPTY);
    }
  }

  getTipValue(): string {
    const [x, y] = this.ps[0];
    return this.b.getCell(x, y);
  }
}
