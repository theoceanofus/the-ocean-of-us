// The share screen on a creature's card: a Story-sized picture to save and a link to copy (spec 2026-11-08, "Share screen").
// A website can't post to a Story, so the picture is drawn here on the phone (nothing is fetched once the page is open) and shown as a
// real image to press and hold. Nothing in this file sends the link anywhere; a send only adds one to the day's total (js/steps.js).
import { nameLabel, isHiddenRow, hiddenTitle } from './name-label.js';
import { count } from './steps.js';

// Whether pressing and holding a picture saves it inside Instagram's own browser, per phone type. Stage 4's phone test on the owner's phones
// decides these; a false one makes that phone's Instagram browser say "Open this page in Safari or Chrome" instead of showing the picture.
export const PRESS_AND_HOLD_WORKS = { iphone: true, android: true };

export const isInstagramBrowser = (ua) => /Instagram/i.test(ua || '');
export const isIPhone = (ua) => /iPhone|iPad|iPod/i.test(ua || '');
export const pressAndHoldWorks = (ua) => (isIPhone(ua) ? PRESS_AND_HOLD_WORKS.iphone : PRESS_AND_HOLD_WORKS.android);

// What to do with the picture, in order, under it on the share screen. Nothing here promises that we'll reshare anything.
export const SHARE_STEPS = Object.freeze([
  'Press and hold the picture to save it.',
  'Add it to your Story.',
  'Tag @the_ocean_of_us. Then tap Copy my link and paste it into a link sticker, so friends can watch it swim.',
]);
// The end of the picture: a question friends answer, then where to answer it.
export const STORY_QUESTION = 'What animal would you be?';
export const STORY_ANSWER = ['Comment it on any ', '@the_ocean_of_us', ' Reel'];
export const LINK_COPIED_TEXT = 'Link copied. Paste it into a Story link sticker or a message.';
export const OPEN_ELSEWHERE_TEXT = 'Open this page in Safari or Chrome to save your picture';
// "Send to a friend" (brand report, 2026-11-13): a send is what spreads the ocean, and seeing yourself in it is what people send. The
// message works for anyone's creature, and every send asks the friend to join.
export const SEND_COPIED_TEXT = 'Message copied. Paste it to a friend.';
const speciesWords = (label) => {
  const s = String(label || 'creature'), first = s.split(' ')[0];
  return first.slice(1) === first.slice(1).toLowerCase() ? s.charAt(0).toLowerCase() + s.slice(1) : s; // "Great white shark" -> "great white shark", "SpongeBob" stays
};
export const sendText = (row) => `Look at this ${speciesWords(row?.speciesLabel)} in The Ocean of Us! Every creature is a real person. Comment an ocean animal on their Reels and you'll be in it too.`;

const W = 1080, H = 1920, MARGIN = 110, TEXT_WIDTH = W - 2 * MARGIN;
const SANS = (px, weight = 'normal') => `${weight} ${px}px -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`;

// Who the visitor knows, for sharing. A hidden person never comes out of the site: not on the picture and not in a link, even for someone who typed their name.
const knownToShare = (row) => (isHiddenRow(row) ? null : window.cardKnown);

// What the picture shows as the name: the name and nickname when the visitor holds them, otherwise the name and no nickname.
const shownName = (row) => {
  const known = knownToShare(row);
  return known ? { name: nameLabel(known.username), nickname: known.nickname || '' } : { name: nameLabel(row.name), nickname: '' };
};

// The look they asked for, in a few words for the Story picture: ['Wearing a pink bow', 'On a skateboard', 'Glowing'], most noticeable first.
// It reads the public row's extras only, which never hold the nickname. `colours`: COLOURS from core/species.js (name -> hex), passed in so
// this runs without the built site's core/ folder; a colour it can't name is left out and the thing is still said.
const WORN = { bow: 'bow', crown: 'crown', pirate_hat: 'pirate hat', party_hat: 'party hat', disco_hat: 'disco hat', glasses: 'glasses', cap: 'cap', jersey: 'jersey', unicorn_horn: 'unicorn horn', headphones: 'headphones',
  top_hat: 'top hat', cowboy_hat: 'cowboy hat', wizard_hat: 'wizard hat', propeller_hat: 'propeller hat', flower: 'flower on its head', castle: 'castle on its head' };
const HELD = { sword: 'sword' }, RIDDEN = { skateboard: 'skateboard' }, MARKED = { swirl: 'swirl', rose: 'rose' };
const NO_ARTICLE = new Set(['glasses', 'headphones', 'diving gear']);
export function lookParts(ex, colours = {}) {
  if (!ex || typeof ex !== 'object') return [];
  const colourOf = (hex) => (typeof hex === 'string' ? Object.keys(colours).find((k) => colours[k].toLowerCase() === hex.toLowerCase()) ?? '' : '');
  const thing = (noun, colour = '') => {
    const words = [colour, noun].filter(Boolean).join(' ');
    return NO_ARTICLE.has(noun) ? words : `${/^(?:[aeio]|u(?!ni))/i.test(words) ? 'an' : 'a'} ${words}`;
  };
  const upper = (s) => s[0].toUpperCase() + s.slice(1);
  const out = [], worn = [];
  // Team gear comes as two colours and a rainbow cap as three (app/core/extras.js), so neither is named one colour.
  if (WORN[ex.wear]) worn.push(thing(WORN[ex.wear], Array.isArray(ex.wearColors) ? (ex.wearColors.length >= 3 ? 'rainbow' : 'team') : colourOf(ex.wearColor)));
  if (ex.cape === true) worn.push(thing('cape', colourOf(ex.capeColor)));
  if (ex.scarf === true) worn.push(thing('scarf', colourOf(ex.scarfColor)));
  if (ex.goggles === true) worn.push(thing('diving gear'));
  if (ex.monocle === true) worn.push(thing('monocle'));
  if (worn.length) out.push(`Wearing ${worn.join(' and ')}`);
  if (HELD[ex.hold]) out.push(`Holding ${thing(HELD[ex.hold])}`);
  if (RIDDEN[ex.ride]) out.push(`On ${thing(RIDDEN[ex.ride], colourOf(ex.rideColor))}`);
  if (ex.albino === true) out.push('Albino');
  if (ex.galaxy === true) out.push('Galaxy look');
  if (ex.glow === true) out.push('Glowing');
  if (ex.glowSpots === true || ex.glowSpots === 'rainbow' || ex.glowSpots === 'twinkle') out.push(ex.glowSpots === 'rainbow' ? 'Rainbow glowing spots' : ex.glowSpots === 'twinkle' ? 'Twinkling spots' : 'Glowing spots');
  if (ex.sparkle === true) out.push('Sparkling');
  if (ex.baby === true) out.push('Baby');
  const eyes = colourOf(ex.eyeColor);
  if (ex.bigEyes === true || eyes) out.push(upper([ex.bigEyes === true ? 'big' : '', eyes, 'eyes'].filter(Boolean).join(' ')));
  if (typeof ex.cheeks === 'string') out.push(upper(`${colourOf(ex.cheeks) || 'blushing'} cheeks`));
  if (MARKED[ex.mark]) out.push(upper([colourOf(ex.markColor), MARKED[ex.mark], 'markings'].filter(Boolean).join(' ')));
  if (ex.lashes === true) out.push('Long eyelashes');
  if (ex.scars === true) out.push('Battle scars');
  if (ex.coral === true) out.push('Coral growing on it');
  if (ex.big === true) out.push('Extra big');
  return out;
}

// The page address for a Story link sticker: no existing hash, and #k= only when the visitor knows the name and it isn't hidden.
// (site-find.js is loaded on use: in the built site it sits beside js/, and this file's checks of Instagram detection run without it.)
export async function shareLink(row) {
  const known = knownToShare(row);
  const { secretToLink } = known ? await import('../core/site-find.js') : {};
  return location.href.split('#')[0] + (known ? `#k=${secretToLink(known.secret)}` : '');
}

// A rounded box, as a path. Written out because roundRect is missing on older phones.
export function roundedBox(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
const waterGlow = (ctx, cx, cy, radius) => {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0, '#2a8aa4'); g.addColorStop(1, '#0a2c3f');
  return g;
};

// The 1080x1920 Story picture as a JPEG data URL: the collector card, kept between y 230 and 1640 because Instagram's own buttons cover the
// top and bottom of a Story. `rarity`: the card's "1 of 38" text, left out when empty.
// Under the creature: the name, the nickname for a visitor who holds it, the animal, the look they asked for and the rarity, centred together.
// At the bottom, a question for the friends who see the Story and where to answer it.
export async function drawStoryPicture(row, rarity = '') {
  const [{ drawPortrait, fitFont }, { COLOURS }] = await Promise.all([
    import('./portrait.js'),
    import('../core/species.js').catch(() => ({ COLOURS: {} })), // only names the colours in the look line
  ]);
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0f4a66'); sky.addColorStop(1, '#071b28');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  const CARD = { x: 60, y: 230, w: 960, h: 1410 }, STAGE = { x: 110, y: 430, w: 860, h: 570 };
  const gold = ctx.createLinearGradient(CARD.x, CARD.y, CARD.x + CARD.w, CARD.y + CARD.h);
  gold.addColorStop(0, '#e8c777'); gold.addColorStop(0.45, '#a47e2c'); gold.addColorStop(1, '#f0d995');
  roundedBox(ctx, CARD.x, CARD.y, CARD.w, CARD.h, 64); ctx.fillStyle = gold; ctx.fill();
  roundedBox(ctx, CARD.x + 14, CARD.y + 14, CARD.w - 28, CARD.h - 28, 52); ctx.fillStyle = '#0e3144'; ctx.fill();
  ctx.save();
  roundedBox(ctx, STAGE.x, STAGE.y, STAGE.w, STAGE.h, 36); ctx.clip();
  ctx.fillStyle = waterGlow(ctx, W / 2, STAGE.y + STAGE.h / 2, 520); ctx.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
  ctx.restore();

  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  // Each line shrinks, never below minPx, until it fits the card.
  const line = (text, y, fontFor, maxPx, minPx, color) => {
    ctx.font = fontFor(fitFont(ctx, text, fontFor, TEXT_WIDTH, maxPx, minPx));
    ctx.fillStyle = color;
    ctx.fillText(text, W / 2, y);
  };
  const { name, nickname } = shownName(row);
  line('I live in The Ocean of Us', 325, (px) => SANS(px, '700'), 60, 36, '#f0d995');
  line([`No. ${row.slot + 1}`, row.zoneLabel, row.founder ? 'Founder' : ''].filter(Boolean).join(' \u00b7 '), 392, (px) => SANS(px), 38, 26, '#9fd3de');
  drawPortrait(ctx, row, { x: W / 2, y: STAGE.y + STAGE.h / 2, width: 790 });

  // The look: as many of the first three parts as fit on one line at 30px or more.
  const looks = lookParts(row.extras, COLOURS);
  let look = '';
  for (let n = Math.min(3, looks.length); n > 0 && !look; n--) {
    const text = looks.slice(0, n).join(' \u00b7 ');
    ctx.font = SANS(30);
    if (ctx.measureText(text).width <= TEXT_WIDTH || n === 1) look = text;
  }
  const RULE = 1405; // the gold line between the card's words and the question
  // [text, font, largest px, smallest px, colour], then the size it fits at. Lines are spaced by that size: 3/4 of it above the baseline,
  // 1/4 below, and a gap, so a long name shrunk to fit doesn't leave a hole under it.
  const middle = [
    [name, (px) => SANS(px, 'bold'), 96, 24, '#e7f2ef'], // sans: Georgia draws 0 like o and 1 like I, and these are usernames
    nickname && [nickname, (px) => SANS(px), 52, 24, '#b2e4d7'],
    [row.speciesLabel, (px) => SANS(px, '600'), 48, 24, '#e7f2ef'],
    look && [look, (px) => SANS(px), 38, 30, '#f0d995'],
    rarity && [rarity, (px) => SANS(px), 40, 24, '#9fd3de'],
  ].filter(Boolean).map((l) => [...l, fitFont(ctx, l[0], l[1], TEXT_WIDTH, l[2], l[3])]);
  const GAP = 20, up = (px) => px * 0.75, down = (px) => px * 0.25;
  const steps = middle.map((l, i) => (i ? down(middle[i - 1][5]) + GAP + up(l[5]) : 0));
  const tall = up(middle[0][5]) + steps.reduce((a, b) => a + b, 0) + down(middle[middle.length - 1][5]);
  const top = STAGE.y + STAGE.h;
  let y = top + (RULE - top - tall) / 2 + up(middle[0][5]);
  middle.forEach(([text, fontFor, maxPx, minPx, color], i) => { y += steps[i]; line(text, y, fontFor, maxPx, minPx, color); });

  ctx.fillStyle = 'rgba(232, 199, 119, 0.45)'; ctx.fillRect(W / 2 - 220, RULE, 440, 3);
  line(STORY_QUESTION, RULE + 92, (px) => SANS(px, '700'), 62, 40, '#e7f2ef');
  // "Comment it on any @the_ocean_of_us Reel", with the handle picked out so friends know who to look for. One size for the whole line.
  const runs = [[STORY_ANSWER[0], 'normal', '#b2e4d7'], [STORY_ANSWER[1], '700', '#f0d995'], [STORY_ANSWER[2], 'normal', '#b2e4d7']];
  const widthAt = (px) => runs.reduce((w, [text, weight]) => { ctx.font = SANS(px, weight); return w + ctx.measureText(text).width; }, 0);
  let px = 40;
  while (px > 26 && widthAt(px) > TEXT_WIDTH) px--;
  let x = W / 2 - widthAt(px) / 2;
  ctx.textAlign = 'left';
  for (const [text, weight, color] of runs) { ctx.font = SANS(px, weight); ctx.fillStyle = color; ctx.fillText(text, x, RULE + 164); x += ctx.measureText(text).width; }
  ctx.textAlign = 'center';
  return canvas.toDataURL('image/jpeg', 0.85);
}

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

export function fileFromDataUrl(dataUrl, name = 'the-ocean-of-us.jpg') {
  const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0));
  return new File([bytes], name, { type: 'image/jpeg' });
}

export const canShareFile = (file) => {
  try { return typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] }); } catch { return false; }
};

// Copies the link; if the clipboard is refused, shows it selected so it can be copied by hand.
async function copyLink(root, status, row) {
  const link = await shareLink(row);
  try { await navigator.clipboard.writeText(link); status.textContent = LINK_COPIED_TEXT; return; } catch { /* fall through */ }
  let input = root.querySelector('input');
  if (!input) { input = el('input', 'share-link'); input.readOnly = true; input.setAttribute('aria-label', 'Your link'); status.after(input); }
  input.value = link;
  input.focus(); input.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { /* the link stays selected */ }
  status.textContent = copied ? LINK_COPIED_TEXT : 'Select the link and copy it.';
}

export function openShare(row, rarity = '') {
  document.getElementById('share-screen')?.remove();
  const ua = navigator.userAgent || '';
  const opener = document.activeElement;
  const root = el('div'); root.id = 'share-screen';
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Share it');
  const panel = el('div', 'share-panel');
  const picture = el('div', 'share-picture');
  const status = el('p', 'share-status'); status.setAttribute('role', 'status');
  const sendBtn = el('button', 'button share-send', 'Send to a friend'); sendBtn.type = 'button';
  const saveBtn = el('button', 'button', 'Save or share picture'); saveBtn.type = 'button'; saveBtn.hidden = true;
  const copyBtn = el('button', 'button ghost', 'Copy my link'); copyBtn.type = 'button'; // Send to a friend is the main one
  const closeBtn = el('button', 'share-close', 'Close'); closeBtn.type = 'button';
  const buttons = el('div', 'share-buttons'); buttons.append(sendBtn, saveBtn, copyBtn);
  panel.append(picture, buttons, status, closeBtn);
  root.append(panel);

  const close = () => { root.remove(); document.removeEventListener('keydown', onKey); if (opener?.isConnected) opener.focus(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  copyBtn.addEventListener('click', () => { copyLink(root, status, row); });
  // The link is made as the screen opens, so the tap can open the phone's share sheet at once (it must, straight from the tap).
  let sendLink = null;
  shareLink(row).then((l) => { sendLink = l; }).catch(() => {});
  sendBtn.addEventListener('click', async () => {
    if (!sendLink) { status.textContent = 'One moment…'; return; }
    count('send'); // the day's total of sends (js/steps.js): only that it happened
    const text = sendText(row);
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ text, url: sendLink }); status.textContent = ''; return; } catch (e) { if (e?.name === 'AbortError') return; }
    }
    // No share sheet (Instagram's own browser on Android): the message and link are copied, or shown to copy by hand.
    try { await navigator.clipboard.writeText(`${text} ${sendLink}`); status.textContent = SEND_COPIED_TEXT; return; } catch { /* fall through */ }
    let input = root.querySelector('input');
    if (!input) { input = el('input', 'share-link'); input.readOnly = true; input.setAttribute('aria-label', 'Your message'); status.after(input); }
    input.value = `${text} ${sendLink}`; input.focus(); input.select();
    status.textContent = 'Select the message and copy it.';
  });
  document.body.append(root);
  sendBtn.focus();

  if (isInstagramBrowser(ua) && !pressAndHoldWorks(ua)) {
    picture.append(el('p', 'share-note', OPEN_ELSEWHERE_TEXT));
    return;
  }
  const wait = el('p', 'share-wait', 'Making your picture...');
  picture.append(wait);
  drawStoryPicture(row, rarity).then((dataUrl) => {
    if (!root.isConnected) return;
    const img = el('img'); img.alt = `Your Story picture: ${isHiddenRow(row) ? hiddenTitle(row.speciesLabel) : `${shownName(row).name}'s ${row.speciesLabel} in The Ocean of Us`}`; img.width = 1080; img.height = 1920; img.src = dataUrl;
    wait.replaceWith(img);
    const steps = el('ol', 'share-steps');
    for (const step of SHARE_STEPS) steps.append(el('li', '', step));
    picture.append(steps);
    const file = fileFromDataUrl(dataUrl); // ready before the tap, so the tap only has to call share
    if (canShareFile(file)) {
      saveBtn.hidden = false;
      saveBtn.addEventListener('click', () => {
        navigator.share({ files: [file] }).catch((e) => { if (e?.name !== 'AbortError') status.textContent = 'Press and hold the picture to save it.'; });
      });
    }
  }).catch(() => {
    if (!root.isConnected) return;
    wait.replaceWith(el('p', 'share-note', "Your picture couldn't be made on this phone. You can still copy your link."));
  });
}
