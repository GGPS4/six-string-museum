import './legacy/wings.css';
import './styles.css';
import './legacy/lessons.js';
import './legacy/app.js';
import './legacy/wings.js';
import { Hud } from './ui/hud';
import { World } from './world/World';
import { wingById, type WingId } from './wings';

const hud = new Hud();
const canvas = document.getElementById('scene') as HTMLCanvasElement;
let world: World;
try {
  world = new World(canvas, hud.hooks);
} catch (err) {
  console.error(err);
  const card = document.querySelector('.landing-card');
  if (card) card.insertAdjacentHTML('beforeend', '<p class="msg err">3D graphics could not start in this browser (WebGL is off or unsupported). Try a recent Chrome, Edge, Firefox or Safari.</p>');
  throw err;
}
hud.attach(world);
hud.startMinimap();

const unlockAudio = () => {
  try {
    (window as any).SSM?.Snd?.ctx;
  } catch {
    /* sound stays off until the next click */
  }
};

const begin = (mode: 'walk' | 'fly') => {
  unlockAudio();
  document.getElementById('landing')!.hidden = true;
  document.getElementById('hudTop')!.hidden = false;
  if (mode === 'walk') world.startAtGate();
  else world.flyOver();
  const hash = location.hash.slice(1);
  if (wingById(hash)) world.goto(hash as WingId);
};
document.getElementById('enterWalk')!.addEventListener('click', () => begin('walk'));
document.getElementById('enterFly')!.addEventListener('click', () => begin('fly'));
canvas.addEventListener('pointerdown', unlockAudio, { once: true });
