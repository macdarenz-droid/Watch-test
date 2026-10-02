// Render check for exercises/leg_press.howto.mjs:
//   node exercises/leg_press.howto-render.mjs [part]
// Writes out/leg_press-howto-<part>-<theme>.png (Silent Black and Paper, 390 px wide, device scale 2):
//   plate        the plate (unchanged callouts) and the chip row
//   back-on-pad, foot   S3: posture zooms, crops of the plate (same camera), one callout each
//   hand         S2: hand zoom (Right: light full grip on the side handle; Wrong: pushing on the knee), seen from the side
//   feel         S4: feel map at rest + legend + feel line + first 3 rows + "Show 5 more"
//   feel-wrists  S6: the wrists row open (forearms dashed, back of the hands tinted, red-flag block)
//   feel-lowerback S6: the lower back row open (lower back dashed, "should not take over")
// Prints a JSON report: hand lever checks, crop windows and guide measurements, copy lint, tap targets, overflow.
// Built on the squat render script so the sheets match. Uses the engine read-only; the two hand-zoom changes the engine
// can't express (no load line on a hand that only holds; a knee instead of a handle) are string edits on its SVG here.
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderPlate, PLATE_CSS, landmarksOf, sheetPage, legPressFace } from '../engine/index.mjs';
import { renderHandPair, HAND_CSS } from '../engine/hand.mjs';
import { renderFeelMap, renderFeelLegend, FEEL_CSS } from '../engine/feelmap.mjs';
import { allThemesCss } from '../engine/themes.mjs';
import howto, { stills, SOURCES, RED_FLAG, SLED } from './leg_press.howto.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), outDir = join(root, 'out');
mkdirSync(outDir, { recursive: true });
const ID = 'leg_press';
const FONT = `data:font/woff2;base64,${readFileSync(join(root, 'engine', 'inter-latin-wght-normal.woff2')).toString('base64')}`;
const TOKENS = readFileSync(join(root, 'engine', 'tokens.css'), 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const f = v => +(+v).toFixed(2);
const plateSpec = howto.plate;
const H = 1.75, REF = renderPlate(plateSpec, { id: 'cam' }).report.camera;   // the plate's own fitted camera
const P = w => [REF.x0 + w[2] * REF.pxPerM, REF.y0 - w[1] * REF.pxPerM];
const report = { hand: null, crops: {}, checks: [] };
const check = (ok, msg) => { report.checks.push(`${ok ? 'PASS' : 'FAIL'} ${msg}`); };
const sub = (a, b) => a.map((v, i) => v - b[i]), add = (a, b) => a.map((v, i) => v + b[i]), mul = (a, k) => a.map(v => v * k);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0), nrm = a => mul(a, 1 / Math.hypot(...a));

/* ---------------------------------------------------------------- icons ------------------------------------------ */
const ic = (d, s, cls = '') => `<svg class="${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${f(1.5 * 24 / s)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  check: (s, c) => ic('<path d="M5 12l4 4L19 7"/>', s, c), x: (s, c) => ic('<path d="M6 6l12 12M18 6L6 18"/>', s, c),
  back: s => ic('<path d="M15 5l-7 7 7 7"/>', s), chev: (s, c) => ic('<path d="M9 5l7 7-7 7"/>', s, c),
  down: (s, c) => ic('<path d="M5 9l7 7 7-7"/>', s, c), alert: (s, c) => ic('<path d="M12 8v5M12 16.5v.5"/><circle cx="12" cy="12" r="9"/>', s, c),
};
const iconCheck = (x, y, sz, cls) => `<path class="${cls} ok" transform="translate(${f(x)} ${f(y)}) scale(${f(sz / 24)})" d="M5 12l4 4L19 7"/>`;
const iconCross = (x, y, sz, cls) => `<path class="${cls} no" transform="translate(${f(x)} ${f(y)}) scale(${f(sz / 24)})" d="M6 6l12 12M18 6L6 18"/>`;

/* ---------------------------------------------------------------- posture crops ---------------------------------- */
// A still of the plate spec: one pose, no ghosts, trace, measure, callouts or mistake layer, on the plate's own camera.
// The sled is the plate's own sled item; a still with a fixed travel places it there (the spec reads the travel back
// from mid-sole, which is wrong for feet placed low), and the thin "start footplate" outline is left out.
const sledFn = plateSpec.equipment.find(e => typeof e === 'function');
function stillSpec({ pose, travel }) {
  const equipment = plateSpec.equipment.map(e => typeof e !== 'function' ? e
    : (lm, ctx) => travel == null ? sledFn(lm, ctx).filter(x => x.type === 'legPress45') : [{ ...SLED, travel, type: 'legPress45', part: 'sled' }]);
  const { trace, measure, mistake, datum, checks, ...rest } = plateSpec;
  return { ...rest, camera: { pxPerM: REF.pxPerM, x0: REF.x0, y0: REF.y0 }, poses: { start: pose, end: pose }, equipment, ghosts: { count: 0 }, callouts: [], checks: [], startParts: [] };
}
const lmOf = still => landmarksOf(still.pose, H);
const stillOf = side => (side === 'start' || side === 'end') ? stills[side] : stills[side.still];
const refPt = (ref, still) => { const [x, y] = P(lmOf(still)[ref.landmark]); return [x + (ref.dx ?? 0), y + (ref.dy ?? 0)]; };
const LM_END = landmarksOf(plateSpec.poses.end, H);
const PAD_U = nrm(sub(LM_END.backUpper, LM_END.buttock));          // back-pad surface direction (world, y z used)
const onPad = p => add(LM_END.buttock, mul(PAD_U, dot(sub(p, LM_END.buttock), PAD_U)));   // foot of the perpendicular on the pad face
const padGapCm = p => +(Math.hypot(...sub(p, onPad(p)).slice(1)) * 100).toFixed(1);
const face = still => legPressFace(SLED, still.travel);
const onFace = (p, fc) => sub(p, mul(fc.normal, dot(sub(p, fc.at), fc.normal)));
const faceGapCm = (p, fc) => +(dot(sub(p, fc.at), fc.normal) * 100).toFixed(1);
const pt = p => `${f(p[0])} ${f(p[1])}`;

// Guides per crop, in plate px, plus the callout anchor. Colour class: accent (right) or mistake (wrong).
function guides(kind, still, role) {
  const lm = lmOf(still), cls = role === 'right' ? 'ok' : 'no';
  if (kind === 'pad-contact') {   // right: the lower back and tailbone lying on the pad, a contact line along the pad face
    const a = P(onPad(lm.backMid)), b = P(onPad(lm.buttock)), n = nrm(sub(a, b)), off = [n[1] * 2.5, -n[0] * 2.5];   // 2.5 px toward the pad
    const A = add(a, off), B = add(b, off);
    const svg = `<path class="hz-g ${cls} wide" d="M${pt(A)}L${pt(B)}"/>` + [A, B].map(p => `<circle class="hz-g dot ${cls}" cx="${f(p[0])}" cy="${f(p[1])}" r="2.4"/>`).join('');
    return { svg, anchor: mul(add(A, B), 0.5), sacrumGapCm: padGapCm(lm.sacrum), buttockGapCm: padGapCm(lm.buttock) };
  }
  if (kind === 'pad-gap') {       // wrong: the gap between the pad face and the rolled-up lower back, shaded, with its size
    const body = [lm.backMid, lm.lumbar, lm.sacrum, lm.buttock].map(P), pad = [lm.buttock, lm.backMid].map(p => P(onPad(p)));
    const svg = `<path class="hz-gap" d="M${body.map(pt).join('L')}L${pad.map(pt).join('L')}Z"/>`
      + `<path class="hz-g ref dash" d="M${pt(P(onPad(lm.backUpper)))}L${pt(P(onPad(add(lm.buttock, mul(PAD_U, -0.06)))))}"/>`
      + `<path class="hz-g ${cls}" d="M${pt(P(lm.sacrum))}L${pt(P(onPad(lm.sacrum)))}"/>`;
    return { svg, anchor: mul(add(P(lm.sacrum), P(onPad(lm.sacrum))), 0.5), sacrumGapCm: padGapCm(lm.sacrum), buttockGapCm: padGapCm(lm.buttock) };
  }
  // No mid-plate tick: an unlabelled grey dash could not be read (review 2026-09-30). Both crops share one window, so
  // the Wrong foot already sits visibly lower, and the heel gap carries the fault.
  if (kind === 'sole-line') {     // right: whole foot on the plate, the push running from the heel to the ball
    const fc = face(still), h = P(onFace(lm['heel.r'], fc)), b = P(onFace(lm['ball.r'], fc)), n = nrm(sub(b, h)), off = [-n[1] * -2.5, n[0] * -2.5];
    const svg = `<path class="hz-g ${cls} wide" d="M${pt(add(h, off))}L${pt(add(b, off))}"/>`
      + [h, b].map(p => `<circle class="hz-g dot ${cls}" cx="${f(p[0] + off[0])}" cy="${f(p[1] + off[1])}" r="2.4"/>`).join('');
    return { svg, anchor: mul(add(h, b), 0.5), heelToFaceCm: faceGapCm(lm['heel.r'], fc), ballToFaceCm: faceGapCm(lm['ball.r'], fc) };
  }
  if (kind === 'heel-gap') {      // wrong: the heel off the plate (shaded gap, gap line with end ticks), all the push on the ball
    const fc = face(still), h = P(lm['heel.r']), h0 = P(onFace(lm['heel.r'], fc)), b = P(onFace(lm['ball.r'], fc));
    const d = nrm(sub(h, h0)), t = [-d[1] * 3, d[0] * 3];
    const svg = `<path class="hz-gap" d="M${pt(h)}L${pt(h0)}L${pt(b)}Z"/>`
      + `<path class="hz-g ${cls}" d="M${pt(h0)}L${pt(h)}M${pt(sub(h0, t))}L${pt(add(h0, t))}M${pt(sub(h, t))}L${pt(add(h, t))}"/>`
      + `<circle class="hz-g dot ${cls}" cx="${f(b[0])}" cy="${f(b[1])}" r="2.6"/>`;
    return { svg, anchor: mul(add(h, h0), 0.5), heelToFaceCm: faceGapCm(lm['heel.r'], fc), ballToFaceCm: faceGapCm(lm['ball.r'], fc),
      soleBelowMiddleCm: +(dot(sub(onFace(lm['ball.r'], fc), add(fc.at, mul(fc.up, 0.105))), fc.up) * 100).toFixed(1) };
  }
  throw new Error(`unknown guide ${kind}`);
}

function cropPanel(zoom, side, { x, y, S, uid }) {
  const still = stillOf(zoom[side]);
  const plate = renderPlate(stillSpec(still), { id: `${uid}` });
  const inner = plate.svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<rect width="358" height="358" fill="url\([^)]*\)"\/>/, '');
  const crop = zoom.crop, c = refPt(crop.center, stills[zoom.right]);   // the right pose sets the window for both
  const s = crop.sizePx, vx = c[0] - s / 2, vy = c[1] - s / 2, k = S / s;
  const co = zoom.callouts[side], G = guides(co.guide, still, side);
  const inside = ([px, py]) => px > vx + 6 && px < vx + s - 6 && py > vy + 6 && py < vy + s - 6;
  const { svg, anchor, ...meas } = G;
  report.crops[`${zoom.key}.${side}`] = { still: zoom[side].still ?? zoom[side], window: [f(vx), f(vy), s, s], scale: f(k), markInside: inside(anchor), issues: plate.report.issues?.length ?? 0, ...meas };
  const clip = `${uid}-clip`;
  return `<defs><clipPath id="${clip}"><rect x="${f(x)}" y="${f(y)}" width="${S}" height="${S}" rx="10"/></clipPath></defs>`
    + `<g clip-path="url(#${clip})"><rect class="hz-crop-bg" x="${f(x)}" y="${f(y)}" width="${S}" height="${S}"/>`
    + `<svg x="${f(x)}" y="${f(y)}" width="${S}" height="${S}" viewBox="${f(vx)} ${f(vy)} ${s} ${s}" overflow="hidden"><g class="plate hz-crop">${inner}${svg}</g></svg></g>`
    + `<rect class="hz-frame" x="${f(x)}" y="${f(y)}" width="${S}" height="${S}" rx="10"/>`;
}
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
const merge = (a, b) => ({ ...a, ...b, wrist: { ...a.wrist, ...(b.wrist ?? {}) }, fingers: { ...a.fingers, ...(b.fingers ?? {}) }, handle: { ...a.handle, ...(b.handle ?? {}) }, load: { ...a.load, ...(b.load ?? {}) } });
// Pull one panel group out of the pair SVG, edit it, put it back.
function editPanel(svg, which, fn) {
  const open = `<g class="h-panel ${which}">`, i = svg.indexOf(open);
  let depth = 0, j = i;
  for (const m of svg.slice(i).matchAll(/<g\b|<\/g>/g)) { depth += m[0] === '</g>' ? -1 : 1; if (depth === 0) { j = i + m.index + 4; break; } }
  return svg.slice(0, i) + fn(svg.slice(i, j)) + svg.slice(j);
}
// The knee the wrong hand presses on, where the engine drew a handle section. The thigh is drawn as ONE limb: it comes
// in from the wrist side of the panel and ends in a rounded knee (the engine's contact circle, same centre and radius)
// right under the palm, so it reads as "hand pushing down on the knee". No shin: a second limb below read as an
// unexplained bracket. Recessive line of the far fingers, clipped to the wrong panel, labelled KNEE under the cap.
function kneeFor(panel, clipRect) {
  const m = panel.match(/<circle class="h-eq" cx="([\d.-]+)" cy="([\d.-]+)" r="([\d.-]+)"\/>/);
  const [cx, cy, r] = m.slice(1).map(Number);
  const wx = +panel.match(/<circle class="h-joint wrist" cx="([\d.-]+)"/)[1];
  const sg = wx < cx ? -1 : 1;                       // the thigh runs from the knee toward the wrist side
  const edge = sg < 0 ? clipRect[0] - 2 : clipRect[0] + clipRect[2] + 2;
  const top = cy - r, bot = cy + r, sw = sg < 0 ? 1 : 0;
  // top of the thigh, round the knee cap, underside of the thigh: one continuous outline
  const d = `M${f(edge)} ${f(top)}L${f(cx)} ${f(top)}A${f(r)} ${f(r)} 0 0 ${sw} ${f(cx)} ${f(bot)}L${f(edge)} ${f(bot)}`;
  const cap = `M${f(cx - sg * r * 0.15)} ${f(cy - r * 0.62)}A${f(r * 0.62)} ${f(r * 0.62)} 0 0 ${sw} ${f(cx - sg * r * 0.15)} ${f(cy + r * 0.62)}`;   // kneecap
  const ly = Math.min(bot + 18, clipRect[1] + clipRect[3] - 8);
  const label = `<text class="h-note lp-knee-t" x="${f(cx)}" y="${f(ly)}" text-anchor="middle">KNEE</text>`;
  return { svg: `<g clip-path="url(#lp-knee-clip)"><path class="lp-leg-fill" d="${d}Z"/><path class="lp-leg" d="${d}"/><path class="lp-leg thin" d="${cap}"/>${label}</g>`,
    clip: `<clipPath id="lp-knee-clip"><rect x="${clipRect[0]}" y="${clipRect[1]}" width="${clipRect[2]}" height="${clipRect[3]}"/></clipPath>`, knee: { cx: f(cx), cy: f(cy), r: f(r), thighToward: sg < 0 ? 'left' : 'right' } };
}
const LEVER_LIFT = 10;   // lever label baseline, px above the wrist pivot
function handZoomSvg(zoom) {
  const hs = howto.handling, fault = zoom.hand.wrong[0], wrongPose = merge(zoom.hand.right, fault.pose);
  const pair = renderHandPair({ camera: zoom.hand.camera, loadAxis: 'along-forearm', markers: fault.markers, right: zoom.hand.right, wrong: wrongPose,
    rightNote: zoom.hand.notes.right, wrongNote: zoom.hand.notes.wrong, alt: zoom.alt, uid: 'hz' });
  report.hand = pair.report;
  let svg = pair.svg;
  // Right: the hand only holds. Remove the load line, its arrowhead, the contact dot and the wrist tick.
  if (zoom.hand.rightLoad === false) svg = editPanel(svg, 'right', g => g.replace(/<path class="h-(load|load-head|tick)"[^>]*\/>|<circle class="h-contact"[^>]*\/>/g, ''));
  // Wrong: a knee, not a handle. Drop the handle section and the skin the engine fills round a gripped handle.
  let knee = null;
  if (zoom.hand.surface === 'knee') {
    svg = svg.replace(/<path id="hz-w-(ring|gap0|gap1|web)" d="[^"]*"\/>/g, (s, n) => `<path id="hz-w-${n}" d=""/>`);
    const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).slice(1).map(Number), pw = (vb[0] - 16) / 2;
    svg = editPanel(svg, 'wrong', g => {
      knee = kneeFor(g, [f(pw + 16), 66, f(pw), f(vb[1] - 66)]);
      return g.replace(/<circle class="h-eq"[^>]*\/>|<circle class="h-eq-core"[^>]*\/>|<path class="h-eq-core"[^>]*\/>/g, '')
        .replace('<g class="h-panel wrong">', `<g class="h-panel wrong">${knee.svg}`);
    });
    svg = svg.replace('<defs>', `<defs>${knee.clip}`);
    // The bend value: the engine puts it just outside the arc, which here lands on the thigh's top line and the thumb.
    // Move it under the arc, inside the thigh, right of the forearm axis.
    const wj = svg.split('<g class="h-panel wrong">')[1].match(/<circle class="h-joint wrist" cx="([\d.-]+)" cy="([\d.-]+)"/).slice(1).map(Number);
    svg = svg.replace(/<text class="h-val m" x="[\d.-]+" y="[\d.-]+" text-anchor="\w+">(\d+°)<\/text>/, (m0, v) =>
      `<text class="h-val m" x="${f(wj[0] + 5)}" y="${f(knee.knee.cy - knee.knee.r + 24)}" text-anchor="start">${v}</text>`);
    // The lever value: the engine puts it at the end of the dimension line, where the back of the wrong hand runs
    // through it. Move it right of the load arrow, above the back of the hand (the probe in the render loop checks it
    // clears every outline and guide).
    const wrongG = svg.split('<g class="h-panel wrong">')[1];
    const ax = +wrongG.match(/<path class="h-load m" d="M([\d.-]+) /)[1];
    svg = svg.replace(/<text class="h-val m" x="[\d.-]+" y="[\d.-]+" text-anchor="\w+">([\d.]+ cm)<\/text>/, (m0, v) =>
      `<text class="h-val m" x="${f(ax + 5)}" y="${f(wj[1] - LEVER_LIFT)}" text-anchor="start">${v}</text>`);
    report.hand.knee = knee.knee;
  }
  return { main: svg };
}

/* ---------------------------------------------------------------- page chrome ------------------------------------ */
const ZCSS = `
.hz-svg .hz-crop-bg { fill: var(--surface-2); }
.hz-svg .hz-frame { fill: none; stroke: var(--border-strong); stroke-width: 1; }
.hz-svg .h-note.ok { fill: var(--accent-text); }
.hz-crop path, .hz-crop use, .hz-crop circle, .hz-crop rect, .hz-crop line { vector-effect: non-scaling-stroke; }
.hz-crop .hz-g { fill: none; stroke-width: 1.5; stroke-linecap: round; }
.hz-crop .hz-g.dash { stroke-dasharray: 4 3; }
.hz-crop .hz-g.wide { stroke-width: 2.5; }
.hz-crop .hz-gap { fill: color-mix(in srgb, var(--mistake) 22%, transparent); stroke: none; }
.hand-svg .lp-leg { fill: none; stroke: var(--text-3); stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; }
.hand-svg .lp-leg.thin { stroke-width: 1; }
.hand-svg .lp-leg-fill { fill: var(--surface-2); stroke: none; }
.hand-svg .lp-knee-t { fill: var(--text-3); }
.hand-svg .h-val { paint-order: stroke; stroke: var(--surface-2); stroke-width: 3px; stroke-linejoin: round; }
.hand-svg .h-panel.right .h-thumb .u-stroke use { stroke: var(--text); }
.hz-crop .hz-g.ok { stroke: var(--accent); } .hz-crop .hz-g.no { stroke: var(--mistake); }
.hz-crop .hz-g.ref { stroke: var(--text-2); } .hz-crop circle.hz-g.ref { fill: var(--text-2); stroke: none; }
.hz-crop .hz-g.dot { stroke: none; } .hz-crop .hz-g.dot.ok { fill: var(--accent); } .hz-crop .hz-g.dot.no { fill: var(--mistake); }
.hsec { margin-top: var(--sp-4); }
.chips { display: flex; gap: 6px; margin-top: 8px; }
.chip { flex: none; display: inline-flex; align-items: center; min-height: 44px; padding: 0 11px; border-radius: var(--radius-pill); border: 1px solid var(--border); color: var(--text-2); font-size: var(--fs-small); font-weight: var(--fw-medium); white-space: nowrap; }
.chip[aria-pressed="true"] { background: var(--accent-soft); border-color: transparent; color: var(--accent-text); }
.ztop { display: flex; align-items: center; gap: 4px; margin: 0 0 8px -12px; }
.ztop h3 { font-size: var(--fs-body); font-weight: var(--fw-semibold); margin: 0; }
.zbox { border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); background: var(--surface-2); overflow: hidden; padding: 10px 10px 8px; }
.zbox .hand-svg { display: block; width: 100%; height: auto; }
.zbox.hand { padding: 0; }
.opt { display: flex; gap: 12px; align-items: center; border-top: 1px solid var(--border-subtle); padding: 8px 12px 8px 8px; }
.opt-fig { flex: none; width: 96px; } .opt-fig .hand-svg { display: block; width: 96px; height: auto; }
.opt-txt { display: grid; gap: 6px; } .opt-txt p { margin: 0; display: flex; gap: 6px; font-size: var(--fs-small); line-height: var(--lh-small); color: var(--text-2); }
.opt-txt .ok { color: var(--accent-text); flex: none; margin-top: 2px; }
.caps { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 10px; }
.caps p { margin: 0; display: flex; gap: 6px; font-size: var(--fs-meta); line-height: var(--lh-meta); color: var(--text-2); }
.caps svg { flex: none; margin-top: 1px; } .caps .ok { color: var(--accent-text); } .caps .no { color: var(--mistake); }
.gripline { margin: 12px 0 0; font-size: var(--fs-body); line-height: var(--lh-body); color: var(--text); }
.feellink { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 44px; margin-top: 10px; padding: 6px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-align: left; }
.feellink .grow { display: grid; } .feellink .eyebrow { font-size: var(--fs-cap); } .feellink b { font-weight: var(--fw-medium); font-size: var(--fs-small); color: var(--text); }
.feellink .why { font-size: var(--fs-meta); color: var(--accent-text); white-space: nowrap; }
.feel-sec h3 { margin: 0 0 10px; }
.feelline { margin: 12px 0 0; font-size: var(--fs-body); line-height: var(--lh-body); }
.textonly { margin: 6px 0 0; font-size: var(--fs-small); line-height: var(--lh-small); color: var(--text-2); }
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
  if (zoom.kind === 'hand') { const h = handZoomSvg(zoom); box = `<div class="zbox hand">${h.main}</div>`; }
  else box = `<div class="zbox">${postureZoomSvg(zoom)}</div>`;
  const caps = `<div class="caps"><p class="ok">${I.check(16)}<span>${esc(zoom.caption.right)}</span></p><p class="no">${I.x(16)}<span>${esc(zoom.caption.wrong)}</span></p></div>`;
  const extra = zoom.kind === 'hand' ? `<p class="gripline">${esc(howto.handling.gripLine)}</p>` : '';
  const row = zoom.feelRow ? rowOf(zoom.feelRow) : null;
  const link = row ? `<button class="feellink"><span class="grow"><span class="eyebrow">If you feel it in</span><b>${esc(row.where)}</b></span><span class="why">This is usually why</span>${I.chev(16, 'why')}</button>` : '';
  return `${chipRow(zoom.key)}<section class="hsec" role="region" aria-labelledby="zh-${zoom.key}"><div class="ztop"><button class="btn-back">${I.back(18)} Plate</button><h3 id="zh-${zoom.key}">${esc(zoom.heading)}</h3></div>${box}${caps}${extra}${link}</section>`;
}
function feelSection(open = null) {
  const F = howto.feel, row = open ? rowOf(open) : null;
  const avoid = row?.at.muscles ?? [], pain = row?.at.parts ?? [];
  const map = renderFeelMap({ primary: F.primary, secondary: F.secondary, avoid, pain, views: ['front', 'back'], id: `feel-${open ?? 'rest'}`, shimmer: true });
  report[`feel${open ? '-' + open : ''}`] = { label: map.label, drawn: map.drawn, textOnly: map.textOnly };
  const shown = F.rows.slice(0, 3), openRow = row && !shown.includes(row) ? [row] : [];
  const rowsHtml = [...shown, ...openRow].map(r => {
    const on = r.key === open;
    const body = on ? `<div class="body"><span><b>Usually means:</b> ${esc(r.means)}</span><span><b>Fix:</b> ${esc(r.fix)}</span>`
      + (r.zoom ? `<button class="showme">Show me the ${esc((howto.zooms.find(z => z.key === r.zoom)?.chip ?? '').toLowerCase())}${I.chev(14)}</button>` : '')
      + (r.redFlag ? `<div class="redflag" role="note"><p>${I.alert(16)}<span>${esc(RED_FLAG.now)}</span></p><p>${I.alert(16)}<span>${esc(RED_FLAG.doctor)}</span></p></div>` : '') + `</div>` : '';
    return `<div class="row"><button aria-expanded="${on}">${on ? I.down(18) : I.chev(18)}<span>${esc(r.where)}</span></button>${body}</div>`;
  }).join('');
  const txt = (F.textOnly ?? []).map(m => m.plain).join(' ');
  return `<section class="hsec feel-sec" aria-labelledby="fh"><h3 id="fh" class="eyebrow">Where you should feel it</h3>${map.html}${renderFeelLegend({ avoid: avoid.length > 0 })}`
    + `<p class="feelline">${esc(F.feelLine)}</p>${txt ? `<p class="textonly">${esc(txt)}</p>` : ''}<div class="rows"><div class="eyebrow" style="padding-top:12px">If you feel it in...</div>${rowsHtml}</div>`
    + `<button class="more">Show ${F.rows.length - 3 - openRow.length} more</button></section>`;
}
function plateSection() {
  const { html } = sheetPage(plateSpec, { theme: 'x', id: 'pl' });
  const fig = html.match(/<figure class="plate">[\s\S]*?<\/figure>/)[0];
  report.plateLabelIssues = renderPlate(plateSpec, { id: 'pl' }).report.issues;
  return `<p class="eyebrow">How to do it</p><h3 style="margin-bottom:12px">${esc(plateSpec.name)}</h3>${fig}<p class="gripline" style="font-size:var(--fs-title);font-weight:var(--fw-medium)">${esc(plateSpec.callouts[0].cue)}</p>${chipRow(null)}`;
}

/* ---------------------------------------------------------------- copy checks (6.2 subset) ----------------------- */
const words = s => s.trim().split(/\s+/).length, sentences = s => (s.match(/[.!?](\s|$)/g) || []).length;
const sentLens = s => s.split(/(?<=[.!?])\s+/).map(words);
const BANNED = /—|–|!|;|%|\bEMG\b|\bengage|\bactivat|\boptimal|\bensure\b|make sure|\bsimply\b|\bcrucial\b|\bessential\b|focus on|proper form|\bpinky\b|trapezius|erector|\([A-Z][a-z]+ (et al\.|\d{4})/i;
const RED = /get it checked|see a doctor|\bGP\b|physio|numb|tingl|swell/i;
const H0 = howto;
const userCopy = [
  ['gripLine', H0.handling.gripLine], ['width', H0.handling.width.text], ['limitText', H0.handling.wrist.limitText],
  ['feelLine', H0.feel.feelLine], ['setupLine', H0.copy.setupLine], ['mistakeLine', H0.copy.mistakeLine],
  ...H0.setup.map((s, i) => [`setup ${i + 1}`, s.text]), ...H0.posture.map(p => [`posture ${p.key}`, p.detail]),
  ...H0.feel.rows.flatMap(r => [[`row ${r.key} means`, r.means], [`row ${r.key} fix`, r.fix], [`row ${r.key} where`, r.where]]),
  ...H0.zooms.flatMap(z => [[`caption ${z.key} right`, z.caption.right], [`caption ${z.key} wrong`, z.caption.wrong]]),
];
for (const [k, s] of userCopy) {
  check(!BANNED.test(s), `lint ${k}: no banned pattern`);
  check(Math.max(...sentLens(s)) <= 25, `lint ${k}: longest sentence ${Math.max(...sentLens(s))} words (<= 25)`);
}
check(words(H0.feel.feelLine) <= 40 && sentences(H0.feel.feelLine) <= 2 && H0.feel.feelLine.startsWith('You should feel this'), `feel line ${words(H0.feel.feelLine)} words, starts "You should feel this"`);
for (const k of ['gripLine']) check(words(H0.handling[k]) <= 45 && sentences(H0.handling[k]) <= 3, `${k} ${words(H0.handling[k])} words`);
for (const k of ['setupLine', 'mistakeLine']) check(words(H0.copy[k]) <= 45 && sentences(H0.copy[k]) <= 3, `${k} ${words(H0.copy[k])} words`);
for (const r of H0.feel.rows) {
  check(words(r.means) <= 30 && words(r.fix) <= 30 && sentences(r.fix) <= 2 && sentences(r.means) <= 2, `row ${r.key}: means ${words(r.means)} w, fix ${words(r.fix)} w / ${sentences(r.fix)} s`);
  check(!RED.test(r.fix) && !RED.test(r.means), `row ${r.key}: no own red-flag wording`);
  check(/^[A-Z][a-z]+/.test(r.fix) && !/^(Your|The|A|If|You)\b/.test(r.fix), `row ${r.key}: fix starts with a verb ("${r.fix.split(' ')[0]}")`);
}
for (const z of H0.zooms) check(words(z.caption.right) <= 14 && words(z.caption.wrong) <= 14, `zoom ${z.key}: captions ${words(z.caption.right)}/${words(z.caption.wrong)} words (<= 14)`);
for (const p of H0.posture) check(words(p.label) <= 3, `posture ${p.key}: label ${words(p.label)} words`);
for (const z of H0.zooms) if (z.callouts) for (const s of ['right', 'wrong']) check(words(z.callouts[s].text) <= 4, `zoom ${z.key}: ${s} callout "${z.callouts[s].text}"`);
check(!H0.zooms.some(z => H0.feel.rows.some(r => r.where === z.chip)), 'no chip shares its name with a feel row');
check(H0.zooms.length <= 3, 'at most 3 zooms + "Where to feel it"');
check(H0.handling.archetype === 'balance' && H0.zooms[0].key !== 'hand', 'balance archetype: the load goes through the feet, so Hand is not first (2.1)');
for (const z of H0.zooms) check(z.chip.split(' ').length <= 2, `chip "${z.chip}" 1-2 words`);
const ids = a => a.map(m => m.muscleId);
check(!ids(H0.feel.primary).some(p => ids(H0.feel.watch).includes(p)), 'no muscle is both main and watch');
check(![...ids(H0.feel.primary), ...ids(H0.feel.secondary), ...ids(H0.feel.watch)].some(m => ['core', 'brachialis', 'rotator_cuff'].includes(m)), 'no map role uses core, brachialis or rotator_cuff (C2)');
for (const z of H0.zooms) if (z.feelRow) check(!!rowOf(z.feelRow), `zoom ${z.key}: feelRow ${z.feelRow} exists`);
for (const r of H0.feel.rows) if (r.zoom) check(H0.zooms.some(z => z.key === r.zoom), `row ${r.key}: zoom ${r.zoom} exists`);
for (const st of [...H0.setup, ...H0.posture]) if (st.zoom) check(H0.zooms.some(z => z.key === st.zoom), `step/checkpoint zoom ${st.zoom} exists`);
const claims = [...H0.feel.rows.map(r => r.claim), ...H0.setup.map(s => s.claim), ...H0.posture.map(p => p.claim), H0.feel.claim,
  H0.handling.thumb.claim, H0.handling.wrist.claim, H0.handling.width.claim, RED_FLAG.claim];
check(claims.every(c => c && c.sources.length > 0), 'every claim has at least one source (C8)');
check(claims.flatMap(c => c.sources).every(s => s in SOURCES), 'every cited source is in the registry');
check(claims.every(c => c.sources.some(s => SOURCES[s].access !== 'unreachable')), 'no claim rests only on an unreachable source');
check(H0.handling.pose.thumb === H0.handling.thumb.mode, 'right hand thumb = HandlingSpec.thumb.mode (C5)');
const ext = H0.handling.pose.wrist.ext; check(ext >= H0.handling.wrist.ext[0] && ext <= H0.handling.wrist.ext[1], `right wrist ${ext} deg inside ${H0.handling.wrist.ext.join('-')} (C5)`);
const wext = H0.handling.faults[0].pose.wrist.ext; check(wext >= H0.handling.wrist.ext[1] + 15, `wrong wrist ${wext} deg at least 15 deg past the range (fault margin)`);

/* ---------------------------------------------------------------- render ----------------------------------------- */
const zoomOf = k => howto.zooms.find(z => z.key === k);
const parts = {
  plate: () => plateSection(),
  hand: () => zoomSection(zoomOf('hand')),
  'back-on-pad': () => zoomSection(zoomOf('back-on-pad')),
  foot: () => zoomSection(zoomOf('foot')),
  feel: () => chipRow('feel') + feelSection(null),
  'feel-wrists': () => feelSection('wrists'),
  'feel-lowerback': () => feelSection('lower-back'),
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
        const labs = [...document.querySelectorAll('.hz-svg .h-note, .hz-svg .h-cam')].map(t => { const b = t.getBBox(), half = +t.getAttribute('x') > 179 ? 358 : 171; return { t: t.textContent, fits: b.x + b.width <= half - 4, right: +(b.x + b.width).toFixed(1), limit: half - 4 }; });
        // hand values (4.6 cm, 42 deg) must not overlap each other or the Right/Wrong heads
        const vals = [...document.querySelectorAll('.h-val')].map(t => t.getBBox());
        const heads = [...document.querySelectorAll('.h-head, .h-note')].map(t => t.getBBox());
        const hit = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
        const valHits = vals.flatMap((a, i) => [...vals.slice(i + 1), ...heads].filter(b => hit(a, b)).map(() => i));
        // guide labels (80 deg, KNEE) against the drawing: sample the label box every 1 px and test it against
        // the hand's fills and outlines (the <use> targets, at their drawn stroke width) and every guide or leg line
        const hand = [...document.querySelectorAll('.hand-svg .h-panel use')].map(u => ({ el: document.getElementById(u.getAttribute('href').slice(1)), w: parseFloat(getComputedStyle(u).strokeWidth) || 2, fill: u.closest('.u-fill') != null, what: u.getAttribute('href') }));
        const lines = [...document.querySelectorAll('.hand-svg .h-panel path, .hand-svg .h-panel circle')].filter(e => !e.closest('defs') && !e.matches('.lp-leg-fill, .h-patch')).map(e => ({ el: e, w: parseFloat(getComputedStyle(e).strokeWidth) || 1, fill: e.matches('.h-arc, .h-load-head, .h-contact, .h-eq'), what: e.getAttribute('class') }));
        const svgEl = document.querySelector('.zbox.hand .hand-svg');
        const guideHits = [];
        for (const t of document.querySelectorAll('.hand-svg .h-val, .hand-svg .lp-knee-t')) {
          const b = t.getBBox(), hits = new Set();
          for (const o of [...hand, ...lines]) {
            if (!o.el || !o.el.isPointInFill) continue;
            const sw = o.el.style.strokeWidth; o.el.style.strokeWidth = o.w + 'px';
            for (let x = b.x; x <= b.x + b.width; x += 1) for (let y = b.y + 2; y <= b.y + b.height - 2; y += 1) {
              const p = svgEl.createSVGPoint(); p.x = x; p.y = y;
              if (o.el.isPointInStroke(p) || (o.fill && o.el.isPointInFill(p))) { hits.add(o.what); break; }
            }
            o.el.style.strokeWidth = sw;
          }
          guideHits.push({ t: t.textContent, hits: [...hits] });
        }
        return { wide, small, chipOver, labs, valHits: valHits.length, guideHits };
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
  check(!m.valHits, `${k}: hand values clear of each other and of the heads`);
  for (const g of m.guideHits ?? []) check(!g.hits.length, `${k}: label "${g.t}" clear of the hand and guide lines${g.hits.length ? ' (crosses ' + g.hits.join(', ') + ')' : ''}`);
  for (const l of m.labs) check(l.fits, `${k}: note "${l.t}" ends at ${l.right} (<= ${l.limit})`);
}
for (const [k, c] of Object.entries(report.crops)) check(c.markInside, `crop ${k}: mark inside the window`);
if (report.hand) check(report.hand.ok, `hand lever: right ${report.hand.right.leverMm} mm, wrong ${report.hand.wrong.leverMm} mm`);
const fails = report.checks.filter(c => c.startsWith('FAIL'));
console.log(JSON.stringify({ ...report, openItems: (howto.openItems ?? []).map(o => `${o.key} (${o.severity}): ${o.what}`), checks: fails.length ? fails : `all ${report.checks.length} checks pass` }, null, 1));
