import { WINGS, wingById, type WingId } from '../wings';
import type { Hooks, Mode, World } from '../world/World';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

/** DOM chrome around the 3D world: landing card, top bar, wing panel, prompts, minimap and touch stick. */
export class Hud {
  world: World | null = null;
  private panelWing: WingId | null = null;
  private promptAction: (() => void) | null = null;
  private toastTimer = 0;
  readonly hooks: Hooks;

  constructor() {
    const self = this;
    this.hooks = {
      openPanel: (id) => self.openPanel(id),
      closePanel: () => self.closePanel(),
      setPrompt: (text, action) => self.setPrompt(text, action),
      setWhere: (text) => {
        const el = $('where');
        el.hidden = !text;
        if (text) el.textContent = text;
      },
      toast: (msg) => self.toast(msg),
      tip: (text, x = 0, y = 0) => {
        const el = $('tip');
        el.hidden = !text;
        if (text) {
          el.textContent = text;
          el.style.left = x + 'px';
          el.style.top = y + 'px';
        }
      },
      onMode: (mode, inRoom) => self.onMode(mode, inRoom),
    };
    // All wing sections live inside the panel; the wing code shows one at a time.
    const body = $('panelBody');
    const holder = $('wings');
    while (holder.firstElementChild) body.appendChild(holder.firstElementChild);
    holder.remove();
    this.buildDirectory();
    this.bind();
  }

  attach(world: World): void {
    this.world = world;
  }

  private bind() {
    $('panelClose').addEventListener('click', () => this.closePanel());
    $('panelWide').addEventListener('click', () => {
      const p = $('panel');
      const on = !p.classList.contains('wide');
      p.classList.toggle('wide', on);
      $('panelWide').setAttribute('aria-pressed', String(on));
    });
    $('panelEnter').addEventListener('click', () => {
      if (this.panelWing) this.world?.enterRoom(this.panelWing);
      this.refreshEnter();
    });
    $('modeFly').addEventListener('click', () => { $('modeFly').blur(); this.world?.setMode('fly'); });
    $('modeWalk').addEventListener('click', () => { $('modeWalk').blur(); this.world?.setMode('walk'); });
    const dir = $('directory');
    const help = $('help');
    $('dirBtn').addEventListener('click', () => {
      dir.hidden = !dir.hidden;
      help.hidden = true;
      $('dirBtn').setAttribute('aria-expanded', String(!dir.hidden));
      $('helpBtn').setAttribute('aria-expanded', 'false');
    });
    $('helpBtn').addEventListener('click', () => {
      help.hidden = !help.hidden;
      dir.hidden = true;
      $('helpBtn').setAttribute('aria-expanded', String(!help.hidden));
      $('dirBtn').setAttribute('aria-expanded', 'false');
    });
    $('helpClose').addEventListener('click', () => {
      help.hidden = true;
      $('helpBtn').setAttribute('aria-expanded', 'false');
    });
    $('promptBtn').addEventListener('click', () => { $('promptBtn').blur(); this.promptAction?.(); });
    document.addEventListener('ssm:goto', (e) => {
      const id = (e as CustomEvent).detail as WingId;
      if (!this.world) return;
      if (this.world.mode === 'walk') {
        this.world.goto(id, true);
        this.openPanel(id);
      } else this.world.goto(id);
    });
    this.bindStick();
  }

  private buildDirectory() {
    const dir = $('directory');
    dir.innerHTML = '';
    for (const w of WINGS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<span class="dl">${w.letter}</span><span class="dn">${w.name}</span><span class="dc">${w.blurb}</span>`;
      b.addEventListener('click', () => {
        dir.hidden = true;
        $('dirBtn').setAttribute('aria-expanded', 'false');
        (document.activeElement as HTMLElement | null)?.blur();
        this.world?.goto(w.id);
      });
      dir.appendChild(b);
    }
  }

  openPanel(id: WingId): void {
    const w = wingById(id);
    if (!w) return;
    this.panelWing = id;
    (window as any).SSM?.showWing(id);
    $('panelEyebrow').textContent = `Wing ${w.letter}`;
    $('panelTitle').textContent = w.name;
    $('panel').hidden = false;
    $('panelBody').scrollTop = 0;
    this.refreshEnter();
  }

  closePanel(): boolean {
    const p = $('panel');
    if (p.hidden) return false;
    p.hidden = true;
    this.panelWing = null;
    (window as any).SSM?.Snd?.stopAll?.();
    return true;
  }

  private refreshEnter() {
    const btn = $('panelEnter');
    const inThisRoom = !!this.world?.inRoom && this.world && (this.world as any).roomWing?.id === this.panelWing;
    btn.hidden = !!inThisRoom;
  }

  setPrompt(text: string | null, action?: () => void): void {
    const el = $('prompt');
    el.hidden = !text;
    this.promptAction = action ?? null;
    if (text) $('promptText').innerHTML = `Step into <strong>${text}</strong> <span class="muted">(Enter)</span>`;
  }

  toast(msg: string): void {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => el.classList.remove('on'), 2400);
  }

  private onMode(mode: Mode, inRoom: boolean) {
    $('modeFly').setAttribute('aria-pressed', String(mode === 'fly'));
    $('modeWalk').setAttribute('aria-pressed', String(mode === 'walk'));
    const walking = mode === 'walk';
    $('minimap').hidden = !walking || inRoom;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    $('stick').hidden = !(walking && coarse);
    if (!walking) this.setPrompt(null);
    this.refreshEnter();
  }

  startMinimap(): void {
    const c = $('minimap') as HTMLCanvasElement;
    const g = c.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = 180 * dpr;
    c.height = 180 * dpr;
    window.setInterval(() => {
      if (c.hidden || !this.world) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.world.drawMinimap(g, 180, 180);
    }, 120);
  }

  private bindStick() {
    const stick = $('stick');
    const knob = $('stickKnob');
    let id: number | null = null;
    const move = (e: PointerEvent) => {
      const r = stick.getBoundingClientRect();
      let x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      let y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const l = Math.hypot(x, y);
      if (l > 1) {
        x /= l;
        y /= l;
      }
      knob.style.transform = `translate(${x * 34}px,${y * 34}px)`;
      this.world?.setStick(x, y);
    };
    stick.addEventListener('pointerdown', (e) => {
      id = e.pointerId;
      stick.setPointerCapture(e.pointerId);
      move(e);
      e.stopPropagation();
    });
    stick.addEventListener('pointermove', (e) => {
      if (e.pointerId === id) move(e);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = null;
      knob.style.transform = '';
      this.world?.setStick(0, 0);
    };
    stick.addEventListener('pointerup', end);
    stick.addEventListener('pointercancel', end);
  }
}
