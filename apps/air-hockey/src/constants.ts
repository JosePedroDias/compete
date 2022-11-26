import { V2 } from 'compete-utils';

export const GAME_PROTOCOL = 'air-hockey/0.0.1';

export type AirHockeyState = {
  signs: [number, number]; // positive, negative
  inputs: [V2, V2];
  positions: [V2, V2, V2];
  scoreboard: V2;
  sfxToPlay: string[];
};

export const puckR = 28;
export const pusherR = 46;

export const tableDims = [234, 381]; // half widths
export const goalWidth = 2 * tableDims[0] * 0.39;
export const goalWallWidth = (2 * tableDims[0] - goalWidth) / 2;
export const edgeR = 50;

export const fps = 30;
