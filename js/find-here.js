// The Find box on every page except the ocean (Everyone, a creature's page, the not-found page): it looks the exact name up and opens
// that creature's card. The same exact-name lookup as the ocean's Find box, with the same suggestions as a name is typed.
// The site's address comes from where this file sits, so it works on a page at any depth.
import { attachFind, notFoundText } from './search-box.js';
import { lookupName, secretToLink } from '../core/site-find.js';
import { cardPath, showThumb, suggestIndex, suggestNames } from '../core/site-names.js';
import { loadNames, showRetry } from './names.js';
import { remember } from './memory.js';

const SITE = new URL('../', import.meta.url).href;

async function fetchBucket(bucket) {
  const res = await fetch(`${SITE}find/${bucket}.json`);
  if (res.status === 404) return null; // nobody's name lands in this file
  if (!res.ok) throw new Error(`find ${res.status}`);
  return res.json();
}

// input, button: the box and its Find button. msg: where "couldn't find that" or "try again" goes.
export function findHere({ input, button, msg }) {
  const finder = attachFind({
    input, button,
    lookup: (typed) => { msg.replaceChildren(); return lookupName(typed, fetchBucket); },
    // Names suggested as one is typed. names.json is fetched at the first letter, once, and shared with the page's own lists.
    suggest: { load: () => loadNames().then(suggestIndex), match: suggestNames, thumb: showThumb },
    // The card is opened with the person's own link (#k=), so it shows the full name and nickname. This phone remembers the find, as the
    // ocean's Find box does, so the ocean can offer to swim back to it.
    onFound: ({ key, username, nickname, secret }) => {
      const link = secretToLink(secret);
      remember('last-found', { key, username, nickname, secret: link });
      location.assign(`${SITE}${cardPath(key)}#k=${link}`);
    },
    onNotFound: (typed) => { msg.textContent = notFoundText(typed); },
    onError: (retry) => showRetry(msg, retry),
  });
  if (window.earlyFind && input.value.trim()) finder.run(); // Find was pressed before this script had arrived
  return finder;
}
