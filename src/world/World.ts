import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { WINGS, doorOf, wingById, type Wing, type WingId } from '../wings';
import { buildCampus, type Campus } from './campus';
import { buildRoom, type Room } from './interiors';
import { WalkMode } from './walk';
import { BRIDGE_Z, HEADSTOCK, JOINT_Z, NECK, NUT_Z, OPEN_MIDI, SOUNDHOLE, STRING_NAMES, bodyOutline, fretAt, inBody, inNeck, inPoly, stringX } from './geo';

export type Mode = 'fly' | 'walk';

export interface Hooks {
  openPanel(id: WingId): void;
  closePanel(): boolean;
  setPrompt(text: string | null, action?: () => void): void;
  setWhere(text: string | null): void;
  toast(msg: string): void;
  tip(text: string | null, x?: number, y?: number): void;
  onMode(mode: Mode, inRoom: boolean): void;
}

const ORDINAL = (n: number) => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');

export class World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(45, 1, 0.1, 3000);
  private controls: OrbitControls;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private campus: Campus;
  private outdoor = new THREE.Group();
  private walk: WalkMode;
  private room: Room | null = null;
  private roomWing: Wing | null = null;
  mode: Mode = 'fly';
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private fly: { p0: THREE.Vector3; p1: THREE.Vector3; t0: THREE.Vector3; t1: THREE.Vector3; k: number; dur: number } | null = null;
  private clock = new THREE.Clock();
  private nearWing: Wing | null = null;
  private lastNear = 0;
  private downAt = { x: 0, y: 0 };
  private lastHover = 0;
  private minimapPts: { body: { x: number; z: number }[] } = { body: [] };
  private fog = new THREE.FogExp2('#0b0e1c', 0.0024);
  private lastPluck = new Float32Array(6);
  private ssm: any;

  constructor(private canvas: HTMLCanvasElement, private hooks: Hooks) {
    this.ssm = (window as any).SSM;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.scene.background = new THREE.Color('#070912');
    this.scene.fog = this.fog;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = 1.42;
    this.controls.minDistance = 25;
    this.controls.maxDistance = 650;
    this.camera.position.set(210, 190, 170);
    this.controls.target.set(0, 0, -90);

    this.buildSky();
    this.buildLights();
    this.campus = buildCampus();
    this.outdoor.add(this.campus.group);
    this.scene.add(this.outdoor);
    this.minimapPts.body = bodyOutline(90);

    this.walk = new WalkMode(this.camera, canvas);
    this.walk.setColliders(this.campus.colliders);
    this.walk.onDoor = () => this.exitRoom();
    this.walk.onMove = (a, b) => this.crossStrings(a, b);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.45, 0.4, 1.0);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.resize();
    window.addEventListener('resize', () => this.resize());
    canvas.addEventListener('pointerdown', (e) => (this.downAt = { x: e.clientX, y: e.clientY }));
    canvas.addEventListener('pointerup', (e) => this.onClick(e));
    canvas.addEventListener('pointermove', (e) => this.onHover(e));
    canvas.addEventListener('pointerleave', () => this.setHover(null));
    window.addEventListener('keydown', (e) => this.onKey(e));
    this.renderer.setAnimationLoop(() => this.frame());
  }

  // ---------- Setup ----------
  private buildSky() {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(1500, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new THREE.Color('#050714') }, mid: { value: new THREE.Color('#141a3a') }, low: { value: new THREE.Color('#2b1e2a') } },
        vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.12 ? mix(mid, top, smoothstep(0.12, 0.7, h)) : mix(low, mid, smoothstep(-0.05, 0.12, h)); gl_FragColor = vec4(c, 1.0); }',
      }),
    );
    this.outdoor.add(sky);
    const n = 2200;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * 0.9 + 0.08;
      const r = 1400;
      pos[i * 3] = Math.cos(u) * Math.cos(v) * r;
      pos[i * 3 + 1] = Math.sin(v) * r;
      pos[i * 3 + 2] = Math.sin(u) * Math.cos(v) * r;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#dfe6ff', size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 }));
    this.outdoor.add(stars);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(38, 24, 16), new THREE.MeshBasicMaterial({ color: '#fff4d6', fog: false }));
    moon.position.set(-600, 520, -900);
    this.outdoor.add(moon);
  }

  private buildLights() {
    const g = new THREE.Group();
    g.add(new THREE.HemisphereLight('#7083c4', '#1c150f', 1.1));
    const moon = new THREE.DirectionalLight('#aebdff', 1.1);
    moon.position.set(-300, 400, -200);
    g.add(moon);
    const warm: [number, number, number][] = [[0, 22, 30], [0, 22, -40], [0, 18, -120], [0, 18, -200], [0, 22, -290], [-40, 16, 50], [40, 16, 50]];
    for (const [x, y, z] of warm) {
      const l = new THREE.PointLight('#ffcf8a', 90, 110, 1.2);
      l.position.set(x, y, z);
      g.add(l);
    }
    this.outdoor.add(g);
  }

  private resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ---------- Modes ----------
  setMode(mode: Mode, spawn?: { x: number; z: number; yaw: number }): void {
    if (mode === this.mode && !spawn) return;
    if (mode === 'fly') {
      if (this.room) this.exitRoom(true);
      const look = this.walk.lookPoint();
      this.walk.exit();
      this.mode = 'fly';
      this.camera.fov = 45;
      this.camera.near = 0.5;
      this.camera.far = 3000;
      this.camera.updateProjectionMatrix();
      this.controls.enabled = true;
      const from = this.camera.position.clone();
      this.controls.target.copy(look);
      this.camera.position.set(look.x + 70, 80, look.z + 90);
      this.flyTo(this.camera.position.clone(), look, from);
      this.hooks.setPrompt(null);
      this.hooks.setWhere(null);
    } else {
      this.controls.enabled = false;
      this.fly = null;
      this.mode = 'walk';
      const s = spawn ?? this.spawnFromFly();
      this.walk.setRoom(null);
      this.walk.place(s.x, s.z, s.yaw);
      if (!this.walk.active) this.walk.enter();
    }
    this.hooks.onMode(this.mode, !!this.room);
  }

  /** When dropping from the sky, land near where the camera was looking, on open ground. */
  private spawnFromFly(): { x: number; z: number; yaw: number } {
    const t = this.controls.target;
    const tries = [[t.x, t.z], [0, 125]];
    for (const [x, z] of tries) {
      for (let r = 0; r < 40; r += 3) {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          const px = x + Math.cos(a) * r;
          const pz = z + Math.sin(a) * r;
          if (!this.walk.blocked(px, pz)) return { x: px, z: pz, yaw: 0 };
        }
      }
    }
    return { x: 0, z: 125, yaw: 0 };
  }

  /** Start on the lawn just outside the entrance gate, looking up the guitar. */
  startAtGate(): void {
    this.setMode('walk', { x: 0, z: 138, yaw: 0 });
  }

  flyOver(): void {
    this.mode = 'fly';
    this.controls.enabled = true;
    this.hooks.onMode('fly', false);
  }

  private flyTo(pos: THREE.Vector3, target: THREE.Vector3, from?: THREE.Vector3) {
    this.fly = { p0: (from ?? this.camera.position).clone(), p1: pos.clone(), t0: this.controls.target.clone(), t1: target.clone(), k: 0, dur: 1.3 };
  }

  /** Directory or in-page link: go to a wing. */
  goto(id: WingId, enter = false): void {
    const w = wingById(id);
    if (!w) return;
    if (this.mode === 'walk') {
      if (enter) {
        this.enterRoom(id);
        return;
      }
      if (this.room) this.exitRoom(true);
      const d = doorOf(w);
      const x = d.x + d.nx * 5;
      const z = d.z + d.nz * 5;
      this.walk.place(x, z, Math.atan2(d.nx, d.nz));
      this.hooks.toast(`${w.letter} · ${w.name}. Walk to the door and press Enter.`);
    } else {
      const d = doorOf(w);
      const target = new THREE.Vector3(w.x, 4, w.z);
      const pos = new THREE.Vector3(w.x + d.nx * 42 + 18, 34, w.z + d.nz * 42 + 26);
      this.flyTo(pos, target);
      this.hooks.openPanel(id);
    }
  }

  enterRoom(id: WingId): void {
    const w = wingById(id);
    if (!w) return;
    if (this.room) this.disposeRoom();
    if (this.mode !== 'walk') {
      this.mode = 'walk';
      this.controls.enabled = false;
      this.fly = null;
      if (!this.walk.active) this.walk.enter();
    }
    this.room = buildRoom(w, { ssm: this.ssm, open: (x) => this.hooks.openPanel(x), toast: (m) => this.hooks.toast(m) });
    this.roomWing = w;
    this.scene.add(this.room.group);
    this.outdoor.visible = false;
    this.scene.fog = null;
    this.scene.background = new THREE.Color('#0a0807');
    this.walk.setRoom({ hw: this.room.hw, hd: this.room.hd, boxes: this.room.boxes }, { x: 0, z: this.room.hd - 1.6, yaw: 0 });
    this.hooks.setPrompt(null);
    this.hooks.tip(null);
    this.hooks.setWhere(`${w.letter} · ${w.name} · Esc to leave`);
    this.hooks.onMode('walk', true);
    this.hooks.toast(`Welcome to ${w.name}. Click the glowing things.`);
  }

  exitRoom(silent = false): void {
    if (!this.room || !this.roomWing) return;
    const w = this.roomWing;
    this.disposeRoom();
    this.outdoor.visible = true;
    this.scene.fog = this.fog;
    this.scene.background = new THREE.Color('#070912');
    this.walk.setRoom(null);
    if (!silent) {
      const d = doorOf(w);
      this.walk.place(d.x + d.nx * 1.5, d.z + d.nz * 1.5, Math.atan2(d.nx, d.nz));
      this.nearWing = null;
    }
    this.hooks.setWhere(null);
    this.hooks.tip(null);
    this.hooks.onMode(this.mode, false);
  }

  private disposeRoom() {
    if (!this.room) return;
    this.scene.remove(this.room.group);
    this.room.dispose();
    this.room = null;
    this.roomWing = null;
  }

  get inRoom(): boolean {
    return !!this.room;
  }

  // ---------- Input ----------
  private onKey(e: KeyboardEvent) {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (e.key === 'Escape') {
      if (this.hooks.closePanel()) return;
      if (this.room) this.exitRoom();
    } else if (e.key === 'Enter' && this.mode === 'walk' && !this.room && this.nearWing) {
      if (t && t.tagName === 'BUTTON') return;
      this.enterRoom(this.nearWing.id);
    }
  }

  private pickables(): THREE.Object3D[] {
    return this.room ? this.room.pickables : this.campus.pickables;
  }

  private pick(clientX: number, clientY: number): THREE.Object3D | null {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    this.raycaster.far = this.room ? 40 : this.mode === 'walk' ? 120 : 2000;
    const hits = this.raycaster.intersectObjects(this.pickables(), true);
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o) {
        if (o.userData.onPick || o.userData.wing || o.userData.pluck != null) return o;
        o = o.parent;
      }
    }
    return null;
  }

  private onClick(e: PointerEvent) {
    if (Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y) > 6) return;
    const o = this.pick(e.clientX, e.clientY);
    this.hooks.tip(null);
    if (!o) return;
    if (o.userData.onPick) o.userData.onPick();
    else if (o.userData.wing) {
      const id = o.userData.wing as WingId;
      if (this.mode === 'walk') {
        const w = wingById(id)!;
        const d = doorOf(w);
        const dist = Math.hypot(this.camera.position.x - d.x, this.camera.position.z - d.z);
        if (dist < 30) this.enterRoom(id);
        else this.goto(id);
      } else this.goto(id);
    } else if (o.userData.pluck != null) this.pluck(o.userData.pluck as number, 0);
  }

  private onHover(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    const now = performance.now();
    if (now - this.lastHover < 60) return;
    this.lastHover = now;
    const o = this.pick(e.clientX, e.clientY);
    this.setHover(o, e.clientX, e.clientY);
  }

  private setHover(o: THREE.Object3D | null, x = 0, y = 0) {
    this.canvas.classList.toggle('pointer', !!o);
    this.hooks.tip(o ? (o.userData.tip as string) ?? null : null, x, y);
  }

  // ---------- Strings ----------
  private crossStrings(a: THREE.Vector3, b: THREE.Vector3) {
    const z = (a.z + b.z) / 2;
    if (z > BRIDGE_Z || z < NUT_Z) return;
    for (let s = 0; s < 6; s++) {
      const xs = stringX(s, z);
      if ((a.x - xs) * (b.x - xs) < 0) this.pluck(s, fretAt(z));
    }
  }

  pluck(s: number, fret: number): void {
    const now = performance.now() / 1000;
    if (now - this.lastPluck[s] < 0.12) return;
    this.lastPluck[s] = now;
    this.campus.pluckVisual(s);
    const S = this.ssm;
    if (!S) return;
    const rig = { guitar: S.getGuitar(), chain: S.getBoard().chain, amp: S.getBoard().amp };
    S.Snd.play(rig, [{ t: 0, s, midi: OPEN_MIDI[s] + fret, v: 0.9 }], { keep: true });
    const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
    this.hooks.toast(`${STRING_NAMES[s]} string${fret ? `, ${ORDINAL(fret)} fret` : ' open'}: ${names[(OPEN_MIDI[s] + fret) % 12]}`);
  }

  // ---------- Frame ----------
  private frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    if (this.fly) {
      this.fly.k = Math.min(1, this.fly.k + dt / this.fly.dur);
      const e = this.fly.k < 0.5 ? 2 * this.fly.k * this.fly.k : 1 - Math.pow(-2 * this.fly.k + 2, 2) / 2;
      this.camera.position.lerpVectors(this.fly.p0, this.fly.p1, e);
      this.controls.target.lerpVectors(this.fly.t0, this.fly.t1, e);
      if (this.fly.k >= 1) this.fly = null;
    }
    if (this.mode === 'fly') this.controls.update();
    this.walk.update(dt, t);
    if (this.room) this.room.update(t, dt);
    else this.campus.update(t, dt);
    if (this.mode === 'walk' && !this.room && t - this.lastNear > 0.25) {
      this.lastNear = t;
      this.checkNear();
    }
    this.composer.render(dt);
  }

  private checkNear() {
    const p = this.camera.position;
    let best: Wing | null = null;
    let bestD = 7;
    for (const w of WINGS) {
      const d = doorOf(w);
      const dist = Math.hypot(p.x - d.x, p.z - d.z);
      if (dist < bestD) {
        bestD = dist;
        best = w;
      }
    }
    if (best !== this.nearWing) {
      this.nearWing = best;
      if (best) this.hooks.setPrompt(`${best.letter} · ${best.name}`, () => this.enterRoom(best!.id));
      else this.hooks.setPrompt(null);
    }
    this.hooks.setWhere(this.whereText(p.x, p.z));
  }

  private whereText(x: number, z: number): string {
    const p = { x, z };
    if (inNeck(p) && z < JOINT_Z) {
      const f = fretAt(z);
      return `The neck · ${ORDINAL(f)} fret`;
    }
    if (inPoly(p, HEADSTOCK)) return 'The headstock';
    if (inBody(p)) {
      if (Math.hypot(x - SOUNDHOLE.x, z - SOUNDHOLE.z) < 24) return 'The soundhole';
      if (z > BRIDGE_Z - 6 && z < BRIDGE_Z + 8 && Math.abs(x) < 24) return 'The bridge';
      return z > 0 ? 'The lower bout' : 'The upper bout';
    }
    return z > 110 ? 'The entrance lawn' : 'The lawn';
  }

  /** Top-down map: the guitar outline, pavilions and you. */
  drawMinimap(g: CanvasRenderingContext2D, W: number, H: number): void {
    g.clearRect(0, 0, W, H);
    if (this.room) return;
    const p = this.camera.position;
    const scale = W / 260;
    g.save();
    g.beginPath();
    g.arc(W / 2, H / 2, W / 2 - 1, 0, Math.PI * 2);
    g.clip();
    g.fillStyle = 'rgba(10,20,12,.9)';
    g.fillRect(0, 0, W, H);
    g.translate(W / 2, H / 2);
    g.scale(scale, scale);
    g.translate(-p.x, -p.z);
    const poly = (pts: { x: number; z: number }[], fill: string) => {
      g.beginPath();
      pts.forEach((q, i) => (i ? g.lineTo(q.x, q.z) : g.moveTo(q.x, q.z)));
      g.closePath();
      g.fillStyle = fill;
      g.fill();
    };
    poly(this.minimapPts.body, '#b88b55');
    poly(NECK, '#4a2c1c');
    poly(HEADSTOCK, '#222');
    g.fillStyle = '#05070c';
    g.beginPath();
    g.arc(SOUNDHOLE.x, SOUNDHOLE.z, SOUNDHOLE.r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(255,241,207,.7)';
    g.lineWidth = 0.8;
    for (let s = 0; s < 6; s++) {
      g.beginPath();
      g.moveTo(stringX(s, BRIDGE_Z), BRIDGE_Z);
      g.lineTo(stringX(s, NUT_Z), NUT_Z);
      g.stroke();
    }
    g.font = 'bold 9px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const w of WINGS) {
      g.fillStyle = w.neon;
      g.fillRect(w.x - 5, w.z - 5, 10, 10);
      g.fillStyle = '#111';
      g.fillText(w.letter, w.x, w.z + 0.5);
    }
    g.restore();
    // You, always in the middle, pointing the way you face.
    g.save();
    g.translate(W / 2, H / 2);
    g.rotate(-this.walk.yaw);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(0, -8);
    g.lineTo(5, 6);
    g.lineTo(0, 3);
    g.lineTo(-5, 6);
    g.closePath();
    g.fill();
    g.restore();
  }

  setStick(x: number, y: number): void {
    this.walk.setStick(x, y);
  }
}
