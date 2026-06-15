// Authored score. Transition times + corruption are SEEDED from analysis, then hand-tuned
// against the track via the dev scrubber. Numbers below are starting points.
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
