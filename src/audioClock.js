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
