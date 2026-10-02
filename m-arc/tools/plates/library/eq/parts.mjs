// Shared building blocks for library composers. A composer returns ONLY existing primitive items (plate.mjs:41-46
// throws on any other type), so every part here is one primitive with the parameters that draw it.
const sub = (a, b) => a.map((v, i) => v - b[i]), add = (a, b) => a.map((v, i) => v + b[i]), mul = (a, k) => a.map(v => v * k);
const norm = a => { const L = Math.hypot(...a) || 1; return a.map(v => v / L); };
export { sub, add, mul, norm };

/**
 * Side view: a straight filled bar (class `eq`, with `poly`) from world point a to b, centred on the line, t thick.
 * Drawn by the backPad primitive in its `surface` form (a bar tangent to [upper, lower]; its face sits t/2 off the
 * line, so the line is shifted by t/2 along the pad normal first). Side view only: backPad draws a pad rectangle in
 * front view (use frontBar there).
 */
export function sideBar(a, b, t, extra = {}) {
  const u = norm(sub(b, a)), n = norm([0, -u[2], u[1]]), o = mul(n, t / 2);
  const lo = add(a, o), hi = add(b, o);
  return { type: 'backPad', surface: [hi, lo], len: Math.hypot(...sub(b, a)), below: 0, t, post: false, ...extra };
}

/** Front view: an axis-aligned filled bar (class `eq`) from a to b (horizontal or vertical on screen), t thick (m). */
export function frontBar(a, b, t, pxPerM, extra = {}) {
  const horiz = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]);
  const mid = mul(add(a, b), 0.5);
  // backPad front view: a rectangle centred on the pad's mid point, `width` wide, |a-b|/2 + 2 px tall (half height)
  if (horiz) return { type: 'backPad', at: [mid[0], mid[1], mid[2]], angle: 0, len: Math.max(0, t - 4 / pxPerM), below: Math.max(0, t - 4 / pxPerM) / 2, width: Math.abs(b[0] - a[0]), post: false, ...extra };
  const L = Math.abs(b[1] - a[1]);
  return { type: 'backPad', at: [mid[0], mid[1], mid[2]], angle: 0, len: Math.max(0, L - 4 / pxPerM), below: Math.max(0, L - 4 / pxPerM) / 2, width: t, post: false, ...extra };
}

/**
 * Engine keys each equipment item by `eq<entry>.<type>.<index within that primitive's output>`, so two items of the
 * same type returned by ONE function entry collide (the start layer and the Mistake then lose one of them).
 * perItem(fn, n) turns a composer function that returns up to n items into n entries, one item each:
 *   equipment: [...perItem((lm, ctx) => rope({...}), ROPE_ITEMS)]
 */
export const perItem = (fn, n) => Array.from({ length: n }, (_, k) => (lm, ctx) => [].concat(fn(lm, ctx) ?? [])[k] ?? null);
