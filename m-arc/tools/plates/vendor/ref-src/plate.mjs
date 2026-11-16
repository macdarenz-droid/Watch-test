// Technical Plate renderer (mockup of the real one): forward kinematics -> SVG, every colour a theme variable.
// Exercise: Dumbbell Lateral Raise, front view. Data from src/formguide/exercises/lib_dumbbell_lateral_raise.ts
// and src/formguide/research/lib_dumbbell_lateral_raise.json (tempo, shoulder_abd 10->88 drawn, elbow 14, lead 8).
// Body: Winter, Biomechanics and Motor Control of Human Movement (4th ed., 2009), anthropometry ch. 4:
// segment lengths as fractions of height H.
const R = Math.PI / 180;
export const WINTER = { upperArm: 0.186, forearm: 0.146, hand: 0.108, thigh: 0.245, shank: 0.246, shoulderW: 0.259, hipW: 0.191,
  shoulderH: 0.818, hipH: 0.530, kneeH: 0.285, ankleH: 0.039, chinH: 0.870 };
export const SIZE = 358;                 // plate is 1:1 at full sheet content width (390 - 2 x 16)
const HPX = 256, CX = 179, FLOOR = 339;   // figure height in px, centre line, floor line
const f = n => +n.toFixed(2);
const X = x => CX + x * HPX, Y = y => FLOOR - y * HPX;       // H units (y up) -> plate px
const P = ([x, y]) => [X(x), Y(y)];
const pt = p => `${f(p[0])} ${f(p[1])}`;

// Closed / open Catmull-Rom through screen points -> cubic Bezier path.
function spline(ps, closed = true) {
  const n = ps.length, g = i => closed ? ps[(i + n) % n] : ps[Math.max(0, Math.min(n - 1, i))];
  let d = `M${pt(ps[0])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${pt(p2)}`;
  }
  return d + (closed ? 'Z' : '');
}
const hex = (c, r) => 'M' + [0, 60, 120, 180, 240, 300].map(a => pt([c[0] + r * Math.cos(a * R), c[1] + r * Math.sin(a * R)])).join('L') + 'Z';
const circle = (c, r) => `M${f(c[0] - r)} ${f(c[1])}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;

// A tapered limb with a muscle belly, from joint A to joint B (screen px), radii in px.
function limb(A, B, rA, rM, rB, m = 0.35) {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const r = t => t < m ? rA + (rM - rA) * Math.sin((t / m) * Math.PI / 2) : rM + (rB - rM) * (1 - Math.cos(((t - m) / (1 - m)) * Math.PI / 2));
  const at = (t, s) => [A[0] + dx * t + nx * r(t) * s, A[1] + dy * t + ny * r(t) * s];
  const ts = [0, 0.12, m * 0.7, m, 0.55, 0.78, 1], ps = [];
  ts.forEach(t => ps.push(at(t, 1)));
  for (const a of [50, 90, 130]) { const c = Math.cos(a * R), s = Math.sin(a * R); ps.push([B[0] + (nx * c + ux * s) * rB, B[1] + (ny * c + uy * s) * rB]); }
  [...ts].reverse().forEach(t => ps.push(at(t, -1)));
  for (const a of [50, 90, 130]) { const c = Math.cos(a * R), s = Math.sin(a * R); ps.push([A[0] + (-nx * c - ux * s) * rA, A[1] + (-ny * c - uy * s) * rA]); }
  return spline(ps);
}

// ---- static body (end pose apart from the arms) ----
const mirror = pts => [...pts, ...[...pts].reverse().map(([x, y]) => [-x, y])];
// Judge fix 8 (2026-09-29): head .13H (vertex 1.0 to chin .870) with a skull, a jaw angle and a chin, so a neck shows under the jaw.
const HEAD_HALF = [[0.026, 0.996], [0.040, 0.983], [0.046, 0.963], [0.046, 0.941], [0.043, 0.921], [0.038, 0.903], [0.030, 0.887], [0.019, 0.876], [0.007, 0.870]];
const HEAD = [[0, 1.0], ...HEAD_HALF, ...[...HEAD_HALF].reverse().map(([x, y]) => [-x, y])];
const SH_X = WINTER.shoulderW / 2, SH_Y = 0.80;   // glenohumeral centre: half the Winter shoulder width, just under the acromion (.818)
const torsoHalf = shrug => [[0.028, 0.9], [0.029, 0.872], [0.038, 0.857 + shrug * 0.4], [0.064, 0.842 + shrug], [0.095, 0.831 + shrug], [0.122, 0.821 + shrug * 0.6],
  [0.14, 0.8], [0.13, 0.772], [0.117, 0.752], [0.11, 0.714], [0.097, 0.668], [0.087, 0.628], [0.089, 0.592], [0.097, 0.552], [0.097, 0.512],
  [0.082, 0.48], [0.042, 0.463], [0.0, 0.46]];
const torso = (shrug = 0) => spline(mirror(torsoHalf(shrug).slice(0, -1)).map(P));
const HIP = [0.05, 0.505], KNEE = [0.057, WINTER.kneeH], ANKLE = [0.062, 0.047];   // judge fix 8: legs separate below the crotch
function legs() {
  const out = [];
  for (const s of [1, -1]) {
    const h = P([s * HIP[0], HIP[1]]), k = P([s * KNEE[0], KNEE[1]]), a = P([s * ANKLE[0], ANKLE[1]]);
    out.push(limb(h, k, 0.048 * HPX, 0.044 * HPX, 0.027 * HPX, 0.3), circle(k, 0.028 * HPX), limb(k, a, 0.029 * HPX, 0.033 * HPX, 0.016 * HPX, 0.3));
    out.push(spline([[0.034, 0.055], [0.066, 0.055], [0.079, 0.02], [0.084, 0.004], [0.06, 0.0], [0.03, 0.0], [0.026, 0.02]].map(([x, y]) => P([s * (x + ANKLE[0] - 0.05), y]))));
  }
  return out;
}

// ---- arms by forward kinematics ----
// theta: shoulder abduction from the side (deg); lead: how far the forearm trails the upper arm (elbows lead, deg);
// elbow 14 deg bends the forearm toward the camera, so its projected length is cos(14).
const ELBOW = 14, DISC = 0.034 * HPX;   // hex head, about 12 cm across the corners (a light hex dumbbell)
export function arm(theta, lead, s) {
  const S = P([s * SH_X, SH_Y]);
  const u = [s * Math.sin(theta * R), Math.cos(theta * R)];                 // screen y is down
  const E = [S[0] + u[0] * WINTER.upperArm * HPX, S[1] + u[1] * WINTER.upperArm * HPX];
  const phi = theta - lead, v = [s * Math.sin(phi * R), Math.cos(phi * R)], k = Math.cos(ELBOW * R);
  const W = [E[0] + v[0] * WINTER.forearm * k * HPX, E[1] + v[1] * WINTER.forearm * k * HPX];
  const G = [W[0] + v[0] * (WINTER.hand * 0.46) * k * HPX, W[1] + v[1] * (WINTER.hand * 0.46) * k * HPX];
  const shapes = [circle(S, 0.03 * HPX), limb(S, E, 0.03 * HPX, 0.031 * HPX, 0.022 * HPX, 0.3), circle(E, 0.022 * HPX),
    limb(E, W, 0.023 * HPX, 0.026 * HPX, 0.015 * HPX, 0.28), circle(G, 0.02 * HPX)];
  return { S, E, W, G, shapes, disc: hex(G, DISC) };
}
// elbows-lead ramp from the guide file (0 at the start of the lift, 8 deg by mid-lift, held at the top)
const leadAt = th => 8 * Math.min(1, Math.max(0, (th - 10) / 45)) ** 0.8;
export const POSES = [10, 26, 42, 58, 73, 88];     // start, 4 in-between, end (shoulder_abd, drawn inside the cited 0-90)
const GHOST_O = [0.12, 0.2, 0.28, 0.36];

const pos = b => `left:${f(b.left / SIZE * 100)}%;top:${f(b.top / SIZE * 100)}%`;
const uses = (ids, cls) => ids.map(id => `<use href="#${id}" class="${cls}"/>`).join('');

/** Returns { svg, overlay } for a plate. state: { id, selected, mistake, desc } */
export function plate({ id = 'p', selected = null, mistake = false } = {}) {
  const defs = [];
  const def = (name, d) => { const k = `${id}-${name}`; defs.push(`<path id="${k}" d="${d}"/>`); return k; };
  const bodyIds = [def('head', spline(HEAD.map(P))), def('torso', torso()), ...legs().map((d, i) => def(`leg${i}`, d))];
  const armIds = (th, tag) => [-1, 1].flatMap(s => { const a = arm(th, leadAt(th), s); return [...a.shapes.map((d, i) => def(`${tag}${s}${i}`, d)), def(`${tag}${s}disc`, a.disc)]; });

  // start (dashed), ghosts (left side only: the right side carries the measurement), end (solid)
  const start = armIds(POSES[0], 'st');
  const startLayer = `<g class="pose-start"><g class="u-stroke">${uses(start, '')}</g><g class="u-fill">${uses(start, '')}</g></g>`;
  const ghosts = POSES.slice(1, -1).map((th, i) => {
    const a = arm(th, leadAt(th), -1), ids = [...a.shapes.map((d, j) => def(`g${i}${j}`, d)), def(`g${i}disc`, a.disc)];
    return `<g class="ghost" style="--o:${GHOST_O[i]};--i:${i}" data-th="${th}"><g class="u-stroke">${uses(ids, '')}</g><g class="u-fill">${uses(ids, '')}</g></g>`;
  }).join('');
  const endL = arm(88, leadAt(88), -1), endR = arm(88, leadAt(88), 1);
  const endArmIds = [-1, 1].flatMap(s => (s < 0 ? endL : endR).shapes.map((d, i) => def(`e${s}${i}`, d)));
  const discIds = [def('discL', endL.disc), def('discR', endR.disc)];
  const all = [...bodyIds, ...endArmIds];
  const endLayer = `<g class="pose-end"><g class="u-stroke">${uses(all, '')}</g><g class="u-fill">${uses(all, '')}</g>
    ${discIds.map(k => `<use href="#${k}" class="disc"/>`).join('')}
    ${[endL, endR].map(a => `<circle class="disc-core" cx="${f(a.G[0])}" cy="${f(a.G[1])}" r="${f(0.009 * HPX)}"/>`).join('')}
    ${[endL, endR].flatMap(a => [a.S, a.E]).map(c => `<circle class="joint" cx="${f(c[0])}" cy="${f(c[1])}" r="2.25"/>`).join('')}</g>`;

  // accent layer: grip path (figure's right hand, viewer's left) with arrowhead; shoulder arc on the other side
  const trail = [];
  for (let th = 10; th <= 88.001; th += 2) trail.push(arm(th, leadAt(th), -1).G);
  const g0 = trail[0], g1 = trail[trail.length - 1], cut = DISC + 4;
  const tp = trail.filter(p => Math.hypot(p[0] - g0[0], p[1] - g0[1]) > cut && Math.hypot(p[0] - g1[0], p[1] - g1[1]) > cut + 5);
  const tip = tp[tp.length - 1], prev = tp[tp.length - 2], dl = Math.hypot(tip[0] - prev[0], tip[1] - prev[1]);
  const du = [(tip[0] - prev[0]) / dl, (tip[1] - prev[1]) / dl], dn = [-du[1], du[0]];
  const head = [[tip[0] + du[0] * 6, tip[1] + du[1] * 6], [tip[0] + dn[0] * 3, tip[1] + dn[1] * 3], [tip[0] - dn[0] * 3, tip[1] - dn[1] * 3]];
  const S = endR.S, AR = 28, ap = (th, r) => [S[0] + Math.sin(th * R) * r, S[1] + Math.cos(th * R) * r];
  const arc = `M${pt(S)}L${pt(ap(10, AR))}A${AR} ${AR} 0 0 0 ${pt(ap(88, AR))}Z`, arcLine = `M${pt(ap(10, AR))}A${AR} ${AR} 0 0 0 ${pt(ap(88, AR))}`;
  const ticks = [10, 88].map(th => `<path d="M${pt(ap(th, AR - 4))}L${pt(ap(th, AR + 5))}"/>`).join('');
  const mid = ap(49, AR);
  const accent = `<g class="accent-layer">
    <path class="trace" pathLength="1" d="${spline(tp, false)}"/>
    <path class="arrow" d="M${pt(head[0])}L${pt(head[1])}L${pt(head[2])}Z"/>
    <g class="measure"><path class="arc-line" d="${arcLine}"/><g class="arc-ticks">${ticks}</g>
    <path class="leader" d="M${pt(ap(49, AR + 2))}L${pt([243, 173])}"/></g>
    ${selected === 'elbows' ? `<path class="lead-guide" d="M${pt(endR.E)}L${pt([endR.E[0] + (endR.E[0] - endR.S[0]) * 1.2, endR.E[1] + (endR.E[1] - endR.S[1]) * 1.2])}"/>` : ''}
  </g>`;

  // datum: shoulder height, outside the hands
  const dy = f(endR.S[1]);
  const datum = `<path class="datum" d="M12 ${dy}H${f(endL.S[0])}"/>`;   // judge fix 9: shoulder-height datum from the plate edge to the shoulder joint (drawn under the figure)
  const floor = `<path class="floorline" d="M104 ${FLOOR + 0.5}H254"/>`;

  // callouts: anchor points from the FK, label boxes placed by hand (a real build runs the collision check)
  const trap = P([0.078, 0.8335]);
  const elbowTop = [endR.E[0], endR.E[1] - 0.021 * HPX];
  const C = mistake ? [] : [
    { k: 'shrug', text: 'No shrug', at: trap, box: { left: 228, top: 40 }, bend: [224, 62], cue: 'The upper traps stay quiet. No shrug.' },
    { k: 'elbows', text: 'Elbows lead', at: elbowTop, box: { left: 244, top: 84 }, bend: [elbowTop[0], 114], cue: 'The elbows lead, the hands follow.', up: true },
    { k: 'stop', text: 'Stop at<br>shoulder height', at: [22, endR.S[1]], box: { left: 10, top: 72 }, bend: [22, 112], cue: 'Stop when the arms are level with the shoulders.', two: true, up: true },
  ];
  const leaders = C.map(c => `<path class="leader${selected === c.k ? ' on' : ''}" d="M${pt(c.at)}L${pt(c.bend)}${c.up ? '' : `H${c.box.left + 6}`}"/>
    <circle class="anchor${selected === c.k ? ' on' : ''}" cx="${f(c.at[0])}" cy="${f(c.at[1])}" r="${selected === c.k ? 2.5 : 1.5}"/>`).join('');

  // mistake layer (var(--mistake): negative in 4 themes, violet in Ember where negative == accent, D-FG1)
  const kneeR = P([KNEE[0] + 0.03, KNEE[1] + 0.012]);
  const shrugPts = torsoHalf(0.029).slice(2, 6).map(P);      // traps raised ~5 cm (guide: shrug_cm 5)
  const gl = endL.G, rot = 15, ca = a => [gl[0] + rot * Math.cos(a * R), gl[1] + rot * Math.sin(a * R)];
  // arrowhead at the end of the counter-clockwise turn: travel direction (sin a, -cos a), barbs 4 px back
  const ah = (a, side) => { const t = [Math.sin(a * R), -Math.cos(a * R)], n = [-t[1], t[0]], e = ca(a); return [e[0] - t[0] * 4 + n[0] * 3 * side, e[1] - t[1] * 4 + n[1] * 3 * side]; };
  const mk = mistake ? `<g class="mistake-layer">
    <path class="m-line" d="${spline(shrugPts, false)}"/>
    <path class="m-line" d="${spline(shrugPts.map(([x, y]) => [2 * CX - x, y]), false)}"/>
    <path class="m-arrow" d="M${pt([trap[0] + 6, trap[1] - 4])}V${f(trap[1] - 18)}M${pt([trap[0] + 3, trap[1] - 15])}L${pt([trap[0] + 6, trap[1] - 19])}L${pt([trap[0] + 9, trap[1] - 15])}"/>
    <path class="m-arrow" d="M${pt([kneeR[0] + 8, kneeR[1] - 12])}V${f(kneeR[1] + 8)}M${pt([kneeR[0] + 5, kneeR[1] + 4])}L${pt([kneeR[0] + 8, kneeR[1] + 8.5])}L${pt([kneeR[0] + 11, kneeR[1] + 4])}"/>
    <path class="m-arrow" d="M${pt(ca(-25))}A${rot} ${rot} 0 0 0 ${pt(ca(-160))}M${pt(ah(-160, 1))}L${pt(ca(-160))}L${pt(ah(-160, -1))}"/>
    <path class="leader m" d="M${pt([trap[0] + 6, trap[1] - 20])}L${pt([224, 62])}H234"/>
    <path class="leader m" d="M${pt([kneeR[0] + 12, kneeR[1] - 2])}L${pt([246, kneeR[1] - 2])}"/>
    <path class="leader m" d="M${pt([gl[0], gl[1] - rot - 2])}L${pt([gl[0], 112])}"/>
  </g>` : '';
  const M = mistake ? [
    { k: 'shrug', text: 'Shrug', box: { left: 228, top: 40 } },
    { k: 'dip', text: 'Dip', box: { left: 240, top: Math.round(kneeR[1] - 2 - 22) } },
    { k: 'thumbs', text: 'Thumbs<br>down', box: { left: 10, top: 72 }, two: true },
  ] : [];

  const svg = `<svg class="plate-svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" aria-hidden="true">
  <defs><pattern id="${id}-dots" width="16" height="16" patternUnits="userSpaceOnUse"><rect x="7.5" y="7.5" width="1" height="1" class="dot"/></pattern>${defs.join('')}</defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#${id}-dots)"/>
  ${datum}${floor}${mistake ? '' : `<path class="arc measure" d="${arc}"/>`}${startLayer}${ghosts}${endLayer}${mistake ? '' : accent}${leaders}${mk}
</svg>`;
  const btn = (c, extra = '') => `<button class="plate-callout${c.two ? ' two' : ''}${extra}" style="${pos(c.box)}" aria-pressed="${selected === c.k}">${c.text}</button>`;
  const overlay = [
    `<span class="plate-meta" style="${pos({ left: 16, top: 14 })}">Front view</span>`,
    ...C.map(c => btn(c)),
    ...M.map(c => btn(c, ' m')),
    mistake ? '' : `<span class="plate-arc-label" style="${pos({ left: 246, top: 166 })}"><b>Shoulder</b><span>up to 90°</span></span>`,
  ].join('');
  return { svg, overlay, cues: C };
}

export const PLATE_CSS = `
/* ===== NEW (blueprint-plate): the Technical Plate. Every colour is an existing token. ===== */
.plate { position: relative; width: 100%; aspect-ratio: 1; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); background: var(--surface-2); overflow: hidden; }
.plate-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.plate .dot { fill: var(--border-subtle); }
.plate .u-stroke use { fill: none; stroke-width: 2; stroke-linejoin: round; }
.plate .pose-end .u-stroke use { stroke: var(--text-2); }
.plate .pose-end .u-fill use { fill: var(--surface-3); }
.plate .pose-start .u-stroke use { stroke: var(--border-strong); stroke-dasharray: 3 3; }
.plate .pose-start .u-fill use, .plate .ghost .u-fill use { fill: var(--surface-2); }
.plate .ghost { opacity: var(--o); }
.plate .ghost .u-stroke use { stroke: var(--text-3); }
.plate .disc { fill: var(--surface-3); stroke: var(--text-2); stroke-width: 1; }
.plate .disc-core { fill: none; stroke: var(--text-3); stroke-width: 1; }
.plate .joint { fill: var(--surface-2); stroke: var(--text-2); stroke-width: 1; }
.plate .datum { stroke: var(--text-3); stroke-width: .75; stroke-dasharray: 2 3; fill: none; }
.plate .floorline { stroke: var(--border); stroke-width: 1; }
.plate .trace { fill: none; stroke: var(--accent); stroke-width: 1.5; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 0; }
.plate .arrow { fill: var(--accent); }
.plate .arc { fill: color-mix(in srgb, var(--accent) 12%, transparent); }
.plate .arc-line { fill: none; stroke: var(--accent); stroke-width: 1; }
.plate .arc-ticks path { stroke: var(--accent); stroke-width: 1; }
.plate .lead-guide { stroke: var(--accent); stroke-width: 1; stroke-dasharray: 3 3; fill: none; }
.plate .leader { fill: none; stroke: var(--text-3); stroke-width: .75; }
.plate .leader.on { stroke: var(--accent); }
.plate .anchor { fill: var(--text-3); }
.plate .anchor.on { fill: var(--accent); }
.plate .mistake-layer { fill: none; stroke: var(--mistake); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.plate .m-line { stroke-width: 1; stroke-dasharray: 3 3; }
.plate .leader.m { stroke: var(--mistake); stroke-width: .75; }
.plate-meta, .plate-callout, .plate-arc-label b { font-size: var(--fs-cap); line-height: var(--lh-cap); letter-spacing: var(--ls-cap); text-transform: uppercase; font-weight: var(--fw-semibold); color: var(--text-2); }
.plate-meta { position: absolute; }
/* a callout is a real button: the label is 11 px, the hit area 44 px */
.plate-callout { position: absolute; display: flex; align-items: center; min-height: 44px; padding: 0 6px; text-align: left; white-space: nowrap; }
.plate-callout { isolation: isolate; }
.plate-callout::before { content: ''; position: absolute; inset: 11px 0; z-index: -1; border-radius: var(--radius-xs); background: var(--accent-soft); opacity: 0; transition: opacity var(--dur-fast) var(--ease-standard); }
.plate-callout.two::before { inset: 4px 0; }
.plate-callout[aria-pressed="true"] { color: var(--accent-text); }
.plate-callout[aria-pressed="true"]::before { opacity: 1; }
.plate-callout.m { color: var(--mistake); }
.plate-callout.m::before { background: color-mix(in srgb, var(--mistake) 16%, transparent); }
.plate-arc-label { position: absolute; display: grid; gap: 2px; }
.plate-arc-label span { font-size: var(--fs-meta); line-height: var(--lh-meta); font-variant-numeric: tabular-nums; color: var(--accent-text); font-weight: var(--fw-medium); }
/* Trace: plays once. Under reduced motion the stagger is 0 and nothing animates: the end state shows at once. */
html:not([data-motion="reduce"]) .plate.tracing .trace { animation: plate-trace 2.4s var(--ease-standard) both; }
html:not([data-motion="reduce"]) .plate.tracing .ghost { animation: plate-ghost var(--dur-enter) var(--ease-standard) both; animation-delay: calc(var(--i) * 80ms); }
@keyframes plate-trace { from { stroke-dashoffset: 1; } }
@keyframes plate-ghost { from { opacity: 0; } }
`;
