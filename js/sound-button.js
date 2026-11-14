// The speaker button on a creature's card and in the shop (owner, 2026-11-14: sounds beyond the ocean page). It is the ocean's own
// choice, remembered on this phone as ocean:sound, so turning sound on or off anywhere does it everywhere.
// The sounds themselves (js/sound.js) load only once the visitor turns sound on, or straight away when it was left on last time (so the
// first tap can bring it back), so a page with sound off loads nothing more for them. Every sound still goes through createSound's
// play(), which stays silent while sound is off, before a tap has allowed it, or while the page is hidden.
import { recall, remember } from './memory.js';

export const SOUND_KEY = 'sound'; // sound.js's own (a test keeps them equal), read here without loading it

// `button` is the speaker button (hidden in the page until this shows it). `load` gets the sound module (tests pass their own).
export function soundButton(button, { load = () => import('./sound.js'), AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext, win = globalThis } = {}) {
  let sound = null, loading = null;
  // made: the audio context a turn-on made inside the tap, so a phone that only allows sound from a tap still has it once the module is here.
  const make = (made) => (loading ||= load().then((m) => (sound = m.createSound({ recall, remember, bed: false, AudioCtx: made ? function Made() { return made; } : AudioCtx }))));
  const on = () => (sound ? sound.on : !!recall(SOUND_KEY, false));
  const show = () => {
    button.setAttribute('aria-pressed', String(on()));
    button.setAttribute('aria-label', on() ? 'Turn sound off' : 'Turn sound on');
    button.title = on() ? 'Sound on' : 'Sound off';
  };
  if (!AudioCtx) return { play: () => false, state: () => ({ on: false, loaded: false, running: false, played: [] }) }; // no Web Audio: no button
  button.hidden = false;
  show();
  if (on()) make().catch(() => {});
  button.addEventListener('click', async () => {
    if (sound) { sound.toggle(); show(); return; }
    const wanted = !on();
    remember(SOUND_KEY, wanted);
    show();
    if (!wanted) return;
    let made = null;
    try { made = new AudioCtx(); made.resume?.()?.catch?.(() => {}); } catch { made = null; }
    try { (await make(made)).wake(); } catch { /* the page carries on without sound */ }
  });
  // Sound left on comes back with the first tap anywhere on the page (phones allow it no sooner).
  win.addEventListener?.('pointerdown', (e) => { if (sound && !e.target?.closest?.('.sound')) sound.wake(); }, true);
  return {
    // A sound by name (tap, sparkle, click, tryOn), with its arguments. False when it didn't play.
    play: (name, ...args) => (sound && typeof sound[name] === 'function' ? sound[name](...args) : false),
    get running() { return !!sound?.running; },
    // For tests.
    state: () => ({ on: on(), loaded: !!sound, running: !!sound?.running, played: sound ? [...sound.played] : [] }),
  };
}
