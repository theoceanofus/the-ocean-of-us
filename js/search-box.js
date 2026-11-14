// The Find box. Works by itself, before the ocean or names.json have loaded. There's no form, so a name can never end up in the address.
import { nameLabel } from './name-label.js';

export const NOT_FOUND = "We couldn't find that exact name. Check the spelling. If you've only just commented, your creature may still be on its way. Most arrive within a day, and brand-new animals take a little longer because we design them from scratch. Not in yet? Comment an animal on any Reel to join.";

// A name with a space in it is most likely an Instagram display name, or a Facebook name typed in full, so say what each one needs.
export const notFoundText = (typed) => (/\S\s+\S/.test(String(typed ?? '')) ? NOT_FOUND.replace('Check the spelling.', 'On Instagram, use your username, the one after the @. On Facebook, use your first name and last initial, like Sarah K.') : NOT_FOUND);

// lookup(typed) resolves to hits: [{ key, username, nickname, secret }]. onError(retry) runs if it could not be reached.
// suggest (optional): names suggested as the name is typed, { load, match, thumb }. load() resolves to the suggestion index (suggestIndex over
// names.json) and is first called when a letter is typed; match(index, typed) is suggestNames; thumb(img, key) shows that creature's
// small picture in img (showThumb). They are passed in because this file is also loaded in Node, where the site's core/ folder isn't beside it.
export function attachFind({ input, button, lookup, onFound, onNotFound, onError, suggest: suggestFrom = null }) {
  const choice = document.createElement('div');
  choice.className = 'find-choice'; choice.hidden = true;
  input.parentElement.after(choice);
  let latest = 0; // pressing Find again replaces the earlier search

  const clearChoice = () => { choice.hidden = true; choice.replaceChildren(); };
  function showChoice(hits) {
    choice.replaceChildren(...hits.map((hit) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'button'; b.textContent = nameLabel(hit.username);
      b.addEventListener('click', () => { clearChoice(); onFound(hit); });
      return b;
    }));
    choice.hidden = false;
  }

  // key: set when a suggestion was chosen, so that one creature opens even if someone else's name reads the same ("Sarah K.").
  async function run(key = null) {
    const typed = input.value;
    if (!typed.trim()) return;
    const mine = ++latest;
    suggest?.close();
    input.blur(); // puts the phone keyboard away, so the card that slides up can be seen
    clearChoice();
    let hits;
    button.classList.add('busy'); button.setAttribute('aria-busy', 'true'); // the lookup is slow on purpose, so the button shows it is working
    try { hits = await lookup(typed); }
    catch { if (mine === latest) onError?.(() => run(key)); return; }
    finally { if (mine === latest) { button.classList.remove('busy'); button.removeAttribute('aria-busy'); } }
    if (mine !== latest) return;
    if (key) hits = hits.filter((h) => h.key === key); // a chosen suggestion opens only that creature, never someone hidden whose name reads the same
    if (!hits.length) onNotFound(typed);
    else if (hits.length === 1) onFound(hits[0]);
    else showChoice(hits);
  }

  // A chosen suggestion goes through the same exact-name lookup as Find, so it opens the card exactly as typing the name would.
  const suggest = suggestFrom ? attachSuggest({ input, ...suggestFrom, choose: (s) => { input.value = s.name; run(s.key); } }) : null;
  button.addEventListener('click', () => run());
  input.addEventListener('keydown', (e) => {
    if (e.isComposing) return; // Enter that confirms a word in a Japanese or Chinese keyboard is not Find
    if (suggest?.key(e)) return; // arrows, Escape, and Enter on a chosen suggestion
    if (e.key === 'Enter') { e.preventDefault(); run(); } // Enter with no suggestion chosen finds exactly what was typed, so a hidden name still works
  });
  return { run };
}

// The suggestions under the Find box, like a username search: a combobox with a listbox of up to six names. They come only from names.json,
// which holds only the names the site shows, so a hidden name is never suggested.
// Also used by the shop's name box (owner, 2026-11-12: "easy for people to search up usernames in shop like how the main site works").
export function attachSuggest({ input, load, match, thumb, choose }) {
  const list = document.createElement('ul');
  list.id = `${input.id || 'name'}-suggest`; list.className = 'find-suggest'; list.hidden = true;
  list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', 'Names in the ocean');
  const said = document.createElement('p'); // tells a screen reader how many names came up
  said.className = 'sr-only'; said.setAttribute('role', 'status');
  said.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap'; // hidden even before site.css arrives
  input.parentElement.append(list, said);
  for (const [k, v] of Object.entries({ role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': 'false', 'aria-controls': list.id })) input.setAttribute(k, v);
  let index = null, asked = null, shown = [], active = -1;

  // names.json is asked for once, at the first letter typed. If it can't be reached the box still finds by exact name, and the next letter asks again.
  const want = () => { asked ??= Promise.resolve().then(load).then((made) => { index = made; refresh(); }).catch(() => { asked = null; }); };

  function close() {
    shown = []; active = -1;
    input.removeAttribute('aria-activedescendant');
    if (list.hidden) return;
    list.hidden = true; list.replaceChildren(); said.textContent = '';
    input.setAttribute('aria-expanded', 'false');
  }

  function refresh() {
    if (document.activeElement !== input) { close(); return; }
    // The list drops down over the page only once site.css is in; until then (a slow first load) the box finds by exact name as before.
    if (getComputedStyle(list).position !== 'absolute') { close(); return; }
    const was = list.hidden, before = shown.map((s) => s.key).join();
    shown = index ? match(index, input.value) : [];
    if (!shown.length) { close(); return; }
    if (!was && shown.map((s) => s.key).join() === before) return; // the same names: nothing redrawn or said again, and a chosen one stays chosen
    active = -1; input.removeAttribute('aria-activedescendant');
    list.replaceChildren(...shown.map(option));
    list.hidden = false; input.setAttribute('aria-expanded', 'true');
    said.textContent = shown.length === 1 ? '1 suggestion' : `${shown.length} suggestions`;
    if (was) keepInView();
  }

  function option(s, i) {
    const li = document.createElement('li');
    li.id = `${list.id}-${i}`; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', 'false');
    const label = nameLabel(s.name);
    li.setAttribute('aria-label', s.speciesLabel ? `${label}, ${s.speciesLabel}` : label);
    const pic = document.createElement('span'); pic.className = 'sg-pic';
    if (thumb) {
      const img = document.createElement('img'); img.alt = ''; img.width = 48; img.height = 32; img.decoding = 'async'; thumb(img, s.key);
      img.addEventListener('error', () => img.remove(), { once: true });
      pic.append(img);
    }
    const name = document.createElement('span'); name.className = 'sg-name'; name.textContent = label;
    const kind = document.createElement('span'); kind.className = 'sg-kind'; kind.textContent = s.speciesLabel;
    const words = document.createElement('span'); words.className = 'sg-words'; words.append(name, kind);
    li.append(pic, words);
    li.addEventListener('click', () => pick(i));
    return li;
  }

  function move(i) {
    active = i;
    [...list.children].forEach((li, j) => li.setAttribute('aria-selected', String(j === i)));
    input.setAttribute('aria-activedescendant', list.children[i].id);
    list.children[i].scrollIntoView({ block: 'nearest' });
  }

  function pick(i) {
    const s = shown[i];
    close();
    if (s) choose(s);
  }

  // A Find box low on the page (a creature's card) moves up when the list opens, so the names aren't left under the phone's keyboard.
  function keepInView() {
    const vv = window.visualViewport;
    const top = vv ? vv.offsetTop : 0, bottom = top + (vv ? vv.height : innerHeight);
    const over = list.getBoundingClientRect().bottom + 8 - bottom;
    const room = input.getBoundingClientRect().top - top - 8;
    if (over > 0 && room > 0) scrollBy(0, Math.min(over, room));
  }

  // Returns true when it has dealt with the key.
  function key(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (list.hidden) refresh();
      if (list.hidden) return false;
      e.preventDefault();
      const n = shown.length;
      move(e.key === 'ArrowDown' ? (active + 1) % n : active <= 0 ? n - 1 : active - 1);
      return true;
    }
    if (e.key === 'Escape' && !list.hidden) { e.preventDefault(); e.stopPropagation(); close(); return true; } // only the list closes, not a card under it
    if (e.key === 'Enter' && !list.hidden && active >= 0) { e.preventDefault(); pick(active); return true; }
    if (e.key === 'Tab') close();
    return false;
  }

  input.addEventListener('input', () => { want(); refresh(); });
  input.addEventListener('focus', () => { if (index && input.value.trim()) refresh(); });
  // Pressing a name must not take the focus off the box first, or the list would close before the press lands.
  list.addEventListener('mousedown', (e) => e.preventDefault());
  input.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== input) close(); }, 200));
  return { key, close };
}
