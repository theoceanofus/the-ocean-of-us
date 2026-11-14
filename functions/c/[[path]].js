// Every creature's card, /c/<xx>/<key>/, and its link-preview picture, /c/<xx>/<key>/preview.jpg, as a Cloudflare Pages Function
// (15 Nov 2026). At two files a card the site was nearing Cloudflare Pages' free limit of 20,000 files, so the build packs the cards into
// cards/<xx>-pages.bin and their pictures into cards/<xx>-pictures.bin (tools/site-packs.mjs). This reads the one pack it needs and sends
// back that card at the address it always had, so every link already shared keeps working. A key nobody has gets the not-found page.
// The build copies this file to functions/c/[[path]].js and fills in HEADERS: Cloudflare doesn't apply _headers to what a Function sends,
// so the site's safety headers and Content-Security-Policy travel in here. Plain JavaScript with no imports, so Cloudflare's build can't fail on it.

const HEADERS = {"X-Frame-Options":"DENY","X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin","Permissions-Policy":"camera=(), microphone=(), geolocation=()","Content-Security-Policy":"default-src 'self'; script-src 'self' 'unsafe-hashes' 'sha256-22v/Fx8Zpelkem2sMKLnak/KsvYq3icGbX5gVvj5dZ0=' 'sha256-GZIcz60Uwd6wT3vaYke/atSr53TehbYAPepOa3d03Vw=' 'sha256-M+M/a7ojZsp4TO7jgzGo8vuEheRWQtGubG3mLI5Y3no=' 'sha256-MhtPZXr7+LpJUY5qtMutB+qWfQtMaPccfe7QXtCcEYc=' 'sha256-fq1pUYUwM5WETkG9+l8QE00FFbmAvj/3zieK0KAD4wE=' 'sha256-kdMUjdjImtfNfAT9FUD+my5aL1Zq9bRM8X038BstrDY=' 'sha256-lNG54xe86oFKBfavfK9PJisXpiy8ZLKeCw7tMjGkeoA=' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'","X-Robots-Tag":"noindex, noimageindex"};

const ADDRESS = /^\/c\/([0-9a-f]{2})\/([0-9a-f]{12})(\/(?:index\.html|preview\.jpg)?)?$/;

// A pack: 4 bytes giving the length of a JSON index, the index ({ i: { key: [offset, length] } }), then the files back to back.
export function readPack(buf, key) {
  const bytes = new Uint8Array(buf);
  if (bytes.length < 4) return null;
  const n = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0);
  const index = JSON.parse(new TextDecoder().decode(bytes.subarray(4, 4 + n)));
  if (key === undefined) return index;
  const at = index.i?.[key];
  return at ? bytes.subarray(4 + n + at[0], 4 + n + at[0] + at[1]) : null;
}

// getAsset(path) resolves to a Response for one of the site's own files.
export async function serveCard(request, getAsset, headers = HEADERS) {
  const url = new URL(request.url);
  const m = ADDRESS.exec(url.pathname);
  const head = request.method === 'HEAD';
  if (request.method !== 'GET' && !head) return new Response('Method not allowed', { status: 405, headers: { ...headers, allow: 'GET, HEAD' } });
  const send = (body, type, cache, status = 200) => new Response(head ? null : body, { status, headers: { ...headers, 'content-type': type, 'cache-control': cache } });
  const notFound = async () => send(await (await getAsset('/404.html')).arrayBuffer(), 'text/html; charset=utf-8', 'no-cache', 404);
  if (!m || m[2].slice(0, 2) !== m[1]) return notFound();
  const [, xx, key, rest] = m;
  if (!rest) return new Response(null, { status: 308, headers: { ...headers, location: `/c/${xx}/${key}/${url.search}` } });
  const pack = async (name) => {
    const res = await getAsset(`/cards/${xx}-${name}.bin`);
    return res.ok ? readPack(await res.arrayBuffer(), key) : null;
  };
  const page = await pack('pages');
  if (!page) return notFound();
  if (rest !== '/preview.jpg') return send(page, 'text/html; charset=utf-8', 'public, max-age=60');
  // A creature without a picture of its own (the site near its space limit) shows the shared one, as its page says.
  const picture = (await pack('pictures')) ?? await (await getAsset('/shared-preview.jpg')).arrayBuffer();
  return send(picture, 'image/jpeg', 'public, max-age=3600');
}

export const onRequest = (context) => serveCard(context.request, (p) => context.env.ASSETS.fetch(new URL(p, context.request.url)));
