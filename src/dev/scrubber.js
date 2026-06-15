// Dev-only timeline scrubber + live corruption-curve editor.
export function mountScrubber({ clock, score }) {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;padding:8px;background:rgba(0,0,0,.7);'
    + 'font:12px monospace;color:#cfe3ff;z-index:50;pointer-events:auto;display:flex;gap:10px;align-items:center;';
  const playBtn = document.createElement('button'); playBtn.textContent = '▶/⏸';
  const seek = document.createElement('input');
  seek.type = 'range'; seek.min = 0; seek.max = 1000; seek.value = 0; seek.style.flex = '1';
  const read = document.createElement('span'); read.style.minWidth = '220px';
  const edit = document.createElement('textarea');
  edit.style.cssText = 'position:fixed;top:8px;right:8px;width:280px;height:160px;background:#0b0b12;color:#9ec3ff;'
    + 'font:11px monospace;z-index:50;pointer-events:auto;';
  edit.value = JSON.stringify(score.corruption, null, 1);

  playBtn.onclick = () => (clock.isPlaying ? clock.pause() : clock.play());
  seek.oninput = () => clock.seek((seek.value / 1000) * (clock.duration || 1));
  edit.onchange = () => {
    try { score.corruption = JSON.parse(edit.value); } catch (e) { edit.style.borderColor = 'red'; return; }
    edit.style.borderColor = '';
  };

  bar.append(playBtn, seek, read);
  document.body.append(bar, edit);

  setInterval(() => {
    const d = clock.duration || 1;
    if (document.activeElement !== seek) seek.value = (clock.time / d) * 1000;
    read.textContent = `t=${clock.time.toFixed(1)}s / ${d.toFixed(0)}s`;
  }, 100);
}
