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

const gate = document.getElementById('gate');
if (SHOOT) gate.style.display = 'none';
gate.addEventListener('click', async () => {
  gate.style.display = 'none';
  await clock.play();
});

(function loop(){
  const t = clock.time;
  const s = sampleScore(score, t);
  scenes.frame(s, t);
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
