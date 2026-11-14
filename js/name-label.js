// How a person's name is written on the site. A hidden person has no name in the public files and reads exactly "Name hidden", with no @.
// Anything other than a real name counts as hidden, so a mistake can only ever hide a name. No imports: the build and the picture maker use this file too.
export const HIDDEN_NAME = 'Name hidden';
// Only an Instagram username gets an @. A Facebook person's short name ("Sarah K.") always has a capital, a space or a letter outside a-z
// (state.js displayNameFrom), so it is written as it is.
export const nameLabel = (name) => (typeof name === 'string' && name ? (/^[a-z0-9._]+$/.test(name) ? `@${name}` : name) : HIDDEN_NAME);
export const isHiddenRow = (row) => nameLabel(row?.name) === HIDDEN_NAME;
// A hidden person's page title and share text: "A Shark in The Ocean of Us".
export const hiddenTitle = (speciesLabel) => `${/^(?!uni|eu|ure)[aeiou]/i.test(speciesLabel) ? 'An' : 'A'} ${speciesLabel} in The Ocean of Us`;
// Rows that keep a name on one line start to cut it off at about this many letters, so a longer one is drawn smaller first.
export const isLongLabel = (label) => label.length > 14;
// A tile gives a name two lines, so a whole username shows. One too long for the first line is drawn a little smaller, which keeps most
// names on one line and lets the very longest fit in two.
export const tileNameClass = (label) => (label.length > 24 ? 'name longest' : label.length > 16 ? 'name long' : 'name');
// "Decorate it" on a card opens the shop with the creature filled in: <shop>#for=<username>. The name is after the #, so it is never
// sent in a request, but a link can still be copied, so only a name that is shown gets one, never a hidden name. A Facebook creature
// (buying report N2, 2026-11-14) is named by its key on the site instead, <shop>#key=<key>, as two people can share a short name; the key
// is in its card's own address already. The shop fills the name in only if names.json still shows it (js/shop.js).
// The words are SHOP_TEXT.decorate in tools/shop-page.mjs (a test keeps the two equal). shop: the shop page's address from here.
export const DECORATE = 'Decorate it';
export const decorateHref = (row, shop) => {
  if (typeof row?.name !== 'string' || !row.name) return null;
  if (/^[a-z0-9._]{1,30}$/.test(row.name)) return `${shop}#for=${encodeURIComponent(row.name)}`;
  return typeof row.key === 'string' && /^[0-9a-f]{12}$/.test(row.key) && row.name !== HIDDEN_NAME ? `${shop}#key=${row.key}` : null;
};
// "Try one on" (owner, 2026-11-12: "further improve likelihood of someone buying something"): under "Decorate it", a row of a few shop items,
// each opening the shop with this creature and that item already picked (<shop>#for=<username>&item=<id>), so the person sees their own
// creature wearing it at once. The same rule as decorateHref: only a shown name. shop: the shop page's address from here.
export const TRY_ON_TITLE = 'Try one on';
// The New Year card's button (report B2), on a creature's page and the ocean's sheet while the card is on (js/new-year.js). Kept here so
// the ocean page can say it without loading the card's code.
export const NEW_YEAR_OPEN = 'Make a New Year card';
export const TRY_ON = Object.freeze([['spotlight', 'Spotlight'], ['crown', 'Crown'], ['partyhat', 'Party hat'], ['glasses', 'Sunglasses']]);
export const tryOnLinks = (row, shop) => {
  const base = decorateHref(row, shop);
  return base ? TRY_ON.map(([id, label]) => ({ id, label, href: `${base}&item=${id}`, img: `${shop}items/${id}.webp` })) : [];
};
// The A$6 packs (brand report B7, 2026-11-14: more prominence for the pack): one line under Try one on, each pack opening the shop with this
// creature and that pack picked, the same rule as tryOnLinks. Only while packs are sold. A test keeps the ids, names and price in step with
// SHOP_PACKS in core/shop.js. A plain price, with nothing urgent.
export const TRY_PACKS_TITLE = 'Or a pack of three for A$6:';
export const TRY_PACKS = Object.freeze([['glowup', 'Glow-up pack'], ['partypack', 'Party pack']]);
export const tryPackLinks = (row, shop) => {
  const base = decorateHref(row, shop);
  return base ? TRY_PACKS.map(([id, label]) => ({ id, label, href: `${base}&item=${id}` })) : [];
};
