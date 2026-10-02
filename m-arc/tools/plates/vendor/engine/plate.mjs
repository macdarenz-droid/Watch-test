// Technical Plate renderer (generic). renderPlate(spec, { id, mistake, selected }) -> { svg, overlay, cues, report }.
// Same SVG structure and CSS classes as the reference plate (ref-src/plate.mjs), so its PLATE_CSS applies unchanged;
// the engine only ADDS rules for new classes (ENGINE_CSS below).
import { R, f, pt, spline, d2, sub, add, mul, norm, len } from './geom.mjs';
import { normPose, resolve, poseAt, fk, landmarks, bodyShapes, GROUP_ORDER, SIDES, REF, WINTER } from './body.mjs';
import { PRIMITIVES } from './equipment.mjs';
import { Occ, placeLabels, leaderFor, checkLabels, capWidth, CAP_LH } from './layout.mjs';
import { PLATE_CSS as REF_CSS } from '../ref-src/plate.mjs';

export const SIZE = 358;
export const REF_CAMERA = { pxPerM: 256 / 1.75, x0: 179, y0: 339 };   // the reference: 256 px per body height, centre 179, floor 339
const Z_LEVELS = ['back', 'center', 'mid', 'front'];

const partOf = key => {
  const [k, s] = key.split('.');
  if (['shcap', 'upper', 'elbowcap', 'fore', 'fist', 'palm'].includes(k)) return `arm.${s}`;
  if (['thigh', 'kneecap', 'shank', 'foot'].includes(k)) return `leg.${s}`;
  return 'trunk';
};
const mergeDeep = (a, b) => {
  if (b === undefined) return a;
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const o = { ...a }; for (const k of Object.keys(b)) o[k] = mergeDeep(a[k], b[k]); return o;
  }
  return b;
};

function makeCamera(spec, cam) {
  const side = spec.view === 'side', facing = spec.facing ?? 'right';
  const sx = side ? (w => (facing === 'left' ? -w[2] : w[2])) : (w => w[0]);
  const P = w => [cam.x0 + sx(w) * cam.pxPerM, cam.y0 - w[1] * cam.pxPerM];
  return { view: side ? 'side' : 'front', facing, near: side ? (facing === 'left' ? 'l' : 'r') : null, P, pxm: cam.pxPerM, ...cam };
}

// Everything drawn for one pose: body shapes + equipment items, in plate px.
function drawPose(spec, body, q, cam, ctx) {
  const sk = fk(q, body), lm = landmarks(sk);
  const shapes = bodyShapes(sk, cam, { armsFront: spec.armsFront, hand: spec.hand }).map(s => ({ ...s, part: partOf(s.key) }));
  const eq = [];
  (spec.equipment ?? []).forEach((e, i) => {
    let ent = typeof e === 'function' ? e(lm, { ...ctx, q }) : e;
    if (!ent) return;
    for (const one of [].concat(ent)) {
      const prim = PRIMITIVES[one.type];
      if (!prim) throw new Error(`unknown equipment type: ${one.type}`);
      prim(one, cam).forEach((it, j) => eq.push({ ...it, z: one.z ?? it.z, part: one.part ?? null, key: `eq${i}.${one.type}.${j}` }));
    }
  });
  return { sk, lm, shapes, eq };
}

// Resolve a point reference to plate px. ref: 'elbow.l' | 'start:elbow.l' | [x, y] px | [x, y, z] world | { at, pose, off }.
function makePointResolver(cam, lms) {
  const P = cam.P;
  const res = (ref, defPose = 'end') => {
    if (Array.isArray(ref)) return ref.length === 3 ? P(ref) : ref;
    if (typeof ref === 'string') { const [a, b] = ref.includes(':') ? ref.split(':') : [defPose, ref]; const w = lms[a]?.[b]; if (!w) throw new Error(`unknown landmark ${ref}`); return P(w); }
    if (ref.along) { const a = res(ref.along[0], ref.pose ?? defPose), b = res(ref.along[1], ref.pose ?? defPose), t = ref.t ?? 1, o = ref.off ?? [0, 0];
      return [a[0] + (b[0] - a[0]) * t + o[0], a[1] + (b[1] - a[1]) * t + o[1]]; }
    const p = res(ref.at, ref.pose ?? defPose), o = ref.off ?? [0, 0];
    return [p[0] + o[0], p[1] + o[1]];
  };
  return res;
}
const WORLD_DIRS = { up: [0, 1, 0], down: [0, -1, 0], forward: [0, 0, 1], back: [0, 0, -1], left: [1, 0, 0], right: [-1, 0, 0] };

/** Render one plate. */
export function renderPlate(spec, { id = 'p', mistake = false, selected = null } = {}) {
  const body = { height: spec.body?.height ?? 1.75 };
  const keys = [spec.poses.start, ...(spec.poses.via ?? []), spec.poses.end].map(p => normPose(p, body));
  const nG = spec.ghosts?.count ?? 3;
  const ghostT = Array.from({ length: nG }, (_, i) => (i + 1) / (nG + 1));
  const opac = spec.ghosts?.opacity ?? [0.12, 0.36];
  const ghostO = ghostT.map((_, i) => nG === 1 ? opac[1] : opac[0] + (opac[1] - opac[0]) * i / (nG - 1));
  const at = t => poseAt(keys, t, body);
  const rStart = at(0), rEnd = at(1), rGhost = ghostT.map(at);
  let rMis = null;
  if (spec.mistake?.pose) rMis = resolve(normPose(mergeDeep(spec.poses.end, spec.mistake.pose), body), body);

  // ---- camera (reference scale by default; optional fit) ----
  let camCfg = { ...REF_CAMERA, ...(spec.camera ?? {}) };
  const ctxStart = { pose: 'start', start: null };
  if (spec.camera?.fit) {
    const probe = makeCamera(spec, { pxPerM: 100, x0: 0, y0: 0 });
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const lmS = landmarks(fk(rStart.q, body));
    for (const r of [rStart, rEnd, ...rGhost]) {
      const dp = drawPose(spec, body, r.q, probe, { ...ctxStart, start: lmS });
      for (const s of [...dp.shapes, ...dp.eq]) for (const [x, y] of (s.poly ?? s.line ?? [])) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    }
    const m = { left: 16, right: 16, top: 44, bottom: 19, ...(spec.camera.fit === true ? {} : spec.camera.fit) };
    const k = Math.min(REF_CAMERA.pxPerM / 100 * (spec.camera.maxScale ?? 1), (SIZE - m.left - m.right) / (x1 - x0), (SIZE - m.top - m.bottom) / (y1 - y0));
    camCfg = { pxPerM: 100 * k, x0: m.left + ((SIZE - m.left - m.right) - (x1 - x0) * k) / 2 - x0 * k, y0: SIZE - m.bottom - y1 * k };
    if (spec.camera.x0 != null) camCfg.x0 = spec.camera.x0;
    if (spec.camera.y0 != null) camCfg.y0 = spec.camera.y0;
  }
  const cam = makeCamera(spec, camCfg);

  // ---- draw every pose ----
  const lmStart = landmarks(fk(rStart.q, body));
  const ctx = pose => ({ pose, start: lmStart, body, mistake });   // mistake: true while drawing the mistake plate
  const S = drawPose(spec, body, rStart.q, cam, ctx('start'));
  const E = drawPose(spec, body, rEnd.q, cam, ctx('end'));
  const Gs = rGhost.map((r, i) => drawPose(spec, body, r.q, cam, ctx(`ghost${i}`)));
  const M = rMis ? drawPose(spec, body, rMis.q, cam, ctx('mistake')) : null;
  const lms = { start: S.lm, end: E.lm, ...(M ? { mistake: M.lm } : {}) };
  const PR = makePointResolver(cam, lms);

  // static = identical outline in start and end: drawn once (end layer); moving parts go in start + ghosts + end
  const sD = new Map(S.shapes.map(s => [s.key, s.d])), sE = new Map(S.eq.map(s => [s.key, s.d]));
  const movingBody = new Set(E.shapes.filter(s => sD.get(s.key) !== s.d).map(s => s.key));
  const eqMoving = it => sE.get(it.key) !== it.d;
  const ghostParts = spec.ghosts?.parts ?? null;
  const inGhost = it => !ghostParts || ghostParts.includes(it.part) || ghostParts.includes(it.key);
  const startParts = spec.startParts ?? null;   // opt-in: only these parts of the start pose are drawn (default: all moving parts)
  const inStart = it => !startParts || startParts.includes(it.part) || startParts.includes(it.key);

  const defs = [];
  const def = (name, d) => { const k = `${id}-${name}`; defs.push(`<path id="${k}" d="${d}"/>`); return k; };
  const uses = ids => ids.map(k => `<use href="#${k}"/>`).join('');
  const union = (ids, cls = '') => ids.length ? `<g class="${cls}"><g class="u-stroke">${uses(ids)}</g><g class="u-fill">${uses(ids)}</g></g>` : '';
  const eqEl = it => `<path class="${it.cls}" d="${it.d}"/>`;
  const groups = GROUP_ORDER[cam.view];

  // one pose layer: z-ordered equipment around the union groups of the body
  function layer(dp, tag, { onlyMoving, filter = () => true, heldInUnion = false }) {
    const bodyIn = dp.shapes.filter(s => (!onlyMoving || movingBody.has(s.key)) && filter(s));
    const eqIn = dp.eq.filter(it => it.z !== 'floor' && (!onlyMoving || eqMoving(it)) && filter(it) && !(heldInUnion && it.cls === 'disc-core'));
    const at = z => eqIn.filter(it => it.z === z);
    const eqBlock = z => {
      const items = at(z);
      if (!heldInUnion) return items.map(eqEl).join('');
      const held = items.filter(it => it.cls === 'disc'), rest = items.filter(it => it.cls !== 'disc');
      return rest.map(eqEl).join('') + union(held.map((it, i) => def(`${tag}-${it.key}-${i}`, it.d)));
    };
    const grp = g => union(bodyIn.filter(s => s.group === g).map(s => def(`${tag}-${s.key}`, s.d)), g === 'far' ? 'far' : '');
    if (cam.view === 'side') return eqBlock('back') + grp('far') + eqBlock('center') + grp('trunk') + eqBlock('mid') + grp('near') + eqBlock('front');
    return eqBlock('back') + grp('body') + eqBlock('center') + grp('legs') + eqBlock('mid') + grp('arms') + eqBlock('front');
  }
  void groups;
  const staticBack = E.eq.filter(it => it.z === 'back' && !eqMoving(it)).map(eqEl).join('');
  const floorEls = E.eq.filter(it => it.z === 'floor').map(eqEl).join('');
  const startLayer = `<g class="pose-start">${layer(S, 'st', { onlyMoving: true, filter: inStart, heldInUnion: true })}</g>`;
  const ghostLayers = Gs.map((g, i) => `<g class="ghost" style="--o:${f(ghostO[i])};--i:${i}" data-t="${f(ghostT[i])}">${layer(g, `g${i}`, { onlyMoving: true, filter: inGhost, heldInUnion: true })}</g>`).join('');
  const endBody = layer({ ...E, eq: E.eq.filter(it => !(it.z === 'back' && !eqMoving(it))) }, 'e', { onlyMoving: false });
  const markKeys = spec.marks ?? (cam.view === 'front' ? ['shoulder.l', 'shoulder.r', 'elbow.l', 'elbow.r'] : [`shoulder.${cam.near}`, `elbow.${cam.near}`, `hip.${cam.near}`, `knee.${cam.near}`]);
  const marks = markKeys.map(k => PR(k)).map(c => `<circle class="joint" cx="${f(c[0])}" cy="${f(c[1])}" r="2.25"/>`).join('');
  const endLayer = `<g class="pose-end">${endBody}${marks}</g>`;

  // ---- occupancy (for label layout and the collision report) ----
  const occ = new Occ(SIZE);
  const addShape = s => { if (s.poly) occ.poly(s.poly); else if (s.line) occ.line(s.line, (s.w ?? 1) + 1); };
  for (const dp of [S, E, ...Gs, ...(mistake && M ? [M] : [])]) { dp.shapes.forEach(addShape); dp.eq.forEach(addShape); }

  // ---- accent: trace path of one point, arrowhead ----
  let accent = '', arcWedge = '', measureInfo = null, arcAnchor = null;
  if (spec.trace && !mistake) {
    const n = spec.trace.samples ?? 48, pts = [];
    for (let i = 0; i <= n; i++) { const r = at(i / n), lm = landmarks(fk(r.q, body)); pts.push(cam.P(lm[spec.trace.point])); }
    const [t0, t1] = spec.trace.trim ?? [8, 12];
    const g0 = pts[0], g1 = pts[pts.length - 1];
    const tp = pts.filter(p => d2(p, g0) > t0 && d2(p, g1) > t1);
    if (tp.length >= 3) {
      const tip = tp[tp.length - 1], prev = tp[tp.length - 2], dl = d2(tip, prev);
      const du = [(tip[0] - prev[0]) / dl, (tip[1] - prev[1]) / dl], dn = [-du[1], du[0]];
      const head = [[tip[0] + du[0] * 6, tip[1] + du[1] * 6], [tip[0] + dn[0] * 3, tip[1] + dn[1] * 3], [tip[0] - dn[0] * 3, tip[1] - dn[1] * 3]];
      accent += `<path class="trace" pathLength="1" d="${spline(tp, false)}"/><path class="arrow" d="M${pt(head[0])}L${pt(head[1])}L${pt(head[2])}Z"/>`;
      occ.line(tp, 5); occ.poly(head);
    }
  }
  // ---- measured angle ----
  if (spec.measure && !mistake) {
    const ms = spec.measure, V = PR(ms.vertex), r = ms.radius ?? 28;
    const ray = ref => {
      if (typeof ref === 'string' && WORLD_DIRS[ref]) { const w = WORLD_DIRS[ref], a = cam.P([0, 0, 0]), b = cam.P(w); return [b[0] - a[0], b[1] - a[1]]; }
      if (ref && ref.dir) return [ref.dir[0], -ref.dir[1]];
      const pose = typeof ref === 'object' && !Array.isArray(ref) ? (ref.pose ?? 'end') : (String(ref).includes(':') ? String(ref).split(':')[0] : 'end');
      const vtx = PR({ at: ms.vertex, pose }), p = PR(ref, pose);
      return [p[0] - vtx[0], p[1] - vtx[1]];
    };
    const u0 = ray(ms.from), u1 = ray(ms.to);
    const a0 = Math.atan2(u0[1], u0[0]) / R;
    let da = Math.atan2(u1[1], u1[0]) / R - a0; while (da > 180) da -= 360; while (da <= -180) da += 360;
    const ap = (a, rr) => [V[0] + Math.cos(a * R) * rr, V[1] + Math.sin(a * R) * rr], a1 = a0 + da, sw = da > 0 ? 1 : 0;
    arcWedge = `<path class="arc measure" d="M${pt(V)}L${pt(ap(a0, r))}A${r} ${r} 0 0 ${sw} ${pt(ap(a1, r))}Z"/>`;
    const ticks = [a0, a1].map(a => `<path d="M${pt(ap(a, r - 4))}L${pt(ap(a, r + 5))}"/>`).join('');
    accent += `<g class="measure"><path class="arc-line" d="M${pt(ap(a0, r))}A${r} ${r} 0 0 ${sw} ${pt(ap(a1, r))}"/><g class="arc-ticks">${ticks}</g>__ARCLEADER__</g>`;
    const wedge = [V]; for (let k = 0; k <= 12; k++) wedge.push(ap(a0 + da * k / 12, r + 5)); occ.poly(wedge);
    arcAnchor = ap(a0 + da / 2, r + 2);
    measureInfo = { drawnDeg: +Math.abs(da).toFixed(1), expect: ms.expect ?? null };
  }
  // ---- datum lines and floor ----
  const datumEls = (spec.datum ?? []).filter(dt => !(mistake && dt.mistake === false)).map(dt => {   // mistake: false = correct plate only
    let a, b;
    if (dt.y != null) { const y = typeof dt.y === 'number' ? cam.P([0, dt.y, 0])[1] : PR(dt.y)[1]; const xa = typeof dt.from === 'number' ? dt.from : PR(dt.from)[0], xb = typeof dt.to === 'number' ? dt.to : PR(dt.to)[0]; a = [xa, y]; b = [xb, y]; }
    else { const x = typeof dt.x === 'number' ? dt.x : PR(dt.x)[0]; const ya = typeof dt.from === 'number' ? dt.from : PR(dt.from)[1], yb = typeof dt.to === 'number' ? dt.to : PR(dt.to)[1]; a = [x, ya]; b = [x, yb]; }
    if (dt.line) { a = PR(dt.line[0]); b = PR(dt.line[1]); }
    occ.line([a, b], 2);
    return `<path class="datum" d="M${pt(a)}L${pt(b)}"/>`;
  }).join('');

  // ---- mistake layer: the faulty pose (changed parts), guide arrows/lines ----
  let mkLayer = '', mPose = '';
  if (mistake && spec.mistake) {
    if (M) {
      const eD = new Map(E.shapes.map(s => [s.key, s.d]));
      const parts = spec.mistake.parts ?? null;
      const changed = M.shapes.filter(s => parts ? (parts.includes(s.part) || parts.includes(s.key)) : eD.get(s.key) !== s.d);
      const eqD = new Map(E.eq.map(s => [s.key, s.d]));
      const eqCh = M.eq.filter(it => eqD.get(it.key) !== it.d && it.z !== 'floor' && (!parts || parts.includes(it.part) || parts.includes(it.key)));
      // outline of the union only (a mask removes the inner half of every stroke), so the correct pose stays visible under it
      // mask: hide the inside of the faulty body (all its parts) and every place where it runs on the correct outline
      const ids = [...changed.map(s => def(`m-${s.key}`, s.d)), ...eqCh.filter(it => it.poly).map((it, i) => def(`m-eq${i}`, it.d))];
      const allM = M.shapes.map(s => changed.includes(s) ? `${id}-m-${s.key}` : def(`mf-${s.key}`, s.d));
      const endIds = [...E.shapes, ...E.eq.filter(it => it.poly)].map((s, i) => def(`mo-${i}`, s.d));
      mPose = ids.length ? `<mask id="${id}-mmask" maskUnits="userSpaceOnUse" x="0" y="0" width="${SIZE}" height="${SIZE}"><rect width="${SIZE}" height="${SIZE}" fill="#fff"/>`
        + `${allM.map(k => `<use href="#${k}" fill="#000"/>`).join('')}${endIds.map(k => `<use href="#${k}" fill="none" stroke="#000" stroke-width="3.5"/>`).join('')}</mask>`
        + `<g class="m-pose" mask="url(#${id}-mmask)"><g class="u-stroke">${uses(ids)}</g></g>` : '';
    }
    const gpt = p => PR(p, M ? 'mistake' : 'end');
    const arrowHead = (tip, from) => { const L = d2(tip, from) || 1, t = [(tip[0] - from[0]) / L, (tip[1] - from[1]) / L], n = [-t[1], t[0]]; return `M${pt([tip[0] - t[0] * 4 + n[0] * 3, tip[1] - t[1] * 4 + n[1] * 3])}L${pt(tip)}L${pt([tip[0] - t[0] * 4 - n[0] * 3, tip[1] - t[1] * 4 - n[1] * 3])}`; };
    const g = (spec.mistake.guides ?? []).map(gd => {
      if (gd.kind === 'arrow') { const a = gpt(gd.from), b = gpt(gd.to); occ.line([a, b], 3); return `<path class="m-arrow" d="M${pt(a)}L${pt(b)}${arrowHead(b, a)}"/>`; }
      if (gd.kind === 'line' || gd.kind === 'dashed') { const ps = gd.pts.map(gpt); occ.line(ps, 2); return `<path class="${gd.kind === 'dashed' ? 'm-line' : 'm-arrow'}" d="${gd.smooth ? spline(ps, false) : 'M' + ps.map(pt).join('L')}"/>`; }
      if (gd.kind === 'arc-arrow') {   // around a point, from angle a0 to a1 (deg, screen, clockwise positive)
        const c = gpt(gd.center), r = gd.r ?? 15, p = a => [c[0] + r * Math.cos(a * R), c[1] + r * Math.sin(a * R)];
        const sw = gd.a1 > gd.a0 ? 1 : 0, large = Math.abs(gd.a1 - gd.a0) > 180 ? 1 : 0, e = p(gd.a1), pre = p(gd.a1 - Math.sign(gd.a1 - gd.a0) * 12);
        const arcPts = Array.from({ length: 9 }, (_, k) => p(gd.a0 + (gd.a1 - gd.a0) * k / 8)); occ.line(arcPts, 3);
        return `<path class="m-arrow" d="M${pt(p(gd.a0))}A${r} ${r} 0 ${large} ${sw} ${pt(e)}${arrowHead(e, pre)}"/>`;
      }
      return '';
    }).join('');
    mkLayer = `<g class="mistake-layer">${g}__MLEADERS__</g>`;
  }

  // ---- labels ----
  occ.build();
  const metaText = spec.viewLabel ?? (cam.view === 'front' ? 'Front view' : 'Side view');
  const metaBox = { x0: 16, y0: 14, x1: 16 + capWidth(metaText), y1: 14 + CAP_LH };
  const items = [];
  const src = mistake ? (spec.mistake?.tells ?? []) : (spec.callouts ?? []);
  for (const c of src) items.push({ ...c, kind: 'callout', anchorPt: PR(c.anchor, mistake && M ? 'mistake' : 'end'), w: capWidth(c.text) });
  items.forEach(it => { it.anchor = it.anchorPt; });
  if (!mistake && spec.measure) items.push({ kind: 'arc', key: '_arc', title: spec.measure.title, value: spec.measure.value, anchor: arcAnchor, box: spec.measure.box, prefer: spec.measure.prefer, w: capWidth(spec.measure.title) });
  // anchors of all labels count as occupied for the other labels
  placeLabels(items, occ, SIZE, [metaBox]);
  const leaders = items.filter(it => it.kind === 'callout').map(it => {
    const L = leaderFor(it.anchor, it.ink), on = selected === it.key;
    return `<path class="leader${mistake ? ' m' : ''}${on && !mistake ? ' on' : ''}" d="${L.d}"/>` + (mistake ? '' : `<circle class="anchor${on ? ' on' : ''}" cx="${f(it.anchor[0])}" cy="${f(it.anchor[1])}" r="${on ? 2.5 : 1.5}"/>`);
  }).join('');
  const arcIt = items.find(it => it.kind === 'arc');
  if (arcIt) {
    const b = arcIt.ink, [ax, ay] = arcIt.anchor;
    const end = ax < b.x0 ? [b.x0 - 3, b.y0 + 7] : ax > b.x1 ? [b.x1 + 3, b.y0 + 7] : [ax, ay < b.y0 ? b.y0 - 3 : b.y1 + 3];
    accent = accent.replace('__ARCLEADER__', `<path class="leader" d="M${pt(arcIt.anchor)}L${pt(end)}"/>`);
  }
  const guideSel = !mistake && selected ? (spec.callouts ?? []).find(c => c.key === selected && c.guide) : null;
  if (guideSel) accent += `<path class="lead-guide" d="M${guideSel.guide.map(p => pt(PR(p))).join('L')}"/>`;
  if (accent) accent = `<g class="accent-layer">${accent}</g>`;
  if (mistake) mkLayer = mkLayer.replace('__MLEADERS__', leaders);

  const svg = `<svg class="plate-svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" aria-hidden="true">
  <defs><pattern id="${id}-dots" width="16" height="16" patternUnits="userSpaceOnUse"><rect x="7.5" y="7.5" width="1" height="1" class="dot"/></pattern>${defs.join('')}</defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#${id}-dots)"/>
  ${datumEls}${floorEls}${staticBack}${mistake ? '' : arcWedge}${startLayer}${ghostLayers}${endLayer}${mistake ? '' : accent}${mistake ? '' : leaders}${mPose}${mkLayer}
</svg>`;
  const pos = b => `left:${f(b.left / SIZE * 100)}%;top:${f(b.top / SIZE * 100)}%`;
  const overlay = [
    `<span class="plate-meta" style="${pos({ left: 16, top: 14 })}">${metaText}</span>`,
    ...items.filter(it => it.kind === 'callout').map(it => `<button class="plate-callout${it.text.match(/<br|\n/) ? ' two' : ''}${mistake ? ' m' : ''}" style="${pos(it.btn)}" aria-pressed="${selected === it.key}" data-key="${it.key}">${it.text.replace(/\n/g, '<br>')}</button>`),
    arcIt ? `<span class="plate-arc-label" style="${pos(arcIt.btn)}"><b>${arcIt.title}</b><span>${arcIt.value}</span></span>` : '',
  ].join('');

  // ---- report ----
  const J = ['head', 'shoulder.l', 'shoulder.r', 'elbow.l', 'elbow.r', 'grip.l', 'grip.r', 'hip.l', 'hip.r', 'knee.l', 'knee.r', 'ankle.l', 'ankle.r'];
  const keyJoints = J.map(k => ({ k, p: cam.P(E.lm[k]) }));
  const labelItems = [...items, { kind: 'meta', text: metaText, ink: metaBox }];
  const contacts = { start: rStart.contacts, end: rEnd.contacts, ...(rMis ? { mistake: rMis.contacts } : {}) };
  const issues = checkLabels(labelItems.filter(x => x.kind !== 'meta'), occ, keyJoints, SIZE);
  for (const [pose, cs] of Object.entries(contacts)) for (const c of cs) if (c.errCm > 0.5) issues.push(`contact:${pose}:${c.kind}.${c.side}:${c.errCm}cm`);
  // author contact checks: a landmark ON a point or a plane (seat, pad, floor), per pose
  const checks = [];
  for (const c of spec.checks ?? []) for (const pose of (c.pose === 'all' || !c.pose ? Object.keys(lms) : [c.pose])) {
    const w = lms[pose]?.[c.landmark]; if (!w) continue;
    let dist;
    if (c.above) {   // must be on the positive side of the plane (clearance), tol cm allowed below
      const n = norm(c.above.normal), sd = (w[0] - c.above.point[0]) * n[0] + (w[1] - c.above.point[1]) * n[1] + (w[2] - c.above.point[2]) * n[2];
      const cm = +(sd * 100).toFixed(1); checks.push({ landmark: c.landmark, pose, aboveCm: cm });
      if (cm < -(c.tol ?? 0.5)) issues.push(`check:${pose}:${c.landmark}:below by ${-cm}cm`);
      continue;
    }
    if (c.plane) { const n = norm(c.plane.normal); dist = Math.abs((w[0] - c.plane.point[0]) * n[0] + (w[1] - c.plane.point[1]) * n[1] + (w[2] - c.plane.point[2]) * n[2]); }
    else dist = len(sub(w, c.at));
    const cm = +(dist * 100).toFixed(1); checks.push({ landmark: c.landmark, pose, cm });
    if (cm > (c.tol ?? 1)) issues.push(`check:${pose}:${c.landmark}:${cm}cm`);
  }
  if (measureInfo?.expect != null && Math.abs(measureInfo.drawnDeg - measureInfo.expect) > 2) issues.push(`measure:drawn ${measureInfo.drawnDeg} vs expect ${measureInfo.expect}`);
  const report = {
    id: spec.id, view: cam.view, mistake, camera: { pxPerM: +cam.pxPerM.toFixed(2), x0: +cam.x0.toFixed(1), y0: +cam.y0.toFixed(1) },
    contacts, checks, measure: measureInfo, keyJoints: keyJoints.map(j => ({ k: j.k, p: j.p.map(v => +v.toFixed(1)) })),
    labels: labelItems.map(x => ({ key: x.key ?? 'meta', text: x.text ?? x.title, ink: Object.fromEntries(['x0', 'y0', 'x1', 'y1'].map(k => [k, +x.ink[k].toFixed(1)])) })),
    angles: { start: summarise(rStart.q), end: summarise(rEnd.q), ...(rMis ? { mistake: summarise(rMis.q) } : {}) },
    issues,
  };
  return { svg, overlay, cues: src, report, occ };
}
const r1 = v => +v.toFixed(1);
function summarise(q) {
  const o = { tilt: r1(q.tilt), trunk: r1(q.trunk), neck: r1(q.neck) };
  for (const s of SIDES) Object.assign(o, { [`sh.${s}`]: `elev ${r1(q.sh[s].elev)} plane ${r1(q.sh[s].plane)} rot ${r1(q.sh[s].rot)}`, [`elbow.${s}`]: r1(q.elbow[s]),
    [`hip.${s}`]: `flex ${r1(q.hip[s].flex)} abd ${r1(q.hip[s].abd)}`, [`knee.${s}`]: r1(q.knee[s]), [`ankle.${s}`]: r1(q.ankle[s]) });
  return o;
}
void add; void mul; void REF; void WINTER;

// ===== CSS: the reference PLATE_CSS unchanged, plus rules for the engine's new classes only. =====
export const ENGINE_CSS = `
/* ===== ENGINE (plates2/engine): new classes only. Nothing in the reference block above is restyled. ===== */
.plate .pose-end .far .u-stroke use { stroke: var(--text-3); }
.plate .eq { fill: var(--surface-2); stroke: var(--text-3); stroke-width: 1; stroke-linejoin: round; }
.plate .eq-solid { fill: var(--surface-3); stroke: var(--text-2); stroke-width: 1; stroke-linejoin: round; }
.plate .eq-line { fill: none; stroke: var(--text-3); stroke-width: 1; stroke-linecap: round; }
.plate .eq-thin { fill: none; stroke: var(--border-strong); stroke-width: .75; }
.plate .eq-cable { fill: none; stroke: var(--text-2); stroke-width: .75; stroke-linecap: round; }
.plate .eq-pin { fill: var(--text-3); stroke: none; }
.plate .pose-start .eq, .plate .pose-start .eq-solid { fill: var(--surface-2); stroke: var(--border-strong); stroke-dasharray: 3 3; }
.plate .pose-start .eq-line, .plate .pose-start .eq-cable, .plate .pose-start .eq-thin { stroke: var(--border-strong); stroke-dasharray: 3 3; }
.plate .pose-start .eq-pin { fill: var(--border-strong); }
.plate .ghost .eq, .plate .ghost .eq-solid { fill: var(--surface-2); stroke: var(--text-3); }
.plate .ghost .eq-line, .plate .ghost .eq-cable, .plate .ghost .eq-thin { stroke: var(--text-3); }
.plate .ghost .eq-pin { fill: var(--text-3); }
/* the faulty pose: outline of the changed parts only (masked union), dashed in --mistake */
.plate .m-pose .u-stroke use { fill: none; stroke: var(--mistake); stroke-width: 2; stroke-linejoin: round; stroke-dasharray: 4 3; }
`;
export const PLATE_CSS = REF_CSS + ENGINE_CSS;
