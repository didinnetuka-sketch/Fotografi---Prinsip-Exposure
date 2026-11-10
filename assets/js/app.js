/**
 * Petualangan Cahaya: Segitiga Exposure
 * Media Pembelajaran Interaktif Fotografi Dasar DKV
 */

// Quick DOM helpers
const $ = s => document.querySelector(s);
let app;

/* ==========================================================================
   1. Audio Synthesis, Backsound & Text-To-Speech (Web Audio & Speech API)
   ========================================================================== */
let AC, bgOn = true, started = false;

// Real acoustic background music
const bgAudio = new Audio('assets/audio/backsound.mp3');
bgAudio.loop = true;
bgAudio.volume = 0.35;

// Button hover sound effect pool (assets/audio/hover.wav)
const hoverPool = Array.from({ length: 4 }, () => {
  const a = new Audio('assets/audio/hover.wav');
  a.preload = 'auto';
  a.volume = 0.7;
  return a;
});
let hoverIdx = 0;

function playHoverSfx() {
  try {
    const a = hoverPool[hoverIdx];
    hoverIdx = (hoverIdx + 1) % hoverPool.length;
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch (e) {}
}

// Button click sound effect pool (assets/audio/click.wav)
const clickPool = Array.from({ length: 4 }, () => {
  const a = new Audio('assets/audio/click.wav');
  a.preload = 'auto';
  a.volume = 0.8;
  return a;
});
let clickIdx = 0, lastClickAt = 0;

function playClickSfx() {
  const now = performance.now();
  if (now - lastClickAt < 40) return;
  lastClickAt = now;
  try {
    const a = clickPool[clickIdx];
    clickIdx = (clickIdx + 1) % clickPool.length;
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch (e) {}
}

// Modul 5 Jepret Foto button sound effect pool (assets/audio/jepret.wav)
const jepretPool = Array.from({ length: 3 }, () => {
  const a = new Audio('assets/audio/jepret.wav');
  a.preload = 'auto';
  a.volume = 0.9;
  return a;
});
let jepretIdx = 0;

function playJepretSfx() {
  try {
    const a = jepretPool[jepretIdx];
    jepretIdx = (jepretIdx + 1) % jepretPool.length;
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch (e) {}
}

function playBgAudio() {
  if (bgOn) {
    bgAudio.play().catch(() => {});
  }
}

function pauseBgAudio() {
  bgAudio.pause();
}

const ac = () => {
  AC = AC || new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  return AC;
};

function tone(f, d = 0.1, ty = 'sine', v = 0.1, t0 = 0) {
  try {
    const c = ac(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
    o.type = ty;
    o.frequency.value = f;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + d + 0.05);
  } catch (e) {}
}

function nz(d, v) {
  try {
    const c = ac(), n = c.sampleRate * d, b = c.createBuffer(1, n, c.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), g = c.createGain();
    g.gain.value = v;
    s.buffer = b;
    s.connect(g).connect(c.destination);
    s.start();
  } catch (e) {}
}

const sfx = {
  hover: playHoverSfx,
  click: playClickSfx,
  pop: playClickSfx,
  jepret: playJepretSfx,
  tick: () => tone(1300, 0.02, 'square', 0.03),
  shutter: () => { nz(0.05, 0.25); setTimeout(() => nz(0.09, 0.2), 90); },
  fast: () => nz(0.03, 0.3),
  slow: () => { tone(300, 0.12, 'square', 0.08); setTimeout(() => tone(110, 0.25, 'sawtooth', 0.1), 350); },
  ring: () => [0, 0.05, 0.1].forEach(t => tone(500 + t * 2000, 0.03, 'square', 0.05, t)),
  stat: () => nz(0.25, 0.12),
  ok: () => { tone(660, 0.15); tone(880, 0.25, 'sine', 0.1, 0.12); },
  bad: () => tone(150, 0.3, 'sawtooth', 0.07),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.1, i * 0.14))
};

function updateAudioUI() {
  document.querySelectorAll('.au-toggle').forEach(b => {
    b.setAttribute('aria-pressed', bgOn);
    const sw = b.querySelector('.au-switch'), ic = b.querySelector('.au-icon');
    if (sw) {
      sw.className = 'au-switch ' + (bgOn ? 'on' : 'off');
      const t = sw.querySelector('.sw-txt');
      if (t) t.textContent = bgOn ? 'ON' : 'OFF';
    }
    if (ic) ic.textContent = bgOn ? '🔊' : '🔇';
  });

  document.querySelectorAll('.sp-audio-btn').forEach(b => {
    b.setAttribute('aria-pressed', bgOn);
    b.classList.toggle('is-off', !bgOn);
    b.setAttribute('title', bgOn ? 'Matikan Backsound' : 'Nyalakan Backsound');
  });
}

function tg() {
  bgOn = !bgOn;
  if (bgOn) {
    started = true;
    playBgAudio();
  } else {
    pauseBgAudio();
  }
  updateAudioUI();
  sfx.click();
}

// Module narration audio files (Modul 1–5)
const VO_AUDIO = {
  m1: new Audio('assets/audio/narasi-m1.mp3'),
  m2: new Audio('assets/audio/narasi-m2.mp3'),
  m3: new Audio('assets/audio/narasi-m3.mp3'),
  m4: new Audio('assets/audio/narasi-m4.mp3'),
  m5: new Audio('assets/audio/narasi-m5.mp3')
};

let voOn = false, curUtterance = null, curVoAudio = null;

Object.values(VO_AUDIO).forEach(a => {
  a.preload = 'auto';
  a.volume = 1.0;
  const finish = () => {
    if (curVoAudio === a) stopVo(true);
  };
  a.onended = finish;
  a.onerror = finish;
});

function updateVoUI() {
  document.querySelectorAll('.vo-btn').forEach(b => {
    b.classList.toggle('is-on', voOn);
    b.setAttribute('aria-pressed', voOn);
    b.setAttribute('title', voOn ? 'Klik untuk mematikan narasi' : 'Klik untuk memutar narasi');
    b.innerHTML = voOn ? '🔊 Narasi: ON' : '🔊 Narasi';
  });
}

function stopVo(silent = false) {
  voOn = false;
  curUtterance = null;
  if (curVoAudio) {
    try {
      curVoAudio.pause();
      curVoAudio.currentTime = 0;
    } catch (e) {}
    curVoAudio = null;
  }
  if (window.speechSynthesis) {
    speechSynthesis.cancel();
  }
  if (bgOn) bgAudio.volume = 0.35;
  updateVoUI();
  if (!silent) sfx.click();
}

function say(t) {
  if (voOn || (window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending))) {
    stopVo();
    return;
  }

  // Use dedicated narration audio file for Modul 1–5
  const modAudio = !t && VO_AUDIO[cur];
  if (modAudio) {
    sfx.click();
    curVoAudio = modAudio;
    voOn = true;
    if (bgOn) bgAudio.volume = 0.1;
    updateVoUI();
    try {
      modAudio.currentTime = 0;
      modAudio.play().catch(() => stopVo(true));
    } catch (e) {
      stopVo(true);
    }
    return;
  }

  if (!window.speechSynthesis) return;
  const txtEl = typeof t === 'string' ? null : document.querySelector('.txt');
  const text = typeof t === 'string' ? t : (txtEl ? txtEl.innerText : '');
  if (!text) return;

  sfx.click();
  if (speechSynthesis.paused) speechSynthesis.resume();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'id-ID';
  curUtterance = u;
  voOn = true;
  if (bgOn) bgAudio.volume = 0.1;
  updateVoUI();

  u.onstart = () => {
    if (curUtterance !== u) return;
    if (bgOn) bgAudio.volume = 0.1;
  };
  const finish = () => {
    if (curUtterance !== u) return;
    stopVo(true);
  };
  u.onend = finish;
  u.onerror = finish;

  speechSynthesis.speak(u);
}

const voBtn = () => `<button class="btn g noprint vo-btn" onclick="say()" aria-pressed="false" title="Klik untuk memutar narasi">🔊 Narasi</button>`;

const spAudioBtn = () => `
  <button class="sp-audio-btn ${bgOn ? '' : 'is-off'}" onclick="tg()" aria-label="Toggle Backsound" aria-pressed="${bgOn}" title="${bgOn ? 'Matikan Backsound' : 'Nyalakan Backsound'}">
    <svg class="sp-audio-svg" viewBox="0 0 244 64" aria-hidden="true">
      <defs>
        <linearGradient id="sp-gold-rim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f7e49e"/>
          <stop offset="40%" stop-color="#dfbc62"/>
          <stop offset="75%" stop-color="#c9a043"/>
          <stop offset="100%" stop-color="#f3dc8b"/>
        </linearGradient>
        <radialGradient id="sp-bg-sheen" cx="14%" cy="38%" r="58%">
          <stop offset="0%" stop-color="#221f17"/>
          <stop offset="45%" stop-color="#0a0b0d"/>
          <stop offset="100%" stop-color="#050608"/>
        </radialGradient>
      </defs>
      <!-- Outer Gold-Rimmed Black Pill -->
      <rect x="2" y="2" width="240" height="60" rx="30" fill="url(#sp-bg-sheen)" stroke="url(#sp-gold-rim)" stroke-width="2.3"/>
      <!-- Speaker Icon -->
      <path d="M 19 26.5 H 26.5 L 37 17.5 V 46.5 L 26.5 37.5 H 19 A 2 2 0 0 1 17 35.5 V 28.5 A 2 2 0 0 1 19 26.5 Z" fill="#ffffff"/>
      <g class="sp-waves" fill="none" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round">
        <path d="M 42 25 A 9.8 9.8 0 0 1 42 39"/>
        <path d="M 47.8 20.2 A 16 16 0 0 1 47.8 43.8"/>
      </g>
      <!-- Backsound Label -->
      <text x="64" y="38" fill="#ffffff" font-family="Inter, 'Segoe UI', Roboto, Arial, sans-serif" font-weight="700" font-size="18" textLength="79" lengthAdjust="spacingAndGlyphs">Backsound</text>
      <!-- Toggle Switch Track -->
      <rect class="sp-sw-track" x="156" y="13" width="73" height="38" rx="19"/>
      <!-- ON / OFF Labels (Identical Font & Style) -->
      <text class="sp-sw-lbl sp-lbl-on" x="179" y="37.2" text-anchor="middle">ON</text>
      <text class="sp-sw-lbl sp-lbl-off" x="205.5" y="37.2" text-anchor="middle">OFF</text>
      <!-- Sliding White Knob -->
      <circle class="sp-sw-knob" cx="210" cy="32" r="11.5" fill="#ffffff"/>
    </svg>
    <span class="sr-only">Toggle Backsound</span>
  </button>
`;

/* ==========================================================================
   2. Photography Constants & Calculation Helpers
   ========================================================================== */
const AP = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
const SS = [[1/1000, '1/1000'], [1/500, '1/500'], [1/250, '1/250'], [1/60, '1/60'], [1/15, '1/15'], [1, '1s'], [2, '2s']];
const ISO = [100, 200, 400, 800, 1600, 3200, 6400];
const NM = { m1: 'Modul 1', m2: 'Modul 2', m3: 'Modul 3', m4: 'Modul 4', m5: 'Modul 5', m6: 'Modul 6', end: 'Rangkuman' };

const lg = Math.log2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const bright = v => clamp(2 ** (v * 0.55), 0.12, 3.2);
const lbl = v => v < -0.5 ? 'Under Exposure' : v > 0.5 ? 'Over Exposure' : 'Normal Exposure';

const meter = v => {
  v = clamp(v, -3, 3);
  let s = '';
  for (let k = -3; k <= 3; k++) {
    const l = (k + 3) / 6 * 92 + 4;
    s += `<i style="left:${l}%"></i><span style="left:${l}%">${k > 0 ? '+' + k : k}</span>`;
  }
  const l = (v + 3) / 6 * 92 + 4;
  return `<div class="meter">${s}<u style="left:${l}%;background:${Math.abs(v) <= 0.5 ? 'var(--grn)' : 'var(--red)'}"></u></div>`;
};

const shell = h => {
  if (!app) app = $('#app');
  app.innerHTML = h;
};

const nav = n => `<div class="nav"><button class="btn g" onclick="go('menu')">Kembali ke Menu</button>${n ? `<button class="btn" onclick="go('${n}')">Lanjut ke ${NM[n]} ▶</button>` : ''}</div>`;

/* ==========================================================================
   3. Vector Graphic Elements & SVG Filters
   ========================================================================== */
const BG = `<path d="M0 170L70 90 130 150 210 70 300 150 400 100V260H0z" fill="#64748b"/><rect y="190" width="400" height="70" fill="#4d7c0f"/>${[20, 60, 100, 300, 340, 380].map(x => `<rect x="${x}" y="150" width="6" height="45" fill="#78350f"/><circle cx="${x + 3}" cy="145" r="18" fill="#15803d"/>`).join('')}<g stroke="#fff" stroke-width="2" opacity=".7">${[...Array(10)].map((_, i) => `<path d="M${i * 40 + 10} 100v40"/>`).join('')}</g>`;

const SK = {
  flower: `<path d="M200 250V150" stroke="#166534" stroke-width="6"/><ellipse cx="178" cy="205" rx="24" ry="8" fill="#16a34a"/><g fill="#ec4899">${[0, 60, 120, 180, 240, 300].map(a => `<circle cx="${200 + 26 * Math.cos(a * Math.PI / 180)}" cy="${135 + 26 * Math.sin(a * Math.PI / 180)}" r="16"/>`).join('')}</g><circle cx="200" cy="135" r="13" fill="#facc15"/>`,
  bike: `<g fill="none" stroke="#111827" stroke-width="5"><circle cx="150" cy="205" r="28"/><circle cx="260" cy="205" r="28"/><path d="M150 205L190 160 240 160 260 205M190 160L205 205H150"/></g><circle cx="215" cy="105" r="15" fill="#f59e0b"/><path d="M215 120L200 160M215 125L245 160" stroke="#dc2626" stroke-width="9" stroke-linecap="round"/>`,
  runner: `<circle cx="200" cy="100" r="15" fill="#f59e0b"/><path d="M200 115V170M200 125L170 150M200 125L235 135M200 170L170 225M200 170L240 215" stroke="#dc2626" stroke-width="9" stroke-linecap="round" fill="none"/>`,
  diner: `<rect x="110" y="170" width="180" height="12" fill="#92400e"/><path d="M130 182V240M270 182V240" stroke="#92400e" stroke-width="8"/><g><circle cx="140" cy="110" r="30" fill="#fde68a" opacity=".5"/><circle cx="140" cy="110" r="10" fill="#fde68a"/><circle cx="260" cy="110" r="30" fill="#fde68a" opacity=".5"/><circle cx="260" cy="110" r="10" fill="#fde68a"/></g><circle cx="200" cy="150" r="14" fill="#f59e0b"/>`
};

const photo = (s, bf = 'bgb', mb = 0) => {
  if (s === 'runner') {
    return `<div class="photo photo-runner"><svg viewBox="0 0 1024 571" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block;"><image href="assets/images/runner.jpg" width="1024" height="571"/><image class="runner-layer" href="assets/images/runner.jpg" width="1024" height="571" filter="url(#mb)" mask="url(#runner-motion-mask)"/></svg><svg class="noise-svg" viewBox="0 0 400 260" preserveAspectRatio="none"><rect class="nz" width="400" height="260" filter="url(#nf)" opacity="0"/></svg><div class="lens"><div></div></div></div>`;
  }
  if (s === 'bike') {
    return `<div class="photo photo-bike"><svg viewBox="0 0 1024 571" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block;"><image href="assets/images/foto2.jpg" width="1024" height="571"/><image class="bike-layer" href="assets/images/foto2.jpg" width="1024" height="571" filter="url(#mb)" mask="url(#bike-motion-mask)"/></svg><svg class="noise-svg" viewBox="0 0 400 260" preserveAspectRatio="none"><rect class="nz" width="400" height="260" filter="url(#nf)" opacity="0"/></svg><div class="lens"><div></div></div></div>`;
  }
  if (s === 'diner') {
    return `<div class="photo photo-diner"><img src="assets/images/foto3.jpg" alt="Foto Tempat Makan Outdoor"><svg class="noise-svg" viewBox="0 0 400 260" preserveAspectRatio="none"><rect class="nz" width="400" height="260" filter="url(#nf)" opacity="0"/></svg><div class="lens"><div></div></div></div>`;
  }
  if (typeof s === 'string' && (s.includes('/') || s.includes('.'))) {
    return `<div class="photo"><img src="${s}" alt="Foto"><div class="lens"><div></div></div></div>`;
  }
  return `<div class="photo"><svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice"><rect class="sky" width="400" height="260" fill="#7dd3fc"/><circle class="sun" cx="330" cy="50" r="22" fill="#fde68a"/><g filter="url(#${bf})">${BG}</g><g ${mb ? 'filter="url(#mb)"' : ''}>${SK[s]}</g><rect class="nz" width="400" height="260" filter="url(#nf)" opacity="0"/></svg><div class="lens"><div></div></div></div>`;
};

const dofPhoto = (blurPx = 0) => {
  const sc = (1 + blurPx * 0.0045).toFixed(4);
  return `
    <div class="photo photo-dof">
      <svg viewBox="0 0 1024 576" preserveAspectRatio="xMidYMid slice">
        <image class="bg-blur" href="assets/images/modul2.jpg" width="1024" height="576" style="filter:blur(${blurPx}px);transform:scale(${sc});transform-origin:center;"/>
        <image class="fg-sharp" href="assets/images/modul2.jpg" width="1024" height="576" mask="url(#dof-subj-mask)"/>
      </svg>
    </div>
  `;
};

const motionPhoto = () => `
  <div class="photo photo-motion">
    <svg viewBox="0 0 1024 571" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block;">
      <image href="assets/images/modul3.jpg" width="1024" height="571"/>
      <image class="cyclist-layer" href="assets/images/modul3.jpg" width="1024" height="571" filter="url(#mb)" mask="url(#cyclist-motion-mask)"/>
    </svg>
  </div>
`;

const isoPhoto = (src = 'assets/images/cafe-siang.jpg') => `
  <div class="photo photo-iso">
    <img class="iso-img" src="${src}" alt="Suasana Kafe">
    <svg class="noise-svg" viewBox="0 0 400 260" preserveAspectRatio="none">
      <rect class="nz" width="400" height="260" filter="url(#nf)" opacity="0"/>
    </svg>
    <div class="lens"><div></div></div>
  </div>
`;

function fx(r, o) {
  if (o.b != null) r.style.filter = `brightness(${o.b})`;
  if (o.nz != null) {
    const nz = r.querySelector('.nz');
    if (nz) nz.setAttribute('opacity', o.nz);
  }
  if (o.sky) {
    const sky = r.querySelector('.sky');
    if (sky) sky.setAttribute('fill', o.sky);
    const sun = r.querySelector('.sun');
    if (sun) sun.setAttribute('opacity', o.sun ?? 1);
  }
  if (r._sv) r._sv();
}

function lens(r) {
  const L = r.querySelector('.lens');
  if (!L) return;
  const I = L.firstChild;
  r._sv = () => {
    const isoImg = r.querySelector('.iso-img');
    const nz = r.querySelector('.nz');
    const nzOp = nz ? nz.getAttribute('opacity') || '0' : '0';
    if (isoImg) {
      I.innerHTML = `
        <div style="position:relative;width:100%;height:100%;">
          <img src="${isoImg.src}" style="width:100%;height:100%;object-fit:cover;display:block;">
          <svg viewBox="0 0 400 260" preserveAspectRatio="none" style="position:absolute;top:0;left:0;width:100%;height:100%;mix-blend-mode:overlay;pointer-events:none;">
            <rect width="400" height="260" filter="url(#nf)" opacity="${nzOp}"/>
          </svg>
        </div>
      `;
    } else {
      const svg = r.querySelector('svg');
      const img = r.querySelector('img');
      if (svg) I.innerHTML = svg.outerHTML;
      else if (img) I.innerHTML = `<img src="${img.src}" style="width:100%;height:100%;object-fit:cover;">`;
    }
  };
  r._sv();
  r.onpointermove = e => {
    const b = r.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
    L.style.display = 'block';
    L.style.left = x - 48 + 'px';
    L.style.top = y - 48 + 'px';
    I.style.cssText = `width:${b.width * 4}px;height:${b.height * 4}px;left:${-(x * 4 - 48)}px;top:${-(y * 4 - 48)}px`;
  };
  r.onpointerleave = () => L.style.display = 'none';
}

const setBl = (a, m) => {
  // Only touch the SVG filters when the value really changes (avoids costly re-renders while dragging sliders)
  const bs = String(a), ms = m + ' 0';
  const b = $('#bgbS'), mb = $('#mbS');
  if (b && b.getAttribute('stdDeviation') !== bs) b.setAttribute('stdDeviation', bs);
  if (mb && mb.getAttribute('stdDeviation') !== ms) mb.setAttribute('stdDeviation', ms);
};

/* ==========================================================================
   4. Application Navigation & State
   ========================================================================== */
let cur = 'splash', qt;

function go(n, q) {
  stopVo(true);
  clearInterval(qt);
  setBl(0, 0);
  if (!app) app = $('#app');
  app.style.opacity = 1;
  if (!q) sfx.click();
  cur = n;
  document.body.dataset.view = n;
  if (n === 'splash' || n === 'menu') {
    document.body.classList.add('cinematic-view');
    if (n === 'splash') document.body.classList.add('on-splash');
    else document.body.classList.remove('on-splash');
  } else {
    document.body.classList.remove('cinematic-view');
    document.body.classList.remove('on-splash');
  }
  S[n]();
  scrollTo(0, 0);
}

function startApp() {
  ac();
  started = true;
  sfx.shutter();
  playBgAudio();
  const fl = document.createElement('div');
  fl.className = 'camera-flash';
  document.body.appendChild(fl);
  requestAnimationFrame(() => fl.classList.add('flash-on'));
  setTimeout(() => {
    fl.classList.remove('flash-on');
    document.body.classList.remove('on-splash');
    go('menu', 1);
    setTimeout(() => fl.remove(), 400);
  }, 320);
}

const S = {};

/* ==========================================================================
   5. Module Views
   ========================================================================== */

// --- Splash View ---
S.splash = () => {
  document.body.dataset.view = 'splash';
  document.body.classList.add('cinematic-view');
  document.body.classList.add('on-splash');
  shell(`
    <div class="splash-wrap">
      <div class="splash-scene">
        ${spAudioBtn()}
        <button class="splash-btn" onclick="startApp()" aria-label="Mulai Belajar" title="Mulai Belajar">
          <span class="sr-only">Mulai Belajar</span>
        </button>
      </div>
    </div>
  `);
  updateAudioUI();
};

// --- Main Menu View (Halaman 2) ---
S.menu = () => {
  tempo = 480;
  document.body.classList.add('cinematic-view');
  document.body.classList.remove('on-splash');
  shell(`
    <div class="menu-wrap">
      <div class="menu-scene">
        ${spAudioBtn()}

        <!-- 6 Interactive Module Cards -->
        <button class="m-card c-m1" onclick="go('m1')" aria-label="Modul 1: Konsep Exposure & Lightmeter" title="Modul 1: Konsep Exposure & Lightmeter"></button>
        <button class="m-card c-m2" onclick="go('m2')" aria-label="Modul 2: Aperture & Ruang Tajam" title="Modul 2: Aperture & Ruang Tajam"></button>
        <button class="m-card c-m3" onclick="go('m3')" aria-label="Modul 3: Shutter Speed & Gerakan" title="Modul 3: Shutter Speed & Gerakan"></button>
        <button class="m-card c-m4" onclick="go('m4')" aria-label="Modul 4: ISO & Noise" title="Modul 4: ISO & Noise"></button>
        <button class="m-card c-m5" onclick="go('m5')" aria-label="Modul 5: Simulasi Virtual Exposure" title="Modul 5: Simulasi Virtual Exposure"></button>
        <button class="m-card c-m6" onclick="go('m6')" aria-label="Modul 6: Kuis Interaktif" title="Modul 6: Kuis Interaktif"></button>

        <!-- Bottom Navigation Buttons -->
        <button class="m-btn btn-petunjuk" onclick="$('#dlg').showModal()" aria-label="Petunjuk Penggunaan" title="Petunjuk Penggunaan"></button>
        <button class="m-btn btn-keluar" onclick="go('splash')" aria-label="Keluar ke Halaman Awal" title="Keluar"></button>
      </div>
    </div>
  `);
  updateAudioUI();
};

// --- Modul 1: Exposure & Lightmeter ---
S.m1 = () => {
  shell(`
    <div class="mod-head">
      <h2>Modul 1: Konsep Exposure &amp; Lightmeter</h2>
      ${voBtn()}
    </div>
    <div class="grid2">
      <div>
        <div class="panel txt">
          <p>Exposure adalah proses pencahayaan yang terjadi di dalam kamera. Pencahayaan diukur dengan indikator lightmeter pada viewfinder atau layar LCD saat tombol rana ditekan setengah.</p>
          <div class="ev-cards">
            <div class="ev-card ev-under" onclick="setEv(-2.5)">
              <b>Under Exposure (−)</b>
              <span>Kekurangan cahaya, indikator mengarah ke negatif — foto tampak gelap.</span>
            </div>
            <div class="ev-card ev-norm" onclick="setEv(0)">
              <b>Normal Exposure (0)</b>
              <span>Cahaya pas dan seimbang, indikator tepat di titik 0 — detail foto optimal.</span>
            </div>
            <div class="ev-card ev-over" onclick="setEv(2.5)">
              <b>Over Exposure (+)</b>
              <span>Kelebihan cahaya, indikator mengarah ke positif — foto tampak terlalu terang.</span>
            </div>
          </div>
        </div>
        <div class="hint-bar">💡 Klik kartu/pratinjau atau geser slider lightmeter untuk menguji pencahayaan.</div>
      </div>
      <div>
        <div class="m1-stage">
          <div class="thumbs">
            ${['Under', 'Normal', 'Over'].map((t, idx) => `<div onclick="setEv(${[-2.5, 0, 2.5][idx]})" title="Klik untuk pratinjau ${t}">${photo('assets/images/modul1.jpg')}<span style="display:block;margin-top:4px;">${t}</span></div>`).join('')}
          </div>
          ${photo('assets/images/modul1.jpg')}
          <div class="lcd">
            <div class="ctrl-head">
              <span>Pilih / Geser Kompensasi Exposure (EV)</span>
              <b id="sv">Normal Exposure</b>
            </div>
            <div class="chips" id="ev-ch">
              <button class="chip" data-ev="-2.5">−2.5 EV (Under)</button>
              <button class="chip on" data-ev="0">0 EV (Normal)</button>
              <button class="chip" data-ev="2.5">+2.5 EV (Over)</button>
            </div>
            <div id="mt"></div>
            <input id="sl" type="range" min="-3" max="3" step=".1" value="0" aria-label="Lightmeter">
          </div>
        </div>
      </div>
    </div>
    ${nav('m2')}
  `);

  const P = document.querySelectorAll('.photo');
  const cards = document.querySelectorAll('.ev-card');
  const thumbItems = document.querySelectorAll('.thumbs > div');
  const evChips = document.querySelectorAll('#ev-ch .chip');
  [-2.5, 0, 2.5].forEach((v, i) => fx(P[i], { b: bright(v) }));
  let last = 0;
  const up = () => {
    const v = +$('#sl').value;
    $('#mt').innerHTML = meter(v);
    $('#sv').textContent = `${v > 0 ? '+' + v : v} EV · ${lbl(v)}`;
    fx(P[3], { b: bright(v) });
    const activeIdx = v < -0.5 ? 0 : v > 0.5 ? 2 : 1;
    cards.forEach((c, i) => c.classList.toggle('active', i === activeIdx));
    thumbItems.forEach((t, i) => t.classList.toggle('active', i === activeIdx));
    evChips.forEach((ch, i) => ch.classList.toggle('on', i === activeIdx));
    if (Math.round(v) !== last) {
      last = Math.round(v);
      sfx.tick();
    }
  };
  window.setEv = val => {
    $('#sl').value = val;
    up();
  };
  $('#ev-ch').onclick = e => {
    if (e.target.dataset.ev != null) setEv(+e.target.dataset.ev);
  };
  $('#sl').oninput = up;
  up();
};

// --- Modul 2: Aperture & Ruang Tajam ---
S.m2 = () => {
  shell(`
    <div class="mod-head">
      <h2>Modul 2: Aperture &amp; Ruang Tajam</h2>
      ${voBtn()}
    </div>
    <div class="grid2">
      <div>
        <div class="panel txt">
          <p>Aperture adalah besar kecilnya bukaan diafragma pada lensa yang mengatur intensitas cahaya dan ruang tajam (Depth of Field).</p>
          <p><b>Bukaan besar (f1.4 sampai f2.8):</b> cahaya banyak, ruang tajam sempit, latar kabur (bokeh).<br><b>Bukaan kecil (f11 sampai f22):</b> cahaya sedikit, ruang tajam luas, seluruh latar tajam.</p>
        </div>
        <div class="panel">
          <div class="ctrl-head">
            <span>Pilih Bukaan Diafragma (f-stop)</span>
            <b id="ap-val">f1.4</b>
          </div>
          <div class="chips" id="ch">
            ${AP.map((f, i) => `<button class="chip" data-i="${i}">f${f}</button>`).join('')}
          </div>
          <svg viewBox="-60 -60 120 120" width="175" aria-label="Diafragma" style="display:block;filter:drop-shadow(0 6px 16px rgba(0,0,0,0.6));">
            <circle r="58" fill="#334155"/>
            <circle r="56" fill="#0f172a" stroke="#475569" stroke-width="1.5"/>
            <circle r="52" fill="#090d16"/>
            <circle r="49" fill="none" stroke="#1e293b" stroke-width="2"/>
            <circle r="46" fill="#020617"/>
            <polygon id="ir" fill="#f8fafc" stroke="#f59e0b" stroke-width="1.5"/>
          </svg>
          <p id="li" class="ap-readout"></p>
        </div>
      </div>
      <div>
        <div class="m2-stage">
          <div id="pv">${dofPhoto(10.5)}</div>
          <button class="btn g" style="width:100%;" onclick="$('#cmp').hidden=!$('#cmp').hidden">🔍 Bandingkan f2.8 vs f22</button>
          <div id="cmp" class="cmp-grid" hidden>
            <div>${dofPhoto(7.8)}<span>f2.8: latar kabur (bokeh)</span></div>
            <div>${dofPhoto(0)}<span>f22: seluruh latar tajam</span></div>
          </div>
        </div>
      </div>
    </div>
    ${nav('m3')}
  `);

  const set = i => {
    const f = AP[i], r = 6 + 42 * (1.4 / f) ** 0.6;
    document.querySelectorAll('#ch .chip').forEach((c, k) => c.classList.toggle('on', k === i));
    const apVal = $('#ap-val');
    if (apVal) apVal.textContent = 'f' + f;
    $('#ir').setAttribute('points', [...Array(8)].map((_, k) => `${(r * Math.cos(k * Math.PI / 4)).toFixed(1)},${(r * Math.sin(k * Math.PI / 4)).toFixed(1)}`).join(' '));
    $('#li').innerHTML = `Cahaya masuk ≈ <b>${(64 / f / f).toFixed(2)}×</b> dibanding f8.`;
    const blurPx = Math.max(0, +(10.5 * (1 - lg(f / 1.4) / lg(22 / 1.4))).toFixed(1));
    const bg = $('#pv .bg-blur');
    if (bg) {
      bg.style.filter = `blur(${blurPx}px)`;
      bg.style.transform = `scale(${(1 + blurPx * 0.0045).toFixed(4)})`;
    }
  };

  $('#ch').onclick = e => {
    if (e.target.dataset.i) {
      sfx.click();
      set(+e.target.dataset.i);
    }
  };
  set(0);
};

// --- Modul 3: Shutter Speed & Gerakan ---
S.m3 = () => {
  shell(`
    <div class="mod-head">
      <h2>Modul 3: Shutter Speed &amp; Gerakan</h2>
      ${voBtn()}
    </div>
    <div class="grid2">
      <div>
        <div class="panel txt">
          <p>Kecepatan rana adalah kecepatan bukaan tirai di dalam kamera yang menentukan lama cahaya masuk ke sensor.</p>
          <p><b>Cepat (1/500 sampai 1/1000):</b> membekukan objek bergerak.<br><b>Normal (1/60 sampai 1/200):</b> memotret gerak standar tanpa blur.<br><b>Lambat (1 detik atau lebih):</b> melembutkan gerak dan butuh tripod agar foto tidak buram.</p>
        </div>
        <div class="shutter-simulator">
          <div class="shutter-header">
            <span class="shutter-badge">MEKANISME RANA LENSA</span>
            <span id="shutter-status" class="shutter-status closed">● Rana Tertutup</span>
          </div>

          <div class="shutter-frame iris-frame">
            <svg id="shutter-lens-svg" viewBox="-150 -150 300 300" width="100%" aria-label="Mekanisme Rana Iris Lensa Kamera">
              <defs>
                <linearGradient id="g-outer-metal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#cbd5e1"/><stop offset="20%" stop-color="#475569"/>
                  <stop offset="45%" stop-color="#1e293b"/><stop offset="60%" stop-color="#64748b"/>
                  <stop offset="85%" stop-color="#334155"/><stop offset="100%" stop-color="#cbd5e1"/>
                </linearGradient>
                <radialGradient id="g-barrel-body" cx="50%" cy="50%" r="50%">
                  <stop offset="65%" stop-color="#0f172a"/><stop offset="88%" stop-color="#182030"/>
                  <stop offset="100%" stop-color="#090d16"/>
                </radialGradient>
                <linearGradient id="g-blade-metal" x1="0%" y1="0%" x2="100%" y2="85%">
                  <stop offset="0%" stop-color="#4b5563"/><stop offset="20%" stop-color="#374151"/>
                  <stop offset="55%" stop-color="#1f2937"/><stop offset="85%" stop-color="#111827"/>
                  <stop offset="100%" stop-color="#0b0f19"/>
                </linearGradient>
                <filter id="f-blade-shadow" x="-35%" y="-35%" width="170%" height="170%">
                  <feDropShadow dx="-2" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.9"/>
                </filter>
                <radialGradient id="g-optics-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#ffffff"/>
                  <stop offset="30%" stop-color="#e0f2fe"/>
                  <stop offset="60%" stop-color="#38bdf8"/>
                  <stop offset="85%" stop-color="#0c4a6e"/>
                  <stop offset="100%" stop-color="#020617"/>
                </radialGradient>
                <clipPath id="c-iris-chamber"><circle r="65"/></clipPath>
                <path id="t-arc-top" d="M -116 0 A 116 116 0 0 1 116 0" fill="none"/>
                <path id="t-arc-bot" d="M -116 0 A 116 116 0 0 0 116 0" fill="none"/>
              </defs>

              <!-- Outer shadow base -->
              <circle r="148" fill="#020617" opacity="0.8"/>
              <!-- Chrome bevel ring -->
              <circle r="145" fill="url(#g-outer-metal)"/>
              <circle r="141" fill="#090d16"/>
              <!-- Ribbed grip -->
              <circle r="139" fill="#1e293b" stroke="#334155" stroke-width="0.75"/>
              <circle r="136" fill="none" stroke="#090d16" stroke-width="2.5"/>
              <circle r="134" fill="none" stroke="#475569" stroke-width="0.75"/>
              <!-- Barrel text band -->
              <circle r="131" fill="url(#g-barrel-body)"/>
              <circle r="103" fill="#090d16"/>

              <!-- Filter thread ridges -->
              ${[101,97,93,89,85,81,77,73,69].map(r=>`<circle r="${r}" fill="none" stroke="#1b2434" stroke-width="2.2"/><circle r="${r-.7}" fill="none" stroke="#334155" stroke-width="0.6"/><circle r="${r-1.4}" fill="none" stroke="#060911" stroke-width="0.9"/>`).join('')}

              <!-- Lens text markings -->
              <text fill="#f1f5f9" font-family="'Segoe UI',Roboto,sans-serif" font-size="11" font-weight="700" letter-spacing="2.5" text-anchor="middle"><textPath href="#t-arc-top" startOffset="50%">1:2.8</textPath></text>
              <text fill="#f1f5f9" font-family="'Segoe UI',Roboto,sans-serif" font-size="11" font-weight="700" letter-spacing="3" text-anchor="middle"><textPath href="#t-arc-bot" startOffset="50%">ZOOM LENS</textPath></text>
              <g transform="rotate(-90)"><text x="0" y="-112" fill="#cbd5e1" font-family="'Segoe UI',Roboto,sans-serif" font-size="9.5" font-weight="700" letter-spacing="2.2" text-anchor="middle">MADE IN JAPAN</text></g>
              <g transform="rotate(90)"><text x="0" y="-112" fill="#cbd5e1" font-family="'Segoe UI',Roboto,sans-serif" font-size="10" font-weight="700" letter-spacing="2.2" text-anchor="middle">20 - 35 mm</text></g>

              <!-- Alignment index dot -->
              <circle cx="-83" cy="83" r="3.2" fill="#e2e8f0" stroke="#090d16" stroke-width="1"/>
              <circle cx="-83" cy="83" r="1.6" fill="#ef4444"/>

              <!-- Inner chamber collar -->
              <circle r="67" fill="none" stroke="#334155" stroke-width="1.8"/>
              <circle r="65.5" fill="#060911"/>

              <!-- Aperture light behind blades -->
              <circle r="65" fill="#ffffff"/>
              <circle id="iris-light-glow" r="65" fill="url(#g-optics-glow)" opacity="0"/>

              <!-- 6 interlocking iris blades -->
              <g clip-path="url(#c-iris-chamber)" id="iris-blades-group"></g>

              <!-- Inner glass rim vignette -->
              <circle r="65" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="4" pointer-events="none"/>
              <!-- Lens flare highlight -->
              <ellipse cx="-16" cy="-22" rx="28" ry="15" fill="rgba(255,255,255,0.06)" transform="rotate(-30 -16 -22)" pointer-events="none"/>
            </svg>
          </div>

          <div class="shutter-controls">
            <div class="shutter-info">
              <span>Pilih Kecepatan Rana (Shutter Speed)</span>
              <b id="sl3t">1/1000 detik</b>
            </div>
            <div class="chips" id="ss-ch">
              ${SS.map((x, i) => `<button class="chip" data-i="${i}">${x[1]}</button>`).join('')}
            </div>
            <div id="sl3-desc" class="shutter-desc">⚡ 1/1000s: Sangat cepat — membekukan aksi berkecepatan tinggi.</div>
            <input id="sl3" type="range" min="0" max="6" value="0" aria-label="Shutter speed">
            <button class="btn btn-shutter-test" onclick="window.triggerShutter()">📸 Uji Bukaan Rana</button>
          </div>
        </div>
      </div>
      <div>
        <div class="m3-stage">
          <div id="pv">${motionPhoto()}</div>
          <div id="wr"></div>
        </div>
      </div>
    </div>
    ${nav('m4')}
  `);

  const drawIrisBlades = (container, r_ap) => {
    let h = '';
    for (let i = 0; i < 6; i++) {
      const a1 = (i * 60 + 30) * Math.PI / 180;
      const a2 = ((i + 1) * 60 + 30) * Math.PI / 180;
      const x1 = r_ap * Math.cos(a1);
      const y1 = r_ap * Math.sin(a1);
      const x2 = r_ap * Math.cos(a2);
      const y2 = r_ap * Math.sin(a2);

      const aRim1 = (i * 60 + 95) * Math.PI / 180;
      const xRim1 = 68 * Math.cos(aRim1);
      const yRim1 = 68 * Math.sin(aRim1);

      const aRim2 = (i * 60 - 40) * Math.PI / 180;
      const xRim2 = 68 * Math.cos(aRim2);
      const yRim2 = 68 * Math.sin(aRim2);

      const cpX = (x2 + xRim1) * 0.5 + 16 * Math.cos(a2 + 0.1);
      const cpY = (y2 + yRim1) * 0.5 + 16 * Math.sin(a2 + 0.1);

      const d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} Q ${cpX.toFixed(1)} ${cpY.toFixed(1)} ${xRim1.toFixed(1)} ${yRim1.toFixed(1)} A 68 68 0 0 0 ${xRim2.toFixed(1)} ${yRim2.toFixed(1)} Z`;
      h += `<path d="${d}" fill="url(#g-blade-metal)" stroke="#1a1f29" stroke-width="0.8" filter="url(#f-blade-shadow)"/>`;
    }
    container.innerHTML = h;
  };

  const irisGroup = $('#iris-blades-group');
  if (irisGroup) drawIrisBlades(irisGroup, 0);

  let shutterAnimTimer = null;
  let animReq = null;
  let currentR = 0;

  const animateIris = (fromR, toR, durationMs, easeFn, onDone) => {
    cancelAnimationFrame(animReq);
    const start = performance.now();
    const grp = $('#iris-blades-group');
    if (!grp) return;
    const frame = now => {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / durationMs);
      const t = easeFn ? easeFn(p) : p;
      currentR = fromR + (toR - fromR) * t;
      drawIrisBlades(grp, currentR);
      if (p < 1) {
        animReq = requestAnimationFrame(frame);
      } else if (onDone) {
        onDone();
      }
    };
    animReq = requestAnimationFrame(frame);
  };

  window.triggerShutter = () => {
    clearTimeout(shutterAnimTimer);
    cancelAnimationFrame(animReq);
    const i = +$('#sl3').value;
    const t = SS[i][0];
    const glow = $('#iris-light-glow');
    const st = $('#shutter-status');
    const grp = $('#iris-blades-group');

    if (!grp) return;

    // Trigger audio
    if (t >= 1/15) {
      sfx.slow();
    } else {
      sfx.fast();
    }

    let openMs = 45;
    let holdMs = 40;
    let closeMs = 35;

    if (t <= 1/500) {
      openMs = 30; holdMs = 40; closeMs = 30;
    } else if (t <= 1/250) {
      openMs = 40; holdMs = 80; closeMs = 35;
    } else if (t <= 1/60) {
      openMs = 50; holdMs = 250; closeMs = 40;
    } else if (t <= 1/15) {
      openMs = 60; holdMs = 600; closeMs = 45;
    } else if (t <= 1) {
      openMs = 70; holdMs = 1000; closeMs = 50;
    } else {
      openMs = 70; holdMs = 2000; closeMs = 50;
    }

    if (st) {
      st.className = 'shutter-status open';
      st.textContent = '● Rana Terbuka — Menerima Cahaya';
    }
    if (glow) {
      glow.style.transition = `opacity ${openMs / 1000}s ease-out`;
      glow.style.opacity = '1';
    }

    animateIris(currentR, 35, openMs, p => 1 - Math.pow(1 - p, 2), () => {
      shutterAnimTimer = setTimeout(() => {
        if (glow) {
          glow.style.transition = `opacity ${closeMs / 1000}s ease-out`;
          glow.style.opacity = '0';
        }
        animateIris(currentR, 0, closeMs, p => p * p, () => {
          if (st) {
            st.className = 'shutter-status closed';
            st.textContent = '● Rana Tertutup';
          }
        });
      }, holdMs);
    });
  };

  const descText = [
    '⚡ 1/1000s: Sangat cepat — membekukan aksi berkecepatan tinggi.',
    '⚡ 1/500s: Cepat — membekukan gerakan orang berlari / olahraga.',
    '✓ 1/250s: Normal cepat — membekukan gerak jalan standar.',
    '✓ 1/60s: Standar potret — batas aman memotret genggam tanpa tripod.',
    '⚠ 1/15s: Lambat — rentan goyang, butuh tangan stabil atau tripod.',
    '⏳ 1s: Sangat lambat — efek air halus/jejak cahaya, wajib tripod.',
    '⏳ 2s: Ekstra lambat — lukisan cahaya malam, wajib tripod.'
  ];

  const up = () => {
    const i = +$('#sl3').value, t = SS[i][0];
    document.querySelectorAll('#ss-ch .chip').forEach((c, k) => c.classList.toggle('on', k === i));
    $('#sl3t').textContent = SS[i][1] + ' detik';
    const desc = $('#sl3-desc');
    if (desc) desc.textContent = descText[i];
    window.triggerShutter();
    setBl(0, Math.max(0, lg(t * 250)) * 2.2);
    $('#wr').innerHTML = t >= 1/15
      ? '<div class="warn">⚠ Gunakan Tripod agar Foto Tidak Buram!</div>'
      : '<div class="hint-bar ok-hint">✓ Kecepatan rana aman digenggam — subjek pesepeda tampak tajam &amp; jelas.</div>';
  };
  $('#ss-ch').onclick = e => {
    if (e.target.dataset.i != null) {
      $('#sl3').value = +e.target.dataset.i;
      up();
    }
  };
  $('#sl3').oninput = up;
  up();
};

// --- Modul 4: ISO & Noise ---
S.m4 = () => {
  let ei = 0, ii = 0, need = [0, 5];
  shell(`
    <div class="mod-head">
      <h2>Modul 4: ISO &amp; Noise</h2>
      ${voBtn()}
    </div>
    <div class="grid2">
      <div>
        <div class="panel txt">
          <p>ISO mengatur tingkat kepekaan sensor kamera terhadap cahaya di sekitar subjek.</p>
          <p><b>ISO rendah (100 sampai 400):</b> ideal untuk cahaya terang, hasil foto bersih dan tajam.<br><b>ISO tinggi (800 sampai 3200+):</b> membantu di kondisi minim cahaya, tetapi berisiko memunculkan bintik <b>noise</b>.</p>
        </div>
        <div class="panel">
          <div class="ctrl-label">Kondisi Pencahayaan Lokasi</div>
          <div class="chips" id="ev" style="margin-bottom:8px;">
            <button class="chip" data-e="0">☀ Suasana Kafe Siang</button>
            <button class="chip" data-e="1">☾ Suasana Kafe Malam</button>
          </div>
          <div class="ctrl-label">Tingkat Sensitivitas Sensor (ISO)</div>
          <div class="chips" id="ch" style="margin-bottom:8px;">
            ${ISO.map((f, i) => `<button class="chip" data-i="${i}">ISO ${f}</button>`).join('')}
          </div>
          <div class="lcd">
            <div id="mt"></div>
            <b id="sv"></b>
          </div>
        </div>
      </div>
      <div>
        <div class="m4-stage">
          <div id="pv">${isoPhoto('assets/images/cafe-siang.jpg')}</div>
          <div class="hint-bar">🔍 Arahkan kursor atau jari ke foto untuk memakai kaca pembesar 400% dan mengamati detail noise.</div>
        </div>
      </div>
    </div>
    ${nav('m5')}
  `);

  const P = $('.photo');
  lens(P);

  const up = () => {
    const iso = ISO[ii], m = lg(iso / 100) - need[ei];
    document.querySelectorAll('#ch .chip').forEach((c, k) => c.classList.toggle('on', k === ii));
    document.querySelectorAll('#ev .chip').forEach((c, k) => c.classList.toggle('on', k === ei));
    $('#mt').innerHTML = meter(m);
    $('#sv').textContent = lbl(m);

    // Switch image between Suasana Kafe Siang and Suasana Kafe Malam
    const cafeImg = P.querySelector('.iso-img');
    const targetSrc = ei ? 'assets/images/cafe-malam.jpg' : 'assets/images/cafe-siang.jpg';
    if (cafeImg && !cafeImg.src.endsWith(targetSrc)) {
      cafeImg.src = targetSrc;
    }

    fx(P, {
      b: bright(m),
      nz: clamp(lg(iso / 100) / 6 * 0.9, 0, 0.85)
    });
  };

  $('#ch').onclick = e => {
    if (e.target.dataset.i) {
      ii = +e.target.dataset.i;
      sfx.click();
      up();
    }
  };

  $('#ev').onclick = e => {
    if (e.target.dataset.e) {
      ei = +e.target.dataset.e;
      sfx.click();
      up();
    }
  };

  up();
};

// --- Modul 5: Simulasi Virtual Exposure ---
const SC = [
  { t: 'Foto 1', need: 2, sky: '#fdba74', s: 'runner', fr: 1/250, h: 'Cahaya sore redup. Bekukan gerakan lari.' },
  { t: 'Foto 2', need: -1, sky: '#7dd3fc', s: 'bike', fr: 1/500, h: 'Cahaya terik dan objek sangat cepat.' },
  { t: 'Foto 3', need: 8, sky: '#0f172a', s: 'diner', fr: 1/30, h: 'Cahaya redup. Jaga noise tetap rendah.' }
];

S.m5 = () => {
  let si = 0, a = 5, s = 2, o = 0;
  shell(`
    <div class="mod-head">
      <h2>Modul 5: Simulasi Virtual Exposure</h2>
      ${voBtn()}
    </div>
    <div class="grid2 m5-grid">
      <div>
        <div class="m5-stage">
          <div class="m5-top">
            <div class="chips" id="sc">
              ${SC.map((c, i) => `<button class="chip" data-i="${i}">${c.t}</button>`).join('')}
            </div>
            <p id="hn"></p>
          </div>
          <div id="pv"></div>
          <div id="rs2"></div>
        </div>
      </div>
      <div>
        <div class="panel txt">
          <p>Pilih satu skenario foto di samping, lalu seimbangkan kombinasi <b>Aperture</b>, <b>Shutter Speed</b>, dan <b>ISO</b> sampai indikator lightmeter tepat di titik <b>0 (Normal Exposure)</b>.</p>
        </div>
        <div class="lcd">
          <b id="lc"></b>
          <div id="mt"></div>
          <b id="sv"></b>
        </div>
        <div class="panel">
          <label>Aperture <b id="la"></b><input id="ra" type="range" min="0" max="8" value="5" style="width:100%;accent-color:#F59E0B"></label>
          <label>Shutter Speed <b id="ls"></b><input id="rs" type="range" min="0" max="6" value="2" style="width:100%;accent-color:#F59E0B"></label>
          <label>ISO <b id="lo"></b><input id="ro" type="range" min="0" max="6" value="0" style="width:100%;accent-color:#F59E0B"></label>
          <button class="btn btn-jepret" onclick="jepret()" style="width:100%;margin-top:8px;padding:clamp(8px,1.2vh,13px) 16px;font-size:clamp(14px,1.75vh,16.5px)">📸 JEPRET FOTO</button>
        </div>
      </div>
    </div>
    ${nav('m6')}
  `);

  const mv = () => lg(ISO[o] / 100) + lg(SS[s][0] * 250) - 2 * lg(AP[a] / 8) - SC[si].need;

  const up = () => {
    const c = SC[si], m = mv(), t = SS[s][0];
    $('#la').textContent = 'f' + AP[a];
    $('#ls').textContent = SS[s][1];
    $('#lo').textContent = ISO[o];
    $('#lc').textContent = `f${AP[a]}  ·  ${SS[s][1]}  ·  ISO ${ISO[o]}`;
    $('#mt').innerHTML = meter(m);
    $('#sv').textContent = lbl(m);
    const P = $('.photo');
    fx(P, {
      b: bright(m),
      nz: clamp(lg(ISO[o] / 100) / 6 * 0.9, 0, 0.85),
      sky: c.sky,
      sun: si === 2 ? 0 : 1
    });
    setBl(7 * (1 - lg(AP[a] / 1.4) / lg(22 / 1.4)) * (si === 2 ? 0.5 : 0.3), Math.max(0, lg(t / c.fr)) * 2.2);
  };

  const pick = i => {
    si = i;
    document.querySelectorAll('#sc .chip').forEach((c, k) => c.classList.toggle('on', k === i));
    $('#hn').textContent = '🎯 ' + SC[i].h;
    $('#pv').innerHTML = photo(SC[i].s, 'bgb', 1);
    $('#rs2').innerHTML = '<div class="hint-bar">📷 Atur segitiga exposure ke titik 0, lalu klik <b>JEPRET FOTO</b> untuk evaluasi hasil.</div>';
    up();
  };

  let raf5 = 0;
  [['ra', v => a = v], ['rs', v => s = v], ['ro', v => o = v]].forEach(([id, fn]) => {
    $('#' + id).oninput = e => {
      const v = +e.target.value;
      if (v === [a, s, o][['ra', 'rs', 'ro'].indexOf(id)]) return;
      fn(v);
      sfx.tick();
      // Coalesce rapid mouse-drag events into one render per frame
      if (!raf5) raf5 = requestAnimationFrame(() => { raf5 = 0; up(); });
    };
  });

  $('#sc').onclick = e => {
    if (e.target.dataset.i) pick(+e.target.dataset.i);
  };

  window.jepret = () => {
    sfx.jepret();
    const c = SC[si], m = mv(), t = SS[s][0], b = [];
    if (m < -0.5) b.push(['Under exposure: foto terlalu gelap', 'r']);
    if (m > 0.5) b.push(['Over exposure: foto terlalu terang', 'r']);
    if (t >= 1/15) b.push(['Foto buram karena kamera goyang (butuh tripod)', 'r']);
    else if (t > c.fr) b.push(['Gerakan objek tidak membeku (blur)', 'r']);
    if (ISO[o] >= 3200) b.push(['Noisy: bintik noise terlihat jelas', 'r']);

    $('#rs2').innerHTML = `
      <div class="m5-eval">
        <span class="m5-eval-title">Hasil Jepretan:</span>
        ${b.length ? b.map(x => `<span class="tag" style="background:var(--red)">${x[0]}</span>`).join('') : '<span class="tag" style="background:var(--grn)">✓ Sempurna! Exposure normal, gerak membeku, noise terkendali.</span>'}
      </div>
    `;
  };

  pick(0);
};

// --- Modul 6: Kuis Interaktif ---
const Q = [
  { q: 'Kamu ingin memotret pertandingan sepak bola di siang hari agar gerakan pemain membeku. Shutter speed mana yang paling tepat?', o: ['1/2 detik', '1/1000 detik', '10 detik', '1/15 detik'], a: 1, e: 'Kecepatan rana cepat memotong gerakan sehingga objek tampak membeku.' },
  { q: 'Kamu ingin latar belakang foto potret tampak kabur (bokeh). Nilai aperture yang tepat?', o: ['f22', 'f16', 'f1.4', 'f11'], a: 2, e: 'Bukaan besar (angka f kecil) menghasilkan ruang tajam sempit.' },
  { q: 'Indikator lightmeter menunjuk +2. Foto yang dihasilkan akan…', o: ['Under exposure', 'Normal exposure', 'Over exposure', 'Penuh noise'], a: 2, e: 'Indikator positif berarti cahaya berlebih (over exposure).' },
  { q: 'Foto malam hari di samping tampak berbintik-bintik. Penyebab paling mungkin?', img: 1, o: ['ISO terlalu tinggi', 'Aperture terlalu kecil', 'Shutter terlalu cepat', 'Lensa kotor'], a: 0, e: 'ISO tinggi membuat sensor sangat peka, tetapi memunculkan noise.' },
  { q: 'Kamu memotret dengan shutter 1 detik tanpa tripod. Risiko utamanya?', o: ['Noise berlebih', 'Foto buram karena kamera goyang', 'Bokeh hilang', 'Foto selalu gelap'], a: 1, e: 'Shutter lambat butuh penyangga seperti tripod agar foto tidak buram.' }
];

let qi = 0, sc = 0, lv = 3, tm = 0;
const fmt = s => String(s / 60 | 0).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

S.m6 = () => {
  tempo = 300;
  qi = 0; sc = 0; lv = 3; tm = 0;
  qt = setInterval(() => {
    tm++;
    const e = $('#tm');
    if (e) e.textContent = fmt(tm);
  }, 1000);
  qn();
};

const bar = () => `<div class="lcd bar"><span>Skor <b>${sc}</b>/8</span><span aria-label="Nyawa">${'♥'.repeat(lv) || '—'}</span><span>⏱ <b id="tm">${fmt(tm)}</b></span><span>Soal ${Math.min(qi + 1, 6)}/6</span></div>`;

function qn() {
  if (lv <= 0 || qi >= 6) return res();
  if (qi === 5) return dnd();
  const q = Q[qi];
  shell(`
    <div class="mod-head">
      <h2>Modul 6: Kuis Interaktif</h2>
    </div>
    ${bar()}
    <div class="quiz-stage">
      ${q.img ? `
        <div class="grid2 quiz-img-grid">
          <div>
            ${isoPhoto('assets/images/cafe-malam.jpg')}
            <div class="hint-bar">🔍 Arahkan kursor ke foto untuk mengamati bintik noise 400%.</div>
          </div>
          <div>
            <div class="panel quiz-panel">
              <p class="quiz-q"><b>${q.q}</b></p>
              ${q.o.map((o, i) => `<button class="opt" onclick="ans(${i})">${'ABCD'[i]}. ${o}</button>`).join('')}
              <div id="fb"></div>
            </div>
          </div>
        </div>
      ` : `
        <div class="panel quiz-panel">
          <p class="quiz-q"><b>${q.q}</b></p>
          ${q.o.map((o, i) => `<button class="opt" onclick="ans(${i})">${'ABCD'[i]}. ${o}</button>`).join('')}
          <div id="fb"></div>
        </div>
      `}
    </div>
    ${nav()}
  `);
  if (q.img) {
    const P = $('.photo');
    lens(P);
    fx(P, { b: 1.25, nz: 0.85 });
  }
}

function ans(i) {
  const q = Q[qi], ok = i === q.a;
  document.querySelectorAll('.opt').forEach((b, k) => {
    b.disabled = true;
    if (k === q.a) b.classList.add('ok');
    else if (k === i) b.classList.add('no');
  });
  ok ? (sc++, sfx.ok()) : (lv--, sfx.bad());
  $('#fb').innerHTML = `
    <div class="fb quiz-fb ${ok ? 'ok' : 'no'}">
      <div><b>${ok ? '✓ Benar!' : '✗ Belum tepat.'}</b> ${q.e}</div>
      <button class="btn" style="flex-shrink:0" onclick="qi++;qn()">Lanjut →</button>
    </div>
  `;
}

function dnd() {
  let pk = null, dn = 0;
  shell(`
    <div class="mod-head">
      <h2>Modul 6: Kuis Interaktif</h2>
    </div>
    ${bar()}
    <div class="quiz-stage">
      <div class="panel quiz-panel">
        <p class="quiz-q"><b>Jodohkan elemen segitiga exposure dengan efek pada foto.</b><br><span style="font-weight:500;font-size:0.88em;color:#cbd5e1">Seret kartu elemen ke kotak yang sesuai, atau ketuk kartu lalu ketuk kotaknya.</span></p>
        <div class="chips">
          ${[['Shutter Speed', 'mot'], ['ISO', 'noi'], ['Aperture', 'dof']].map(x => `<button class="chip" draggable="true" data-k="${x[1]}">${x[0]}</button>`).join('')}
        </div>
        <div class="zones">
          ${[['Noise pada foto', 'noi'], ['Ruang tajam (DoF)', 'dof'], ['Pembekuan atau kelembutan gerak', 'mot']].map(x => `<div class="zone" data-k="${x[1]}"><span>${x[0]}</span></div>`).join('')}
        </div>
        <div id="fb"></div>
      </div>
    </div>
    ${nav()}
  `);

  const put = (z, c) => {
    if (!c || c.disabled) return;
    if (c.dataset.k === z.dataset.k) {
      c.disabled = true;
      z.append(c);
      z.classList.add('ok');
      sc++;
      dn++;
      sfx.ok();
      if (dn === 3) {
        $('#fb').innerHTML = `
          <div class="fb quiz-fb ok">
            <div><b>✓ Luar biasa!</b> Semua elemen segitiga exposure berhasil dijodohkan dengan tepat.</div>
            <button class="btn" style="flex-shrink:0" onclick="qi++;qn()">Lihat Hasil →</button>
          </div>
        `;
      }
    } else {
      lv--;
      sfx.bad();
      z.classList.add('no');
      setTimeout(() => z.classList.remove('no'), 500);
      if (lv <= 0) return res();
    }
    pk = null;
  };

  document.querySelectorAll('.chip').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
      c.classList.add('on');
      pk = c;
    };
    c.ondragstart = () => pk = c;
  });

  document.querySelectorAll('.zone').forEach(z => {
    z.ondragover = e => e.preventDefault();
    z.ondrop = e => {
      e.preventDefault();
      put(z, pk);
    };
    z.onclick = () => put(z, pk);
  });
}

function res() {
  clearInterval(qt);
  const p = Math.round(sc / 8 * 100);
  sfx.win();
  shell(`
    <div class="mod-head">
      <h2>Hasil Evaluasi Kuis</h2>
    </div>
    <div class="quiz-stage">
      <div class="panel res-panel">
        <div class="big" style="color:${p >= 70 ? 'var(--grn)' : 'var(--red)'}">${p}%</div>
        <p style="font-size:clamp(15.5px,2vh,20px);">Penguasaan materi: <b>${sc} dari 8 poin</b> · Waktu <b>${fmt(tm)}</b><br>${p >= 70 ? '🎉 Selamat, kamu lulus modul Segitiga Exposure!' : 'Belum mencapai 70%. Pelajari modul kembali, lalu ulangi kuis.'}</p>
        <div class="nav" style="justify-content:center;margin-top:clamp(14px,2.2vh,24px);">
          <button class="btn" onclick="window.print()">Cetak Sertifikat Pembelajaran</button>
          <button class="btn g" onclick="go('m6')">Ulangi Kuis</button>
          <button class="btn" onclick="go('end')">Lanjut ke Rangkuman →</button>
        </div>
      </div>
    </div>
  `);
}
S.res = res;

// --- Rangkuman View ---
S.end = () => {
  tempo = 620;
  const D = {
    a: ['Aperture', 'Mengatur intensitas cahaya yang masuk melalui bukaan lensa serta kedalaman ruang tajam (Depth of Field / Bokeh).'],
    s: ['Shutter Speed', 'Mengatur durasi sensor menerima cahaya serta efek pembekuan (freeze) atau kelembutan gerak (motion blur).'],
    i: ['ISO', 'Mengatur tingkat kepekaan sensor kamera terhadap cahaya serta risiko kemunculan bintik noise pada foto.']
  };

  shell(`
    <div class="mod-head">
      <h2>Rangkuman Segitiga Exposure</h2>
      ${voBtn()}
    </div>
    <div class="grid2 end-grid">
      <div>
        <svg viewBox="-12 -12 324 274" role="img" aria-label="Segitiga exposure">
          <polygon points="150,30 30,220 270,220" fill="none" stroke="#F59E0B" stroke-width="6" stroke-linejoin="round"/>
          ${[['a', 150, 30, 'Aperture'], ['s', 30, 220, 'Shutter'], ['i', 270, 220, 'ISO']].map(x => `
            <g role="button" style="cursor:pointer" tabindex="0" onclick="pop('${x[0]}')" onkeydown="if(event.key==='Enter')pop('${x[0]}')">
              <circle cx="${x[1]}" cy="${x[2]}" r="32" fill="#0f172a" stroke="#F59E0B" stroke-width="2.5"/>
              <text x="${x[1]}" y="${x[2] + 5}" text-anchor="middle" fill="#F59E0B" font-weight="800" font-size="13" font-family="Montserrat,Arial">${x[3]}</text>
            </g>
          `).join('')}
          <text x="150" y="150" text-anchor="middle" fill="#cbd5e1" font-size="14" font-weight="700">Exposure Seimbang</text>
        </svg>
      </div>
      <div>
        <div class="panel txt">
          <p>Selamat! Kamu telah menyelesaikan seluruh rangkaian materi <b>Segitiga Exposure</b>. Kunci fotografi yang baik adalah keseimbangan harmonis antara Aperture, Shutter Speed, dan ISO sesuai kondisi cahaya serta tujuan kreatif.</p>
          <p><b>Aperture</b> = intensitas cahaya + ruang tajam (DoF).<br><b>Shutter Speed</b> = durasi cahaya + pembekuan atau kelembutan gerak.<br><b>ISO</b> = kepekaan sensor + kendali bintik noise.</p>
        </div>
        <div class="fb" id="po">💡 Klik salah satu titik sudut segitiga di sebelah kiri untuk melihat ringkasan detailnya.</div>
      </div>
    </div>
    <div class="nav">
      <button class="btn" onclick="window.print()">Unduh Rangkuman PDF</button>
      <button class="btn g" onclick="go('menu')">Kembali ke Menu Utama</button>
      <button class="btn g" onclick="go('splash')">Keluar</button>
    </div>
  `);

  window.pop = k => {
    sfx.pop();
    $('#po').innerHTML = `<b>${D[k][0]}:</b> ${D[k][1]}`;
  };
};

/* ==========================================================================
   6. App Initialization & Global Button Hover Audio
   ========================================================================== */
const HOVER_BTN_SEL = 'button, .btn, .chip, .opt, .m-card, .m-btn, .splash-btn, .sp-audio-btn, .au-toggle, .ev-card, .thumbs > div, [role="button"]';
let lastHoverBtn = null;

document.addEventListener('pointerover', e => {
  if (e.pointerType === 'touch') return;
  const btn = e.target.closest ? e.target.closest(HOVER_BTN_SEL) : null;
  if (!btn || btn.disabled) {
    if (!btn) lastHoverBtn = null;
    return;
  }
  if (btn === lastHoverBtn || (e.relatedTarget && btn.contains(e.relatedTarget))) return;
  lastHoverBtn = btn;
  sfx.hover();
});

document.addEventListener('pointerout', e => {
  if (lastHoverBtn && (!e.relatedTarget || !lastHoverBtn.contains(e.relatedTarget))) {
    lastHoverBtn = null;
  }
});

document.addEventListener('click', e => {
  const btn = e.target.closest ? e.target.closest(HOVER_BTN_SEL) : null;
  if (btn && !btn.disabled && !btn.classList.contains('btn-jepret')) {
    sfx.click();
  }
}, true);

window.addEventListener('DOMContentLoaded', () => {
  app = $('#app');
  const h = window.location.hash ? window.location.hash.slice(1) : '';
  if (h && S[h]) go(h);
  else S.splash();
});
