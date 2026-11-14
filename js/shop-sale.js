// The Black Friday sale on the page (spec 2026-11-14-ocean-black-friday-sale-design). The site publishes every third hour, so a build from 4
// hours before the start carries the sale (tools/shop-page.mjs) and this switches it on and off by the visitor's own clock: once at load, and
// once more if the page is still open at the start or the end. Nothing ticks or counts down: the end is a fixed time, in the visitor's own
// time zone. Copied to the site only with the shop (its name starts with "shop-").

// The sale's start and end in milliseconds, from an element's data-sale-starts and data-sale-ends, or null when it carries no sale.
export function saleWindowOf(el) {
  const starts = Date.parse(el?.dataset?.saleStarts ?? ''), ends = Date.parse(el?.dataset?.saleEnds ?? '');
  return Number.isFinite(starts) && Number.isFinite(ends) && starts < ends ? { starts, ends } : null;
}
export const isSaleOn = (win, nowMs) => !!win && nowMs >= win.starts && nowMs < win.ends;

// "11:59 pm on Monday 30 November": the last minute of the sale in the visitor's time zone (it ends at 4 pm on Tuesday in Melbourne, which is
// midnight in New York), or null when the zone is unknown, so the page keeps its own words ("3:59 pm on Tuesday 1 December (Melbourne time)").
export function saleEndWords(endsMs, timeZone) {
  try {
    const last = new Date(endsMs - 60000);
    const time = new Intl.DateTimeFormat('en-GB', { timeZone, hour: 'numeric', minute: '2-digit', hour12: true }).format(last).replace(/\s+/g, ' ');
    const day = new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'long', day: 'numeric', month: 'long' }).format(last).replace(/,/g, '');
    return `${time} on ${day}`;
  } catch { return null; }
}

// Shows the sale's parts or the usual ones under `root`, and swaps the prices and links the shop's script reads (data-price, data-link) to
// the sale's or back. An element whose usual link is the page's own (a single item) has no data-link outside the sale.
export function applySale(root, on) {
  for (const el of root.querySelectorAll('.sale-only')) el.hidden = !on;
  for (const el of root.querySelectorAll('.usual-only')) showUsual(el, on);
  const all = (sel) => [...(root.matches?.(sel) ? [root] : []), ...root.querySelectorAll(sel)];
  for (const el of all('[data-sale-price]')) el.dataset.price = on ? el.dataset.salePrice : el.dataset.usualPrice;
  for (const el of all('[data-sale-link]')) {
    const link = on ? el.dataset.saleLink : el.dataset.usualLink;
    if (link) el.dataset.link = link; else delete el.dataset.link;
  }
}

// Things sold only until a date (the Christmas bundle, until 25 December ends): an element carrying data-until is hidden once the visitor's
// clock reaches it, even before the next publish, and anything picked inside it is unpicked. Checked at load, at that moment if the page is
// still open, and whenever the page is shown or looked at again. onChange runs when something has just gone. Returns nothing.
export function watchUntil(scope, onChange = () => {}, now = () => Date.now()) {
  const els = [...(scope?.querySelectorAll?.('[data-until]') ?? [])].map((el) => ({ el, until: Date.parse(el.dataset.until) })).filter((x) => Number.isFinite(x.until));
  if (!els.length) return;
  let timer = 0;
  const check = () => {
    const t = now();
    let gone = false;
    for (const { el, until } of els) {
      if (t < until || el.dataset.gone) continue;
      el.dataset.gone = '1'; el.hidden = true; gone = true;
      for (const input of el.querySelectorAll('input:checked')) input.checked = false;
    }
    clearTimeout(timer);
    const next = Math.min(...els.filter((x) => !x.el.dataset.gone).map((x) => x.until));
    if (Number.isFinite(next) && next - t < 2 ** 31 - 1) timer = setTimeout(check, next - t + 50);
    if (gone) onChange();
  };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'hidden') check(); });
  if (typeof window !== 'undefined') { window.addEventListener('pageshow', check); window.addEventListener('focus', check); }
  check();
}
// Shows the sale's parts or the usual ones; an element already gone (data-gone, past its data-until) stays hidden.
const showUsual = (el, on) => { el.hidden = on || !!el.dataset.gone; };

// Applies the sale as the clock says now, puts the end in the visitor's own words, and switches once more at the next start or end while
// the page stays open (only when that is near enough for a timer). A timer doesn't run in a frozen background tab or on a sleeping phone, so
// the clock is looked at again whenever the page is shown or looked at again, and the page switches then if it should have (review,
// 14 Nov). el carries the dates; scope is what switches (the whole page: the shop's sale line and small print are outside its form).
// onChange(on) runs after each switch. Returns () => whether it's on.
export function watchSale(el, onChange = () => {}, { scope = el?.ownerDocument ?? el, now = () => Date.now() } = {}) {
  const win = saleWindowOf(el);
  const root = scope;
  if (!win) return () => false;
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}
  const words = saleEndWords(win.ends, tz);
  if (words) for (const el of root.querySelectorAll('[data-sale-end]')) el.textContent = words;
  let on = isSaleOn(win, now()), timer = 0;
  const schedule = () => {
    clearTimeout(timer);
    const t = now(), next = t < win.starts ? win.starts : t < win.ends ? win.ends : null;
    if (next !== null && next - t < 2 ** 31 - 1) timer = setTimeout(apply, next - t + 50);
  };
  // The next timer is set before onChange runs, so nothing onChange does can stop the page switching at the end.
  function apply() { on = isSaleOn(win, now()); applySale(root, on); schedule(); onChange(on); }
  const recheck = () => { if (isSaleOn(win, now()) !== on) apply(); else schedule(); };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'hidden') recheck(); });
  if (typeof window !== 'undefined') { window.addEventListener('pageshow', recheck); window.addEventListener('focus', recheck); }
  applySale(root, on);
  schedule();
  return () => on;
}
