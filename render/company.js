// Company (owner, 2026-11-10: "potentially make them interact with other creatures like chesing stuff etc").
// Now and then neighbours do something together for a little while, then go back to roaming:
//   school  small fish of a kind swim as one, each a moment behind the one in front;
//   pair    two of the same species swim together, one a little above the other;
//   chase   a hunter idly follows small fish, which dash off and scatter, then slow and regroup. It never catches them:
//           nothing is ever eaten or hurt, because children watch;
//   circle  two curious animals swim round each other.
// Who may do what with whom is worked out once from the residents loaded, among neighbours only. When it happens is a pure
// function of time (render/motion.js), so any frame can still be drawn on its own and Reels never change by being re-rendered.
import { hoodOf } from '../core/hoods.js';
import { styleName, familyOf, metresOf } from './roam.js';
import { hash32, rng } from './util.js';

export const CELL = 300;   // world units: residents whose homes share a stretch this long are neighbours who may meet
export const SLOT = 36;    // seconds: each stretch plans its meetings a slot at a time, and every meeting ends inside its slot
// How likely each kind is in a slot, and how long it lasts in seconds (easing in and out included).
export const KINDS = {
  school: { p: 0.6, d: [14, 22] },
  pair: { p: 0.45, d: [12, 20] },
  chase: { p: 0.4, d: [10, 14] },
  circle: { p: 0.35, d: [12, 18] },
};
// Animals that hunt in real life and so may idly chase smaller fish.
const HUNTERS = new Set(['shark', 'hammerhead', 'requiem', 'mako', 'goblin', 'skeleton', 'helicoprion', 'isonade', 'lantern', 'megalodon', 'leviathan',
  'dolphin', 'cetacean', 'pilot', 'seal', 'pinniped', 'harp', 'otter', 'penguin', 'billfish', 'mosasaur', 'crocodile', 'ichthyosaur', 'plesio',
  'pliosaur', 'placoderm', 'electric', 'perch', 'dragonfish', 'cephalopod', 'humboldt', 'colossal', 'kraken', 'selkie', 'livyatan']);
const CURIOUS = new Set(['cruise', 'playful', 'glide', 'jet', 'paddle']); // giants turn too slowly to circle
const SCHOOL_MAX = 5;

const lengthOf = (r) => metresOf(r.species) * (r.size || 1);
const byHome = (a, b) => a.home.x - b.home.x || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

// Everything that could happen in one stretch, from its residents in order along it.
function groupsOf(list) {
  const groups = [], swim = list.filter((e) => !e.floor), dart = swim.filter((e) => e.style === 'dart');
  const bunch = (entries, key) => { const out = new Map(); for (const e of entries) { const k = key(e); if (!out.has(k)) out.set(k, []); out.get(k).push(e.r); } return [...out.values()]; };
  // Schools: small fish of one family, up to five at a time.
  const schools = [];
  for (const fish of bunch(dart, (e) => familyOf(e.r.species))) for (let i = 0; i + 1 < fish.length; i += SCHOOL_MAX) {
    const members = fish.slice(i, i + SCHOOL_MAX);
    if (members.length > 1) { schools.push(members); groups.push({ kind: 'school', members }); }
  }
  // Pairs: two of the same species swimming together. Animals walking on the floor keep to themselves: in a row on the sand a
  // pair could only walk one behind the other, and the one behind would be hidden.
  for (const same of bunch(swim.filter((e) => e.style !== 'drift'), (e) => e.r.species)) {
    for (let i = 0; i + 1 < same.length; i += 2) groups.push({ kind: 'pair', members: [same[i], same[i + 1]] });
  }
  // Chases: a hunter and a school (or one small fish) clearly smaller than it.
  for (const h of swim) {
    if (!HUNTERS.has(familyOf(h.r.species)) || h.style === 'drift') continue;
    let n = 0;
    for (const prey of [...schools, ...dart.map((e) => [e.r])]) {
      if (n >= 2) break;
      if (prey.includes(h.r) || prey.some((p) => lengthOf(p) > lengthOf(h.r) * 0.7)) continue;
      groups.push({ kind: 'chase', members: [h.r, ...prey.slice(0, 4)] });
      n++;
    }
  }
  // Circles: two curious neighbours, one after another along the stretch.
  const curious = swim.filter((e) => CURIOUS.has(e.style));
  for (let i = 0; i + 1 < curious.length; i += 2) groups.push({ kind: 'circle', members: [curious[i].r, curious[i + 1].r] });
  return groups;
}

// The neighbours of each stretch and what they could do together. Residents fixed in place, crawlers and drifters keep to themselves.
export function buildCompany(residents) {
  const cells = new Map();
  for (const r of residents) {
    if (!r?.zone || !r.home) continue;
    const hood = hoodOf(r);
    if (!hood) continue;
    const floor = r.home.y <= 6, style = styleName(r.species, floor);
    if (!style || style === 'crawl') continue;
    const key = `${hood.id}:${Math.floor(r.home.x / CELL)}`;
    if (!cells.has(key)) cells.set(key, { key, list: [] });
    cells.get(key).list.push({ r, style, floor });
  }
  const cellOf = new Map();
  for (const cell of cells.values()) {
    cell.list.sort((a, b) => byHome(a.r, b.r));
    cell.ids = cell.list.map((e) => e.r.id).join(',');
    cell.groups = groupsOf(cell.list);
    cell.seed = hash32(cell.key);
    cell.phase = ((cell.seed % 9973) / 9973) * SLOT;
    delete cell.list;
    for (const g of cell.groups) for (const m of g.members) cellOf.set(m.id, cell);
  }
  return { cellOf, cells };
}

// The meetings in one stretch during slot k: [{ g, t0, D, ramp }]. near(g, t0) says whether the group is close enough to meet at t0;
// a group that isn't gets two more tries later in the slot. Nobody is in two meetings at once, and every meeting ends in its slot.
export function planSlot(cell, k, near) {
  const R = rng((cell.seed ^ Math.imul(k | 0, 0x9e3779b1)) >>> 0), start = k * SLOT + cell.phase, busy = new Set(), out = [];
  const order = cell.groups.map((g) => [R(), g]).sort((a, b) => a[0] - b[0]).map(([, g]) => g);
  for (const g of order) {
    const rule = KINDS[g.kind], go = R(), D = rule.d[0] + R() * (rule.d[1] - rule.d[0]), tries = [R(), R(), R()];
    if (go > rule.p || g.members.some((m) => busy.has(m.id))) continue;
    for (const u of tries) {
      const t0 = start + 0.5 + u * (SLOT - D - 1);
      if (!near(g, t0)) continue;
      out.push({ g, t0, D, ramp: Math.min(4.5, Math.max(2.5, D * 0.22)) });
      for (const m of g.members) busy.add(m.id);
      break;
    }
  }
  return out;
}
export const slotOf = (cell, t) => Math.floor((t - cell.phase) / SLOT);
export { byHome };
