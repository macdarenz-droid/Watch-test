// End-on inset for `hold` dumbbell exercises: "thumb vs little finger" at the top of a raise (architecture 4.2
// FAULT inset, A2). hand.mjs draws only the 'radial' view, so this small drawing stands in for its 'end-on' view.
// Camera: from the lifter's side, looking along the raised arm, lifter facing screen right. The arm points at the
// camera, so we see the flat of the fist (the backs of the finger bones), the thumb closed over the index finger on the
// front side, and the dumbbell side-on: handle across, one head in front (thumb end), one behind (little-finger end).
// Sizes (mm): handle 130 x 32 and heads 70 long, hex 119 across corners, as the plate engine's dumbbell (SPEC.md 5);
// fist 84 wide across the four fingers (hand breadth, about .054 H at H 1.75 m; Winter 2009 hand length .108 H is the
// only published proportion used elsewhere; the breadth is a drawing value). Every colour is a theme token (HAND_CSS).
const f = v => +v.toFixed(2);
const RAD = Math.PI / 180;
const rot = (p, a, c) => { const s = Math.sin(a * RAD), k = Math.cos(a * RAD); return [c[0] + (p[0] - c[0]) * k - (p[1] - c[1]) * s, c[1] + (p[0] - c[0]) * s + (p[1] - c[1]) * k]; };
const rr = (x, y, w, h, r) => `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${r} ${r} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}A${r} ${r} 0 0 1 ${f(x + w - r)} ${f(y + h)}H${f(x + r)}A${r} ${r} 0 0 1 ${f(x)} ${f(y + h - r)}V${f(y + r)}A${r} ${r} 0 0 1 ${f(x + r)} ${f(y)}Z`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const iconCheck = (x, y, sz) => `<path class="h-icon ok" transform="translate(${f(x)} ${f(y)}) scale(${f(sz / 24)})" d="M5 12l4 4L19 7"/>`;
const iconCross = (x, y, sz) => `<path class="h-icon no" transform="translate(${f(x)} ${f(y)}) scale(${f(sz / 24)})" d="M6 6l12 12M18 6L6 18"/>`;

/** One panel (w x h px): the dumbbell rolled by rollDeg (+ = little-finger end up), origin at the handle centre. */
function panel({ x0, w, top, h, rollDeg, role }) {
  const k = 0.42;                                   // px per mm
  const c = [x0 + w / 2, top + h * 0.42];           // handle centre
  const P = (u, v) => [c[0] + u * k, c[1] + v * k];   // u toward the front (thumb end), v down, before rolling
  const g = [];
  // dumbbell: two heads (hex seen side-on: 103 mm across flats shows as the height), handle between
  const head = u => `<path class="h-eq" d="${rr(P(u - 35, 0)[0], P(0, -59.5)[1], 70 * k, 119 * k, 3)}"/><path class="h-eq-core" d="M${f(P(u - 35, 0)[0] + 3)} ${f(c[1])}H${f(P(u + 35, 0)[0] - 3)}"/>`;
  g.push(`<path class="h-eq" d="${rr(P(-65, 0)[0], P(0, -16)[1], 130 * k, 32 * k, 16 * k)}"/>`);
  g.push(head(-100), head(100));
  // fist: the curled fingers seen end-on, 4 fingers 21 mm wide side by side, from the knuckle line 22 mm above the
  // handle axis down to the rounded finger ends 38 mm below it (the fingers close under the handle), creases between
  const fr = 10.5, fb = 28;   // finger end radius, where the rounded ends start (mm)
  let fist = `M${f(P(-42, -13)[0])} ${f(P(0, -13)[1])}Q${f(P(-42, 0)[0])} ${f(P(0, -22)[1])} ${f(P(-33, 0)[0])} ${f(P(0, -22)[1])}`
    + `H${f(P(33, 0)[0])}Q${f(P(42, 0)[0])} ${f(P(0, -22)[1])} ${f(P(42, 0)[0])} ${f(P(0, -13)[1])}V${f(P(0, fb)[1])}`;
  for (const u of [21, 0, -21, -42]) fist += `A${f(fr * k)} ${f(fr * k)} 0 0 1 ${f(P(u, 0)[0])} ${f(P(0, fb)[1])}`;
  g.push(`<g class="h-skin"><path class="fist" d="${fist}Z"/></g>`);
  let creases = '';
  for (const u of [-21, 0, 21]) creases += `M${f(P(u, 0)[0])} ${f(P(0, -12)[1])}V${f(P(0, fb + 1)[1])}`;
  g.push(`<path class="h-crease" d="${creases}"/>`);
  // thumb: wrapped round the thumb end of the handle and resting along it, across the front (index) finger just
  // below the handle axis; the nearest shape, drawn heaviest, with a nail line at its tip
  const t0 = P(50, 5), t1 = P(12, 8), tw = 16 * k;
  const seg = `M${f(t0[0])} ${f(t0[1])}L${f(t1[0])} ${f(t1[1])}`;
  const d = [t1[0] - t0[0], t1[1] - t0[1]], dl = Math.hypot(...d), u = [d[0] / dl, d[1] / dl], nn = [-u[1], u[0]];
  const nail0 = [t1[0] - u[0] * 6 - nn[0] * 1.6, t1[1] - u[1] * 6 - nn[1] * 1.6], nail1 = [t1[0] - u[0] * 0.5 - nn[0] * 1.4, t1[1] - u[1] * 0.5 - nn[1] * 1.4];
  g.push(`<g class="h-thumb"><path class="thumb-o" d="${seg}" stroke-width="${f(tw + 5)}"/><path class="thumb-i" d="${seg}" stroke-width="${f(tw)}"/>`
    + `<path class="h-nail" d="M${f(nail0[0])} ${f(nail0[1])}L${f(nail1[0])} ${f(nail1[1])}"/></g>`);
  const drawing = `<g transform="rotate(${rollDeg} ${f(c[0])} ${f(c[1])})">${g.join('')}</g>`;
  // level datum through the handle centre; wrong: the rolled axis and the angle between them at the little-finger end
  let over = `<path class="h-datum" d="M${f(x0 + 8)} ${f(c[1])}H${f(x0 + w - 8)}"/>`;
  if (role === 'wrong' && rollDeg) {
    const L = 46, a = [c[0] - L, c[1]], b = rot([c[0] - L, c[1]], rollDeg, c);   // screen: left end rises
    over += `<path class="h-arc" d="M${f(c[0])} ${f(c[1])}L${f(a[0])} ${f(a[1])}A${L} ${L} 0 0 1 ${f(b[0])} ${f(b[1])}Z"/>`;
  }
  // end labels, under the dumbbell, never rotated
  const ly = top + h - 6;
  const labels = `<text class="h-note" x="${f(x0 + 8)}" y="${f(ly)}">LITTLE FINGER</text><text class="h-note" x="${f(x0 + w - 8)}" y="${f(ly)}" text-anchor="end">THUMB</text>`;
  return drawing + over + labels;
}

/**
 * Inset strip: Right (level) and Wrong (little finger up), side by side, with its own label and camera label.
 * spec: { label, camera, right: { rollDeg, note }, wrong: { rollDeg, note }, alt: { right, wrong }, uid, width = 358 }
 * label (what the inset compares) and camera ("Seen from the side") print on two lines, both read by TalkBack.
 */
export function renderEndOnInset(spec) {
  if (!spec.label || !spec.camera) throw new Error('end-on inset needs label and camera');
  const dy = 16, width = spec.width ?? 358, gap = 16, pw = (width - gap) / 2, top = 62 + dy, ph = 108, height = top + ph + 6;
  const head = (x, ok, note) => (ok ? iconCheck(x, 26 + dy, 16) : iconCross(x, 26 + dy, 16)) + `<text class="h-head" x="${f(x + 21)}" y="${39 + dy}">${ok ? 'Right' : 'Wrong'}</text>`
    + `<text class="h-note${ok ? '' : ' m'}" x="${f(x + 21)}" y="${55 + dy}">${esc(note.toUpperCase())}</text>`;
  const aria = `${spec.label}, ${spec.camera.charAt(0).toLowerCase()}${spec.camera.slice(1)}. Right: ${spec.alt.right} Wrong: ${spec.alt.wrong}`;
  const svg = `<svg class="hand-svg end-on" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(aria)}" xmlns="http://www.w3.org/2000/svg">`
    + `<text class="h-cam" x="${f(width / 2)}" y="21" text-anchor="middle">${esc(spec.label.toUpperCase())}</text>`
    + `<text class="h-cam" x="${f(width / 2)}" y="${21 + dy}" text-anchor="middle">${esc(spec.camera.toUpperCase())}</text>`
    + head(10, true, spec.right.note) + head(pw + gap + 10, false, spec.wrong.note)
    + `<path class="h-divider" d="M${f(pw + gap / 2)} ${top - 4}V${height - 10}"/>`
    + `<g class="zx-half right">${panel({ x0: 0, w: pw, top, h: ph, rollDeg: spec.right.rollDeg, role: 'right' })}</g>`   // each half its own image (2.5)
    + `<g class="zx-half wrong">${panel({ x0: pw + gap, w: pw, top, h: ph, rollDeg: spec.wrong.rollDeg, role: 'wrong' })}</g>`
    + `</svg>`;
  return { svg, height };
}

/** Extra classes for the inset (tokens only): the fist and thumb use the hand's skin look. */
export const END_ON_CSS = `
.hand-svg.end-on .h-skin .fist { fill: var(--surface-3); stroke: var(--text-2); stroke-width: 2; stroke-linejoin: round; }
.hand-svg.end-on .h-thumb .thumb-o { fill: none; stroke: var(--text-2); stroke-linecap: round; }
.hand-svg.end-on .h-thumb .thumb-i { fill: none; stroke: var(--surface-3); stroke-linecap: round; }
`;
