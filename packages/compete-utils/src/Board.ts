/**
 * This module offers a solution for representing 2D discrete boards and provide for recording and syncing changes
 */

function rndInt(n: number): number {
  return Math.floor(n * Math.random());
}

/**
 * Defines a position as a 2D array of numbers
 */
export type Position = [number, number];

/**
 * This class allows managing a 2D array of discrete cells
 */
export class Board<V> {
  w: number;
  h: number;
  defaultValue: V;
  array: V[];
  yetToSync: Map<number, V>;

  constructor(w: number, h: number, value: V) {
    this.defaultValue = value;
    this.array = new Array(w * h);
    this.array.fill(value);
    this.w = w;
    this.h = h;
    this.yetToSync = new Map();
  }

  /**
   * Position to index
   */
  getIndex(x: number, y: number): number {
    return this.w * y + x;
  }

  /**
   * Gets the cell from its position
   */
  getCell(x: number, y: number): V {
    return this.array[this.getIndex(x, y)];
  }

  /**
   * Sets the value of a cell
   */
  setCell(x: number, y: number, v: V): void {
    const i = this.getIndex(x, y);
    if (this.array[i] === v) return;
    this.array[i] = v;
    this.yetToSync.set(i, v);
  }

  /**
   * Fills the whole board cells with given value
   */
  fill(v: V): void {
    for (let y = 0; y < this.h; ++y) {
      for (let x = 0; x < this.w; ++x) {
        this.setCell(x, y, v);
      }
    }
  }

  /**
   * Gets a random cell having given value (not optimized)
   */
  getRandomCellWithValue(value: V): Position {
    let pos: Position;
    do {
      pos = [rndInt(this.w), rndInt(this.h)];
    } while (this.getCell(pos[0], pos[1]) !== value);
    return pos;
  }

  /**
   * Returns a string representation of the board suitable for console output
   */
  toString(): string {
    const lines = [];
    for (let y = 0; y < this.h; ++y) {
      lines.push(this.array.slice(y * this.w, (y + 1) * this.w).join(''));
    }
    return lines.join('\n');
  }

  /**
   * Returns a new instance of the board
   */
  clone(): Board<V> {
    const c = new Board<V>(this.w, this.h, this.defaultValue);
    c.array = Array.from(this.array);
    return c;
  }

  /**
   * Returns the array of changes yet to sync (assumes sync to take place by broadcasting them outwards)
   */
  sync(): [number, V][] {
    const diff = Array.from(this.yetToSync.entries());
    this.yetToSync.clear();
    return diff;
  }

  /**
   * Applies an array of changes synced from remote
   */
  patch(diffs: [number, V][]) {
    for (const [i, v] of diffs) {
      this.array[i] = v;
    }
  }
}
