# CLAUDE.md — gaia-breaks

Fixed, authored WebGL audiovisual piece for the track *Born to be a star* (Izar).
Plays identically every time. See `docs/superpowers/specs/2026-06-15-born-to-be-a-star-design.md`
and `docs/superpowers/plans/2026-06-15-born-to-be-a-star.md`.

## Run
- `npm run dev` — Vite dev server with hot-reload + scrubber
- `npm test` — Vitest logic tests
- `npm run build` — single inlined `dist/index.html` for sharing

## Architecture
Audio `currentTime` is the master clock. `src/score.js` (pure) maps time → movement blend +
corruption + UI cues, driven by authored keyframes in `src/score-data.js`. Each frame renders
sceneA + sceneB to textures; `corruption.frag` mixes and shreds them to screen; `ui/uiLayer.js`
overlays diegetic game-UI. Six units: audioClock, score, renderer, scenes, ui, director (main).

## Authoring
`src/dev/analyze.html` produces `public/score-seed.json` from the track once.
`src/score-data.js` is the hand-tuned authored keyframes (transition times, corruption curve,
UI cue times). Tune via the dev scrubber (`import.meta.env.DEV` only).

## Notes
- The track mp3 lives in `audio/` and is gitignored (personal working asset, not committed).
- Git authorship: iasonS <sklavenitisi6@gmail.com>, no Co-Authored-By.
