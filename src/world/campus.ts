import * as THREE from 'three';
import { WINGS, type Wing } from '../wings';
import {
  BRIDGE_Z, FRETS, HEADSTOCK, HEAD_END_Z, JOINT_Z, NECK, NUT_Z, OPEN_MIDI, POSTS, SOUNDHOLE, STRING_Y, TUNERS,
  bodyOutline, fretZ, neckHalf, stringX, type P,
} from './geo';
import { box, cyl, glow, makePavilion, mat, worldHalf } from './pavilions';
import { makeLabel } from './labels';
import { grain, lawn, neonSign } from './textures';

export interface Collider { x: number; z: number; hw: number; hd: number; r?: number }

export interface Campus {
  group: THREE.Group;
  colliders: Collider[];
  strings: THREE.Mesh[];
  pavilions: Map<string, THREE.Group>;
  pickables: THREE.Object3D[];
  update(t: number, dt: number): void;
  pluckVisual(s: number): void;
}

const shapeFrom = (pts: P[]) => new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, -p.z)));

/** Flat slab from a ground outline (drawn in x/-z and laid down on the ground). */
function slab(pts: P[], height: number, m: THREE.Material | THREE.Material[], y = 0): THREE.Mesh {
  const geo = new THREE.ExtrudeGeometry(shapeFrom(pts), { depth: height, bevelEnabled: false, curveSegments: 1 });
  const mesh = new THREE.Mesh(geo, m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  return mesh;
}

export function buildCampus(): Campus {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const pickables: THREE.Object3D[] = [];

  // Lawn
  const lawnMesh = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshStandardMaterial({ map: lawn(), roughness: 1 }));
  lawnMesh.rotation.x = -Math.PI / 2;
  lawnMesh.position.set(0, -0.02, -100);
  group.add(lawnMesh);

  // Body: cream binding, then a spruce top with the grain running along the neck.
  const outline = bodyOutline(200);
  const bigger = outline.map((p) => ({ x: p.x * 1.018, z: 8 + (p.z - 8) * 1.018 }));
  group.add(slab(bigger, 0.26, mat('#e8dcc2', { rough: 0.6 })));
  const topTex = grain('spruce', '#d9b27a', '#8a5a2b', [1, 1], 140);
  topTex.wrapS = topTex.wrapT = THREE.RepeatWrapping;
  topTex.repeat.set(1 / 60, 1 / 120);
  topTex.rotation = 0;
  const top = slab(outline, 0.3, [new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.55 }), mat('#5a3a1e')]);
  group.add(top);

  // Soundhole: a dark pond with a rosette of inlaid rings.
  const pond = new THREE.Mesh(new THREE.CircleGeometry(SOUNDHOLE.r, 64), new THREE.MeshStandardMaterial({ color: '#05070c', roughness: 0.08, metalness: 0.7 }));
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(SOUNDHOLE.x, 0.33, SOUNDHOLE.z);
  group.add(pond);
  const rings: [number, number, string][] = [[16.2, 17.4, '#1a120c'], [17.4, 18.2, '#efe3c8'], [18.2, 19.6, '#2b1a10'], [19.6, 20.1, '#efe3c8']];
  for (const [a, b, c] of rings) {
    const r = new THREE.Mesh(new THREE.RingGeometry(a, b, 72), mat(c, { rough: 0.5 }));
    r.rotation.x = -Math.PI / 2;
    r.position.set(SOUNDHOLE.x, 0.32, SOUNDHOLE.z);
    group.add(r);
  }
  const fountain = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.6, 5, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#9fd8ff', transparent: true, opacity: 0.35, depthWrite: false }));
  fountain.position.set(SOUNDHOLE.x, 2.8, SOUNDHOLE.z);
  group.add(fountain);
  colliders.push({ x: SOUNDHOLE.x, z: SOUNDHOLE.z, hw: 0, hd: 0, r: SOUNDHOLE.r + 0.2 });

  // Bridge plate on the body, with the saddle raised on pylons as a gateway.
  box(group, 44, 0.45, 9, mat('#2a1a10', { rough: 0.55 }), 0, 0.3, BRIDGE_Z + 2);
  for (const sx of [-1, 1]) {
    box(group, 1.4, STRING_Y + 0.3, 1.4, mat('#e8dcc2', { rough: 0.5 }), sx * 17, 0.3, BRIDGE_Z);
    colliders.push({ x: sx * 17, z: BRIDGE_Z, hw: 0.8, hd: 0.8 });
  }
  box(group, 36, 0.5, 0.9, mat('#efe6d2', { rough: 0.4 }), 0, STRING_Y - 0.2, BRIDGE_Z);
  for (let s = 0; s < 6; s++) {
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), glow('#fff1cf', 1.4));
    pin.position.set(stringX(s, BRIDGE_Z), 0.95, BRIDGE_Z + 3.6);
    group.add(pin);
  }

  // Neck: a rosewood fretboard with nickel frets, dot inlays that glow, and a bone nut gateway.
  const board = slab(NECK, 0.34, [new THREE.MeshStandardMaterial({ map: grain('rosewood', '#3b2418', '#1a0d07', [1, 1], 120), roughness: 0.7 }), mat('#1a0d07')]);
  const bTex = ((board.material as THREE.Material[])[0] as THREE.MeshStandardMaterial).map!;
  bTex.wrapS = bTex.wrapT = THREE.RepeatWrapping;
  bTex.repeat.set(1 / 60, 1 / 60);
  group.add(board);
  const fretMat = mat('#c9cdd0', { metal: 0.9, rough: 0.25 });
  FRETS.forEach((z) => {
    const hw = neckHalf(z);
    box(group, hw * 2, 0.22, 0.7, fretMat, 0, 0.3, z);
  });
  const inlay = glow('#fff4dc', 0.9);
  for (const n of [3, 5, 7, 9, 12]) {
    const z = (fretZ(n) + fretZ(n - 1)) / 2;
    for (const x of n === 12 ? [-7, 7] : [0]) {
      const d = new THREE.Mesh(new THREE.CircleGeometry(3, 40), inlay);
      d.rotation.x = -Math.PI / 2;
      d.position.set(x, 0.36, z);
      group.add(d);
    }
  }
  // Nut gateway
  box(group, neckHalf(NUT_Z) * 2, 0.6, 1.6, mat('#efe6d2', { rough: 0.4 }), 0, 0.3, NUT_Z);
  for (const sx of [-1, 1]) {
    box(group, 1.4, STRING_Y + 0.3, 1.4, mat('#efe6d2', { rough: 0.4 }), sx * 15, 0.3, NUT_Z);
    colliders.push({ x: sx * 15, z: NUT_Z, hw: 0.8, hd: 0.8 });
  }
  box(group, 31, 0.5, 1, mat('#efe6d2', { rough: 0.4 }), 0, STRING_Y - 0.2, NUT_Z);

  // Headstock: black face with the tuners as pearl-buttoned lamp posts.
  group.add(slab(HEADSTOCK, 0.36, [mat('#15100d', { rough: 0.35, metal: 0.1 }), mat('#0b0806')]));
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(24, 6), new THREE.MeshBasicMaterial({ map: neonSign('Six-String', '#e9c77b', 1024, 256), transparent: true, opacity: 0.85 }));
  logo.rotation.x = -Math.PI / 2;
  logo.position.set(0, 0.4, HEAD_END_Z + 10);
  group.add(logo);
  const nickel = mat('#c9cdd0', { metal: 0.9, rough: 0.25 });
  POSTS.forEach((p, i) => {
    cyl(group, 0.7, 0.9, STRING_Y + 0.4, nickel, p.x, 0.3, p.z, 16);
    colliders.push({ x: p.x, z: p.z, hw: 1, hd: 1 });
    const t = TUNERS[i];
    cyl(group, 0.3, 0.3, 2.4, nickel, t.x, 0.3, t.z, 8);
    const btn = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 14), glow('#fff6e2', 0.7));
    btn.scale.set(1.3, 0.8, 0.5);
    btn.position.set(t.x, 3.6, t.z);
    btn.userData = { tip: `Tuning key: ${['low E', 'A', 'D', 'G', 'B', 'high E'][i]} string`, pluck: i };
    group.add(btn);
    pickables.push(btn);
  });

  // Strings: six glowing cables from the saddle to the nut, then to their posts.
  const strings: THREE.Mesh[] = [];
  for (let s = 0; s < 6; s++) {
    const r = 0.16 - s * 0.018;
    const m = glow('#fff1cf', 1.1).clone();
    const a = new THREE.Vector3(stringX(s, BRIDGE_Z), STRING_Y, BRIDGE_Z);
    const b = new THREE.Vector3(stringX(s, NUT_Z), STRING_Y, NUT_Z);
    const main = cable(a, b, r, m);
    main.userData = { tip: `${['Low E', 'A', 'D', 'G', 'B', 'High E'][s]} string · click to play`, pluck: s, string: s, base: main.position.clone() };
    group.add(main);
    strings.push(main);
    pickables.push(main);
    const post = POSTS[s];
    group.add(cable(b, new THREE.Vector3(post.x, STRING_Y + 0.2, post.z), r, m));
  }

  // Entrance gate at the tail, where a strap button would be.
  for (const sx of [-1, 1]) {
    box(group, 1.6, 8, 1.6, mat('#2a1a10'), sx * 9, 0, 118);
    colliders.push({ x: sx * 9, z: 118, hw: 1, hd: 1 });
  }
  const arch = new THREE.Mesh(new THREE.PlaneGeometry(20, 4), new THREE.MeshBasicMaterial({ map: neonSign('The Six-String Museum', '#e9a23b', 1280, 256), toneMapped: false, side: THREE.DoubleSide }));
  arch.position.set(0, 9.2, 118);
  group.add(arch);

  // A giant pick sculpture balancing the waist.
  const pick = new THREE.Shape();
  pick.moveTo(0, -4.5);
  pick.bezierCurveTo(3, -1.5, 4.6, 1.5, 4, 3.5);
  pick.bezierCurveTo(3, 5, -3, 5, -4, 3.5);
  pick.bezierCurveTo(-4.6, 1.5, -3, -1.5, 0, -4.5);
  const pm = new THREE.Mesh(new THREE.ExtrudeGeometry(pick, { depth: 0.6, bevelEnabled: true, bevelSize: 0.2, bevelThickness: 0.2 }), mat('#e9a23b', { rough: 0.25, metal: 0.3, emissive: '#5a3208', ei: 1 }));
  pm.position.set(38, 5.3, 14);
  pm.rotation.y = -0.6;
  pm.name = 'spin';
  group.add(pm);
  cyl(group, 1.6, 2, 0.8, mat('#2a1a10'), 38, 0.3, 14, 20);
  colliders.push({ x: 38, z: 14, hw: 2.4, hd: 2.4 });

  // Lamp posts down both sides of the promenade.
  const lampHead = glow('#ffd79a', 2);
  const lampPost = mat('#1b1714', { rough: 0.6 });
  const lampZ = [...FRETS.filter((_, i) => i % 2 === 1), 20, 40, 80, 100];
  for (const z of lampZ) {
    for (const sx of [-1, 1]) {
      const x = sx * (z < JOINT_Z ? 13.5 : 26);
      cyl(group, 0.12, 0.16, 5.5, lampPost, x, 0.3, z, 8);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), lampHead);
      h.position.set(x, 6, z);
      group.add(h);
    }
  }

  // Pavilions
  const pavilions = new Map<string, THREE.Group>();
  for (const w of WINGS) {
    const p = makePavilion(w);
    p.position.set(w.x, 0.3, w.z);
    p.rotation.y = w.rot;
    p.userData = { wing: w.id, tip: `${w.letter} · ${w.name}` };
    group.add(p);
    pavilions.set(w.id, p);
    pickables.push(p);
    const { hx, hz } = worldHalf(w);
    colliders.push({ x: w.x, z: w.z, hw: hx + 0.2, hd: hz + 0.2 });
    const label = makeLabel(w.letter, w.name, w.blurb, w.neon);
    label.position.set(w.x, labelHeight(w) + 0.3, w.z);
    group.add(label);
  }

  const chase = group.getObjectsByProperty('name', 'chase');
  const spinners = group.getObjectsByProperty('name', 'spin');
  const vib = new Float32Array(6);

  return {
    group,
    colliders,
    strings,
    pavilions,
    pickables,
    update(t, dt) {
      for (const o of spinners) o.rotation.y += dt * 0.5;
      for (const o of chase) {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
        m.emissiveIntensity = ((Math.floor(t * 8) + (o.userData.i as number)) % 3 === 0) ? 3 : 0.6;
      }
      fountain.scale.y = 1 + Math.sin(t * 3) * 0.12;
      strings.forEach((s, i) => {
        if (vib[i] <= 0.001) return;
        vib[i] *= Math.exp(-dt * 2.2);
        const base = s.userData.base as THREE.Vector3;
        s.position.x = base.x + Math.sin(t * 55 + i) * vib[i] * 0.5;
        const m = s.material as THREE.MeshStandardMaterial;
        m.emissiveIntensity = 1.1 + vib[i] * 3;
        if (vib[i] <= 0.001) s.position.copy(base);
      });
    },
    pluckVisual(s) {
      vib[s] = 1;
    },
  };
}

function cable(a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material): THREE.Mesh {
  const len = a.distanceTo(b);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6, 1, true), m);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return mesh;
}

function labelHeight(w: Wing): number {
  const h: Record<string, number> = { hall: 17, workshop: 12, roulette: 17, pedalboard: 12, detective: 17, teacher: 27, tarot: 17, woods: 13, speedrun: 12, tree: 14, hospital: 15 };
  return h[w.id] ?? 12;
}

export const STRING_OPEN = OPEN_MIDI;
