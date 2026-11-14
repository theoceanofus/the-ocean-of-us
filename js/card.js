// A creature's page: the collector card. The page reads without this script; it adds the drawing, the stats that need names.json,
// the full name for someone holding the person's own link (#k=), and "Lives near". Nothing here sends the link anywhere.
import { openName, linkToSecret, secretToLink } from '../core/site-find.js';
import { neighbourhoodOf, cardPath, showThumb, speciesCount } from '../core/site-names.js';
import { loadNames } from './names.js';
import { nameLabel, tileNameClass, isHiddenRow } from './name-label.js';
import { remember, recall } from './memory.js';
import { findHere } from './find-here.js';
import { countTaps } from './steps.js';
import { soundButton } from './sound-button.js';

export const rarityText = (count) => (count === 1 ? 'The only one in the ocean' : `1 of ${count}`);

// Shrinks the text one pixel at a time, from maxPx down to minPx, until the whole of it fits on one line.
export function fitText(el, maxPx, minPx) {
  el.style.whiteSpace = 'nowrap';
  let px = maxPx;
  el.style.fontSize = `${px}px`;
  // scrollWidth and clientWidth are whole pixels, so a text 0.14 px too wide still looked like a fit and was cut with an ellipsis.
  // The text's real width is measured, with half a pixel to spare.
  const range = document.createRange();
  const wide = () => {
    range.selectNodeContents(el);
    const style = getComputedStyle(el);
    const room = el.getBoundingClientRect().width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth);
    return range.getBoundingClientRect().width + 0.5 > room || el.scrollWidth > el.clientWidth;
  };
  while (px > minPx && wide()) el.style.fontSize = `${--px}px`;
  return px;
}

// The residents of the same neighbourhood, closest first by home.x, never the resident themself.
export function livesNear(row, residents, max = 6) {
  const hood = neighbourhoodOf(row);
  return residents
    .filter((r) => r.key !== row.key && neighbourhoodOf(r) === hood)
    .sort((a, b) => Math.abs(a.home.x - row.home.x) - Math.abs(b.home.x - row.home.x))
    .slice(0, max);
}

// The card's sounds (js/sound-button.js): a bubble when its creature is tapped, pitched by the creature's size in the ocean as it is
// there (render/scene.js's CREATURE_SCALE, which a test keeps equal), and a sparkle on Try one on. The link waits a moment for the sparkle
// only while sound is playing, and never for a tap that opens a new tab.
export const CREATURE_SCALE = 0.68;
export const SPARKLE_WAIT_MS = 280;
function cardSounds(row) {
  const button = document.getElementById('sound');
  if (!button) return null;
  const sounds = soundButton(button);
  document.querySelector('.stage')?.addEventListener('click', () => {
    if (!sounds.running) return;
    import('../render/metrics.js').then(({ artworkRadius }) => sounds.play('tap', artworkRadius(row.species) * CREATURE_SCALE * (row.size || 1))).catch(() => {});
  });
  for (const a of document.querySelectorAll('.try-on-item')) a.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !sounds.play('sparkle')) return;
    e.preventDefault();
    setTimeout(() => location.assign(a.href), SPARKLE_WAIT_MS);
  });
  return sounds;
}

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

function fitAll() {
  const who = document.getElementById('who'), nick = document.getElementById('nick');
  fitText(who, 28, 12);
  if (!nick.hidden) fitText(nick, 18, 11);
}

// The person's own link: #k=<secret> opens the sealed name. A wrong or damaged one leaves the card as it was.
// For a hidden person the secret then moves to this phone's last-found and leaves the address, so the address can't be copied on with it in.
async function showFullName(row) {
  const hidden = isHiddenRow(row);
  const fromLink = linkToSecret(new URLSearchParams(location.hash.slice(1)).get('k'));
  const last = hidden && !fromLink ? recall('last-found') : null;
  const secret = fromLink ?? (last?.key === row.key ? linkToSecret(last.secret) : null);
  if (!secret || !row.sealed) return;
  const opened = await openName(secret, row.sealed);
  if (!opened) return;
  document.getElementById('who').textContent = nameLabel(opened.username);
  if (opened.nickname) { const n = document.getElementById('nick'); n.textContent = opened.nickname; n.hidden = false; }
  window.cardKnown = { username: opened.username, nickname: opened.nickname, secret };
  if (hidden) {
    if (fromLink) {
      remember('last-found', { key: row.key, username: opened.username, nickname: opened.nickname, secret: secretToLink(secret) });
      history.replaceState(history.state, '', location.pathname + location.search);
    }
  } else {
    const swimLink = document.getElementById('swim'); // See it swim carries the person's link on, so the ocean shows the full name too
    if (swimLink) swimLink.href = `${swimLink.getAttribute('href').split('#')[0]}#k=${secretToLink(secret)}`;
  }
  fitAll();
}

// A gift shows as "A gift" under the look, and never says who gave it.
function showGift(row) {
  if (!row.paid?.gifts?.length) return;
  document.querySelector('.species')?.after(el('p', 'gift', 'A gift'));
}

let rarity = ''; // the card's "1 of 38" text once names.json has loaded; the Story picture leaves it out until then
async function showRarity(row) {
  // The count is written into the page when the site is built, so the stat is there at once and names.json isn't fetched for it.
  if (row.sameKind) { rarity = rarityText(row.sameKind); return; }
  const count = speciesCount(await loadNames(), row.species);
  if (!count) return;
  rarity = rarityText(count);
  const li = el('li'); li.append(el('strong', '', rarity), el('span', '', 'Rarity'));
  document.getElementById('stats').prepend(li);
}

async function showNeighbours(row) {
  const res = await fetch(new URL(`../areas/${row.zone}-${row.areaN}.json`, import.meta.url));
  if (!res.ok) throw new Error(`area ${res.status}`);
  const near = livesNear(row, (await res.json()).residents);
  if (!near.length) return;
  const section = el('section'); section.id = 'near';
  const strip = el('div', 'row');
  section.append(el('h2', '', 'Lives near'), strip);
  for (const r of near) {
    const a = el('a', 'tile'); a.href = `../../../${cardPath(r.key)}`;
    const pic = el('span', 'pic');
    const img = el('img'); img.loading = 'lazy'; img.alt = ''; img.width = 256; img.height = 170; showThumb(img, r.key);
    img.addEventListener('error', () => img.replaceWith(el('span', 'ph')), { once: true });
    const label = nameLabel(r.name);
    pic.append(img); a.append(pic, el('span', tileNameClass(label), label));
    strip.append(a);
  }
  (document.querySelector('.actions + .yours-too') ?? document.querySelector('.actions')).after(section); // only added once there is something to show
}

// Draws the creature over its thumbnail. If the drawing code can't load or run, the thumbnail simply stays.
async function swim(row) {
  const canvas = document.querySelector('canvas.portrait');
  const { drawPortrait } = await import('./portrait.js');
  // Drawn at the size the stage really is, so it stays sharp on the card-wide stage.
  const W = Math.round(canvas.parentElement.clientWidth) || 256, H = Math.round(W * 170 / 256), dpr = Math.min(3, window.devicePixelRatio || 1);
  canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  // The same water as the thumbnail and the link preview, so the picture doesn't change colour when the drawing takes over.
  const water = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2);
  water.addColorStop(0, '#2a8aa4'); water.addColorStop(1, '#0a2c3f');
  let phase = 0, last = null;
  const frame = (now) => {
    phase += last === null ? 0 : Math.min(0.1, (now - last) / 1000) * 5;
    last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = water; ctx.fillRect(0, 0, W, H);
    drawPortrait(ctx, row, { x: W / 2, y: H / 2, width: W * 0.86, swim: phase });
    canvas.hidden = false;
  };
  frame(performance.now());
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const loop = (now) => { frame(now); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}

const rowEl = typeof document !== 'undefined' && document.getElementById('row');
if (rowEl) {
  const row = JSON.parse(rowEl.textContent);
  window.cardRow = row;
  window.cardKnown = null;
  showGift(row);
  fitAll();
  document.getElementById('share')?.addEventListener('click', () => { import('./share.js').then((m) => m.openShare(row, rarity)).catch(() => {}); });
  // The New Year card (report B2): its button and facts are in the page only while it is on (core/new-year-card.js).
  const openNewYear = () => import('./new-year.js').then((m) => m.openNewYear(row)).catch(() => {});
  if (row.firstWeeks) document.getElementById('new-year')?.addEventListener('click', openNewYear);
  countTaps('.try-on-item, .try-on-pack', 'try-on'); // the day's total of Try one on taps, the packs' line included (js/steps.js)
  // The keepsake (brand report B7): on a card whose creature has something from the shop. Its script ships only with the shop.
  if (document.getElementById('keepsake')) import('./shop-keepsake.js').then((m) => m.initKeepsake(row)).catch(() => {});
  // The print picture (physical keepsakes report): its script loads only when someone asks for it.
  document.getElementById('print-open')?.addEventListener('click', (e) => { const b = e.currentTarget; import('./print-card.js').then((m) => m.openPrint(row, b)).catch(() => {}); });
  const sounds = cardSounds(row);
  window.cardSound = () => sounds?.state() ?? null; // for tests
  new ResizeObserver(fitAll).observe(document.querySelector('.card'));
  // Someone new to the site, most likely here from a friend's Story: how to get one of their own goes straight under the buttons, on the first screen.
  if (!recall('last-found')) { const yours = document.querySelector('.yours-too'); if (yours) document.querySelector('.actions').after(yours); }
  // "Share it" on the ocean's sheet arrives with share=1 after the #, and "New Year card" with newyear=1. Each leaves the address at once,
  // so a reload or a copied address doesn't reopen it.
  const hashParams = new URLSearchParams(location.hash.slice(1));
  const askedToShare = hashParams.get('share') === '1', askedForNewYear = hashParams.get('newyear') === '1';
  if (askedToShare || askedForNewYear) { hashParams.delete('share'); hashParams.delete('newyear'); const rest = hashParams.toString(); history.replaceState(history.state, '', location.pathname + location.search + (rest ? `#${rest}` : '')); }
  if (askedForNewYear && row.firstWeeks && !askedToShare) openNewYear();
  // Each part is separate: one failing never takes the others down.
  showRarity(row).catch(() => {});
  const nameOpened = showFullName(row).catch(() => {}); // the Story picture needs the full name, so the share screen waits for it
  if (askedToShare) nameOpened.then(() => import('./share.js')).then((m) => m.openShare(row, rarity)).catch(() => {});
  showNeighbours(row).catch(() => {});
  swim(row).catch(() => {});
  // "Find yours": someone who arrived on a friend's card can look their own creature up without leaving for the ocean first.
  const findInput = document.getElementById('name');
  if (findInput) findHere({ input: findInput, button: document.getElementById('find-btn'), msg: document.getElementById('find-msg') });
}
