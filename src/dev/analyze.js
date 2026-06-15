// Pure analysis helpers (tested) + a browser-only runner.

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
