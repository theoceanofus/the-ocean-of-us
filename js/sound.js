// The ocean's sounds (owner, 2026-11-14: "we should also add sounds to the site"). Every sound is made here with Web Audio: no sound
// files, nothing fetched, nothing sent anywhere.
// - Off until the visitor turns it on with the speaker button. Phones only allow sound after a tap anyway, and many visitors are children
//   at school or in bed. The choice is remembered on this phone; when it was on, the first tap of the next visit brings it back.
// - Quiet by design: a soft water bed that changes with the zone (surf at the shore, a low hum in the deep, now and then a far-off whale),
//   and small sounds for what the visitor does: a bubble when a creature is tapped (big creatures lower, small ones higher), a plip for
//   food, a chime for finding someone, a whoosh for a new zone, a sparkle for a bought item's trick.
// - Silent while the page is hidden, and nothing plays until a tap made it possible.
// - The creature card and the shop (2026-11-14) have the same speaker button and the same remembered choice (js/sound-button.js), with
//   no water bed (bed: false): a bubble when the card's creature is tapped, a sparkle on Try one on, and in the shop a soft click for
//   picking an item and a soft pop as the preview puts it on. Nothing for paying, and nothing that hurries anyone.

// How each zone's water sounds: lowpass cutoff (Hz), level, how fast and how deep the swell is, surf (shore waves) and whales.
export const ZONE_SOUND = Object.freeze({
  shore: { cut: 1500, level: 0.5, swell: 0.13, depth: 0.55, surf: 1, whale: 0 },
  reef: { cut: 950, level: 0.4, swell: 0.1, depth: 0.4, surf: 0, whale: 0 },
  kelp: { cut: 750, level: 0.4, swell: 0.09, depth: 0.4, surf: 0, whale: 0 },
  open: { cut: 600, level: 0.38, swell: 0.07, depth: 0.35, surf: 0, whale: 1 },
  deep: { cut: 380, level: 0.4, swell: 0.05, depth: 0.3, surf: 0, whale: 1 },
  abyss: { cut: 230, level: 0.45, swell: 0.04, depth: 0.3, surf: 0, whale: 1 },
});
const DEFAULT_ZONE = 'reef';
export const SOUND_KEY = 'sound';
const MASTER = 0.55, BED = 0.32;

// A tapped creature's bubble pitch, from its size in world units: big creatures sound lower. Between 170 and 900 Hz.
export function tapPitch(radius) {
  const r = Math.max(1, Number(radius) || 20);
  return Math.round(Math.max(170, Math.min(900, 620 * Math.pow(20 / r, 0.4))));
}
// The notes of a chime (a pentatonic run, so any of them sound well together), in Hz.
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];

export function createSound({ recall = () => null, remember = () => {}, AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext, random = Math.random, doc = globalThis.document, later: setLater = (fn, ms) => setTimeout(fn, ms), cancel = (id) => clearTimeout(id), bed: withBed = true } = {}) {
  let ctx = null, master = null, bed = null, zone = DEFAULT_ZONE, wanted = !!recall(SOUND_KEY, false), timers = [];
  const played = [];
  const note = (name) => { played.push(name); if (played.length > 50) played.shift(); };
  const live = () => !!(ctx && wanted && ctx.state === 'running');

  function build() {
    if (ctx || !AudioCtx) return !!ctx;
    try { ctx = new AudioCtx(); } catch { ctx = null; return false; }
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    bed = withBed ? makeBed() : null;
    setZone(zone, 0);
    return true;
  }
  // Brown noise, two seconds of it looped, is the water. A lowpass makes it near or far; a slow wobble on its level is the swell.
  function noiseBuffer(seconds = 2, brown = true) {
    const n = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) { const w = random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    // The loop's two ends meet without a click.
    const fade = Math.min(n >> 4, 2048);
    for (let i = 0; i < fade; i++) { const k = i / fade; d[n - fade + i] = d[n - fade + i] * (1 - k) + d[i] * k; }
    return buf;
  }
  function makeBed() {
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(4); src.loop = true;
    const low = ctx.createBiquadFilter(); low.type = 'lowpass'; low.Q.value = 0.4;
    const level = ctx.createGain(); level.gain.value = 0;
    const swell = ctx.createOscillator(), swellDepth = ctx.createGain(); swell.frequency.value = 0.1; swellDepth.gain.value = 0;
    swell.connect(swellDepth); swellDepth.connect(level.gain);
    // Surf: brighter noise in a band, rising and falling like waves on the sand.
    const surfSrc = ctx.createBufferSource(); surfSrc.buffer = noiseBuffer(3, false); surfSrc.loop = true;
    const band = ctx.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = 900; band.Q.value = 0.7;
    const surf = ctx.createGain(); surf.gain.value = 0;
    const wave = ctx.createOscillator(), waveDepth = ctx.createGain(); wave.frequency.value = 0.12; waveDepth.gain.value = 0;
    wave.connect(waveDepth); waveDepth.connect(surf.gain);
    src.connect(low); low.connect(level); level.connect(master);
    surfSrc.connect(band); band.connect(surf); surf.connect(master);
    for (const s of [src, swell, surfSrc, wave]) s.start();
    return { low, level, swell, swellDepth, surf, waveDepth };
  }
  function setZone(id, glide = 1.5) {
    zone = ZONE_SOUND[id] ? id : DEFAULT_ZONE;
    if (!ctx || !bed) return;
    const z = ZONE_SOUND[zone], at = ctx.currentTime;
    const to = (p, v) => { p.cancelScheduledValues(at); p.setValueAtTime(p.value, at); p.linearRampToValueAtTime(v, at + glide); };
    to(bed.low.frequency, z.cut);
    to(bed.level.gain, BED * z.level);
    to(bed.swellDepth.gain, BED * z.level * z.depth);
    bed.swell.frequency.setValueAtTime(z.swell, at);
    to(bed.surf.gain, z.surf ? BED * 0.22 : 0);
    to(bed.waveDepth.gain, z.surf ? BED * 0.2 : 0);
  }

  // ---------- one-off sounds ----------
  // A bubble: a sine whose pitch rises as it decays, the way a real bubble rings.
  function bubble(f, { at = 0, gain = 0.5, len = 0.16, rise = 1.9 } = {}) {
    const t0 = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * rise, t0 + len);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + len + 0.02);
  }
  // A soft bell: a sine and a quieter octave, struck and left to ring.
  function bell(f, { at = 0, gain = 0.28, len = 0.9 } = {}) {
    const t0 = ctx.currentTime + at;
    for (const [mul, g0, type] of [[1, gain, 'sine'], [2, gain * 0.25, 'triangle'], [3.01, gain * 0.08, 'sine']]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f * mul;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(g0, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len / mul);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + len + 0.05);
    }
  }
  // Rushing water: noise through a band that slides down.
  function whoosh({ gain = 0.35, len = 0.7, from = 1800, to = 300 } = {}) {
    const t0 = ctx.currentTime, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuffer(len + 0.1, false);
    f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(from, t0); f.frequency.exponentialRampToValueAtTime(to, t0 + len);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + len * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    src.connect(f); f.connect(g); g.connect(master); src.start(t0); src.stop(t0 + len + 0.05);
  }
  // A whale far away: a slow, low glide, heard through a lot of water.
  function whale() {
    const t0 = ctx.currentTime, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), base = 90 + random() * 70, len = 2.6 + random() * 1.6;
    o.type = 'sawtooth'; o.frequency.setValueAtTime(base, t0); o.frequency.linearRampToValueAtTime(base * (1.25 + random() * 0.3), t0 + len * 0.45); o.frequency.linearRampToValueAtTime(base * 0.85, t0 + len);
    f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.05, t0 + len * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    o.connect(f); f.connect(g); g.connect(master); o.start(t0); o.stop(t0 + len + 0.05);
  }
  // Now and then on their own: a few far-off bubbles, and in open water and below, a whale.
  function idle() {
    clearTimers();
    const later = (fn, ms) => timers.push(setLater(() => { if (live() && !(doc && doc.hidden)) fn(); }, ms));
    const trickle = () => { const n = 2 + Math.floor(random() * 4); for (let i = 0; i < n; i++) bubble(500 + random() * 900, { at: i * (0.05 + random() * 0.12), gain: 0.05 + random() * 0.05, len: 0.08 + random() * 0.08 }); later(trickle, 3500 + random() * 6000); };
    const call = () => { if (ZONE_SOUND[zone].whale) { whale(); note('whale'); } later(call, 22000 + random() * 25000); };
    later(trickle, 2500); later(call, 9000 + random() * 12000);
  }
  function clearTimers() { for (const id of timers) cancel(id); timers = []; }

  function fadeTo(v, secs = 1.2) {
    if (!master) return;
    const at = ctx.currentTime; master.gain.cancelScheduledValues(at); master.gain.setValueAtTime(master.gain.value, at); master.gain.linearRampToValueAtTime(v, at + secs);
  }
  // Starts or brings back the sound. Only call from a tap or click: phones refuse sound any other way.
  function start() {
    if (!wanted || !build()) return false;
    const go = () => { fadeTo(MASTER); if (withBed) idle(); };
    if (ctx.state === 'running') go(); else ctx.resume().then(go, () => {});
    return true;
  }
  function stop() {
    clearTimers();
    if (!ctx) return;
    fadeTo(0, 0.3);
    setLater(() => { if (!wanted && ctx.state === 'running') ctx.suspend().catch(() => {}); }, 400);
  }
  if (doc?.addEventListener) doc.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (doc.hidden) { clearTimers(); ctx.suspend().catch(() => {}); } else if (wanted) start();
  });

  const play = (name, fn) => { if (!live()) return false; fn(); note(name); return true; };
  return {
    get on() { return wanted; },
    get running() { return live(); },
    get zone() { return zone; },
    played,
    // The speaker button: on or off, remembered on this phone.
    toggle() { wanted = !wanted; remember(SOUND_KEY, wanted); if (wanted) start(); else stop(); return wanted; },
    // Any tap: when sound was left on last visit, this is the first moment it may play.
    wake() { if (wanted && !live()) start(); },
    setZone(id) { const changed = id !== zone; setZone(id); return changed; },
    tap(radius) { return play('tap', () => { const f = tapPitch(radius); bubble(f, { gain: 0.45, len: 0.18 }); bubble(f * 1.6, { at: 0.07, gain: 0.2, len: 0.1 }); }); },
    trick() { return play('trick', () => { for (let i = 0; i < 6; i++) bell(PENTA[4 + Math.floor(random() * 4)] * 2, { at: 0.1 + i * 0.07 + random() * 0.04, gain: 0.05, len: 0.4 }); }); },
    food() { return play('food', () => { bubble(1100, { gain: 0.25, len: 0.07, rise: 1.4 }); for (let i = 0; i < 3; i++) bubble(700 + random() * 500, { at: 0.08 + i * 0.07, gain: 0.08, len: 0.09 }); }); },
    found() { return play('found', () => { [0, 2, 4, 5].forEach((n, i) => bell(PENTA[n], { at: i * 0.11, gain: 0.22 - i * 0.02, len: 1.1 })); for (let i = 0; i < 4; i++) bubble(600 + random() * 600, { at: 0.3 + i * 0.09, gain: 0.08, len: 0.1 }); }); },
    wrong() { return play('wrong', () => bubble(230, { gain: 0.35, len: 0.22, rise: 1.3 })); },
    timeUp() { return play('time-up', () => { bell(PENTA[2], { gain: 0.18, len: 0.8 }); bell(PENTA[0] / 1.5, { at: 0.22, gain: 0.18, len: 1.1 }); }); },
    move() { return play('whoosh', () => whoosh()); },
    // The card and the shop: quieter than the ocean's own.
    sparkle() { return play('sparkle', () => [4, 5, 7].forEach((n, i) => bell(PENTA[n] * 2, { at: i * 0.06 + random() * 0.02, gain: 0.06, len: 0.5 }))); },
    click() { return play('click', () => bubble(1400, { gain: 0.12, len: 0.035, rise: 1.15 })); },
    tryOn() { return play('try-on', () => { bubble(520, { gain: 0.16, len: 0.12, rise: 1.7 }); bubble(880, { at: 0.06, gain: 0.07, len: 0.08 }); }); },
  };
}
