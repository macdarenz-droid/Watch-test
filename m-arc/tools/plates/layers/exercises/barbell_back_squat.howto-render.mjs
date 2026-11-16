// Render check for exercises/barbell_back_squat.howto.mjs:
//   node exercises/barbell_back_squat.howto-render.mjs [part]
// Writes out/barbell_back_squat-howto-<part>-<theme>.png (Silent Black and Paper, 390 px wide, device scale 2):
//   plate        the plate (unchanged callouts) and the chip row
//   hand         S2: hand zoom (Right / Wrong from hand.mjs, seen from the side) plus the thumb-over option. The Right
//                half and the inset use the spec's loadLine 'guide': no force arrow down the arm (the back holds the bar)
//   bar-on-back  also marks the bony bump at the base of the neck (C7) with the same neutral dot in both crops
//   bar-on-back, depth   S3: posture zooms, crops of the plate (same camera), one callout each
//   feel         S4: feel map at rest + legend + feel line + first 3 rows + "Show 3 more"
//   feel-wrist   S6: the wrist row open (back of the hands tinted; the inside of the elbow is text only, no drawn
//                region: bodyMuscles.ts's elbow paths sit on the outer side), red-flag block, shimmer paused
//   feel-lowerback S6: the lower back row open (lower back dashed, "should not take over")
// Prints a JSON report: hand lever checks, crop windows, copy lint, tap targets, overflow.
// Built on the chest press render script's layout so the sheets match. Uses the engine read-only.
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderPlate, PLATE_CSS, landmarksOf, sheetPage } from '../engine/index.mjs';
import { renderHandPair, renderHand, HAND_CSS } from '../engine/hand.mjs';
import { renderFeelMap, renderFeelLegend, FEEL_CSS } from '../engine/feelmap.mjs';
import { allThemesCss } from '../engine/themes.mjs';
import howto, { stills, SOURCES, RED_FLAG } from './barbell_back_squat.howto.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), outDir = join(root, 'out');
mkdirSync(outDir, { recursive: true });
const ID = 'barbell_back_squat';
const FONT = `data:font/woff2;base64,${readFileSync(join(root, 'engine', 'inter-latin-wght-normal.woff2')).toString('base64')}`;
const TOKENS = readFileSync(join(root, 'engine', 'tokens.css'), 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const f = v => +(+v).toFixed(2);
const plateSpec = howto.plate;
const H = 1.75, REF = { pxPerM: 146.29, x0: plateSpec.camera.x0, y0: plateSpec.camera.y0 };   // the squat plate's camera
const P = w => [REF.x0 + w[2] * REF.pxPerM, REF.y0 - w[1] * REF.pxPerM];
const report = { hand: null, crops: {}, checks: [] };
const check = (ok, msg) => { report.checks.push(`${ok ? 'PASS' : 'FAIL'} ${msg}`); };

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
// A still of the plate spec: one pose, no ghosts, trace, measure, callouts, datum or mistake layer. The equipment is the
// plate's own floor and bar drawing (plate outline behind, 50 mm sleeve dot in front), placed at the still's bar.
function stillSpec({ pose, bar }) {
  const floor = plateSpec.equipment.find(e => e && typeof e === 'object' && e.type === 'floor');
  const equipment = [floor,
    { type: 'barbell', at: bar, plates: [0.045], part: 'bar', z: 'back' },
    { type: 'pulley', at: bar, r: 0.025, part: 'bar', z: 'front' }];
  const { trace, measure, mistake, datum, ...rest } = plateSpec;
  return { ...rest, poses: { start: pose, end: pose }, equipment, ghosts: { count: 0 }, callouts: [], checks: [], startParts: [] };
}
const lmOf = still => landmarksOf(stillSpec(still).poses.end, H);
const refPt = (ref, still) => { const [x, y] = P(lmOf(still)[ref.landmark]); return [x + (ref.dx ?? 0), y + (ref.dy ?? 0)]; };
const stillOf = side => (side === 'start' || side === 'end') ? stills[side] : stills[side.still];

// The bony bump at the base of the neck (C7), rigid with the thorax: from the neck pivot, 5.2 cm toward the back and
// 1.2 cm up, in the thorax frame (up = sacrum to neck). A neutral reference mark, drawn in both bar crops.
function c7Of(lm) {
  const up = [lm.neck[1] - lm.sacrum[1], lm.neck[2] - lm.sacrum[2]], k = Math.hypot(...up), u = [up[0] / k, up[1] / k];
  const back = [u[1], -u[0]];   // (y, z): perpendicular to up, pointing -z for an upright trunk
  return [0, lm.neck[1] + u[0] * 0.012 + back[0] * 0.052, lm.neck[2] + u[1] * 0.012 + back[1] * 0.052];
}
// Guides per crop, in plate px, plus the callout anchor. Colour class: accent (right) or mistake (wrong).
function guides(kind, still, role) {
  const lm = lmOf(still), cls = role === 'right' ? 'hz-g ok' : 'hz-g no';
  if (kind === 'bar-shelf' || kind === 'bar-bone') {
    const B = P(still.bar), c7 = P(c7Of(lm)), r = 0.025 * REF.pxPerM + 2.2;
    let svg = `<circle class="${cls}" cx="${f(B[0])}" cy="${f(B[1])}" r="${f(r)}"/>`;
    if (kind === 'bar-bone') {   // pressure mark: two short arcs on the far side of the ring, toward the bone
      const a = Math.atan2(c7[1] - B[1], c7[0] - B[0]);
      for (const [rr, w] of [[r + 2.4, 0.55], [r + 4.6, 0.45]]) {
        const p0 = [B[0] + rr * Math.cos(a - w), B[1] + rr * Math.sin(a - w)], p1 = [B[0] + rr * Math.cos(a + w), B[1] + rr * Math.sin(a + w)];
        svg += `<path class="${cls}" d="M${f(p0[0])} ${f(p0[1])}A${f(rr)} ${f(rr)} 0 0 1 ${f(p1[0])} ${f(p1[1])}"/>`;
      }
    }
    // The bony bump itself, identical in both crops (neutral, text tokens): a dot on the back of the neck, a dashed level
    // line carried back from it and a small "Bony bump" label over the line's far end. Right: the ring sits below the
    // line. Wrong: above it. Plate px; the crop scales them by the same factor in both halves.
    const LX = 34, fs = 4.9;   // line length; label 10 px on screen at the crop's 2.04 scale
    svg += `<path class="hz-g ref dash thin" d="M${f(c7[0] - LX)} ${f(c7[1])}H${f(c7[0])}"/>`
      + `<circle class="hz-c7" cx="${f(c7[0])}" cy="${f(c7[1])}" r="1.5"/>`
      + `<text class="hz-c7-t" x="${f(c7[0] - LX)}" y="${f(c7[1] - 1.8)}" font-size="${fs}">Bony bump</text>`;
    const barToBoneCm = +((still.bar[1] - c7Of(lm)[1]) * 100).toFixed(1);
    return { svg, anchor: B, barToBoneCm, c7: [f(c7[0]), f(c7[1])] };
  }
  if (kind === 'knee-line') {
    // The top of the knee (knee centre + 5 cm, the knee's drawn radius) carried back past the hip, dashed, and the
    // hip crease as a dot: the fold at the front of the hip, taken 6 cm from the hip-joint centre along the thigh's
    // upper normal (the thigh's drawn half-thickness at its root), so it sits on the front outline.
    const K = P(lm['knee.r']), top = K[1] - 0.05 * REF.pxPerM, J = P(lm['hip.r']), bt = P(lm.buttock);
    const tx = K[0] - J[0], ty = K[1] - J[1], tl = Math.hypot(tx, ty), sg = -tx / tl > 0 ? -1 : 1;   // screen normal pointing up
    const Hp = [J[0] + sg * (ty / tl) * 0.06 * REF.pxPerM, J[1] + sg * (-tx / tl) * 0.06 * REF.pxPerM];
    const svg = `<path class="hz-g dash ref" d="M${f(bt[0] - 6)} ${f(top)}H${f(K[0] + 10)}"/>`
      + `<circle class="hz-g dot ${role === 'right' ? 'ok' : 'no'}" cx="${f(Hp[0])}" cy="${f(Hp[1])}" r="3"/>`;
    return { svg, anchor: Hp, hipBelowKneeTopCm: +(((Hp[1] - top) / REF.pxPerM) * 100).toFixed(1) };
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
  report.crops[`${zoom.key}.${side}`] = { still: zoom[side].still ?? zoom[side], window: [f(vx), f(vy), s, s], scale: f(k), markInside: inside(anchor), ...meas };
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
// loadLine 'guide' (spec): drop the force arrow and the tick where it crosses the wrist; keep the dashed forearm line
// (knuckles, wrist and forearm in one line) and the contact dot. Stand-in until the engine takes the option.
const asGuide = svg => svg.replace(/<path class="h-load" d="[^"]*"\/>/g, '').replace(/<path class="h-load-head" d="[^"]*"\/>/g, '').replace(/<path class="h-tick" d="[^"]*"\/>/g, '');
const merge = (a, b) => ({ ...a, ...b, wrist: { ...a.wrist, ...(b.wrist ?? {}) }, fingers: { ...a.fingers, ...(b.fingers ?? {}) } });
function handZoomSvg(zoom) {
  const hs = howto.handling, fault = zoom.hand.wrong[0], wrongPose = merge(zoom.hand.right, fault.pose);
  const pair = renderHandPair({ camera: zoom.hand.camera, loadAxis: hs.loadAxis, markers: fault.markers, right: zoom.hand.right, wrong: wrongPose,
    rightNote: zoom.hand.notes.right, wrongNote: zoom.hand.notes.wrong, alt: zoom.alt, uid: 'hz' });
  report.hand = pair.report;
  const ll = zoom.hand.loadLine ?? {};
  let main = pair.svg;
  if (ll.right === 'guide') {   // strip the Right half's arrow and tick only (the Wrong half's classes carry " m")
    const [a, b] = main.split('<g class="h-panel wrong">');
    main = asGuide(a) + '<g class="h-panel wrong">' + b;
    report.handLoadLine = { right: 'guide', rightArrows: (main.split('<g class="h-panel wrong">')[0].match(/class="h-load/g) ?? []).length,
      wrongArrows: (main.split('<g class="h-panel wrong">')[1].match(/class="h-load(-head)? m"/g) ?? []).length };
  }
  // Option: thumb over the bar. Same right pose, thumb beside the fingers; a small hand with its one line of text.
  // Rendered large, then cropped to the fist and wrist (spec inset.crop, hand-frame mm) so the bar and the thumb can be
  // told apart at inset size.
  const ins = zoom.hand.inset, big = 400;
  const r = renderHand(merge(zoom.hand.right, ins.drawPose ?? ins.pose), { width: big, height: big, uid: 'hi', role: 'right', loadAxis: hs.loadAxis,
    alt: `${ins.label}. Bar in the heel of the palm, thumb resting over the bar beside the index finger, wrist straight.` });
  report.handInset = { ...r.report, thumbMeaning: ins.pose.thumb, drawnWith: ins.drawPose ?? null };
  let isvg = ll.inset === 'guide' ? asGuide(r.svg) : r.svg;
  if (ins.crop) {
    const w = isvg.match(/<circle class="h-joint wrist" cx="([-\d.]+)" cy="([-\d.]+)"/), k = r.report.scalePxPerMm, wx = +w[1], wy = +w[2];
    // forearm 180: u runs up the screen, v (back of the hand) to the left
    const x0 = wx - ins.crop.v[1] * k, x1 = wx - ins.crop.v[0] * k, y0 = wy - ins.crop.u[1] * k, y1 = wy - ins.crop.u[0] * k;
    isvg = isvg.replace(/viewBox="0 0 \d+ \d+"/, `viewBox="${f(x0)} ${f(y0)} ${f(x1 - x0)} ${f(y1 - y0)}"`)
      .replace('class="hand-svg"', 'class="hand-svg inset-crop"');
    const bar = isvg.match(/<circle class="h-eq" cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)"/);
    // the thumb lies over the top of the bar and hides part of it: draw the bar's outline again on top, dashed (hidden
    // edge), so the viewer sees where the bar sits and that the thumb is on the fingers' side of it
    isvg = isvg.replace(/<\/svg>$/, `<circle class="h-eq-hidden" cx="${bar[1]}" cy="${bar[2]}" r="${bar[3]}"/></svg>`);
    report.handInsetCrop = { mm: [ins.crop.v[1] - ins.crop.v[0], ins.crop.u[1] - ins.crop.u[0]], barInside: +bar[1] - +bar[3] > x0 && +bar[1] + +bar[3] < x1 && +bar[2] - +bar[3] > y0 && +bar[2] + +bar[3] < y1 };
  }
  const inset = `<div class="opt"><div class="opt-fig">${isvg}</div><div class="opt-txt"><span class="eyebrow">${esc(ins.label)}</span>`
    + `<p><span class="ok">${I.check(16)}</span><span>${esc(ins.when)}</span></p></div></div>`;
  return { main, inset };
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
.opt-fig { flex: none; width: 112px; } .opt-fig .hand-svg { display: block; width: 112px; height: auto; }
.opt-fig .h-eq-hidden { fill: none; stroke: var(--text-2); stroke-width: 1.25; stroke-dasharray: 3 2.5; }
.hz-crop .hz-g.thin { stroke-width: 1; }
.hz-crop .hz-c7-t { fill: var(--text-2); font-weight: var(--fw-medium); paint-order: stroke; stroke: var(--surface-2); stroke-width: 1.2px; stroke-linejoin: round; }
.hz-crop circle.hz-c7 { fill: var(--text-2); stroke: var(--surface-2); stroke-width: 1.5; }
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
  if (zoom.kind === 'hand') { const h = handZoomSvg(zoom); box = `<div class="zbox hand">${h.main}${h.inset}</div>`; }
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
check(H0.zooms.length <= 3 && H0.zooms[0].key === 'hand', 'Hand is the first chip; at most 3 zooms + "Where to feel it"');
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
  'bar-on-back': () => zoomSection(zoomOf('bar-on-back')),
  depth: () => zoomSection(zoomOf('depth')),
  feel: () => chipRow('feel') + feelSection(null),
  'feel-wrist': () => feelSection('wrist'),
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
        return { wide, small, chipOver, labs, valHits: valHits.length };
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
  for (const l of m.labs) check(l.fits, `${k}: note "${l.t}" ends at ${l.right} (<= ${l.limit})`);
}
for (const [k, c] of Object.entries(report.crops)) check(c.markInside, `crop ${k}: mark inside the window`);
if (report.hand) check(report.hand.ok, `hand lever: right ${report.hand.right.leverMm} mm, wrong ${report.hand.wrong.leverMm} mm`);
const fails = report.checks.filter(c => c.startsWith('FAIL'));
console.log(JSON.stringify({ ...report, checks: fails.length ? fails : `all ${report.checks.length} checks pass` }, null, 1));
