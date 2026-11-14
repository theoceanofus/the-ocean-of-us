// Representative design lengths, not claims about the size of a particular animal.
// 27 m blue whale / 18 m reconstructed megalodon / 3 m bottlenose dolphin.
// Native drawings have different coordinate spans; normalise them before comparison.
// Sources and uncertainty are recorded in DESIGN-NOTES.md.
import { COMMUNITY_SPECIES } from '../core/community-species.js';
export const LENGTHS = {
  leviathan: { metres: 32, nativeLength: 407, radius: 240, fictional: true },
  blue_whale: { metres: 27, nativeLength: 334, radius: 185 },
  megalodon: { metres: 18, nativeLength: 240, radius: 145 },
  dolphin: { metres: 3, nativeLength: 156, radius: 100 },
  reef_fish: { metres:.25,nativeLength:110,radius:80 },
  turtle: { metres:1.2,nativeLength:145,radius:100 },
  stingray: { metres:1.5,nativeLength:160,radius:115 },
  jellyfish: { metres:.4,nativeLength:150,radius:110 },
  starfish: { metres:.3,nativeLength:88,radius:60 },
  ...Object.fromEntries(Object.entries(COMMUNITY_SPECIES).map(([id,s])=>[id,{metres:s.metres,nativeLength:s.nativeLength,radius:s.radius,fictional:s.fictional}])),
};
export const ART_UNITS_PER_METRE = 40 / 3;
export function artworkScale(species) {
  const m = LENGTHS[species];
  return m ? m.metres * ART_UNITS_PER_METRE / m.nativeLength : 1;
}
export function artworkRadius(species) {
  return (LENGTHS[species]?.radius || 100) * artworkScale(species);
}
export function artworkLength(species) {
  return LENGTHS[species] ? LENGTHS[species].metres * ART_UNITS_PER_METRE : null;
}
