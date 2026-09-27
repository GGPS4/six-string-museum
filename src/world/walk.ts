import * as THREE from 'three';
import type { Collider } from './campus';

/**
 * First-person walking, adapted from Musical City's walk mode.
 * WASD/arrow keys (or the on-screen stick) to move, drag to look.
 */
const EYE = 1.65;
const SPEED = 9;
const RADIUS = 0.7;
const LIMIT = { minX: -220, maxX: 220, minZ: -420, maxZ: 200 };

export interface RoomBounds { hw: number; hd: number; boxes: Collider[] }

export class WalkMode {
  active = false;
  yaw = 0;
  pitch = -0.04;
  private keys = new Set<string>();
  private stick = new THREE.Vector2();
  private colliders: Collider[] = [];
  private room: RoomBounds | null = null;
  private dragging: { x: number; y: number; moved: number } | null = null;
  private removers: (() => void)[] = [];
  private last = new THREE.Vector3();
  onDoor: (() => void) | null = null;
  onMove: ((prev: THREE.Vector3, now: THREE.Vector3) => void) | null = null;
  /** Set true when the latest pointer gesture was a drag, so a click isn't treated as a pick. */
  dragged = false;

  constructor(private camera: THREE.PerspectiveCamera, private dom: HTMLElement) {}

  setColliders(c: Collider[]): void {
    this.colliders = c;
  }

  setRoom(room: RoomBounds | null, spawn?: { x: number; z: number; yaw: number }): void {
    this.room = room;
    this.keys.clear();
    if (spawn) this.place(spawn.x, spawn.z, spawn.yaw);
  }

  get inRoom(): boolean {
    return !!this.room;
  }

  place(x: number, z: number, yaw: number): void {
    this.camera.position.set(x, EYE, z);
    this.yaw = yaw;
    this.pitch = -0.04;
    this.apply();
    this.last.copy(this.camera.position);
  }

  private hits(x: number, z: number, list: Collider[]): boolean {
    for (const b of list) {
      if (b.r) {
        if (Math.hypot(x - b.x, z - b.z) < b.r + RADIUS) return true;
      } else if (Math.abs(x - b.x) < b.hw + RADIUS && Math.abs(z - b.z) < b.hd + RADIUS) return true;
    }
    return false;
  }

  blocked(x: number, z: number): boolean {
    const room = this.room;
    if (room) {
      if (Math.abs(x) > room.hw - RADIUS || z < -room.hd + RADIUS) return true;
      if (z > room.hd - RADIUS && Math.abs(x) > 1.1) return true;
      if (z > room.hd + 0.4) return true;
      return this.hits(x, z, room.boxes);
    }
    if (x < LIMIT.minX || x > LIMIT.maxX || z < LIMIT.minZ || z > LIMIT.maxZ) return true;
    return this.hits(x, z, this.colliders);
  }

  enter(): void {
    this.camera.near = 0.1;
    this.camera.far = 1400;
    this.camera.fov = 70;
    this.camera.updateProjectionMatrix();
    this.active = true;
    this.bind();
    this.apply();
  }

  exit(): void {
    this.active = false;
    this.keys.clear();
    this.stick.set(0, 0);
    this.removers.forEach((r) => r());
    this.removers = [];
  }

  setStick(x: number, y: number): void {
    this.stick.set(x, y);
  }

  private bind() {
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      this.keys.add(e.key.toLowerCase());
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
    const pd = (e: PointerEvent) => {
      this.dragging = { x: e.clientX, y: e.clientY, moved: 0 };
      this.dragged = false;
    };
    const pm = (e: PointerEvent) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.dragging.x;
      const dy = e.clientY - this.dragging.y;
      this.dragging.x = e.clientX;
      this.dragging.y = e.clientY;
      this.dragging.moved += Math.abs(dx) + Math.abs(dy);
      if (this.dragging.moved > 6) this.dragged = true;
      this.yaw -= dx * 0.0042;
      this.pitch = Math.max(-1.1, Math.min(1.1, this.pitch - dy * 0.0035));
      this.apply();
    };
    const pu = () => (this.dragging = null);
    const blur = () => this.keys.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    this.dom.addEventListener('pointerdown', pd);
    window.addEventListener('pointermove', pm);
    window.addEventListener('pointerup', pu);
    this.removers.push(
      () => window.removeEventListener('keydown', down),
      () => window.removeEventListener('keyup', up),
      () => window.removeEventListener('blur', blur),
      () => this.dom.removeEventListener('pointerdown', pd),
      () => window.removeEventListener('pointermove', pm),
      () => window.removeEventListener('pointerup', pu),
    );
  }

  private apply() {
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  update(dt: number, time: number): void {
    if (!this.active) return;
    const k = this.keys;
    let fwd = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0) - this.stick.y;
    let side = (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0) + this.stick.x;
    const turn = (k.has('arrowleft') || k.has('q') ? 1 : 0) - (k.has('arrowright') || k.has('e') ? 1 : 0);
    if (turn) {
      this.yaw += turn * dt * 1.9;
      this.apply();
    }
    const len = Math.hypot(fwd, side);
    if (len > 1) {
      fwd /= len;
      side /= len;
    }
    const speed = SPEED * (k.has('shift') ? 2.2 : 1) * (this.room ? 0.6 : 1);
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const dx = (-sin * fwd + cos * side) * speed * dt;
    const dz = (-cos * fwd - sin * side) * speed * dt;
    const p = this.camera.position;
    this.last.copy(p);
    if (dx || dz) {
      if (!this.blocked(p.x + dx, p.z + dz)) {
        p.x += dx;
        p.z += dz;
      } else if (!this.blocked(p.x + dx, p.z)) p.x += dx;
      else if (!this.blocked(p.x, p.z + dz)) p.z += dz;
    }
    p.y = EYE + (dx || dz ? Math.abs(Math.sin(time * 9)) * 0.035 : 0);
    if (this.room) {
      if (p.z > this.room.hd - 0.5) this.onDoor?.();
      return;
    }
    if (p.x !== this.last.x || p.z !== this.last.z) this.onMove?.(this.last, p);
  }

  /** A point in front of you on the ground, for handing over to fly mode. */
  lookPoint(): THREE.Vector3 {
    const dir = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    return this.camera.position.clone().add(dir.multiplyScalar(30)).setY(0);
  }
}
