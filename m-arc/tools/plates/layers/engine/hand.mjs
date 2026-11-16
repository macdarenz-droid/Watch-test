// Hand close-up renderer (build time, SVG). Architecture: grip/GRIP-AND-FEEL-ARCHITECTURE.md 4.2 (HandPose) and 5.1.
//
//   renderHand(pose, opts)      -> { svg, report }   one hand, standalone <svg>
//   renderHandPair(spec)        -> { svg, report }   "Right" and "Wrong" side by side, camera label, icons, alt text
//   HAND_CSS                    -> the classes the SVG uses (every colour is a theme token)
//
// Drawing model: the radial view (thumb side toward the camera), the only view where the wrist's back-and-forward bend
// lies flat on the screen. The handle is seen end-on (a circle). With vertical press handles that view is "seen from
// above"; with horizontal bars it is "seen from the side". Coordinates: hand frame in mm, u = toward the fingers,
// v = toward the back of the hand; the wrist centre is the origin and the bend pivot.
//
// Proportions. Hand length HL = 0.108 H (Winter 2009, as the plate, SPEC.md 2), wrist crease to middle fingertip.
// Segment lengths are fractions of HL computed from the digitised bony landmarks of one measured specimen (hand length
// 203 mm): supplementary Tables S1 and S2a-f of Ann Biomed Eng, doi:10.1007/s10439-017-1936-z (ESM1). Finger segments
// are dorsal head-to-head distances; thumb segments use joint centres (mid-point of the radial and ulnar head points).
// One specimen, so these are "a real hand", not population means. Thicknesses are drawing values, checked against the
// same specimen's circumferences (wrist 200 mm, hand at the knuckles 223 mm) to within about 15 %.
import { f, pt, spline } from './geom.mjs';

const RAD = Math.PI / 180;
export const HAND_OF_H = 0.108;
// fractions of HL (see header). mcp: [u, v] of each knuckle; seg: proximal, middle, distal (+ pulp allowance .015)
export const HAND_PROP = {
  index:  { mcp: [0.415, 0], seg: [0.236, 0.167, 0.125] },
  middle: { mcp: [0.438, -0.008], seg: [0.281, 0.137, 0.158] },
  ring:   { mcp: [0.391, -0.03], seg: [0.242, 0.168, 0.141] },
  little: { mcp: [0.367, -0.052], seg: [0.202, 0.114, 0.132] },
  thumb:  { cmc: [0.085, -0.05], seg: [0.178, 0.207, 0.155] },
};
// Handle diameters (mm). bar-28: the standard men's barbell. The others are typical gym handles, drawing values.
export const HANDLES = {
  'press-vertical': { d: 32, label: 'Vertical handle' },
  'press-horizontal': { d: 32, label: 'Horizontal handle' },
  'machine-grip': { d: 32 }, 'bar-28': { d: 28 }, 'bar-32': { d: 32 }, 'round-bar': { d: 28 },
  'pulldown-bar': { d: 28 }, 'dumbbell': { d: 32 }, 'v-handle': { d: 30 }, 'd-handle': { d: 30 },
  'leg-press-handle': { d: 30 }, 'pad-handle': { d: 30 },
};
// Lever limits (along-forearm loads only). The wrist is ~42 mm thick at the crease (+-21 mm) and its bones fill
// about +-15 mm of that, so a right push line passes within 15 mm of the wrist centre (it runs through the wrist
// bones). A wrong line must sit at least 20 mm on the back-of-hand side: outside the skin of the back of the wrist.
export const LEVER = { maxRightMm: 15, minWrongMm: 20 };

// ---------- small vector helpers (2D) ----------
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const len = a => Math.hypot(a[0], a[1]);
const dir = a => [Math.cos(a * RAD), Math.sin(a * RAD)];
const segDist = (p, a, b) => { const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1))); return len(sub(p, add(a, mul(ab, t)))); };
const lerpPts = (pts, x) => {   // piecewise-linear v(u) through [[u, v], ...] sorted by u
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, b] = [pts[i - 1], pts[i]]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); }
  return pts[pts.length - 1][1];
};

// Capsule outline (tapered) from P (radius r1) to Q (radius r2), as a point ring.
function capsule(P, Q, r1, r2, n = 10) {
  const d = sub(Q, P), L = len(d) || 1e-6, u = mul(d, 1 / L), nrm = [-u[1], u[0]], ps = [];
  const ring = (C, r, a0, a1) => { for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; ps.push(add(C, add(mul(u, Math.cos(a) * r), mul(nrm, Math.sin(a) * r)))); } };
  ring(Q, r2, Math.PI / 2, -Math.PI / 2);
  ring(P, r1, -Math.PI / 2, -3 * Math.PI / 2);
  return ps;
}
const polyD = ps => 'M' + ps.map(pt).join('L') + 'Z';
// Fill-only half disk behind a joint (screen px): hides a segment's rounded base where it grows out of the palm,
// keeping its side lines. C = joint, D = next joint (direction), r = radius in px.
function basePatch(C, D, r) {
  const a = Math.atan2(D[1] - C[1], D[0] - C[0]), ps = [];
  for (let i = 0; i <= 12; i++) { const t = a + Math.PI / 2 + Math.PI * i / 12; ps.push([C[0] + Math.cos(t) * r, C[1] + Math.sin(t) * r]); }
  return `<path class="h-patch" d="${polyD(ps)}"/>`;
}

// ---------- the wrap solve ----------
// A chain of segments from `base`, starting direction a0 (deg, hand frame). Each joint rotates by sign*theta
// (fingers flex toward the palm: sign -1; the thumb wraps the other way round the handle: sign +1) from thMin until the
// segment's capsule first touches the handle circle, or to its limit. curl scales the solved flexion; open peels.
function solveChain({ base, a0, segs, circle, sign, limits, thMin = [-25, -5, -5], curl = 1, open = 0 }) {
  const pts = [base], angs = []; let a = a0, P = base;
  segs.forEach((s, i) => {
    let th = limits[i], touched = false;
    const baseInside = len(sub(P, circle.c)) < circle.r + s.t;   // this joint already sits against the handle
    for (let t = [].concat(thMin)[i] ?? 0; t <= limits[i] && !baseInside; t += 0.5) {
      const E = add(P, mul(dir(a + sign * t), s.L));
      if (segDist(circle.c, P, E) <= circle.r + s.t) { th = t; touched = true; break; }
    }
    th = th * curl * (1 - open * (i === 0 ? 0.35 : 1));
    a = a + sign * th; angs.push({ th, touched });
    P = add(P, mul(dir(a), s.L)); pts.push(P);
  });
  return { pts, angs };
}

// ---------- the pose ----------
const DEF_POSE = {
  view: 'radial', forearm: 90, wrist: { ext: 0, dev: 0 }, contactAt: 0.3, fingers: { curl: 1, open: 0 },
  thumb: 'wrapped', squeeze: 'firm', handle: { profile: 'press-vertical', axis: 'across' }, load: { kind: 'push' },
};
const normPose = p => ({ ...DEF_POSE, ...p, wrist: { ...DEF_POSE.wrist, ...(p.wrist ?? {}) }, fingers: { ...DEF_POSE.fingers, ...(p.fingers ?? {}) },
  handle: { ...DEF_POSE.handle, ...(p.handle ?? {}) }, load: { ...DEF_POSE.load, ...(p.load ?? {}) } });

// Geometry of one hand in mm, wrist centre at the origin, forearm frame = screen-independent (x along the forearm
// toward the hand, y toward the back of the hand). Returns shapes in that frame; the caller maps them to the screen.
export function handGeometry(poseIn, { H = 1750 } = {}) {
  const pose = normPose(poseIn);
  if (pose.view !== 'radial') throw new Error(`hand view '${pose.view}' is not drawn yet (only 'radial')`);
  const HL = HAND_OF_H * H, s = HL / 189;          // thickness values below are for HL 189 mm (H 1.75 m)
  const e = pose.wrist.ext;
  const toF = ([u, v]) => { const c = Math.cos(e * RAD), sn = Math.sin(e * RAD); return [u * c - v * sn, u * sn + v * c]; };   // hand -> forearm frame
  const hP = HAND_PROP, mcpI = [hP.index.mcp[0] * HL, 0];
  // palm outline (hand frame), dorsal then round the knuckle then palmar
  const palmar = [[0, -21], [8, -22.5], [22, -23], [38, -19.5], [55, -17], [72, -15.5], [80, -14.5]].map(([u, v]) => [u * s, v * s]);
  const tPP = 9.8 * s, tMP = 8.6 * s, tDP = 7.4 * s;
  // handle: the contact point on the palm (or the finger base), pressed in by `comp`, the circle behind it
  const prof = HANDLES[pose.handle.profile] ?? HANDLES['machine-grip'];
  const R = (pose.handle.diameterMm ?? prof.d) / 2, comp = 3.5 * s;
  // contactAt is measured along the palm on its little-finger side (0 wrist crease, ~.2 heel, 1 finger base). A gripped
  // handle lies diagonally across the palm (heel of the palm on the little-finger side, base of the index on the thumb
  // side), and the radial view looks straight along it, so the circle shows where it crosses the index-finger side:
  // u = (0.5 + 0.5 * contactAt) of the palm length. Heel (.3) -> 0.65 of the palm, finger base (1) -> the knuckle
  // line, tips (1.6) -> 1.3 (out in the fingers).
  const uc = (0.5 + 0.5 * pose.contactAt) * mcpI[0];
  const surf = lerpPts(palmar, uc);   // beyond the knuckle line: the crease at the base of the fingers
  const contact = [uc, surf + comp];
  const circle = { c: [uc, surf + comp - R], r: R };
  // fingers
  const fingerOf = (name, extra = {}) => {
    const F = hP[name], base = [F.mcp[0] * HL, F.mcp[1] * HL];
    const segs = F.seg.map((l, i) => ({ L: l * HL, t: [tPP, tMP, tDP][i] * (name === 'little' ? 0.88 : name === 'ring' ? 0.95 : 1) }));
    return { name, ...solveChain({ base, a0: 0, segs, circle, sign: -1, limits: [95, 110, 80], curl: pose.fingers.curl, open: pose.fingers.open, ...extra }), segs };
  };
  const index = fingerOf('index'), far = ['middle'].map(n => fingerOf(n));   // ring and little sit behind these two in this view
  // thumb: metacarpal inside the thenar pad, then the 2 visible segments
  const T = hP.thumb, cmc = [T.cmc[0] * HL, T.cmc[1] * HL];
  const tsegs = T.seg.map((l, i) => ({ L: l * HL, t: [11 * s, 9.2 * s, 8 * s][i] }));
  // Thumb. Drawn nearest (radial view): the thenar pad (metacarpal) and 2 visible segments. Wrapped: the tip rests on
  // the index finger's middle segment (a closed ring round the handle). 2-link reach for the proximal and distal
  // segments, bending away from the handle.
  const mode = pose.thumb, L1 = tsegs[1].L, L2 = tsegs[2].L;
  let thumb;
  const ixp = index.pts;
  if (mode === 'over' || mode === 'beside') {   // thumb laid along the index, same side of the handle as the fingers
    // the tip lies on the index finger's first segment, just past the handle (foreshortened like the wrapped thumb)
    const T = add(ixp[0], mul(sub(ixp[1], ixp[0]), 0.55)), aT = Math.atan2(T[1] - cmc[1], T[0] - cmc[0]) / RAD;
    const aMC = pose.thumbMC ?? aT - 12, mc = add(cmc, mul(dir(aMC), tsegs[0].L));
    const l1 = L1 * 0.85, l2 = L2 * 0.85, bend = -10, beta = Math.atan2(l2 * Math.sin(bend * RAD), l1 + l2 * Math.cos(bend * RAD)) / RAD;
    const aPP = Math.atan2(T[1] - mc[1], T[0] - mc[0]) / RAD - beta;
    const ip = add(mc, mul(dir(aPP), l1)), tip = add(ip, mul(dir(aPP + bend), l2));
    thumb = { pts: [cmc, mc, ip, tip] };
  } else {
    // metacarpal (inside the thenar pad): sweep from pointing back toward the wrist until the pad meets the handle,
    // so the pad lies against the handle on the wrist side. Out of reach: -50 (the resting angle).
    let aMC = pose.thumbMC ?? null;
    if (aMC == null) { aMC = -50; for (let a = -175; a <= -30; a += 0.5) { const E = add(cmc, mul(dir(a), tsegs[0].L)); if (segDist(circle.c, cmc, E) <= R + tsegs[0].t) { aMC = a; break; } } }
    const mc = add(cmc, mul(dir(aMC), tsegs[0].L));
    // The thumb wraps round the handle in its own plane, which is turned toward the camera, so in this view its two
    // segments are foreshortened (x0.85) and it reads as lying across the curled fingers. Wrapped: the tip rests on
    // the index finger's middle segment, next to its middle knuckle. Loose: barely bent, not closed round the handle.
    const fs = 0.85, l1 = L1 * fs, l2 = L2 * fs;
    let ip, tip;
    if (mode === 'loose' || mode === 'spread') {       // resting against the handle, not closed round the fingers
      const T = add(circle.c, mul(dir(-115), R + tsegs[2].t)), bend = 12;
      const beta = Math.atan2(l2 * Math.sin(bend * RAD), l1 + l2 * Math.cos(bend * RAD)) / RAD;
      const aPP = Math.atan2(T[1] - mc[1], T[0] - mc[0]) / RAD - beta;
      ip = add(mc, mul(dir(aPP), l1)); tip = add(ip, mul(dir(aPP + bend), l2));
    } else {
      // the tip aims at the index finger's middle knuckle (hook: further under, pinned by the fingers); the
      // interphalangeal joint shows a fixed 22 deg bend in this view
      // target: the point of the index finger's middle or distal segment nearest the handle's palm-side pole, so the
      // thumb closes the ring on the far side of the handle from the palm (hook: a little deeper, under the fingers)
      const pole = add(circle.c, mul(dir(-55), R + tsegs[2].t)), near = (a, b) => { const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(pole, a), ab) / dot(ab, ab))); return { p: add(a, mul(ab, t)), d: len(sub(pole, add(a, mul(ab, t)))) }; };
      const cands = [near(ixp[1], ixp[2]), near(ixp[2], ixp[3])].sort((x, y) => x.d - y.d);
      const T = mode === 'hook' ? add(cands[0].p, mul(sub(circle.c, cands[0].p), 0.25)) : mode === 'wrapped-light' ? add(cands[0].p, mul(sub(cands[0].p, circle.c), 0.15)) : cands[0].p;
      const bend = 22, beta = Math.atan2(l2 * Math.sin(bend * RAD), l1 + l2 * Math.cos(bend * RAD)) / RAD;
      const aPP = Math.atan2(T[1] - mc[1], T[0] - mc[0]) / RAD - beta;
      ip = add(mc, mul(dir(aPP), l1)); tip = add(ip, mul(dir(aPP + bend), l2));
    }
    const rest = { pts: [mc, ip, tip] };
    thumb = { pts: [cmc, ...rest.pts] };
  }
  const angOf = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / RAD;
  thumb.angs = [angOf(thumb.pts[0], thumb.pts[1]), angOf(thumb.pts[1], thumb.pts[2]) - angOf(thumb.pts[0], thumb.pts[1]), angOf(thumb.pts[2], thumb.pts[3]) - angOf(thumb.pts[1], thumb.pts[2])].map(th => ({ th }));
  // forearm (forearm frame). Profile: dorsal / palmar skin at distance a from the wrist centre (a < 0).
  const fore = { top: [[-105, 26.8], [-70, 23.5], [-35, 21], [-10, 20], [0, 19.5]], bot: [[-105, -38.5], [-70, -32], [-35, -25.5], [-10, -22], [0, -21]] };
  const foreS = { top: fore.top.map(([a, v]) => [a * s, v * s]), bot: fore.bot.map(([a, v]) => [a * s, v * s]) };
  return { pose, HL, s, e, toF, mcpI, palmar, circle, contact, index, far, thumb, tsegs, fore: foreS, tPP, tMP, tDP, R };
}

// ---------- drawing ----------
// frame: { W: [x, y] screen px, k: px per mm, forearm: deg (0 = pointing down the screen, 90 = right, 180 = up) }
function makeProj(g, { W, k }) {
  const th = g.pose.forearm * RAD;
  const U = [Math.sin(th), Math.cos(th)], m = g.pose.mirror ? -1 : 1, V = [m * U[1], -m * U[0]];   // V = U turned 90 deg counter-clockwise on screen (mirror: clockwise)
  const F = ([a, b]) => [W[0] + k * (a * U[0] + b * V[0]), W[1] + k * (a * U[1] + b * V[1])];
  const Hh = p => F(g.toF(p));
  return { U, V, F, Hh, k, W };
}

const arrowHead = (tip, from, sz = 5) => { const L = Math.hypot(tip[0] - from[0], tip[1] - from[1]) || 1, t = [(tip[0] - from[0]) / L, (tip[1] - from[1]) / L], n = [-t[1], t[0]];
  return `M${pt([tip[0] - t[0] * sz + n[0] * sz * .62, tip[1] - t[1] * sz + n[1] * sz * .62])}L${pt(tip)}L${pt([tip[0] - t[0] * sz - n[0] * sz * .62, tip[1] - t[1] * sz - n[1] * sz * .62])}Z`; };

// All the drawable pieces of one hand, in screen px, plus the report. uid keeps <defs> ids unique on the page.
function drawHand(g, frame, { uid = 'h', role = 'right', markers = [], loadAxis, datum = true } = {}) {
  const P = makeProj(g, frame), { Hh, F, k } = P, s = g.s;
  const defs = [], out = { far: '', handle: '', skin: '', near: '', thumb: '', detail: '', over: '' };
  const def = (name, d) => { const id = `${uid}-${name}`; defs.push(`<path id="${id}" d="${d}"/>`); return id; };
  const uses = ids => ids.map(i => `<use href="#${i}"/>`).join('');
  const union = (ids, cls) => `<g class="${cls}"><g class="u-stroke">${uses(ids)}</g><g class="u-fill">${uses(ids)}</g></g>`;
  const pts = [];   // everything drawn, for fitting
  const track = ps => { ps.forEach(p => pts.push(p)); return ps; };
  const circ = g.circle;
  const hug = circ.r - 3.5 * s;   // the skin pressed round the handle, sunk in by the compression
  const outsideCircle = p => { const d = sub(p, circ.c), L = len(d); return L < hug ? add(circ.c, mul(d, hug / L)) : p; };
  const resample = (ps, step) => { const o = [ps[0]]; for (let i = 1; i < ps.length; i++) { const a = ps[i - 1], b = ps[i], n = Math.max(1, Math.ceil(len(sub(b, a)) / step)); for (let j = 1; j <= n; j++) o.push(add(a, mul(sub(b, a), j / n))); } return o; };

  // far fingers (behind everything): lighter line, own union
  const farIds = g.far.map(fg => {
    const caps = fg.pts.slice(0, -1).map((p0, i) => capsule(p0, fg.pts[i + 1], fg.segs[i].t, i === 2 ? fg.segs[i].t * 0.85 : fg.segs[i + 1]?.t ?? fg.segs[i].t));
    return caps.map((c, i) => def(`far-${fg.name}-${i}`, polyD(track(c.map(Hh)))));
  }).flat();
  out.far = union(farIds, 'h-far');

  // handle, end-on
  const hc = Hh(circ.c), hr = circ.r * k, prof = g.pose.handle.profile;
  let hx = '';
  let hb = '';   // parts of the equipment behind the hand
  if (prof === 'dumbbell') { const r2 = (g.pose.handle.headMm ?? 120) / 2 * k; hb += `<circle class="h-eq-thin" cx="${f(hc[0])}" cy="${f(hc[1])}" r="${f(r2)}"/>`; track([[hc[0] - r2, hc[1] - r2], [hc[0] + r2, hc[1] + r2]]); }
  if (prof === 'v-handle' || prof === 'leg-press-handle' || prof === 'pad-handle') {
    const sd = g.pose.handle.strut ?? (prof === 'v-handle' ? [0.2, -1] : [0, 1]);   // screen direction of the mount
    const L = Math.hypot(sd[0], sd[1]), u = [sd[0] / L, sd[1] / L], n = [-u[1], u[0]], w = hr * 0.55, far2 = add(hc, mul(u, 44 * k));
    const q = [add(hc, mul(n, w)), add(far2, mul(n, w * 0.8)), add(far2, mul(n, -w * 0.8)), add(hc, mul(n, -w))];
    hb += `<path class="h-eq" d="${polyD(track(q))}"/>`;
  }
  track([[hc[0] - hr, hc[1] - hr], [hc[0] + hr, hc[1] + hr]]);
  out.far = hb + out.far;
  out.handle = hx + `<circle class="h-eq" cx="${f(hc[0])}" cy="${f(hc[1])}" r="${f(hr)}"/><circle class="h-eq-core" cx="${f(hc[0])}" cy="${f(hc[1])}" r="${f(hr * 0.62)}"/>`
    + `<path class="h-eq-core" d="M${pt([hc[0] - 3, hc[1]])}L${pt([hc[0] + 3, hc[1]])}M${pt([hc[0], hc[1] - 3])}L${pt([hc[0], hc[1] + 3])}"/>`;

  // skin: forearm (with a break line at the cut), palm, thenar pad, index proximal segment
  const fore = g.fore, Lcut = fore.top[0][0];
  const foreRing = [...fore.top, [8 * s, 14 * s], [12 * s, 0], [8 * s, -15 * s], ...[...fore.bot].reverse(),
    [Lcut - 2 * s, -30 * s], [Lcut + 3 * s, -12 * s], [Lcut - 3 * s, 6 * s], [Lcut + 2 * s, 20 * s]];
  const foreIds = [def('fore', spline(track(foreRing.map(F))))];
  const mcpI = g.mcpI, dors = [[0, 19.5], [12, 19.5], [30, 18], [50, 16], [66, 14], [76, 12.8]].map(([u, v]) => [u * s, v * s]);
  const knuck = [[mcpI[0] + 5 * s, 11 * s], [mcpI[0] + 9.5 * s, 5 * s], [mcpI[0] + 10.5 * s, -3 * s]];
  const palmRing = [[-6 * s, 16 * s], ...dors, ...knuck, ...resample([...g.palmar].reverse(), 4 * s).map(outsideCircle), [-6 * s, -17 * s], [-10 * s, 0]];
  const palmIds = [def('palm', spline(track(palmRing.map(Hh))))];
  const th = g.thumb, ts = g.tsegs;
  const thenar = capsule(th.pts[0], th.pts[1], ts[0].t, ts[1].t + 3 / k);   // a touch wider than the thumb, so the thumb's base patch never cuts its sides
  const thenarId = def('thenar', polyD(track(thenar.map(Hh))));
  // web: the skin between the palm, the handle (wrist side) and the thenar pad, so the handle sits in a closed ring
  const web = [th.pts[0]];
  for (let a = 95; a <= 235; a += 10) web.push(add(circ.c, mul(dir(a), hug)));
  web.push(th.pts[1]);
  const webId = def('web', polyD(web.map(Hh)));
  // index finger: three tapered segments plus a knuckle pad at each joint, merged with the palm (one outline)
  const ix = g.index, isg = ix.segs;
  const knuckleR = [12.5 * s, isg[0].t * 1.04, isg[1].t * 1.04];
  const ixIds = [
    def('ipp', polyD(track(capsule(ix.pts[0], ix.pts[1], isg[0].t, isg[1].t * 1.02).map(Hh)))),
    def('imp', polyD(track(capsule(ix.pts[1], ix.pts[2], isg[1].t, isg[2].t * 1.02).map(Hh)))),
    def('idp', polyD(track(capsule(ix.pts[2], ix.pts[3], isg[2].t, isg[2].t * 0.8).map(Hh)))),
    ...knuckleR.slice(1).map((r, i) => def(`ik${i + 1}`, polyD(capsule(ix.pts[i + 1], ix.pts[i + 1], r, r, 8).map(Hh)))),
  ];
  // the hand is closed round the handle: skin behind the whole handle section (the section is drawn on top)
  const fillId = def('ring', polyD(capsule(circ.c, circ.c, circ.r + 1.5 * s, circ.r + 1.5 * s, 12).map(Hh)));
  const gapIds = [0, 1].map(i => def(`gap${i}`, polyD([ix.pts[i], ix.pts[i + 1], circ.c].map(Hh))));   // finger hugging the handle
  out.skin = union([...foreIds, ...palmIds, webId, thenarId, ...(g.pose.fingers.open > 0.2 ? [] : [fillId, ...gapIds])], 'h-skin');
  // the index finger has its own outline over the palm (so its three segments read); its base is patched into the palm
  out.near = union(ixIds, 'h-skin') + basePatch(Hh(ix.pts[0]), Hh(ix.pts[1]), isg[0].t * k + 1.3);
  const thumbIds = [def('tpp', polyD(track(capsule(th.pts[1], th.pts[2], ts[1].t, ts[2].t * 1.03).map(Hh)))),
    def('tdp', polyD(track(capsule(th.pts[2], th.pts[3], ts[2].t, ts[2].t * 0.8).map(Hh))))];
  // the thumb grows out of the thenar pad: hide its rounded base
  out.thumb = union(thumbIds, 'h-thumb') + basePatch(Hh(th.pts[1]), Hh(th.pts[2]), ts[1].t * k + 1.4);

  // detail: forearm bones (radius on the thumb side, ulna behind), finger creases and nails, wrist crease
  let det = '';
  const bone = (v0, v1, a1) => `<path class="h-bone" d="M${pt(F([Lcut + 10 * s, v0 * s]))}L${pt(F([a1 * s, v1 * s]))}"/>`;
  det += bone(-13, -8, -8) + bone(9, 7, -12);
  const angAt = (ch, i) => Math.atan2(ch.pts[i + 1][1] - ch.pts[i][1], ch.pts[i + 1][0] - ch.pts[i][0]) / RAD;
  // a flexion crease: short line on the palm side of a joint, across the finger
  const crease = (C, a, t, side) => { const d = dir(a), n = [-d[1], d[0]], p0 = add(C, mul(n, side * t * 0.45)), p1 = add(C, mul(n, side * t * 1.0)); return `M${pt(Hh(p0))}L${pt(Hh(p1))}`; };
  // a nail: on the back of the distal segment, from about its middle to just short of the tip
  const nail = (A, B, t, side) => { const d = sub(B, A), L = len(d), u = mul(d, 1 / L), n = mul([-u[1], u[0]], side);
    const p0 = add(add(A, mul(u, L * 0.42)), mul(n, t * 0.95)), p1 = add(add(A, mul(u, L * 0.92)), mul(n, t * 0.72)), p2 = add(add(A, mul(u, L * 0.42)), mul(n, t * 0.5));
    return `M${pt(Hh(p0))}L${pt(Hh(p1))}M${pt(Hh(p0))}L${pt(Hh(p2))}`; };
  let cr = '';
  for (const i of [1, 2]) cr += crease(ix.pts[i], (angAt(ix, i - 1) + angAt(ix, i)) / 2, isg[i].t, -1);
  det += `<path class="h-crease" d="${cr}"/><path class="h-nail" d="${nail(ix.pts[2], ix.pts[3], isg[2].t * 0.9, +1)}"/>`;
  const tSide = g.pose.thumb === 'over' || g.pose.thumb === 'beside' ? -1 : +1;   // which side of the thumb faces the palm
  out.tdetail = `<path class="h-crease" d="${crease(th.pts[2], (angAt(th, 1) + angAt(th, 2)) / 2, ts[2].t, tSide)}"/><path class="h-nail" d="${nail(th.pts[2], th.pts[3], ts[2].t * 0.9, -tSide)}"/>`;
  // wrist crease: skin folds on the side the wrist bends toward
  const e = g.e;
  if (Math.abs(e) > 12) {
    const side = e > 0 ? 1 : -1, n = Math.abs(e) > 25 ? 3 : 2;
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = (i - (n - 1) / 2) * 4.5 * s, v0 = side * 19 * s, v1 = side * (19 - 5.5 - (i === (n - 1) / 2 ? 2.5 : 0)) * s;
      d += `M${pt(F([a, v0]))}Q${pt(F([a + side * 2 * s, (v0 + v1) / 2]))} ${pt(F([a, v1]))}`;
    }
    det += `<path class="h-crease strong" d="${d}"/>`;
  }
  const Wj = F([0, 0]);
  const jointEls = `<circle class="h-joint wrist" cx="${f(Wj[0])}" cy="${f(Wj[1])}" r="2.25"/>`;
  out.detail = det;

  // load line, lever, markers
  const pose = g.pose, cP = g.contact, cS = Hh(cP);
  const Wc = F([0, 0]), U = P.U, Vv = P.V;
  const lever = dot(sub(cS, Wc), Vv) / k;           // + = back-of-hand side (the push bends the wrist further back)
  const along = (loadAxis ?? (pose.load.kind === 'push' || pose.load.kind === 'on-body' ? 'along-forearm' : 'across')) === 'along-forearm';
  const m = role === 'wrong' ? ' m' : '';
  let over = '';
  // datum: the forearm axis carried on through the hand (dashed), the straight reference
  if (datum) over += `<path class="h-datum" d="M${pt(F([-12 * s, 0]))}L${pt(F([mcpI[0] + 38 * s, 0]))}"/>`;
  // the load line runs from the handle down the forearm; the arrow shows where the load goes
  const lineStart = add(cS, mul(U, 10)), lineEnd = add(cS, mul(U, -(-Lcut - 22 * s) * k - dot(sub(cS, Wc), U)));
  track([lineStart, lineEnd]);
  over += `<path class="h-load${m}" d="M${pt(lineStart)}L${pt(add(lineEnd, mul(U, 4)))}"/><path class="h-load-head${m}" d="${arrowHead(lineEnd, lineStart, 6)}"/>`;
  over += `<circle class="h-contact${m}" cx="${f(cS[0])}" cy="${f(cS[1])}" r="2.4"/>`;
  const X = add(Wc, mul(Vv, lever * k));             // where the load line passes the wrist
  let bendLabel = null;
  if (role === 'right') {
    const tk = 4.5;
    over += `<path class="h-tick" d="M${pt(add(X, mul(Vv, -tk)))}L${pt(add(X, mul(Vv, tk)))}"/>`;
  }
  // The wrong half draws no lever dimension or cm value: a raw lever length means nothing to a lifter (architecture
  // 5.1 keeps the signed lever in the check report, report.leverMm below). The force line and the bend arc tell it.
  if (markers.includes('lever-arc') && Math.abs(e) > 3) {
    const r = 30 * s * k, a0 = Math.atan2(U[1], U[0]), dh = Hh([1, 0]), a1 = Math.atan2(dh[1] - Hh([0, 0])[1], dh[0] - Hh([0, 0])[0]);
    const p0 = add(Wc, [Math.cos(a0) * r, Math.sin(a0) * r]), p1 = add(Wc, [Math.cos(a1) * r, Math.sin(a1) * r]);
    let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    const sw = da > 0 ? 1 : 0;
    over += `<path class="h-arc" d="M${pt(Wc)}L${pt(p0)}A${f(r)} ${f(r)} 0 0 ${sw} ${pt(p1)}Z"/>`;
    over += `<path class="h-datum m" d="M${pt(Wc)}L${pt(Hh([mcpI[0] + 38 * s, 0]))}"/>`;
    const am = a0 + da / 2, lp = add(Wc, [Math.cos(am) * (r + 11), Math.sin(am) * (r + 11)]);
    bendLabel = { at: lp, text: `${Math.round(Math.abs(e))}°`, anchor: 'middle' };
  }
  if (markers.includes('tendon')) {
    let d = '';
    for (const v of [-12, -15.5, -19]) d += `M${pt(F([-58 * s, (v - 5) * s]))}Q${pt(F([-30 * s, (v - 3) * s]))} ${pt(F([-5 * s, v * s]))}`;
    over += `<path class="h-mark thin" d="${d}"/>`;
  }
  if (markers.includes('slip-arrow')) {         // the handle sliding out toward the fingertips
    const a = add(circ.c, [4 * s, -(circ.r + 7 * s)]), b = add(a, [22 * s, -6 * s]);
    const A = Hh(a), B = Hh(b);
    over += `<path class="h-mark" d="M${pt(A)}L${pt(B)}"/><path class="h-mark-head" d="${arrowHead(B, A, 5)}"/>`;
  }
  if (markers.includes('skin-ridge')) {
    const base = [mcpI[0] - 6 * s, g.palmar[g.palmar.length - 1][1] - 1 * s];
    const ps = [-10, -5, 0, 5, 10].map((du, i) => Hh([base[0] + du * s, base[1] - (i % 2 ? 3.5 : 0) * s]));
    over += `<path class="h-mark" d="M${ps.map(pt).join('L')}"/>`;
  }
  if (markers.includes('load-through-wrist')) {
    const a = F([mcpI[0] + 20 * s, 0]), b = F([-90 * s, 0]);
    over += `<path class="h-load m" d="M${pt(a)}L${pt(b)}"/><path class="h-load-head m" d="${arrowHead(b, a, 6)}"/>`;
  }
  out.over = jointEls + over;
  const report = { ext: +e.toFixed(1), leverMm: +lever.toFixed(1), loadAxis: along ? 'along-forearm' : 'across', contactAt: pose.contactAt,
    thumb: pose.thumb, handle: pose.handle.profile, handleDiameterMm: circ.r * 2, HLmm: +g.HL.toFixed(1),
    fingerFlex: ix.angs.map(a => +a.th.toFixed(1)), thumbFlex: th.angs.slice(1).map(a => +a.th.toFixed(1)) };
  return { defs, out, pts, report, labels: [bendLabel].filter(Boolean), thumbFirst: pose.thumb === 'hook' };
}

// the handle is drawn as a section on top of the fist; only the thumb (nearest) passes over it
const layer = (d) => d.out.far + (d.thumbFirst ? d.out.skin + d.out.thumb + d.out.tdetail + d.out.near + d.out.detail + d.out.handle : d.out.skin + d.out.near + d.out.detail + d.out.handle + d.out.thumb + d.out.tdetail) + d.out.over;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const bbox = ps => ps.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]);
const dots = id => `<pattern id="${id}-dots" width="16" height="16" patternUnits="userSpaceOnUse"><rect x="7.5" y="7.5" width="1" height="1" class="dot"/></pattern>`;
const textEl = (l, cls) => `<text class="${cls}" x="${f(l.at[0])}" y="${f(l.at[1] + 4)}" text-anchor="${l.anchor}">${esc(l.text)}</text>`;

// Icons drawn as lines (24-unit grid, same paths as the sheet's check / x icons), placed at (x, y) with size sz.
const iconCheck = (x, y, sz) => `<path class="h-icon ok" transform="translate(${f(x)} ${f(y)}) scale(${f(sz / 24)})" d="M5 12l4 4L19 7"/>`;
const iconCross = (x, y, sz) => `<path class="h-icon no" transform="translate(${f(x)} ${f(y)}) scale(${f(sz / 24)})" d="M6 6l12 12M18 6L6 18"/>`;
// Orientation for "Seen from above": words, not a glyph (a tiny head-from-above read as nothing). "YOU" with an arrow
// pointing to the lifter's side of the picture, "MACHINE" with an arrow the way the lifter faces (the machine side),
// the same pattern as the lat pulldown's "FACE -> MACHINE". Drawn centred with the camera label on one row.
const ORIENT_CHAR = 7.5;   // uppercase 11 px caps with tracking, px per char (measured: "SEEN FROM ABOVE" 113 px)
function orientRow(camText, cx, y, facing) {
  const [fx, fy] = facing, arrow = (x, dir) => {   // 9 px arrow centred at (x, y - 4) along dir
    const c = [x, y - 4], a = [c[0] - dir[0] * 4.5, c[1] - dir[1] * 4.5], b = [c[0] + dir[0] * 4.5, c[1] + dir[1] * 4.5], n = [-dir[1], dir[0]];
    return `M${pt(a)}L${pt(b)}M${pt([b[0] - dir[0] * 3 + n[0] * 3, b[1] - dir[1] * 3 + n[1] * 3])}L${pt(b)}L${pt([b[0] - dir[0] * 3 - n[0] * 3, b[1] - dir[1] * 3 - n[1] * 3])}`;
  };
  // every word is end-anchored at a fixed x, so its gap to the next mark is exact whatever the font measures
  const camW = camText.length * ORIENT_CHAR, youW = 25, macW = 50, gapA = 8.5;   // YOU and MACHINE as measured (11 px caps)
  const total = camW + 18 + youW + gapA + 4.5 + 16 + macW + gapA + 4.5;
  let x = cx - total / 2 + camW;
  const cam = `<text class="h-cam" x="${f(x)}" y="${y}" text-anchor="end">${camText.toUpperCase()}</text>`;
  x += 18 + youW;
  const you = `<text x="${f(x)}" y="${y}" text-anchor="end">YOU</text>`, a1 = arrow(x + gapA, [-fx, -fy]);
  x += gapA + 4.5 + 16 + macW;
  const mac = `<text x="${f(x)}" y="${y}" text-anchor="end">MACHINE</text>`, a2 = arrow(x + gapA, [fx, fy]);
  return cam + `<g class="h-orient" aria-hidden="true">${you}${mac}<path d="${a1}${a2}"/></g>`;
}

/** One hand as a standalone SVG. opts: { width, height, H, uid, role: 'right'|'wrong', markers, loadAxis, alt } */
export function renderHand(poseIn, opts = {}) {
  const { width = 171, height = 200, H = 1750, uid = 'hand', role = 'right', markers = [], loadAxis, alt = '' } = opts;
  const g = handGeometry(poseIn, { H });
  const probe = drawHand(g, { W: [0, 0], k: 1 }, { uid, role, markers, loadAxis });
  const b = bbox(probe.pts), pad = 10, k = Math.min((width - 2 * pad) / (b[2] - b[0]), (height - 2 * pad) / (b[3] - b[1]));
  const W = [pad - b[0] * k + ((width - 2 * pad) - (b[2] - b[0]) * k) / 2, pad - b[1] * k + ((height - 2 * pad) - (b[3] - b[1]) * k) / 2];
  const d = drawHand(g, { W, k }, { uid, role, markers, loadAxis });
  const labels = d.labels.map(l => textEl(l, role === 'wrong' ? 'h-val m' : 'h-val')).join('');
  const svg = `<svg class="hand-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(alt)}" xmlns="http://www.w3.org/2000/svg"><defs>${d.defs.join('')}</defs>${layer(d)}${labels}</svg>`;
  return { svg, report: { ...d.report, scalePxPerMm: +k.toFixed(3) } };
}

/**
 * Right and Wrong side by side. spec: {
 *   camera: 'above' | 'side', right: HandPose, wrong: HandPose, H?, uid?,
 *   loadAxis?: 'along-forearm' | 'across', markers?: string[] (wrong half), rightNote?, wrongNote? (1-3 words each),
 *   alt: { right, wrong } (TalkBack text), width? (358) }
 * Returns { svg, report }. report.checks lists the lever rule results for along-forearm loads.
 */
export function renderHandPair(spec) {
  const { camera = 'above', H = 1750, uid = 'hp', width = 358, markers = ['lever-arc'], alt = {} } = spec;
  const gap = 16, pw = (width - gap) / 2, top = 70, ph = spec.panelHeight ?? 262, height = top + ph + 6;
  const gR = handGeometry(spec.right, { H }), gW = handGeometry(spec.wrong, { H });
  const oR = { uid: `${uid}-r`, role: 'right', markers: spec.rightMarkers ?? [], loadAxis: spec.loadAxis };
  const oW = { uid: `${uid}-w`, role: 'wrong', markers, loadAxis: spec.loadAxis };
  // one scale and one wrist position for both halves, so the two hands compare directly
  const pR = drawHand(gR, { W: [0, 0], k: 1 }, oR), pW = drawHand(gW, { W: [0, 0], k: 1 }, oW);
  const b = bbox([...pR.pts, ...pW.pts]), pad = 12;
  const k = Math.min((pw - 2 * pad) / (b[2] - b[0]), (ph - 2 * pad) / (b[3] - b[1]));
  const Wl = [pad - b[0] * k + ((pw - 2 * pad) - (b[2] - b[0]) * k) / 2, top + pad - b[1] * k + ((ph - 2 * pad) - (b[3] - b[1]) * k) / 2];
  const dR = drawHand(gR, { W: Wl, k }, oR), dW = drawHand(gW, { W: [Wl[0] + pw + gap, Wl[1]], k }, oW);
  const camText = camera === 'above' ? 'Seen from above' : 'Seen from the side';
  const th = gR.pose.forearm * RAD, facing = [Math.sin(th), Math.cos(th)];
  const cx = width / 2;
  const head = (x, ok, note) => {
    const word = ok ? 'Right' : 'Wrong';
    return (ok ? iconCheck(x, 29, 18) : iconCross(x, 29, 18)) + `<text class="h-head" x="${f(x + 23)}" y="43">${word}</text>`
      + (note ? `<text class="h-note${ok ? '' : ' m'}" x="${f(x + 23)}" y="60">${esc(note.toUpperCase())}</text>` : '');
  };
  const labels = [...dR.labels.map(l => textEl(l, 'h-val')), ...dW.labels.map(l => textEl(l, 'h-val m'))].join('');
  const aria = `${camText}. Right: ${alt.right ?? ''} Wrong: ${alt.wrong ?? ''}`.trim();
  const svg = `<svg class="hand-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(aria)}" xmlns="http://www.w3.org/2000/svg">`
    + `<defs>${dots(uid)}${dR.defs.join('')}${dW.defs.join('')}</defs>`
    + `<rect width="${width}" height="${height}" fill="url(#${uid}-dots)"/>`
    + (camera === 'above' ? orientRow(camText, cx, 21, facing) : `<text class="h-cam" x="${f(cx)}" y="21" text-anchor="middle">${camText.toUpperCase()}</text>`)
    + head(10, true, spec.rightNote) + head(pw + gap + 10, false, spec.wrongNote)
    + `<path class="h-divider" d="M${f(pw + gap / 2)} ${top - 4}V${height - 10}"/>`
    + `<g class="h-panel right">${layer(dR)}</g><g class="h-panel wrong">${layer(dW)}</g>${labels}</svg>`;
  const along = dR.report.loadAxis === 'along-forearm';
  const checks = along ? {
    rightLeverWithin: Math.abs(dR.report.leverMm) <= LEVER.maxRightMm,
    wrongLeverBehind: dW.report.leverMm >= LEVER.minWrongMm,
  } : {};
  return { svg, report: { camera, scalePxPerMm: +k.toFixed(3), right: dR.report, wrong: dW.report, checks, ok: Object.values(checks).every(Boolean) } };
}

// Classes used by the hand SVG. Same look as the plate: 2 px outline in --text-2 over --surface-3, thin datum lines,
// accent for the right load line, --mistake for everything wrong. The thumb gets the heaviest line (--text).
export const HAND_CSS = `
/* ===== HAND close-up (plates2/engine/hand.mjs). Every colour is a theme token. ===== */
.hand-plate { position: relative; width: 100%; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); background: var(--surface-2); overflow: hidden; }
.hand-svg { display: block; width: 100%; height: auto; }
.hand-svg .dot { fill: var(--border-subtle); }
.hand-svg .h-skin .u-stroke use { fill: none; stroke: var(--text-2); stroke-width: 2; stroke-linejoin: round; }
.hand-svg .h-skin .u-fill use { fill: var(--surface-3); }
.hand-svg .h-far .u-stroke use { fill: none; stroke: var(--text-3); stroke-width: 1.5; stroke-linejoin: round; }
.hand-svg .h-far .u-fill use { fill: var(--surface-2); }
.hand-svg .h-thumb .u-stroke use { fill: none; stroke: var(--text-2); stroke-width: 2.5; stroke-linejoin: round; }
.hand-svg .h-thumb .u-fill use, .hand-svg .h-patch { fill: var(--surface-3); }
.hand-svg .h-eq { fill: var(--surface-2); stroke: var(--text-3); stroke-width: 1; stroke-linejoin: round; }
.hand-svg .h-eq-core { fill: none; stroke: var(--border-strong); stroke-width: .75; }
.hand-svg .h-eq-thin { fill: none; stroke: var(--border-strong); stroke-width: .75; stroke-dasharray: 3 3; }
.hand-svg .h-bone { fill: none; stroke: var(--text-3); stroke-width: .75; stroke-linecap: round; opacity: .6; }
.hand-svg .h-crease { fill: none; stroke: var(--text-3); stroke-width: .75; stroke-linecap: round; }
.hand-svg .h-crease.strong { stroke: var(--text-2); stroke-width: 1; }
.hand-svg .h-nail { fill: none; stroke: var(--text-3); stroke-width: .75; stroke-linecap: round; }
.hand-svg .h-joint { fill: var(--surface-2); stroke: var(--text-3); stroke-width: .75; }
.hand-svg .h-joint.wrist { stroke: var(--text-2); stroke-width: 1; }
.hand-svg .h-datum { fill: none; stroke: var(--text-3); stroke-width: .75; stroke-dasharray: 2 3; }
.hand-svg .h-datum.m { stroke: var(--mistake); }
.hand-svg .h-load { fill: none; stroke: var(--accent); stroke-width: 1.5; stroke-linecap: round; }
.hand-svg .h-load-head { fill: var(--accent); }
.hand-svg .h-contact { fill: var(--accent); }
.hand-svg .h-tick { stroke: var(--accent); stroke-width: 1.5; stroke-linecap: round; }
.hand-svg .h-load.m, .hand-svg .h-dim, .hand-svg .h-mark { fill: none; stroke: var(--mistake); stroke-width: 1.5; stroke-linecap: round; }
.hand-svg .h-dim, .hand-svg .h-mark.thin { stroke-width: 1; }
.hand-svg .h-load-head.m, .hand-svg .h-contact.m, .hand-svg .h-mark-head { fill: var(--mistake); }
.hand-svg .h-arc { fill: color-mix(in srgb, var(--mistake) 14%, transparent); stroke: var(--mistake); stroke-width: 1; }
.hand-svg .h-icon { fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.hand-svg .h-icon.ok { stroke: var(--accent); }
.hand-svg .h-icon.no { stroke: var(--mistake); }
.hand-svg .h-orient text { font-size: var(--fs-cap); font-weight: var(--fw-semibold); letter-spacing: var(--ls-cap); fill: var(--text-3); }
.hand-svg .h-orient path { fill: none; stroke: var(--text-3); stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; }
.hand-svg .h-divider { stroke: var(--border-subtle); stroke-width: 1; }
.hand-svg text { font-family: var(--font); }
.hand-svg .h-head { font-size: var(--fs-small); font-weight: var(--fw-semibold); fill: var(--text); letter-spacing: -.003em; }
.hand-svg .h-cam, .hand-svg .h-note { font-size: var(--fs-cap); font-weight: var(--fw-semibold); letter-spacing: var(--ls-cap); fill: var(--text-2); }
.hand-svg .h-note.m { fill: var(--mistake); }
.hand-svg .h-val { font-size: var(--fs-meta); font-weight: var(--fw-medium); font-variant-numeric: tabular-nums; fill: var(--accent-text); }
.hand-svg .h-val.m { fill: var(--mistake); }
`;
