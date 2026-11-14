// The site's step counter (buying-and-participation report, 2026-11-13, F4 and S5): how many times a few shop and sharing steps happen
// each day, so we can see where buyers stop. Since the brand report's B8 (2026-11-14) it also counts, per zone of the ocean, visits that
// spent a moment there and visits that tapped a creature there, for the zone sponsors' monthly report (tools/zone-report.mjs).
// It runs on Cloudflare Pages as a Function at /api/steps (the build copies this file to functions/api/steps.js and writes _routes.json,
// so no other address ever runs code).
//
// Many visitors are children, so it counts days and steps, never people:
// - It reads nothing about who sent a count: no cookie, no IP address, no device string, no user id, no time finer than the UTC day.
//   The only request header it looks at is Origin, to turn away counts sent from other websites.
// - It keeps one row per UTC day, step, "came from an ask link" yes/no, "inside Instagram's or Facebook's browser" yes/no and shop
//   layout, holding a total. Rows older than KEEP_DAYS are deleted.
// - What it gives back (GET) is finished days only, added up as asked, with every total under HIDE_UNDER shown as null.
//
// Storage is a Cloudflare D1 database the owner binds to the Pages project as STEPS (Settings > Bindings). Until then it counts nothing.
// Plain JavaScript with no imports, so Cloudflare's build can't fail on it.

export const SHOP_STEPS = Object.freeze(['shop-open', 'item-picked', 'try-on', 'pay', 'ask', 'copy-link', 'send', 'keepsake', 'print']);
// The ocean's six zones, as in app/core/zones.js (a test keeps them equal; no imports here). For each, "zone-<id>": a visit spent a moment
// in that zone, and "tap-<id>": a visit tapped a creature living there. Each at most once per page view, like every step.
export const ZONE_IDS = Object.freeze(['shore', 'reef', 'kelp', 'open', 'deep', 'abyss']);
export const ZONE_STEPS = Object.freeze(ZONE_IDS.flatMap((z) => [`zone-${z}`, `tap-${z}`]));
export const STEPS = Object.freeze([...SHOP_STEPS, ...ZONE_STEPS]);
// The shop's layouts (test T2 alternates them by whole weeks). A fixed list, so junk can't make new rows.
export const LAYOUTS = Object.freeze(['packs-first', 'items-first', 'no-packs']);
export const DIMS = Object.freeze(['day', 'ask', 'app', 'layout']);
export const HIDE_UNDER = 5;
export const KEEP_DAYS = 400; // about 13 months
export const MAX_RANGE_DAYS = 120;
const MAX_BODY = 200;
const CELL_CAP = 1000000; // a flood can't push one total past this
const DAY_MS = 86400000;

const SCHEMA = 'CREATE TABLE IF NOT EXISTS steps (day TEXT NOT NULL, step TEXT NOT NULL, ask INTEGER NOT NULL, app INTEGER NOT NULL, layout TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (day, step, ask, app, layout)) WITHOUT ROWID';
const ADD = `INSERT INTO steps (day, step, ask, app, layout, n) VALUES (?1, ?2, ?3, ?4, ?5, 1) ON CONFLICT (day, step, ask, app, layout) DO UPDATE SET n = n + 1 WHERE n < ${CELL_CAP}`;
const FORGET = 'DELETE FROM steps WHERE day < ?1';

export const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10);
const validDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && utcDay(Date.parse(`${s}T00:00:00Z`)) === s;
const dayMs = (s) => Date.parse(`${s}T00:00:00Z`);

// One count, from the request body "s=<step>&ask=0|1&app=0|1&layout=<layout>". Anything else in it is ignored; a step we don't count is null.
export function parseStep(body) {
  const p = new URLSearchParams(String(body ?? '').slice(0, MAX_BODY));
  const step = p.get('s');
  if (!STEPS.includes(step)) return null;
  const layout = p.get('layout');
  return { step, ask: p.get('ask') === '1' ? 1 : 0, app: p.get('app') === '1' ? 1 : 0, layout: LAYOUTS.includes(layout) ? layout : '-' };
}

// Which finished days a GET covers: up to yesterday (UTC), at most MAX_RANGE_DAYS, never before rows are deleted. Defaults to the last 14.
export function rangeOf(params, now = Date.now()) {
  const yesterday = utcDay(now - DAY_MS), oldest = utcDay(now - KEEP_DAYS * DAY_MS);
  let to = validDay(params.get('to')) ? params.get('to') : yesterday;
  if (to > yesterday) to = yesterday;
  let from = validDay(params.get('from')) ? params.get('from') : utcDay(dayMs(to) - 13 * DAY_MS);
  if (from < oldest) from = oldest;
  if (dayMs(to) - dayMs(from) > (MAX_RANGE_DAYS - 1) * DAY_MS) from = utcDay(dayMs(to) - (MAX_RANGE_DAYS - 1) * DAY_MS);
  if (from > to) from = to;
  return { from, to };
}

// How to add up: any of DIMS, in a fixed order; the step is always kept apart.
export function groupingOf(params) {
  const asked = String(params.get('by') ?? 'day').split(',');
  return DIMS.filter((d) => asked.includes(d));
}

// Totals under HIDE_UNDER become null ("under 5"), so a small number never leaves Cloudflare.
export const hideSmall = (rows) => rows.map((r) => ({ ...r, n: Number(r.n) < HIDE_UNDER ? null : Number(r.n) }));

const HEADERS = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex' };
const empty = (status) => new Response(null, { status, headers: HEADERS });
const json = (data) => new Response(JSON.stringify(data), { status: 200, headers: { ...HEADERS, 'Content-Type': 'application/json; charset=utf-8' } });

// The table is made on first use in each copy of the Function. A failure is tried again next time.
const made = new WeakMap();
function ready(db) {
  if (!made.has(db)) made.set(db, db.prepare(SCHEMA).run().catch((e) => { made.delete(db); throw e; }));
  return made.get(db);
}

export async function onRequestPost({ request, env, waitUntil }) {
  // A page on another website can't add counts through its visitors' browsers.
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return empty(403);
  if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY) return empty(413);
  const body = await request.text();
  if (body.length > MAX_BODY) return empty(413);
  const hit = parseStep(body);
  if (!hit) return empty(400);
  const db = env?.STEPS;
  if (!db) return empty(204); // not switched on yet
  try {
    await ready(db);
    const now = Date.now();
    await db.prepare(ADD).bind(utcDay(now), hit.step, hit.ask, hit.app, hit.layout).run();
    // Now and then, old days go, even if nobody reads the totals.
    if (Math.random() < 0.002) {
      const forget = db.prepare(FORGET).bind(utcDay(now - KEEP_DAYS * DAY_MS)).run().catch(() => {});
      if (typeof waitUntil === 'function') waitUntil(forget);
    }
    return empty(204);
  } catch {
    return empty(503);
  }
}

// GET /api/steps?from=YYYY-MM-DD&to=YYYY-MM-DD&by=day,ask,app,layout -> { on, from, to, by, hiddenUnder, rows: [{ step, ...by, n }] }
export async function onRequestGet({ request, env }) {
  const params = new URL(request.url).searchParams;
  const now = Date.now();
  const { from, to } = rangeOf(params, now);
  const by = groupingOf(params);
  const db = env?.STEPS;
  if (!db) return json({ on: false, from, to, by, hiddenUnder: HIDE_UNDER, rows: [] });
  try {
    await ready(db);
    await db.prepare(FORGET).bind(utcDay(now - KEEP_DAYS * DAY_MS)).run();
    const cols = ['step', ...by].join(', '); // names from DIMS only, never from the request
    const { results } = await db.prepare(`SELECT ${cols}, SUM(n) AS n FROM steps WHERE day >= ?1 AND day <= ?2 GROUP BY ${cols} ORDER BY ${cols}`).bind(from, to).all();
    return json({ on: true, from, to, by, hiddenUnder: HIDE_UNDER, rows: hideSmall(results ?? []) });
  } catch {
    return empty(503);
  }
}
