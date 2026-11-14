// The hidden phone meter: only loaded when the address has ?fps=1. It shows how smoothly this phone is drawing the ocean, so the
// numbers can be read (and copied) on a real phone inside Instagram. Nothing is sent anywhere: the numbers stay on the screen
// until the person looking at them copies them.
// The page calls frame() once per animation frame it draws; the renderer fills in `parts` (render/scene.js, `renderer.meter`).

const KEEP = 240;            // frames remembered: about four seconds at 60 a second
const SHOW_EVERY = 500;      // milliseconds between updates of the readout
const LONG_FRAME = 50;       // a frame gap over this is counted as a stutter
const ms = (v) => (v == null || Number.isNaN(v) ? '-' : v < 10 ? v.toFixed(1) : String(Math.round(v)));
const sorted = (list) => [...list].sort((a, b) => a - b);
const at = (list, share) => (list.length ? list[Math.min(list.length - 1, Math.floor(list.length * share))] : NaN);
const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : NaN);

// What the numbers say, as plain data. Kept apart from the drawing of them so it can be tested.
export function summarise(gaps, works) {
  const g = sorted(gaps), w = sorted(works), total = gaps.reduce((a, b) => a + b, 0);
  return {
    fps: total > 0 ? (gaps.length * 1000) / total : 0,
    gap: { middle: at(g, 0.5), slow: at(g, 0.95), worst: g.length ? g[g.length - 1] : NaN },
    work: { mean: mean(works), worst: w.length ? w[w.length - 1] : NaN },
    stutters: gaps.filter((x) => x > LONG_FRAME).length,
  };
}

// What can be known about the phone and its browser without asking for anything.
export function deviceFacts(renderer) {
  const facts = { agent: navigator.userAgent, instagram: /Instagram/i.test(navigator.userAgent), screen: `${screen.width}x${screen.height}`, ratio: devicePixelRatio || 1, cores: navigator.hardwareConcurrency ?? null, memoryGb: navigator.deviceMemory ?? null, webgpu: 'gpu' in navigator, chip: null, maxTexture: null };
  try {
    const gl = renderer?.water?.gl;
    if (gl) {
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      facts.chip = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      facts.maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    }
  } catch { /* a browser that won't say */ }
  return facts;
}

// Times the things a frame count can't see, by making the graphics chip finish each one before the clock is read.
// Each number is the mean of `rounds` goes, in milliseconds. It takes about a second and freezes the ocean while it runs.
export function chipTest(renderer, scene, t, cam, rounds = 12) {
  const canvas = renderer.canvas, ctx = renderer.ctx, W = canvas.width, H = canvas.height;
  // Reading a pixel back waits for everything drawn so far. It is read through a tiny canvas of its own, because some browsers
  // stop using the graphics chip for a canvas that is read from directly.
  const probe = document.createElement('canvas'); probe.width = probe.height = 1;
  const px = probe.getContext('2d', { willReadFrequently: true });
  const finish = (from = canvas) => { px.drawImage(from, 0, 0, 1, 1); px.getImageData(0, 0, 1, 1); };
  const timed = (work) => { finish(); const s = performance.now(); for (let i = 0; i < rounds; i++) { work(i); finish(); } return (performance.now() - s) / rounds; };
  const out = { rounds, canvas: `${W}x${H}` };
  out.frame = timed((i) => renderer.render(scene, t + i / 60, cam));
  // The water is drawn by the graphics chip on its own canvas and copied to the page's canvas every frame.
  const water = renderer.water, call = renderer.meter?.waterCall; // the sizes and camera the renderer last drew the water with
  if (water && call) {
    const [w, h, , ...rest] = call;
    const draw = (i) => water.render(w, h, t + i / 60, ...rest);
    const drawOnly = () => { const s = performance.now(); for (let i = 0; i < rounds; i++) { draw(i); const gl = water.gl; gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); } return (performance.now() - s) / rounds; };
    out.waterDraw = drawOnly();
    out.waterDrawAndCopy = timed((i) => ctx.drawImage(draw(i), 0, 0, W, H));
    // The same copy from an ordinary canvas, to compare: the difference is what crossing from one kind of canvas to the other costs.
    const plain = document.createElement('canvas'); plain.width = w; plain.height = h;
    const p = plain.getContext('2d');
    out.plainCopy = timed((i) => { p.fillStyle = `rgb(${i},60,90)`; p.fillRect(0, 0, plain.width, plain.height); ctx.drawImage(plain, 0, 0, W, H); });
    plain.width = plain.height = 0;
  }
  // One creature's light: its drawing is sent to the graphics chip and two pictures come back.
  const pass = renderer.light;
  if (pass?.available) {
    const side = 512, body = document.createElement('canvas'); body.width = body.height = side;
    const b = body.getContext('2d'); b.fillStyle = '#c8552e';
    const into = {};
    out.lightOne = timed((i) => { b.clearRect(0, 0, side, side); b.beginPath(); b.ellipse(side / 2, side / 2, 180 + i, 90, 0, 0, 6.283); b.fill(); const made = pass.apply(body, { light: 1, t, h: 180 }, into); if (made) { into.lit = made.lit; into.shadow = made.shadow; ctx.drawImage(made.lit, 0, 0, 64, 64); ctx.drawImage(made.shadow, 0, 0, 64, 64); } });
    for (const c of [body, into.lit, into.shadow]) if (c) c.width = c.height = 0;
  }
  renderer.render(scene, t, cam); // leave the picture as it was
  return out;
}

const STYLE = 'position:fixed;left:8px;z-index:6;max-width:calc(100% - 16px);padding:6px 8px;border-radius:8px;background:rgba(3,14,22,.82);color:#d8f3ee;font:11px/1.35 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;-webkit-user-select:text;user-select:text';
const BUTTON = 'margin:6px 6px 0 0;min-height:32px;padding:0 10px;border:1px solid #2a6a84;border-radius:8px;background:#0e3144;color:#e7f2ef;font:600 12px/1 "Helvetica Neue",Arial,sans-serif';

// read() gives what only the page knows: { place, canvas, dpr, pace, quality, zoom, paused }. scene() gives what a test frame needs: { scene, t, cam }.
export function createMeter({ renderer, read, scene, onBusy = () => {} }) {
  const gaps = [], works = [], redraws = [];
  const parts = { water: 0, lit: 0, redraws: 0, waterCall: null };
  const sums = { water: 0, lit: 0, frames: 0 };
  renderer.meter = parts;
  let last = 0, shownAt = 0, test = null, facts = null;

  const box = document.createElement('div');
  box.id = 'meter'; box.setAttribute('aria-label', 'Speed meter'); box.style.cssText = STYLE;
  const text = document.createElement('div'); text.id = 'meter-text';
  const testButton = Object.assign(document.createElement('button'), { type: 'button', id: 'meter-test', textContent: 'Chip test' });
  const copyButton = Object.assign(document.createElement('button'), { type: 'button', id: 'meter-copy', textContent: 'Copy numbers' });
  testButton.style.cssText = copyButton.style.cssText = BUTTON;
  box.append(text, testButton, copyButton);
  document.body.append(box);
  const place = () => { box.style.top = `${Math.round(document.querySelector('.find-wrap')?.getBoundingClientRect().bottom ?? 64) + 6}px`; };
  place(); addEventListener('resize', place);
  // The Find bar grows when a row appears in it (the spotlight row, a message), so the meter moves down with it.
  const bar = document.querySelector('.find-wrap');
  if (bar && typeof ResizeObserver === 'function') new ResizeObserver(place).observe(bar);

  const report = () => {
    const s = summarise(gaps, works), st = read(), r = renderer.stats || {}, n = Math.max(1, sums.frames);
    facts ||= deviceFacts(renderer);
    const lines = [
      `at ${st.place}`,
      `${s.fps.toFixed(1)} fps   frame ${ms(s.gap.middle)} ms, slow ${ms(s.gap.slow)}, worst ${ms(s.gap.worst)}   stutters ${s.stutters}`,
      `work ${ms(s.work.mean)} ms (worst ${ms(s.work.worst)})   water ${ms(sums.water / n)}   light ${ms(sums.lit / n)}`,
      `on screen ${r.drawn ?? '-'}: lit ${r.lit ?? '-'}, pictures ${r.pictured ?? '-'}   light redraws ${(mean(redraws) || 0).toFixed(1)} a frame`,
      `canvas ${st.canvas} (${(+st.dpr).toFixed(2)}x of ${facts.ratio}x)   step ${st.quality}   pace ${st.pace}   zoom ${(+st.zoom).toFixed(2)}${st.paused ? '   paused' : ''}`,
      `WebGPU ${facts.webgpu ? 'yes' : 'no'}   ${facts.instagram ? 'inside Instagram' : 'not Instagram'}   ${facts.chip ?? 'chip unknown'}`,
    ];
    if (test) {
      lines.push(`chip test (${test.rounds} goes, ms each): whole frame ${ms(test.frame)}`);
      if (test.waterDraw != null) lines.push(`  water ${ms(test.waterDraw)}, with its copy ${ms(test.waterDrawAndCopy)}; plain copy ${ms(test.plainCopy)}`);
      if (test.lightOne != null) lines.push(`  one creature's light ${ms(test.lightOne)}`);
    }
    return lines.join('\n');
  };
  const full = () => `${report()}\nscreen ${facts.screen}, cores ${facts.cores ?? '?'}, memory ${facts.memoryGb ?? '?'} GB, largest texture ${facts.maxTexture ?? '?'}\n${facts.agent}\n${location.host}${location.pathname} ${new Date().toISOString()}`;

  testButton.addEventListener('click', () => {
    const now = scene();
    if (!now) return;
    testButton.disabled = true; text.textContent = 'Testing...';
    // After a frame, so "Testing..." is on screen before the ocean freezes.
    requestAnimationFrame(() => setTimeout(() => {
      try { test = chipTest(renderer, now.scene, now.t, now.cam); } catch (e) { test = null; text.textContent = `The chip test failed: ${e.message}`; }
      testButton.disabled = false; onBusy(); last = 0; shownAt = 0;
    }, 0));
  });
  copyButton.addEventListener('click', async () => {
    const words = full();
    try { await navigator.clipboard.writeText(words); copyButton.textContent = 'Copied'; }
    catch {
      // No clipboard here (some in-app browsers): show the words selected, to copy by hand.
      let area = box.querySelector('textarea');
      if (!area) { area = document.createElement('textarea'); area.readOnly = true; area.rows = 6; area.style.cssText = 'display:block;width:100%;margin-top:6px;font:inherit;color:#062030'; box.append(area); }
      area.value = words; area.focus(); area.select();
      copyButton.textContent = 'Select all, then copy';
    }
    setTimeout(() => { copyButton.textContent = 'Copy numbers'; }, 2500);
  });

  return {
    // now: the frame's own time. work: how long the page spent drawing it, in milliseconds.
    frame(now, work) {
      if (last) { gaps.push(now - last); if (gaps.length > KEEP) gaps.shift(); }
      last = now;
      works.push(work); if (works.length > KEEP) works.shift();
      redraws.push(parts.redraws); if (redraws.length > KEEP) redraws.shift();
      sums.water += parts.water; sums.lit += parts.lit; sums.frames++;
      if (now - shownAt < SHOW_EVERY) return;
      shownAt = now;
      if (!testButton.disabled) text.textContent = report();
      sums.water = sums.lit = sums.frames = 0;
    },
    // A gap that says nothing about speed (the page was hidden or paused): the next frame starts afresh.
    skip() { last = 0; },
    report: full,
    numbers: () => ({ ...summarise(gaps, works), redraws: mean(redraws) || 0, test, facts: facts || deviceFacts(renderer) }),
  };
}
