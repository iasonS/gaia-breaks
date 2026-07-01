import { createRenderer } from './gl/renderer.js';
import { createScenes } from './gl/scenes.js';
import { createUI } from './ui/uiLayer.js';
import { createAudioClock } from './audioClock.js';
import { sampleScore } from './score.js';
import { score } from './score-data.js';
// Import the track as an asset so the production build inlines it as a base64
// data URI (assetsInlineLimit is set huge in vite.config) — the single-file
// dist/index.html is then fully self-contained and plays standalone.
import trackUrl from '../audio/born-to-be-a-star.mp3';

const SHOOT = location.search.includes('shoot'); // headless screenshot mode

document.getElementById('track').src = trackUrl;

const canvas = document.getElementById('gl');
const dpr = Math.min(devicePixelRatio || 1, 2);
function resize(){ canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; }
resize(); addEventListener('resize', resize);

const renderer = createRenderer(canvas);
const scenes = createScenes(renderer);
const ui = createUI(document.getElementById('ui'));
const clock = createAudioClock(document.getElementById('track'));

// volume: a small HUD-styled slider, bottom-right; remembers the level
const audioEl = document.getElementById('track');
const vol = document.createElement('div');
vol.id = 'vol';
vol.innerHTML = '<span>VOL</span><input type="range" min="0" max="1" step="0.01">';
document.body.appendChild(vol);
const volSlider = vol.querySelector('input');
volSlider.value = localStorage.getItem('gaia-vol') ?? '1';
audioEl.volume = +volSlider.value;
volSlider.addEventListener('input', () => {
  audioEl.volume = +volSlider.value;
  localStorage.setItem('gaia-vol', volSlider.value);
});

const gate = document.getElementById('gate');
if (SHOOT) { gate.style.display = 'none'; vol.style.display = 'none'; }
gate.addEventListener('click', async () => {
  gate.style.display = 'none';
  document.documentElement.requestFullscreen?.().catch(() => {});
  wake();
  await clock.play();
});

// the ritual: once it begins, the interface recedes — cursor and volume fade
// away until the hand moves again
let idleTimer = null;
function wake() {
  document.body.style.cursor = '';
  vol.style.opacity = '';
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    document.body.style.cursor = 'none';
    vol.style.opacity = '0';
  }, 2500);
}
addEventListener('mousemove', () => { if (idleTimer !== null) wake(); });

let endAt = null;
(function loop(){
  const t = clock.time;
  // Authored choreography rides the deterministic audio clock (t). Organic motion
  // gets its own time so the final Gate keeps breathing after the track ends,
  // instead of freezing into a dead frame.
  let animT = t;
  if (clock.duration && t >= clock.duration - 0.05 && !clock.isPlaying) {
    if (endAt === null) endAt = performance.now();
    animT = clock.duration + (performance.now() - endAt) / 1000;
  } else {
    endAt = null;
  }
  const s = sampleScore(score, t);
  scenes.frame(s, animT);
  ui.update({
    ui: s.ui, corruption: s.corruption, time: t, duration: score.duration,
    movement: s.blend >= 0.5 ? s.to : s.from, blend: s.blend, transitions: score.transitions,
  });
  requestAnimationFrame(loop);
})();

// expose for the dev scrubber / screenshot tool
window.__gaia = { clock, score, sampleScore };

if (import.meta.env.DEV && !SHOOT) {
  const { mountScrubber } = await import('./dev/scrubber.js');
  mountScrubber({ clock, score });
}
