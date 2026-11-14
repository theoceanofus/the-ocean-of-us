// Habitat zones (spec 2026-11-07, section 3). Six zones side by side along x, left to right. A species decides its zone.
import { COMMUNITY_SPECIES } from './community-species.js';

export const ZONES = [
  { id: 'shore', label: 'The Shore', order: 0 },
  { id: 'reef', label: 'The Reef', order: 1 },
  { id: 'kelp', label: 'The Kelp Forest', order: 2 },
  { id: 'open', label: 'Open Water', order: 3 },
  { id: 'deep', label: 'The Deep', order: 4 },
  { id: 'abyss', label: 'The Abyss of Legends', order: 5 },
];
export const ZONE_WIDTH = 1800000;  // world units. Each zone holds up to six 180,000-wide neighbourhoods inside its middle 60%, where its look is pure (core/hoods.js).
export const FOUNDER_LIMIT = 500; // the first 500 residents admitted are Founders

const BY_FAMILY = {
  shore: ['pikachu', 'cockatoo', 'phoenix', 'kiwi', 'frog', 'macropod', 'arthropleura', 'diver', 'snake', 'ungulate', 'burrower', 'gecko', 'mosquito', 'pterosaur', 'raptor', 'beast', 'avian', 'insect', 'ambulocetus', 'land', 'theropod', 'mammal', 'bird', 'land_turtle', 'pet_rock', 'sauropod', 'duck', 'chipmunk', 'crocodile', 'iguana', 'platypus'],
  reef: ['unicornfish', 'spongebob', 'patrick', 'shuckle', 'cowfish', 'lookdown', 'butterfly', 'goby', 'bobtail', 'urchin', 'ribbon', 'garden_eel', 'catfish', 'carpet', 'box_jelly', 'anomalocaris', 'whiskered', 'perch', 'scorpionfish', 'batfish', 'bobbit', 'pistol', 'sea_squirt', 'anemone', 'sponge', 'clownfish', 'trigger', 'puffer', 'seahorse', 'slug', 'blue_dragon', 'axolotl', 'stonefish', 'cory', 'crab', 'horseshoe', 'cucumber', 'fish', 'shrimp'],
  kelp: ['squatina', 'bichir', 'greninja', 'lamprey', 'whipray', 'dugong', 'harp', 'selkie', 'sacabambaspis', 'tully', 'seal', 'otter', 'eel', 'turtle', 'cephalopod', 'pinniped', 'sirenian', 'crustacean', 'mata_mata', 'snail', 'blue_ringed', 'leafy'],
  open: ['tulkun', 'blanket', 'pilot', 'eagle_ray', 'basking', 'requiem', 'bowhead', 'mako', 'seabird', 'shark', 'hammerhead', 'cetacean', 'billfish', 'manta', 'flying', 'mermaid', 'narwhal'],
  deep: ['phronima', 'ctenophore', 'monkfish', 'megamouth', 'ice_worm', 'nematode', 'pteropod', 'telescope', 'swallower', 'pyrosome', 'strawberry', 'phantom_jelly', 'lantern', 'barreleye', 'tripod', 'spider_crab', 'sleeper', 'vampire', 'gulper', 'bigfin', 'coelacanth', 'hagfish', 'dragonfish', 'flapjack', 'oarfish', 'isopod', 'sea_pig', 'siphonophore', 'loosejaw', 'dumbo', 'tardigrade', 'angler', 'goblin', 'frilled', 'blob', 'humboldt', 'colossal', 'tiny_jelly', 'man_o_war', 'nautilus', 'electric', 'sea_angel', 'bloop'],
  abyss: ['reefback', 'basilosaurus', 'umibozu', 'zekrom', 'sea_eater', 'rayquaza', 'bahamut', 'aspidochelone', 'kyogre', 'mahoraga', 'ceadeus', 'reaper', 'gargantuan', 'livyatan', 'timingila', 'hippocamp', 'naga', 'pliosaur', 'titanoboa', 'plesio', 'helicoprion', 'isonade', 'leedsichthys', 'charybdis', 'mosasaur', 'kaiju', 'hydra', 'maw', 'serpent', 'cthulhu', 'angel', 'ichthyosaur', 'placoderm', 'skeleton', 'water_spirit', 'fossil', 'hallucigenia', 'cat_mermaid', 'kraken'],
};
// Per-species choices that beat the family rule, and the nine original species, which have no family.
const BY_ID = {
  // Exact species (2026-11-15) that live somewhere other than their family's zone.
  whitetip_reef_shark: 'reef', torpedo_ray: 'kelp', ribbontail_ray: 'reef', wels_catfish: 'kelp', crystal_jelly: 'kelp', blue_blubber_jellyfish: 'reef',
  sea_nettle: 'kelp', blue_button: 'reef', coconut_octopus: 'reef', flamboyant_cuttlefish: 'reef', harlequin_shrimp: 'reef', decorator_crab: 'reef',
  tamatoa: 'abyss', amazon_river_dolphin: 'kelp', ganges_river_dolphin: 'kelp', hawksbill_turtle: 'reef', goonch_catfish: 'kelp', clown_knifefish: 'kelp', arapaima: 'kelp',
  pelagic_puffer: 'open', ornate_eagle_ray: 'reef',
  yellowfin_tuna: 'open',
  iridescent_shark: 'kelp', pyjama_shark: 'kelp', horned_shark: 'kelp', yeti_crab: 'deep', pom_pom_crab: 'reef',
  goliath_grouper: 'reef', king_mackerel: 'open', achilles_tang: 'reef', blue_green_chromis: 'reef', opah: 'open', sheepshead: 'kelp', humphead_wrasse: 'reef', remora: 'open', african_tigerfish: 'kelp', deepsea_lizardfish: 'deep', bluntnose_sixgill_shark: 'deep', sevengill_shark: 'kelp', red_handfish: 'reef',
  sarcosuchus: 'abyss', goliath_tigerfish: 'kelp', bruhathkayosaurus: 'abyss', kitefin_shark: 'deep', ichthyosaurus: 'open', american_alligator: 'kelp', diamond_trevally: 'open', grayling: 'kelp', spotted_seatrout: 'kelp', cubera_snapper: 'reef', zebra_shark: 'kelp', spiny_dogfish: 'kelp', sawshark: 'kelp', firefly_squid: 'deep', alligator_snapping_turtle: 'kelp', false_killer_whale: 'open', common_snook: 'kelp', wandering_albatross: 'open', white_whale: 'abyss', elasmosaurus: 'deep',
  coconut_crab: 'shore', mimic_octopus: 'reef', guppy: 'reef', zebrafish: 'reef', frogfish: 'reef', barracuda: 'reef', amphioxus: 'reef', mudskipper: 'shore', lanternfish: 'deep', ghost_shark: 'deep', cookiecutter_shark: 'deep', leopard_shark: 'kelp', phytoplankton: 'reef', karkinos: 'abyss', king_kong: 'shore', brown_smoothhound_shark: 'kelp', hawaiian_monk_seal: 'reef', stubby_squid: 'kelp', archelon: 'open',
  reef_fish: 'reef', starfish: 'reef', turtle: 'kelp', dolphin: 'open', stingray: 'open', blue_whale: 'open', jellyfish: 'deep',
  megalodon: 'abyss', leviathan: 'abyss', penguin: 'open', gannet: 'open', mahi_mahi: 'open', kelpie: 'kelp', wendigo: 'abyss', giant_squid: 'deep', bluefin_tuna: 'open', atlantic_salmon: 'open', ocean_sunfish: 'open',
};
const FAMILY_ZONE = Object.fromEntries(Object.entries(BY_FAMILY).flatMap(([zone, fams]) => fams.map((f) => [f, zone])));

export function zoneFor(speciesId) {
  if (BY_ID[speciesId]) return BY_ID[speciesId];
  const fam = COMMUNITY_SPECIES[speciesId]?.family;
  const zone = fam && FAMILY_ZONE[fam];
  if (!zone) throw new Error(`No zone for species "${speciesId}". Give it one in app/core/zones.js.`);
  return zone;
}
export const zoneById = (id) => ZONES.find((z) => z.id === id);
export const zoneCentreX = (zoneId) => (zoneById(zoneId).order - (ZONES.length - 1) / 2) * ZONE_WIDTH;
export const zoneAtX = (x) => ZONES[Math.max(0, Math.min(ZONES.length - 1, Math.round(x / ZONE_WIDTH + (ZONES.length - 1) / 2)))].id;
