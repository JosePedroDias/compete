/**
 * This module provides useful geometry functions
 */

export type V2 = [number, number];

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export function toPolar([x, y]: [number, number]): [number, number] {
  const r = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(y, x);
  return [r, RAD_TO_DEG * theta];
}

export function fromPolar([r, thetaDegrees]: [number, number]): [
  number,
  number,
] {
  const theta = DEG_TO_RAD * thetaDegrees;
  return [r * Math.cos(theta), r * Math.sin(theta)];
}

export function distXY(dx: number, dy: number): number {
  return Math.sqrt(dx * dx + dy * dy);
}

export function dist(p1: V2, p2: V2): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export function distSquared(p1: V2, p2: V2): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return dx * dx + dy * dy;
}

export function getVersor(p1: V2, p2: V2): V2 {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const d = Math.sqrt(dx * dx + dy * dy);
  if (dx === 0 && dy === 0) {
    return [1, 0];
  }
  return [dx / d, dy / d];
}

export function getAngleFromVersor(p: V2): number {
  return Math.atan2(p[1], p[0]);
}

export function getVersorFromAngle(ang: number): V2 {
  return [Math.cos(ang), Math.sin(ang)];
}

export function rotate90Degrees(p: V2): V2 {
  return [p[1], -p[0]];
}

export function lerp(a: number, b: number, r: number): number {
  return (1 - r) * a + r * b;
}

export function lerp2(a: V2, b: V2, r: number): V2 {
  return [(1 - r) * a[0] + r * b[0], (1 - r) * a[1] + r * b[1]];
}

export function averagePoint(points: V2[]): V2 {
  const avg = [0, 0];
  for (const p of points) {
    avg[0] += p[0];
    avg[1] += p[1];
  }
  avg[0] /= points.length;
  avg[1] /= points.length;
  return avg as V2;
}

export function nearestPoint(from: V2, points: V2[]): V2 {
  let minDist = -1;
  let candidate: V2 = [0, 0];
  for (const p of points) {
    const dSq = distSquared(p, from);
    if (minDist === -1 || dSq < minDist) {
      candidate = p;
      minDist = dSq;
    }
  }
  return candidate;
}

export function clamp(v: number, min: number, max: number): number {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}
