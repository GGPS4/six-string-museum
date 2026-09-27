/**
 * Campus geometry. The grounds are a giant acoustic-electric guitar lying face up,
 * headstock to the north (-z). Units are metres. Low E runs along the west (-x) side.
 */
export interface P { x: number; z: number }

export const LOWER = { x: 0, z: 45, r: 70 };
export const UPPER = { x: 0, z: -30, r: 56 };
export const SOUNDHOLE = { x: 0, z: -12, r: 16 };
export const BRIDGE_Z = 55;
/** Scale length of the giant guitar (nut to saddle). The 14th fret lands where the neck meets the body. */
export const SCALE = 303;
export const NUT_Z = BRIDGE_Z - SCALE; // -248
export const JOINT_Z = -80;
export const HEAD_END_Z = -324;
export const STRING_Y = 4.2;
export const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
export const STRING_NAMES = ['low E', 'A', 'D', 'G', 'B', 'high E'];

export const fretZ = (n: number): number => BRIDGE_Z - SCALE * Math.pow(2, -n / 12);
export const FRETS: number[] = Array.from({ length: 21 }, (_, i) => fretZ(i + 1)).filter((z) => z < JOINT_Z + 1);

/** Half-width of the neck at a given z. */
export const neckHalf = (z: number): number => 28 + 4 * Math.max(0, Math.min(1, (z - NUT_Z) / (JOINT_Z - NUT_Z)));

/** x of string s (0 = low E) at a given z between the saddle and the nut. */
export function stringX(s: number, z: number): number {
  const t = Math.max(0, Math.min(1, (BRIDGE_Z - z) / (BRIDGE_Z - NUT_Z)));
  const spread = 4.6 + (3.6 - 4.6) * t;
  return (s - 2.5) * spread;
}

/** The fret you'd be pressing if you stood at z on the neck (0 = open string over the body). */
export function fretAt(z: number): number {
  if (z >= JOINT_Z || z <= NUT_Z) return 0;
  const n = Math.ceil(-12 * Math.log2((BRIDGE_Z - z) / SCALE) - 1e-6);
  return Math.max(1, Math.min(20, n));
}

const inCircle = (p: P, c: { x: number; z: number; r: number }, pad = 0) => Math.hypot(p.x - c.x, p.z - c.z) < c.r + pad;

export function inBody(p: P, pad = 0): boolean {
  return inCircle(p, LOWER, pad) || inCircle(p, UPPER, pad);
}

export function inNeck(p: P): boolean {
  return p.z > NUT_Z && p.z < JOINT_Z + 20 && Math.abs(p.x) < neckHalf(p.z);
}

/** Headstock outline (clockwise), flaring from the nut. */
export const HEADSTOCK: P[] = [
  { x: -29, z: NUT_Z + 0.5 },
  { x: -36, z: -270 },
  { x: -39, z: -300 },
  { x: -34, z: -318 },
  { x: -16, z: HEAD_END_Z },
  { x: 0, z: HEAD_END_Z + 3 },
  { x: 16, z: HEAD_END_Z },
  { x: 34, z: -318 },
  { x: 39, z: -300 },
  { x: 36, z: -270 },
  { x: 29, z: NUT_Z + 0.5 },
];

export function inPoly(p: P, poly: P[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.z > p.z !== b.z > p.z && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}

export const onGuitar = (p: P): boolean => inBody(p) || inNeck(p) || inPoly(p, HEADSTOCK);

/** Outline of the two-bout body, sampled as a polygon (union of two circles). */
export function bodyOutline(steps = 180): P[] {
  const cz = 8;
  const pts: P[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const dx = Math.sin(a);
    const dz = -Math.cos(a);
    // March outwards from an inner point until we leave the union.
    let r = 0;
    while (r < 140 && inBody({ x: dx * r, z: cz + dz * r })) r += 0.5;
    let lo = r - 0.5;
    let hi = r;
    for (let k = 0; k < 12; k++) {
      const m = (lo + hi) / 2;
      if (inBody({ x: dx * m, z: cz + dz * m })) lo = m;
      else hi = m;
    }
    pts.push({ x: dx * lo, z: cz + dz * lo });
  }
  return pts;
}

/** Neck outline from the nut to where it disappears under the body. */
export const NECK: P[] = [
  { x: -neckHalf(NUT_Z), z: NUT_Z },
  { x: neckHalf(NUT_Z), z: NUT_Z },
  { x: neckHalf(JOINT_Z), z: JOINT_Z + 12 },
  { x: -neckHalf(JOINT_Z), z: JOINT_Z + 12 },
];

/** Tuning keys on the headstock: three per side, low E top-left like a real 3+3 headstock. */
export const TUNERS: P[] = [
  { x: -41, z: -266 }, { x: -44, z: -284 }, { x: -44, z: -302 },
  { x: 44, z: -302 }, { x: 44, z: -284 }, { x: 41, z: -266 },
];
/** String posts on the headstock face, matching TUNERS. */
export const POSTS: P[] = [
  { x: -30, z: -266 }, { x: -33, z: -284 }, { x: -33, z: -302 },
  { x: 33, z: -302 }, { x: 33, z: -284 }, { x: 30, z: -266 },
];
