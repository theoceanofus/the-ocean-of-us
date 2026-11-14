// The start page (the Instagram bio link): finding your creature is the first thing on it, the way the Everyone tab does it, so nobody
// has to wait for the live ocean to load just to look themselves up. A phone that has found someone before gets a link back to them.
import { findHere } from './find-here.js';
import { recall } from './memory.js';
import { cardPath, showThumb } from '../core/site-names.js';
import { nameLabel } from './name-label.js';

const SITE = new URL('../', import.meta.url).href;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

findHere({ input: document.getElementById('name'), button: document.getElementById('find-btn'), msg: document.getElementById('find-msg') });

// The creature this phone last found by name, checked against its card first, so someone who has left isn't offered. The link never
// carries #k=: the card opens the full name from this phone's own memory, as it does for a hidden person.
export async function showLastFound() {
  const last = recall('last-found');
  if (!last?.key || !last.username || !/^[0-9a-f]{12}$/.test(last.key)) return null;
  const href = `${SITE}${cardPath(last.key)}`;
  try {
    const res = await fetch(href);
    if (!res.ok || !(await res.text()).includes('id="row"')) return null; // gone, or the page of someone who has left
  } catch { return null; }
  const a = el('a', 'last-found'); a.id = 'last-found'; a.href = href;
  const pic = el('span', 'pic');
  const img = el('img'); img.alt = ''; img.width = 256; img.height = 170;
  img.addEventListener('error', () => img.replaceWith(el('span', 'ph')), { once: true });
  showThumb(img, last.key);
  pic.append(img);
  const words = el('span', 'last-found-words');
  words.append(el('span', 'last-found-label', 'Last found'), el('span', 'last-found-name', nameLabel(last.username)));
  a.append(pic, words);
  document.getElementById('start-find-title').after(a);
  return a;
}
showLastFound();
