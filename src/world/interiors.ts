import * as THREE from 'three';
import type { Wing, WingId } from '../wings';
import type { Collider } from './campus';
import { makeGuitar, disposeGuitar } from './guitar3d';
import { box, cyl, glow, mat } from './pavilions';
import { textSprite } from './labels';
import { DISPLAY, MONO, SERIF, drawPlate, fitText, freshTexture, grain, neonSign, redraw, stripes } from './textures';

/** What an interior needs from the rest of the app. */
export interface RoomApi {
  ssm: any;
  open(id: WingId): void;
  toast(msg: string): void;
}

export interface Room {
  group: THREE.Group;
  hw: number;
  hd: number;
  boxes: Collider[];
  pickables: THREE.Object3D[];
  update(t: number, dt: number): void;
  dispose(): void;
}

type Pick = { tip: string; onPick: () => void };
const pickable = (o: THREE.Object3D, p: Pick) => {
  o.userData.tip = p.tip;
  o.userData.onPick = p.onPick;
  return o;
};

interface Shell {
  floor: string | THREE.Material;
  wall: string | THREE.Material;
  height: number;
  light: string;
}

function shell(g: THREE.Group, hw: number, hd: number, s: Shell, neon: string) {
  const floorMat = typeof s.floor === 'string' ? mat(s.floor, { rough: 0.6 }) : s.floor;
  const wallMat = typeof s.wall === 'string' ? mat(s.wall, { rough: 0.85 }) : s.wall;
  const H = s.height;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, hd * 2), floorMat);
  floor.rotation.x = -Math.PI / 2;
  g.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, hd * 2), mat('#15110e', { rough: 1 }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = H;
  g.add(ceil);
  box(g, hw * 2, H, 0.3, wallMat, 0, 0, -hd - 0.15);
  box(g, 0.3, H, hd * 2, wallMat, -hw - 0.15, 0, 0);
  box(g, 0.3, H, hd * 2, wallMat, hw + 0.15, 0, 0);
  const side = hw - 1.3;
  box(g, side, H, 0.3, wallMat, -(1.3 + side / 2), 0, hd + 0.15);
  box(g, side, H, 0.3, wallMat, 1.3 + side / 2, 0, hd + 0.15);
  box(g, 2.6, H - 3.3, 0.3, wallMat, 0, 3.3, hd + 0.15);
  // The doorway looks out into the night.
  const night = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.3), new THREE.MeshBasicMaterial({ color: '#0a0d1a' }));
  night.position.set(0, 1.65, hd + 0.35);
  night.rotation.y = Math.PI;
  g.add(night);
  const exit = textSprite('Exit', '#7dff9a', 1.8);
  exit.position.set(0, 3.75, hd - 0.1);
  g.add(exit);
  // Skirting glow in the wing's colour
  const trim = glow(neon, 0.6);
  box(g, hw * 2, 0.06, 0.06, trim, 0, H - 0.3, -hd + 0.05);
  box(g, 0.06, 0.06, hd * 2, trim, -hw + 0.05, H - 0.3, 0);
  box(g, 0.06, 0.06, hd * 2, trim, hw - 0.05, H - 0.3, 0);
  // Lighting
  g.add(new THREE.HemisphereLight('#fff2dd', '#3a2e24', 1.6));
  const l1 = new THREE.PointLight(s.light, 26, hd * 3, 1.6);
  l1.position.set(0, H - 0.6, -hd * 0.3);
  g.add(l1);
  const l2 = new THREE.PointLight(s.light, 22, hd * 2.5, 1.6);
  l2.position.set(0, H - 0.6, hd * 0.55);
  g.add(l2);
}

function screen(w: number, h: number, draw: (g: CanvasRenderingContext2D, W: number, H: number) => void, basic = true) {
  const tex = freshTexture(Math.round(w * 200), Math.round(h * 200), draw);
  const m = basic ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  return { mesh, tex };
}

const listeners: [string, EventListener][] = [];
function on(ev: string, fn: EventListener) {
  document.addEventListener(ev, fn);
  listeners.push([ev, fn]);
}

export function buildRoom(w: Wing, api: RoomApi): Room {
  const g = new THREE.Group();
  g.name = 'room:' + w.id;
  const { hw, hd } = w.room;
  const boxes: Collider[] = [];
  const pickables: THREE.Object3D[] = [];
  const updaters: ((t: number, dt: number) => void)[] = [];
  const disposers: (() => void)[] = [];
  const S = api.ssm;
  const openHere = () => api.open(w.id);
  const add = (o: THREE.Object3D, p: Pick) => {
    pickable(o, p);
    pickables.push(o);
    return o;
  };
  const block = (x: number, z: number, bw: number, bd: number) => boxes.push({ x, z, hw: bw / 2, hd: bd / 2 });

  switch (w.id) {
    case 'hall': {
      shell(g, hw, hd, { floor: new THREE.MeshStandardMaterial({ map: grain('parquet', '#4a2c18', '#20120a', [4, 8], 70), roughness: 0.35 }), wall: '#5a1f22', height: 6, light: '#ffd9a0' }, w.neon);
      // Graveyard fence along the right wall
      const iron = mat('#1a1a1c', { metal: 0.6, rough: 0.5 });
      for (let z = -hd + 1; z < hd - 2; z += 0.6) cyl(g, 0.03, 0.03, 1, iron, hw - 1.3, 0, z, 6);
      box(g, 0.06, 0.06, hd * 2 - 3, iron, hw - 1.3, 0.95, -0.5);
      for (const [side, text, color] of [[-1, 'Hall of Fame', '#ffd27a'], [1, 'The Graveyard', '#b8b8c8']] as [number, string, string][]) {
        const sgn = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.75), new THREE.MeshBasicMaterial({ map: neonSign(text, color, 1024, 256), toneMapped: false }));
        sgn.position.set(side * (hw - 0.04), 4.9, -hd + 5);
        sgn.rotation.y = -side * Math.PI / 2;
        g.add(sgn);
      }
      // Donation kiosk at the back
      cyl(g, 0.7, 0.9, 1.1, mat('#2a1a10'), 0, 0, -hd + 2, 20);
      const kiosk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.1), glow('#ffd27a', 1));
      kiosk.position.set(0, 1.6, -hd + 2);
      kiosk.rotation.x = -0.4;
      g.add(kiosk);
      add(kiosk, { tip: 'Donate a guitar', onPick: () => { openHere(); S.openDonate(); } });
      block(0, -hd + 2, 2, 2);
      const hung = new THREE.Group();
      g.add(hung);
      const hang = () => {
        hung.children.slice().forEach((c) => { disposeGuitar(c); hung.remove(c); });
        for (let i = pickables.length - 1; i >= 0; i--) if (pickables[i].userData.exhibit) pickables.splice(i, 1);
        const list = (S.getExhibits() || []) as any[];
        const live = list.filter((x) => S.STATUS[x.status]?.live).slice(0, 8);
        const gone = list.filter((x) => !S.STATUS[x.status]?.live).slice(0, 8);
        const place = (x: any, i: number, n: number, side: number) => {
          const guitar = makeGuitar(x.build || {});
          guitar.scale.setScalar(1.6);
          const span = hd * 2 - 5;
          const z = -hd + 3 + (n > 1 ? (i * span) / Math.max(1, n - 1) : span / 2);
          guitar.position.set(side * (hw - 0.25), side < 0 ? 2.7 : 2.2, Math.min(z, hd - 3));
          guitar.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
          if (side > 0) guitar.rotation.z = (i % 2 ? 1 : -1) * 0.08;
          guitar.userData.exhibit = x.id;
          const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), glow(side < 0 ? '#ffe2a8' : '#8b8ba8', side < 0 ? 0.6 : 0.3));
          lamp.position.set(side * (hw - 0.05), 5.4, guitar.position.z);
          lamp.rotation.y = -side * Math.PI / 2;
          hung.add(lamp);
          const card = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.55), new THREE.MeshBasicMaterial({ map: freshTexture(390, 165, (c, W, H) => drawPlate(c, W, H, [x.name || 'Untitled', (S.STATUS[x.status]?.label ?? '') + (x.year ? ' · since ' + x.year : '')], { bg: '#f1e8d6', fg: '#2a1a10' })) }));
          card.position.set(side * (hw - 0.03), 0.95, guitar.position.z);
          card.rotation.y = -side * Math.PI / 2;
          hung.add(card);
          hung.add(guitar);
          add(guitar, { tip: `${x.name} · ${S.STATUS[x.status]?.label ?? ''} · click to read its story`, onPick: () => { openHere(); setTimeout(() => S.focusExhibit(x.id), 60); } });
        };
        live.forEach((x, i) => place(x, i, live.length, -1));
        gone.forEach((x, i) => place(x, i, gone.length, 1));
      };
      hang();
      on('ssm:exhibits', () => hang());
      break;
    }
    case 'workshop': {
      shell(g, hw, hd, { floor: new THREE.MeshStandardMaterial({ map: grain('shopfloor', '#6b5a48', '#3a2e24', [3, 3], 50), roughness: 0.9 }), wall: '#3d2c20', height: 5, light: '#ffcf8a' }, w.neon);
      const bench = new THREE.Group();
      box(bench, 4.4, 0.18, 1.8, mat('#9b6b3d', { rough: 0.6 }), 0, 0.95, 0);
      for (const [x, z] of [[-2, -0.7], [2, -0.7], [-2, 0.7], [2, 0.7]]) box(bench, 0.15, 0.95, 0.15, mat('#5a3a1e'), x, 0, z);
      g.add(bench);
      add(bench, { tip: 'Workbench · change the build', onPick: openHere });
      block(0, 0, 4.6, 2);
      let guitar: THREE.Group | null = null;
      const place = () => {
        if (guitar) { disposeGuitar(guitar); g.remove(guitar); const i = pickables.indexOf(guitar); if (i >= 0) pickables.splice(i, 1); }
        guitar = makeGuitar(S.getGuitar());
        guitar.scale.setScalar(1.6);
        guitar.rotation.x = -0.22;
        guitar.position.set(0, 2.0, -0.3);
        g.add(guitar);
        add(guitar, { tip: 'Your build · click to hear it', onPick: () => S.playClean('campfire') });
      };
      place();
      on('ssm:guitar-changed', () => place());
      // Lumber rack of tonewoods on the left wall
      const woods: [string, string, string][] = [['Alder', '#D9A774', '#C8905C'], ['Mahogany', '#8A4526', '#6E3219'], ['Maple', '#EBD3A6', '#D9BD8A'], ['Swamp ash', '#E2C495', '#BF9C66'], ['Walnut', '#6B4A32', '#533725'], ['Koa', '#B8763A', '#8F5424']];
      woods.forEach(([n, a, b], i) => {
        const plank = box(g, 0.3, 0.25, 3.2, new THREE.MeshStandardMaterial({ map: grain('plank' + n, a, b, [1, 1], 40), roughness: 0.7 }), -hw + 0.6, 0.6 + i * 0.55, -1);
        add(plank, { tip: `${n} plank · open the Wood Library`, onPick: () => api.open('woods') });
      });
      block(-hw + 0.6, -1, 0.8, 3.4);
      // Pegboard of tools on the back wall
      const peg = box(g, 6, 2.4, 0.1, mat('#a88a64', { rough: 0.9 }), 0, 1.8, -hd + 0.1);
      add(peg, { tip: 'Tools of the trade', onPick: openHere });
      for (let i = 0; i < 9; i++) box(g, 0.12, 0.5 + (i % 3) * 0.2, 0.08, mat('#b9c1c6', { metal: 0.8, rough: 0.3 }), -2.4 + i * 0.6, 2.4, -hd + 0.2);
      // Finish swatches on the right wall
      ['#F2B64A', '#A81F1F', '#8CC7B3', '#86A9C8', '#EDB5AC', '#161616'].forEach((c, i) => {
        const s = new THREE.Mesh(new THREE.CircleGeometry(0.35, 24), mat(c, { rough: 0.3 }));
        s.position.set(hw - 0.05, 1.4 + (i % 2) * 0.9, -3 + Math.floor(i / 2) * 1.2);
        s.rotation.y = -Math.PI / 2;
        g.add(s);
        add(s, { tip: 'Finish samples · pick a finish', onPick: openHere });
      });
      break;
    }
    case 'roulette': {
      shell(g, hw, hd, { floor: mat('#1b0c18', { rough: 0.4 }), wall: '#2a0f22', height: 5.5, light: '#ff9ad0' }, w.neon);
      const cab = box(g, 7, 4.2, 1.4, mat('#4a1034', { rough: 0.4, metal: 0.3 }), 0, 0, -hd + 1);
      pickable(cab, { tip: 'Riff Roulette machine', onPick: openHere });
      pickables.push(cab);
      block(0, -hd + 1, 7.4, 1.8);
      const reels: THREE.CanvasTexture[] = [];
      const labels = ['Key', 'Tempo', 'Mood', 'Rule'];
      for (let i = 0; i < 4; i++) {
        const { mesh, tex } = screen(1.5, 1.2, () => {});
        mesh.position.set(-2.4 + i * 1.6, 2.7, -hd + 1.72);
        g.add(mesh);
        reels.push(tex);
      }
      const paint = (p: any) => {
        const vals = [p.key, p.tempo + ' BPM', p.mood, p.rule];
        reels.forEach((t, i) => redraw(t, (c, W, H) => {
          c.fillStyle = '#171310';
          c.fillRect(0, 0, W, H);
          c.fillStyle = '#E9A23B';
          c.font = `600 22px ${MONO}`;
          c.textAlign = 'center';
          c.fillText(labels[i].toUpperCase(), W / 2, 34);
          c.fillStyle = '#F3E6D2';
          c.font = `800 44px ${DISPLAY}`;
          const words = String(vals[i]).toUpperCase().split(' ');
          const lines: string[] = [];
          let cur = '';
          for (const wd of words) { if ((cur + ' ' + wd).trim().length > 11 && cur) { lines.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim(); }
          if (cur) lines.push(cur);
          lines.slice(0, 3).forEach((l, k) => fitText(c, l, W / 2, 100 + k * 48 - (lines.length - 1) * 20, W - 16));
        }));
      };
      paint(S.getPrompt());
      on('ssm:prompt', (e) => paint((e as CustomEvent).detail));
      const lever = new THREE.Group();
      lever.position.set(4.1, 2, -hd + 1);
      cyl(lever, 0.08, 0.08, 1.8, mat('#c9cdd0', { metal: 0.9, rough: 0.3 }), 0, 0, 0, 8);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), glow('#ff3b3b', 1.6));
      knob.position.y = 1.9;
      lever.add(knob);
      g.add(lever);
      let pull = 0;
      add(lever, { tip: 'Pull the lever', onPick: () => { pull = 1; (document.getElementById('spin') as HTMLButtonElement | null)?.click(); } });
      updaters.push((_t, dt) => { if (pull > 0) { pull = Math.max(0, pull - dt * 1.4); lever.rotation.x = Math.sin(pull * Math.PI) * 0.9; } });
      // Bulbs round the cabinet
      for (let i = 0; i < 16; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), glow(['#ffd24a', '#ff5fa2'][i % 2], 2).clone());
        b.position.set(-3.4 + (i * 6.8) / 15, 4.3, -hd + 1.72);
        b.name = 'bulb';
        b.userData.i = i;
        g.add(b);
      }
      const bulbs = g.getObjectsByProperty('name', 'bulb');
      updaters.push((t) => bulbs.forEach((b) => (((b as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = (Math.floor(t * 6) + b.userData.i) % 2 ? 2.6 : 0.4)));
      const wall = box(g, 0.1, 2.6, 5, new THREE.MeshStandardMaterial({ map: freshTexture(400, 260, (c, W, H) => drawPlate(c, W, H, ['The Riff Wall', 'Write a riff, post it here'], { bg: '#241019', fg: '#ffd1e6' })), roughness: 0.8 }), hw - 0.1, 1, 0);
      add(wall, { tip: 'The riff wall · write and post a riff', onPick: openHere });
      break;
    }
    case 'pedalboard': {
      shell(g, hw, hd, { floor: mat('#23201c', { rough: 0.7 }), wall: '#1d2a20', height: 6, light: '#c8ffd2' }, w.neon);
      box(g, hw * 2 - 3, 0.3, 5, mat('#2a2622', { rough: 0.5 }), 0, 0, -1);
      const stage = new THREE.Group();
      g.add(stage);
      // Amp stack
      const amp = new THREE.Group();
      box(amp, 4, 1.4, 1.4, mat('#171411', { rough: 0.6 }), 0, 3.4, 0);
      box(amp, 4, 3.2, 1.4, mat('#1c1916', { rough: 0.8 }), 0, 0, 0);
      const grill = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.8), new THREE.MeshStandardMaterial({ map: stripes('#3B342D', '#2A241F'), roughness: 1 }));
      grill.position.set(0, 1.6, 0.71);
      amp.add(grill);
      for (let i = 0; i < 5; i++) cyl(amp, 0.1, 0.1, 0.1, mat('#e8e1d2'), -1.4 + i * 0.7, 4.1, 0.72, 12).rotation.x = Math.PI / 2;
      amp.position.set(0, 0, -hd + 1.2);
      g.add(amp);
      add(amp, { tip: 'Amp · play through your board', onPick: () => S.playBoard() });
      block(0, -hd + 1.2, 4.4, 1.8);
      const build = () => {
        stage.children.slice().forEach((c) => stage.remove(c));
        for (let i = pickables.length - 1; i >= 0; i--) if (pickables[i].userData.pedal != null) pickables.splice(i, 1);
        const chain = (S.getBoard().chain || []) as any[];
        const n = chain.length;
        const gap = 2.9;
        chain.forEach((p, i) => {
          const P = S.PEDALS[p.type];
          if (!P) return;
          const x = (i - (n - 1) / 2) * gap;
          const ped = new THREE.Group();
          ped.position.set(x, 0.3, -1);
          const c = new THREE.Color(P.color);
          if (!p.on) c.multiplyScalar(0.35);
          box(ped, 2.3, 0.8, 3, mat('#' + c.getHexString(), { rough: 0.35, metal: 0.25 }), 0, 0, 0);
          const knobM = mat('#141414', { rough: 0.5 });
          Object.keys(P.knobs).forEach((_k, j, arr) => cyl(ped, 0.2, 0.22, 0.3, knobM, -0.7 + (j * 1.4) / Math.max(1, arr.length - 1), 0.8, -0.8, 16));
          const fs = cyl(ped, 0.36, 0.42, 0.28, mat('#b9c1c6', { metal: 0.9, rough: 0.25 }), 0, 0.8, 0.8, 20);
          fs.userData.pedal = i;
          const led = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), p.on ? glow('#ff3b2e', 3) : mat('#3a1210'));
          led.position.set(0, 0.9, 0.1);
          ped.add(led);
          const lab = textSprite(P.name, p.on ? '#f4ead9' : '#8a7f73', 2.4);
          lab.position.set(0, 1.9, 0);
          ped.add(lab);
          stage.add(ped);
          ped.userData.pedal = i;
          add(ped, { tip: `${P.name} (${P.kind}) · stomp to ${p.on ? 'bypass' : 'engage'}`, onPick: () => { S.toggleBypass(i); S.playBoard(); } });
        });
        if (!n) {
          const lab = textSprite('Add pedals from the shelf', '#f4ead9', 5);
          lab.position.set(0, 1.4, -1);
          stage.add(lab);
        }
      };
      build();
      on('ssm:board-changed', () => build());
      boxes.push({ x: 0, z: -1, hw: hw - 1.5, hd: 2.5 });
      // Pedal shelf on the left wall
      const shelf = box(g, 0.6, 2.2, 5, mat('#3a2e27'), -hw + 0.35, 0, 0);
      add(shelf, { tip: 'Pedal shelf · add and reorder pedals', onPick: openHere });
      const colors = ['#B03A3A', '#2B2B2B', '#3E8E4F', '#D46A2A', '#8B6FB5', '#D6B031', '#2F6FA8', '#5B7A8C'];
      colors.forEach((c, i) => box(g, 0.4, 0.3, 0.5, mat(c, { rough: 0.4 }), -hw + 0.4, 2.25 + (i % 2) * 0.3, -2 + Math.floor(i / 2) * 1.2));
      break;
    }
    case 'detective': {
      shell(g, hw, hd, { floor: new THREE.MeshStandardMaterial({ map: grain('office', '#3a2a1e', '#1c130c', [3, 3], 60), roughness: 0.6 }), wall: '#2a2d33', height: 4.5, light: '#bcd4ff' }, w.neon);
      const desk = box(g, 3, 0.9, 1.4, mat('#4a2f1c', { rough: 0.5 }), 0, 0, -hd + 2.2);
      add(desk, { tip: 'Case files · start detecting', onPick: () => { openHere(); (document.getElementById('detGo') as HTMLButtonElement | null)?.click(); } });
      block(0, -hd + 2.2, 3.2, 1.6);
      for (let i = 0; i < 3; i++) {
        const f = box(g, 0.6, 0.05, 0.8, mat(['#d9c7a0', '#cdb98f', '#e3d3ae'][i], { rough: 0.9 }), -0.8 + i * 0.35, 0.9 + i * 0.05, -hd + 2.1);
        f.rotation.y = (i - 1) * 0.2;
      }
      cyl(g, 0.05, 0.05, 0.6, mat('#222'), 1.1, 0.9, -hd + 1.8, 8);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 16, 1, true), glow('#ffe6a8', 1.2));
      shade.position.set(1.1, 1.6, -hd + 1.8);
      g.add(shade);
      const lamp = new THREE.PointLight('#ffe6a8', 8, 5, 1.6);
      lamp.position.set(1.1, 1.4, -hd + 1.8);
      g.add(lamp);
      // Record player on a side table
      box(g, 1, 0.8, 1, mat('#2a1a10'), hw - 1, 0, -1);
      const platter = cyl(g, 0.4, 0.4, 0.05, mat('#111', { rough: 0.3 }), hw - 1, 0.8, -1, 32);
      add(platter, { tip: 'Record player · play the mystery tone', onPick: () => { openHere(); (document.getElementById('detPlay') as HTMLButtonElement | null)?.click(); } });
      updaters.push((_t, dt) => { platter.rotation.y += dt * 3.5; });
      block(hw - 1, -1, 1.2, 1.2);
      // Venetian blinds glowing blue
      for (let i = 0; i < 10; i++) box(g, 2.6, 0.08, 0.02, glow('#7fb8ff', 0.8), -hw + 0.02 + 1.6, 1.4 + i * 0.22, -hd + 0.2).rotation.y = 0;
      break;
    }
    case 'teacher': {
      shell(g, hw, hd, { floor: new THREE.MeshStandardMaterial({ map: grain('classfloor', '#8a6a48', '#5a4028', [4, 4], 60), roughness: 0.55 }), wall: '#e8dfcc', height: 6, light: '#fff1d6' }, w.neon);
      const { mesh: boardMesh, tex: boardTex } = screen(8, 3.2, () => {}, false);
      boardMesh.position.set(0, 3, -hd + 0.2);
      g.add(boardMesh);
      box(g, 8.4, 3.6, 0.1, mat('#6b4424'), 0, 1.2, -hd + 0.12);
      add(boardMesh, { tip: 'Chalkboard · open the current lesson', onPick: openHere });
      const LESSONS: any[] = (window as any).SSM_LESSONS || [];
      const tiles: THREE.Mesh[] = [];
      const paintBoard = (st: { cur: number; done: number[] }) => {
        const l = LESSONS[st.cur];
        redraw(boardTex, (c, W, H) => {
          c.fillStyle = '#1f3a2c';
          c.fillRect(0, 0, W, H);
          c.fillStyle = 'rgba(255,255,255,.9)';
          c.textAlign = 'left';
          c.font = `600 36px ${MONO}`;
          c.fillText(`LESSON ${st.cur + 1} OF ${LESSONS.length}`, 60, 80);
          c.font = `800 110px ${DISPLAY}`;
          fitText(c, (l?.t ?? '').toUpperCase(), 60, 200, W - 120);
          c.font = `italic 400 40px ${SERIF}`;
          c.fillText(`${st.done.length} of ${LESSONS.length} complete · click a tile on the wall to jump to any lesson`, 60, 300);
          c.strokeStyle = 'rgba(255,255,255,.35)';
          for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(60, 400 + i * 30); c.lineTo(W - 60, 400 + i * 30); c.stroke(); }
          c.font = `800 60px ${DISPLAY}`;
          ['𝄞', '♩', '♪', '♫'].forEach((s, i) => c.fillText(s, 90 + i * 260, 470));
        });
        tiles.forEach((t, i) => {
          const done = st.done.includes(i);
          const m = t.material as THREE.MeshStandardMaterial;
          m.emissive.set(i === st.cur ? '#ffe08a' : done ? '#6fcf8a' : '#2a2018');
          m.emissiveIntensity = i === st.cur ? 1.4 : done ? 0.9 : 0.4;
        });
      };
      // 50 lesson tiles, 25 per side wall
      for (let i = 0; i < LESSONS.length; i++) {
        const side = i < 25 ? -1 : 1;
        const k = i % 25;
        const row = Math.floor(k / 5);
        const col = k % 5;
        const tex = freshTexture(160, 160, (c, W, H) => {
          c.fillStyle = '#f5ecd8';
          c.fillRect(0, 0, W, H);
          c.fillStyle = '#2a1a10';
          c.font = `800 80px ${DISPLAY}`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(String(i + 1), W / 2, H / 2 + 4);
        });
        const t = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshStandardMaterial({ map: tex, emissive: '#2a2018', emissiveMap: tex, roughness: 0.7 }));
        t.position.set(side * (hw - 0.05), 4.2 - row * 0.95, -hd + 3 + (side < 0 ? 4 - col : col) * 1.1);
        t.rotation.y = -side * Math.PI / 2;
        g.add(t);
        tiles.push(t);
        add(t, { tip: `Lesson ${i + 1}: ${LESSONS[i].t}`, onPick: () => { S.openLesson(i); openHere(); } });
      }
      paintBoard(S.teacherState());
      on('ssm:lesson', (e) => paintBoard((e as CustomEvent).detail));
      // Desks in rows
      for (let r = 0; r < 3; r++) for (let c2 = 0; c2 < 3; c2++) {
        const x = -4 + c2 * 4;
        const z = -3 + r * 3.4;
        box(g, 1.6, 0.8, 0.9, mat('#9b6b3d', { rough: 0.6 }), x, 0, z);
        box(g, 0.6, 0.5, 0.6, mat('#5a3a1e'), x, 0, z + 0.9);
        block(x, z + 0.3, 1.8, 1.8);
      }
      // A guitar on a stand by the board
      const gtr = makeGuitar({ body: 'dread', finish: 'natural', pickup: 'piezo' });
      gtr.scale.setScalar(1.4);
      gtr.position.set(-hw + 1.5, 0.8, -hd + 1.5);
      gtr.rotation.set(-0.15, 0.5, 0);
      g.add(gtr);
      add(gtr, { tip: 'Practice guitar · play a campfire strum', onPick: () => S.playClean('campfire') });
      disposers.push(() => disposeGuitar(gtr));
      break;
    }
    case 'tarot': {
      const t = stripes('#3a1b58', '#1e0f2e');
      shell(g, hw, hd, { floor: mat('#1a0f24', { rough: 0.8 }), wall: new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }), height: 4.5, light: '#d9b3ff' }, w.neon);
      cyl(g, 1.3, 1.3, 0.9, mat('#3a1b58', { rough: 0.9 }), 0, 0, -1.2, 32);
      block(0, -1.2, 2.8, 2.8);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 18), glow('#c58bff', 1.6).clone());
      ball.position.set(0, 1.35, -1.5);
      g.add(ball);
      add(ball, { tip: 'Crystal ball · draw three cards', onPick: () => { S.drawTarot(); openHere(); } });
      updaters.push((tt) => { (ball.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.3 + Math.sin(tt * 2) * 0.5; });
      const cards: { mesh: THREE.Mesh; tex: THREE.CanvasTexture }[] = [];
      for (let i = 0; i < 3; i++) {
        const c = screen(0.55, 0.85, () => {}, false);
        c.mesh.position.set(-0.75 + i * 0.75, 1.0, -0.3);
        c.mesh.rotation.x = -1.3;
        g.add(c.mesh);
        cards.push(c);
      }
      const paintCards = (spread: any[]) => {
        cards.forEach((c, i) => redraw(c.tex, (x, W, H) => {
          x.fillStyle = '#1B1512';
          x.fillRect(0, 0, W, H);
          x.strokeStyle = '#B8893A';
          x.lineWidth = 6;
          x.strokeRect(6, 6, W - 12, H - 12);
          x.textAlign = 'center';
          const card = spread[i];
          if (!card) {
            x.fillStyle = '#B8893A';
            x.font = `800 80px ${DISPLAY}`;
            x.fillText('✦', W / 2, H / 2 + 26);
            return;
          }
          x.fillStyle = '#D9B25E';
          x.font = `600 18px ${MONO}`;
          x.fillText(['PAST', 'PRESENT', 'FUTURE'][i], W / 2, 36);
          x.font = `800 60px ${DISPLAY}`;
          x.fillStyle = '#F2E6D0';
          fitText(x, card.c, W / 2, H / 2, W - 20);
          x.font = `800 22px ${DISPLAY}`;
          fitText(x, card.title.toUpperCase(), W / 2, H - 30, W - 20);
        }));
        cards.forEach((c, i) => {
          const card = spread[i];
          pickable(c.mesh, { tip: card ? `${card.title} (${card.c}) · click to hear it` : 'Face-down card · use the crystal ball', onPick: () => { if (card) S.Snd.play({ guitar: S.getGuitar(), chain: [], amp: S.cleanAmp() }, S.strum(0, card.f, 0, 0.9)); else { S.drawTarot(); openHere(); } } });
          if (!pickables.includes(c.mesh)) pickables.push(c.mesh);
        });
      };
      paintCards(S.getSpread());
      on('ssm:tarot', (e) => paintCards((e as CustomEvent).detail));
      const orbLight = new THREE.PointLight('#c58bff', 6, 6, 1.5);
      orbLight.position.set(0, 1.8, -1.8);
      g.add(orbLight);
      break;
    }
    case 'woods': {
      shell(g, hw, hd, { floor: new THREE.MeshStandardMaterial({ map: grain('libfloor', '#5a3a22', '#2e1d10', [3, 3], 60), roughness: 0.6 }), wall: '#2e3a2c', height: 5, light: '#ffd9a0' }, w.neon);
      const W = S.WOODS as Record<string, any>;
      const keys = Object.keys(W);
      keys.forEach((k, i) => {
        const wood = W[k];
        const wallIdx = i < 5 ? 0 : i < 8 ? 1 : 2; // back, left, right
        const j = i < 5 ? i : i < 8 ? i - 5 : i - 8;
        const tex = grain('drawer' + k, wood.grain[0], wood.grain[1], [1, 1], 40);
        const drawer = new THREE.Group();
        box(drawer, 1.9, 1.1, 0.6, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), 0, 0, 0);
        const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.34), new THREE.MeshBasicMaterial({ map: freshTexture(360, 100, (c, WW, HH) => drawPlate(c, WW, HH, [wood.label], { bg: '#efe3c8', fg: '#2a1a10', size: 58 })) }));
        lab.position.set(0, 0.62, 0.31);
        drawer.add(lab);
        cyl(drawer, 0.06, 0.06, 0.12, mat('#c9a74a', { metal: 0.8, rough: 0.3 }), 0, 0.25, 0.36, 8).rotation.x = Math.PI / 2;
        if (wallIdx === 0) { drawer.position.set(-4.4 + j * 2.2, 1, -hd + 0.4); }
        else if (wallIdx === 1) { drawer.position.set(-hw + 0.4, 1, -3 + j * 2.4); drawer.rotation.y = Math.PI / 2; }
        else { drawer.position.set(hw - 0.4, 1, -3 + j * 2.4); drawer.rotation.y = -Math.PI / 2; }
        g.add(drawer);
        add(drawer, { tip: `${wood.label} drawer · ≈ ${wood.density} kg/m³ · click to open`, onPick: () => { S.openWood(k); openHere(); } });
      });
      box(g, 3, 0.85, 1.6, mat('#6b4424', { rough: 0.6 }), 0, 0, 0.5);
      block(0, 0.5, 3.2, 1.8);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), glow('#ffd9a0', 2));
      lamp.position.set(0.8, 1.3, 0.5);
      g.add(lamp);
      break;
    }
    case 'speedrun': {
      shell(g, hw, hd, { floor: mat('#0c0b18', { rough: 0.5 }), wall: '#141230', height: 4.5, light: '#9ff4ff' }, w.neon);
      const cab = box(g, 1.6, 2.4, 1.2, mat('#1d1a3a', { rough: 0.4 }), 0, 0, -hd + 1);
      block(0, -hd + 1, 1.8, 1.4);
      const scr = screen(1.2, 0.9, (c, W, H) => {
        c.fillStyle = '#05040c';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#56f0ff';
        c.font = `800 40px ${DISPLAY}`;
        c.textAlign = 'center';
        c.fillText('FRETBOARD', W / 2, 60);
        c.fillText('SPEEDRUN', W / 2, 105);
        c.fillStyle = '#ff5fa2';
        c.font = `600 22px ${MONO}`;
        c.fillText('PRESS START', W / 2, 160);
      });
      scr.mesh.position.set(0, 1.9, -hd + 1.61);
      g.add(scr.mesh);
      add(cab, { tip: 'Arcade cabinet · start a run', onPick: openHere });
      add(scr.mesh, { tip: 'Arcade cabinet · start a run', onPick: openHere });
      // A giant fretboard inlaid in the floor, strings you can click to play
      const fb = new THREE.Group();
      box(fb, 3.2, 0.05, 9, mat('#3b2418', { rough: 0.6 }), 0, 0, 0);
      for (let f = 0; f <= 12; f++) box(fb, 3.2, 0.07, 0.06, mat('#c9cdd0', { metal: 0.9, rough: 0.2 }), 0, 0, -4.5 + (f * 9) / 12);
      for (let s = 0; s < 6; s++) {
        const str = box(fb, 0.04, 0.12, 9, glow('#9ff4ff', 1), -1.25 + s * 0.5, 0.02, 0);
        add(str, { tip: `${['Low E', 'A', 'D', 'G', 'B', 'High E'][s]} string · click to play`, onPick: () => S.Snd.play({ guitar: S.getGuitar(), chain: [], amp: S.cleanAmp() }, [{ t: 0, s, midi: S.OPEN[s], v: 0.9 }], { keep: true }) });
      }
      fb.position.set(0, 0.01, 1);
      g.add(fb);
      break;
    }
    case 'tree': {
      shell(g, hw, hd, { floor: mat('#1f2a1c', { rough: 0.9 }), wall: '#20301f', height: 7, light: '#e8ffd0' }, w.neon);
      cyl(g, 0.5, 0.9, 5, mat('#4a3122', { rough: 0.9 }), 0, 0, -1, 12);
      block(0, -1, 2, 2);
      const leaf = mat('#2f6a36', { rough: 0.8, emissive: '#0d2a10', ei: 1 });
      for (const [x, y, z, r] of [[0, 5.2, -1, 2.6], [-2, 4.6, -0.6, 1.8], [2, 4.8, -1.6, 2], [0.3, 6.2, -1.2, 1.6]]) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), leaf);
        s.position.set(x, y, z);
        g.add(s);
      }
      const TREE = (S.TREE || []) as any[];
      const sorted = TREE.slice().sort((a, b) => a.y - b.y);
      const laneCol = ['#e6b98a', '#ffd86b', '#9fd8ff', '#ff9ad0', '#9dff8a'];
      sorted.forEach((n, i) => {
        const a = n.l * ((Math.PI * 2) / 5) + (i % 3) * 0.35;
        const r = 3 + (i % 2) * 0.8;
        const y = 1.2 + (i / sorted.length) * 5.2;
        const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), glow(laneCol[n.l] ?? '#ffd86b', 1.1));
        fruit.position.set(Math.cos(a) * r, y, -1 + Math.sin(a) * r);
        g.add(fruit);
        const twig = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, r, 5), mat('#4a3122'));
        twig.position.set((Math.cos(a) * r) / 2, y, -1 + (Math.sin(a) * r) / 2);
        twig.rotation.z = Math.PI / 2;
        twig.rotation.y = -a;
        g.add(twig);
        add(fruit, { tip: `${n.n} · ${n.yl}`, onPick: () => { S.pickTree(n.id); openHere(); } });
      });
      const sign = textSprite('Oldest at the roots, newest at the top', '#dfffd0', 6);
      sign.position.set(0, 0.9, hd - 2);
      g.add(sign);
      break;
    }
    case 'hospital': {
      shell(g, hw, hd, { floor: mat('#7f8c8a', { rough: 0.5 }), wall: '#b7c2bf', height: 4.5, light: '#e8fbff' }, w.neon);
      const patients = ((S.CASES2 || []) as any[]).slice(0, 3);
      patients.forEach((p, i) => {
        const x = -4 + i * 4;
        box(g, 2, 0.7, 3, mat('#f4f6f5', { rough: 0.5 }), x, 0, -hd + 2.5);
        box(g, 1.8, 0.15, 2.8, mat('#9fc9d8', { rough: 0.8 }), x, 0.7, -hd + 2.5);
        block(x, -hd + 2.5, 2.2, 3.2);
        const gtr = makeGuitar(p.g);
        gtr.scale.setScalar(1.3);
        gtr.rotation.x = -0.75;
        gtr.position.set(x, 1.45, -hd + 2.3);
        g.add(gtr);
        disposers.push(() => disposeGuitar(gtr));
        const halo = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.1, 32), glow('#ff6b6b', 1.4).clone());
        halo.rotation.x = -Math.PI / 2;
        halo.position.set(x, 0.9, -hd + 2.5);
        g.add(halo);
        updaters.push((t) => { (halo.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 + Math.abs(Math.sin(t * 2.4 + i)) * 1.8; });
        add(gtr, { tip: `${p.p} · ${p.sym.slice(0, 60)}…`, onPick: () => { openHere(); S.startHospital(); } });
      });
      // Heart monitor
      const mon = screen(1.4, 0.8, () => {});
      mon.mesh.position.set(hw - 0.08, 2.2, -2);
      mon.mesh.rotation.y = -Math.PI / 2;
      g.add(mon.mesh);
      let acc = 0;
      updaters.push((t, dt) => {
        acc += dt;
        if (acc < 0.08) return;
        acc = 0;
        redraw(mon.tex, (c, W, H) => {
          c.fillStyle = '#031208';
          c.fillRect(0, 0, W, H);
          c.strokeStyle = '#6dff8f';
          c.lineWidth = 4;
          c.beginPath();
          for (let x = 0; x < W; x += 4) {
            const ph = (x / W) * 3 + t * 1.2;
            const f = ph % 1;
            const y = f > 0.45 && f < 0.5 ? -60 : f > 0.5 && f < 0.55 ? 40 : Math.sin(ph * 20) * 3;
            c.lineTo(x, H / 2 + y);
          }
          c.stroke();
        });
      });
      add(mon.mesh, { tip: 'Patient monitor · start a shift', onPick: () => { openHere(); S.startHospital(); } });
      break;
    }
  }

  return {
    group: g,
    hw,
    hd,
    boxes,
    pickables,
    update(t, dt) {
      for (const u of updaters) u(t, dt);
    },
    dispose() {
      listeners.splice(0).forEach(([ev, fn]) => document.removeEventListener(ev, fn));
      disposers.forEach((d) => d());
      g.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) m.geometry.dispose();
      });
    },
  };
}
