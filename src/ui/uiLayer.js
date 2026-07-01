// Diegetic game-UI overlay (404 / DUSQK aesthetic): brief title-card cues
// + a persistent HUD of fake telemetry, framing, scanlines and a progress bar.

const ELEMENTS = {
  title:    { html: 'Born to be a star<br><span class="kana">星に生まれて</span>', pos: 'top:24px;left:28px;font-size:22px;' },
  'world-label': { html: 'THE DEAD WORLD<br><span class="kana">死せる星 / EXTINCT</span>', pos: 'top:34%;left:28px;font-size:18px;color:#b9a3ff;' },
  'titan-label': { html: 'THE FALLEN TITAN<br><span class="kana">倒れし巨神</span>', pos: 'top:34%;left:28px;font-size:18px;color:#d3b0a0;' },
  'maw-label': { html: 'THE MAW<br><span class="kana">虚空 / BOUNDLESS ABYSS</span>', pos: 'top:34%;left:28px;font-size:18px;color:#c9b3ff;' },
  doomed:   { html: 'YOU ARE DOOMED.', pos: 'bottom:46px;left:28px;font-size:13px;letter-spacing:3px;color:#8a93a8;' },
};

// per-movement HUD identity
const MOV = {
  world: { n: '01', name: 'DEAD WORLD',   kana: '死せる星' },
  titan: { n: '02', name: 'FALLEN TITAN', kana: '倒れし巨神' },
  maw:   { n: '03', name: 'THE MAW',      kana: '虚空' },
  gate:  { n: '04', name: 'THE GATE',     kana: '鳥居' },
};

const CSS = `
.kana{font-size:.6em;opacity:.7;letter-spacing:2px;}
#ui .glitch{text-shadow:1px 0 #7b3cff,-1px 0 #23e0e0;}
#hud-scan{position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;opacity:.35;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.06) 0 1px,transparent 1px 3px);}
#hud-vig{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.55) 100%);}
.hud-br{position:absolute;width:26px;height:26px;border:1px solid rgba(150,200,255,.45);}
#hud-cross{position:absolute;left:50%;top:50%;width:22px;height:22px;transform:translate(-50%,-50%);
  pointer-events:none;opacity:.4;}
#hud-cross:before,#hud-cross:after{content:'';position:absolute;background:rgba(150,200,255,.6);}
#hud-cross:before{left:50%;top:0;width:1px;height:100%;transform:translateX(-.5px);}
#hud-cross:after{top:50%;left:0;height:1px;width:100%;transform:translateY(-.5px);}
#hud-tel{position:absolute;top:24px;right:28px;text-align:right;font-size:11px;line-height:1.7;
  letter-spacing:1.5px;color:#8fd6e0;opacity:.72;text-shadow:0 0 6px rgba(0,0,0,.7);}
#hud-tel .lbl{color:#5d7a86;}
#hud-warn{position:absolute;top:14%;left:50%;transform:translateX(-50%);font-size:13px;
  letter-spacing:4px;color:#ff5a6e;opacity:0;text-shadow:0 0 8px rgba(255,40,70,.6);}
#hud-bar{position:absolute;left:28px;right:28px;bottom:24px;height:14px;pointer-events:none;}
#hud-track{position:absolute;left:0;right:0;top:6px;height:1px;background:rgba(150,200,255,.25);}
#hud-fill{position:absolute;left:0;top:5px;height:3px;width:0;background:#9ec3ff;box-shadow:0 0 8px #6fa8ff;}
#hud-time{position:absolute;right:0;top:-14px;font-size:10px;letter-spacing:2px;color:#7e98ad;}
#hud-tick{position:absolute;top:4px;width:1px;height:5px;background:rgba(150,200,255,.5);}
`;

function mmss(s){ s=Math.max(0,Math.floor(s||0)); return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
function smoothstep(a,b,x){ const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); }

export function createUI(root) {
  const nodes = {};
  for (const [id, def] of Object.entries(ELEMENTS)) {
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;text-shadow:0 0 6px rgba(0,0,0,.7);opacity:0;transition:opacity .4s;' + def.pos;
    el.innerHTML = def.html;
    root.appendChild(el); nodes[id] = el;
  }
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // persistent HUD furniture
  const scan = el('div', 'hud-scan'); const vig = el('div', 'hud-vig');
  const cross = el('div', '', 'hud-cross');
  const corners = [['top:18px;left:18px;border-right:0;border-bottom:0'],
                   ['top:18px;right:18px;border-left:0;border-bottom:0'],
                   ['bottom:18px;left:18px;border-right:0;border-top:0'],
                   ['bottom:18px;right:18px;border-left:0;border-top:0']]
    .map(([s]) => { const b = document.createElement('div'); b.className='hud-br'; b.style.cssText+=';'+s; root.appendChild(b); return b; });
  const tel = el('div', '', 'hud-tel');
  const warn = el('div', '', 'hud-warn'); warn.textContent = '! HULL INTEGRITY FAILURE';
  const bar = el('div', '', 'hud-bar');
  const track = document.createElement('div'); track.id='hud-track'; bar.appendChild(track);
  const fill = document.createElement('div'); fill.id='hud-fill'; bar.appendChild(fill);
  const time = document.createElement('div'); time.id='hud-time'; bar.appendChild(time);
  function el(tag, cls, id){ const n=document.createElement(tag); if(cls)n.className=cls; if(id)n.id=id; root.appendChild(n); return n; }

  // place movement boundary ticks on the bar (proportional to duration)
  function placeTicks(duration, transitions){
    for (const tr of transitions){
      const t = document.createElement('div'); t.className='hud-tick';
      t.style.left = `${(tr.at/duration)*100}%`; bar.appendChild(t);
    }
  }

  let ticksDone = false;
  // state = { ui:[ids], corruption, time, duration, movement, blend }
  function update(state) {
    const { ui: visibleIds = [], corruption = 0, time: t = 0, duration = 1, movement = 'world', blend = 0 } = state;
    if (!ticksDone && state.transitions){ placeTicks(duration, state.transitions); ticksDone = true; }

    const glitch = corruption > 0.8;
    for (const [id, node] of Object.entries(nodes)) {
      node.style.opacity = visibleIds.includes(id) ? '0.9' : '0';
      node.classList.toggle('glitch', glitch);
    }

    // telemetry: fake star-coordinate drift + signal driven by corruption
    const m = MOV[movement] || MOV.world;
    const ra = (12.6 + Math.sin(t * 0.013) * 0.7).toFixed(3);
    const dec = (-41.2 + Math.cos(t * 0.009) * 1.4).toFixed(2);
    const sig = Math.min(99, Math.round(corruption * 64));
    const sys = (0x4000 + Math.floor(t * 7) % 0xBFFF).toString(16).toUpperCase().padStart(4, '0');
    tel.innerHTML =
      `<span class="lbl">SECT</span> [${m.n}] ${m.name}<br>` +
      `<span class="kana">${m.kana}</span><br>` +
      `<span class="lbl">RA</span> ${ra}h <span class="lbl">DEC</span> ${dec}<br>` +
      `<span class="lbl">SIG</span> ${String(sig).padStart(2,'0')}%  <span class="lbl">SYS</span> 0x${sys}`;
    tel.classList.toggle('glitch', glitch);

    warn.style.opacity = corruption > 1.1 ? String(0.5 + 0.5 * Math.abs(Math.sin(t * 8))) : '0';

    fill.style.width = `${Math.min(100, (t / duration) * 100)}%`;
    time.textContent = `${mmss(t)} / ${mmss(duration)}`;

    // boot-up at the open, power-down into the Gate at the close: the interface
    // comes online, struggles, dies, and signs off — bookending the piece.
    const hud = smoothstep(0.5, 5, t) * (1 - smoothstep(310, 322, t));
    tel.style.opacity = String(0.72 * hud);
    scan.style.opacity = String(0.35 * hud);
    bar.style.opacity = String(hud);
    for (const b of corners) b.style.opacity = String(hud);
    cross.style.opacity = String((0.25 + 0.25 * Math.abs(Math.sin(t * 1.5))) * hud);
  }
  return { update };
}
