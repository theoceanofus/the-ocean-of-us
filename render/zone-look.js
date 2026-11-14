// How each habitat zone looks (spec 2026-11-08-ocean-environment): its water, sea floor, light and haze.
// Looks blend across the last fifth of a zone either side of a border, so a glide between zones never jumps.
import { ZONES, ZONE_WIDTH, zoneCentreX } from '../core/zones.js';

const NO_HALO = [0, 0, 0, 0];
const water = (floorColor, haze, deep, bright) => ({ floorColor, haze, deep, bright });
export const ZONE_LOOKS = {
  shore: { water: water([.98, .91, .72], [.16, .60, .66], [.10, .46, .60], [.48, .90, .90]), ray: 1.15, caustic: 1.3, fog: .15, light: 1.15, floorOn: 1, rough: 0, waterline: 1, halo: NO_HALO },
  reef: { water: water([.94, .88, .72], [.07, .44, .53], [.03, .30, .47], [.30, .80, .83]), ray: 1, caustic: 1, fog: .9, light: 1.1, floorOn: 1, rough: .35, waterline: 0, halo: NO_HALO },
  kelp: { water: water([.46, .46, .34], [.10, .34, .28], [.06, .27, .26], [.52, .78, .44]), ray: 1.25, caustic: .55, fog: 1.1, light: 1.05, floorOn: 1, rough: .8, waterline: 0, halo: NO_HALO },
  open: { water: water([.5, .6, .7], [.05, .32, .55], [.018, .205, .45], [.30, .74, .92]), ray: 1.5, caustic: 0, fog: 1, light: 1.08, floorOn: 0, rough: 0, waterline: 0, halo: NO_HALO },
  deep: { water: water([.19, .20, .26], [.012, .055, .105], [.008, .035, .09], [.05, .17, .30]), ray: .32, caustic: 0, fog: 1.4, light: .6, floorOn: 1, rough: .25, waterline: 0, halo: [.35, .67, 1, .2] },
  abyss: { water: water([.22, .18, .28], [.035, .025, .085], [.012, .008, .045], [.10, .07, .24]), ray: .4, caustic: 0, fog: 1.4, light: .85, floorOn: 1, rough: .4, waterline: 0, halo: [.67, .47, 1, .16] },
};

const num = (a, b, u) => a + (b - a) * u;
const arr = (a, b, u) => a.map((v, i) => num(v, b[i], u));
function mix(a, b, u) {
  const out = { water: Object.fromEntries(Object.keys(a.water).map((k) => [k, arr(a.water[k], b.water[k], u)])), halo: arr(a.halo, b.halo, u) };
  for (const k of ['ray', 'caustic', 'fog', 'light', 'floorOn', 'rough', 'waterline']) out[k] = num(a[k], b[k], u);
  return out;
}

export function zoneLookAt(x) {
  const pos = x / ZONE_WIDTH + (ZONES.length - 1) / 2;           // 0 at the first zone's centre, 1 at the next...
  const i = Math.max(0, Math.min(ZONES.length - 1, Math.round(pos)));
  const here = ZONE_LOOKS[ZONES[i].id];
  const off = pos - i;                                             // -0.5..0.5 inside zone i
  const BLEND = 0.2;
  if (Math.abs(off) <= 0.5 - BLEND) return here;
  const j = i + Math.sign(off);
  if (j < 0 || j >= ZONES.length) return here;
  const u = (Math.abs(off) - (0.5 - BLEND)) / (2 * BLEND);          // 0 → halfway to the border's far side
  return mix(here, ZONE_LOOKS[ZONES[j].id], u);
}
export const zoneCentre = zoneCentreX;
