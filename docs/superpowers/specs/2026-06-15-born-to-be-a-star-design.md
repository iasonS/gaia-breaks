# Born to be a star — design spec

- **Date:** 2026-06-15
- **Status:** Approved (design), pending implementation plan
- **Working name:** gaia-breaks

## What it is

A fixed, authored audiovisual piece for one track — *Born to be a star* by Izar (5:25).
A single web page that plays the song and renders one continuous shot that morphs
through three movements, hand-choreographed to the music. It plays **identically every
time**: there is no live audio reactivity and no randomness. It is shareable as a single
file, the way the breakcore-viz is.

This is a **finished product, not a visualizer.** Every moment is deliberately composed.
The reactive visualizer fell short because it left things to chance; this cannot fail the
same way, because we author each frame.

## The emotional arc

Order **B**: **Colossus → Maw → Gate**. Fallen → fight → still water.

| Movement | Feeling | Music | Visual |
|---|---|---|---|
| **The Colossus** | loss, already fallen | opening | a dead titan arching the sky, blood sun setting through its ruin |
| **The Maw** | struggle | the harsh body / the drop | a black hole, accretion ring blazing, the frame coming apart |
| **The Gate** | enduring, peace | the soft Minecraft-ending outro | a half-sunk gate in still water; the frame heals |

The figure throughout is a small dark silhouette — a soul dwarfed by immensity. The
arc is reminiscence and struggle resolving into earned stillness.

## The track

- *Born to be a star* — Izar — 5:25 (325s).
- Harsh breakcore body that dissolves into a soft "Minecraft-ending" outro. That outro
  **is** the Gate.

## Visual model

Two visual languages from the references, fused:

- **A — cinematic vista** (DUSQK Gaia/RAE): soft, atmospheric, sublime distance.
- **B — ink / glitch / game-UI** (404 Breakcore): high-contrast, violet, scratchy,
  heavy diegetic fake-game UI.

**The rule:** A is the base; B is *corruption that surges with the music.* The clean
cinematic frame fights to stay whole, gets torn apart as the Maw peaks, and heals into
stillness at the Gate. The corruption is the breakcore made visible — the struggle
rendered as the image itself coming apart.

- Calm (Colossus open, Gate): near-clean A.
- Peak (the Maw): corruption pushed **past** the "Storm" reference mock — genuinely
  violent. Displacement tearing, full chromatic split, scratch flood, glitch bars, UI
  screaming.

**Figures are silhouettes only — no illustrated character art.** The whole piece is code;
nothing is sourced or generated externally.

## Architecture

Single self-contained web page. The `<audio>` element's `currentTime` is the master
clock; everything is keyed to it (this is what makes playback deterministic). Six bounded
units, each with one job:

1. **Audio clock** — loads and plays the track; exposes current time and a play gate.
2. **Score** — authored keyframe data mapping `time → { active movement + morph blend,
   corruption intensity, scene params (sun/camera/colors), UI cues }`. This is the
   "tailored to the song" payload. Plain data, not an algorithm.
3. **Scene renderer** — three scene modules (Colossus, Maw, Gate), each a fragment
   shader drawing its vista to an offscreen texture. During a transition it renders two
   and blends/morphs.
4. **Corruption pass** — one post-process fragment shader over the scene texture:
   displacement/tearing, chromatic split, ink edge-detect + hatching, scanlines, grain,
   violet grade. Strength driven by the score's corruption intensity.
5. **UI layer** — diegetic fake-game UI (title, kana, stat lines, CHOOSE / YOU ARE
   DOOMED / GO ALONE) as a DOM/canvas overlay, cued by the score, with its own glitch.
6. **Director** — main loop: read audio time, sample the score, push values into
   renderer / corruption / UI, draw the frame.

### Per-frame data flow

```
audio time → director samples score
           → scene renderer draws active movement(s) to texture
           → corruption pass shreds texture to screen at score intensity
           → UI layer composited on top
```

## Authoring workflow

The part that prevents falling short:

1. **Analyze the track once, offline.** Pull the audio with yt-dlp; run a one-time
   analysis to extract the energy envelope and detect section boundaries (where it turns
   harsh, where it breaks into the outro). This gives the song's real skeleton as data.
2. **Bake into the score, then hand-tune.** The analysis seeds the corruption curve and
   the two transition points (Colossus→Maw on the drop, Maw→Gate into the outro). Then
   every keyframe is hand-tuned for feel. Analysis = skeleton; authoring = soul.
3. The result is fixed and tailored. Re-running the analysis is not part of playback.

## Iteration tooling (build this first)

The tight loop is the whole point and must exist before scene polish:

- **Timeline scrubber** — jump to any second instantly.
- **Hot-reload** — code changes appear immediately.
- **Live keyframe tweaking** — adjust score values and see them against the real track.

The loop: user watches a moment → "more tearing here, slower morph, sun lower" → adjust
→ visible in seconds. Grind every beat against the track until it lands.

## Deliverable

One self-contained HTML file plus the audio track. Opens and plays identically for anyone.
A dev/scrub mode that is hidden or stripped for the shared build.

## Robustness (intentionally light — fixed artifact)

- A play button (browsers require a user gesture to start audio).
- Audio-load failure fallback message.
- Resolution / devicePixelRatio cap if a machine struggles.
- Timing rides on audio `currentTime`, so it self-syncs if frames drop.

## Validation / done criteria

- Plays start-to-finish in sync with the track, identically across runs and machines.
- The three movements read clearly and morph without hard cuts.
- Corruption visibly surges with the music and peaks past the Storm reference at the Maw.
- Holds a smooth frame rate at 1080p on the dev machine.
- The Gate ending lands — clean, still, the frame healed.
- The user, watching it with the track, feels it does not fall short. (The real test.)

## Open details (settle during build)

- Exact transition timestamps — pending the offline analysis.
- The on-screen game-title and UI copy (it is a fake-game piece, so it carries a title).
- Who the silhouette is, and whether it is the same figure across all three movements.
- The Gate's exact imagery (drowned torii vs other still-water motif).

## Out of scope (YAGNI)

- Live FFT / audio reactivity. Explicitly not wanted.
- Per-play variation or generative behavior.
- Multiple tracks or a track picker.
- Illustrated/anime character art.
- A build pipeline or framework — single page, no bundler unless it earns its place.
