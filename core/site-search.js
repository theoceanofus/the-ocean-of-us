// Browser-safe part of the public find-your-creature page: the published fields and username search.
export const SITE_FIELDS = Object.freeze(['username', 'species', 'speciesLabel', 'colors', 'pattern', 'size', 'seed', 'home', 'zone', 'zoneLabel', 'founder', 'joined', 'extras', 'upgrade']);
export function searchSite(rows, q) {
  const needle = String(q ?? '').trim().replace(/^@+/, '').toLowerCase();
  if (!needle) return [];
  const exact = rows.filter((r) => r.username === needle);
  return exact.length ? exact : rows.filter((r) => r.username.includes(needle)).slice(0, 20);
}
