// The shop page: pick an item, type the Instagram username or Facebook name of the creature it is for, and Pay opens the Stripe Payment
// Link with the reference the delivery job reads. The name is looked up the same exact-name way as Find, so only a real resident can be
// paid for. A creature from the Facebook Page (buying report N2, 2026-11-14) is paid for by its key on the site, never its name.
import { createPreview, loadShopNames, isShownName } from './shop-preview.js';
import { attachSuggest } from './search-box.js';
import { recall } from './memory.js';
import { count, inAppBrowser } from './steps.js';
import { nameLabel } from './name-label.js';
import { watchSale, watchUntil } from './shop-sale.js';
import { soundButton } from './sound-button.js'; // small: the sounds themselves load only once sound is on
// The sentences it shows are data-* attributes on #shop, written by tools/shop-page.mjs.

const SITE = new URL('../', import.meta.url).href;
const INSTAGRAM_NAME = /^[a-z0-9._]{1,30}$/; // a Facebook short name ("Sarah K.") never matches

// The same format as encodeReference in core/shop.js (a test keeps them equal). The username is already normalised. key: a Facebook
// creature's key on the site, used instead of a name (its short name can belong to two people).
export const shopReference = (itemId, gift, username, key = null) => (key ? `${itemId}-${gift ? 'g' : 's'}--${key}` : `${itemId}-${gift ? 'g' : 's'}-${username.replaceAll('.', '-')}`);

// A creature's key on the site, as a link carries it (shop/#key=<key>, from "Decorate it" on a Facebook creature's card), or null.
export const forKey = (raw) => (typeof raw === 'string' && /^[0-9a-f]{12}$/.test(raw) ? raw : null);

// A Facebook short name, as typed and as shown, compared without case, dots, spaces or an @: "sarah k" is "Sarah K.".
export const facebookFold = (s) => String(s ?? '').normalize('NFC').trim().replace(/^@+/, '').toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();

// Which of Find's hits the typed name means. Find's lookup folds punctuation, so "Sarah K." also opens sarah.k and sarah_k, who are other
// people. key: one creature was chosen (a suggestion, a choice, a link), so only it. Otherwise an Instagram username exactly as typed, or
// else every Facebook short name that reads the same (two people can share one, so this can be more than one).
export function pickHits(hits, typed, key = null) {
  if (key) return hits.filter((h) => h.key === key);
  const wanted = String(typed ?? '').trim().replace(/^@+/, '').toLowerCase();
  const insta = hits.filter((h) => INSTAGRAM_NAME.test(h.username) && h.username === wanted);
  if (insta.length) return insta;
  const fold = facebookFold(typed);
  return fold ? hits.filter((h) => !INSTAGRAM_NAME.test(h.username) && facebookFold(h.username) === fold) : [];
}

// The gift link (buying report N1, 2026-11-14): it opens the gift page on this creature, which draws it in its new look once the item is
// on. Only the creature's key and the item go in it, never a name, so a name hidden later never travels with it.
export const giftLink = (site, key, itemId) => `${site}gift/#to=${encodeURIComponent(key)}&item=${encodeURIComponent(itemId)}`;

// The name a "Decorate it" link brought (shop/#for=<username>), as the box should hold it, or null when it isn't an Instagram username
// (nothing is filled in then). It is filled in only if names.json shows that name too (isShownName), then checked the usual exact-name way.
export function forName(raw) {
  const name = typeof raw === 'string' ? raw.trim().replace(/^@+/, '').toLowerCase() : '';
  return INSTAGRAM_NAME.test(name) ? name : null;
}

// The "Replaces their current …" sentences, by kind, from the form's data-replaces-<kind> attributes.
export const replacesTexts = (data) => Object.fromEntries(Object.entries(data).filter(([k]) => /^replaces[A-Z]/.test(k)).map(([k, v]) => [k[8].toLowerCase() + k.slice(9), v]));

// The collection line (owner, 2026-11-12): the template's {list} becomes the items' names, as the page shows them.
export const ownedLine = (template, ids, labelOf) => { const names = (ids || []).map(labelOf).filter(Boolean); return names.length && template ? template.replace('{list}', names.join(', ')) : ''; };

// A pack's items as [item, kind] pairs, from its card's data-items and data-kinds (space-separated, in the same order).
export const packParts = (items, kinds) => { const k = String(kinds || '').split(' '); return String(items || '').split(' ').filter(Boolean).map((id, i) => [id, k[i]]); };

// Prices in the visitor's own money, roughly (owner, 2026-11-12: most visitors are abroad). The phone's time zone says where it is, which is
// a surer guide than its language; Australia and anywhere not listed get no line. Rates are rounded on purpose: the line says "about", and
// Stripe charges the exact amount in their currency at checkout (Adaptive Pricing). AUD -> that currency.
const ZONES = [
  [/^America\/(?:New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Indiana|Kentucky|North_Dakota|Juneau|Sitka|Nome|Adak|Menominee)|^Pacific\/Honolulu$/, 'USD', 0.65],
  [/^America\/(?:Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Montreal|Moncton|Glace_Bay|Goose_Bay|Whitehorse|Yellowknife|Iqaluit)$/, 'CAD', 0.9],
  [/^Europe\/London$/, 'GBP', 0.5],
  [/^Europe\/(?:Dublin|Berlin|Paris|Madrid|Rome|Amsterdam|Brussels|Vienna|Lisbon|Athens|Helsinki|Luxembourg|Bratislava|Ljubljana|Tallinn|Riga|Vilnius|Malta|Zagreb)$|^Asia\/Nicosia$/, 'EUR', 0.6],
  [/^Europe\/Prague$/, 'CZK', 15], [/^Asia\/(?:Kolkata|Calcutta)$/, 'INR', 55], [/^Africa\/Johannesburg$/, 'ZAR', 11.5],
  [/^Asia\/(?:Kuala_Lumpur|Kuching)$/, 'MYR', 2.9], [/^Asia\/Manila$/, 'PHP', 37], [/^Asia\/(?:Jakarta|Makassar|Jayapura|Pontianak)$/, 'IDR', 10500],
  [/^Asia\/Singapore$/, 'SGD', 0.87], [/^Pacific\/Auckland$/, 'NZD', 1.1], [/^Asia\/Karachi$/, 'PKR', 180],
];
const SYMBOLS = { USD: ['US$', ''], CAD: ['C$', ''], GBP: ['£', ''], EUR: ['€', ''], CZK: ['', ' Kč'], INR: ['₹', ''], ZAR: ['R', ''], MYR: ['RM', ''], PHP: ['₱', ''], IDR: ['Rp', ''], SGD: ['S$', ''], NZD: ['NZ$', ''], PKR: ['Rs', ''] };
// The line, or '' for no line: template's {one} and {pack} become A$one and A$pack (the usual A$3 and A$6, or Black Friday's A$1 and A$2) in
// that money, to two significant figures.
export function localPriceLine(template, timeZone, one = 3, pack = 6) {
  const hit = ZONES.find(([re]) => re.test(String(timeZone || '')));
  if (!hit || !template) return '';
  const [, currency, rate] = hit;
  // Written the same way everywhere, so a dollar is never mistaken for an Australian one: US$2, C$2.70, £1.50, ₹170, R35.
  const show = (aud) => {
    const v = Number((aud * rate).toPrecision(2)), n = v < 10 && !Number.isInteger(v) ? v.toFixed(2) : Math.round(v).toLocaleString('en');
    const [before, after] = SYMBOLS[currency];
    return `${before}${n}${after}`;
  };
  return template.replace('{one}', show(one)).replace('{pack}', show(pack));
}

// The message for "Ask someone to buy it": template's {item} and {price}.
export const askText = (template, item, price) => String(template || '').replace('{item}', item).replace('{price}', price);
// An item's name inside a sentence: lower case, except the names that keep their capital ("the Santa hat", "the Christmas bundle").
export const itemWords = (label) => String(label ?? '').toLowerCase().replace(/\b(christmas|santa)\b/g, (w) => w[0].toUpperCase() + w.slice(1));

// The creature this phone last found in the ocean (js/memory.js): { key, username }, or null.
function remembered() { try { const r = recall('last-found'); return r && typeof r === 'object' ? r : null; } catch { return null; } }

// Instagram's and Facebook's own browsers, where Apple Pay and Google Pay often don't show (js/steps.js, which the step counter shares).
export { inAppBrowser };

// "Pay A$3": the Pay button's words once a creature and an item are picked.
export const payWords = (template, price) => (template && price ? template.replace('{price}', price) : null);

// Where the preview strip's Next button goes (phone polish, 2026-11-13): nothing picked, nowhere; an item but no creature, back to step 1;
// both, on to step 3. The shop is about 5,000 px long on a phone, and Pay sat about 3,000 px below the items.
export const nextStep = (item, found) => (!item ? null : found ? 'pay' : 'who');

// The item a link asked for (shop/#item=spotlight, from the ocean's "In the spotlight" row), when it is one the page sells.
export const itemFromLink = (raw, ids) => (typeof raw === 'string' && ids.includes(raw) ? raw : null);

// The preview strip stays at the top of the screen while the items scroll, when it takes at most a quarter of the screen's height.
// Then whatever Tab brings into view lands below it: the page's top scroll padding is the strip's own height. Taller (large text, a
// short screen), it scrolls with the page like the rest.
const PIN_SHARE = 0.25;
function pinPreview(strip) {
  if (!strip) return;
  const root = document.documentElement;
  const fit = () => {
    const h = strip.getBoundingClientRect().height, pin = h > 0 && h <= innerHeight * PIN_SHARE;
    strip.classList.toggle('pinned', pin);
    root.style.scrollPaddingTop = pin ? `${Math.ceil(h) + 12}px` : '';
  };
  fit();
  if (typeof ResizeObserver === 'function') new ResizeObserver(fit).observe(strip);
  addEventListener('resize', fit);
}

async function fetchBucket(bucket) {
  const res = await fetch(`${SITE}find/${bucket}.json`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`find ${res.status}`);
  return res.json();
}

const form = typeof document !== 'undefined' && document.getElementById('shop');
if (form) {
  pinPreview(document.querySelector('.shop-preview')); // first, before anything is fetched
  // Black Friday (js/shop-sale.js): the prices, Pay's links and the sale's line switch by this phone's clock, now and, if the page is still
  // open, once more at the start or the end. Then Pay, the local prices and the grown-up view's item are worked out again.
  // What a switch redoes is set once the page is set up (at the end of this block); a switch before then has nothing to redo yet.
  let afterSale = () => {};
  const saleNow = watchSale(form, () => afterSale());
  // The Christmas bundle is sold until 25 December ends: past that on this phone's clock it goes, and anything relying on it is redone.
  watchUntil(document, () => afterSale());
  // Sounds (2026-11-14): a soft click for picking an item and a soft pop as the preview puts it on. Nothing for Pay.
  const speaker = document.getElementById('sound'), sounds = speaker ? soundButton(speaker) : null;
  window.shopSound = () => sounds?.state() ?? null; // for tests
  // The day's step totals (js/steps.js): whether this visit came from an ask link, and the page's layout, go with each one.
  const fromAsk = !!window.shopAsk, layout = form.dataset.layout || ''; // read now: window.shopAsk is cleared further down
  const step = (name) => count(name, { ask: fromAsk, layout });
  step('shop-open');
  const { lookupName } = await import('../core/site-find.js'); // loaded here so the reference format above can be tested without the built site's folders
  const { suggestIndex, suggestNames, showThumb, thumbPack } = await import('../core/site-names.js'); // the same
  const input = document.getElementById('shop-name'), gift = document.getElementById('shop-gift');
  const msg = document.getElementById('shop-msg'), pay = document.getElementById('shop-pay');
  const say = (...lines) => msg.replaceChildren(...lines.map((text) => { const p = document.createElement('p'); p.textContent = text; return p; }));
  // No answer yet: how to get a creature, for anyone who hasn't one. It isn't an answer about what's typed, so it can stay while typing.
  const noAnswer = () => say(form.dataset.joinHint);
  const payText = pay.textContent;
  // who: the creature found, { name (as the site shows it), key, facebook }. chosen: a creature picked by key for the name in the box (a
  // suggestion, one of several with that name, or a link), so it stays picked when the same name is checked again.
  let who = null, chosen = null, latest = 0;
  // The preview: the sample creature until a name matches. Its renderer loads on first use (the first item picked or name matched).
  const preview = createPreview({ canvas: document.getElementById('shop-preview-canvas'), note: document.getElementById('shop-preview-note'),
    texts: { unavailable: form.dataset.previewUnavailable, hint: form.dataset.previewHint, replaces: replacesTexts(form.dataset) },
    owned: document.getElementById('shop-owned'), ownedText: (ids) => ownedLine(form.dataset.owned, ids, (id) => form.querySelector(`[data-item="${id}"]`)?.closest('.shop-item')?.querySelector('.shop-label')?.textContent) });
  let drawnFor = '';
  const pickedLine = document.getElementById('shop-preview-item');
  const updatePreview = (force = false) => {
    const picked = form.querySelector('input[name="item"]:checked'), item = picked?.value ?? null, kind = picked?.dataset.kind ?? null, key = who?.key ?? null;
    // A pack (owner, 2026-11-12) shows all its items on the creature at once.
    const items = picked?.dataset.items ? packParts(picked.dataset.items, picked.dataset.kinds) : null;
    // The picked item's name sits beside the preview, so it stays in view after its card has scrolled away.
    if (pickedLine) pickedLine.textContent = picked?.closest('.shop-item')?.querySelector('.shop-label')?.textContent ?? '';
    const sig = `${item}|${key}`;
    if (!force && sig === drawnFor) return;
    drawnFor = sig;
    preview.show({ itemId: item, kind, key, items }).then((on) => { if (on) sounds?.play('tryOn'); }, () => {});
  };

  const ask = document.getElementById('shop-ask'), askMsg = document.getElementById('shop-ask-msg');
  // The grown-up view's own Pay (ask links) is the same link as the one in step 3, so a grown-up can pay from the top of the page.
  const grownPay = document.getElementById('shop-grownup-pay'), next = document.getElementById('shop-next');
  const pays = [pay, grownPay].filter(Boolean);
  let payInView = false;
  const giftBox = document.getElementById('shop-giftlink'), giftMsg = document.getElementById('shop-giftlink-msg');
  const refresh = () => {
    const picked = form.querySelector('input[name="item"]:checked'), item = picked?.value;
    if (ask) ask.disabled = !(item && who);
    if (item && who) {
      // A pack carries its own Payment Link (A$6); everything else goes through the A$3 one. During Black Friday these are the sale's links.
      const url = new URL(picked.dataset.link || form.dataset.link);
      url.searchParams.set('client_reference_id', who.facebook ? shopReference(item, gift.checked, null, who.key) : shopReference(item, gift.checked, who.name));
      for (const b of pays) { b.href = url.href; b.removeAttribute('aria-disabled'); b.textContent = payWords(form.dataset.payPrice, picked.dataset.price) ?? payText; }
    } else for (const b of pays) { b.removeAttribute('href'); b.setAttribute('aria-disabled', 'true'); b.textContent = payText; }
    const step = nextStep(item, who);
    if (next) { next.hidden = !step || (step === 'pay' && payInView); if (step) { next.href = `#shop-step-${step}`; next.setAttribute('aria-label', next.dataset[step]); } }
    // The gift link shows once it is a gift for a creature that's found, with something picked.
    if (giftBox) { const show = !!(item && who && gift.checked); if (giftBox.hidden === show) { giftBox.hidden = !show; if (giftMsg) giftMsg.textContent = ''; } }
    showGrownPick(picked);
  };
  // The grown-up view shows whose creature it is and what they asked for, once the name is found.
  function showGrownPick(picked) {
    const box = document.getElementById('shop-grownup-pick');
    if (!box || document.getElementById('shop-grownup').hidden) return;
    box.hidden = !(picked && who);
    document.getElementById('shop-grownup-gift').hidden = !gift.checked;
    if (box.hidden) return;
    const thumb = document.getElementById('shop-grownup-thumb'), src = `${SITE}${thumbPack(who.key)}#${who.key}`;
    if (thumb.dataset.src !== src) { thumb.dataset.src = src; thumb.onerror = () => thumb.removeAttribute('src'); showThumb(thumb, who.key); } // a missing picture leaves the water behind it
    document.getElementById('shop-grownup-name').textContent = nameLabel(who.name);
    const card = picked.closest('.shop-item'), what = document.getElementById('shop-grownup-what');
    if (what.dataset.shown !== picked.value) {
      what.dataset.shown = picked.value;
      const pic = card.querySelector('.shop-pic, .shop-pack-pics')?.cloneNode(true);
      pic?.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; });
      const words = document.createElement('span'); words.className = 'shop-grownup-words';
      const name = document.createElement('strong'); name.textContent = card.querySelector('.shop-label')?.textContent ?? picked.value;
      const price = document.createElement('span'); price.textContent = picked.dataset.price || '';
      words.append(name, price);
      what.replaceChildren(...[pic, words].filter(Boolean));
    }
  }

  // Several creatures with the name typed (two Facebook people can both be "Sarah K."): one button each, with its picture and its animal,
  // as Find offers a choice. Only people whose exact name was typed are here, the same as Find shows.
  const choice = document.getElementById('shop-choice');
  const clearChoice = () => { if (choice && !choice.hidden) { choice.hidden = true; choice.replaceChildren(); } };
  const found = (hit) => {
    who = { name: hit.username, key: hit.key, facebook: !INSTAGRAM_NAME.test(hit.username) };
    clearChoice();
    say(`${form.dataset.for}${nameLabel(hit.username)}`);
  };
  function showChoice(hits) {
    say(form.dataset.choose);
    suggest.close(); // the suggestions would sit over the choice
    if (!choice) return;
    const typed = input.value;
    const buttons = hits.map((hit) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'shop-choice-one'; b.dataset.key = hit.key;
      const pic = document.createElement('span'); pic.className = 'sg-pic';
      const img = document.createElement('img'); img.alt = ''; img.width = 48; img.height = 32; img.decoding = 'async';
      img.addEventListener('error', () => img.remove(), { once: true });
      showThumb(img, hit.key);
      pic.append(img);
      const name = document.createElement('span'); name.className = 'sg-name'; name.textContent = nameLabel(hit.username);
      const kind = document.createElement('span'); kind.className = 'sg-kind';
      const words = document.createElement('span'); words.className = 'sg-words'; words.append(name, kind);
      b.append(pic, words);
      b.addEventListener('click', () => { chosen = { name: typed, key: hit.key }; found(hit); refresh(); updatePreview(); });
      return b;
    });
    choice.replaceChildren(...buttons);
    choice.hidden = false;
    // Each one's animal, from names.json (which lists every creature's animal, hidden names too, as a card does).
    loadShopNames().then((names) => {
      for (const b of buttons) {
        const row = names.rows.find((r) => r[0] === b.dataset.key), label = row ? names.species[row[2]]?.label : '';
        if (label) { b.querySelector('.sg-kind').textContent = label; b.setAttribute('aria-label', `${b.querySelector('.sg-name').textContent}, ${label}`); }
      }
    }).catch(() => {});
  }
  // Nothing found: a name with a space in it was most likely meant as a Facebook name, so say how those are written.
  const notFound = (typed) => say(...[form.dataset.notFound, /\S\s+\S/.test(typed) ? form.dataset.facebookHint : null].filter(Boolean));

  async function check() {
    const typed = input.value, mine = ++latest;
    who = null; clearChoice(); refresh(); updatePreview();
    if (!typed.trim()) { noAnswer(); return; }
    const key = chosen && chosen.name === typed ? chosen.key : null;
    let hits;
    try { hits = await lookupName(typed, fetchBucket); } catch { if (mine === latest) say(form.dataset.error); return; }
    if (mine !== latest) return;
    // Only an exact match counts (pickHits): the lookup folds punctuation, so "Sarah K." also opens sarah.k, who is someone else.
    const hit = pickHits(hits, typed, key);
    if (hit.length === 1) found(hit[0]);
    else if (hit.length > 1) showChoice(hit);
    else notFound(typed);
    refresh(); updatePreview();
  }

  let timer = 0;
  // Names suggested as one is typed, as in the main Find box: only names the site shows, Instagram and Facebook. Picking one checks it at
  // once, and only that creature, even if someone else's name reads the same.
  const suggest = attachSuggest({
    input, load: () => loadShopNames().then((names) => suggestIndex(names)), match: suggestNames,
    thumb: showThumb, choose: (s) => { input.value = s.name; chosen = { name: s.name, key: s.key }; clearTimeout(timer); check(); },
  });
  // The last answer goes as soon as the box changes, so it can never be read as the answer about the new text.
  input.addEventListener('input', () => { clearTimeout(timer); who = null; chosen = null; latest++; clearChoice(); noAnswer(); refresh(); updatePreview(); timer = setTimeout(check, 400); });
  // Enter checks the name and closes the suggestions, which would otherwise sit over the answer.
  input.addEventListener('keydown', (e) => { if (suggest.key(e)) return; if (e.key === 'Enter') { e.preventDefault(); suggest.close(); clearTimeout(timer); check(); } });
  form.addEventListener('change', (e) => { if (e.target?.name === 'item') { step('item-picked'); sounds?.play('click'); } refresh(); updatePreview(); });
  for (const b of pays) b.addEventListener('click', (e) => { if (b.getAttribute('aria-disabled') === 'true') e.preventDefault(); else step('pay'); });
  // Next back to step 1 puts the cursor in the name box too.
  next?.addEventListener('click', () => { if (next.getAttribute('href') === '#shop-step-who') setTimeout(() => input.focus({ preventScroll: true }), 0); });
  // While Pay is on screen, Next has nowhere to go, so it steps aside.
  if (next && typeof IntersectionObserver === 'function') {
    new IntersectionObserver(([e]) => { payInView = e.isIntersecting; refresh(); }).observe(pay);
  }
  // Coming Back from Stripe restores the box, so the check runs again.
  const again = () => { if (input.value.trim()) check(); };
  if (!input.value.trim()) noAnswer();
  window.addEventListener('pageshow', again);
  again();
  refresh();
  // Arriving from "Decorate it": the name (#for=, Instagram) or creature (#key=, Facebook) shop.html took out of the address fills the box,
  // once, and only if the site shows that name (a link copied before someone hid their name, or typed by hand, fills nothing and says
  // nothing). Anything typed first wins. Otherwise the creature this phone last found on the site, if the site still shows its name (the
  // main page's "Swim to @name").
  const last = remembered();
  const given = (forName(window.shopFor) && { name: forName(window.shopFor) }) || (forKey(window.shopKey) && { key: forKey(window.shopKey) })
    || (forName(last?.username) && { name: forName(last.username) }) || (forKey(last?.key) && last?.username && { key: forKey(last.key) }) || null;
  delete window.shopFor; delete window.shopKey;
  if (given) {
    let touched = false;
    input.addEventListener('input', () => { touched = true; }, { once: true });
    loadShopNames().then((names) => {
      if (touched || input.value.trim()) return;
      if (given.name) {
        if (!isShownName(names, given.name)) return;
        input.value = given.name;
      } else {
        // A Facebook creature: its name as names.json shows it, so a hidden one is never filled in.
        const name = names.rows.find((r) => r[0] === given.key)?.[1];
        if (typeof name !== 'string' || !name) return;
        input.value = name;
        chosen = { name, key: given.key };
      }
      check();
    }).catch(() => {});
  }
  // Arriving from "About the Spotlight" in the ocean's spotlight row: that item is picked and scrolled to.
  const asked = itemFromLink(window.shopItem, [...form.querySelectorAll('input[name="item"]')].map((i) => i.value));
  delete window.shopItem;
  if (asked) { const radio = form.querySelector(`input[name="item"][value="${asked}"]`); radio.checked = true; refresh(); updatePreview(); }
  // Prices in the visitor's money, under the intro.
  const local = document.getElementById('shop-local');
  // The prices now on the page (Black Friday's while it runs), as numbers of Australian dollars.
  const amountOf = (sel, fallback) => Number(String(form.querySelector(sel)?.dataset.price ?? '').replace(/^A\$/, '')) || fallback;
  function showLocal() {
    if (!local) return;
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}
    const line = localPriceLine(saleNow() ? form.dataset.saleLocal : form.dataset.local, tz, amountOf('input[name="item"]:not([data-kind="pack"])', 3), amountOf('input[data-kind="pack"]', 6));
    local.textContent = line; local.hidden = !line;
  }
  showLocal();
  // "Ask someone to buy it": the phone's share sheet with a link that opens this shop with this creature, this item and Gift ticked, so a
  // parent or friend can pay. Where there's no share sheet (Instagram's own browser on some phones), the message and link are copied, or shown.
  // Who a link names: an Instagram username, or a Facebook creature's key (never a Facebook name, which two people can share).
  const whoPart = () => (who.facebook ? `key=${encodeURIComponent(who.key)}` : `for=${encodeURIComponent(who.name)}`);
  ask?.addEventListener('click', async () => {
    const picked = form.querySelector('input[name="item"]:checked');
    if (!picked || !who) return;
    step('ask');
    const label = picked.closest('.shop-item')?.querySelector('.shop-label')?.textContent || picked.value;
    const url = `${SITE}shop/#${whoPart()}&item=${encodeURIComponent(picked.value)}&gift=1&ask=1`;
    // During Black Friday the message says when it ends, in the sender's own time as the page shows it.
    const ends = document.querySelector('[data-sale-end]')?.textContent || '';
    const text = askText(saleNow() ? form.dataset.saleAskText : form.dataset.askText, itemWords(label), picked.dataset.price || '').replace('{end}', ends);
    askMsg.textContent = '';
    try { if (navigator.share) { await navigator.share({ text, url }); return; } } catch (e) { if (e?.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(`${text} ${url}`); askMsg.textContent = form.dataset.askCopied; return; } catch {}
    askMsg.textContent = `${text} ${url}`;
  });
  // Inside Instagram's or Facebook's browser: a way to carry the choice to Safari or Chrome, where Apple Pay and Google Pay show. The link is
  // made only when asked for, like "Ask someone to buy it"; the address bar never carries the name.
  const inApp = document.getElementById('shop-inapp'), inAppMsg = document.getElementById('shop-inapp-msg');
  if (inApp && inAppBrowser(navigator.userAgent)) {
    inApp.hidden = false;
    document.getElementById('shop-inapp-copy')?.addEventListener('click', async () => {
      step('copy-link');
      const picked = form.querySelector('input[name="item"]:checked');
      const parts = [who && whoPart(), picked && `item=${encodeURIComponent(picked.value)}`, gift.checked && 'gift=1'].filter(Boolean);
      const url = `${SITE}shop/${parts.length ? `#${parts.join('&')}` : ''}`;
      inAppMsg.textContent = '';
      try { await navigator.clipboard.writeText(url); inAppMsg.textContent = form.dataset.inAppCopied; return; } catch {}
      inAppMsg.textContent = url;
    });
  }
  // The gift link (buying report N1): for a grown-up giving it as a present, to send once paid. The phone's share sheet, or it is copied,
  // or shown to copy by hand, like "Ask someone to buy it".
  document.getElementById('shop-giftlink-copy')?.addEventListener('click', async () => {
    const picked = form.querySelector('input[name="item"]:checked');
    if (!picked || !who || !giftMsg) return;
    const url = giftLink(SITE, who.key, picked.value);
    giftMsg.textContent = '';
    try { if (navigator.share) { await navigator.share({ text: form.dataset.giftLinkText, url }); return; } } catch (e) { if (e?.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); giftMsg.textContent = form.dataset.giftLinkCopied; return; } catch {}
    giftMsg.textContent = url;
  });
  // Arriving from someone's ask (#gift=1): Gift is ticked.
  if (window.shopGift) { gift.checked = true; refresh(); }
  delete window.shopGift;
  // Arriving from "Ask someone to buy it" (#ask=1): the grown-up view first, naming the item and its price.
  const grown = document.getElementById('shop-grownup');
  // The item asked for, whose price the grown-up view's sentence names (written again if Black Friday starts or ends while it's open).
  let askedFor = null;
  const grownLine = () => {
    const line = document.getElementById('shop-grownup-item');
    const label = askedFor?.closest('.shop-item')?.querySelector('.shop-label')?.textContent;
    if (line && label) line.textContent = line.dataset.template.replace('{item}', itemWords(label)).replace('{price}', askedFor.dataset.price || '');
  };
  // The Christmas bundle offered to the grown-up in one plain line (owner, 14 Nov 2026), while the bundle is on the page and isn't what's
  // picked. "Choose the bundle instead" picks it; the sentence above still says what was asked for.
  const offer = document.getElementById('shop-bundle-offer');
  const bundleRadio = () => (offer ? form.querySelector(`input[name="item"][value="${offer.dataset.bundle}"]`) : null);
  const showOffer = () => {
    if (!offer) return;
    const radio = bundleRadio(), picked = form.querySelector('input[name="item"]:checked');
    offer.hidden = !(grown && !grown.hidden && radio && !radio.closest('.shop-item')?.hidden && picked?.value !== radio.value);
  };
  document.getElementById('shop-bundle-choose')?.addEventListener('click', () => {
    const radio = bundleRadio();
    if (!radio) return;
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
  });
  form.addEventListener('change', showOffer);
  if (grown && window.shopAsk) {
    askedFor = form.querySelector('input[name="item"]:checked');
    grownLine();
    grown.hidden = false;
    document.body.classList.add('shop-asked'); // the children's giveaway line and the step pictures step aside for the grown-up (site.css)
    refresh();
    showOffer();
  }
  delete window.shopAsk;
  // From here on a Black Friday switch, or the bundle going after 25 December, redoes Pay, the local prices, the preview and the grown-up view
  // (before now there was nothing to redo).
  afterSale = () => { document.getElementById('shop-grownup-what')?.removeAttribute('data-shown'); refresh(); showLocal(); grownLine(); showOffer(); updatePreview(); };
  // The sample shows from the start, but only once the browser is idle, so the page itself loads first.
  (window.requestIdleCallback || setTimeout)(() => updatePreview());
}
