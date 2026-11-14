// The gift page (buying report N1, 2026-11-14). As it is built, it is the grown-ups' guide to giving (tools/gift-page.mjs); this script draws
// its sample picture. A gift link from the shop (gift/#to=<key>&item=<id>) opens the other view: that creature in its new look, with a
// picture to save and a link to its card. The name on it comes only from names.json, so a hidden name never shows, whatever a link holds,
// and nothing on it says who paid. The pure helpers at the top are tested in Node.
import { giftLines, drawGiftPicture, altText } from './shop-gift-picture.js';
import { nameLabel } from './name-label.js';
import { watchSale, watchUntil } from './shop-sale.js';

// { key, itemId } from a gift link's hash, or null. data: { packs, kinds } from the page (tools/gift-page.mjs giftData).
export function readGiftLink(hash, data) {
  let p;
  try { p = new URLSearchParams(String(hash || '').replace(/^#/, '')); } catch { return null; }
  const key = p.get('to'), itemId = p.get('item');
  if (!/^[0-9a-f]{12}$/.test(key || '') || !itemId) return null;
  if (!Object.hasOwn(data?.packs || {}, itemId) && !Object.hasOwn(data?.kinds || {}, itemId)) return null;
  return { key, itemId };
}

// What the gift link's item puts on (a pack's three, or the one item), and which of them the creature wears now (row.paid, as the site
// holds it), in the pack's order. gift: whether any of those it wears was given as a gift.
export function giftOn(row, itemId, data) {
  const items = data.packs?.[itemId] ? [...data.packs[itemId]] : [itemId];
  const on = items.filter((id) => data.kinds?.[id] && row?.paid?.[data.kinds[id]] === id);
  return { items, on, gift: on.some((id) => (row?.paid?.gifts || []).includes(data.kinds[id])) };
}

// The picture's lines for this creature: given as a gift, "A gift for <name>"; worn but bought for itself, "The new look of <name>".
export function linesFor({ name, speciesLabel, on, gift, christmas }) {
  const lines = giftLines({ name, speciesLabel, itemIds: on, christmas });
  if (!gift) lines.kicker = name ? 'The new look of' : 'A new look';
  return lines;
}

// The picture's words for a screen reader (shop-gift-picture.js, which the keepsake shares).
export { altText };

const SITE = new URL('../', import.meta.url).href;
const cardHref = (key) => `${SITE}c/${key.slice(0, 2)}/${key}/`;

// The sample picture on the guide: a turtle with the Glow-up pack, and a stand-in where the name goes.
const SAMPLE = Object.freeze({ key: 'sample', species: 'turtle', speciesLabel: 'Turtle', colors: { primary: '#5c8a4e', secondary: '#c9b98a' }, pattern: 'plain', size: 1, seed: 1225, extras: null, paid: { spotlight: 'spotlight', hat: 'crown', look: 'sparkle', gifts: ['spotlight', 'hat', 'look'] } });

async function drawSample(canvas, christmas) {
  const lines = giftLines({ name: canvas.dataset.name, speciesLabel: SAMPLE.speciesLabel, itemIds: ['crown', 'sparkle', 'spotlight'], christmas });
  const drawn = await drawGiftPicture(SAMPLE, lines);
  canvas.getContext('2d').drawImage(drawn, 0, 0);
}

const box = typeof document !== 'undefined' && document.getElementById('gift-to');
// Black Friday: the guide's prices switch by the visitor's clock (tools/gift-page.mjs carries both in builds near and during the sale).
const guide = typeof document !== 'undefined' && document.getElementById('gift-guide');
if (guide) { watchSale(guide); watchUntil(guide); } // and the Christmas bundle goes once 25 December ends
if (box) {
  const T = box.dataset, christmas = T.christmas === '1';
  let data = { packs: {}, kinds: {} };
  try { data = JSON.parse(T.items); } catch {}
  const link = readGiftLink(location.hash, data);
  // Another gift link opened in the same tab changes only the part after the #, so the page starts again for it.
  addEventListener('hashchange', () => location.reload());
  const sample = document.getElementById('gift-sample');
  if (!link) {
    if (sample) (window.requestIdleCallback || setTimeout)(() => { drawSample(sample, christmas).catch(() => { sample.closest('figure')?.remove(); }); });
  } else {
    document.getElementById('gift-guide').hidden = true;
    box.hidden = false;
    const msg = document.getElementById('gift-to-msg'), picture = document.getElementById('gift-to-picture');
    const say = (text) => { msg.textContent = text; };
    showGift(link).catch(() => say(T.error));

    async function showGift({ key, itemId }) {
      const names = await fetch(`${SITE}names.json`).then((r) => { if (!r.ok) throw new Error(`names ${r.status}`); return r.json(); });
      const packed = names.rows.find((r) => r[0] === key);
      if (!packed) { say(T.gone); return; }
      const zone = names.zones[packed[3]]?.id;
      const area = await fetch(`${SITE}areas/${zone}-${packed[4]}.json`).then((r) => { if (!r.ok) throw new Error(`area ${r.status}`); return r.json(); });
      const row = area.residents.find((r) => r.key === key);
      if (!row) { say(T.gone); return; }
      const { on, gift } = giftOn(row, itemId, data);
      document.getElementById('gift-to-swim').href = cardHref(key);
      document.getElementById('gift-to-actions').hidden = false;
      if (!on.length) { say(T.waiting); document.getElementById('gift-to-save').hidden = true; return; }
      // names.json's name, or null for a hidden one (never the name from anywhere else).
      const name = typeof packed[1] === 'string' && packed[1] ? nameLabel(packed[1]) : null;
      const speciesLabel = names.species[packed[2]]?.label || row.speciesLabel || '';
      const lines = linesFor({ name, speciesLabel, on, gift, christmas });
      const canvas = await drawGiftPicture(row, lines);
      const url = canvas.toDataURL('image/jpeg', 0.9);
      const img = document.createElement('img');
      img.width = 1080; img.height = 1350; img.src = url;
      img.alt = altText(lines);
      picture.replaceChildren(img);
      // Save: the phone's share sheet with the picture where it can take a file, otherwise a download. (Made from the canvas, not fetched:
      // the site's security policy lets a page fetch only its own files.)
      const file = await new Promise((resolve) => canvas.toBlob((b) => resolve(b ? new File([b], 'ocean-gift.jpg', { type: 'image/jpeg' }) : null), 'image/jpeg', 0.9));
      document.getElementById('gift-to-save').addEventListener('click', async () => {
        try { if (file && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; } } catch (e) { if (e?.name === 'AbortError') return; }
        const a = document.createElement('a'); a.href = url; a.download = 'ocean-gift.jpg'; document.body.append(a); a.click(); a.remove();
      });
    }
  }
}
