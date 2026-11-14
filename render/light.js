// The light pass (spec 2026-11-08-ocean-creature-look): lights each large creature from its own outline, the way the
// approved "rounded and lit" prototype did, so bodies look round under light from the surface. Runs on the graphics
// chip (WebGL2, like render/water.js) on a creature's own picture, which the scene caches and composites. If WebGL2 is
// missing or fails, the pass switches itself off and creatures are drawn as before: never a blank ocean.

// Starting values from the approved prototype (spec table). h is the creature's height in pixels; u = unit * h.
export const LIGHT = {
  heightBlur: 0.15, depth: 0.14, ambient: 0.52, gain: 1.2, spec: 0.32, shine: 26, dir: [-0.45, -0.75, 0.5],
  topLight: 0.12, belly: 0.26, ripple: 0.08, grain: 0.08, rim: 0.32, shadowBlur: 3, shadowAlpha: 0.4, shadowOffset: 2.4, unit: 0.035,
  haze: '#3aa6c8', hazeAlpha: 0.06,
};

// Which creatures are lit this frame, and whether their picture is redrawn. px is the on-screen artwork radius in
// device pixels; rank is the creature's place by size on screen (0 = largest); phase staggers the refreshes.
// A creature that is turning, or whose tail beats fast, is redrawn more often so its movement doesn't step.
export function lightPolicy({ px, rank, frame, phase = 0, video = false, cap = 40, turning = false, beatHz = 0 }) {
  const lit = px >= 42 && (video || rank < cap);
  const refresh = video || turning || px >= 300 || (px >= 120 || beatHz >= 1 ? (frame + phase) % 2 === 0 : (frame + phase) % 4 === 0);
  return { lit, refresh };
}

// On the live site lit creatures share one budget of redraws, and each is due by its own tail (research 2026-11-09, rank 2):
// a body is redrawn each time its tail has moved on by one pose, so a quick little fish and a slow whale both get the
// same number of poses in a beat, and the whale costs far less. Taking turns by frame number gave some bodies one pose a second.
export const LIT_SHARE = {
  posesPerBeat: 12,    // redraws in one beat of a creature's tail
  bigFrom: 100,        // on-screen radius from which a body gets more poses, in step with its size, so its tail never jumps far
  bigMost: 4,          // ... up to this many times as many
  pulse: 3,            // a jellyfish or squid squeezes in a tenth of its beat, so its beat is cut this many times finer
  longestWait: 0.25,   // seconds: the light, the haze and a still creature's small movements are never older than this
  perSecond: 180,      // the budget: about three redraws a frame at 60 frames a second
  burst: 6,            // the most one frame may spend after a pause in the drawing
  newPerFrame: 2,      // lit pictures made from nothing in one frame: making twelve at once was the worst stutter on arriving somewhere
  fadeIn: 0.25,        // seconds a new lit picture takes to come up over the plain one it replaces
};
// How many poses a beat a creature of this on-screen radius gets.
export const litPoses = (px, pulse = false) => LIT_SHARE.posesPerBeat * Math.min(LIT_SHARE.bigMost, Math.max(1, px / LIT_SHARE.bigFrom)) * (pulse ? LIT_SHARE.pulse : 1);
// How far behind a lit picture is, where 1 means due now. made is { swim, t } from when it was last redrawn.
// lead is how far the tail moves in half a frame, in poses: with it a body is redrawn on the frame nearest to when it falls
// due, not the first frame after, which at 60 frames a second would cost a quick tail a third of its poses.
export const litStale = (made, swim, t, poses = LIT_SHARE.posesPerBeat, lead = 0) => Math.max((Math.abs(swim - made.swim) * poses) / (Math.PI * 2) + lead, (t - made.t) / LIT_SHARE.longestWait);
// Which of the frame's lit creatures are redrawn: those due, furthest behind first, as many as the allowance covers.
// list is [{ key, stale, cost }]; returns the keys to redraw. cost is what a redraw takes out of the allowance (1 unless it says).
export function litShare(list, allowance) {
  const due = list.filter((x) => x.stale >= 1).sort((a, b) => b.stale - a.stale), out = [];
  let left = allowance;
  for (const x of due) { const cost = x.cost ?? 1; if (cost > left) break; left -= cost; out.push(x.key); }
  return out;
}
// The few creatures on screen whose lit picture may be sharper than the usual largest (research 2026-11-09, "More detailed" rank 2).
// held is who has that now; list is [{ key, px, first }], those who could use it, first being the creature followed.
// A creature keeps its place until one clearly bigger needs it, or two of a size would swap places and remake their pictures.
export const LIT_SHARP = { most: 3, clearlyBigger: 1.3 };
export function litSharp(held, list, most = LIT_SHARP.most) {
  const order = [...list].sort((a, b) => Number(!!b.first) - Number(!!a.first) || b.px - a.px);
  const chosen = order.filter((x) => held.has(x.key)).slice(0, most);
  for (const x of order) {
    if (chosen.includes(x)) continue;
    if (chosen.length < most) { chosen.push(x); continue; }
    const weakest = chosen.filter((c) => !c.first).at(-1);
    if (weakest && (x.first || x.px > weakest.px * LIT_SHARP.clearlyBigger)) chosen[chosen.indexOf(weakest)] = x;
    chosen.sort((a, b) => Number(!!b.first) - Number(!!a.first) || b.px - a.px);
  }
  return new Set(chosen.map((x) => x.key));
}
// Who gets a new lit picture this frame, out of those waiting for one: the creature being followed, then the largest.
// list is [{ key, order }], where a lower order goes first.
export const litNewcomers = (list) => [...list].sort((a, b) => a.order - b.order).slice(0, LIT_SHARE.newPerFrame).map((x) => x.key);
// The allowance a frame has: what was left, plus what the time since the last frame earned, never more than a burst.
export const litAllowance = (left, seconds) => Math.min(LIT_SHARE.burst, left + Math.max(0, seconds) * LIT_SHARE.perSecond);

// A creature's picture: big enough for its tail, fins, wearables and shadow; never more than 1024 px a side.
export function spriteSize(px, maxSide = 1024) {
  const want = Math.ceil(px * 2.7), side = Math.min(maxSide, want);
  return { side, scale: side / want };
}

// Lit pictures kept between frames, least recently used dropped first. Each entry is three side x side pictures, and a
// dropped entry's canvases are sized to 0, because Safari otherwise holds on to their memory.
const PICTURES_EACH = 3;
const release = (entry) => { for (const c of [entry?.crisp, entry?.lit, entry?.shadow]) if (c) c.width = c.height = 0; };
export class SpriteCache {
  constructor(maxPixels = 13e6) { this.max = maxPixels; this.map = new Map(); this.total = 0; }
  get size() { return this.map.size; }
  get(id, side) {
    const e = this.map.get(id);
    if (!e || e.side !== side) return undefined;
    this.map.delete(id); this.map.set(id, e);
    return e.entry;
  }
  // Whatever picture this creature has, at any size: something to show until the right size is made.
  any(id) { return this.map.get(id)?.entry; }
  put(id, side, entry) {
    const old = this.map.get(id);
    if (old) { this.total -= old.side * old.side * PICTURES_EACH; this.map.delete(id); if (old.entry !== entry) release(old.entry); }
    this.map.set(id, { side, entry }); this.total += side * side * PICTURES_EACH;
    for (const [k, e] of this.map) {
      if (this.total <= this.max || k === id) break;
      this.map.delete(k); this.total -= e.side * e.side * PICTURES_EACH; release(e.entry);
    }
  }
}

// Draws a lit creature: its soft shadow, the lit picture, then the crisp parts, all at the creature's fade.
// turn (the live site only) is how the body has moved as one piece since its picture was made: { width, angle }. A turn
// narrows the picture, the way the unlit pictures turn, so a turning body needs no redraw of its own (research 2026-11-09, rank 3).
export function drawLitItem(ctx, x, y, entry, alpha, turn = null) {
  const before = ctx.globalAlpha, S = entry.side / entry.scale, moved = !!turn && (turn.width !== 1 || turn.angle !== 0);
  if (moved) { ctx.save(); ctx.translate(x, y); ctx.scale(turn.width, 1); if (turn.angle) ctx.rotate(turn.angle); x = 0; y = 0; }
  const put = (img, a) => { if (!img) return; ctx.globalAlpha = a; ctx.drawImage(img, x - S / 2, y - S / 2, S, S); };
  put(entry.shadow, alpha * LIGHT.shadowAlpha);
  put(entry.lit, alpha);
  put(entry.crisp, alpha);
  if (moved) ctx.restore();
  ctx.globalAlpha = before;
}

const hexRGB = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
// Pass 1 and 2: a Gaussian blur of the creature's alpha (the height field), along dir.
const BLUR = `#version 300 es
precision highp float; uniform sampler2D src; uniform vec2 dir; uniform float radius; uniform float side; uniform float fit; uniform int useAlpha; out vec4 o;
void main(){ vec2 uv = gl_FragCoord.xy / side; float s = 0.0, w = 0.0;
  for (int i = -12; i <= 12; i++) { float k = float(i) / 12.0, g = exp(-k * k * 4.5); vec4 t = texture(src, clamp(uv + dir * k * radius / side, 0.0, 1.0) * fit);
    s += (useAlpha == 1 ? t.a : t.r) * g; w += g; }
  float v = s / w; o = vec4(v, v, v, 1.0); }`;
// Pass 3: light from the surface, a darker belly, ripple light, grain, a rim along the top edge and a little haze.
const LIT = `#version 300 es
precision highp float; uniform sampler2D src; uniform sampler2D height; uniform float side, fit, hpx, light, t;
uniform vec3 L, Hv, haze; uniform float ambient, gain, spec, shine, topLight, belly, ripple, grain, rim, unit, hazeA; out vec4 o;
float h(vec2 uv){ return texture(height, clamp(uv, 0.0, 1.0) * fit).r; }
float a(vec2 uv){ return texture(src, uv).a; }
void main(){ vec2 uv = gl_FragCoord.xy / side; vec4 c = texture(src, uv); if (c.a < 0.003) { o = vec4(0.0); return; }
  vec3 rgb = c.rgb; float px = 1.0 / side, depth = ${'${DEPTH}'} * hpx;
  vec3 n = normalize(vec3((h(uv - vec2(2.0*px,0.0)) - h(uv + vec2(2.0*px,0.0))) * depth, (h(uv + vec2(0.0,2.0*px)) - h(uv - vec2(0.0,2.0*px))) * depth, 1.0));
  float lt = clamp(light, 0.4, 1.15);
  float dif = max(0.0, dot(n, L)), sp = pow(max(0.0, dot(n, Hv)), shine) * spec * lt;
  float k = ambient + dif * (1.0 - ambient) * lt; rgb = min(vec3(1.0), rgb * k * gain + sp);
  // The creature's own column: v = 0 at its top edge, 1 at its bottom edge (up is +y here).
  float top = uv.y, bot = uv.y, stepv = 1.0 / 48.0;
  for (int i = 1; i <= 48; i++) { float y = uv.y + float(i) * stepv; if (y > 1.0 || a(vec2(uv.x, y)) < 0.05) break; top = y; }
  for (int i = 1; i <= 48; i++) { float y = uv.y - float(i) * stepv; if (y < 0.0 || a(vec2(uv.x, y)) < 0.05) break; bot = y; }
  float v = (top - uv.y) / max(top - bot, 1e-4);
  // Light and shade change the creature's own colour (multiplied), so black stays black and orange stays orange.
  rgb *= 1.0 + topLight * (1.0 - smoothstep(0.0, 0.45, v)) * vec3(1.0, 0.98, 0.92);
  rgb *= 1.0 - belly * smoothstep(0.45, 1.0, v) * vec3(1.0, 0.85, 0.6);
  float cu = uv.x * 6.0 + t * 0.15, cv = (1.0 - uv.y) * 6.0;
  float ca = sin(cu * 1.7 + sin(cv * 1.3) * 1.6) + sin(cv * 1.9 + sin(cu * 1.1) * 1.4);
  float caus = pow(max(0.0, 1.0 - abs(ca) * 1.6), 2.0);
  rgb = 1.0 - (1.0 - rgb) * (1.0 - vec3(caus * ripple));
  float g = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);
  vec3 sl = mix(rgb - (1.0 - 2.0 * g) * rgb * (1.0 - rgb), rgb + (2.0 * g - 1.0) * (sqrt(rgb) - rgb), step(0.5, g));
  rgb = mix(rgb, sl, grain);
  float u = min(unit * hpx * 0.9, 4.0) * px; // a thin rim even in a close-up
  rgb += vec3(0.88, 0.97, 1.0) * rim * clamp(c.a - a(uv + vec2(0.0, u)), 0.0, 1.0) * lt;
  rgb = mix(min(rgb, vec3(1.0)), haze, hazeA);
  o = vec4(rgb * c.a, c.a); }`;
// Pass 4: the soft shadow below the creature, from the blurred alpha moved down. `across` is where it is drawn in the working canvas:
// beside the lit picture when both fit, so that one copy out of the canvas serves both.
const SHADOW = `#version 300 es
precision highp float; uniform sampler2D height; uniform float side, fit, off, across; uniform vec3 tint; out vec4 o;
void main(){ vec2 uv = (gl_FragCoord.xy - vec2(across, 0.0)) / side; float s = texture(height, clamp(uv + vec2(0.0, off / side), 0.0, 1.0) * fit).r; o = vec4(tint * s, s); }`;

export function createLightPass({ makeCanvas = () => document.createElement('canvas') } = {}) {
  const pass = { available: false, reason: null, apply: () => null, disable(reason) { this.available = false; this.reason = reason; this.apply = () => null; } };
  let canvas, gl;
  try {
    canvas = makeCanvas();
    gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: true });
  } catch { gl = null; }
  if (!gl) { pass.reason = 'no WebGL2'; return pass; }
  const compile = (type, text) => { const s = gl.createShader(type); gl.shaderSource(s, text); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader'); return s; };
  const program = (frag) => { const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link'); return p; };
  let blur, lit, shadow;
  try {
    blur = program(BLUR); lit = program(LIT.replace('${DEPTH}', String(LIGHT.depth))); shadow = program(SHADOW);
  } catch (e) { pass.disable('shader failed: ' + e.message); return pass; }
  canvas.addEventListener?.('webglcontextlost', (e) => { e.preventDefault?.(); pass.disable('context lost'); });
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v); return t; };
  const srcTex = tex(), tA = tex(), tB = tex(), fA = gl.createFramebuffer(), fB = gl.createFramebuffer();
  // One working size for every creature: resizing canvases and textures per creature is very slow.
  const SIZE = 1024;
  canvas.width = canvas.height = SIZE;
  for (const [t, f] of [[tA, fA], [tB, fB]]) {
    gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, SIZE, SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
  }
  gl.enable(gl.SCISSOR_TEST);
  const L = (() => { const d = LIGHT.dir, n = Math.hypot(...d); return d.map((v) => v / n); })();
  const H = (() => { const v = [L[0], L[1], L[2] + 1], n = Math.hypot(...v); return v.map((x) => x / n); })();
  // In the shader +y is up, so light from above-left points to +y.
  const Lgl = [L[0], -L[1], L[2]], Hgl = [H[0], -H[1], H[2]];
  // Looking a uniform up by name is slow, and these never change.
  const places = new Map();
  const uni = (p, name) => { let of = places.get(p); if (!of) places.set(p, of = {}); return (of[name] ??= gl.getUniformLocation(p, name)); };
  // The creature's own height in pixels (its alpha box), measured on a 64 px copy; the light is sized from it.
  const probe = makeCanvas(); probe.width = probe.height = 64;
  const pctx = probe.getContext?.('2d', { willReadFrequently: true });
  const rowsOf = (side) => {
    const d = pctx.getImageData(0, 0, 64, 64).data; let y0 = 64, y1 = -1;
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (d[(y * 64 + x) * 4 + 3] > 20) { if (y < y0) y0 = y; if (y > y1) y1 = y; break; }
    return y1 < 0 ? side * 0.4 : ((y1 - y0 + 1) / 64) * side;
  };
  const heightOf = (src) => {
    if (!pctx) return src.height * 0.4;
    pctx.clearRect(0, 0, 64, 64); pctx.drawImage(src, 0, 0, 64, 64);
    return rowsOf(src.height);
  };
  // The same for a picture `side` px across, drawn for the purpose by draw(ctx, aside) (the parts that stay crisp go to `aside`, as in
  // render/crisp.js) on canvases the processor draws, so nothing is read back from the graphics chip. Reading back a creature's picture
  // made the processor wait for everything the chip had queued, in the frame it first came into the light (2026-11-15: 40 to 100 ms over
  // one zone's arrival, processor slowed 4 times; worse on a phone's slower chip). Drawn full size, then shrunk to 64 px as before, it
  // measures the same for 95% of species and within a pixel row for the rest, less than a creature's own swim already moves it.
  const whole = makeCanvas(), wholeCtx = whole.getContext?.('2d', { willReadFrequently: true });
  const aside = makeCanvas(); aside.width = aside.height = 64;
  const asideCtx = aside.getContext?.('2d', { willReadFrequently: true });
  // It is needed once per species, so its full-size canvas is let go after each use (sized to 0: Safari holds on to a canvas's memory otherwise).
  const heightOfDrawing = (draw, side) => {
    if (!pctx || !wholeCtx || !asideCtx) return side * 0.4;
    whole.width = whole.height = side; // a fresh, empty canvas with no transform
    try { draw(wholeCtx, asideCtx); pctx.clearRect(0, 0, 64, 64); pctx.drawImage(whole, 0, 0, 64, 64); } finally { whole.width = whole.height = 0; }
    return rowsOf(side);
  };
  // Copying out of the working canvas is most of what lighting a creature costs: the browser copies the whole 1024 px canvas each
  // time, however small the creature (2026-11-15: about 1.1 ms of the graphics chip's time on a fast Mac, of 2.8 ms in all). Two copies
  // with no drawing between them share that one whole-canvas copy, so the lit picture and its shadow are drawn side by side and copied together.
  const copy = (into, side, x = 0) => { if (into.width !== side || into.height !== side) into.width = into.height = side; const c = into.getContext('2d'); c.clearRect(0, 0, side, side); c.drawImage(canvas, x, SIZE - side, side, side, 0, 0, side, side); return into; };

  pass.available = true;
  pass.apply = (src, { light = 1, t = 0, h = null, haze = null } = {}, into = {}) => {
    try {
      h = h || heightOf(src);
      if (gl.isContextLost()) { pass.disable('context lost'); return null; }
      const side = src.width, fit = side / SIZE;
      // Empty the working textures first: sampling at this picture's edge reads just past it (one texel at most), and a bigger
      // creature lit earlier would otherwise leave dark bars across the water. Only that corner is emptied, not the whole 1024 px.
      const used = Math.min(SIZE, side + 2);
      gl.enable(gl.SCISSOR_TEST); gl.scissor(0, 0, used, used); gl.clearColor(0, 0, 0, 0);
      for (const f of [fA, fB]) { gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.clear(gl.COLOR_BUFFER_BIT); }
      gl.viewport(0, 0, side, side); gl.scissor(0, 0, side, side); gl.disable(gl.BLEND);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, srcTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      const radius = Math.max(2, LIGHT.heightBlur * h);
      gl.useProgram(blur);
      gl.uniform1f(uni(blur, 'radius'), radius); gl.uniform1f(uni(blur, 'side'), side); gl.uniform1i(uni(blur, 'src'), 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fA); gl.uniform1f(uni(blur, 'fit'), 1); gl.uniform2f(uni(blur, 'dir'), 1, 0); gl.uniform1i(uni(blur, 'useAlpha'), 1); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindTexture(gl.TEXTURE_2D, tA); gl.bindFramebuffer(gl.FRAMEBUFFER, fB); gl.uniform1f(uni(blur, 'fit'), fit); gl.uniform2f(uni(blur, 'dir'), 0, 1); gl.uniform1i(uni(blur, 'useAlpha'), 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      // Lit picture.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(lit);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, srcTex); gl.uniform1i(uni(lit, 'src'), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tB); gl.uniform1i(uni(lit, 'height'), 1);
      gl.uniform1f(uni(lit, 'side'), side); gl.uniform1f(uni(lit, 'fit'), fit); gl.uniform1f(uni(lit, 'hpx'), h); gl.uniform1f(uni(lit, 'light'), light); gl.uniform1f(uni(lit, 't'), t);
      gl.uniform3fv(uni(lit, 'L'), Lgl); gl.uniform3fv(uni(lit, 'Hv'), Hgl); gl.uniform3fv(uni(lit, 'haze'), haze || hexRGB(LIGHT.haze));
      for (const k of ['ambient', 'gain', 'spec', 'shine', 'topLight', 'belly', 'ripple', 'grain', 'rim', 'unit']) gl.uniform1f(uni(lit, k), LIGHT[k]);
      gl.uniform1f(uni(lit, 'hazeA'), LIGHT.hazeAlpha);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      // Shadow: beside the lit picture when both fit in the working canvas (all but the few sharpest), else in its place once it is copied.
      const beside = side * 2 <= SIZE, across = beside ? side : 0;
      const litOut = beside ? null : copy(into.lit || makeCanvas(), side);
      if (beside) { gl.viewport(across, 0, side, side); gl.scissor(across, 0, side, side); }
      gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(shadow);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tB); gl.uniform1i(uni(shadow, 'height'), 1);
      gl.uniform1f(uni(shadow, 'side'), side); gl.uniform1f(uni(shadow, 'fit'), fit); gl.uniform1f(uni(shadow, 'off'), LIGHT.shadowOffset * LIGHT.unit * h); gl.uniform1f(uni(shadow, 'across'), across);
      gl.uniform3fv(uni(shadow, 'tint'), hexRGB('#02121f'));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      const shadowOut = copy(into.shadow || makeCanvas(), side, across), litFinal = litOut || copy(into.lit || makeCanvas(), side);
      gl.activeTexture(gl.TEXTURE0);
      return { lit: litFinal, shadow: shadowOut };
    } catch (e) { pass.disable('apply failed: ' + e.message); return null; }
  };
  pass.gl = gl;
  pass.measureDrawing = heightOfDrawing;
  return pass;
}
