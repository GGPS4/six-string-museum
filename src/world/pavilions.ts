import * as THREE from 'three';
import type { Wing } from '../wings';
import { brick, grain, logs, neonSign, stripes } from './textures';

/**
 * Exterior buildings, one architecture per wing. Built in local space with the
 * door in the middle of the +z wall and the ground at y = 0.
 */

const matCache = new Map<string, THREE.Material>();
export function mat(color: string, o: { rough?: number; metal?: number; emissive?: string; ei?: number } = {}): THREE.MeshStandardMaterial {
  const key = [color, o.rough, o.metal, o.emissive, o.ei].join('|');
  let m = matCache.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.8, metalness: o.metal ?? 0, emissive: o.emissive ?? '#000000', emissiveIntensity: o.ei ?? 1 });
    matCache.set(key, m);
  }
  return m;
}
export const glow = (color: string, intensity = 1.6) => mat('#000000', { emissive: color, ei: intensity });
export const basic = (color: string) => new THREE.MeshBasicMaterial({ color });

export function box(parent: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y + h / 2, z);
  parent.add(mesh);
  return mesh;
}
export function cyl(parent: THREE.Object3D, rt: number, rb: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 24): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.position.set(x, y + h / 2, z);
  parent.add(mesh);
  return mesh;
}

function door(g: THREE.Group, w: Wing, width = 2.6, height = 3.4) {
  const z = w.d / 2;
  box(g, width + 0.5, height + 0.3, 0.3, mat('#1b1512', { rough: 0.6 }), 0, 0, z + 0.05);
  const light = new THREE.Mesh(new THREE.PlaneGeometry(width, height), glow(w.neon, 0.55));
  light.position.set(0, height / 2, z + 0.22);
  light.name = 'door';
  g.add(light);
  // A warm pool of light on the ground outside.
  const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), new THREE.MeshBasicMaterial({ color: w.neon, transparent: true, opacity: 0.16, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.03, z + 2.4);
  g.add(pool);
}

function sign(g: THREE.Group, w: Wing, y: number, width: number, z = w.d / 2 + 0.25) {
  const tex = neonSign(w.name, w.neon);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  s.position.set(0, y, z);
  g.add(s);
}

function windows(g: THREE.Group, w: number, y: number, z: number, count: number, color = '#ffcf7a', ww = 1.4, wh = 1.8) {
  const m = glow(color, 0.9);
  for (let i = 0; i < count; i++) {
    const x = -w / 2 + (w / count) * (i + 0.5);
    if (Math.abs(x) < 2) continue;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), m);
    p.position.set(x, y, z);
    g.add(p);
  }
}

export function makePavilion(w: Wing): THREE.Group {
  const g = new THREE.Group();
  g.name = 'pavilion:' + w.id;
  const W = w.w;
  const D = w.d;
  switch (w.id) {
    case 'hall': {
      const stone = mat('#cfc6b4', { rough: 0.85 });
      box(g, W + 2, 0.6, D + 3, mat('#9d9483'), 0, 0, 0.8);
      box(g, W, 9, D, stone, 0, 0.6, 0);
      for (let i = 0; i < 6; i++) {
        const x = -W / 2 + 2 + (i * (W - 4)) / 5;
        if (Math.abs(x) < 2.2) continue;
        cyl(g, 0.55, 0.62, 8.4, mat('#e8e0cf', { rough: 0.7 }), x, 0.6, D / 2 + 1.2, 16);
      }
      box(g, W + 1, 1, 3, stone, 0, 9, D / 2 + 0.3);
      const ped = new THREE.Shape([new THREE.Vector2(-W / 2 - 0.5, 0), new THREE.Vector2(W / 2 + 0.5, 0), new THREE.Vector2(0, 3.4)]);
      const pm = new THREE.Mesh(new THREE.ExtrudeGeometry(ped, { depth: 3, bevelEnabled: false }), stone);
      pm.position.set(0, 10, D / 2 - 1.2);
      g.add(pm);
      windows(g, W, 5, D / 2 + 0.01, 6, '#ffd89a', 1.2, 3);
      door(g, w, 2.8, 4.2);
      sign(g, w, 11.6, 9, D / 2 + 1.85);
      break;
    }
    case 'workshop': {
      const wood = mat('#8a5f38', { rough: 0.85 });
      box(g, W, 6, D, new THREE.MeshStandardMaterial({ map: grain('barn', '#7a5230', '#3b2412', [3, 1], 60), roughness: 0.9 }), 0, 0, 0);
      // Sawtooth roof with glowing north lights.
      for (let i = 0; i < 4; i++) {
        const z = -D / 2 + (i + 0.5) * (D / 4);
        const s = new THREE.Shape([new THREE.Vector2(-D / 8, 0), new THREE.Vector2(D / 8, 0), new THREE.Vector2(D / 8, 2.4)]);
        const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: W, bevelEnabled: false }), mat('#3a2e27', { rough: 0.7 }));
        m.rotation.y = Math.PI / 2;
        m.position.set(-W / 2, 6, z);
        g.add(m);
        const lit = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.4, 2.2), glow('#ffcf7a', 0.8));
        lit.position.set(0, 7.2, z + D / 8 - 0.02);
        g.add(lit);
      }
      box(g, 0.6, 4, 2.2, wood, W / 2 + 1.2, 0, D / 2 + 1);
      box(g, 3.2, 0.5, 1, wood, W / 2 + 2, 0, D / 2 + 3);
      box(g, 3.2, 0.5, 1, wood, W / 2 + 2, 0.5, D / 2 + 3);
      windows(g, W, 3, D / 2 + 0.01, 5, '#ffcf7a', 2.2, 1.6);
      door(g, w, 4.2, 4.2);
      sign(g, w, 5.2, 8);
      break;
    }
    case 'roulette': {
      const body = mat('#3a0f2a', { rough: 0.5 });
      box(g, W, 6, D, body, 0, 0, 0);
      const arch = new THREE.Mesh(new THREE.CylinderGeometry(W / 2, W / 2, D, 32, 1, false, -Math.PI / 2, Math.PI), body);
      arch.rotation.x = Math.PI / 2;
      arch.rotation.y = Math.PI / 2;
      arch.position.set(0, 6, 0);
      g.add(arch);
      const cols = ['#ff5fa2', '#ffd24a', '#56f0ff', '#9dff8a'];
      cols.forEach((c, i) => {
        const t = new THREE.Mesh(new THREE.TorusGeometry(W / 2 - 0.6 - i * 0.9, 0.16, 8, 48, Math.PI), glow(c, 2.2));
        t.position.set(0, 6, D / 2 + 0.1);
        g.add(t);
      });
      // Reel windows
      for (let i = 0; i < 3; i++) {
        const r = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.6), glow(['#ffd24a', '#ff5fa2', '#56f0ff'][i], 0.9));
        r.position.set(-4 + i * 4, 9, D / 2 + 0.05);
        if (i !== 1) g.add(r);
      }
      // The lever
      cyl(g, 0.18, 0.18, 5, mat('#c9cdd0', { metal: 0.9, rough: 0.3 }), W / 2 + 0.6, 3, 0);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), glow('#ff3b3b', 1.4));
      ball.position.set(W / 2 + 0.6, 8.3, 0);
      g.add(ball);
      door(g, w);
      sign(g, w, 4.6, 8);
      break;
    }
    case 'pedalboard': {
      const shell = mat('#2f8a47', { rough: 0.35, metal: 0.2 });
      box(g, W, 7, D, shell, 0, 0, 0);
      box(g, W - 0.6, 0.4, D - 0.6, mat('#257a3b', { rough: 0.4 }), 0, 7, 0);
      const knob = mat('#141414', { rough: 0.5 });
      for (const x of [-5, 0, 5]) {
        cyl(g, 1.3, 1.4, 1.6, knob, x, 7.4, -3, 24);
        box(g, 0.2, 0.2, 1.1, glow('#ffffff', 0.8), x, 9.0, -3.4);
      }
      // Footswitch on the roof and the red LED
      cyl(g, 1.7, 2.1, 1.2, mat('#b9c1c6', { metal: 0.9, rough: 0.25 }), 0, 7.4, 3);
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), glow('#ff3b2e', 3));
      led.position.set(0, 8, 0.6);
      g.add(led);
      // Input and output jacks on the sides
      for (const sx of [-1, 1]) {
        const j = cyl(g, 0.8, 0.8, 0.6, mat('#c9cdd0', { metal: 0.9, rough: 0.3 }), sx * (W / 2 + 0.3), 3.2, 0, 20);
        j.rotation.z = Math.PI / 2;
      }
      door(g, w);
      sign(g, w, 5.3, 9);
      break;
    }
    case 'detective': {
      box(g, W, 8, D, new THREE.MeshStandardMaterial({ map: brick(), roughness: 0.9 }), 0, 0, 0);
      box(g, W + 0.4, 0.5, D + 0.4, mat('#2a2522'), 0, 8, 0);
      // Water tower
      for (const [x, z] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) cyl(g, 0.1, 0.1, 2.6, mat('#3a3230'), x - 3, 8.5, z - 2, 6);
      cyl(g, 2, 2, 2.6, new THREE.MeshStandardMaterial({ map: grain('tank', '#6b4b33', '#2e1d12', [2, 1], 30), roughness: 0.9 }), -3, 11.1, -2, 20);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.2, 20), mat('#2a2522'));
      cone.position.set(-3, 14.3, -2);
      g.add(cone);
      windows(g, W, 5.6, D / 2 + 0.01, 4, '#9fc7ff', 1.8, 1.6);
      // The neon question mark
      const q = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.2, 8, 32, Math.PI * 1.4), glow('#7fb8ff', 2.5));
      q.position.set(W / 2 - 1.2, 10, D / 2 + 0.1);
      q.rotation.z = -Math.PI / 2;
      g.add(q);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), glow('#7fb8ff', 2.5));
      dot.position.set(W / 2 - 1.2, 7.8, D / 2 + 0.1);
      g.add(dot);
      door(g, w);
      sign(g, w, 4.4, 7);
      break;
    }
    case 'teacher': {
      const stone = mat('#e6dccb', { rough: 0.85 });
      box(g, W + 3, 0.8, D + 4, mat('#a39a88'), 0, 0, 1);
      box(g, W, 11, D, stone, 0, 0.8, 0);
      box(g, W * 0.45, 4, D * 0.7, stone, 0, 11.8, -1);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(6.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat('#5f7d74', { rough: 0.5, metal: 0.3 }));
      dome.position.set(0, 15.8, -1);
      g.add(dome);
      const lantern = cyl(g, 0.9, 0.9, 1.6, glow('#ffe08a', 1.2), 0, 22, -1, 12);
      lantern.name = 'lantern';
      for (let i = 0; i < 8; i++) {
        const x = -W / 2 + 2.5 + (i * (W - 5)) / 7;
        if (Math.abs(x) < 3) continue;
        cyl(g, 0.6, 0.7, 10, mat('#f1e9da', { rough: 0.7 }), x, 0.8, D / 2 + 1.4, 16);
      }
      box(g, W + 1, 1.1, 3.4, stone, 0, 10.8, D / 2 + 0.6);
      // A frieze of music staff lines
      for (let i = 0; i < 5; i++) box(g, W - 2, 0.07, 0.05, glow('#ffe08a', 0.9), 0, 8.4 + i * 0.35, D / 2 + 0.03);
      windows(g, W, 5, D / 2 + 0.01, 8, '#ffe8b0', 1.3, 3.2);
      door(g, w, 3.2, 5);
      sign(g, w, 12.9, 12, D / 2 + 2.35);
      break;
    }
    case 'tarot': {
      const t = stripes('#5b2a86', '#e9d6ff');
      t.wrapS = THREE.RepeatWrapping;
      t.repeat.set(2, 1);
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(W / 2, W / 2, 5, 32, 1, true), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.8 }));
      wall.position.y = 2.5;
      g.add(wall);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(W / 2 + 0.6, 6, 32), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
      roof.position.y = 8;
      g.add(roof);
      cyl(g, 0.08, 0.08, 2, mat('#c9a74a', { metal: 0.8, rough: 0.3 }), 0, 11, 0, 6);
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), glow('#ffd86b', 2.2));
      star.position.set(0, 13.4, 0);
      star.name = 'spin';
      g.add(star);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.9, 20, 16), glow('#c58bff', 1.6));
      orb.position.set(-2.8, 3, W / 2 - 0.6);
      g.add(orb);
      door(g, { ...w, d: W - 0.4 }, 2.2, 3.2);
      sign(g, { ...w }, 5.6, 6, W / 2 + 0.2);
      break;
    }
    case 'woods': {
      box(g, W, 6, D, new THREE.MeshStandardMaterial({ map: logs(), roughness: 0.9 }), 0, 0, 0);
      const roofM = mat('#2d3a2a', { rough: 0.9 });
      for (const s of [-1, 1]) {
        const r = box(g, W / 2 + 1.6, 0.4, D + 1.4, roofM, s * (W / 4 + 0.2), 7.3, 0);
        r.rotation.z = -s * 0.62;
      }
      const gable = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(0, 3.6)]);
      for (const z of [D / 2, -D / 2 - 0.2]) {
        const gm = new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth: 0.2, bevelEnabled: false }), mat('#6b4424'));
        gm.position.set(0, 6, z);
        g.add(gm);
      }
      cyl(g, 0.5, 0.5, 5, mat('#4a3a33'), W / 2 - 1.5, 6, -2, 10);
      windows(g, W, 3, D / 2 + 0.01, 3, '#ffc56b', 1.8, 1.8);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), glow('#ffc56b', 2));
      lamp.position.set(2, 4.2, D / 2 + 0.6);
      g.add(lamp);
      door(g, w, 2.2, 3.2);
      sign(g, w, 7.4, 6, D / 2 + 0.3);
      break;
    }
    case 'speedrun': {
      box(g, W, 7, D, mat('#15122a', { rough: 0.5 }), 0, 0, 0);
      box(g, W + 0.8, 2.6, 1, mat('#0b0a16'), 0, 7, D / 2 - 0.3);
      sign(g, w, 8.3, W + 0.4, D / 2 + 0.25);
      const bulb = new THREE.SphereGeometry(0.16, 8, 6);
      const cols = ['#56f0ff', '#ff5fa2', '#ffd24a'];
      for (let i = 0; i < 18; i++) {
        const b = new THREE.Mesh(bulb, glow(cols[i % 3], 2).clone());
        const t = i / 17;
        b.position.set(-W / 2 + 0.3 + t * (W - 0.6), 6.8, D / 2 + 0.3);
        b.name = 'chase';
        b.userData.i = i;
        g.add(b);
      }
      // Pixel fret markers on the facade
      for (let i = 0; i < 5; i++) box(g, 0.6, 0.6, 0.05, glow('#56f0ff', 1.5), -3 + i * 1.5, 4.8, D / 2 + 0.02);
      door(g, w, 2.4, 3.4);
      break;
    }
    case 'tree': {
      const glass = new THREE.MeshPhysicalMaterial({ color: '#bfe8d0', roughness: 0.1, metalness: 0, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });
      box(g, W, 7, D, glass, 0, 0, 0);
      const frame = mat('#e8efe9', { rough: 0.4, metal: 0.4 });
      for (const x of [-W / 2, 0, W / 2]) for (const z of [-D / 2, D / 2]) box(g, 0.18, 7, 0.18, frame, x, 0, z);
      const gable = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(0, 3)]);
      const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth: D, bevelEnabled: false }), glass);
      roof.position.set(0, 7, -D / 2);
      g.add(roof);
      cyl(g, 0.5, 0.8, 7, mat('#4a3122', { rough: 0.9 }), 0, 0, -1, 10);
      const leaf = mat('#2f6a36', { rough: 0.8, emissive: '#0d2a10', ei: 1 });
      for (const [x, y, z, r] of [[0, 8.6, -1, 3.2], [-2, 7.4, 0, 2.2], [2, 7.6, -2, 2.4], [0.5, 10.4, -1, 2.2]]) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), leaf);
        s.position.set(x, y, z);
        g.add(s);
      }
      for (let i = 0; i < 9; i++) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), glow('#ffd86b', 1.2));
        const a = i * 2.2;
        f.position.set(Math.cos(a) * 2.6, 7.5 + (i % 3) * 1.1, -1 + Math.sin(a) * 2.2);
        g.add(f);
      }
      door(g, w, 2.2, 3.2);
      sign(g, w, 4.8, 6);
      break;
    }
    case 'hospital': {
      box(g, W, 7.5, D, mat('#e9ece8', { rough: 0.6 }), 0, 0, 0);
      box(g, W + 0.4, 0.4, D + 0.4, mat('#9aa3a6'), 0, 7.5, 0);
      windows(g, W, 5.2, D / 2 + 0.01, 4, '#dff6ff', 1.6, 1.4);
      // A guitar pick with a red cross, lit up on the roof
      const pick = new THREE.Shape();
      pick.moveTo(0, -1.8);
      pick.bezierCurveTo(1.2, -0.6, 1.9, 0.6, 1.6, 1.4);
      pick.bezierCurveTo(1.2, 2.0, -1.2, 2.0, -1.6, 1.4);
      pick.bezierCurveTo(-1.9, 0.6, -1.2, -0.6, 0, -1.8);
      const pm = new THREE.Mesh(new THREE.ExtrudeGeometry(pick, { depth: 0.3, bevelEnabled: false }), glow('#ffffff', 1.2));
      pm.position.set(0, 10.2, 0);
      g.add(pm);
      box(g, 0.6, 2, 0.1, glow('#ff3b3b', 2.4), 0, 9.6, 0.35);
      box(g, 2, 0.6, 0.1, glow('#ff3b3b', 2.4), 0, 10.3, 0.35);
      door(g, w);
      sign(g, w, 3.9 + 0.1, 7);
      break;
    }
  }
  return g;
}

/** Size of a pavilion in world axes after rotation. */
export function worldHalf(w: Wing): { hx: number; hz: number } {
  const sideways = Math.abs(Math.sin(w.rot)) > 0.5;
  if (w.id === 'tarot') return { hx: w.w / 2, hz: w.w / 2 };
  return sideways ? { hx: w.d / 2, hz: w.w / 2 } : { hx: w.w / 2, hz: w.d / 2 };
}
