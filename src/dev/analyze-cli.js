// Decode the track with ffmpeg and analyze its energy structure in Node,
// reusing the same tested helpers as the browser runner. No DOM / WebAudio.
//   node src/dev/analyze-cli.js audio/born-to-be-a-star.mp3
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { rmsEnvelope, normalize, detectBoundaries } from './analyze.js';

const file = process.argv[2] || 'audio/born-to-be-a-star.mp3';
const SR = 22050;             // decode sample rate (mono)
const HPS = 8;                // envelope hops per second

// ffmpeg -> raw 32-bit float mono PCM on stdout
const ff = spawnSync('ffmpeg', [
  '-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', 'pipe:1',
], { maxBuffer: 1 << 30 });
if (ff.status !== 0) { console.error(ff.stderr.toString()); process.exit(1); }

const pcm = new Float32Array(ff.stdout.buffer, ff.stdout.byteOffset, Math.floor(ff.stdout.length / 4));
const duration = pcm.length / SR;
const hops = Math.round(duration * HPS);
const env = normalize(Array.from(rmsEnvelope(pcm, hops)));

// smooth the envelope so we read structure, not per-beat spikes
const smooth = (a, r) => a.map((_, i) => {
  let s = 0, n = 0;
  for (let j = Math.max(0, i - r); j <= Math.min(a.length - 1, i + r); j++) { s += a[j]; n++; }
  return s / n;
});
const sm = smooth(env, HPS); // ~1s window

// coarse 4s energy profile (read the song's shape at a glance)
const STEP = 4 * HPS;
const profile = [];
for (let i = 0; i < sm.length; i += STEP) {
  const seg = sm.slice(i, i + STEP);
  const avg = seg.reduce((x, y) => x + y, 0) / seg.length;
  profile.push({ t: +(i / HPS).toFixed(0), e: +avg.toFixed(3) });
}

// sustained section boundaries on the smoothed envelope
const boundaries = detectBoundaries(sm, 0.5).map(i => +(i / HPS).toFixed(1));

console.log('duration', duration.toFixed(1), 's   hops', hops);
console.log('\n4s energy profile (t=sec, e=0..1):');
let line = '';
for (const p of profile) {
  const bar = '#'.repeat(Math.round(p.e * 30));
  line = `${String(p.t).padStart(4)}s |${bar.padEnd(30)}| ${p.e}`;
  console.log(line);
}
console.log('\nthreshold(0.5) crossings:', JSON.stringify(boundaries));

const seed = { duration: +duration.toFixed(2), hopsPerSecond: HPS, boundaries, profile };
writeFileSync('public/score-seed.json', JSON.stringify(seed, null, 2));
console.log('\nwrote public/score-seed.json');
