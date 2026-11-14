// The Spotted list: which animals this visitor has seen. A species counts once, however many of it they meet.
// `memory` is { remember, recall }, so a test can hand in a blocked or a plain one.
const KEY = 'spotted';
export const CELEBRATE_ONLY = 1, CELEBRATE_RARE_UP_TO = 3;

export function createSpotted({ names, memory }) {
  const live = new Set(names.species.map((s) => s.id));
  const countOf = new Map(names.species.map((s) => [s.id, s.count]));
  const usable = (list) => (Array.isArray(list) ? list.filter((id) => typeof id === 'string') : []);
  // Every find stays saved. An animal that has since left the ocean isn't counted, but it counts again if one comes back.
  const kept = new Set(usable(memory.recall(KEY, [])));
  const seen = new Set([...kept].filter((id) => live.has(id)));
  return {
    // celebrate is set only the first time: 'only' for the one of its kind, 'rare' for two or three.
    add(speciesId) {
      if (!live.has(speciesId) || seen.has(speciesId)) return { isNew: false, celebrate: null };
      seen.add(speciesId);
      kept.add(speciesId);
      for (const id of usable(memory.latest?.(KEY))) kept.add(id); // another tab may have found something since this page loaded
      memory.remember(KEY, [...kept]);
      memory.keep?.();
      const n = countOf.get(speciesId);
      return { isNew: true, celebrate: n === CELEBRATE_ONLY ? 'only' : n <= CELEBRATE_RARE_UP_TO ? 'rare' : null };
    },
    count: () => seen.size,
    total: () => names.species.length,
    has: (speciesId) => seen.has(speciesId),
  };
}
