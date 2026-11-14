// The sheet that slides up over the ocean with a creature's card. A hidden name shows only to a visitor who found it by exact name (known).
import { secretToLink } from '../core/site-find.js';
import { cardPath, showThumb } from '../core/site-names.js';
import { fitText } from './card.js';
import { nameLabel, isHiddenRow, decorateHref, DECORATE, tryOnLinks, TRY_ON_TITLE, NEW_YEAR_OPEN } from './name-label.js';
import { recall } from './memory.js';
import { countTaps } from './steps.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

// For a visitor who hasn't found a creature of their own on this phone: tapping a creature is the first thing the tip asks them to do.
function joinLine() {
  const p = el('p', 'sheet-join', 'Want one? ');
  const a = el('a', '', 'Comment an animal on any Reel');
  a.href = 'https://www.instagram.com/the_ocean_of_us/';
  p.append(a, '.');
  return p;
}

// known: { username, nickname, secret } when the visitor typed the name, so the card link can carry the full name (#k=).
// Never for a hidden person: a link can be copied. Their card finds the visitor's own last-found instead.
export function showSheet(row, known = null) {
  const sheet = document.getElementById('sheet');
  const close = el('button', 'sheet-close', '×');
  close.type = 'button'; close.setAttribute('aria-label', 'Close'); close.addEventListener('click', hideSheet);

  const pic = el('span', 'pic');
  const img = el('img'); img.alt = ''; img.width = 256; img.height = 170; showThumb(img, row.key);
  img.addEventListener('error', () => img.replaceWith(el('span', 'ph')), { once: true });
  pic.append(img);

  const name = el('h2', 'sheet-name', known ? nameLabel(known.username) : nameLabel(row.name));
  const nick = known?.nickname ? el('p', 'sheet-nick', known.nickname) : null;
  const facts = el('p', 'sheet-facts', [row.speciesLabel, row.zoneLabel, `No. ${row.slot + 1}`, row.founder ? 'Founder' : ''].filter(Boolean).join(' · '));
  const personLink = known && !isHiddenRow(row) ? `k=${secretToLink(known.secret)}` : '';
  const link = el('a', 'button see-card', 'See its card');
  link.href = cardPath(row.key) + (personLink ? `#${personLink}` : '');
  const actions = el('div', 'sheet-actions');
  if (known) { // whoever typed a name is most likely looking for their own creature, so sharing it is one tap away. Share stays after the #, so it is never sent.
    const share = el('a', 'button share-card', 'Share it');
    share.href = `${cardPath(row.key)}#${personLink ? `${personLink}&` : ''}share=1`;
    link.classList.add('ghost');
    actions.append(share);
  }
  actions.append(link);
  // While the New Year card is on (the page carries NEW_YEAR_META), someone who found their creature gets it one tap away too.
  if (known && document.querySelector('meta[name="ocean-new-year"][content="on"]')) {
    const card = el('a', 'button new-year-open', NEW_YEAR_OPEN);
    card.href = `${cardPath(row.key)}#${personLink ? `${personLink}&` : ''}newyear=1`;
    actions.append(card);
  }
  // A quiet "Decorate it" under the buttons whenever the sheet knows whose creature it is (`known`: a name typed in Find, the person's own
  // #k= link on a ?c= arrival, or this phone's remembered find of it), never for one only tapped. Only for a shown name, Instagram or
  // Facebook (decorateHref), and only when the shop is open (its tab is in the bar).
  const shopTab = known && document.querySelector('nav.tabs a[href$="shop/"]');
  const decorate = shopTab ? decorateHref(row, shopTab.getAttribute('href')) : null;
  let decorateLine = null, tryOn = null;
  if (decorate) {
    decorateLine = el('p', 'sheet-decorate');
    const a = el('a', '', DECORATE); a.href = decorate;
    decorateLine.append(a);
    tryOn = tryOnRow(tryOnLinks(row, shopTab.getAttribute('href')));
  }

  sheet.replaceChildren(close, pic, name, ...(nick ? [nick] : []), facts, actions, ...(tryOn ? [tryOn] : []), ...(decorateLine ? [decorateLine] : []), ...(known || recall('last-found') ? [] : [joinLine()]));
  sheet.hidden = false;
  fitText(name, 26, 12); // needs the sheet on screen, to measure
  if (nick) fitText(nick, 18, 11);
  requestAnimationFrame(() => sheet.classList.add('up'));
}

// "Try one on": small pictures of a few shop items, each opening the shop with this creature wearing it (name-label.js tryOnLinks).
// A tap adds one to the day's total of Try one on taps (js/steps.js).
function tryOnRow(links) {
  if (!links.length) return null;
  countTaps('.try-on-item', 'try-on');
  const box = el('nav', 'try-on'); box.setAttribute('aria-label', TRY_ON_TITLE);
  const row = el('div', 'try-on-row');
  for (const { id, label, href, img } of links) {
    const a = el('a', `try-on-item${id === 'spotlight' ? ' try-on-spot' : ''}`); a.href = href;
    const pic = el('img'); pic.src = img; pic.alt = ''; pic.width = 56; pic.height = 56; pic.loading = 'lazy'; pic.decoding = 'async';
    a.append(pic, el('span', '', label));
    row.append(a);
  }
  box.append(el('p', 'try-on-title', TRY_ON_TITLE), row);
  return box;
}

export function hideSheet() {
  const sheet = document.getElementById('sheet');
  sheet.classList.remove('up');
  sheet.hidden = true;
}
