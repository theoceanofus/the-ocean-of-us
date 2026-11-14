// Deterministic helpers. Nothing in the render path may use Math.random or Date.now.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const smoother = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const range = (a, b, x) => clamp((x - a) / (b - a));

export function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return h >>> 0;
}
export const hash01 = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hexCache = new Map();
export function hexRgb(hex) {
  let c = hexCache.get(hex);
  if (c) return c;
  const n = parseInt(hex.slice(1), 16);
  c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  hexCache.set(hex, c);
  return c;
}
export const mixHex = (a, b, t) => {
  const A = hexRgb(a), B = hexRgb(b);
  const v = [0, 1, 2].map((i) => Math.round(lerp(A[i], B[i], t)));
  return '#' + v.map((x) => x.toString(16).padStart(2, '0')).join('');
};
