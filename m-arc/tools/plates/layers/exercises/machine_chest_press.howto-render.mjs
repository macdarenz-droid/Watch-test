// Render check for exercises/machine_chest_press.howto.mjs:
//   node exercises/machine_chest_press.howto-render.mjs
// Writes out/machine_chest_press-howto-<part>-<theme>.png (Silent Black and Paper, 390 px wide, device scale 2):
//   plate      the plate with the How-to callouts (Heel of palm, Blades on pad, Handles mid-chest) and the chip row
//   hand       S2: hand zoom (Right / Wrong from hand.mjs, seen from above) plus the horizontal-handle inset
//   seat-height, blades   S3: posture zooms, crops of the plate (same camera, same machine), one callout each
//   feel       S4: feel map at rest + legend + feel line + first 3 rows + "Show 4 more"
//   feel-wrist S6: the wrist row open (hand parts tinted, red-flag block), shimmer paused
//   feel-shoulders S6: the front-of-shoulders row open (front delts dashed)
// Prints a JSON report: hand lever checks, crop label placement, text-fit and contrast checks, overflow.
// Uses the engine read-only (renderPlate, renderHandPair, renderHand, renderFeelMap); nothing in engine/ is changed.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderPlate, PLATE_CSS, landmarksOf, sheetPage } from '../engine/index.mjs';
import { renderHandPair, renderHand, HAND_CSS } from '../engine/hand.mjs';
import { renderFeelMap, renderFeelLegend, FEEL_CSS } from '../engine/feelmap.mjs';
import { allThemesCss } from '../engine/themes.mjs';
import howto, { stills, SOURCES, RED_FLAG } from './machine_chest_press.howto.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), outDir = join(root, 'out');
mkdirSync(outDir, { recursive: true });
const ID = 'machine_chest_press';
const FONT = `data:font/woff2;base64,${readFileSync(join(root, 'engine', 'inter-latin-wght-normal.woff2')).toString('base64')}`;
const TOKENS = readFileSync(join(root, 'engine', 'tokens.css'), 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const f = v => +(+v).toFixed(2);
const H = 1.75, REF = { pxPerM: 146.29, x0: 150, y0: 339 };   // plate camera (spec camera x0 150, reference scale)
const P = w => [REF.x0 + w[2] * REF.pxPerM, REF.y0 - w[1] * REF.pxPerM];
const plateSpec = howto.plate;
const report = { hand: null, crops: {}, checks: [] };
const check = (ok, msg) => { report.checks.push(`${ok ? 'PASS' : 'FAIL'} ${msg}`); };

/* ---------------------------------------------------------------- icons (the sheet's check / x paths) ---------- */
const ic = (d, s, cls = '') => `<svg class="${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${f(1.5 * 24 / s)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  check: (s, c) => ic('<path d="M5 12l4 4L19 7"/>', s, c), x: (s, c) => ic('<path d="M6 6l12 12M18 6L6 18"/>', s, c),
  back: s => ic('<path d="M15 5l-7 7 7 7"/>', s), chev: (s, c) => ic('<path d="M9 5l7 7-7 7"/>', s, c),
  down: (s, c) => ic('<path d="M5 9l7 7 7-7"/>', s, c), alert: (s, c) => ic('<path d="M12 8v5M12 16.5v.5"/><circle cx="12" cy="12" r="9"/>', s, c),
};
const iconCheck = (x, y, sz, cls) => `<path class="${cls} ok" transform="translate(${f(x)} ${f(y)}) scale(${f(sz / 24)})" d="M5 12l4 4L19 7"/>`;
const iconCross = (x, y, sz, cls) => `<path class="${cls} no" transform="translate(${f(x)} ${f(y)}) scale(${f(sz / 24)})" d="M6 6l12 12M18 6L6 18"/>`;

/* ---------------------------------------------------------------- posture crops ---------------------------------- */
// A still of the plate spec: one pose, no ghosts, trace, measure, callouts or mistake layer. `seatDrop` moves the seat,
// back pad, pad bracket and body down together (lever, handles, feet, frame stay).
function stillSpec({ pose, seatDrop = 0 }) {
  const dy = -seatDrop, up = q => [q[0], q[1] + dy, q[2]];
  const equipment = plateSpec.equipment
    .filter(e => !(typeof e === 'function' && e.toString().includes('startArmPhantom')))   // start phantom: plate-only
    .map(e => {
      if (typeof e === 'function' || !dy) return e;
      if (e.type === 'seat') return { ...e, at: up(e.at) };
      if (e.type === 'backPad') return { ...e, surface: e.surface.map(up) };
      if (e.type === 'line') return { ...e, pts: e.pts.map(up) };   // the pad bracket
      return e;
    });
  const p = { ...pose, root: { ...pose.root, at: up(pose.root.at) } };
  const { trace, measure, mistake, datum, ...rest } = plateSpec;
  return { ...rest, poses: { start: p, end: p }, equipment, ghosts: { count: 0 }, callouts: [], checks: [], seatDrop };
}
const refPt = (ref, still) => {   // PointRef on a still: landmark of that still's pose (+ px offset)
  const s = stillSpec(still), lm = landmarksOf(s.poses.end, H);
  const [x, y] = P(lm[ref.landmark]);
  return [x + (ref.dx ?? 0), y + (ref.dy ?? 0)];
};
const stillOf = side => (side === 'start' || side === 'end') ? stills[side] : stills[side.still];

// Guides per crop, in plate px, plus the callout anchor. Colour class: accent (right) or mistake (wrong).
function guides(kind, still, role) {
  const s = stillSpec(still), lm = landmarksOf(s.poses.end, H), cls = role === 'right' ? 'hz-g ok' : 'hz-g no';
  if (kind === 'handle-to-chest') {
    // The handle's height carried back across the body to the pad (dashed): it crosses mid-chest in the right crop and
    // the shoulder joint in the wrong one. handleAboveTickPx = how far the handle sits above mid-chest (the correct
    // setup's handle height, moved down with the body when the seat drops).
    const g = P(lm['grip.r']), c = P(lm.chest), bu = P(lm.backUpper);
    const tickY = P(landmarksOf(stillSpec(stills.start).poses.end, H)['grip.r'])[1] + (s.seatDrop ?? 0) * REF.pxPerM;
    // mid-chest mark: where the torso front meets the nipple line (the correct handle height, the plate's HANDLE_Y),
    // drawn over the arm: a short tick on the chest line plus a dot. Right crop: on the handle line, in the accent. Wrong:
    // below it, in a neutral colour: it is the target, not a second fault (red marks only the fault, the dashed line).
    const mx = c[0], tgtCls = role === 'right' ? 'hz-g ok' : 'hz-g tgt', dotCls = role === 'right' ? 'hz-g dot ok' : 'hz-g dot tgt';
    const e = lm['elbow.r'], forearmDeg = Math.atan2(lm['grip.r'][1] - e[1], lm['grip.r'][2] - e[2]) * 180 / Math.PI;   // side view, + = climbing
    return { svg: `<path class="${cls} dash" d="M${f(bu[0] - 3)} ${f(g[1])}H${f(g[0])}"/>`
        + `<path class="${tgtCls}" d="M${f(mx - 5)} ${f(tickY)}H${f(mx + 5)}"/><circle class="${dotCls}" cx="${f(mx)}" cy="${f(tickY)}" r="2.2"/>`,
      anchor: [c[0], g[1]], handleAboveTickPx: f(tickY - g[1]), elbowBelowHandleCm: f((lm['grip.r'][1] - e[1]) * 100), forearmSideDeg: f(forearmDeg) };
  }
  const padItem = s.equipment.find(e => e.type === 'backPad');
  const [pu, pl] = padItem.surface, d = [pu[1] - pl[1], pu[2] - pl[2]], k = Math.hypot(...d), u = [0, d[0] / k, d[1] / k], n = [0, -u[2], u[1]];
  const bu = lm.backUpper, sd = (bu[1] - pu[1]) * n[1] + (bu[2] - pu[2]) * n[2];   // back-to-pad distance along the pad normal
  const foot = [0, bu[1] - n[1] * sd, bu[2] - n[2] * sd];
  if (kind === 'pad-contact') {
    // a short bracket along the pad face where the upper back touches it
    const a = P([0, foot[1] - u[1] * 0.07, foot[2] - u[2] * 0.07]), b = P([0, foot[1] + u[1] * 0.07, foot[2] + u[2] * 0.07]);
    const Fp = P(foot);
    return { svg: `<path class="${cls}" d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}"/>`, anchor: Fp, avoid: [], gapCm: +(sd * 100).toFixed(1) };
  }
  if (kind === 'pad-gap') {
    // dimension from the pad face to the rounded upper back, ticks laid along the pad
    // end caps 7 px long (3.5 px each side of the line) and a faint mistake-colour fill in the gap between them, so the
    // space between back and pad reads at a glance (the gap itself is only about 5 plate px)
    const A = P(foot), B = P(bu), tk = 3.5 / REF.pxPerM;
    const ends = p => [P([0, p[1] - u[1] * tk, p[2] - u[2] * tk]), P([0, p[1] + u[1] * tk, p[2] + u[2] * tk])];
    const [a0, a1] = ends(foot), [b0, b1] = ends(bu), L = ([a, b]) => `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
    return { svg: `<path class="hz-g gapfill" d="M${f(a0[0])} ${f(a0[1])}L${f(b0[0])} ${f(b0[1])}L${f(b1[0])} ${f(b1[1])}L${f(a1[0])} ${f(a1[1])}Z"/>`
        + `<path class="${cls}" d="${L([A, B])}${L([a0, a1])}${L([b0, b1])}"/>`, anchor: [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], avoid: [], gapCm: +(sd * 100).toFixed(1), capPx: 7 };
  }
  throw new Error(`unknown guide ${kind}`);
}

// One crop panel: the plate still in a nested svg (smaller viewBox = a real crop, strokes kept at plate weight),
// its clear frame, and the one mark the callout points at (drawn in the plate's own coordinates).
function cropPanel(zoom, side, { x, y, S, uid }) {
  const still = stillOf(zoom[side]);
  // `over`: draw that still solid (the right pose) and this one over it as the plate's dashed mistake pose, so the
  // wrong crop shows what changed, as the other posture crops do (the plate's own mistake layer, no guides or tells)
  const over = zoom[side].over;
  const spec = over ? { ...stillSpec(stills[over]), mistake: { pose: still.pose, guides: [], tells: [] } } : stillSpec(still);
  const plate = renderPlate(spec, { id: `${uid}`, mistake: !!over });
  const inner = plate.svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<rect width="358" height="358" fill="url\([^)]*\)"\/>/, '');
  const crop = zoom.crop, c = refPt(crop.center, stills[zoom.right === 'start' ? 'start' : 'end']);   // the right pose sets the window for both
  const s = crop.sizePx, vx = c[0] - s / 2, vy = c[1] - s / 2, k = S / s;
  const co = zoom.callouts[side], G = guides(co.guide, still, side);
  const mc = side === 'right' ? 'ok' : 'no';
  const inside = ([px, py]) => px > vx + 4 && px < vx + s - 4 && py > vy + 4 && py < vy + s - 4;
  report.crops[`${zoom.key}.${side}`] = { still: zoom[side].still ?? zoom[side], window: [f(vx), f(vy), s, s], scale: f(k), markInside: inside(G.anchor),
    ...(G.gapCm != null ? { backToPadCm: G.gapCm } : {}), ...(G.handleAboveTickPx != null ? { handleAboveMidChestCm: f(G.handleAboveTickPx / REF.pxPerM * 100),
      elbowBelowHandleCm: G.elbowBelowHandleCm, forearmSideDeg: G.forearmSideDeg } : {}) };
  const clip = `${uid}-clip`;
  return `<defs><clipPath id="${clip}"><rect x="${f(x)}" y="${f(y)}" width="${S}" height="${S}" rx="10"/></clipPath></defs>`
    + `<g clip-path="url(#${clip})"><rect class="hz-crop-bg" x="${f(x)}" y="${f(y)}" width="${S}" height="${S}"/>`
    + `<svg x="${f(x)}" y="${f(y)}" width="${S}" height="${S}" viewBox="${f(vx)} ${f(vy)} ${s} ${s}" overflow="hidden"><g class="plate hz-crop">${inner}${G.svg}</g></svg></g>`
    + `<rect class="hz-frame" x="${f(x)}" y="${f(y)}" width="${S}" height="${S}" rx="10"/>`;
}

// Right and Wrong, each with its callout printed under the word (as the hand zoom does), then the two crops.
function postureZoomSvg(zoom) {
  const W = 358, gap = 16, S = (W - gap) / 2, top = 70, Ht = top + S + 2;
  const head = (x, ok, note) => (ok ? iconCheck(x, 11, 18, 'h-icon') : iconCross(x, 11, 18, 'h-icon')) + `<text class="h-head" x="${f(x + 23)}" y="25">${ok ? 'Right' : 'Wrong'}</text>`
    + `<text class="h-note${ok ? ' ok' : ' m'}" x="${f(x + 23)}" y="42">${esc(note.toUpperCase())}</text>`;
  const aria = `${zoom.heading}. Right: ${zoom.alt.right} Wrong: ${zoom.alt.wrong}`;
  return `<svg class="hand-svg hz-svg" viewBox="0 0 ${W} ${Ht}" role="img" aria-label="${esc(aria)}" xmlns="http://www.w3.org/2000/svg">`
    + head(4, true, zoom.callouts.right.text) + head(S + gap + 4, false, zoom.callouts.wrong.text)
    + `<g class="zx-half right">${cropPanel(zoom, 'right', { x: 0, y: top - 14, S, uid: `${zoom.key}-r` })}</g>`   // each half its own image (2.5)
    + `<g class="zx-half wrong">${cropPanel(zoom, 'wrong', { x: S + gap, y: top - 14, S, uid: `${zoom.key}-w` })}</g>` + `</svg>`;
}

/* ---------------------------------------------------------------- hand zoom -------------------------------------- */
function handZoomSvg(zoom) {
  // Owner decision 2026-09-30: the main pair is the horizontal handle seen from the side (his machine); the vertical
  // handle is a one-line note (zoom.hand.note), no second drawing.
  const hs = howto.handling, fault = zoom.hand.wrong[0], wrongPose = { ...zoom.hand.right, ...fault.pose, wrist: { ...zoom.hand.right.wrist, ...fault.pose.wrist }, fingers: { ...zoom.hand.right.fingers, ...fault.pose.fingers } };
  const pair = renderHandPair({ camera: zoom.hand.camera, loadAxis: hs.loadAxis, markers: fault.markers, right: zoom.hand.right, wrong: wrongPose,
    rightNote: zoom.hand.notes.right, wrongNote: zoom.hand.notes.wrong, alt: zoom.alt, uid: 'hz', panelHeight: zoom.hand.panelHeight });
  report.hand = pair.report;
  check(pair.report.ok, 'hand: lever checks (right within, wrong behind the wrist)');
  // The engine sets the bend value on the wedge's bisector, where in this side view the thumb crosses it. Move it under
  // the wrist, below the forearm's lower edge (the value-label collision check in the browser pass proves it is clear).
  let svg = pair.svg;
  { const i = svg.indexOf('<g class="h-panel wrong">');
    const wj = svg.slice(i).match(/<circle class="h-joint wrist" cx="([\d.-]+)" cy="([\d.-]+)"/), n0 = svg;
    if (i >= 0 && wj) svg = svg.replace(/<text class="h-val m" x="[\d.-]+" y="[\d.-]+" text-anchor="\w+">(\d+°)<\/text>/, (m0, v) =>
      `<text class="h-val m" x="${f(+wj[1] + 6)}" y="${f(+wj[2] + 30)}" text-anchor="start">${v}</text>`);
    check(svg !== n0, 'hand: bend value moved off the thumb'); }
  return { main: svg, inset: null };
}

/* ---------------------------------------------------------------- page chrome ------------------------------------ */
const ZCSS = `
.hz-svg .hz-crop-bg { fill: var(--surface-2); }
.hz-svg .hz-frame { fill: none; stroke: var(--border-strong); stroke-width: 1; }
.hz-svg .h-note.ok { fill: var(--accent-text); }
.hz-crop path, .hz-crop use, .hz-crop circle, .hz-crop rect, .hz-crop line { vector-effect: non-scaling-stroke; }
.hz-crop .hz-g { fill: none; stroke-width: 1.5; stroke-linecap: round; }
.hz-crop .hz-g.dash { stroke-dasharray: 4 3; }
.hz-crop .hz-g.ok { stroke: var(--accent); } .hz-crop .hz-g.no { stroke: var(--mistake); }
.hz-crop .hz-g.gapfill { fill: color-mix(in srgb, var(--mistake) 28%, transparent); stroke: none; }
.hz-crop .hz-g.dot { stroke: none; } .hz-crop .hz-g.dot.ok { fill: var(--accent); } .hz-crop .hz-g.dot.no { fill: var(--mistake); }
.hz-crop .hz-g.tgt { stroke: var(--text-2); } .hz-crop .hz-g.dot.tgt { fill: var(--text-2); stroke: none; }
.hz-crop .hz-tick { stroke: var(--text-2); stroke-width: 1.5; stroke-linecap: round; }
.hz-svg .hz-leader { fill: none; stroke-width: .75; } .hz-svg .hz-leader.ok { stroke: var(--accent); } .hz-svg .hz-leader.no { stroke: var(--mistake); }
.hz-svg .hz-anchor.ok { fill: var(--accent); } .hz-svg .hz-anchor.no { fill: var(--mistake); }
/* sheet parts */
.hsec { margin-top: var(--sp-4); }
.chips { display: flex; gap: 6px; margin-top: 8px; }
.chip { flex: none; display: inline-flex; align-items: center; min-height: 44px; padding: 0 11px; border-radius: var(--radius-pill); border: 1px solid var(--border); color: var(--text-2); font-size: var(--fs-small); font-weight: var(--fw-medium); white-space: nowrap; }
.chip[aria-pressed="true"] { background: var(--accent-soft); border-color: transparent; color: var(--accent-text); }
.ztop { display: flex; align-items: center; gap: 4px; margin: 0 0 8px -12px; }
.ztop h3 { font-size: var(--fs-body); font-weight: var(--fw-semibold); margin: 0; }
.zbox { border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); background: var(--surface-2); overflow: hidden; padding: 10px 10px 8px; }
.zbox .hand-svg { display: block; width: 100%; height: auto; }
.zbox.hand { padding: 0; } .zbox .inset { border-top: 1px solid var(--border-subtle); padding: 8px 0 4px; }
.caps { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 10px; }
.caps p { margin: 0; display: flex; gap: 6px; font-size: var(--fs-meta); line-height: var(--lh-meta); color: var(--text-2); }
.caps svg { flex: none; margin-top: 1px; } .caps .ok { color: var(--accent-text); } .caps .no { color: var(--mistake); }
.gripline { margin: 12px 0 0; font-size: var(--fs-body); line-height: var(--lh-body); color: var(--text); }
.sore { margin: 6px 0 0; font-size: var(--fs-small); line-height: var(--lh-small); color: var(--text-2); }
.feellink { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 44px; margin-top: 10px; padding: 6px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-align: left; }
.feellink .grow { display: grid; } .feellink .eyebrow { font-size: var(--fs-cap); } .feellink b { font-weight: var(--fw-medium); font-size: var(--fs-small); color: var(--text); }
.feellink .why { font-size: var(--fs-meta); color: var(--accent-text); white-space: nowrap; }
.feel-sec h3 { margin: 0 0 10px; }
.feelline { margin: 12px 0 0; font-size: var(--fs-body); line-height: var(--lh-body); }
.feel-legend { margin-top: 10px; }
.rows { margin-top: 14px; border-top: 1px solid var(--border-subtle); }
.row { border-bottom: 1px solid var(--border-subtle); }
.row > button { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 44px; text-align: left; font-size: var(--fs-body); }
.row > button svg { color: var(--text-3); flex: none; }
.row .body { padding: 0 0 12px 28px; display: grid; gap: 8px; font-size: var(--fs-small); line-height: var(--lh-small); color: var(--text-2); }
.row .body b { color: var(--text); font-weight: var(--fw-semibold); }
.row .showme { justify-self: start; min-height: 44px; padding: 0 14px; border-radius: var(--radius-pill); border: 1px solid var(--border); color: var(--text); font-size: var(--fs-small); font-weight: var(--fw-medium); display: inline-flex; align-items: center; gap: 6px; }
.redflag { display: grid; gap: 6px; padding: 10px 12px; border-radius: var(--radius-md); background: color-mix(in srgb, var(--mistake) 10%, transparent); color: var(--text); }
.redflag p { margin: 0; display: flex; gap: 8px; } .redflag svg { flex: none; color: var(--mistake); margin-top: 1px; }
.more { min-height: 44px; margin-top: 4px; color: var(--accent-text); font-size: var(--fs-small); font-weight: var(--fw-medium); }
`;
function pageHtml(theme, inner) {
  return `<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=390">
<style>@font-face { font-family: 'Inter Variable'; src: url('${FONT}') format('woff2-variations'); font-weight: 100 900; font-display: block; }
${TOKENS}
${allThemesCss()}
*,*::before,*::after{box-sizing:border-box} html,body{margin:0;background:var(--surface-2);color:var(--text);font-family:var(--font);-webkit-font-smoothing:antialiased;font-size:var(--fs-body);line-height:var(--lh-body)}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer} h3{font-size:var(--fs-title);font-weight:var(--fw-semibold);margin:0} figure{margin:0} .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.eyebrow{font-size:var(--fs-cap);line-height:var(--lh-cap);font-weight:var(--fw-semibold);letter-spacing:var(--ls-cap);text-transform:uppercase;color:var(--text-2)}
.btn-back{display:inline-flex;align-items:center;gap:2px;min-height:44px;min-width:44px;padding:0 10px 0 8px;color:var(--text-2);font-size:var(--fs-small)}
.grow{flex:1;min-width:0}
body{width:390px;padding:16px}
${PLATE_CSS}
${HAND_CSS}
${FEEL_CSS}
${ZCSS}</style></head><body>${inner}</body></html>`;
}
const chipRow = active => `<div class="hsec"><span class="eyebrow">Look closer</span><div class="chips" role="group" aria-label="Look closer">`
  + [...howto.zooms.map(z => [z.key, z.chip]), ['feel', 'Where to feel it']].map(([k, t]) => `<button class="chip" aria-pressed="${k === active}">${esc(t)}</button>`).join('') + `</div></div>`;
const rowOf = k => howto.feel.rows.find(r => r.key === k);
function zoomSection(zoom) {
  let box;
  if (zoom.kind === 'hand') { const h = handZoomSvg(zoom); box = `<div class="zbox hand">${h.main}${h.inset ? `<div class="inset">${h.inset}</div>` : ''}</div>`; }
  else box = `<div class="zbox">${postureZoomSvg(zoom)}</div>`;
  const caps = `<div class="caps"><p class="ok">${I.check(16)}<span>${esc(zoom.caption.right)}</span></p><p class="no">${I.x(16)}<span>${esc(zoom.caption.wrong)}</span></p></div>`;
  const extra = zoom.kind === 'hand' ? `<p class="gripline">${esc(howto.handling.gripLine)}</p>${zoom.hand.note ? `<p class="sore">${esc(zoom.hand.note)}</p>` : ''}<p class="sore">${esc(howto.handling.handleChoice.sore)}</p>` : '';
  const row = zoom.feelRow ? rowOf(zoom.feelRow) : null;
  const link = row ? `<button class="feellink"><span class="grow"><span class="eyebrow">If you feel it in</span><b>${esc(row.where)}</b></span><span class="why">This is usually why</span>${I.chev(16, 'why')}</button>` : '';
  return `${chipRow(zoom.key)}<section class="hsec" role="region" aria-labelledby="zh-${zoom.key}"><div class="ztop"><button class="btn-back">${I.back(18)} Plate</button><h3 id="zh-${zoom.key}">${esc(zoom.heading)}</h3></div>${box}${caps}${extra}${link}</section>`;
}
function feelSection(open = null) {
  const F = howto.feel, row = open ? rowOf(open) : null;
  const avoid = row?.at.muscles ?? [], pain = row?.at.parts ?? [];
  const map = renderFeelMap({ primary: F.primary, secondary: F.secondary, avoid, pain, views: ['front', 'back'], id: `feel-${open ?? 'rest'}`, shimmer: true });
  // Mockup stand-in until engine/feelmap.mjs builds it (TalkBack, 2.5): name the marked pain parts in the map's label.
  const PAIN_NAMES = [[/^hand-/, 'wrists and hands'], [/^elbow-/, 'elbows'], [/^knee-/, 'knees'], [/^nape$/, 'back of the neck']];
  const painNames = [...new Set(pain.map(id => PAIN_NAMES.find(([re]) => re.test(id))?.[1] ?? id))];
  if (painNames.length && !/Marked:/.test(map.label)) {
    const label = `${map.label} Marked: ${painNames.join(' and ')}.`;
    map.html = map.html.replace(`aria-label="${map.label}"`, `aria-label="${esc(label)}"`); map.label = label;
    check(map.html.includes(`aria-label="${esc(label)}"`), `feel ${open}: map label names the marked parts`);
  }
  report[`feel${open ? '-' + open : ''}`] = { label: map.label, drawn: map.drawn, textOnly: map.textOnly };
  const rowsHtml = F.rows.slice(0, 3).map(r => {
    const on = r.key === open;
    const body = on ? `<div class="body"><span><b>Usually means:</b> ${esc(r.means)}</span><span><b>Fix:</b> ${esc(r.fix)}</span>`
      + (r.zoom ? `<button class="showme">Show me the ${esc((howto.zooms.find(z => z.key === r.zoom)?.chip ?? '').toLowerCase())}${I.chev(14)}</button>` : '')
      + (r.redFlag ? `<div class="redflag" role="note"><p>${I.alert(16)}<span>${esc(RED_FLAG.now)}</span></p><p>${I.alert(16)}<span>${esc(RED_FLAG.doctor)}</span></p></div>` : '') + `</div>` : '';
    return `<div class="row"><button aria-expanded="${on}">${on ? I.down(18) : I.chev(18)}<span>${esc(r.where)}</span></button>${body}</div>`;
  }).join('');
  return `<section class="hsec feel-sec" aria-labelledby="fh"><h3 id="fh" class="eyebrow">Where you should feel it</h3>${map.html}${renderFeelLegend({ avoid: avoid.length > 0 })}`
    + `<p class="feelline">${esc(F.feelLine)}</p><div class="rows"><div class="eyebrow" style="padding-top:12px">If you feel it in...</div>${rowsHtml}</div>`
    + `<button class="more">Show ${F.rows.length - 3} more</button></section>`;
}
function plateSection() {
  const { html } = sheetPage(plateSpec, { theme: 'x', selected: 'grip', id: 'pl' });
  const fig = html.match(/<figure class="plate">[\s\S]*?<\/figure>/)[0];
  const rep = renderPlate(plateSpec, { id: 'pl', selected: 'grip' }).report;
  report.plateLabelIssues = rep.issues;
  return `<p class="eyebrow">How to do it</p><h3 style="margin-bottom:12px">${esc(plateSpec.name)}</h3>${fig}<p class="gripline" style="font-size:var(--fs-title);font-weight:var(--fw-medium)">${esc(howto.plate.callouts[0].cue)}</p>${chipRow(null)}`;
}

/* ---------------------------------------------------------------- copy checks ------------------------------------ */
const words = s => s.trim().split(/\s+/).length, sentences = s => (s.match(/[.!?](\s|$)/g) || []).length;
for (const r of howto.feel.rows) { check(words(r.means) <= 30 && words(r.fix) <= 30 && sentences(r.fix) <= 2 && sentences(r.means) <= 2, `row ${r.key}: means ${words(r.means)} w, fix ${words(r.fix)} w / ${sentences(r.fix)} s`); check(!/doctor|physio|numb|swelling/i.test(r.fix), `row ${r.key}: fix has no red-flag wording`); }
for (const z of howto.zooms) { check(words(z.caption.right) <= 14 && words(z.caption.wrong) <= 14, `zoom ${z.key}: captions ${words(z.caption.right)}/${words(z.caption.wrong)} words (<= 14)`); }
check(howto.zooms.length <= 3 && howto.zooms[0].key === 'hand', 'Hand is the first chip; at most 3 zooms + "Where to feel it"');
check(!howto.feel.primary.some(p => howto.feel.watch.some(w => w.muscleId === p.muscleId)), 'no muscle is both main and watch');
for (const z of howto.zooms) if (z.feelRow) check(!!rowOf(z.feelRow), `zoom ${z.key}: feelRow ${z.feelRow} exists`);
for (const r of howto.feel.rows) if (r.zoom) check(howto.zooms.some(z => z.key === r.zoom), `row ${r.key}: zoom ${r.zoom} exists`);
for (const st of howto.setup) if (st.zoom) check(howto.zooms.some(z => z.key === st.zoom), `setup step zoom ${st.zoom} exists`);
const allSrc = [...howto.feel.rows.map(r => r.claim), ...howto.setup.map(s => s.claim), ...howto.posture.map(p => p.claim), howto.feel.claim].flatMap(c => c.sources);
check(allSrc.every(s => s in SOURCES), 'every cited source is in the registry');

/* ---------------------------------------------------------------- render ----------------------------------------- */
const parts = {
  plate: () => plateSection(),
  hand: () => zoomSection(howto.zooms.find(z => z.key === 'hand')),
  'seat-height': () => zoomSection(howto.zooms.find(z => z.key === 'seat-height')),
  blades: () => zoomSection(howto.zooms.find(z => z.key === 'blades')),
  feel: () => chipRow('feel') + feelSection(null),
  'feel-wrist': () => feelSection('wrist'),
  'feel-shoulders': () => feelSection('front-shoulders'),
};
const THEMES = [['silent-black', 'dark', 'dark'], ['paper', 'light', 'paper']];
const { chromium } = createRequire('/home/user/M-arc/package.json')('playwright');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const tmp = mkdtempSync(join(outDir, `.howto-${ID}-`));
const only = process.argv[2];
report.renders = {};
try {
  for (const [name, build] of Object.entries(parts)) {
    if (only && only !== name) continue;
    const inner = build();
    for (const [theme, scheme, tag] of THEMES) {
      const file = join(tmp, `${name}-${tag}.html`);
      writeFileSync(file, pageHtml(theme, inner).replace(/data-theme="x"/g, ''));
      const p = await browser.newPage({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2, colorScheme: scheme });
      await p.goto(pathToFileURL(file).href); await p.evaluate(() => document.fonts.ready);
      const m = await p.evaluate(() => {
        const wide = document.documentElement.scrollWidth;
        const small = [...document.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width && (r.height < 44 || r.width < 44); }).map(b => b.textContent.trim().slice(0, 30));
        const chips = document.querySelector('.chips'); const chipOver = chips ? chips.scrollWidth - chips.clientWidth : 0;
        // crop labels: measured text boxes against their own background pill and the panel edge
        // header notes (Right / Wrong callouts) must stay inside their own half of the 358 px box
        const labs = [...document.querySelectorAll('.h-note, .h-cam')].map(t => { const b = t.getBBox(), half = t.getAttribute('x') > 179 ? 358 : (t.classList.contains('h-cam') ? 358 : 171); return { t: t.textContent, fits: b.x + b.width <= half - 4, right: +(b.x + b.width).toFixed(1), limit: half - 4 }; });
        // value labels on the hand drawings (main pair and inset): no VISIBLE outline of the drawing it sits on may run
        // through the label's box. The hand is drawn in layers (far fingers, skin, handle, thumb); each layer strokes all
        // its parts, then fills them, so a part's edge shows only where no fill of its own or a later layer covers it.
        // Outlines are <use> of <defs> paths: resolved to the path, stroke tested at the drawn width (1.5 px) on a dense
        // grid over the text box grown by 1 px.
        const valHits = [...document.querySelectorAll('.hand-svg .h-val')].map(t => {
          const own = t.ownerSVGElement, mine = e => e.ownerSVGElement === own;
          const paths = sel => [...own.querySelectorAll(sel)].filter(mine).map(u => own.querySelector(u.getAttribute('href'))).filter(Boolean);
          const layers = [paths('.h-far .u-stroke use'), paths('.h-skin .u-stroke use'), [...own.querySelectorAll('.h-eq')].filter(mine), paths('.h-thumb .u-stroke use')];
          const bb = t.getBBox(), pts = [];
          for (let i = 0; i <= 12; i++) for (let j = 0; j <= 6; j++) pts.push(new DOMPoint(bb.x - 1 + (bb.width + 2) * i / 12, bb.y + 1 + (bb.height - 1) * j / 6));
          const hits = new Set();
          layers.forEach((L, k) => L.forEach(g => {
            const old = g.style.strokeWidth; g.style.strokeWidth = '1.5px';
            for (const q of pts) if (g.isPointInStroke(q) && !layers.slice(k).flat().some(o => o.isPointInFill(q))) { hits.add(g.id || g.getAttribute('class')); break; }
            g.style.strokeWidth = old;
          }));
          return { t: t.textContent, shapes: layers.flat().length, hit: hits.size > 0, hits: [...hits] };
        });
        return { wide, small, chipOver, labs, valHits };
      });
      report.renders[`${name}-${tag}`] = m;
      await p.screenshot({ path: join(outDir, `${ID}-howto-${name}-${tag}.png`), fullPage: true });
      await p.close();
    }
  }
} finally { await browser.close(); rmSync(tmp, { recursive: true, force: true }); }
for (const [k, m] of Object.entries(report.renders)) {
  check(m.wide <= 390, `${k}: no horizontal scroll (${m.wide})`);
  check(!m.small.length, `${k}: every button at least 44 px${m.small.length ? ' (' + m.small.join(', ') + ')' : ''}`);
  check(m.chipOver <= 0, `${k}: chip row fits (${m.chipOver} px over)`);
  for (const l of m.labs) check(l.fits, `${k}: note "${l.t}" ends at ${l.right} (<= ${l.limit})`);
  for (const v of m.valHits ?? []) check(v.shapes > 0 && !v.hit, `${k}: hand label "${v.t}" clear of every outline (${v.shapes} outlines tested${v.hit ? '; crossed by ' + v.hits.join(', ') : ''})`);
}
if (report.hand) { check(report.hand.ok, `hand lever: right ${report.hand.right.leverMm} mm, wrong ${report.hand.wrong.leverMm} mm`); }
console.log(JSON.stringify(report, null, 1));
