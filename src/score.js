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

/** Time window [start,end] for each movement (includes its entering crossfade). */
export function movementWindows(order, transitions, duration) {
  const w = [];
  for (let i = 0; i < order.length; i++) {
    const start = i === 0 ? 0 : transitions[i - 1].at;
    const end = i < transitions.length ? (transitions[i].at + transitions[i].dur) : duration;
    w.push({ name: order[i], start, end });
  }
  return w;
}

/** Normalized 0..1 progress of time t through the named movement's window. */
export function progressFor(t, name, windows) {
  const win = windows.find(w => w.name === name);
  if (!win || win.end <= win.start) return 0;
  return Math.max(0, Math.min(1, (t - win.start) / (win.end - win.start)));
}

/** Bundle everything the director needs at time t. */
export function sampleScore(score, t) {
  const m = movementAt(t, score.order, score.transitions);
  const corruption = sampleCurve(score.corruption, t);
  const ui = score.ui.filter(c => t >= c.show && t < c.hide).map(c => c.id);
  const windows = movementWindows(score.order, score.transitions, score.duration || 0);
  return { ...m, corruption, ui, fromP: progressFor(t, m.from, windows), toP: progressFor(t, m.to, windows) };
}
