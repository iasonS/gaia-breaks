// Authored score. Transition times + corruption are SEEDED here, then hand-tuned
// against the track via the dev scrubber. Numbers below are starting points.
export const score = {
  duration: 325,
  order: ['world', 'titan', 'maw', 'gate'],
  // Transition times locked to the track's real energy structure
  // (see src/dev/analyze-cli.js -> public/score-seed.json):
  //   ~108s = the drop, ~308s = collapse into the Minecraft ending.
  transitions: [
    { at: 48, dur: 4 },     // dead world -> fallen titan (authored beat, building dread)
    { at: 108, dur: 4 },    // titan -> maw : THE DROP (energy 0.42 -> 0.67)
    { at: 304, dur: 6 },    // maw -> gate : outro collapses into the soft ending
  ],
  // Corruption tracks the real dynamics: clean intro, full at the drop,
  // PEAK across the hardest stretch (112-168), a dip in the breakdown
  // (170-200), moderate outro, healed for the Gate.
  corruption: [
    { t: 0, v: 0.06 },
    { t: 12, v: 0.12 },    // build begins
    { t: 48, v: 0.20 },    // titan: dread rising
    { t: 92, v: 0.40 },    // the lift before the drop
    { t: 108, v: 0.55 },   // the drop hits
    { t: 112, v: 1.10 },
    { t: 140, v: 1.50 },   // peak of the hardest stretch
    { t: 168, v: 1.30 },
    { t: 174, v: 0.45 },   // the breakdown calms
    { t: 196, v: 1.00 },   // brief resurgence (192-200)
    { t: 206, v: 0.60 },   // outro settles
    { t: 260, v: 0.70 },
    { t: 300, v: 0.50 },
    { t: 310, v: 0.05 },   // healed for the Gate / Minecraft ending
    { t: 325, v: 0.0 },
  ],
  // render-mode breaks: the engine momentarily flips to wireframe/debug view.
  // Authored into the Titan's dread-build, getting more frequent toward the drop,
  // with a hard flip ON the drop itself.
  glitches: [
    { at: 62, dur: 0.5 },
    { at: 80, dur: 0.8 },
    { at: 94, dur: 0.6 },
    { at: 100, dur: 1.0 },
    { at: 104, dur: 0.7 },
    { at: 108, dur: 1.4 },   // THE DROP — full wireframe flip
    { at: 140, dur: 0.5 },   // a stab at the peak
  ],
  ui: [
    { id: 'title', show: 0, hide: 10 },
    { id: 'world-label', show: 6, hide: 44 },
    { id: 'titan-label', show: 52, hide: 104 },
    { id: 'maw-label', show: 112, hide: 150 },
    { id: 'doomed', show: 130, hide: 200 },
  ],
};
