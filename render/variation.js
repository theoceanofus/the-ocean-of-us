// Each resident's natural markings (owner, 2026-11-11: "if the real animal has different markings and stuff yes add
// markings"). Real animals of these species are told apart by their own markings: a whale shark by its spot pattern, a
// great white by the ragged line where its grey back meets its white belly and the nicks in its dorsal fin, an orca by its
// saddle patch and eye patch, a bottlenose dolphin by the nicks in its dorsal fin, a harbour seal by its spots, an ocean
// sunfish by its blotchy mottling. Each resident gets one of VARIANTS such looks from its seed; 0 is the look these species
// always had. Cards, Reels and the site's shared pictures all draw the same variant, so a creature looks the same everywhere.
// Nothing here invents markings the species doesn't have, and species, colours and size never change.
import { hash32 } from './util.js';

export const VARIANTS = 6;
export const NATURAL = new Set(['whale_shark', 'great_white_shark', 'orca', 'dolphin', 'harbour_seal', 'ocean_sunfish']);
export function variantOf(res) {
  if (!res || !NATURAL.has(res.species)) return 0;
  if (Number.isInteger(res.variant)) return Math.min(VARIANTS - 1, Math.max(0, res.variant));
  return hash32(`natural:${res.seed ?? 0}`) % VARIANTS;
}
// Points along a fin's trailing edge with the resident's nicks cut into it (none for variant 0). from/to are the edge's
// ends, ctrl its quadratic control point, inward the side the nicks bite towards (a unit vector).
export function nickedEdge(v, from, ctrl, to, inward, depth) {
  const at = (u) => [(1 - u) ** 2 * from[0] + 2 * (1 - u) * u * ctrl[0] + u * u * to[0], (1 - u) ** 2 * from[1] + 2 * (1 - u) * u * ctrl[1] + u * u * to[1]];
  const nicks = [[], [0.62], [0.38, 0.7], [0.82], [0.5], [0.3, 0.55, 0.78]][v] || [];
  const pts = [];
  for (let i = 1; i <= 40; i++) {
    const u = i / 40, p = at(u), near = nicks.find((n) => Math.abs(n - u) < 0.045);
    if (near !== undefined) { const k = 1 - Math.abs(near - u) / 0.045; pts.push([p[0] + inward[0] * depth * k, p[1] + inward[1] * depth * k]); } else pts.push(p);
  }
  return pts;
}
