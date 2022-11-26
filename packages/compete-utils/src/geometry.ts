/**
 * This module provides useful geometry functions
 */

/**
 * 2D vector as a 2 elements array
 */
export type V2 = [number, number];

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * orthogonal to polar coordinates
 */
export function toPolar([x, y]: [number, number]): [number, number] {
  const r = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(y, x);
  return [r, RAD_TO_DEG * theta];
}

/**
 * polar to orthogonal coordinates
 */
export function fromPolar([r, thetaDegrees]: [number, number]): [
  number,
  number,
] {
  const theta = DEG_TO_RAD * thetaDegrees;
  return [r * Math.cos(theta), r * Math.sin(theta)];
}

/**
 * vector distance
 */
export function distXY(dx: number, dy: number): number {
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * vector distance
 */
export function dist(p1: V2, p2: V2): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * vector distance squared (faster)
 */
export function distSquared(p1: V2, p2: V2): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return dx * dx + dy * dy;
}

/**
 * normalize vector to length 1
 */
export function getVersor(p1: V2, p2: V2): V2 {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const d = Math.sqrt(dx * dx + dy * dy);
  if (dx === 0 && dy === 0) {
    return [1, 0];
  }
  return [dx / d, dy / d];
}

/**
 * get angle the versor does (in radians)
 */
export function getAngleFromVersor(p: V2): number {
  return Math.atan2(p[1], p[0]);
}

/**
 * returns a versor given an angle in radians
 */
export function getVersorFromAngle(ang: number): V2 {
  return [Math.cos(ang), Math.sin(ang)];
}

/**
 * rotate vector 90 degrees
 */
export function rotate90Degrees(p: V2): V2 {
  return [p[1], -p[0]];
}

/**
 * linear interpolation
 *
 * @param a first value
 * @param b second value
 * @param r ratio from 0(a) to 1(b)
 */
export function lerp(a: number, b: number, r: number): number {
  return (1 - r) * a + r * b;
}

/**
 * linear interpolation 2D
 *
 * @param a first 2D vector
 * @param b second 2D vector
 * @param r ratio from 0(a) to 1(b)
 */
export function lerp2(a: V2, b: V2, r: number): V2 {
  return [(1 - r) * a[0] + r * b[0], (1 - r) * a[1] + r * b[1]];
}

/**
 * average of given points
 */
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

/**
 * returns nearest point in points to from vector
 */
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

/**
 * clamps v between min and max
 */
export function clamp(v: number, min: number, max: number): number {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

/**
 * clamps vector between min and max
 */
export function clamp2(v: V2, min: V2, max: V2): V2 {
  v[0] = clamp(v[0], min[0], max[0]);
  v[1] = clamp(v[1], min[1], max[1]);
  return v;
}

/**
 * true iif number v is between min and max
 */
export function inBounds(v: number, min: number, max: number): boolean {
  if (v <= min) return false;
  if (v >= max) return false;
  return true;
}

/**
 * true iif vector v is between min and max
 */
export function inBounds2(v: V2, min: V2, max: V2): boolean {
  return inBounds(v[0], min[0], max[0]) && inBounds(v[1], min[1], max[1]);
}
