# Born to be a star — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fixed, authored, single-page WebGL audiovisual piece for the track *Born to be a star* (Izar, 5:25) that plays identically every time and morphs through three movements (Colossus → Maw → Gate) with glitch corruption that surges with the music.

**Architecture:** Vanilla ES modules + raw WebGL2. The `<audio>` element's `currentTime` is the master clock. A pure **score** (keyframe data) maps time → movement blend, corruption intensity, and UI cues. Each frame: render scene A and scene B to textures, run one corruption post-process pass that mixes and shreds them to screen, composite a diegetic UI overlay on top. A one-time offline analysis tool (Web Audio `OfflineAudioContext`) seeds the score from the real track energy; everything after is hand-authored. Dev uses Vite for hot-reload + a timeline scrubber; ship is a single inlined HTML via `vite-plugin-singlefile`.

**Tech Stack:** Vite (dev server + singlefile build), vanilla JS (ES modules), WebGL2, GLSL, Web Audio (offline analysis only), Vitest (logic unit tests), yt-dlp (one-time audio fetch).

**TDD note:** Logic modules (`audioClock`, `score`, `analyze` math) are built test-first with Vitest. Shader/visual tasks are verified through the dev scrubber against documented pass criteria — pixel assertions are not used for art. Every visual task lists explicit, checkable visual criteria.

---

## File Structure

```
gaia-breaks/
  package.json                      # deps + scripts
  vite.config.js                    # dev + singlefile build
  index.html                        # dev entry: audio el, canvas, dev-ui mount
  CLAUDE.md                         # repo architecture ref (project rule)
  .gitignore                        # already has .superpowers/, add audio/ + node_modules + dist
  audio/                            # downloaded track (gitignored, not shipped to repo)
  public/score-seed.json            # output of analysis tool (committed)
  src/
    main.js                         # Director: bootstrap + main loop
    audioClock.js                   # play gate + clamped time over an injected media object
    score.js                        # PURE sampling: sampleCurve, movementAt, sampleScore
    score-data.js                   # authored keyframe data (tuned over time)
    gl/
      renderer.js                   # WebGL2 ctx, fullscreen quad, FBOs, program helpers
      scenes.js                     # compile scene + corruption programs; render helpers
      shaders/
        fullscreen.vert
        common.glsl                 # shared noise/sdf helpers (imported via ?raw concat)
        colossus.frag
        maw.frag
        gate.frag
        corruption.frag             # mixes sceneA/sceneB + applies corruption
    ui/uiLayer.js                   # diegetic fake-game UI overlay, cued by score
    dev/
      scrubber.js                   # timeline scrubber + live corruption-curve editor (dev only)
      analyze.html                  # offline analysis entry
      analyze.js                    # decode audio -> energy envelope + transitions -> JSON
  tests/
    audioClock.test.js
    score.test.js
    analyze.test.js
```

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `CLAUDE.md`, `src/main.js`
- Modify: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "gaia-breaks",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "vite-plugin-singlefile": "^2.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ command }) => ({
  plugins: command === 'build' ? [viteSingleFile()] : [],
  build: { assetsInlineLimit: 100000000, cssCodeSplit: false },
}));
```

- [ ] **Step 3: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Born to be a star</title>
  <style>
    html,body{margin:0;height:100%;background:#000;overflow:hidden;font-family:'Courier New',monospace;}
    #stage{position:fixed;inset:0;}
    #gl{width:100%;height:100%;display:block;}
    #ui{position:fixed;inset:0;pointer-events:none;color:#dfe7f5;}
    #gate{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
          background:#000;color:#9ec3ff;letter-spacing:3px;cursor:pointer;z-index:10;}
  </style>
</head>
<body>
  <div id="stage"><canvas id="gl"></canvas></div>
  <div id="ui"></div>
  <div id="gate">▶ CLICK TO BEGIN</div>
  <audio id="track" src="/audio/born-to-be-a-star.mp3" preload="auto"></audio>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create placeholder `src/main.js`**

```js
const gate = document.getElementById('gate');
gate.addEventListener('click', () => { gate.style.display = 'none'; });
console.log('gaia-breaks boot');
```

- [ ] **Step 5: Create `CLAUDE.md`**

```markdown
# CLAUDE.md — gaia-breaks

Fixed, authored WebGL audiovisual piece for the track *Born to be a star* (Izar).
Plays identically every time. See `docs/superpowers/specs/2026-06-15-born-to-be-a-star-design.md`.

## Run
- `npm run dev` — Vite dev server with hot-reload + scrubber
- `npm test` — Vitest logic tests
- `npm run build` — single inlined `dist/index.html` for sharing

## Architecture
Audio `currentTime` is the master clock. `score.js` (pure) maps time → movement blend +
corruption + UI cues. Each frame renders sceneA + sceneB to textures; `corruption.frag`
mixes and shreds them to screen; `ui/uiLayer.js` overlays diegetic game-UI.

## Authoring
`src/dev/analyze.html` produces `public/score-seed.json` from the track once.
`src/score-data.js` is the hand-tuned authored keyframes. Tune via the dev scrubber.
```

- [ ] **Step 6: Append to `.gitignore`**

```
node_modules/
dist/
audio/
```

- [ ] **Step 7: Install and verify dev server boots**

Run: `cd /home/unix/gaia-breaks && npm install && npm run dev`
Expected: Vite prints a local URL; opening it shows a black page with "▶ CLICK TO BEGIN" that disappears on click; console logs "gaia-breaks boot". Stop the server (Ctrl-C) after confirming.

- [ ] **Step 8: Commit**

```bash
git add package.json vite.config.js index.html src/main.js CLAUDE.md .gitignore package-lock.json
git commit -m "Scaffold Vite project, dev entry, and run scripts"
```

---

## Task 2: Acquire the track + offline analysis math (test-first)

**Files:**
- Create: `src/dev/analyze.js`, `tests/analyze.test.js`
- Output (manual): `audio/born-to-be-a-star.mp3`

- [ ] **Step 1: Download the track (one-time, manual)**

Run:
```bash
cd /home/unix/gaia-breaks && mkdir -p audio && \
yt-dlp -x --audio-format mp3 -o "audio/born-to-be-a-star.%(ext)s" \
  "https://www.youtube.com/watch?v=NxPrlyed_iU"
```
Expected: `audio/born-to-be-a-star.mp3` exists (~5 min file). It is gitignored — a personal working asset, never committed.

- [ ] **Step 2: Write failing tests for the analysis math**

`tests/analyze.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { rmsEnvelope, normalize, detectBoundaries } from '../src/dev/analyze.js';

describe('rmsEnvelope', () => {
  it('downsamples to the requested number of hops', () => {
    const samples = new Float32Array(1000).fill(0.5);
    const env = rmsEnvelope(samples, 10);
    expect(env.length).toBe(10);
    expect(env[0]).toBeCloseTo(0.5, 5);
  });
  it('returns higher values for louder windows', () => {
    const s = new Float32Array(200);
    s.fill(0.1, 0, 100); s.fill(0.9, 100, 200);
    const env = rmsEnvelope(s, 2);
    expect(env[1]).toBeGreaterThan(env[0]);
  });
});

describe('normalize', () => {
  it('scales the peak to 1 and floor to 0', () => {
    const out = normalize([2, 4, 6]);
    expect(out[0]).toBeCloseTo(0); expect(out[2]).toBeCloseTo(1);
  });
  it('handles a flat array without NaN', () => {
    expect(normalize([3, 3, 3]).every(v => v === 0)).toBe(true);
  });
});

describe('detectBoundaries', () => {
  it('finds the index where energy jumps up past the threshold', () => {
    const env = [0.1, 0.1, 0.1, 0.9, 0.9, 0.2];
    const b = detectBoundaries(env, 0.4);
    expect(b).toContain(3); // jump up
    expect(b).toContain(5); // drop down
  });
});
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `npm test -- analyze`
Expected: FAIL — functions not exported.

- [ ] **Step 4: Implement the analysis math in `src/dev/analyze.js`**

```js
// Pure analysis helpers (tested) + a browser-only runner (Step 6).

/** RMS energy per hop. samples: Float32Array mono. hops: number of output buckets. */
export function rmsEnvelope(samples, hops) {
  const out = new Float32Array(hops);
  const win = Math.floor(samples.length / hops);
  for (let h = 0; h < hops; h++) {
    let sum = 0;
    const start = h * win;
    for (let i = 0; i < win; i++) { const v = samples[start + i] || 0; sum += v * v; }
    out[h] = Math.sqrt(sum / win);
  }
  return out;
}

/** Scale array so min->0, max->1. Flat input -> all zeros. */
export function normalize(arr) {
  let min = Infinity, max = -Infinity;
  for (const v of arr) { if (v < min) min = v; if (v > max) max = v; }
  const range = max - min;
  return arr.map(v => (range === 0 ? 0 : (v - min) / range));
}

/** Indices where the normalized envelope crosses `threshold` (up or down). */
export function detectBoundaries(env, threshold) {
  const b = [];
  for (let i = 1; i < env.length; i++) {
    const a = env[i - 1] >= threshold, c = env[i] >= threshold;
    if (a !== c) b.push(i);
  }
  return b;
}
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `npm test -- analyze`
Expected: PASS (all 5).

- [ ] **Step 6: Add the browser runner to `src/dev/analyze.js`**

Append:
```js
// Browser-only: decode the track and export public/score-seed.json.
// Guarded so importing for tests (node) does not touch the DOM.
export async function runAnalysis(arrayBuffer, hopsPerSecond = 8) {
  const ctx = new OfflineAudioContext(1, 44100, 44100);
  const buf = await ctx.decodeAudioData(arrayBuffer);
  const mono = buf.getChannelData(0);
  const hops = Math.round(buf.duration * hopsPerSecond);
  const env = normalize(Array.from(rmsEnvelope(mono, hops)));
  const boundaries = detectBoundaries(env, 0.45).map(i => +(i / hopsPerSecond).toFixed(2));
  return { duration: +buf.duration.toFixed(2), hopsPerSecond, envelope: env, boundaries };
}

if (typeof document !== 'undefined' && document.getElementById('analyze-run')) {
  const out = document.getElementById('analyze-out');
  document.getElementById('analyze-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const result = await runAnalysis(await file.arrayBuffer());
    out.textContent = JSON.stringify(result);
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'score-seed.json'; a.textContent = 'download score-seed.json';
    out.after(a);
  });
}
```

- [ ] **Step 7: Create `src/dev/analyze.html`**

```html
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>analyze</title></head>
<body style="font-family:monospace;background:#111;color:#ddd;padding:20px;">
  <h3>score-seed analyzer</h3>
  <input id="analyze-file" type="file" accept="audio/*" />
  <button id="analyze-run">run</button>
  <pre id="analyze-out" style="white-space:pre-wrap;"></pre>
  <script type="module" src="/src/dev/analyze.js"></script>
</body></html>
```

- [ ] **Step 8: Generate the seed (manual) and commit it**

Run `npm run dev`, open `/src/dev/analyze.html`, choose `audio/born-to-be-a-star.mp3`, download `score-seed.json`, move it to `public/score-seed.json`.
Expected: JSON with `duration ≈ 325`, an `envelope` array, and a `boundaries` list (candidate transition times).

```bash
git add src/dev/analyze.js src/dev/analyze.html tests/analyze.test.js public/score-seed.json
git commit -m "Add offline analysis tool and committed score seed"
```

---

## Task 3: Audio clock (test-first)

**Files:**
- Create: `src/audioClock.js`, `tests/audioClock.test.js`

- [ ] **Step 1: Write failing tests**

`tests/audioClock.test.js`:
```js
import { describe, it, expect, vi } from 'vitest';
import { createAudioClock } from '../src/audioClock.js';

function fakeMedia() {
  return { currentTime: 0, duration: 325, paused: true,
    play: vi.fn(function () { this.paused = false; return Promise.resolve(); }),
    pause: vi.fn(function () { this.paused = true; }) };
}

describe('createAudioClock', () => {
  it('reports clamped time within [0, duration]', () => {
    const m = fakeMedia(); const c = createAudioClock(m);
    m.currentTime = -5; expect(c.time).toBe(0);
    m.currentTime = 999; expect(c.time).toBe(325);
    m.currentTime = 100; expect(c.time).toBe(100);
  });
  it('play() starts the media and flips isPlaying', async () => {
    const m = fakeMedia(); const c = createAudioClock(m);
    await c.play();
    expect(m.play).toHaveBeenCalled(); expect(c.isPlaying).toBe(true);
  });
  it('seek() sets currentTime clamped', () => {
    const m = fakeMedia(); const c = createAudioClock(m);
    c.seek(400); expect(m.currentTime).toBe(325);
    c.seek(50); expect(m.currentTime).toBe(50);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm test -- audioClock`
Expected: FAIL — `createAudioClock` not defined.

- [ ] **Step 3: Implement `src/audioClock.js`**

```js
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Thin wrapper over an HTMLAudioElement (or any {currentTime,duration,paused,play,pause}). */
export function createAudioClock(media) {
  return {
    get time() { return clamp(media.currentTime || 0, 0, media.duration || 0); },
    get duration() { return media.duration || 0; },
    get isPlaying() { return !media.paused; },
    async play() { await media.play(); },
    pause() { media.pause(); },
    seek(t) { media.currentTime = clamp(t, 0, media.duration || 0); },
  };
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npm test -- audioClock`
Expected: PASS (all 3).

- [ ] **Step 5: Commit**

```bash
git add src/audioClock.js tests/audioClock.test.js
git commit -m "Add audio clock with clamped time and play gate"
```

---

## Task 4: Score sampling (test-first) + seed data

**Files:**
- Create: `src/score.js`, `src/score-data.js`, `tests/score.test.js`

- [ ] **Step 1: Write failing tests**

`tests/score.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { sampleCurve, movementAt, sampleScore } from '../src/score.js';

describe('sampleCurve', () => {
  const pts = [{ t: 0, v: 0 }, { t: 10, v: 1 }, { t: 20, v: 0 }];
  it('clamps before first and after last point', () => {
    expect(sampleCurve(pts, -1)).toBe(0);
    expect(sampleCurve(pts, 99)).toBe(0);
  });
  it('linearly interpolates between points', () => {
    expect(sampleCurve(pts, 5)).toBeCloseTo(0.5);
    expect(sampleCurve(pts, 15)).toBeCloseTo(0.5);
  });
  it('returns exact value at a knot', () => {
    expect(sampleCurve(pts, 10)).toBe(1);
  });
});

describe('movementAt', () => {
  const order = ['colossus', 'maw', 'gate'];
  const transitions = [{ at: 100, dur: 4 }, { at: 240, dur: 6 }];
  it('returns a single movement with blend 0 outside transition windows', () => {
    expect(movementAt(10, order, transitions)).toEqual({ from: 'colossus', to: 'colossus', blend: 0 });
    expect(movementAt(150, order, transitions)).toEqual({ from: 'maw', to: 'maw', blend: 0 });
    expect(movementAt(300, order, transitions)).toEqual({ from: 'gate', to: 'gate', blend: 0 });
  });
  it('crossfades across a transition window', () => {
    const m = movementAt(102, order, transitions); // 2s into a 4s fade at t=100
    expect(m.from).toBe('colossus'); expect(m.to).toBe('maw');
    expect(m.blend).toBeCloseTo(0.5);
  });
});

describe('sampleScore', () => {
  it('bundles movement + corruption + ui at a time', () => {
    const score = {
      order: ['colossus', 'maw', 'gate'],
      transitions: [{ at: 100, dur: 4 }, { at: 240, dur: 6 }],
      corruption: [{ t: 0, v: 0.1 }, { t: 100, v: 1.2 }, { t: 246, v: 0 }],
      ui: [{ id: 'title', show: 0, hide: 8 }],
    };
    const s = sampleScore(score, 2);
    expect(s.from).toBe('colossus');
    expect(s.corruption).toBeCloseTo(0.1 + (1.2 - 0.1) * (2 / 100), 3);
    expect(s.ui).toContain('title');
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm test -- score`
Expected: FAIL — exports missing.

- [ ] **Step 3: Implement `src/score.js`**

```js
/** Piecewise-linear sample of [{t,v},...] sorted by t. Clamps outside the range. */
export function sampleCurve(points, t) {
  if (points.length === 0) return 0;
  if (t <= points[0].t) return points[0].v;
  const last = points[points.length - 1];
  if (t >= last.t) return last.v;
  for (let i = 1; i < points.length; i++) {
    if (t <= points[i].t) {
      const a = points[i - 1], b = points[i];
      const f = (t - a.t) / (b.t - a.t);
      return a.v + (b.v - a.v) * f;
    }
  }
  return last.v;
}

/** Which movement(s) are active at time t, with crossfade blend 0..1. */
export function movementAt(t, order, transitions) {
  let index = 0;
  for (let i = 0; i < transitions.length; i++) {
    const tr = transitions[i];
    if (t >= tr.at && t < tr.at + tr.dur) {
      return { from: order[i], to: order[i + 1], blend: (t - tr.at) / tr.dur };
    }
    if (t >= tr.at + tr.dur) index = i + 1;
  }
  return { from: order[index], to: order[index], blend: 0 };
}

/** Bundle everything the director needs at time t. */
export function sampleScore(score, t) {
  const m = movementAt(t, score.order, score.transitions);
  const corruption = sampleCurve(score.corruption, t);
  const ui = score.ui.filter(c => t >= c.show && t < c.hide).map(c => c.id);
  return { ...m, corruption, ui };
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npm test -- score`
Expected: PASS (all tests).

- [ ] **Step 5: Create `src/score-data.js` seeded from analysis**

Use the two largest `boundaries` from `public/score-seed.json` as initial transition times (these are hand-tuned later). Initial corruption curve mirrors the energy envelope shape: low at the open, peak at the Maw, zero at the Gate.

```js
// Authored score. Transition times + corruption are SEEDED from analysis, then hand-tuned.
// Replace the numbers below with the real boundaries from public/score-seed.json.
export const score = {
  order: ['colossus', 'maw', 'gate'],
  // colossus->maw on the drop; maw->gate into the soft outro:
  transitions: [
    { at: 60, dur: 4 },
    { at: 270, dur: 8 },
  ],
  // 0 = clean, ~1 = Storm, >1 = past Storm (the Maw peak):
  corruption: [
    { t: 0, v: 0.08 },
    { t: 58, v: 0.25 },
    { t: 64, v: 1.0 },
    { t: 180, v: 1.45 },   // past Storm at the hardest stretch
    { t: 268, v: 1.1 },
    { t: 280, v: 0.05 },   // healed for the Gate
    { t: 325, v: 0.0 },
  ],
  ui: [
    { id: 'title', show: 0, hide: 10 },
    { id: 'maw-label', show: 64, hide: 90 },
    { id: 'doomed', show: 120, hide: 200 },
    { id: 'gate-end', show: 285, hide: 325 },
  ],
};
```

- [ ] **Step 6: Commit**

```bash
git add src/score.js src/score-data.js tests/score.test.js
git commit -m "Add pure score sampling and seeded authored score data"
```

---

## Task 5: WebGL2 renderer core

**Files:**
- Create: `src/gl/renderer.js`, `src/gl/shaders/fullscreen.vert`

**Visual verification task** — no unit test; verified by a temporary on-screen draw.

- [ ] **Step 1: Create `src/gl/shaders/fullscreen.vert`**

```glsl
#version 300 es
const vec2 verts[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
out vec2 vUv;
void main() {
  vec2 p = verts[gl_VertexID];
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
```

- [ ] **Step 2: Implement `src/gl/renderer.js`**

```js
import vertSrc from './shaders/fullscreen.vert?raw';

export function createRenderer(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
  if (!gl) throw new Error('WebGL2 not supported');

  function compile(fragSrc) {
    const prog = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, vertSrc], [gl.FRAGMENT_SHADER, fragSrc]]) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw new Error('shader: ' + gl.getShaderInfoLog(sh) + '\n' + src);
      }
      gl.attachShader(prog, sh);
    }
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(prog));
    return prog;
  }

  function createTarget(w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo, w, h };
  }

  // Draw a fullscreen triangle with `prog`. target=null -> screen.
  function draw(prog, setUniforms, target) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, target ? target.w : canvas.width, target ? target.h : canvas.height);
    gl.useProgram(prog);
    if (setUniforms) setUniforms(gl, prog);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function uni(prog, name) { return gl.getUniformLocation(prog, name); }

  return { gl, canvas, compile, createTarget, draw, uni };
}
```

- [ ] **Step 3: Temporary verification draw in `src/main.js`**

Replace `src/main.js` with:
```js
import { createRenderer } from './gl/renderer.js';

const canvas = document.getElementById('gl');
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
resize(); addEventListener('resize', resize);

const r = createRenderer(canvas);
const prog = r.compile(`#version 300 es
precision highp float; in vec2 vUv; out vec4 o;
void main(){ o = vec4(vUv, 0.5, 1.0); }`);
r.draw(prog, null, null);
document.getElementById('gate').style.display = 'none';
```

- [ ] **Step 4: Verify**

Run: `npm run dev`, open the URL.
Pass criteria: a smooth red→green gradient (blue 0.5) fills the screen, no console errors, resizes with the window. Then stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/gl/renderer.js src/gl/shaders/fullscreen.vert src/main.js
git commit -m "Add WebGL2 renderer core with FBO targets and fullscreen draw"
```

---

## Task 6: Scenes + corruption pipeline (first-pass shaders)

**Files:**
- Create: `src/gl/shaders/common.glsl`, `colossus.frag`, `maw.frag`, `gate.frag`, `corruption.frag`, `src/gl/scenes.js`

**Visual verification task.** Shaders are intentionally first-pass — real beauty comes in the tuning loop. They must render recognizably and the pipeline must mix + corrupt.

- [ ] **Step 1: Create `src/gl/shaders/common.glsl`**

```glsl
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3,289.1)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
```

- [ ] **Step 2: Create `src/gl/shaders/colossus.frag`** (blood sun + dark arch silhouette)

```glsl
#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
// __COMMON__
void main(){
  vec2 uv = vUv;
  vec3 sky = mix(vec3(0.09,0.06,0.19), vec3(0.88,0.33,0.12), pow(uv.y,1.6));
  float sun = smoothstep(0.16,0.0, distance(uv, vec2(0.5,0.30)));
  vec3 col = sky + vec3(1.0,0.55,0.15)*sun*1.4;
  // arch silhouette: dark where a noisy band crosses mid-screen
  float arch = smoothstep(0.0,0.04, abs(uv.y-0.5 - 0.18*sin(uv.x*3.14)) - 0.16);
  col *= mix(0.04, 1.0, arch);
  float drift = noise(uv*3.0 + uTime*0.02)*0.04;
  o = vec4(col+drift, 1.0);
}
```

- [ ] **Step 3: Create `src/gl/shaders/maw.frag`** (black hole + accretion ring)

```glsl
#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
// __COMMON__
void main(){
  vec2 p = vUv - 0.5; p.x *= 1.78;
  float r = length(p);
  vec3 col = vec3(0.02,0.015,0.05);
  float ring = smoothstep(0.30,0.26,r) * smoothstep(0.18,0.22,r);
  float swirl = 0.5+0.5*sin(atan(p.y,p.x)*6.0 + uTime*1.5 - r*30.0);
  col += mix(vec3(0.9,0.35,0.08), vec3(1.0,0.85,0.5), swirl) * ring * 1.6;
  col *= smoothstep(0.16,0.19,r); // black core
  o = vec4(col, 1.0);
}
```

- [ ] **Step 4: Create `src/gl/shaders/gate.frag`** (still water + pale light + sunk gate)

```glsl
#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform float uTime;
// __COMMON__
void main(){
  vec2 uv = vUv;
  vec3 col = mix(vec3(0.06,0.13,0.20), vec3(0.55,0.50,0.45), pow(uv.y,2.0));
  float moon = smoothstep(0.06,0.0, distance(uv, vec2(0.62,0.78)));
  col += vec3(1.0,0.96,0.88)*moon;
  if (uv.y < 0.42){ // water
    float ripple = sin((uv.y*60.0) + noise(uv*8.0+uTime*0.1)*4.0)*0.5+0.5;
    col = mix(vec3(0.04,0.08,0.11), col, 0.5) + ripple*0.03;
  }
  // two pillars (the gate) as dark vertical bands near center
  float g = step(0.02, abs(uv.x-0.44)) * step(0.02, abs(uv.x-0.56));
  if (uv.y>0.30 && uv.y<0.62) col *= mix(0.1,1.0,g);
  o = vec4(col,1.0);
}
```

- [ ] **Step 5: Create `src/gl/shaders/corruption.frag`** (mix A/B + glitch driven by intensity)

```glsl
#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uBlend;       // 0..1 scene crossfade
uniform float uCorrupt;     // 0..~1.5 corruption intensity
uniform float uTime;
// __COMMON__
void main(){
  vec2 uv = vUv;
  float c = uCorrupt;
  // horizontal tear/displacement, stronger with corruption
  float band = step(0.5, noise(vec2(floor(uv.y*40.0), floor(uTime*12.0))));
  uv.x += (band-0.5) * 0.06 * c;
  // chromatic split
  vec2 off = vec2(0.008*c, 0.0);
  float blend = clamp(uBlend,0.0,1.0);
  vec3 a, b;
  a.r = mix(texture(uA,uv+off).r, texture(uB,uv+off).r, blend);
  a.g = mix(texture(uA,uv).g,     texture(uB,uv).g,     blend);
  a.b = mix(texture(uA,uv-off).b, texture(uB,uv-off).b, blend);
  vec3 col = a;
  // ink edge accent (cheap): difference from a small neighbor
  vec3 n = mix(texture(uA,uv+vec2(0.002)).rgb, texture(uB,uv+vec2(0.002)).rgb, blend);
  float edge = clamp(length(col-n)*8.0,0.0,1.0);
  col = mix(col, vec3(0.0), edge*0.5*c);
  col += vec3(0.48,0.24,1.0) * edge * c; // violet ink
  // scanlines + grain scale with corruption
  col *= 1.0 - 0.25*c*step(0.5, fract(uv.y*220.0));
  col += (hash(uv*vec2(uTime*60.0,1.0))-0.5)*0.10*c;
  o = vec4(col,1.0);
}
```

- [ ] **Step 6: Implement `src/gl/scenes.js`**

```js
import common from './shaders/common.glsl?raw';
import colossus from './shaders/colossus.frag?raw';
import maw from './shaders/maw.frag?raw';
import gate from './shaders/gate.frag?raw';
import corruptionSrc from './shaders/corruption.frag?raw';

const inject = (src) => src.replace('// __COMMON__', common);

export function createScenes(renderer) {
  const { gl, compile, createTarget, draw, uni } = renderer;
  const progs = {
    colossus: compile(inject(colossus)),
    maw: compile(inject(maw)),
    gate: compile(inject(gate)),
  };
  const corruption = compile(inject(corruptionSrc));
  let texA = createTarget(gl.canvas.width, gl.canvas.height);
  let texB = createTarget(gl.canvas.width, gl.canvas.height);

  function ensureSize() {
    if (texA.w !== gl.canvas.width || texA.h !== gl.canvas.height) {
      texA = createTarget(gl.canvas.width, gl.canvas.height);
      texB = createTarget(gl.canvas.width, gl.canvas.height);
    }
  }

  function renderInto(target, name, time) {
    draw(progs[name], (g, p) => g.uniform1f(uni(p, 'uTime'), time), target);
  }

  // s = { from, to, blend, corruption } from sampleScore
  function frame(s, time) {
    ensureSize();
    renderInto(texA, s.from, time);
    renderInto(texB, s.to, time);
    draw(corruption, (g, p) => {
      g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, texA.tex); g.uniform1i(uni(p, 'uA'), 0);
      g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, texB.tex); g.uniform1i(uni(p, 'uB'), 1);
      g.uniform1f(uni(p, 'uBlend'), s.blend);
      g.uniform1f(uni(p, 'uCorrupt'), s.corruption);
      g.uniform1f(uni(p, 'uTime'), time);
    }, null);
  }

  return { frame };
}
```

- [ ] **Step 7: Temporary verification in `src/main.js`**

```js
import { createRenderer } from './gl/renderer.js';
import { createScenes } from './gl/scenes.js';

const canvas = document.getElementById('gl');
function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
resize(); addEventListener('resize', resize);

const r = createRenderer(canvas);
const scenes = createScenes(r);
document.getElementById('gate').style.display='none';
let t0 = performance.now();
(function loop(){
  const time = (performance.now()-t0)/1000;
  // cycle: colossus -> maw -> gate, ramp corruption
  const cyc = (time % 12)/12;
  const s = cyc<0.4 ? {from:'colossus',to:'maw',blend:cyc/0.4,corruption:cyc*1.4}
        : cyc<0.7 ? {from:'maw',to:'maw',blend:0,corruption:1.4}
        : {from:'maw',to:'gate',blend:(cyc-0.7)/0.3,corruption:1.4*(1.0-(cyc-0.7)/0.3)};
  scenes.frame(s, time);
  requestAnimationFrame(loop);
})();
```

- [ ] **Step 8: Verify**

Run: `npm run dev`.
Pass criteria, over a 12s cycle: a warm sun/arch scene crossfades into a swirling ring (black core) which then heals into a cool still-water scene; corruption (tearing, violet edges, scanlines, grain) is heavy during the ring and near-absent in the still-water phase. No console/shader errors.

- [ ] **Step 9: Commit**

```bash
git add src/gl/shaders/ src/gl/scenes.js src/main.js
git commit -m "Add three scene shaders and corruption pipeline (first pass)"
```

---

## Task 7: UI layer (diegetic game-UI)

**Files:**
- Create: `src/ui/uiLayer.js`

**Visual verification task.**

- [ ] **Step 1: Implement `src/ui/uiLayer.js`**

```js
const ELEMENTS = {
  title:    { html: 'Born to be a star<br><span class="kana">星に生まれて</span>', pos: 'top:24px;left:28px;font-size:22px;' },
  'maw-label': { html: 'THE MAW<br><span class="kana">虚空 / BOUNDLESS ABYSS</span>', pos: 'top:34%;left:28px;font-size:18px;color:#c9b3ff;' },
  doomed:   { html: 'YOU ARE DOOMED.', pos: 'bottom:24px;left:28px;font-size:13px;letter-spacing:3px;color:#8a93a8;' },
  'gate-end': { html: 'GO ALONE', pos: 'bottom:24px;right:28px;font-size:13px;border:1px solid #5a6478;padding:4px 12px;' },
};

export function createUI(root) {
  const nodes = {};
  for (const [id, def] of Object.entries(ELEMENTS)) {
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;text-shadow:0 0 6px rgba(0,0,0,.7);opacity:0;transition:opacity .4s;' + def.pos;
    el.innerHTML = def.html;
    root.appendChild(el); nodes[id] = el;
  }
  const style = document.createElement('style');
  style.textContent = '.kana{font-size:.6em;opacity:.7;letter-spacing:2px;} #ui .glitch{animation:none;text-shadow:1px 0 #7b3cff,-1px 0 #23e0e0;}';
  document.head.appendChild(style);

  function update(visibleIds, corruption) {
    for (const [id, el] of Object.entries(nodes)) {
      el.style.opacity = visibleIds.includes(id) ? '0.9' : '0';
      el.classList.toggle('glitch', corruption > 0.8);
    }
  }
  return { update };
}
```

- [ ] **Step 2: Verify (temporary wiring)**

Temporarily, in the `src/main.js` loop, add `import { createUI } from './ui/uiLayer.js';`, create `const ui = createUI(document.getElementById('ui'));`, and call `ui.update(cyc<0.2?['title']:cyc<0.6?['maw-label','doomed']:['gate-end'], s.corruption);`.
Pass criteria: the title fades in at start, the Maw label + DOOMED appear and show chromatic glitch while corruption is high, GO ALONE appears at the end. Revert this temporary wiring after confirming (Task 8 wires it properly).

- [ ] **Step 3: Commit**

```bash
git add src/ui/uiLayer.js
git commit -m "Add diegetic game-UI overlay layer"
```

---

## Task 8: Director — wire everything to audio time

**Files:**
- Modify: `src/main.js`

**Visual verification task** (full playthrough).

- [ ] **Step 1: Replace `src/main.js` with the real director**

```js
import { createRenderer } from './gl/renderer.js';
import { createScenes } from './gl/scenes.js';
import { createUI } from './ui/uiLayer.js';
import { createAudioClock } from './audioClock.js';
import { sampleScore } from './score.js';
import { score } from './score-data.js';

const canvas = document.getElementById('gl');
const dpr = Math.min(devicePixelRatio || 1, 2);
function resize(){ canvas.width = innerWidth*dpr; canvas.height = innerHeight*dpr; }
resize(); addEventListener('resize', resize);

const renderer = createRenderer(canvas);
const scenes = createScenes(renderer);
const ui = createUI(document.getElementById('ui'));
const clock = createAudioClock(document.getElementById('track'));

const gate = document.getElementById('gate');
gate.addEventListener('click', async () => {
  gate.style.display = 'none';
  await clock.play();
});

(function loop(){
  const t = clock.time;
  const s = sampleScore(score, t);
  scenes.frame(s, t);
  ui.update(s.ui, s.corruption);
  requestAnimationFrame(loop);
})();

// expose for the dev scrubber (Task 9)
window.__gaia = { clock, score, sampleScore };
```

- [ ] **Step 2: Verify full playthrough**

Run: `npm run dev`, click to begin, let it play.
Pass criteria: audio plays; the scene sits in Colossus, crossfades to Maw at the first transition with corruption surging, then heals into Gate near the end with the UI cues appearing at their times; reloading and replaying produces the *same* result at the same timestamps.

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "Wire director: audio clock drives score, scenes, UI"
```

---

## Task 9: Dev scrubber + live corruption editor

**Files:**
- Create: `src/dev/scrubber.js`
- Modify: `src/main.js` (mount scrubber only in dev)

**Visual verification task.**

- [ ] **Step 1: Implement `src/dev/scrubber.js`**

```js
// Dev-only timeline scrubber + live corruption-curve editor.
export function mountScrubber({ clock, score }) {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;padding:8px;background:rgba(0,0,0,.7);'
    + 'font:12px monospace;color:#cfe3ff;z-index:50;pointer-events:auto;display:flex;gap:10px;align-items:center;';
  const playBtn = document.createElement('button'); playBtn.textContent = '▶/⏸';
  const seek = document.createElement('input');
  seek.type = 'range'; seek.min = 0; seek.max = 1000; seek.value = 0; seek.style.flex = '1';
  const read = document.createElement('span'); read.style.minWidth = '220px';
  const edit = document.createElement('textarea');
  edit.style.cssText = 'position:fixed;top:8px;right:8px;width:280px;height:160px;background:#0b0b12;color:#9ec3ff;'
    + 'font:11px monospace;z-index:50;pointer-events:auto;';
  edit.value = JSON.stringify(score.corruption, null, 1);

  playBtn.onclick = () => (clock.isPlaying ? clock.pause() : clock.play());
  seek.oninput = () => clock.seek((seek.value / 1000) * (clock.duration || 1));
  edit.onchange = () => { try { score.corruption = JSON.parse(edit.value); } catch (e) { edit.style.borderColor = 'red'; return; } edit.style.borderColor = ''; };

  bar.append(playBtn, seek, read);
  document.body.append(bar, edit);

  setInterval(() => {
    const d = clock.duration || 1;
    if (document.activeElement !== seek) seek.value = (clock.time / d) * 1000;
    read.textContent = `t=${clock.time.toFixed(1)}s / ${d.toFixed(0)}s`;
  }, 100);
}
```

- [ ] **Step 2: Mount it in `src/main.js` for dev only**

Add near the end of `src/main.js`:
```js
if (import.meta.env.DEV) {
  const { mountScrubber } = await import('./dev/scrubber.js');
  mountScrubber({ clock, score });
}
```
(Change the top of `main.js` to allow top-level await by leaving the module as-is — Vite supports it. If needed, wrap in an async IIFE.)

- [ ] **Step 3: Verify**

Run: `npm run dev`.
Pass criteria: a scrubber bar appears; dragging it jumps the audio and visuals to any second instantly; play/pause works; editing the corruption JSON textarea and blurring updates the on-screen corruption live without reload.

- [ ] **Step 4: Confirm the scrubber is absent in a production build**

Run: `npm run build && npm run preview`.
Pass criteria: no scrubber bar / textarea in the preview (it is `import.meta.env.DEV`-gated).

- [ ] **Step 5: Commit**

```bash
git add src/dev/scrubber.js src/main.js
git commit -m "Add dev scrubber and live corruption-curve editor"
```

---

## Task 10: Single-file shareable build

**Files:**
- Modify: none (config already in place from Task 1)

- [ ] **Step 1: Build**

Run: `cd /home/unix/gaia-breaks && npm run build`
Expected: `dist/index.html` produced, with JS/CSS inlined.

- [ ] **Step 2: Handle the audio for the shared file**

The track is not inlined (it is in `/audio` and gitignored). For sharing, the recipient needs the mp3 alongside, OR inline it as base64. Add a documented option in `CLAUDE.md`: to make a truly standalone file, base64-inline the mp3 into the `<audio src>` before building. For the dev/preview build, copy the mp3 next to `dist/index.html`.

Run: `cp audio/born-to-be-a-star.mp3 dist/ && sed -i 's#/audio/born-to-be-a-star.mp3#born-to-be-a-star.mp3#' dist/index.html`

- [ ] **Step 3: Verify the built file plays standalone**

Run: `npm run preview` and open it.
Pass criteria: click to begin, the full piece plays start to finish identically to dev, with no scrubber and no dev artifacts.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "Document single-file build and audio handling for sharing"
```

---

## Tuning phase (not plan steps)

After Task 10 the machine exists and runs. Beauty happens in the dev loop, not as plan tasks: with the real track playing, scrub to each moment and hand-tune `score-data.js` (transition times, corruption curve, UI cue times) and iterate on the scene/corruption shaders until each movement lands and the Gate ending feels healed. This is open-ended authoring with the user in the chair — the explicit goal of the whole project.

---

## Self-Review

**Spec coverage:**
- Fixed/authored, identical every play → audio-time clock + pure score (Tasks 3, 4, 8). ✓
- Colossus→Maw→Gate order B → `score.order` + scene shaders (Tasks 4, 6). ✓
- A base + B corruption surging past Storm → corruption curve to v>1 + corruption.frag (Tasks 4, 6). ✓
- Silhouettes only / all code → scene shaders draw forms, no external assets (Task 6). ✓
- Six components → audioClock, score, scenes(renderer+scenes), corruption, ui, director (Tasks 3–8). ✓
- Analyze→bake→hand-tune → analyze tool + seeded score-data + tuning phase (Tasks 2, 4, end). ✓
- Scrubber/hot-reload tooling → Vite dev + scrubber (Tasks 1, 9). ✓
- Single-file deliverable → singlefile build (Task 10). ✓
- Robustness (play gate, load, dpr cap) → gate button (Task 8), dpr cap (Task 8). ✓

**Placeholder scan:** Scene/corruption shaders are explicitly first-pass real code (compile and render), not placeholders; tuning is a named non-task phase. No "TODO"/"TBD" in steps. ✓

**Type consistency:** `sampleScore` returns `{from,to,blend,corruption,ui}`; consumed identically in `scenes.frame(s)` and `ui.update(s.ui, s.corruption)`. `createAudioClock` exposes `time/duration/isPlaying/play/pause/seek`, used consistently in director + scrubber. ✓
