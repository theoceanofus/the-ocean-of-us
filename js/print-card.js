// The print picture (physical keepsakes report, 14 Nov 2026): a free, big square picture of a creature to print at home, offered on its
// card before Christmas to find out whether families want a printed creature at all. It is the keepsake's square picture drawn three times
// as big (3240 x 3240, about 27 cm at 300 dots an inch and inside every phone's canvas limit), in the creature's look as it is now. Like the
// keepsake it is drawn here on the phone, names only what the card shows (a hidden name stays off) and sends nothing about anyone: making
// one adds one to the day's "print" total (js/steps.js), which is only that it happened.
// The pure helpers at the top are tested in Node; the card's builder (tools/site2-pages.mjs) uses PRINT_TEXT for the button.
import { giftList, drawGiftPicture, altText, PICTURE_LAYOUTS } from './shop-gift-picture.js';
import { keepsakeName, choiceOf } from './shop-keepsake.js';
import { isInstagramBrowser, pressAndHoldWorks, OPEN_ELSEWHERE_TEXT } from './share.js';
import { count } from './steps.js';

export const PRINT_SCALE = 3;
export const PRINT_FILE = 'the-ocean-of-us-print.jpg';
// Every word the print picture and its screen show.
export const PRINT_TEXT = Object.freeze({
  open: 'Print it at home',
  blurb: 'A big picture of this creature, free to print.',
  howTo: 'Print it on photo paper, 10 cm square or bigger. Ask a grown-up to help.',
  save: 'Save the picture',
  hold: 'Or press and hold the picture to save it.',
  making: 'Making the picture…',
  failed: "The picture couldn't be made on this phone.",
  close: 'Close',
  dialog: 'Picture to print',
  kicker: 'Meet',
  kickerHidden: 'A resident of the ocean',
  with: 'With ',
  foot: 'theoceanofus.pages.dev',
});

// The words on the picture. name: as the site shows it, or null for a hidden name, which is then left off. choice: what it wears now
// (the card's print button carries it, as a keepsake chip does), or null. With nothing on, its number and home go where the items would.
export function printLines({ name, speciesLabel, choice = null, slot = null, zoneLabel = '', founder = false }) {
  const T = PRINT_TEXT, list = giftList(choice?.items ?? []);
  const facts = [Number.isInteger(slot) ? `No. ${slot + 1}` : '', zoneLabel, founder ? 'Founder' : ''].filter(Boolean).join(' · ');
  return {
    kicker: name ? T.kicker : T.kickerHidden,
    name: name || '',
    animal: speciesLabel || '',
    gift: list ? `${T.with}${list}` : facts,
    foot: T.foot,
    christmas: (choice?.kinds ?? []).includes('christmas'),
  };
}

// Draws the print picture and returns the canvas.
export const drawPrint = (row, lines) => drawGiftPicture(row, lines, PICTURE_LAYOUTS.square, { scale: PRINT_SCALE });

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

// The screen with the picture, the how-to, Save (the phone's share sheet where it takes a file, otherwise a download) and Close. Inside
// Instagram's browser on a phone where press and hold doesn't save, it says to open the page in Safari or Chrome, as Share it does.
export function openPrint(row, button = document.getElementById('print-open')) {
  document.getElementById('print-screen')?.remove();
  const T = PRINT_TEXT, ua = navigator.userAgent || '', opener = document.activeElement;
  const root = el('div'); root.id = 'print-screen';
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', T.dialog);
  const panel = el('div', 'share-panel'), picture = el('div', 'share-picture print-picture');
  const status = el('p', 'share-status'); status.setAttribute('role', 'status');
  const saveBtn = el('button', 'button', T.save); saveBtn.type = 'button'; saveBtn.hidden = true;
  const closeBtn = el('button', 'share-close', T.close); closeBtn.type = 'button';
  const buttons = el('div', 'share-buttons'); buttons.append(saveBtn);
  panel.append(picture, el('p', 'share-note print-how', T.howTo), buttons, status, closeBtn);
  root.append(panel);
  let objectUrl = null;
  const close = () => { root.remove(); document.removeEventListener('keydown', onKey); if (objectUrl) URL.revokeObjectURL(objectUrl); if (opener?.isConnected) opener.focus(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.append(root);
  closeBtn.focus();
  count('print');

  if (isInstagramBrowser(ua) && !pressAndHoldWorks(ua)) { picture.append(el('p', 'share-note', OPEN_ELSEWHERE_TEXT)); return; }
  const wait = el('p', 'share-wait', T.making);
  picture.append(wait);
  const lines = printLines({ name: keepsakeName(row), speciesLabel: row.speciesLabel, choice: button ? choiceOf(button) : null, slot: row.slot, zoneLabel: row.zoneLabel, founder: !!row.founder });
  drawPrint(row, lines).then(async (canvas) => {
    if (!root.isConnected) return;
    // A file, not a data address: at this size a data address would hold the picture in memory twice over.
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    canvas.width = canvas.height = 1; // let the big canvas go
    if (!root.isConnected) return;
    if (!blob) throw new Error('no picture');
    objectUrl = URL.createObjectURL(blob);
    const file = new File([blob], PRINT_FILE, { type: 'image/jpeg' });
    const img = el('img'); img.width = 1080; img.height = 1080; img.src = objectUrl; img.alt = altText(lines);
    wait.replaceWith(img);
    buttons.after(el('p', 'share-note print-hold', T.hold));
    saveBtn.hidden = false;
    saveBtn.focus();
    saveBtn.addEventListener('click', async () => {
      try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; } } catch (e) { if (e?.name === 'AbortError') return; }
      const a = el('a'); a.href = objectUrl; a.download = PRINT_FILE; document.body.append(a); a.click(); a.remove();
    });
  }).catch(() => {
    if (!root.isConnected) return;
    wait.replaceWith(el('p', 'share-note', T.failed));
  });
}
