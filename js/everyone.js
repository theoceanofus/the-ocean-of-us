// The Everyone tab: zone buttons, sideways shelves, "See all" grids and animal search. Everything comes from names.json, so a hidden name reads Name hidden.
// A person is found with the Find box, by their exact name only: the animal search never looks at names.
import { loadNames, showRetry, unpackRow, matchAnimals, zoneShelves, animalPeople } from './names.js';
import { spotlightRows } from '../core/site-names.js';
import { remember, recall } from './memory.js';
import { cardPath, showThumb } from '../core/site-names.js';
import { createSpotted } from './spotted.js';
import { nameLabel, tileNameClass } from './name-label.js';
import { findHere } from './find-here.js';
import { findsHash, readFindsHash, restoreFinds, savedFinds } from './keep-finds.js';

const PAGE = 60, SHELF = 12, MAX_SEARCH_SHELVES = 24, DEFAULT_ZONE = 'open';
const zonesEl = document.getElementById('zones'), content = document.getElementById('content'), search = document.getElementById('search');
const today = () => new Date().toISOString().slice(0, 10);
let names, spotted, zoneId, animalId = null, watchers = [];

// A "Save my finds" link brings its finds into this browser, then leaves the address, so a reload or a copied address doesn't carry them.
const fromLink = readFindsHash(location.hash);
const restored = fromLink ? restoreFinds({ remember, recall }, fromLink) : null;
if (fromLink) history.replaceState(null, '', location.pathname + location.search);

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const stopWatching = () => { watchers.forEach((w) => w.disconnect()); watchers = []; };

// One IntersectionObserver for the pictures: a thumbnail is asked for only when its tile is nearly on screen.
function pictureLoader() {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { showThumb(e.target, e.target.dataset.key); io.unobserve(e.target); }
  }, { rootMargin: '150px' });
  watchers.push(io);
  return io;
}

function tile(row, loader) {
  const { key, name } = unpackRow(names, row);
  const label = nameLabel(name);
  const a = el('a', 'tile'); a.href = `../${cardPath(key)}`;
  const pic = el('span', 'pic');
  const img = el('img'); img.loading = 'lazy'; img.alt = ''; img.width = 256; img.height = 170; img.decoding = 'async';
  img.dataset.key = key;
  img.addEventListener('error', () => img.replaceWith(el('span', 'ph')), { once: true });
  img.classList.add('fade'); img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
  pic.append(img); loader.observe(img);
  a.append(pic, el('span', tileNameClass(label), label));
  return a;
}

const seeAllHref = (zone, animal) => `?zone=${encodeURIComponent(zone)}&animal=${encodeURIComponent(animal)}`;

function shelf(zone, speciesId, heading, people, loader) {
  const s = el('section', 'shelf');
  const head = el('div', 'shelf-head');
  const all = el('a', 'see-all', 'See all'); all.href = seeAllHref(zone, speciesId); all.dataset.animal = speciesId;
  const h = el('h2', '', heading);
  if (spotted.has(speciesId)) { const tick = el('span', 'tick', ' \u2713'); tick.setAttribute('role', 'img'); tick.setAttribute('aria-label', 'spotted'); tick.title = 'Spotted'; h.append(tick); }
  head.append(h, all);
  const row = el('div', 'row');
  for (const r of people) row.append(tile(r, loader));
  s.append(head, row);
  return s;
}

// In the spotlight (owner, 2026-11-12): creatures someone paid to have seen for 7 days come first, whichever zone is showing.
function spotlightShelf(loader) {
  const rows = spotlightRows(names, today());
  if (!rows.length) return null;
  const s = el('section', 'shelf spot-shelf'), head = el('div', 'shelf-head'), row = el('div', 'row');
  head.append(el('h2', '', '\u2728 In the spotlight'));
  for (const r of rows) row.append(tile(r, loader));
  s.append(head, row);
  return s;
}

function showShelves() {
  const shelves = zoneShelves(names, zoneId, today(), SHELF);
  const loader = pictureLoader(), spot = spotlightShelf(loader);
  if (!shelves.length) { content.replaceChildren(...[spot, el('p', 'muted', 'Nobody here yet.')].filter(Boolean)); return; }
  content.replaceChildren(...[spot, ...shelves.map((s) => shelf(zoneId, s.speciesId, s.heading, s.people, loader))].filter(Boolean));
}

function showSearch(query) {
  const found = matchAnimals(names, query).slice(0, MAX_SEARCH_SHELVES);
  const zonesOf = new Map(); // species index -> zone ids that have someone
  for (const r of names.rows) (zonesOf.get(r[2]) || zonesOf.set(r[2], new Set()).get(r[2])).add(names.zones[r[3]].id);
  const loader = pictureLoader();
  const out = [];
  for (const sp of found) {
    for (const z of zonesOf.get(names.species.indexOf(sp)) ?? []) {
      const people = animalPeople(names, z, sp.id, today());
      out.push(shelf(z, sp.id, `${sp.label} · ${people.length}`, people.slice(0, SHELF), loader));
    }
  }
  content.replaceChildren(...(out.length ? out : [el('p', 'muted', 'No animal matches that.')]));
}

function showGrid() {
  const people = animalPeople(names, zoneId, animalId, today());
  const label = animalId === 'only' ? 'Only one of its kind' : `${names.species.find((s) => s.id === animalId)?.label ?? ''} · ${people.length}`;
  const back = el('a', 'back', '‹ Back'); back.href = `?zone=${encodeURIComponent(zoneId)}`;
  back.addEventListener('click', (ev) => {
    ev.preventDefault();
    if (history.state?.grid) history.back(); else { history.replaceState(null, '', back.getAttribute('href')); sync(); }
  });
  const head = el('div', 'shelf-head'); head.append(back, el('h2', '', people.length ? label : 'Nobody here yet'));
  const grid = el('div', 'grid'), sentinel = el('div', 'sentinel');
  content.replaceChildren(head, grid, sentinel);
  const loader = pictureLoader();
  let shown = 0;
  const more = () => { for (const r of people.slice(shown, shown + PAGE)) grid.append(tile(r, loader)); shown = Math.min(people.length, shown + PAGE); };
  more();
  if (shown >= people.length) return;
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    more();
    if (shown >= people.length) { io.disconnect(); return; }
    io.unobserve(sentinel); io.observe(sentinel); // look again: the sentinel may still be in view
  }, { rootMargin: '400px' });
  watchers.push(io); io.observe(sentinel);
}

// The zone row is wider than a phone, so the chosen zone is slid to the middle of it: the page opens on Open Water, whose button would
// otherwise sit off the right edge with nothing on screen saying which zone is showing. Only the row moves, never the page.
function showChosenZone() {
  const chosen = zonesEl.querySelector('[aria-pressed="true"]');
  if (!chosen || zonesEl.hidden) return;
  const row = zonesEl.getBoundingClientRect(), chip = chosen.getBoundingClientRect();
  zonesEl.scrollLeft += chip.left - row.left - (row.width - chip.width) / 2;
}

function render() {
  stopWatching();
  const q = search.value.trim();
  const searching = !animalId && q !== '';
  zonesEl.hidden = searching;
  // A sponsored zone says who supports it, under the zone buttons (owner, 2026-11-12).
  const sponsor = !searching && names.zones.find((z) => z.id === zoneId)?.sponsor;
  let line = document.getElementById('zone-sponsor');
  if (!line) { line = el('p', 'zone-sponsor'); line.id = 'zone-sponsor'; zonesEl.after(line); }
  line.replaceChildren(...(sponsor ? [sponsor.charity ? 'This zone\'s partner charity is ' : 'This zone is paid for by ', sponsor.url ? Object.assign(el('a', '', sponsor.name), { href: sponsor.url, rel: 'sponsored noopener' }) : sponsor.name] : []));
  line.hidden = !sponsor;
  for (const b of zonesEl.children) b.setAttribute('aria-pressed', String(b.dataset.zone === zoneId));
  showChosenZone();
  if (animalId) showGrid(); else if (searching) showSearch(q); else showShelves();
}

// Reads the address: ?zone=open&animal=orca
function sync() {
  const params = new URLSearchParams(location.search);
  const z = params.get('zone');
  zoneId = names.zones.some((x) => x.id === z) ? z : recall('everyone-zone', DEFAULT_ZONE);
  if (!names.zones.some((x) => x.id === zoneId)) zoneId = names.zones.some((x) => x.id === DEFAULT_ZONE) ? DEFAULT_ZONE : names.zones[0]?.id;
  animalId = params.get('animal');
  render();
}

// A link back to the creature this phone last found by name, so finding yourself is one tap on a later visit. A hidden person's link never
// carries #k=: their card opens the name from this phone's own memory instead. If they have left the ocean, there is nothing to show.
function lastFoundLink() {
  const last = recall('last-found');
  const row = last?.key && last.username && names.rows.find((r) => r[0] === last.key);
  if (!row) return null;
  const { key, name } = unpackRow(names, row);
  const a = el('a', 'last-found'); a.id = 'last-found';
  a.href = `../${cardPath(key)}${name && last.secret ? `#k=${last.secret}` : ''}`;
  const pic = el('span', 'pic');
  const img = el('img'); img.alt = ''; img.width = 256; img.height = 170; showThumb(img, key);
  img.addEventListener('error', () => img.replaceWith(el('span', 'ph')), { once: true });
  pic.append(img);
  const words = el('span', 'last-found-words');
  words.append(el('span', 'last-found-label', 'Last found'), el('span', 'last-found-name', nameLabel(last.username)));
  a.append(pic, words);
  return a;
}

const KEEP_WORDS = 'Keep this link, for example in your notes. Open it in any browser to bring your finds back.';

// Shares the link, or copies it, or shows it selected to copy by hand (some in-app browsers allow neither).
async function saveFinds(box, status) {
  const link = `${location.origin}${location.pathname}${findsHash(savedFinds({ remember, recall }))}`;
  if (typeof navigator.share === 'function') {
    try { await navigator.share({ title: 'My finds in The Ocean of Us', url: link }); status.textContent = KEEP_WORDS; return; }
    catch (e) { if (e?.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(link); status.textContent = `Link copied. ${KEEP_WORDS}`; return; } catch { /* shown below instead */ }
  let input = box.querySelector('input');
  if (!input) { input = el('input', 'share-link'); input.readOnly = true; input.setAttribute('aria-label', 'Your finds link'); status.before(input); }
  input.value = link;
  input.focus(); input.select();
  status.textContent = `Copy this link. ${KEEP_WORDS}`;
}

// The Save my finds button, for anyone with a find, and what a finds link just brought back.
function keepFinds(after) {
  const has = savedFinds({ remember, recall }).spotted.length > 0;
  if (!has && restored === null) return;
  const box = el('div', 'keep-finds'); box.id = 'keep-finds';
  const status = el('p', 'share-status'); status.setAttribute('role', 'status');
  if (restored !== null) status.textContent = restored ? `Your finds are back: ${restored} added from your link.` : 'Everything in that link was already saved here.';
  if (has) {
    const b = el('button', 'button ghost', 'Save my finds'); b.type = 'button'; b.id = 'save-finds';
    b.addEventListener('click', () => saveFinds(box, status));
    box.append(b);
  }
  box.append(status);
  after.after(box);
}

function start() {
  spotted = createSpotted({ names, memory: { remember, recall } });
  const count = el('p', 'population', `${names.rows.length.toLocaleString('en')} creatures · ${names.species.length} kinds of animal`); count.id = 'population';
  document.querySelector('h1').after(count);
  const line = el('p', 'spotted-line', `You've spotted ${spotted.count()} of ${spotted.total()}`); line.id = 'spotted';
  zonesEl.before(line);
  keepFinds(line);
  if (spotted.count() === 0) { const how = el('p', 'hint spotted-how', 'Tap creatures in the ocean to add them here.'); how.id = 'spotted-how'; zonesEl.before(how); }
  const mine = lastFoundLink();
  if (mine) line.before(mine);
  zonesEl.replaceChildren(...names.zones.map((z) => {
    const b = el('button', 'zone', z.label); b.type = 'button'; b.dataset.zone = z.id;
    b.addEventListener('click', () => {
      remember('everyone-zone', z.id);
      search.value = '';
      history.replaceState(null, '', `?zone=${encodeURIComponent(z.id)}`);
      sync();
    });
    return b;
  }));
  sync();
}

content.addEventListener('click', (ev) => {
  const a = ev.target.closest('a.see-all');
  if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
  ev.preventDefault();
  history.pushState({ grid: true }, '', a.getAttribute('href'));
  window.scrollTo(0, 0);
  sync();
});
search.addEventListener('input', () => {
  if (!names) return;
  if (animalId) { animalId = null; history.replaceState(null, '', `?zone=${encodeURIComponent(zoneId)}`); }
  render();
});
window.addEventListener('popstate', () => { if (names) sync(); });

// The Find box works by itself, before names.json has loaded and even if it can't.
findHere({ input: document.getElementById('name'), button: document.getElementById('find-btn'), msg: document.getElementById('find-msg') });

async function boot() {
  try { names = await loadNames(); } catch { showRetry(content, boot); return; }
  start();
}
boot();
