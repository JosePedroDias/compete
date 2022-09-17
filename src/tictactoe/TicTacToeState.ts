import { Board, Position } from '../generic/Board';

export const CELL_EMPTY = 0;
export const CELL_CROSS = 1;
export const CELL_OH = 2;

export const WON_SHAPE_ROW = 'ROW';
export const WON_SHAPE_COLUMN = 'COLUMN';
export const WON_SHAPE_DIAGONAL = 'DIAGONAL';

export class TicTacToeState {
  board: Board<number> = new Board<number>(3, 3, CELL_EMPTY);

  private static rows: Position[][] = [
    [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [2, 0],
      [2, 1],
      [2, 2],
    ],
  ];

  private static columns: Position[][] = [
    [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [0, 2],
      [1, 2],
      [2, 2],
    ],
  ];

  private static diagonals: Position[][] = [
    [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    [
      [0, 2],
      [1, 1],
      [2, 0],
    ],
  ];

  private hasOneOfSequences(sequences: Position[][], value: number): boolean {
    outer: for (const seq of sequences) {
      for (const [x, y] of seq) {
        if (this.board.getCell(x, y) !== value) {
          break outer;
        }
      }
      return true;
    }
    return false;
  }

  private hasRow(value: number) {
    return this.hasOneOfSequences(TicTacToeState.rows, value);
  }

  private hasColumn(value: number) {
    return this.hasOneOfSequences(TicTacToeState.columns, value);
  }

  private hasDiagonal(value: number) {
    return this.hasOneOfSequences(TicTacToeState.diagonals, value);
  }

  private isEmpty(pos: Position): boolean {
    return this.board.getCell(pos[0], pos[1]) === CELL_EMPTY;
  }

  hasWon(value: number): string {
    if (this.hasRow(value)) return WON_SHAPE_ROW;
    if (this.hasColumn(value)) return WON_SHAPE_COLUMN;
    if (this.hasDiagonal(value)) return WON_SHAPE_DIAGONAL;
    return '';
  }

  isFull(): boolean {
    for (let i = 0; i < this.board.array.length; ++i) {
      if (this.board.array[i] === CELL_EMPTY) return false;
    }
    return true;
  }

  setCell(pos: Position, value: number): void {
    if (!this.isEmpty(pos)) throw new Error('cell must be empty!');
    this.board.setCell(pos[0], pos[1], value);
  }
}
