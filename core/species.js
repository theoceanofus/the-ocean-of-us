// The catalogue of what the ocean can draw. Everything customisable is defined here,
// so the parser, the editor and the artwork can never disagree.
import { COMMUNITY_SPECIES } from './community-species.js';
export const SPECIES = {
  reef_fish: {
    label: 'Reef fish',
    behaviour: 'Swims in slow loops through the middle of the water',
    patterns: ['plain', 'stripes', 'spots', 'bands'],
    defaults: { primary: '#ff8a4c', secondary: '#fff1dc' },
  },
  jellyfish: {
    label: 'Jellyfish',
    behaviour: 'Drifts and pulses high in the water',
    patterns: ['plain', 'spots', 'rings'],
    defaults: { primary: '#f48fc0', secondary: '#ffe3f0' },
  },
  turtle: {
    label: 'Turtle',
    behaviour: 'Glides on long, unhurried arcs',
    patterns: ['plain', 'spots', 'rings'],
    defaults: { primary: '#5c8a4e', secondary: '#c9b98a' },
  },
  stingray: {
    label: 'Stingray',
    behaviour: 'Skims low over the sand with rippling wings',
    patterns: ['plain', 'spots', 'stripes'],
    defaults: { primary: '#6b5c4a', secondary: '#e6dccb' },
  },
  dolphin: {
    label: 'Dolphin',
    behaviour: 'Cruises on long, playful arcs through open water',
    patterns: ['plain', 'spots', 'stripes'],
    defaults: { primary: '#6f8797', secondary: '#eef2ee' },
  },
  leviathan: {
    label: 'Leviathan (mythical)',
    behaviour: 'A mythical sea serpent swimming in slow, muscular waves',
    patterns: ['plain', 'spots'],
    defaults: { primary: '#365f63', secondary: '#a3ae8e' },
  },
  blue_whale: {
    label: 'Blue whale',
    behaviour: 'Glides slowly through open water with gentle tail strokes',
    patterns: ['plain', 'spots'],
    defaults: { primary: '#4d6a80', secondary: '#b3c5cf' },
  },
  megalodon: {
    label: 'Megalodon',
    behaviour: 'Cruises steadily with a sweeping shark tail',
    patterns: ['plain', 'spots'],
    defaults: { primary: '#324f63', secondary: '#b5c2c4' },
  },
  starfish: {
    label: 'Starfish',
    behaviour: 'Rests on the seabed and creeps very slowly',
    patterns: ['plain', 'spots', 'bands'],
    defaults: { primary: '#f0653f', secondary: '#ffd9b0' },
  },
};
Object.assign(SPECIES, COMMUNITY_SPECIES);
export const SPECIES_IDS = Object.keys(SPECIES);

// Appearance-upgrade features. Never applied by the free comment parser.
export const UPGRADE_PATTERNS = ['gradient', 'constellation'];
export const UPGRADE_EFFECTS = ['none', 'shimmer', 'halo'];

export const PATTERN_LABELS = {
  plain: 'Plain', stripes: 'Stripes', spots: 'Spots', bands: 'Bands', rings: 'Rings',
  gradient: 'Gradient (upgrade)', constellation: 'Constellation markings (upgrade)',
};

export const COLOURS = {
  pink: '#f48fc0', 'hot pink': '#ee4d94', magenta: '#d63f97', rose: '#e8748f', blush: '#f6c1c7',
  red: '#d9413a', crimson: '#b82a3a', scarlet: '#e0392b', orange: '#ff8a3c', coral: '#ff7a59', peach: '#ffb48a', tangerine: '#ff7f2a',
  yellow: '#f8d24a', gold: '#e8b43a', golden: '#e8b43a', amber: '#eba22d', lemon: '#f6e463',
  green: '#4fa864', emerald: '#1fa476', lime: '#a6d84b', mint: '#9ce4c2', olive: '#7e8a3f', sage: '#94ad8a',
  teal: '#1a9d9d', turquoise: '#2fd6c3', aqua: '#58dcd6', cyan: '#3fcfe8',
  blue: '#3a7fd6', navy: '#1f3a78', 'sky blue': '#7cc4ee', cobalt: '#2c58c6', 'electric blue': '#2a8bff', 'baby blue': '#a9d6f2', 'deep blue': '#1f4aa0', indigo: '#4a45b0',
  purple: '#8a58c9', violet: '#7e5ad6', lavender: '#bda8e8', lilac: '#c9a9e0', plum: '#7c3f7f',
  white: '#f5f3ec', cream: '#f8ecd2', ivory: '#f5eedb', silver: '#c5d0d6', grey: '#8c9aa3', gray: '#8c9aa3', black: '#26303a', charcoal: '#39444e',
  brown: '#8a5d3b', tan: '#c9a877', bronze: '#a9743c', copper: '#c0703f',
  // Light and dark shades people ask for ("a light blue dolphin with a darker blue rose").
  'light blue': '#a9d6f2', 'dark blue': '#1f3a78', 'light pink': '#f9c4dc', 'dark pink': '#c2386f', 'light purple': '#c9a9e0', 'dark purple': '#4f2a7e',
  'light green': '#a6d8a0', 'dark green': '#2f6b3f', 'dark red': '#8f1f22', 'light grey': '#c4ccd1', 'dark grey': '#4a545c',
};

export const ADDITIONS = {
  coral_cluster: { label: 'Coral cluster', width: 300, keywords: ['coral', 'reef'] },
  rock_arch: { label: 'Rock arch', width: 520, keywords: ['arch', 'rock arch', 'rocks', 'rock'] },
  shipwreck: { label: 'Small shipwreck', width: 640, keywords: ['shipwreck', 'wreck', 'sunken ship', 'ship', 'boat'] },
  // A piece with a `hood` is built into that neighbourhood's landmark clearing, where the site and Reels both draw it (app/render/set-pieces.js).
  atlantis: { label: 'Atlantis', width: 1100, keywords: ['atlantis', 'lost city', 'sunken castle', 'castle', 'ruins'], hood: 'sunken-city', piece: 'atlantis' },
};

// A real drawn animal id (not an inherited key such as 'constructor', and not a non-string).
export const isDrawnSpecies = (id) => typeof id === 'string' && Object.hasOwn(SPECIES, id);
