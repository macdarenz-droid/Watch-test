// Label layout: text metrics (Inter, measured in Chromium), an occupancy raster of everything drawn,
// automatic callout placement and the leader lines. All units are plate px (SIZE x SIZE, y down).
import { d2, f, pt } from './geom.mjs';

// Advance widths (px) of .plate-callout text: Inter 600, 11 px, letter-spacing .06em, uppercase (measured).
const CAP = { 0: 7.916, 1: 5.312, 2: 7.514, 3: 7.659, 4: 7.987, 5: 7.396, 6: 7.697, 7: 7.202, 8: 7.702, 9: 7.697, A: 8.816, B: 7.912, C: 8.766, D: 8.604, E: 7.32, F: 7.127, G: 8.9, H: 8.862, I: 3.705, J: 7.036, K: 8.395, L: 6.88, M: 10.806, N: 9.012, O: 9.115, P: 7.755, Q: 9.162, R: 7.836, S: 7.815, T: 7.922, U: 8.755, V: 8.816, W: 12.117, X: 8.577, Y: 8.508, Z: 7.836, ' ': 3.432, '-': 5.779, '–': 6.16, '.': 4.168, ',': 4.168, '°': 5.698, '/': 4.828, '%': 11.709, '(': 4.764, ')': 4.764, "'": 4.243, '+': 8.062 };
// .plate-arc-label span: Inter 500, 12 px, tabular numbers (measured; lower case too).
const META = { a: 6.815, b: 7.418, c: 6.926, d: 7.418, e: 7.049, f: 4.098, g: 7.436, h: 7.219, i: 3.023, j: 3.023, k: 6.709, l: 3.023, m: 10.659, n: 7.219, o: 7.248, p: 7.418, q: 7.418, r: 4.787, s: 6.463, t: 4.045, u: 7.219, v: 6.897, w: 9.949, x: 6.686, y: 6.902, z: 6.709, ' ': 3.223, '-': 7.776, '–': 6, '.': 3.223, ',': 3.223, '°': 5.484, '/': 4.436, '%': 11.918, '(': 4.688, ')': 4.688, "'": 3.756, '+': 7.776, '0': 7.776 };
const LS = 0.66;   // trailing letter-spacing on the last glyph
export const lines = t => String(t).split(/<br\s*\/?>|\n/);
export const capWidth = t => Math.max(...lines(t).map(l => [...l.toUpperCase()].reduce((a, c) => a + (CAP[c] ?? 8), 0) - LS));
export const metaWidth = t => [...String(t)].reduce((a, c) => a + (META[c] ?? META[c.toLowerCase()] ?? (/\d/.test(c) ? 7.776 : 8.5)), 0);
export const CAP_LH = 14, META_LH = 16;

// ---- occupancy raster (2 px cells) with a summed-area table for O(1) rectangle counts ----
export class Occ {
  constructor(size, cell = 2) { this.size = size; this.c = cell; this.n = Math.ceil(size / cell); this.g = new Uint8Array(this.n * this.n); }
  set(i, j) { if (i >= 0 && j >= 0 && i < this.n && j < this.n) this.g[j * this.n + i] = 1; }
  poly(ps) {   // fill a closed polygon (even-odd) by cell centres, plus its outline
    if (!ps || ps.length < 3) return;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of ps) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const c = this.c;
    for (let j = Math.max(0, Math.floor(y0 / c)); j <= Math.min(this.n - 1, Math.floor(y1 / c)); j++) {
      const cy = (j + 0.5) * c;
      for (let i = Math.max(0, Math.floor(x0 / c)); i <= Math.min(this.n - 1, Math.floor(x1 / c)); i++) {
        const cx = (i + 0.5) * c; let inside = false;
        for (let a = 0, b = ps.length - 1; a < ps.length; b = a++) {
          const [xa, ya] = ps[a], [xb, yb] = ps[b];
          if ((ya > cy) !== (yb > cy) && cx < (xb - xa) * (cy - ya) / (yb - ya) + xa) inside = !inside;
        }
        if (inside) this.set(i, j);
      }
    }
    this.line([...ps, ps[0]], 1);
  }
  line(ps, w = 1) {   // thick polyline
    const c = this.c, r = Math.max(w / 2, c / 2);
    for (let k = 0; k + 1 < ps.length; k++) {
      const a = ps[k], b = ps[k + 1], L = d2(a, b), n = Math.max(1, Math.ceil(L / (c / 2)));
      for (let s = 0; s <= n; s++) {
        const x = a[0] + (b[0] - a[0]) * s / n, y = a[1] + (b[1] - a[1]) * s / n;
        for (let j = Math.floor((y - r) / c); j <= Math.floor((y + r) / c); j++) for (let i = Math.floor((x - r) / c); i <= Math.floor((x + r) / c); i++) this.set(i, j);
      }
    }
  }
  rect(x0, y0, x1, y1) { for (let j = Math.floor(y0 / this.c); j <= Math.floor(y1 / this.c); j++) for (let i = Math.floor(x0 / this.c); i <= Math.floor(x1 / this.c); i++) this.set(i, j); }
  build() { const n = this.n, S = new Int32Array((n + 1) * (n + 1)); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) S[(j + 1) * (n + 1) + i + 1] = this.g[j * n + i] + S[j * (n + 1) + i + 1] + S[(j + 1) * (n + 1) + i] - S[j * (n + 1) + i]; this.S = S; return this; }
  count(x0, y0, x1, y1) {   // occupied cells overlapping the px rectangle
    const n = this.n, c = this.c, S = this.S;
    const i0 = Math.max(0, Math.floor(x0 / c)), j0 = Math.max(0, Math.floor(y0 / c)), i1 = Math.min(n, Math.ceil(x1 / c)), j1 = Math.min(n, Math.ceil(y1 / c));
    if (i1 <= i0 || j1 <= j0) return 0;
    return S[j1 * (n + 1) + i1] - S[j0 * (n + 1) + i1] - S[j1 * (n + 1) + i0] + S[j0 * (n + 1) + i0];
  }
  at(x, y) { const i = Math.floor(x / this.c), j = Math.floor(y / this.c); return i >= 0 && j >= 0 && i < this.n && j < this.n ? this.g[j * this.n + i] : 0; }
  toJSON() { return { size: this.size, cell: this.c, n: this.n, bits: Buffer.from(this.g).toString('base64') }; }
}

// ---- callout geometry ----
// Callout button: ink box (the text) sits inside a 44 px button with 6 px side padding, vertically centred.
export const inkBox = (text, left, top) => {   // from button left/top
  const L = lines(text).length, w = capWidth(text), h = L * CAP_LH;
  return { x0: left + 6, y0: top + 22 - h / 2, x1: left + 6 + w, y1: top + 22 + h / 2, w, h };
};
export const arcBox = (title, value, left, top) => ({ x0: left, y0: top, x1: left + Math.max(capWidth(title), metaWidth(value)), y1: top + CAP_LH + 2 + META_LH });
const overlap = (a, b, m = 0) => a.x0 - m < b.x1 && b.x0 - m < a.x1 && a.y0 - m < b.y1 && b.y0 - m < a.y1;

/** Leader for a callout: from the anchor to the ink box (reference style). Returns { d, pts }. */
export function leaderFor(anchor, box) {
  const midY = (box.y0 + box.y1) / 2, [ax, ay] = anchor;
  if (ax < box.x0 - 8 || ax > box.x1 + 8) {   // beside: diagonal to a bend 10 px before the text, then horizontal
    const right = ax < box.x0, ex = right ? box.x0 - 1 : box.x1 + 1, bx = right ? ex - 10 : ex + 10;
    if (Math.abs(ay - midY) < 3) return { pts: [anchor, [ex, midY]], d: `M${pt(anchor)}L${f(ex)} ${f(midY)}` };
    return { pts: [anchor, [bx, midY], [ex, midY]], d: `M${pt(anchor)}L${f(bx)} ${f(midY)}H${f(ex)}` };
  }
  const above = ay > box.y1, ey = above ? box.y1 + 4 : box.y0 - 4;   // over/under: vertical to 4 px off the text
  return { pts: [anchor, [ax, ey]], d: `M${pt(anchor)}L${f(ax)} ${f(ey)}` };
}

/**
 * Place labels. items: [{ key, kind: 'callout'|'arc', text | title+value, anchor:[x,y], box?:{left,top}, prefer?: 'left'|'right'|'above'|'below' }].
 * reserved: [{x0,y0,x1,y1}] boxes already taken (meta label). Returns items with .btn {left, top} and .ink box.
 */
const segX = (p, q, r, s) => {   // proper intersection of segments pq and rs
  const o = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
  return o(p, q, r) * o(p, q, s) < 0 && o(r, s, p) * o(r, s, q) < 0;
};
export function placeLabels(items, occ, size, reserved = [], margin = 8) {
  const placed = [...reserved], wires = [];
  const order = [...items].sort((a, b) => (a.box ? 0 : 1) - (b.box ? 0 : 1) || (b.w ?? 0) - (a.w ?? 0));
  for (const it of order) {
    const mk = (l, t) => it.kind === 'arc' ? arcBox(it.title, it.value, l, t) : inkBox(it.text, l, t);
    if (it.box) { it.btn = it.box; it.ink = mk(it.box.left, it.box.top); placed.push(it.ink);
      if (it.anchor) { const L = leaderFor(it.anchor, it.ink); for (let k = 0; k + 1 < L.pts.length; k++) wires.push([L.pts[k], L.pts[k + 1]]); }
      continue; }
    let best = null;
    const w0 = mk(0, 0), iw = w0.x1 - w0.x0, ih = w0.y1 - w0.y0, dx = w0.x0, dy = w0.y0;
    for (let y = margin; y + ih <= size - margin; y += 2) for (let x = margin; x + iw <= size - margin; x += 2) {
      const b = { x0: x, y0: y, x1: x + iw, y1: y + ih };
      if (placed.some(p => overlap(p, b, 8))) continue;
      const hit = occ.count(b.x0 - 3, b.y0 - 3, b.x1 + 3, b.y1 + 3);
      if (hit > 0) continue;
      let cost = occ.count(b.x0 - 8, b.y0 - 8, b.x1 + 8, b.y1 + 8) * 3;   // soft clearance: prefer open space
      if (it.anchor) {
        const L = leaderFor(it.anchor, b);
        let len = 0, cross = 0;
        for (let k = 0; k + 1 < L.pts.length; k++) {
          const a = L.pts[k], c = L.pts[k + 1], seg = d2(a, c); len += seg;
          for (let s = 0; s <= seg; s += 2) { const px = a[0] + (c[0] - a[0]) * s / (seg || 1), py = a[1] + (c[1] - a[1]) * s / (seg || 1);
            if (d2(px === undefined ? a : [px, py], it.anchor) > 7 && occ.at(px, py)) cross++;
            if (placed.some(p => px > p.x0 - 2 && px < p.x1 + 2 && py > p.y0 - 2 && py < p.y1 + 2)) cross += 20; }
        }
        for (let k = 0; k + 1 < L.pts.length; k++) for (const [p, q] of wires) if (segX(L.pts[k], L.pts[k + 1], p, q)) cost += 600;
        cost += len + cross * 60;
        const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
        if (it.prefer === 'right' && cx < it.anchor[0]) cost += 400;
        if (it.prefer === 'left' && cx > it.anchor[0]) cost += 400;
        if (it.prefer === 'above' && cy > it.anchor[1]) cost += 400;
        if (it.prefer === 'below' && cy < it.anchor[1]) cost += 400;
      }
      if (!best || cost < best.cost) best = { cost, b };
    }
    if (!best) { it.btn = { left: margin, top: margin }; it.ink = mk(margin, margin); it.unplaced = true; placed.push(it.ink); continue; }
    it.ink = best.b; it.btn = { left: best.b.x0 - dx, top: best.b.y0 - dy };
    placed.push(it.ink);
    if (it.anchor) { const L = leaderFor(it.anchor, it.ink); for (let k = 0; k + 1 < L.pts.length; k++) wires.push([L.pts[k], L.pts[k + 1]]); }
  }
  return items;
}

/** Engine-side label check (estimated ink boxes). Returns a list of issue strings. */
export function checkLabels(items, occ, joints, size, margin = 8) {
  const out = [];
  items.forEach((a, i) => {
    const b = a.ink, name = a.text ?? a.title;
    if (a.unplaced) out.push(`unplaced:${name}`);
    if (b.x0 < margin || b.y0 < margin || b.x1 > size - margin || b.y1 > size - margin) out.push(`edge:${name}`);
    items.slice(i + 1).forEach(c => { if (overlap(b, c.ink)) out.push(`overlap:${name}|${c.text ?? c.title}`); });
    const hit = occ.count(b.x0, b.y0, b.x1, b.y1);
    if (hit > 0) out.push(`figure:${name}:${hit}cells`);
    for (const j of joints) if (j.p[0] > b.x0 - 3 && j.p[0] < b.x1 + 3 && j.p[1] > b.y0 - 3 && j.p[1] < b.y1 + 3) out.push(`joint:${name}|${j.k}`);
  });
  return out;
}
