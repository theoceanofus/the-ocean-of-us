// The New Year card (buying and participation report, B2): a creature's first weeks in the ocean, as a picture made to be sent to a
// friend, in Story size (1080x1920) and square (1080x1080). The site build puts the facts in the page only while the card is on
// (core/new-year-card.js), and this file draws them here on the phone. It uses only what the card already shows to everyone: the name as
// it is shown (none for a hidden person), never a nickname, and the link it sends never carries #k=. Nothing is sent anywhere by this
// file; Send to a friend adds one to the day's total of sends (js/steps.js), and the phone's own share sheet does the rest.
import { nameLabel, isHiddenRow } from './name-label.js';
import { count } from './steps.js';
import { roundedBox, fileFromDataUrl, canShareFile, isInstagramBrowser, pressAndHoldWorks, OPEN_ELSEWHERE_TEXT, SEND_COPIED_TEXT } from './share.js';

export const SHAPES = Object.freeze({ story: { w: 1080, h: 1920 }, square: { w: 1080, h: 1080 } });
export const HEADLINE = 'My first weeks in the ocean';
export const JOIN_LINE = 'Comment an ocean animal to join';
export const HANDLE = '@the_ocean_of_us';
// Where the picture can't be shared straight from the page: how to get it into a Story by hand.
export const STORY_STEPS = Object.freeze(['Press and hold the picture to save it.', 'Open Instagram and add it to your Story.']);

const SERIF = (px) => `${px}px "Young Serif", Georgia, serif`;
const FIG = (px, weight = 700) => `${weight} ${px}px Figtree, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`;
// Usernames in a plain sans: Georgia draws 0 like o and 1 like I (as on the card itself).
const NAME = (px) => `bold ${px}px -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`;
const C = { foam: '#f4fbf8', lagoon: '#58e0cf', coral: '#ffb08a', sand: '#f0d995', muted: '#9fd3de' };

// The animal's name inside a sentence: the label as it is (it may be a proper name, such as SpongeBob SquarePants or a Portuguese man o'
// war), without a note in brackets or an explanation after a comma ("Thalassocnus, the swimming sloth (reconstruction)").
export const speciesName = (label) => String(label || 'creature').replace(/\s*\([^)]*\)\s*$/, '').replace(/,.*$/, '').trim() || 'creature';
// The name on the card: the public one, or none for a hidden person. Never the nickname, even for a visitor who holds it.
export const cardName = (row) => (isHiddenRow(row) ? null : nameLabel(row.name));

// The four boxes under the creature: [label, value, small line under it].
export function cardTiles(row, facts) {
  const looks = facts.looks?.length ? facts.looks : null;
  return [
    facts.arrived ? ['ARRIVED', facts.arrived, ''] : ['RESIDENT', `No. ${(row.slot + 1).toLocaleString('en-AU')}`, ''],
    ['HOME', facts.hood, facts.zone ?? ''],
    ['JOINED AFTER ME', facts.after, ''],
    looks ? ['MY LOOK', looks, ''] : facts.rarity ? ['RARITY', facts.rarity, ''] : ['RESIDENT', `No. ${(row.slot + 1).toLocaleString('en-AU')}`, ''],
  ];
}

// The message that goes with a send: what this is, and how the friend gets one of their own. The link is added by the caller.
export function sendText(row, facts) {
  const since = facts.arrived ? ` since ${facts.arrived.replace(/^The /, 'the ')}` : '';
  return `My ${speciesName(row.speciesLabel)} has been in The Ocean of Us${since}! Comment an ocean animal on any ${HANDLE} Reel to join, and it becomes you.`;
}

// Words split into lines no wider than maxWidth, at the largest size from maxPx down to minPx that needs no more than maxLines.
// At minPx it takes what it needs, so nothing is ever cut off. The lines are evened out ("My first weeks / in the ocean", not
// "My first weeks in / the ocean"): the narrowest width that still needs no more lines is used.
// `sep`: where a line may break, a space by default; a list of looks breaks only between looks (' · ').
export function fitLines(ctx, text, fontFor, maxWidth, maxPx, minPx, maxLines, sep = ' ') {
  const before = ctx.font;
  const pieces = sep === ' ' ? String(text).split(/\s+/).filter(Boolean) : String(text).split(sep);
  const wrap = (px, width = maxWidth) => {
    ctx.font = fontFor(px);
    const lines = [];
    for (const piece of pieces) {
      const last = lines[lines.length - 1];
      if (last !== undefined && ctx.measureText(`${last}${sep}${piece}`).width <= width) lines[lines.length - 1] = `${last}${sep}${piece}`;
      else lines.push(piece);
    }
    return lines;
  };
  let px = maxPx, lines = wrap(px);
  while (px > minPx && (lines.length > maxLines || lines.some((l) => ctx.measureText(l).width > maxWidth))) lines = wrap(--px);
  if (lines.length > 1) {
    let lo = 0, hi = maxWidth;
    for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (wrap(px, mid).length <= lines.length) hi = mid; else lo = mid; }
    lines = wrap(px, hi);
  }
  ctx.font = before;
  return { px, lines };
}

// The same few numbers every time for one creature, so its card always looks the same (mulberry32).
function seeded(seed) {
  let a = (Number(seed) >>> 0) || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// A four-pointed sparkle, for the New Year.
function sparkle(ctx, x, y, r, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill(); ctx.restore();
}

// Deep water, light falling from the surface, bubbles at the sides and a few sparkles. `free(x, y)`: where a sparkle may go, so none sits
// on the words.
function backdrop(ctx, W, H, seed, margin, free) {
  const sea = ctx.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, '#11627a'); sea.addColorStop(0.42, '#073249'); sea.addColorStop(1, '#03131d');
  ctx.fillStyle = sea; ctx.fillRect(0, 0, W, H);
  const rand = seeded(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const x = W * (0.1 + 0.2 * i + (rand() - 0.5) * 0.1), spread = W * (0.08 + rand() * 0.08);
    const ray = ctx.createLinearGradient(0, 0, 0, H * 0.75);
    ray.addColorStop(0, 'rgba(150, 230, 235, 0.10)'); ray.addColorStop(1, 'rgba(150, 230, 235, 0)');
    ctx.fillStyle = ray; ctx.beginPath(); ctx.moveTo(x - W * 0.03, 0); ctx.lineTo(x + W * 0.03, 0); ctx.lineTo(x + spread + W * 0.1, H * 0.75); ctx.lineTo(x - spread + W * 0.1, H * 0.75); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(244, 251, 248, 0.22)'; ctx.lineWidth = 3;
  for (let i = 0; i < 16; i++) {
    const r = 4 + rand() * Math.min(14, margin * 0.2), side = (margin - 2 * r - 8) * rand() + r + 4;
    ctx.beginPath(); ctx.arc(rand() < 0.5 ? side : W - side, H * (0.12 + rand() * 0.84), r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  for (let placed = 0, tries = 0; placed < 14 && tries < 400; tries++) {
    const x = 24 + rand() * (W - 48), y = 24 + rand() * (H - 48), r = 6 + rand() * 12, color = rand() < 0.66 ? C.sand : C.foam, alpha = 0.35 + rand() * 0.5;
    if (free(x, y, r)) { sparkle(ctx, x, y, r, color, alpha); placed++; }
  }
}

const ready = { fonts: null };
// The brand fonts, if they come in time; the picture is drawn in the fallbacks otherwise.
function loadFonts() {
  ready.fonts ??= (async () => {
    if (!document.fonts?.load) return;
    const all = Promise.all([document.fonts.load(SERIF(64)), document.fonts.load(FIG(40, 700)), document.fonts.load(FIG(30, 600))]).catch(() => {});
    await Promise.race([all, new Promise((r) => setTimeout(r, 2500))]);
  })();
  return ready.fonts;
}

// [where things go] for each shape: the margin, the kicker, headline, creature, words block, boxes and the join line at the bottom.
// The Story keeps every word between y 250 and 1620, because Instagram's own buttons cover the top and bottom of a Story.
const LAYOUT = {
  story: { m: 110, kicker: [286, 30], head: { top: 372, max: 84, min: 60, lines: 2, lh: 1.07 }, creature: { y: 722, width: 800, glow: 360 },
    words: { top: 950, bottom: 1188, name: [58, 30], line: [46, 32, 3] }, tiles: { top: 1214, h: 128, gap: 16, label: 24, value: [40, 22], sub: 26 }, join: { y: 1556, handleY: 1608, px: [46, 30], handlePx: 38 } },
  square: { m: 70, kicker: [76, 26], head: { top: 146, max: 64, min: 44, lines: 1, lh: 1.1 }, creature: { y: 345, width: 580, glow: 260 },
    words: { top: 512, bottom: 692, name: [44, 26], line: [36, 26, 2] }, tiles: { top: 712, h: 116, gap: 14, label: 20, value: [34, 20], sub: 22 }, join: { y: 1032, px: [34, 22] } },
};

// One centred line of text in a given font, colour and place.
function text(ctx, s, x, y, font, color, align = 'center') { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(s, x, y); }

// A box with a small label, a value of one or two lines that shrinks to fit, and an optional line under it.
function tile(ctx, x, y, w, h, [label, value, sub], T) {
  roundedBox(ctx, x, y, w, h, 26);
  ctx.fillStyle = 'rgba(11, 74, 96, 0.62)'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(88, 224, 207, 0.38)'; ctx.stroke();
  const inner = w - 44, cx = x + w / 2;
  text(ctx, label, cx, y + T.label + 14, FIG(T.label, 800), C.lagoon);
  // One line when it fits at three quarters of the full size or more; otherwise two, unless there is a small line under it.
  const room = sub ? 1 : 2, font = (p) => FIG(p, 700);
  const valueTop = y + T.label + 26, valueBottom = y + h - (sub ? T.sub + 18 : 12);
  const twoLinePx = Math.max(T.value[1], Math.min(T.value[0], Math.floor((valueBottom - valueTop) / 2.2))); // two lines fit the box
  const fit = (s) => {
    const one = fitLines(ctx, s, font, inner, T.value[0], room === 1 ? T.value[1] : Math.round(T.value[0] * 0.75), 1);
    return one.lines.length === 1 || room === 1 ? one : fitLines(ctx, s, font, inner, twoLinePx, T.value[1], room);
  };
  // A list of looks: as many as fit in the box, up to three, most noticeable first, breaking only between looks. Anything else is one value.
  const SEP = ' · ';
  const fitsBox = (f) => f.lines.length <= room && f.px > T.value[1] && f.lines.every((l) => { ctx.font = font(f.px); return ctx.measureText(l).width <= inner; });
  let best = null;
  if (Array.isArray(value)) {
    for (let n = Math.min(3, value.length); n > 1 && !best; n--) {
      const joined = value.slice(0, n).join(SEP), one = fitLines(ctx, joined, font, inner, T.value[0], Math.round(T.value[0] * 0.75), 1, SEP);
      const f = one.lines.length === 1 ? one : fitLines(ctx, joined, font, inner, twoLinePx, T.value[1], room, SEP);
      if (fitsBox(f)) best = f;
    }
  }
  const { px, lines: shown } = best ?? fit(Array.isArray(value) ? value[0] : value); // never cut: at the smallest size a value takes the lines it needs
  const lh = px * 1.1, block = lh * shown.length;
  let by = valueTop + (valueBottom - valueTop - block) / 2 + px * 0.86;
  for (const l of shown) { text(ctx, l, cx, by, FIG(px, 700), C.foam); by += lh; }
  if (sub) {
    const s = fitLines(ctx, sub, (p) => FIG(p, 500), inner, T.sub, 16, 1);
    text(ctx, s.lines.join(' '), cx, y + h - 18, FIG(s.px, 500), C.muted);
  }
}

// The picture as a JPEG data URL. `shape`: 'story' or 'square'. `facts`: row.firstWeeks from the page.
export async function drawNewYearCard(row, facts, shape = 'story') {
  const [{ drawPortrait }] = await Promise.all([import('./portrait.js'), loadFonts()]);
  const { w: W, h: H } = SHAPES[shape], L = LAYOUT[shape], TW = W - 2 * L.m;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'alphabetic';
  // Sparkles go round the creature and in the margins, never on the words.
  const nearCreature = (x, y, r) => Math.abs(y - L.creature.y) < L.creature.glow * 0.9 - r && y - r > L.head.top + 20;
  backdrop(ctx, W, H, row.seed, L.m, (x, y, r) => nearCreature(x, y, r) || ((x + r < L.m - 8 || x - r > W - L.m + 8) && y > 40 && y < H - 40));

  text(ctx, `THE OCEAN OF US · NEW YEAR ${facts.year}`, W / 2, L.kicker[0], FIG(L.kicker[1], 700), C.lagoon);
  const head = fitLines(ctx, HEADLINE, SERIF, TW, L.head.max, L.head.min, L.head.lines);
  head.lines.forEach((l, i) => text(ctx, l, W / 2, L.head.top + i * head.px * L.head.lh, SERIF(head.px), C.foam));

  // The creature, with a soft light behind it.
  const glow = ctx.createRadialGradient(W / 2, L.creature.y, 0, W / 2, L.creature.y, L.creature.glow);
  glow.addColorStop(0, 'rgba(88, 224, 207, 0.42)'); glow.addColorStop(0.6, 'rgba(47, 214, 195, 0.12)'); glow.addColorStop(1, 'rgba(47, 214, 195, 0)');
  ctx.fillStyle = glow; ctx.fillRect(0, L.creature.y - L.creature.glow, W, L.creature.glow * 2);
  drawPortrait(ctx, row, { x: W / 2, y: L.creature.y, width: L.creature.width });

  // The name (none for a hidden person) and the line about who it is, together just above the boxes, so a tall creature has room.
  const name = cardName(row);
  const nameFit = name ? fitLines(ctx, name, NAME, TW, L.words.name[0], L.words.name[1], 1) : null;
  const line = fitLines(ctx, facts.line, SERIF, TW, L.words.line[0], L.words.line[1], L.words.line[2]);
  const rows = [...(nameFit ? [[nameFit.lines.join(' '), NAME(nameFit.px), C.foam, nameFit.px]] : []), ...line.lines.map((l) => [l, SERIF(line.px), C.coral, line.px])];
  const gap = (i) => (i === 0 ? 0 : rows[i - 1][3] * (nameFit && i === 1 ? 0.5 : 0.22));
  const tall = rows.reduce((h, r, i) => h + gap(i) + r[3] * 1.0, 0);
  let y = L.words.bottom - tall;
  rows.forEach(([s, font, color, px], i) => { y += gap(i) + px * 0.82; text(ctx, s, W / 2, y, font, color); y += px * 0.18; });

  const T = L.tiles, tw = (TW - T.gap) / 2;
  cardTiles(row, facts).forEach((t, i) => tile(ctx, L.m + (i % 2) * (tw + T.gap), T.top + Math.floor(i / 2) * (T.h + T.gap), tw, T.h, t, T));

  // The invitation, so every send also asks the friend in.
  if (shape === 'story') {
    const j = fitLines(ctx, JOIN_LINE, (px) => FIG(px, 800), TW, L.join.px[0], L.join.px[1], 1);
    text(ctx, j.lines.join(' '), W / 2, L.join.y, FIG(j.px, 800), C.foam);
    text(ctx, HANDLE, W / 2, L.join.handleY, FIG(L.join.handlePx, 700), C.lagoon);
  } else {
    // One line: the invitation, then the handle picked out in the brand's turquoise.
    const runs = [[`${JOIN_LINE} · `, 800, C.foam], [HANDLE, 700, C.lagoon]];
    const widthAt = (px) => runs.reduce((w, [s, weight]) => { ctx.font = FIG(px, weight); return w + ctx.measureText(s).width; }, 0);
    let px = L.join.px[0];
    while (px > L.join.px[1] && widthAt(px) > TW) px--;
    let x = W / 2 - widthAt(px) / 2;
    for (const [s, weight, color] of runs) { text(ctx, s, x, L.join.y, FIG(px, weight), color, 'left'); x += ctx.measureText(s).width; }
  }
  ctx.textAlign = 'center';
  return canvas.toDataURL('image/jpeg', 0.9);
}

const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
// The card's own address, with nothing after the #: the link that goes with a send never carries #k= (and so never a nickname).
const cardLink = () => location.href.split('#')[0];

// The screen: the picture in Story size or square, "Send to a friend" first, "Add to Story" second, and the invitation under them.
export function openNewYear(row) {
  const facts = row?.firstWeeks;
  if (!facts) return;
  document.getElementById('new-year-screen')?.remove();
  const ua = navigator.userAgent || '';
  const opener = document.activeElement;
  const root = el('div'); root.id = 'new-year-screen';
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'New Year card');
  const panel = el('div', 'share-panel');
  const shapes = el('div', 'ny-shapes'); shapes.setAttribute('role', 'group'); shapes.setAttribute('aria-label', 'Picture size');
  const shapeBtn = {};
  for (const [id, label] of [['story', 'Story'], ['square', 'Square']]) {
    const b = el('button', '', label); b.type = 'button'; b.dataset.shape = id; b.setAttribute('aria-pressed', String(id === 'story'));
    shapeBtn[id] = b; shapes.append(b);
  }
  const picture = el('div', 'share-picture');
  const status = el('p', 'share-status'); status.setAttribute('role', 'status');
  const sendBtn = el('button', 'button share-send', 'Send to a friend'); sendBtn.type = 'button';
  const storyBtn = el('button', 'button ghost', 'Add to Story'); storyBtn.type = 'button';
  const buttons = el('div', 'share-buttons'); buttons.append(sendBtn, storyBtn);
  const join = el('p', 'ny-join'); const joinLink = el('a', '', JOIN_LINE); joinLink.href = 'https://www.instagram.com/the_ocean_of_us/'; join.append(joinLink);
  const closeBtn = el('button', 'share-close', 'Close'); closeBtn.type = 'button';
  panel.append(shapes, picture, buttons, join, status, closeBtn);
  root.append(panel);

  const close = () => { root.remove(); document.removeEventListener('keydown', onKey); if (opener?.isConnected) opener.focus(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', onKey);

  const made = {}; // shape -> { url, file }, ready before a tap so the tap can open the share sheet at once
  let shape = 'story';
  const show = (id) => {
    shape = id;
    for (const [k, b] of Object.entries(shapeBtn)) b.setAttribute('aria-pressed', String(k === id));
    const img = picture.querySelector('img');
    if (img && made[id]) { img.src = made[id].url; img.width = SHAPES[id].w; img.height = SHAPES[id].h; img.className = `ny-${id}`; }
  };
  for (const b of Object.values(shapeBtn)) b.addEventListener('click', () => { if (made[b.dataset.shape]) show(b.dataset.shape); });

  const showSteps = () => {
    if (picture.querySelector('.share-steps')) return;
    const steps = el('ol', 'share-steps');
    for (const s of STORY_STEPS) steps.append(el('li', '', s));
    picture.append(steps);
  };

  sendBtn.addEventListener('click', async () => {
    count('send'); // the day's total of sends (js/steps.js): only that one happened
    const message = sendText(row, facts), link = cardLink();
    const file = made[shape]?.file;
    if (file && canShareFile(file)) {
      try { await navigator.share({ files: [file], text: `${message} ${link}` }); status.textContent = ''; return; } catch (e) { if (e?.name === 'AbortError') return; }
    }
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ text: message, url: link }); status.textContent = ''; return; } catch (e) { if (e?.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(`${message} ${link}`); status.textContent = SEND_COPIED_TEXT; return; } catch { /* fall through */ }
    let input = root.querySelector('input');
    if (!input) { input = el('input', 'share-link'); input.readOnly = true; input.setAttribute('aria-label', 'Your message'); status.after(input); }
    input.value = `${message} ${link}`; input.focus(); input.select();
    status.textContent = 'Select the message and copy it.';
  });

  storyBtn.addEventListener('click', async () => {
    const file = made.story?.file;
    if (file && canShareFile(file)) {
      try { await navigator.share({ files: [file] }); status.textContent = ''; return; } catch (e) { if (e?.name === 'AbortError') return; }
    }
    // No way to hand the picture over from here: the Story-size one is shown to save by hand.
    if (made.story) show('story');
    showSteps();
    status.textContent = 'Save the picture, then add it to your Story.';
  });

  document.body.append(root);
  sendBtn.focus();

  if (isInstagramBrowser(ua) && !pressAndHoldWorks(ua)) {
    shapes.hidden = true;
    picture.append(el('p', 'share-note', OPEN_ELSEWHERE_TEXT));
    return;
  }
  const wait = el('p', 'share-wait', 'Making your card...');
  picture.append(wait);
  const alt = `New Year card: ${speciesName(row.speciesLabel)}, ${facts.line.replace(/^The [^]*? who /, 'who ')}. The Ocean of Us.`;
  (async () => {
    for (const id of ['story', 'square']) {
      const url = await drawNewYearCard(row, facts, id);
      if (!root.isConnected) return;
      made[id] = { url, file: fileFromDataUrl(url, `the-ocean-of-us-new-year-${id}.jpg`) };
      if (id === 'story') {
        const img = el('img'); img.alt = alt;
        wait.replaceWith(img);
        show('story');
      }
    }
  })().catch(() => {
    if (!root.isConnected) return;
    if (!made.story) wait.replaceWith(el('p', 'share-note', "Your card couldn't be made on this phone. You can still send your link."));
  });
}
