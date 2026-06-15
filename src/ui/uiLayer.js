const ELEMENTS = {
  title:    { html: 'Born to be a star<br><span class="kana">星に生まれて</span>', pos: 'top:24px;left:28px;font-size:22px;' },
  'maw-label': { html: 'THE MAW<br><span class="kana">虚空 / BOUNDLESS ABYSS</span>', pos: 'top:34%;left:28px;font-size:18px;color:#c9b3ff;' },
  doomed:   { html: 'YOU ARE DOOMED.', pos: 'bottom:24px;left:28px;font-size:13px;letter-spacing:3px;color:#8a93a8;' },
  'gate-end': { html: 'GO ALONE', pos: 'bottom:24px;right:28px;font-size:13px;border:1px solid #5a6478;padding:4px 12px;' },
};

export function createUI(root) {
  const nodes = {};
  for (const [id, def] of Object.entries(ELEMENTS)) {
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;text-shadow:0 0 6px rgba(0,0,0,.7);opacity:0;transition:opacity .4s;' + def.pos;
    el.innerHTML = def.html;
    root.appendChild(el); nodes[id] = el;
  }
  const style = document.createElement('style');
  style.textContent = '.kana{font-size:.6em;opacity:.7;letter-spacing:2px;} #ui .glitch{text-shadow:1px 0 #7b3cff,-1px 0 #23e0e0;}';
  document.head.appendChild(style);

  function update(visibleIds, corruption) {
    for (const [id, el] of Object.entries(nodes)) {
      el.style.opacity = visibleIds.includes(id) ? '0.9' : '0';
      el.classList.toggle('glitch', corruption > 0.8);
    }
  }
  return { update };
}
