function rndInt(n: number): number {
  return Math.floor(n * Math.random());
}

export type Position = [number, number];

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

  getIndex(x: number, y: number): number {
    return this.w * y + x;
  }

  getCell(x: number, y: number): V {
    return this.array[this.getIndex(x, y)];
  }

  setCell(x: number, y: number, v: V): void {
    const i = this.getIndex(x, y);
    if (this.array[i] === v) return;
    this.array[i] = v;
    this.yetToSync.set(i, v);
  }

  fill(v: V): void {
    for (let y = 0; y < this.h; ++y) {
      for (let x = 0; x < this.w; ++x) {
        this.setCell(x, y, v);
      }
    }
  }

  getRandomCellWithValue(value: V): Position {
    let pos: Position;
    do {
      pos = [rndInt(this.w), rndInt(this.h)];
    } while (this.getCell(pos[0], pos[1]) !== value);
    return pos;
  }

  toString(): string {
    const lines = [];
    for (let y = 0; y < this.h; ++y) {
      lines.push(this.array.slice(y * this.w, (y + 1) * this.w).join(''));
    }
    return lines.join('\n');
  }

  clone(): Board<V> {
    const c = new Board<V>(this.w, this.h, this.defaultValue);
    c.array = Array.from(this.array);
    return c;
  }

  sync(): [number, V][] {
    const diff = Array.from(this.yetToSync.entries());
    this.yetToSync.clear();
    return diff;
  }

  patch(diffs: [number, V][]) {
    for (const [i, v] of diffs) {
      this.array[i] = v;
    }
  }
}
