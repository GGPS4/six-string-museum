import * as THREE from 'three';

/** Canvas-drawn textures. Everything is procedural, so the site ships no image files. */

const cache = new Map<string, THREE.CanvasTexture>();

export function canvasTexture(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat?: [number, number]): THREE.CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  cache.set(key, t);
  return t;
}

/** A texture drawn fresh each time (for signs whose text changes). */
export function freshTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function redraw(t: THREE.CanvasTexture, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void): void {
  const c = t.image as HTMLCanvasElement;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, c.width, c.height);
  draw(g, c.width, c.height);
  t.needsUpdate = true;
}

let seed = 7;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/** Long-grain wood: a base colour with darker streaks running along the length. */
export function grain(key: string, base: string, dark: string, repeat: [number, number] = [1, 1], lines = 90): THREE.CanvasTexture {
  return canvasTexture('grain:' + key, 512, 512, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < lines; i++) {
      const x = rnd() * w;
      const wob = 3 + rnd() * 10;
      g.strokeStyle = dark;
      g.globalAlpha = 0.08 + rnd() * 0.22;
      g.lineWidth = 0.6 + rnd() * 2.6;
      g.beginPath();
      for (let y = 0; y <= h; y += 16) g.lineTo(x + Math.sin(y / (40 + wob * 6) + i) * wob, y);
      g.stroke();
    }
    g.globalAlpha = 1;
  }, repeat);
}

export const lawn = () =>
  canvasTexture('lawn', 256, 256, (g, w, h) => {
    g.fillStyle = '#0d1a10';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = rnd() > 0.5 ? 'rgba(40,70,40,.35)' : 'rgba(5,12,6,.5)';
      g.fillRect(rnd() * w, rnd() * h, 1.5, 3 + rnd() * 3);
    }
  }, [300, 300]);

export const brick = () =>
  canvasTexture('brick', 256, 256, (g, w, h) => {
    g.fillStyle = '#3a211b';
    g.fillRect(0, 0, w, h);
    const bh = 16;
    for (let r = 0; r < h / bh; r++) {
      const off = r % 2 ? 24 : 0;
      for (let c = -1; c < w / 48 + 1; c++) {
        const shade = 70 + Math.floor(rnd() * 40);
        g.fillStyle = `rgb(${shade + 40},${shade * 0.5},${shade * 0.4})`;
        g.fillRect(c * 48 + off + 2, r * bh + 2, 44, bh - 3);
      }
    }
  }, [2, 2]);

export const stripes = (a: string, b: string) =>
  canvasTexture('stripes:' + a + b, 256, 64, (g, w, h) => {
    for (let i = 0; i < 16; i++) {
      g.fillStyle = i % 2 ? a : b;
      g.fillRect((i * w) / 16, 0, w / 16 + 1, h);
    }
  });

export const logs = () =>
  canvasTexture('logs', 256, 256, (g, w, h) => {
    for (let i = 0; i < 8; i++) {
      const y = (i * h) / 8;
      const grd = g.createLinearGradient(0, y, 0, y + h / 8);
      grd.addColorStop(0, '#6b4424');
      grd.addColorStop(0.5, '#8a5a31');
      grd.addColorStop(1, '#4a2d16');
      g.fillStyle = grd;
      g.fillRect(0, y, w, h / 8);
    }
  }, [1, 1]);

export type FinishKey = 'sunburst' | 'cherry' | 'natural' | 'seafoam' | 'sonic' | 'shell' | 'white' | 'oxblood' | 'black';
const SOLID: Record<string, string> = { seafoam: '#8CC7B3', sonic: '#86A9C8', shell: '#EDB5AC', white: '#EEEBE2', oxblood: '#6B1F23', black: '#161616' };

/** Guitar finish, mapped over the body's bounding box. */
export function finish(key: string): THREE.CanvasTexture {
  return canvasTexture('finish:' + key, 256, 256, (g, w, h) => {
    if (key === 'sunburst' || key === 'cherry') {
      const grd = g.createRadialGradient(w / 2, h * 0.62, 4, w / 2, h * 0.6, w * 0.62);
      if (key === 'sunburst') {
        grd.addColorStop(0, '#F2B64A');
        grd.addColorStop(0.45, '#C9731E');
        grd.addColorStop(0.8, '#5A2A0E');
        grd.addColorStop(1, '#1A0C05');
      } else {
        grd.addColorStop(0, '#F0663F');
        grd.addColorStop(0.55, '#A81F1F');
        grd.addColorStop(1, '#3A0808');
      }
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    } else if (key === 'natural') {
      g.fillStyle = '#D8A060';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        g.strokeStyle = `rgba(120,70,30,${0.08 + rnd() * 0.18})`;
        g.lineWidth = 1 + rnd() * 2;
        const x = rnd() * w;
        g.beginPath();
        g.moveTo(x, 0);
        g.bezierCurveTo(x + 8, h / 3, x - 8, (2 * h) / 3, x + 3, h);
        g.stroke();
      }
    } else {
      const c = SOLID[key] ?? '#8CC7B3';
      const grd = g.createLinearGradient(0, 0, w * 0.3, h);
      grd.addColorStop(0, c);
      grd.addColorStop(1, shade(c, -0.25));
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    }
  });
}

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt < 0 ? v * amt : (255 - v) * amt))));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export const DISPLAY = '"Big Shoulders Display","Arial Narrow",Impact,sans-serif';
export const MONO = '"JetBrains Mono",ui-monospace,Menlo,monospace';
export const SERIF = 'Newsreader,Georgia,serif';

/** Neon lettering on a dark plate. */
export function neonSign(text: string, color: string, w = 1024, h = 256): THREE.CanvasTexture {
  return canvasTexture('neon:' + text + color + w, w, h, (g) => {
    g.fillStyle = 'rgba(12,10,9,0.92)';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = color;
    g.lineWidth = 6;
    g.strokeRect(10, 10, w - 20, h - 20);
    g.font = `800 ${Math.floor(h * 0.5)}px ${DISPLAY}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = color;
    g.shadowBlur = 24;
    g.fillStyle = color;
    let size = Math.floor(h * 0.5);
    while (g.measureText(text.toUpperCase()).width > w - 60 && size > 20) {
      size -= 4;
      g.font = `800 ${size}px ${DISPLAY}`;
    }
    g.fillText(text.toUpperCase(), w / 2, h / 2 + 4);
    g.shadowBlur = 0;
    g.fillStyle = '#fff8ea';
    g.globalAlpha = 0.55;
    g.fillText(text.toUpperCase(), w / 2, h / 2 + 4);
  });
}

/** A small text plate: placards, drawer labels and the like. */
export function plate(lines: string[], opts: { w?: number; h?: number; bg?: string; fg?: string; font?: string; size?: number } = {}): THREE.CanvasTexture {
  const w = opts.w ?? 512;
  const h = opts.h ?? 256;
  return freshTexture(w, h, (g) => drawPlate(g, w, h, lines, opts));
}

export function drawPlate(g: CanvasRenderingContext2D, w: number, h: number, lines: string[], opts: { bg?: string; fg?: string; font?: string; size?: number } = {}): void {
  g.fillStyle = opts.bg ?? '#1f1914';
  g.fillRect(0, 0, w, h);
  g.fillStyle = opts.fg ?? '#eee5d9';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const size = opts.size ?? Math.floor(h / (lines.length + 1.2));
  lines.forEach((l, i) => {
    g.font = `${i === 0 ? 800 : 400} ${i === 0 ? size : Math.floor(size * 0.62)}px ${i === 0 ? opts.font ?? DISPLAY : SERIF}`;
    const y = h / 2 + (i - (lines.length - 1) / 2) * size * 1.05;
    fitText(g, l, w / 2, y, w - 24);
  });
}

export function fitText(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number): void {
  const m = g.measureText(text).width;
  if (m <= max) g.fillText(text, x, y);
  else {
    g.save();
    g.translate(x, y);
    g.scale(max / m, 1);
    g.fillText(text, 0, 0);
    g.restore();
  }
}
