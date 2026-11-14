// Finding a creature by exact name without publishing a list of names (spec 2026-11-08, "Names and privacy").
// Web Crypto only, so the same file runs in Node (building the find files) and in the browser (searching).
import { normalizeName } from './site-names.js';

const enc = new TextEncoder(), dec = new TextDecoder();
const subtle = () => globalThis.crypto.subtle;
const sha256 = async (text) => new Uint8Array(await subtle().digest('SHA-256', typeof text === 'string' ? enc.encode(text) : text));
const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const toB64url = (bytes) => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const fromB64url = (t) => {
  if (typeof t !== 'string' || !/^[A-Za-z0-9_-]*$/.test(t) || t.length % 4 === 1) return null;
  try { return Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)); } catch { return null; }
};

// The find address is slow on purpose (PBKDF2), so guessing every name in a leaked list costs real time.
export const FIND_ITERATIONS = 100_000;
const FIND_SALT = 'ocean-find-v1';

// bucket: which find/<xx>.json to fetch. entry: the line inside it. secret: opens the sealed name; only someone who typed the name has it.
// 64 derived bytes: the first 32 give bucket and entry, the last 32 are the secret.
export async function findAddress(normalized) {
  const base = await subtle().importKey('raw', enc.encode(normalized), 'PBKDF2', false, ['deriveBits']);
  const bytes = new Uint8Array(await subtle().deriveBits({ name: 'PBKDF2', salt: enc.encode(FIND_SALT), iterations: FIND_ITERATIONS, hash: 'SHA-256' }, base, 512));
  const h = hex(bytes.slice(0, 32));
  return { bucket: h.slice(0, 2), entry: h.slice(2, 16), secret: bytes.slice(32) };
}

// The IV is made from the secret and the text (a synthetic IV), so the same input seals to the same text every build,
// while two different names sharing a secret never share an IV. It is stored in front of the sealed text.
const aesKey = async (secret) => subtle().importKey('raw', secret, 'AES-GCM', false, ['encrypt', 'decrypt']);
const IV_BYTES = 12, PAD_TO = 64;

export async function sealName(secret, { username, nickname }) {
  // Padded so the sealed length doesn't reveal how long a short-named username is (JSON.parse ignores trailing spaces).
  const data = enc.encode(JSON.stringify([username, nickname ?? null]).padEnd(PAD_TO, ' '));
  const joined = new Uint8Array(secret.length + data.length); joined.set(secret); joined.set(data, secret.length);
  const iv = (await sha256(joined)).slice(0, IV_BYTES);
  const body = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv }, await aesKey(secret), data));
  const out = new Uint8Array(IV_BYTES + body.length); out.set(iv); out.set(body, IV_BYTES);
  return toB64url(out);
}

// null for a wrong secret or damaged text; never throws.
export async function openName(secret, sealed) {
  try {
    const bytes = fromB64url(sealed);
    if (!bytes || bytes.length < IV_BYTES + 17) return null;
    const plain = await subtle().decrypt({ name: 'AES-GCM', iv: bytes.slice(0, IV_BYTES) }, await aesKey(secret), bytes.slice(IV_BYTES));
    const [username, nickname] = JSON.parse(dec.decode(plain));
    return typeof username === 'string' ? { username, nickname: typeof nickname === 'string' ? nickname : null } : null;
  } catch { return null; }
}

export const secretToLink = (secret) => toB64url(secret);
export function linkToSecret(text) {
  if (typeof text !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(text)) return null;
  const bytes = fromB64url(text);
  return bytes && bytes.length === 32 ? bytes : null;
}

// fetchBucket(xx) resolves to the parsed find/<xx>.json, or null if there is none. Returns every name that opens, or [].
export async function lookupName(typed, fetchBucket) {
  const normalized = normalizeName(typed);
  if (!normalized) return [];
  const { bucket, entry, secret } = await findAddress(normalized);
  const lines = (await fetchBucket(bucket))?.[entry];
  if (!Array.isArray(lines)) return [];
  const hits = [];
  for (const line of lines) {
    const opened = line && (await openName(secret, line.s));
    if (opened) hits.push({ key: line.k, username: opened.username, nickname: opened.nickname, secret });
  }
  if (hits.length > 1) {
    const exact = hits.filter((h) => h.username === String(typed).trim().toLowerCase().replace(/^@+/, ''));
    if (exact.length === 1) return exact;
  }
  return hits;
}
