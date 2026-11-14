// The gift picture (buying report N1, 2026-11-14): a 1080 x 1350 picture naming a creature that was given something, drawn in its new look
// by the same renderer as its card (portrait.js). The gift page draws it for the person the gift is for, and tools/gift-post.mjs draws a
// sample one for the owner's Facebook posts. It never says who paid. The pure helpers at the top are tested in Node.
// Imports follow the built site's layout, where js/, render/ and core/ sit side by side (portrait.js is loaded on use).

// How each shop item reads in "Now with …". A test keeps this in step with SHOP_ITEMS in core/shop.js.
export const GIFT_WORDS = Object.freeze({
  spotlight: 'the Spotlight', bow: 'a bow', cap: 'a cap', crown: 'a crown', partyhat: 'a party hat', tophat: 'a top hat', cowboyhat: 'a cowboy hat',
  wizardhat: 'a wizard hat', piratehat: 'a pirate hat', unicornhorn: 'a unicorn horn', headphones: 'headphones', babylook: 'the baby look',
  sparkle: 'sparkles', blush: 'rosy cheeks', lashes: 'eyelashes', glasses: 'sunglasses', goggles: 'a diving mask', monocle: 'a monocle',
  shellhouse: 'a shell house', castle: 'a sunken castle', treasurechest: 'a treasure chest', coralgarden: 'a coral garden',
  littlefish: 'a little fish', babyseahorse: 'a baby seahorse', minijelly: 'a mini jellyfish', bubbletrail: 'a bubble trail',
  rainbowtrail: 'a rainbow trail', startrail: 'a starlight trail', santahat: 'a Santa hat', fairylights: 'fairy lights', snowcrown: 'a snowflake crown',
  princessdress: 'a princess floral dress',
});

// "a crown, sparkles and the Spotlight": the items in the order given, or '' when none has words.
export function giftList(itemIds) {
  const words = (itemIds || []).map((id) => GIFT_WORDS[id]).filter(Boolean);
  return words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

// The animal as it reads inside a sentence: "Great white shark" -> "great white shark", but a name like "SpongeBob" stays as it is.
export const animalWords = (label) => {
  const s = String(label || 'creature'), first = s.split(' ')[0];
  return first.slice(1) === first.slice(1).toLowerCase() ? s.charAt(0).toLowerCase() + s.slice(1) : s;
};

// The lines on the picture for a creature on the site. name: as names.json shows it ("@some_user", "Sarah K."), or null for a hidden name,
// which is never put on the picture: it then reads "A gift" over the animal alone. christmas: the Christmas wording (1 November to 6 January).
export function giftLines({ name, speciesLabel, itemIds, christmas = false, foot = 'theoceanofus.pages.dev' }) {
  const list = giftList(itemIds);
  return {
    kicker: name ? (christmas ? 'A Christmas gift for' : 'A gift for') : (christmas ? 'A Christmas gift' : 'A gift'),
    name: name || '',
    animal: speciesLabel || '',
    gift: list ? `Now with ${list}` : '',
    foot,
    christmas,
  };
}

// Where everything goes on each picture. gift: the gift picture (1080 x 1350). story and square: the keepsake (shop-keepsake.js), Story-sized
// with its words kept between y 230 and 1640, where Instagram's own buttons don't cover them, and square. Every y is a text baseline.
// text: [y, largest px, smallest px]; gift: the first line's y and the gap to a second; facts: the keepsake's "No. 12 · Coral Reef" line,
// or null for none. bow: the gift's ribbon on the card's top edge.
export const PICTURE_LAYOUTS = Object.freeze({
  gift: Object.freeze({ W: 1080, H: 1350, card: { x: 60, y: 96, w: 960, h: 1190, r: 60, inner: 48 }, stage: { x: 110, y: 330, w: 860, h: 560 }, portrait: 840, textWidth: 820, bow: true,
    kicker: [214, 44, 30], name: [300, 84, 34], alone: [262, 72, 34], animal: [966, 52, 30], gift: [1030, 50, 40, 26], facts: null, rule: [1142, 400], brand: [1200, 40, 28], foot: [1248, 30, 22] }),
  story: Object.freeze({ W: 1080, H: 1920, card: { x: 60, y: 230, w: 960, h: 1410, r: 64, inner: 52 }, stage: { x: 110, y: 470, w: 860, h: 640 }, portrait: 840, textWidth: 820, bow: false,
    kicker: [336, 44, 30], name: [424, 84, 34], alone: [384, 72, 34], animal: [1196, 52, 30], gift: [1262, 50, 40, 26], facts: [1376, 32, 24], rule: [1440, 400], brand: [1510, 40, 28], foot: [1562, 30, 22] }),
  square: Object.freeze({ W: 1080, H: 1080, card: { x: 40, y: 40, w: 1000, h: 1000, r: 56, inner: 44 }, stage: { x: 90, y: 226, w: 900, h: 480 }, portrait: 720, textWidth: 880, bow: false,
    kicker: [118, 40, 28], name: [196, 72, 32], alone: [160, 64, 32], animal: [772, 48, 28], gift: [830, 46, 38, 24], facts: null, rule: [906, 400], brand: [958, 36, 26], foot: [1002, 28, 20] }),
});
export const W = PICTURE_LAYOUTS.gift.W, H = PICTURE_LAYOUTS.gift.H;
const SANS = (px, weight = 'normal') => `${weight} ${px}px Figtree, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`;
const SERIF = (px) => `${px}px "Young Serif", Georgia, "Times New Roman", serif`;

function roundedBox(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// A ribbon bow sitting on the card's top edge, centred on x.
function drawBow(ctx, x, y) {
  const red = ctx.createLinearGradient(x - 150, y - 80, x + 150, y + 80);
  red.addColorStop(0, '#e2514a'); red.addColorStop(0.5, '#b8322e'); red.addColorStop(1, '#e85c50');
  ctx.save();
  ctx.lineJoin = 'round';
  // The two tails, behind the loops: short, so they stay clear of the words under the bow.
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + s * 8, y + 8); ctx.lineTo(x + s * 78, y + 50); ctx.lineTo(x + s * 62, y + 50); ctx.lineTo(x + s * 66, y + 64); ctx.lineTo(x - s * 6, y + 18);
    ctx.closePath(); ctx.fillStyle = '#9e2a27'; ctx.fill();
  }
  // The loops.
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + s * 60, y - 95, x + s * 165, y - 70, x + s * 140, y + 4);
    ctx.bezierCurveTo(x + s * 120, y + 62, x + s * 50, y + 30, x, y);
    ctx.closePath(); ctx.fillStyle = red; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#f0d995'; ctx.stroke();
    // The fold inside each loop.
    ctx.beginPath(); ctx.moveTo(x + s * 18, y - 6); ctx.quadraticCurveTo(x + s * 80, y - 46, x + s * 118, y - 8);
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(90, 16, 14, 0.45)'; ctx.stroke();
  }
  // The knot.
  roundedBox(ctx, x - 26, y - 24, 52, 48, 14); ctx.fillStyle = '#c73a35'; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#f0d995'; ctx.stroke();
  ctx.restore();
}

// A light scatter of snowflake dots behind the card, the same every time.
function drawSnow(ctx, W, H) {
  let a = 20261224;
  const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  ctx.save();
  for (let i = 0; i < 70; i++) {
    const x = rnd() * W, y = rnd() * H, r = 1.5 + rnd() * 3.5;
    ctx.globalAlpha = 0.25 + rnd() * 0.45; ctx.fillStyle = '#e7f2ef';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// Lines of words broken to fit maxWidth at the current font, at most `max` lines (the last keeps what is left).
function wrap(ctx, text, maxWidth, max = 2) {
  const words = String(text).split(/\s+/).filter(Boolean), lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(next).width > maxWidth && lines.length < max - 1) { lines.push(line); line = w; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// Waits a moment for the brand fonts (site.css declares them); without them the picture uses the phone's own sans and serif.
async function fontsReady() {
  if (typeof document === 'undefined' || !document.fonts?.load) return;
  const wait = Promise.all([document.fonts.load(SERIF(80)), document.fonts.load(SANS(40, '700')), document.fonts.load(SANS(40))]).catch(() => {});
  await Promise.race([wait, new Promise((r) => setTimeout(r, 1500))]);
}

// Draws the picture onto a new canvas and returns the canvas. row: the creature as the site holds it (its `paid` is what it wears).
// lines: giftLines(...), or the post maker's own (which may set zoom, to draw a creature with nothing beside it larger), or the keepsake's
// (shop-keepsake.js keepsakeLines, which may add `facts`). layout: one of PICTURE_LAYOUTS (the gift picture unless said).
// scale: draws the same picture that many times bigger, every line and shape sharp (the print picture, js/print-card.js, uses 3).
export async function drawGiftPicture(row, lines, layout = PICTURE_LAYOUTS.gift, { scale = 1 } = {}) {
  const [{ drawPortrait, fitFont }] = await Promise.all([import('./portrait.js'), fontsReady()]);
  const L = layout, { W, H } = L;
  const canvas = document.createElement('canvas'); canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  if (scale !== 1) ctx.scale(scale, scale);
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0f4a66'); sky.addColorStop(1, '#071b28');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  if (lines.christmas) drawSnow(ctx, W, H);

  const CARD = L.card, STAGE = L.stage, TEXT_WIDTH = L.textWidth;
  const gold = ctx.createLinearGradient(CARD.x, CARD.y, CARD.x + CARD.w, CARD.y + CARD.h);
  gold.addColorStop(0, '#e8c777'); gold.addColorStop(0.45, '#a47e2c'); gold.addColorStop(1, '#f0d995');
  roundedBox(ctx, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r); ctx.fillStyle = gold; ctx.fill();
  roundedBox(ctx, CARD.x + 14, CARD.y + 14, CARD.w - 28, CARD.h - 28, CARD.inner); ctx.fillStyle = '#0e3144'; ctx.fill();
  ctx.save();
  roundedBox(ctx, STAGE.x, STAGE.y, STAGE.w, STAGE.h, 36); ctx.clip();
  const water = ctx.createRadialGradient(W / 2, STAGE.y + STAGE.h / 2, 0, W / 2, STAGE.y + STAGE.h / 2, 520);
  water.addColorStop(0, '#2a8aa4'); water.addColorStop(1, '#0a2c3f');
  ctx.fillStyle = water; ctx.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
  drawPortrait(ctx, row, { x: W / 2, y: STAGE.y + STAGE.h / 2, width: L.portrait * (lines.zoom || 1) });
  ctx.restore();
  if (L.bow) drawBow(ctx, W / 2, CARD.y + 6);

  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const line = (text, [y, maxPx, minPx], fontFor, color) => {
    ctx.font = fontFor(fitFont(ctx, text, fontFor, TEXT_WIDTH, maxPx, minPx));
    ctx.fillStyle = color;
    ctx.fillText(text, W / 2, y);
  };
  // Above the creature: "A Christmas gift for" and the name. With no name, the words sit lower, in the middle of that space.
  if (lines.name) {
    line(lines.kicker, L.kicker, (px) => SANS(px, '700'), '#f0d995');
    line(lines.name, L.name, SERIF, '#e7f2ef');
  } else line(lines.kicker, L.alone, SERIF, '#f0d995');
  // Under it: the animal, and what it's now wearing or has with it (over two lines if it must).
  line(lines.animal, L.animal, (px) => SANS(px, '600'), '#e7f2ef');
  if (lines.gift) {
    const [y, gap, maxPx, minPx] = L.gift;
    ctx.font = SANS(maxPx);
    const parts = wrap(ctx, lines.gift, TEXT_WIDTH, 2);
    parts.forEach((t, i) => line(t, [y + i * gap, maxPx, minPx], (px) => SANS(px), '#f0d995'));
  }
  // The keepsake's resident number and home, where the layout has room for them.
  if (lines.facts && L.facts) line(lines.facts, L.facts, (px) => SANS(px), '#9fd3de');
  ctx.fillStyle = 'rgba(232, 199, 119, 0.45)'; ctx.fillRect(W / 2 - L.rule[1] / 2, L.rule[0], L.rule[1], 3);
  line('In The Ocean of Us', L.brand, (px) => SANS(px, '700'), '#e7f2ef');
  if (lines.foot) line(lines.foot, L.foot, (px) => SANS(px), '#9fd3de');
  return canvas;
}

// The picture's words for a screen reader: "A Christmas gift for Sarah K.: an axolotl in The Ocean of Us, now with a Santa hat."
export function altText(lines) {
  const animal = animalWords(lines.animal);
  const article = /^(?!uni|eu|ure)[aeiou]/i.test(animal) ? 'an' : 'a';
  return `${[lines.kicker, lines.name].filter(Boolean).join(' ')}: ${article} ${animal} in The Ocean of Us${lines.gift ? `, ${lines.gift.charAt(0).toLowerCase()}${lines.gift.slice(1)}` : ''}.`;
}
