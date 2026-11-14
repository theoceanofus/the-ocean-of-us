// The shop page's preview: the creature the item is for, drawn with the item on it by the same renderer as its card (portrait.js).
// The pure helpers at the top are tested in Node; the browser part below loads the renderer and the creature's row only when it is first needed.
// Nothing new is published for this: the row comes from names.json (zone and area) and the area file, the two files the card already reads.
// (It takes the item's kind as an argument, because core/shop.js pulls in more than the site carries.)

// A plain stand-in before a name is entered, or when the name's own row can't be read.
export const SAMPLE_ROW = Object.freeze({ key: 'sample', species: 'reef_fish', colors: { primary: '#f08a3c', secondary: '#fff1d6' }, pattern: 'plain', size: 1, seed: 1234, extras: {}, paid: null });

// The row as buying `itemId` would leave it: the item in its kind's slot, replacing what was there, and no longer marked a gift
// (the new purchase's own gift choice only applies once it is delivered). Only one thing is worn on the head, and the newest wins
// (core/shop.js paidForSite), so a new hat takes off a Christmas hat and a new Christmas hat takes off a hat. Nothing else changes.
const CHRISTMAS_HATS = ['santahat', 'snowcrown'];
// The kind a new item takes off as well as its own: a hat and a Christmas hat share the head.
const headClash = (base, itemId, kind) => (kind === 'hat' && CHRISTMAS_HATS.includes(base?.paid?.christmas) ? 'christmas'
  : kind === 'christmas' && CHRISTMAS_HATS.includes(itemId) && base?.paid?.hat ? 'hat' : null);
export function previewRow(base, itemId, kind) {
  const row = base || SAMPLE_ROW;
  if (!itemId || !kind) return row;
  const paid = { ...(row.paid || { gifts: [] }) }, off = headClash(row, itemId, kind);
  paid[kind] = itemId;
  if (off) delete paid[off];
  paid.gifts = (paid.gifts || []).filter((k) => k !== kind && k !== off);
  return { ...row, paid };
}

// The kind the item would replace on this creature, or null when nothing comes off.
export function replacedKind(base, kind, itemId = null) {
  return kind && base?.paid?.[kind] ? kind : headClash(base, itemId, kind);
}

// Whether names.json shows this exact name: a row whose public name (packed[1]) is it. A hidden person's row has no name there,
// so a name the site doesn't show is never true, however it was learnt.
export function isShownName(names, name) {
  return typeof name === 'string' && name !== '' && (names?.rows ?? []).some((r) => r[1] === name);
}

// names.json, fetched once for the page (the preview and the "Decorate it" name both use it). A failed fetch can be tried again.
let namesP = null;
export const loadShopNames = () => (namesP ||= fetch(new URL('../names.json', import.meta.url)).then((r) => { if (!r.ok) throw new Error(`names ${r.status}`); return r.json(); }).catch((e) => { namesP = null; throw e; }));

const WATER = ['#2a8aa4', '#0a2c3f']; // the card's water
// Kinds worn on the head or face, which the preview shows close up.
const CLOSE_KINDS = new Set(['hat', 'face', 'look', 'christmas']);
// Creatures drawn facing us, with the head in the middle: shown whole, never cropped to one side.
const FACING_US = /jelly|starfish|kraken|octopus|man_o_war|siphonophore|sea_anemone|crinoid|medusa|squid/;

// canvas: where it draws. note: the one line under it. texts: { unavailable, hint, replaces: { kind: sentence } }.
// owned (optional): the line under the preview that lists the creature's collection; ownedText(ids) gives its words, or '' for none.
// show({ itemId, kind, key }) draws the creature `key` (or the sample when null) with the item; the latest call wins.
export function createPreview({ canvas, note, texts, owned = null, ownedText = null }) {
  let latest = 0, names = null, frameId = 0;
  const areas = new Map();
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  async function rowFor(key) {
    names = await loadShopNames();
    const packed = names.rows.find((r) => r[0] === key);
    if (!packed) throw new Error('not in names');
    const zone = names.zones[packed[3]].id, file = `${zone}-${packed[4]}`;
    if (!areas.has(file)) {
      areas.set(file, fetch(new URL(`../areas/${file}.json`, import.meta.url)).then((r) => { if (!r.ok) throw new Error(`area ${r.status}`); return r.json(); }).catch((e) => { areas.delete(file); throw e; }));
    }
    const row = (await areas.get(file)).residents.find((r) => r.key === key);
    if (!row) throw new Error('not in area');
    return row;
  }

  // mine: which show() this is. Only the newest one draws: an older one still loading the renderer (the sample, drawn before a name was
  // found) must not take over the canvas from the creature after it.
  // close: something worn on the head or face is being tried, so the picture comes in close on the front of the creature, where it is.
  async function paint(row, mine, close = false) {
    const { drawPortrait } = await import('./portrait.js');
    if (mine !== latest) return;
    const W = Math.round(canvas.clientWidth) || 256, H = Math.round(W * 170 / 256), dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    const water = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2);
    water.addColorStop(0, WATER[0]); water.addColorStop(1, WATER[1]);
    let phase = 0, last = null;
    const frame = (now) => {
      phase += last === null ? 0 : Math.min(0.1, (now - last) / 1000) * 5;
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = water; ctx.fillRect(0, 0, W, H);
      drawPortrait(ctx, row, close ? { x: W * 0.36, y: H * 0.6, width: W * 1.3, swim: phase } : { x: W / 2, y: H / 2, width: W * 0.86, swim: phase });
    };
    cancelAnimationFrame(frameId);
    frame(performance.now());
    canvas.dataset.drawn = String(Number(canvas.dataset.drawn || 0) + 1);
    if (reduced) return;
    const loop = (now) => { frame(now); frameId = requestAnimationFrame(loop); };
    frameId = requestAnimationFrame(loop);
  }

  // items: a pack's [item, kind] pairs, all put on at once (owner, 2026-11-12); otherwise the one itemId of kind.
  // Resolves true once something was put on the creature and drawn, and nothing newer was asked for meanwhile (the shop's try-on sound).
  async function show({ itemId = null, kind = null, key = null, items = null } = {}) {
    const mine = ++latest;
    let base = null, unavailable = false;
    if (key) { try { base = await rowFor(key); } catch { unavailable = true; } }
    if (mine !== latest) return false;
    if (owned) { const words = base?.paid?.owned?.length && ownedText ? ownedText(base.paid.owned) : ''; owned.textContent = words; owned.hidden = !words; }
    const parts = items ?? (itemId ? [[itemId, kind]] : []);
    const replaced = items ? (parts.some(([i, k]) => replacedKind(base, k, i)) ? 'pack' : null) : itemId ? replacedKind(base, kind, itemId) : null;
    // Before a name is found, the line under the sample says to type one (texts.hint).
    note.textContent = unavailable ? texts.unavailable : replaced ? texts.replaces[replaced] : key ? '' : (texts.hint || '');
    // In close for a hat, a face thing or a look on a creature seen from the side (not one seen from the front, like a jellyfish, nor a pack
    // with a home or companion to show). A creature's row doesn't say which way it faces, so only the creatures known to face us are left out.
    const close = parts.length > 0 && parts.every(([, k]) => CLOSE_KINDS.has(k)) && !FACING_US.test((base || SAMPLE_ROW).species || '');
    try { await paint(parts.length ? parts.reduce((row, [i, k]) => previewRow(row, i, k), base || SAMPLE_ROW) : (base || SAMPLE_ROW), mine, close); } catch { if (mine === latest) note.textContent = texts.unavailable; return false; }
    return mine === latest && parts.length > 0;
  }
  return { show };
}
