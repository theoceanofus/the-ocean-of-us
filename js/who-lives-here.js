// "Who lives here": the pull-up list of a zone's residents, grouped by neighbourhood.
// Windowed: only the rows on screen are in the page, so a zone of thousands stays light.
import { neighbourhoodOf, showThumb } from '../core/site-names.js';
import { HOOD_BY_ID, hoodsOf } from '../core/hoods.js';
import { ZONES } from '../core/zones.js';
import { nameLabel, isLongLabel } from './name-label.js';

const HEAD_H = 40, ROW_H = 64, OVERSCAN = 160;

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

// Groups in the order of the zone's neighbourhoods; anyone whose neighbourhood isn't known goes last. Empty neighbourhoods are left out.
export function groupByHood(residents, zoneId, fallbackLabel = '') {
  const byHood = new Map();
  for (const r of residents) {
    const id = neighbourhoodOf(r);
    (byHood.get(id) || byHood.set(id, []).get(id)).push(r);
  }
  const groups = [];
  for (const h of hoodsOf(zoneId)) {
    const list = byHood.get(h.id);
    if (list) { groups.push({ id: h.id, label: h.label, residents: list }); byHood.delete(h.id); }
  }
  for (const [id, list] of byHood) groups.push({ id, label: HOOD_BY_ID[id]?.label ?? fallbackLabel, residents: list });
  return groups;
}

// The flat list the window slides over: a heading, then its rows. top is where each item starts.
export function layoutItems(groups) {
  const items = [];
  let top = 0;
  for (const g of groups) {
    items.push({ head: g, top, h: HEAD_H }); top += HEAD_H;
    for (const res of g.residents) { items.push({ res, top, h: ROW_H }); top += ROW_H; }
  }
  return { items, height: top };
}

// First item whose bottom is below y.
function firstAt(items, y) {
  let lo = 0, hi = items.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (items[mid].top + items[mid].h <= y) lo = mid + 1; else hi = mid; }
  return lo;
}

function rowOf(item, onSwim) {
  if (item.head) {
    const h = el('div', 'who-head', item.head.label);
    h.append(el('span', 'who-count', String(item.head.residents.length)));
    h.style.top = `${item.top}px`; h.style.height = `${item.h}px`;
    return h;
  }
  const { res } = item;
  const row = el('div', 'who-row');
  row.style.top = `${item.top}px`; row.style.height = `${item.h}px`;
  const pic = el('span', 'pic');
  const img = el('img'); img.alt = ''; img.width = 64; img.height = 42; img.loading = 'lazy';
  img.addEventListener('error', () => img.replaceWith(el('span', 'ph')), { once: true });
  showThumb(img, res.key);
  pic.append(img);
  const words = el('span', 'who-words');
  const label = nameLabel(res.name);
  words.append(el('span', isLongLabel(label) ? 'who-name long' : 'who-name', label), el('span', 'who-species', res.speciesLabel ?? res.species));
  const go = el('button', 'who-swim', 'Swim to'); go.type = 'button'; go.setAttribute('aria-label', `Swim to ${label}`);
  go.addEventListener('click', () => onSwim(res));
  row.append(pic, words, go);
  return row;
}

// Zone goals (core/zone-goals.js), from names.json: this zone's progress on one line, and every zone's when it is opened. Zones and numbers
// only, never a person. Built once when the list opens, and nothing in it moves, so it costs the ocean nothing while it swims.
export function goalsBlock(goals, zone) {
  if (!goals?.zones?.length) return null;
  const num = (x) => Number(x).toLocaleString('en-US');
  const label = (id) => ZONES.find((z) => z.id === id)?.label ?? id;
  const lead = new Set(goals.leaders || []);
  const box = el('details', 'who-goals');
  const here = goals.zones.find(([id]) => id === zone);
  box.append(el('summary', 'goal-sum', here
    ? `${goals.month} goal${here[1] >= here[2] ? ' reached' : ''}: ${num(here[1])} of ${num(here[2])} newcomers`
    : `Zone goals for ${goals.month}`));
  const list = el('ol', 'goal-list');
  for (const [id, joined, goal] of goals.zones) {
    const row = el('li', `goal-row${id === zone ? ' here' : ''}`);
    const top = el('span', 'goal-top');
    const name = el('span', 'goal-zone', label(id));
    if (lead.has(id)) name.append(el('span', 'goal-lead', ' \u00b7 furthest so far'));
    top.append(name, el('span', 'goal-num', `${num(joined)} of ${num(goal)}`));
    const bar = el('span', 'goal-bar'), fill = el('span', 'goal-fill');
    fill.style.width = `${goal > 0 ? Math.min(100, Math.round((joined / goal) * 100)) : 0}%`;
    bar.append(fill);
    row.append(top, bar);
    if (goals.picks?.[id]) row.append(el('span', 'goal-extra', `If it gets furthest: ${goals.picks[id]}`));
    list.append(row);
  }
  box.append(list, el('p', 'goal-note', `Every zone aims to welcome one new resident for every four it had on 1 ${goals.month}, so a small zone has as good a chance as a big one. The zone that gets furthest picks ${goals.next}'s free look for the whole ocean.`));
  if (goals.last?.zones?.length) {
    const who = goals.last.zones.map(label).join(' and ');
    box.append(el('p', 'goal-note', goals.last.gets ? `${who} got furthest in ${goals.last.month}, so ${goals.month}'s free look is ${goals.last.gets}.` : `${who} got furthest in ${goals.last.month}.`));
  }
  return box;
}

let onKey = null;
export function closeWho() {
  const sheet = document.getElementById('who');
  if (!sheet) return;
  sheet.classList.remove('up'); sheet.hidden = true; sheet.replaceChildren();
  if (onKey) { removeEventListener('keydown', onKey); onKey = null; }
}

// zone is the zone's id, for the link to Everyone.
// loading: the zone's residents haven't arrived yet, so there is no count to give and no "nobody" to say.
// goals: names.json's zoneGoals, if there are any this month.
export function openWho({ residents, zoneLabel, zoneTotal, onSwim, zone, loading = false, goals = null }) {
  const sheet = document.getElementById('who');
  const close = el('button', 'who-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close'); close.addEventListener('click', closeWho);
  const total = zoneTotal ?? residents.length;
  const top = el('div', 'who-top');
  top.append(el('h2', 'who-title', 'Who lives here'));
  if (loading) {
    const wait = el('p', 'who-sub who-loading', `Loading ${zoneLabel}\u2026`); wait.setAttribute('role', 'status');
    top.append(wait);
  } else {
    const sub = el('p', 'who-sub', `${total.toLocaleString('en-US')} ${total === 1 ? 'lives' : 'live'} in ${zoneLabel}. `);
    const all = el('a', 'see-all', 'See everyone'); all.href = `everyone/?zone=${encodeURIComponent(zone ?? '')}`;
    sub.append(all);
    top.append(sub);
    // Only part of a big zone is loaded at a time; say so, so the count above and the list below agree.
    if (total > residents.length && residents.length) top.append(el('p', 'who-sub who-nearest', `Showing the ${residents.length.toLocaleString('en-US')} nearest`));
  }
  const goalsBox = goalsBlock(goals, zone);
  if (goalsBox) top.append(goalsBox);

  const groups = groupByHood(residents, zone, zoneLabel);
  const { items, height } = layoutItems(groups);
  const list = el('div', 'who-list'); list.setAttribute('role', 'list');
  if (!items.length && !loading) {
    list.append(el('p', 'who-empty', 'Nobody lives here yet.'));
  }
  const inner = el('div', 'who-inner'); inner.style.height = `${height}px`;
  if (items.length) list.append(inner);

  let from = -1, to = -1;
  const paint = () => {
    const a = firstAt(items, Math.max(0, list.scrollTop - OVERSCAN));
    const b = firstAt(items, list.scrollTop + list.clientHeight + OVERSCAN);
    const end = Math.min(items.length, b + 1);
    if (a === from && end === to) return;
    from = a; to = end;
    inner.replaceChildren(...items.slice(a, end).map((i) => rowOf(i, onSwim)));
  };
  list.addEventListener('scroll', paint, { passive: true });

  sheet.replaceChildren(close, top, list);
  sheet.hidden = false;
  paint();
  requestAnimationFrame(() => { sheet.classList.add('up'); paint(); }); // the height is known once it is on screen
  close.focus({ preventScroll: true });
  if (onKey) removeEventListener('keydown', onKey);
  onKey = (e) => { if (e.key === 'Escape') closeWho(); };
  addEventListener('keydown', onKey);
}
