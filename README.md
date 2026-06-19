# gaia-breaks — *Born to be a star*

A fixed, authored WebGL audiovisual piece. It plays identically every time —
hand-choreographed to the track, not reactive. Four movements tell a story of
struggle and collapse: **Dead World → Fallen Titan → The Maw → The Gate**.

The aesthetic is fake-game-UI + breakcore + doom: a cinematic vista corrupted by
ink, glitch and a diegetic HUD that surges with the music, then powers down into a
quiet resolution. The render engine periodically "breaks" into a wireframe/debug
X-ray view on authored beats.

## Run

```bash
npm install
npm run dev      # Vite dev server + scrubber at localhost:5173
npm test         # Vitest logic tests
npm run build    # single self-contained dist/index.html
```

The production build inlines everything (JS, shaders, audio) into one
`dist/index.html` you can open or share directly — no server required.

## How it works

The audio's `currentTime` is the master clock. `src/score.js` (pure) maps time to a
movement blend, a corruption level, UI cues and render-mode breaks, all driven by
authored keyframes in `src/score-data.js`. Each frame renders two scenes to textures;
`corruption.frag` mixes and shreds them to screen; `ui/uiLayer.js` overlays the HUD.

Scenes are raw WebGL2 fragment shaders (procedural SDF / raymarch-lite), no meshes.

## Note

The track itself is a personal working asset and is not included in this repository.
Drop an audio file at `audio/born-to-be-a-star.mp3` to run it locally.
