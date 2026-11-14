import { nameLabel } from './name-label.js';

// The ocean draws one zone at a time, from area files of up to 1,000 residents. This holds the area being looked at and the one on each side.
// The renderer caches per array, so residents() returns the same array until the set of loaded areas changes.

// A row from an area file, in the shape the renderer draws: its id is the key, and shownName is its label, given as it is.
const toResident = (row) => ({ ...row, id: row.key, username: row.name, shownName: nameLabel(row.name), extras: row.extras && Object.keys(row.extras).length ? row.extras : null });

// fetchJson(url) resolves to the parsed file, or null if there is no such file. It rejects if the file could not be fetched.
// counts: { zone: how many area files it has }, or null if not known. A file past that is never asked for.
export function createAreaLoader({ fetchJson, builtAt, counts = null }) {
  let zone = null, shown = 0, nextFailed = false, prevFailed = false;
  let held = new Map();        // n -> { residents, additions } of that area, for the zone being shown
  let list = [];               // what residents() returns
  let built = [];              // what additions() returns: the pieces built into this zone's neighbourhoods
  let byKey = new Map();
  let latest = 0;              // the last show() asked for wins
  const onTheWay = new Map();  // `${zone}-${n}` -> promise: a file already being fetched isn't fetched twice

  const addressOf = (z, n) => `areas/${z}-${n}.json?v=${encodeURIComponent(builtAt)}`;

  function area(z, n) {
    if (z === zone && held.has(n)) return Promise.resolve(held.get(n));
    const id = `${z}-${n}`;
    if (!onTheWay.has(id)) {
      onTheWay.set(id, fetchJson(addressOf(z, n))
        .then((file) => (file ? { residents: file.residents.map(toResident), additions: file.additions ?? [] } : null))
        .finally(() => onTheWay.delete(id)));
    }
    return onTheWay.get(id);
  }

  // Loads area n of a zone and its neighbours, and drops everything else. Rejects only if area n itself can't be fetched.
  async function show(z, n) {
    const mine = ++latest;
    const wanted = [n - 1, n, n + 1].filter((i) => i >= 0 && (i === n || !counts || i < (counts[z] ?? 0)));
    let failed = new Set();
    const areas = await Promise.all(wanted.map((i) => area(z, i).catch((e) => {
      if (i === n) throw e;
      failed.add(i);
      return null;
    })));
    if (mine !== latest) return list;
    const next = new Map();
    wanted.forEach((i, at) => { if (areas[at]) next.set(i, areas[at]); });
    const changed = z !== zone || [...next.keys()].join() !== [...held.keys()].join();
    zone = z; shown = n; held = next;
    nextFailed = failed.has(n + 1); prevFailed = failed.has(n - 1);
    if (changed) {
      list = [...next.values()].flatMap((a) => a.residents);
      byKey = new Map(list.map((r) => [r.key, r]));
      const seen = new Set();
      built = [...next.values()].flatMap((a) => a.additions).filter((a) => !seen.has(a.id) && seen.add(a.id));
    }
    return list;
  }

  return {
    show,
    residents: () => list,
    additions: () => built,
    find: (key) => byKey.get(key) ?? null,
    // Where the loader is: which area is shown, and whether a next or previous area is held (or failed to load).
    position: () => ({ zone, n: shown, hasNext: held.has(shown + 1), hasPrev: held.has(shown - 1), nextFailed, prevFailed }),
  };
}
