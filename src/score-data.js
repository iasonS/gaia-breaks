// Authored score. Transition times + corruption are SEEDED here, then hand-tuned
// against the track via the dev scrubber. Numbers below are starting points.
export const score = {
  duration: 325,
  order: ['world', 'titan', 'maw', 'gate'],
  // dead world -> fallen titan -> (the drop) maw -> (the outro) gate
  transitions: [
    { at: 48, dur: 4 },
    { at: 104, dur: 4 },
    { at: 272, dur: 8 },
  ],
  // 0 = clean, ~1 = Storm, >1 = past Storm (the Maw peak):
  corruption: [
    { t: 0, v: 0.06 },
    { t: 48, v: 0.12 },
    { t: 104, v: 0.30 },
    { t: 112, v: 1.0 },
    { t: 200, v: 1.5 },    // past Storm at the hardest stretch
    { t: 270, v: 1.1 },
    { t: 282, v: 0.05 },   // healed for the Gate
    { t: 325, v: 0.0 },
  ],
  ui: [
    { id: 'title', show: 0, hide: 10 },
    { id: 'world-label', show: 6, hide: 40 },
    { id: 'titan-label', show: 52, hide: 92 },
    { id: 'maw-label', show: 114, hide: 150 },
    { id: 'doomed', show: 160, hide: 240 },
    { id: 'gate-end', show: 285, hide: 325 },
  ],
};
