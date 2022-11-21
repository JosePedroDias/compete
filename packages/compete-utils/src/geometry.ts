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
