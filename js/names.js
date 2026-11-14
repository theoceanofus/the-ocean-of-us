// names.json for every page that lists people. The file sits at the site root, next to js/.
export { unpackRow, matchAnimals, speciesCount, dailyOrder, zoneShelves, animalPeople } from '../core/site-names.js';

// Fetched once per page: the Find box's suggestions and the page's own lists share it. A failed fetch is forgotten, so Try again fetches afresh.
let asked = null;
export function loadNames() {
  if (!asked) {
    const p = fetch(new URL('../names.json', import.meta.url)).then((res) => {
      if (!res.ok) throw new Error(`names.json ${res.status}`);
      return res.json();
    });
    asked = p;
    p.catch(() => { if (asked === p) asked = null; });
  }
  return asked;
}

// Puts the "couldn't reach" message into el, with a button that calls retry.
export function showRetry(el, retry) {
  const p = document.createElement('p');
  p.textContent = "Couldn't reach the ocean, try again";
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'button'; b.textContent = 'Try again';
  b.addEventListener('click', retry);
  el.replaceChildren(p, b);
}
