import * as THREE from 'three';
import { finish } from './textures';

/** A 3D guitar built from the same body/finish/pickup choices as the Workshop. About 1.1 m long, face towards +z, headstock up (+y). */
export interface Build {
  body?: string;
  finish?: string;
  fretboard?: string;
  pickup?: string;
}

type Ell = [number, number, number, number, number];
const BODIES: Record<string, Ell[]> = {
  double: [[100, 372, 70, 62, 0], [100, 306, 48, 46, 0], [68, 276, 15, 27, -18], [134, 284, 12, 20, 18]],
  single: [[100, 372, 68, 64, 0], [92, 305, 52, 48, 0], [133, 290, 12, 21, 20]],
  offset: [[104, 374, 70, 60, -10], [96, 306, 48, 44, -10], [62, 264, 14, 36, -22], [140, 284, 11, 22, 22]],
  hollow: [[100, 370, 78, 66, 0], [100, 292, 60, 54, 0]],
  dread: [[100, 370, 74, 64, 0], [100, 290, 58, 52, 0], [100, 330, 62, 40, 0]],
};
const BOARD: Record<string, string> = { rosewood: '#3B2418', maple: '#E2C28A', ebony: '#17110D' };
const K = 0.0024;
const X = (x: number) => (x - 100) * K;
const Y = (y: number) => (450 - y) * K - 0.54;

function inside(e: Ell[], x: number, y: number) {
  return e.some(([cx, cy, rx, ry, deg]) => {
    const t = (deg * Math.PI) / 180;
    const dx = x - cx;
    const dy = y - cy;
    const lx = dx * Math.cos(t) + dy * Math.sin(t);
    const ly = -dx * Math.sin(t) + dy * Math.cos(t);
    return (lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) <= 1;
  });
}

const shapeCache = new Map<string, THREE.Shape>();
function bodyShape(kind: string): THREE.Shape {
  const hit = shapeCache.get(kind);
  if (hit) return hit;
  const e = BODIES[kind] ?? BODIES.double;
  const cx = 100;
  const cy = 340;
  const pts: THREE.Vector2[] = [];
  const N = 160;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let r = 0;
    while (r < 200 && inside(e, cx + dx * r, cy + dy * r)) r += 1;
    let lo = r - 1;
    let hi = r;
    for (let k = 0; k < 8; k++) {
      const m = (lo + hi) / 2;
      if (inside(e, cx + dx * m, cy + dy * m)) lo = m;
      else hi = m;
    }
    pts.push(new THREE.Vector2(X(cx + dx * lo), Y(cy + dy * lo)));
  }
  // Shapes want counter-clockwise points in the x/y plane.
  pts.reverse();
  const s = new THREE.Shape(pts);
  shapeCache.set(kind, s);
  return s;
}

const mats = new Map<string, THREE.Material>();
function std(color: string, rough = 0.5, metal = 0): THREE.MeshStandardMaterial {
  const key = color + rough + metal;
  let m = mats.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
    mats.set(key, m);
  }
  return m;
}

export function makeGuitar(b: Build = {}): THREE.Group {
  const body = b.body && BODIES[b.body] ? b.body : 'double';
  const fin = b.finish ?? 'sunburst';
  const acoustic = body === 'dread';
  const hollow = body === 'hollow';
  const g = new THREE.Group();
  g.name = 'guitar';

  const depth = acoustic || hollow ? 0.09 : 0.04;
  const shape = bodyShape(body);
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 2, curveSegments: 4 });
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const W = bb.max.x - bb.min.x;
  const H = bb.max.y - bb.min.y;
  const tex = finish(fin).clone();
  tex.needsUpdate = true;
  tex.repeat.set(1 / W, 1 / H);
  tex.offset.set(-bb.min.x / W, -bb.min.y / H);
  const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.28, metalness: 0.05 });
  const side = std(acoustic ? '#EDE3CC' : fin === 'black' ? '#0d0d0d' : '#2a1a10', 0.4);
  const bodyMesh = new THREE.Mesh(geo, [top, side]);
  bodyMesh.position.z = -depth;
  g.add(bodyMesh);
  const zTop = 0.012;

  const neckEnd = acoustic ? 246 : hollow ? 250 : 285;
  const boardColor = BOARD[b.fretboard ?? 'rosewood'] ?? BOARD.rosewood;
  const neckLen = (neckEnd - 64) * K;
  const neck = new THREE.Mesh(new THREE.BoxGeometry(22 * K, neckLen, 0.028), std(boardColor, 0.6));
  neck.position.set(0, Y(64) - neckLen / 2, zTop + 0.004);
  g.add(neck);
  // Frets
  const fretMat = std('#c9cdd0', 0.25, 0.9);
  for (let n = 1; n <= 22; n++) {
    const y = 66 + 330 * (1 - Math.pow(2, -n / 12));
    if (y > neckEnd - 3) break;
    const f = new THREE.Mesh(new THREE.BoxGeometry(22 * K, 0.0025, 0.004), fretMat);
    f.position.set(0, Y(y), zTop + 0.02);
    g.add(f);
  }
  // Headstock
  const headColor = b.fretboard === 'maple' ? '#D8B479' : '#24170F';
  const head = new THREE.Mesh(new THREE.BoxGeometry(acoustic || hollow ? 32 * K : 28 * K, 60 * K, 0.02), std(headColor, 0.45));
  head.position.set(acoustic || hollow ? 0 : 2 * K, Y(36), zTop - 0.004);
  g.add(head);
  const nickel = std('#b9c1c6', 0.3, 0.9);
  const tuner = new THREE.CylinderGeometry(0.008, 0.008, 0.03, 8);
  for (let i = 0; i < 6; i++) {
    const t = new THREE.Mesh(tuner, nickel);
    t.rotation.z = Math.PI / 2;
    if (acoustic || hollow) t.position.set(i < 3 ? X(80) : X(120), Y(16 + (i % 3) * 14), zTop);
    else t.position.set(X(82), Y(14 + i * 8), zTop);
    g.add(t);
  }
  // Strings
  const bridgeY = acoustic ? 386 : hollow ? 392 : 396;
  const strMat = std('#dde1e4', 0.2, 1);
  for (let i = 0; i < 6; i++) {
    const len = (bridgeY - 10) * K;
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.0012 + (5 - i) * 0.0003, len, 0.0012), strMat);
    s.position.set(X(92.5 + i * 3), Y(10) - len / 2, zTop + 0.032);
    g.add(s);
  }
  // Hardware
  if (acoustic) {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(19 * K, 32), std('#120b06', 0.9));
    hole.position.set(0, Y(294), zTop + 0.001);
    g.add(hole);
    const ring = new THREE.Mesh(new THREE.RingGeometry(20 * K, 23 * K, 40), std('#e4d6b8', 0.5));
    ring.position.set(0, Y(294), zTop + 0.0015);
    g.add(ring);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(60 * K, 10 * K, 0.012), std('#2a1a10', 0.5));
    bridge.position.set(0, Y(386), zTop + 0.006);
    g.add(bridge);
  } else {
    if (hollow) {
      for (const sx of [-1, 1]) {
        const f = new THREE.Mesh(new THREE.BoxGeometry(4 * K, 60 * K, 0.002), std('#120b06', 0.9));
        f.position.set(X(100 + sx * 40), Y(335), zTop + 0.001);
        f.rotation.z = sx * 0.12;
        g.add(f);
      }
    }
    const pick = b.pickup ?? 'single';
    const spots: [number, number][] =
      pick === 'single' ? [[300, 0], [330, 0], [364, -0.14]] : hollow ? [[300, 0], [340, 0]] : [[302, 0], [360, 0]];
    for (const [y, rot] of spots) {
      const dark = pick === 'humbucker';
      const w = pick === 'single' ? 44 : 48;
      const h = pick === 'single' ? 10 : pick === 'humbucker' ? 18 : 16;
      const p = new THREE.Mesh(new THREE.BoxGeometry(w * K, h * K, 0.012), std(dark ? '#141414' : '#EFE8D8', 0.5));
      p.position.set(0, Y(y), zTop + 0.006);
      p.rotation.z = rot;
      g.add(p);
    }
    const br = new THREE.Mesh(new THREE.BoxGeometry(56 * K, 9 * K, 0.014), nickel);
    br.position.set(0, Y(hollow ? 362 : bridgeY), zTop + 0.008);
    g.add(br);
    const knob = new THREE.CylinderGeometry(6 * K, 6 * K, 0.018, 16);
    const knobs: [number, number][] = hollow ? [[140, 395], [150, 378]] : [[142, 392], [152, 410], [130, 414]];
    for (const [x, y] of knobs) {
      const k = new THREE.Mesh(knob, std('#e8e1d2', 0.4));
      k.rotation.x = Math.PI / 2;
      k.position.set(X(x), Y(y), zTop + 0.01);
      g.add(k);
    }
  }
  return g;
}

/** Frees the per-guitar geometry and finish texture. */
export function disposeGuitar(g: THREE.Object3D): void {
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry.dispose();
    const mm = m.material;
    if (Array.isArray(mm)) {
      const t = (mm[0] as THREE.MeshStandardMaterial).map;
      if (t) t.dispose();
      mm[0].dispose();
    }
  });
}
