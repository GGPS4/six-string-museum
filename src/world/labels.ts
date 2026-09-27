import * as THREE from 'three';
import { DISPLAY, MONO, fitText } from './textures';

/** Floating signboard above a pavilion: wing letter, name and a one-line blurb. */
export function makeLabel(letter: string, name: string, blurb: string, color: string): THREE.Sprite {
  const w = 768;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(16,12,10,0.86)';
  roundRect(g, 4, 4, w - 8, h - 8, 26);
  g.fill();
  g.strokeStyle = color;
  g.lineWidth = 5;
  roundRect(g, 4, 4, w - 8, h - 8, 26);
  g.stroke();
  g.fillStyle = color;
  g.font = `800 150px ${DISPLAY}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(letter, 96, h / 2 + 6);
  g.textAlign = 'left';
  g.fillStyle = '#f4ead9';
  g.font = `800 84px ${DISPLAY}`;
  g.save();
  const nameW = g.measureText(name.toUpperCase()).width;
  const maxW = w - 200;
  g.translate(180, 104);
  if (nameW > maxW) g.scale(maxW / nameW, 1);
  g.fillText(name.toUpperCase(), 0, 0);
  g.restore();
  g.fillStyle = '#b9aa97';
  g.font = `400 34px ${MONO}`;
  fitLeft(g, blurb, 180, 182, maxW);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(12, 4, 1);
  s.renderOrder = 5;
  return s;
}

/** A plain text sprite, for small in-world captions. */
export function textSprite(text: string, color = '#f4ead9', scale = 3): THREE.Sprite {
  const w = 512;
  const h = 128;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(16,12,10,0.8)';
  roundRect(g, 2, 2, w - 4, h - 4, 18);
  g.fill();
  g.fillStyle = color;
  g.font = `800 64px ${DISPLAY}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fitText(g, text.toUpperCase(), w / 2, h / 2 + 4, w - 30);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
  s.scale.set(scale, scale / 4, 1);
  return s;
}

function fitLeft(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number) {
  const m = g.measureText(text).width;
  g.save();
  g.translate(x, y);
  if (m > max) g.scale(max / m, 1);
  g.fillText(text, 0, 0);
  g.restore();
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
