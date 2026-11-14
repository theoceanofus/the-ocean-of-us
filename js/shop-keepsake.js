// The keepsake (brand report B7, 2026-11-14): with everything bought in the shop comes a free picture of the creature in its new look, to
// keep and share, in Story size (1080 x 1920) and square (1080 x 1080). It is on the creature's card, under "Try one on", and only for what
// the creature really has: the card's row (row.paid) holds only items that went on, after the shop's fit check, and its collection.
// Like the gift picture it is drawn here on the phone by the same renderer as the card, and like the card it never names who paid: the name
// on it is the one the card shows (a hidden name stays off), and it never says "gift". Nothing about anyone is sent anywhere; opening it
// adds one to the day's keepsake total (js/steps.js), which is only that it happened.
// The pure helpers at the top are tested in Node, and the card's builder (tools/site2-pages.mjs) uses KEEPSAKE_TEXT and keepsakeChoices.
import { giftList, drawGiftPicture, altText, PICTURE_LAYOUTS } from './shop-gift-picture.js';
import { previewRow } from './shop-preview.js';
import { nameLabel } from './name-label.js';
import { isInstagramBrowser, pressAndHoldWorks, OPEN_ELSEWHERE_TEXT } from './share.js';
import { count } from './steps.js';

// Every word the keepsake shows. The section on the card is built from these too (tools/site2-pages.mjs), so they are in one place.
export const KEEPSAKE_TEXT = Object.freeze({
  title: 'Keepsake',
  blurb: 'Everything from the shop comes with a free picture of the creature in its new look, to keep or share.',
  pick: 'Which one',
  whole: 'Its whole look',
  sizes: Object.freeze({ story: 'Story size', square: 'Square' }),
  save: 'Save the picture',
  hold: 'Or press and hold the picture to save it.',
  making: 'Making the picture…',
  failed: "The picture couldn't be made on this phone.",
  close: 'Close',
  dialog: 'Keepsake picture',
  // Above the name on the picture, and alone when the name is hidden.
  kicker: 'The new look of',
  kickerHidden: 'A new look',
  // Under the animal: what it wears now ("Now with a crown"), or, for something in its collection it isn't wearing, just "With a crown".
  now: 'Now with ',
  with: 'With ',
  foot: 'theoceanofus.pages.dev',
});
export const KEEPSAKE_SIZES = Object.freeze(['story', 'square']);
// The picture's file name, by size.
export const keepsakeFile = (size) => `the-ocean-of-us-keepsake-${size === 'square' ? 'square' : 'story'}.jpg`;

// The order the items read in on the picture and the card: what it wears first, then what is beside it, and the Spotlight last.
// "Now with a crown, sparkles and the Spotlight".
const READING = ['christmas', 'hat', 'face', 'look', 'companion', 'home', 'trail', 'spotlight'];

// What there can be a keepsake of, from the card's row.paid: { spotlight: 'spotlight', hat: 'crown', gifts: [...], owned: [...] }.
// kinds: item id -> its kind (SHOP_ITEMS' kinds; passed in, as core/shop.js pulls in more than the site carries).
// [{ id, items, kinds, worn }]: with two or more things on, first its whole look, then each thing it wears, then each thing in its
// collection it isn't wearing now. Anything that isn't a real item of its kind is left out, so a keepsake is only ever of what it has.
export function keepsakeChoices(paid, kinds) {
  if (!paid || typeof paid !== 'object' || !kinds) return [];
  const real = (id, kind) => typeof id === 'string' && Object.hasOwn(kinds, id) && (!kind || kinds[id] === kind);
  const worn = READING.filter((k) => real(paid[k], k)).map((k) => paid[k]);
  const owned = [...new Set(Array.isArray(paid.owned) ? paid.owned : [])].filter((id) => real(id) && kinds[id] !== 'spotlight' && !worn.includes(id));
  owned.sort((a, b) => READING.indexOf(kinds[a]) - READING.indexOf(kinds[b]));
  const one = (id, isWorn) => ({ id, items: [id], kinds: [kinds[id]], worn: isWorn });
  return [
    ...(worn.length > 1 ? [{ id: 'look', items: worn, kinds: worn.map((id) => kinds[id]), worn: true }] : []),
    ...worn.map((id) => one(id, true)),
    ...owned.map((id) => one(id, false)),
  ];
}

// The row to draw: as it is for what it wears now; for something in its collection, with that put on in its kind's place (shop-preview.js,
// the same as the shop's preview: a hat takes a Christmas hat off, and the other way round).
export function keepsakeRow(row, choice) {
  if (!choice || choice.worn) return row;
  return choice.items.reduce((r, id, i) => previewRow(r, id, choice.kinds[i]), row);
}

// The words on the picture. name: as the site shows it ("@some_user", "Sarah K."), or null for a hidden name, which is then left off.
// The resident number and home go on the Story-sized one, as on the card. christmas: a Christmas item is in it, so it snows.
export function keepsakeLines({ name, speciesLabel, choice, slot = null, zoneLabel = '', founder = false }) {
  const T = KEEPSAKE_TEXT, list = giftList(choice?.items ?? []);
  return {
    kicker: name ? T.kicker : T.kickerHidden,
    name: name || '',
    animal: speciesLabel || '',
    gift: list ? `${choice.worn ? T.now : T.with}${list}` : '',
    facts: [Number.isInteger(slot) ? `No. ${slot + 1}` : '', zoneLabel, founder ? 'Founder' : ''].filter(Boolean).join(' · '),
    foot: T.foot,
    christmas: (choice?.kinds ?? []).includes('christmas'),
  };
}

// The card's row as the picture names it: the name only when the site shows it (row.name is null for a hidden one).
export const keepsakeName = (row) => (typeof row?.name === 'string' && row.name ? nameLabel(row.name) : null);

// Draws the keepsake and returns the canvas.
export const drawKeepsake = (row, lines, size) => drawGiftPicture(row, lines, PICTURE_LAYOUTS[size] ?? PICTURE_LAYOUTS.story);

// The choice a chip on the card stands for, from its data-* (written by tools/site2-pages.mjs keepsakeHtml).
export function choiceOf(el) {
  const items = String(el?.dataset?.items || '').split(' ').filter(Boolean), kinds = String(el?.dataset?.kinds || '').split(' ');
  if (!items.length || kinds.length !== items.length) return null;
  return { id: el.dataset.choice || items[0], items, kinds, worn: el.dataset.worn === '1' };
}

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

// The screen with the picture: a Save button (the phone's share sheet where it takes a file, otherwise a download) and Close. Inside
// Instagram's browser on a phone where press and hold doesn't save, it says to open the page in Safari or Chrome, as Share it does.
export function openKeepsake(row, choice, size) {
  document.getElementById('keepsake-screen')?.remove();
  const T = KEEPSAKE_TEXT, ua = navigator.userAgent || '', opener = document.activeElement;
  const root = el('div'); root.id = 'keepsake-screen';
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', T.dialog);
  const panel = el('div', 'share-panel'), picture = el('div', 'share-picture keepsake-picture');
  const status = el('p', 'share-status'); status.setAttribute('role', 'status');
  const saveBtn = el('button', 'button', T.save); saveBtn.type = 'button'; saveBtn.hidden = true;
  const closeBtn = el('button', 'share-close', T.close); closeBtn.type = 'button';
  const buttons = el('div', 'share-buttons'); buttons.append(saveBtn);
  panel.append(picture, buttons, status, closeBtn);
  root.append(panel);
  const close = () => { root.remove(); document.removeEventListener('keydown', onKey); if (opener?.isConnected) opener.focus(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.append(root);
  closeBtn.focus();
  count('keepsake');

  if (isInstagramBrowser(ua) && !pressAndHoldWorks(ua)) { picture.append(el('p', 'share-note', OPEN_ELSEWHERE_TEXT)); return; }
  const wait = el('p', 'share-wait', T.making);
  picture.append(wait);
  const lines = keepsakeLines({ name: keepsakeName(row), speciesLabel: row.speciesLabel, choice, slot: row.slot, zoneLabel: row.zoneLabel, founder: !!row.founder });
  drawKeepsake(keepsakeRow(row, choice), lines, size).then(async (canvas) => {
    if (!root.isConnected) return;
    const url = canvas.toDataURL('image/jpeg', 0.9);
    const img = el('img'); img.width = canvas.width; img.height = canvas.height; img.src = url; img.alt = altText(lines);
    img.dataset.size = size;
    wait.replaceWith(img);
    buttons.after(el('p', 'share-note keepsake-hold', T.hold)); // under Save: "Or press and hold the picture to save it."
    // Made from the canvas, not fetched: the site's security policy lets a page fetch only its own files.
    const file = await new Promise((resolve) => canvas.toBlob((b) => resolve(b ? new File([b], keepsakeFile(size), { type: 'image/jpeg' }) : null), 'image/jpeg', 0.9));
    if (!root.isConnected) return;
    saveBtn.hidden = false;
    saveBtn.focus();
    saveBtn.addEventListener('click', async () => {
      try { if (file && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; } } catch (e) { if (e?.name === 'AbortError') return; }
      const a = el('a'); a.href = url; a.download = keepsakeFile(size); document.body.append(a); a.click(); a.remove();
    });
  }).catch(() => {
    if (!root.isConnected) return;
    wait.replaceWith(el('p', 'share-note', T.failed));
  });
}

// The card's keepsake section: picking a chip says which one, and each size button opens that picture.
export function initKeepsake(row, section = document.getElementById('keepsake')) {
  if (!section || !row) return;
  const chips = [...section.querySelectorAll('.keepsake-choice')];
  const pick = (chip) => { for (const c of chips) c.setAttribute('aria-pressed', String(c === chip)); };
  for (const c of chips) c.addEventListener('click', () => pick(c));
  for (const b of section.querySelectorAll('[data-size]')) {
    b.addEventListener('click', () => {
      const chosen = chips.find((c) => c.getAttribute('aria-pressed') === 'true') ?? chips[0];
      const choice = choiceOf(chosen);
      if (choice && KEEPSAKE_SIZES.includes(b.dataset.size)) openKeepsake(row, choice, b.dataset.size);
    });
  }
  section.dataset.ready = '1';
}
