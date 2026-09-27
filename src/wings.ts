/** The eleven wings and where their pavilions stand on the guitar-shaped campus. */
export type WingId =
  | 'hall' | 'workshop' | 'roulette' | 'pedalboard' | 'detective'
  | 'teacher' | 'tarot' | 'woods' | 'speedrun' | 'tree' | 'hospital';

export interface Wing {
  id: WingId;
  letter: string;
  name: string;
  blurb: string;
  /** Pavilion centre on the ground plane. */
  x: number;
  z: number;
  /** Footprint along the pavilion's own x (width) and z (depth, door side is +z). */
  w: number;
  d: number;
  /** Rotation so the door faces the promenade. */
  rot: number;
  /** Interior room half-sizes. */
  room: { hw: number; hd: number };
  neon: string;
}

const L = Math.PI / 2; // door faces +x (building on the bass side)
const R = -Math.PI / 2; // door faces -x (treble side)

export const WINGS: Wing[] = [
  { id: 'hall', letter: 'A', name: 'Hall of Fame', blurb: 'Guitars and their stories', x: -42, z: 58, w: 26, d: 20, rot: L, room: { hw: 9, hd: 14 }, neon: '#ffd27a' },
  { id: 'workshop', letter: 'B', name: 'Luthier Workshop', blurb: 'Build one, hear it', x: 42, z: 58, w: 24, d: 20, rot: R, room: { hw: 8, hd: 8 }, neon: '#ffb45c' },
  { id: 'roulette', letter: 'C', name: 'Riff Roulette', blurb: 'Pull the lever, write a riff', x: -30, z: -44, w: 18, d: 15, rot: L, room: { hw: 7, hd: 8 }, neon: '#ff5fa2' },
  { id: 'pedalboard', letter: 'D', name: 'Pedalboard', blurb: 'Stomp on giant pedals', x: 30, z: -44, w: 18, d: 15, rot: R, room: { hw: 9, hd: 9 }, neon: '#6fe07f' },
  { id: 'detective', letter: 'E', name: 'Tone Detective', blurb: 'Guess the gear by ear', x: -38, z: 14, w: 16, d: 13, rot: L, room: { hw: 6, hd: 7 }, neon: '#7fb8ff' },
  { id: 'teacher', letter: 'F', name: 'Guitar Teacher', blurb: '50 short theory lessons', x: 0, z: -300, w: 40, d: 20, rot: 0, room: { hw: 10, hd: 11 }, neon: '#ffe08a' },
  { id: 'tarot', letter: 'G', name: 'Chord Tarot', blurb: 'Draw three, play the reading', x: -21, z: -192.6, w: 12, d: 13, rot: L, room: { hw: 5.5, hd: 6 }, neon: '#c58bff' },
  { id: 'woods', letter: 'H', name: 'Wood Library', blurb: 'Open a drawer, hear the grain', x: 21, z: -165.6, w: 11, d: 13, rot: R, room: { hw: 7, hd: 7 }, neon: '#e6b98a' },
  { id: 'speedrun', letter: 'I', name: 'Fretboard Speedrun', blurb: 'Find the note, beat the clock', x: -21, z: -141.6, w: 10, d: 13, rot: L, room: { hw: 6, hd: 7 }, neon: '#56f0ff' },
  { id: 'tree', letter: 'J', name: 'Family Tree', blurb: 'From the oud to the 7-string', x: 21, z: -120.2, w: 9, d: 13, rot: R, room: { hw: 8, hd: 8 }, neon: '#9dff8a' },
  { id: 'hospital', letter: 'K', name: 'Neck Hospital', blurb: 'Diagnose and fix sick guitars', x: 21, z: -223, w: 14, d: 13, rot: R, room: { hw: 7, hd: 8 }, neon: '#ff6b6b' },
];

export const wingById = (id: string): Wing | undefined => WINGS.find((w) => w.id === id);

/** World position just outside a pavilion's door, and the direction the door faces. */
export function doorOf(w: Wing): { x: number; z: number; nx: number; nz: number } {
  const nx = Math.sin(w.rot);
  const nz = Math.cos(w.rot);
  const out = w.d / 2 + 2.2;
  return { x: w.x + nx * out, z: w.z + nz * out, nx, nz };
}
