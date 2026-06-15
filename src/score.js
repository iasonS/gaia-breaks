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
