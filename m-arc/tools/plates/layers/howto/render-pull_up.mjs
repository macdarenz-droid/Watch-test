// Render the How-to layers of the pull-up: node howto/render-pull_up.mjs
// Reads exercises/pull_up.howto.mjs and writes out/pull_up-howto-<layer>-<theme>.png (390 px wide sheet section,
// device scale 2) in Silent Black and Paper:
//   zoom-hand, zoom-hand-p2, zoom-hand-thumb   (S2: Right vs slipping out, Right vs deep in palm, thumb page)
//   zoom-shoulders, zoom-top                   (S3: two crops of the plate, same camera as the plate)
//   feel, feel-open-traps, feel-open-wrist     (S4 at rest, S6 with a row open)
// Prints a JSON report: copy lint, crop label checks, text collisions, 44 px targets, hand reports.
// Engine files are imported, never changed.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { allThemesCss } from '../engine/themes.mjs';
import { renderPlate, PLATE_CSS } from '../engine/plate.mjs';
import { landmarksOf } from '../engine/body.mjs';
import { renderHandPair, renderHand, handGeometry, HAND_CSS } from '../engine/hand.mjs';
import { renderFeelMap, renderFeelLegend, FEEL_CSS } from '../engine/feelmap.mjs';
import { capWidth, leaderFor, CAP_LH } from '../engine/layout.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), outDir = join(root, 'out');
mkdirSync(outDir, { recursive: true });
const ID = 'pull_up';
const HT = await import(pathToFileURL(join(root, 'exercises', `${ID}.howto.mjs`)).href + `?t=${Date.now()}`);
const howto = HT.default, RED_FLAG = HT.RED_FLAG, THUMB_PAGE = HT.THUMB_PAGE;
const ONLY = process.argv[2] ?? null;   // optional: render one layer
const FONT = `data:font/woff2;base64,${readFileSync(join(root, 'engine', 'inter-latin-wght-normal.woff2')).toString('base64')}`;
const TOKENS = readFileSync(join(root, 'engine', 'tokens.css'), 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const f = v => +v.toFixed(2);
const report = { lint: [], crops: {}, hand: {}, browser: {} };

/* ---------- copy lint (architecture 4.3 limits, C8 wording) ---------- */
const words = s => String(s).trim().split(/\s+/).length;
const sentences = s => (String(s).match(/[.!?](\s|$)/g) ?? []).length;
const RF = /get it checked|see a doctor|\bGP\b|physio|numb|tingl|swell/i;
const lint = (where, s, maxW, maxS) => { if (words(s) > maxW) report.lint.push(`${where}: ${words(s)} words > ${maxW}`); if (maxS && sentences(s) > maxS) report.lint.push(`${where}: ${sentences(s)} sentences > ${maxS}`); };
for (const r of howto.feel.rows) { lint(`row ${r.key} means`, r.means, 30, 2); lint(`row ${r.key} fix`, r.fix, 30, 2); if (RF.test(r.fix) || RF.test(r.means)) report.lint.push(`row ${r.key}: red-flag wording (C8)`); }
for (const z of howto.zooms) for (const c of [z.caption, z.captionPage2].filter(Boolean)) { lint(`zoom ${z.key} caption.right`, c.right, 14); lint(`zoom ${z.key} caption.wrong`, c.wrong, 14); if (RF.test(c.right + c.wrong)) report.lint.push(`zoom ${z.key}: red-flag wording`); }
for (const z of howto.zooms) { if (words(z.chip) > 2) report.lint.push(`chip ${z.chip}: > 2 words`); if (!z.alt?.right || !z.alt?.wrong) report.lint.push(`zoom ${z.key}: alt missing (C16)`); }
for (const p of howto.posture) if (words(p.label) > 3) report.lint.push(`posture ${p.key} label > 3 words`);
if (RF.test(howto.handling.gripLine)) report.lint.push('grip line: red-flag wording');
if (howto.chips.length > 4 || howto.zooms.length > 4) report.lint.push('more than 4 chips or zooms');
if (howto.chips[howto.chips.length - 1] !== 'feel') report.lint.push('last chip is not Where to feel it');
if (howto.zooms[0].kind !== 'hand') report.lint.push('Hand is not the first zoom (the load goes through the hands)');
for (const w of howto.feel.watch) if (howto.feel.primary.some(p => p.muscleId === w.muscleId)) report.lint.push(`${w.muscleId}: primary and watch`);
for (const k of [...howto.setup.map(s => s.zoom), ...howto.posture.map(p => p.zoom), ...howto.feel.rows.map(r => r.zoom)].filter(Boolean))
  if (!howto.zooms.some(z => z.key === k)) report.lint.push(`zoom key ${k} does not exist (C1)`);
for (const z of howto.zooms) if (z.feelRow && !howto.feel.rows.some(r => r.key === z.feelRow)) report.lint.push(`feelRow ${z.feelRow} does not exist (C1)`);
const allClaims = [...howto.setup, ...howto.posture, ...howto.feel.rows, howto.feel, howto.handling.width, howto.handling.thumb, howto.handling.wrist].map(x => x.claim);
for (const c of allClaims) { if (!c?.sources?.length) report.lint.push('claim without source (C8)'); for (const s of c?.sources ?? []) if (!HT.SOURCES[s]) report.lint.push(`source ${s} not in registry (C8)`); }
for (const s of Object.keys(HT.SOURCES)) if (!HT.EVIDENCE_LABELS[s]) report.lint.push(`source ${s} has no evidence label`);
// C4 (hang): thumb default wrapped, `over` never offered
if (howto.handling.thumb.mode !== 'wrapped' || (howto.handling.thumb.options ?? []).some(o => o.mode === 'over')) report.lint.push('C4 thumb rule');

/* ---------- shared UI pieces ---------- */
const icon = (d, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = { back: s => icon('<path d="M15 18l-6-6 6-6"/>', s), chev: s => icon('<path d="M9 6l6 6-6 6"/>', s), down: s => icon('<path d="M6 9l6 6 6-6"/>', s),
  check: s => icon('<path d="M5 12l4 4L19 7"/>', s), x: s => icon('<path d="M6 6l12 12M18 6L6 18"/>', s), alert: s => icon('<path d="M12 8v5M12 16.5v.5"/><path d="M10.3 3.9 2.4 17.5a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>', s) };
const CHIP_TEXT = { feel: 'Feel' };
const CHIP_ARIA = { feel: 'Where to feel it' };
const chipText = k => CHIP_TEXT[k] ?? howto.zooms.find(z => z.key === k).chip;
const chipRow = active => `<div class="zoom-chips-head eyebrow">Look closer</div><div class="zoom-chips" role="group" aria-label="Look closer">${howto.chips.map(k =>
  `<button class="zoom-chip" aria-pressed="${k === active}"${CHIP_ARIA[k] ? ` aria-label="${CHIP_ARIA[k]}"` : ''}>${chipText(k)}</button>`).join('')}</div>`;
const zoomTop = z => `<div class="zoom-top"><button class="zoom-back" aria-label="Back to the plate">${I.back(18)}<span>Plate</span></button><h3 class="zoom-heading" id="zh-${z.key}" tabindex="-1">${esc(z.heading)}</h3></div>`;
const captions = c => `<div class="zoom-caps"><p><span class="sr-only">Right: </span>${esc(c.right)}</p><p><span class="sr-only">Wrong: </span>${esc(c.wrong)}</p></div>`;
const feelLink = z => z.feelPrompt ? `<button class="z-feelrow">${esc(z.feelPrompt)}${I.chev(16)}</button>` : '';

/* ---------- S2: hand zoom, three pages ---------- */
const PAGES = [{ key: 'p1', label: 'Slipping out' }, { key: 'p2', label: 'Deep in palm' }, { key: 'thumb', label: 'Thumb' }];
const pager = active => `<div class="pager" role="tablist" aria-label="Hand pages">${PAGES.map((p, i) =>
  `<button class="pager-btn" role="tab" aria-selected="${p.key === active}" aria-label="${esc(`${p.label}, page ${i + 1} of ${PAGES.length}`)}">${esc(p.label)}</button>`).join('')}</div>`;
const mergePose = (a, b) => ({ ...a, ...b, wrist: { ...a.wrist, ...(b.wrist ?? {}) }, fingers: { ...a.fingers, ...(b.fingers ?? {}) }, handle: { ...a.handle, ...(b.handle ?? {}) }, load: { ...a.load, ...(b.load ?? {}) } });
function handZoom(page) {
  const z = howto.zooms.find(q => q.kind === 'hand'), h = howto.handling;
  let body;
  if (page === 'thumb') body = thumbPage();
  else {
    const fault = z.hand.wrong[page === 'p1' ? 0 : 1];
    const pair = renderHandPair({ uid: `pu-${page}`, camera: z.hand.camera, loadAxis: h.loadAxis, markers: fault.markers, right: z.hand.right,
      wrong: mergePose(z.hand.right, fault.pose), rightNote: 'Top of palm', wrongNote: fault.label,
      alt: { right: z.alt.right, wrong: page === 'p1' ? z.alt.wrong : z.alt.wrong2 }, panelHeight: 250 });
    report.hand[page] = pair.report;
    let svg = pair.svg;
    // 5.1: the force line is drawn only for 'along-forearm' loads. A hang is 'across': both halves drop the load
    // line, its head, the contact dot and the wrist tick; the dashed forearm datum and the bend arc stay.
    if (h.loadAxis !== 'along-forearm') svg = stripLoad(svg);
    if (fault.fingerBase) svg = svg.replace('</svg>', fingerBaseMarks(svg, pair.report.scalePxPerMm, z.hand.right, mergePose(z.hand.right, fault.pose)) + '</svg>');
    body = `<div class="hand-plate">${svg}</div>${captions(page === 'p1' ? z.caption : z.captionPage2)}`;
  }
  return `<section class="zoom" role="region" aria-labelledby="zh-${z.key}">${zoomTop(z)}${body}${pager(page)}${feelLink(z)}</section>
  <p class="grip-line">${esc(h.gripLine)}</p>
  <p class="hint limit">${esc(h.wrist.limitText)}</p>`;
}
// Thumb page: 2 x 2 small hands, the same pose with each thumb mode, no load line (the page is about the thumb).
// Every cell is drawn at one scale (K px per mm) and cropped to the hand plus a short piece of forearm, at 1:1, so
// strokes keep the plate's weights and the four thumbs compare directly.
const stripLoad = svg => svg.replace(/<path class="h-load[^"]*"[^>]*\/>/g, '').replace(/<path class="h-load-head[^"]*"[^>]*\/>/g, '')
  .replace(/<circle class="h-contact[^"]*"[^>]*\/>/g, '').replace(/<path class="h-tick"[^>]*\/>/g, '');
// Finger-base line (page 2): a faint dashed line across the hand at the knuckle line (the base of the fingers), at the
// same place in both halves, with a small label in the Right half. The hand frame is the engine's: wrist centre at
// the origin (the drawn wrist joint), u toward the fingers, v toward the back of the hand; screen U, V as makeProj.
function fingerBaseMarks(svg, k, poseR, poseW) {
  const wr = [...svg.matchAll(/h-joint wrist" cx="([\d.]+)" cy="([\d.]+)"/g)].map(m => [+m[1], +m[2]]);
  const one = (pose, W, label) => {
    const g = handGeometry(pose), th = pose.forearm * Math.PI / 180, U = [Math.sin(th), Math.cos(th)], V = [U[1], -U[0]];
    const Hh = p => { const q = g.toF(p); return [W[0] + k * (q[0] * U[0] + q[1] * V[0]), W[1] + k * (q[0] * U[1] + q[1] * V[1])]; };
    const u = g.mcpI[0], a = Hh([u, 13 * g.s]), b = Hh([u, -14.5 * g.s - 2 * g.R - 14 * g.s]);
    let out = `<path class="h-base" d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}"/>`;
    if (label) out += `<text class="h-base-t" x="${f(a[0] - 3)}" y="${f(a[1] - 2)}" text-anchor="end"><tspan x="${f(a[0] - 3)}">FINGER</tspan><tspan x="${f(a[0] - 3)}" dy="10">BASE</tspan></text>`;
    return out;
  };
  return one(poseR, wr[0], true) + one(poseW, wr[1], false);
}
// Hook thumb (thumb page only). The engine aims a hook thumb at the index finger's middle segment, where the index
// covers it completely, so it reads as the full grip. In a hook grip the thumb wraps round the bar first and the
// fingers close over it: here its two visible segments are re-aimed with a 2-link reach from the engine's own
// metacarpal end so the tip hugs the bar at `tipAngle` (degrees from the finger direction toward the back of the hand)
// and lies under the index finger's first segment. Segment lengths and thicknesses are the engine's (HAND_PROP, not
// foreshortened: in a hook the thumb lies in the camera plane round the bar). Drawn with the engine's thumb classes.
function hookThumb(pose, svg, k, uid, tipAngle = 15) {
  const g = handGeometry(pose), R = Math.PI / 180, th = pose.forearm * R, U = [Math.sin(th), Math.cos(th)], V = [U[1], -U[0]];
  const W = svg.match(/h-joint wrist" cx="([\d.]+)" cy="([\d.]+)"/).slice(1).map(Number);
  const Hh = p => { const q = g.toF(p); return [W[0] + k * (q[0] * U[0] + q[1] * V[0]), W[1] + k * (q[0] * U[1] + q[1] * V[1])]; };
  const ts = g.tsegs, mc = g.thumb.pts[1], c = g.circle.c, l1 = ts[1].L, l2 = ts[2].L;
  const T = [c[0] + (g.R + ts[2].t * 0.9) * Math.cos(tipAngle * R), c[1] + (g.R + ts[2].t * 0.9) * Math.sin(tipAngle * R)];
  const dx = T[0] - mc[0], dy = T[1] - mc[1], d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01), a0 = Math.atan2(dy, dx);
  const a = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const ips = [a0 + a, a0 - a].map(x => [mc[0] + l1 * Math.cos(x), mc[1] + l1 * Math.sin(x)]);
  const ip = ips.sort((p, q) => Math.hypot(q[0] - c[0], q[1] - c[1]) - Math.hypot(p[0] - c[0], p[1] - c[1]))[0];   // bends away from the bar
  const ta = Math.atan2(T[1] - ip[1], T[0] - ip[0]), tip = [ip[0] + l2 * Math.cos(ta), ip[1] + l2 * Math.sin(ta)];
  const capsule = (P, Q, r1, r2, n = 10) => { const dd = [Q[0] - P[0], Q[1] - P[1]], L = Math.hypot(...dd) || 1e-6, u = [dd[0] / L, dd[1] / L], nr = [-u[1], u[0]], ps = [];
    const ring = (C, r, b0, b1) => { for (let i = 0; i <= n; i++) { const b = b0 + (b1 - b0) * i / n; ps.push([C[0] + u[0] * Math.cos(b) * r + nr[0] * Math.sin(b) * r, C[1] + u[1] * Math.cos(b) * r + nr[1] * Math.sin(b) * r]); } };
    ring(Q, r2, Math.PI / 2, -Math.PI / 2); ring(P, r1, -Math.PI / 2, -3 * Math.PI / 2); return ps; };
  const polyD = ps => 'M' + ps.map(q => `${f(q[0])} ${f(q[1])}`).join('L') + 'Z';
  const defs = `<path id="${uid}-htpp" d="${polyD(capsule(mc, ip, ts[1].t, ts[2].t * 1.03).map(Hh))}"/><path id="${uid}-htdp" d="${polyD(capsule(ip, tip, ts[2].t, ts[2].t * 0.8).map(Hh))}"/>`;
  const uses = `<use href="#${uid}-htpp"/><use href="#${uid}-htdp"/>`;
  // base patch (fill only) where the thumb grows out of the thenar pad, as the engine's basePatch
  const A = Hh(mc), B = Hh(ip), ang = Math.atan2(B[1] - A[1], B[0] - A[0]), rp = ts[1].t * k + 1.4, pp = [];
  for (let i = 0; i <= 12; i++) { const b = ang + Math.PI / 2 + Math.PI * i / 12; pp.push([A[0] + Math.cos(b) * rp, A[1] + Math.sin(b) * rp]); }
  // nail on the outer side of the distal segment (away from the bar)
  const du = [tip[0] - ip[0], tip[1] - ip[1]], L = Math.hypot(...du), u = [du[0] / L, du[1] / L];
  let nn = [-u[1], u[0]]; const mid = [ip[0] + u[0] * L * 0.5, ip[1] + u[1] * L * 0.5];
  if (Math.hypot(mid[0] + nn[0] - c[0], mid[1] + nn[1] - c[1]) < Math.hypot(mid[0] - nn[0] - c[0], mid[1] - nn[1] - c[1])) nn = [-nn[0], -nn[1]];
  const at = (fu, fn) => Hh([ip[0] + u[0] * L * fu + nn[0] * ts[2].t * fn, ip[1] + u[1] * L * fu + nn[1] * ts[2].t * fn]);
  const nail = `M${at(0.42, 0.86).map(f).join(' ')}L${at(0.92, 0.65).map(f).join(' ')}M${at(0.42, 0.86).map(f).join(' ')}L${at(0.42, 0.45).map(f).join(' ')}`;
  const el = `<g class="h-thumb"><g class="u-stroke">${uses}</g><g class="u-fill">${uses}</g></g><path class="h-patch" d="${polyD(pp)}"/><path class="h-nail" d="${nail}"/>`;
  const gapTip = Math.hypot(tip[0] - c[0], tip[1] - c[1]) - g.R;
  return { defs, el, report: { tipAngle, tipToBarSurfaceMm: +gapTip.toFixed(1), reach: +(Math.hypot(dx, dy) - (l1 + l2)).toFixed(1) } };
}
const K = 0.95, CW = 171, CH = 176;
const handBox = (svg, uid) => { let b = [1e9, 1e9, -1e9, -1e9];
  for (const m of svg.matchAll(new RegExp(`<path id="${uid}-([a-z0-9-]+)" d="([^"]+)"`, 'g'))) { if (m[1] === 'fore') continue;
    const n = m[2].match(/-?[\d.]+/g).map(Number); for (let i = 0; i < n.length - 1; i += 2) b = [Math.min(b[0], n[i]), Math.min(b[1], n[i + 1]), Math.max(b[2], n[i]), Math.max(b[3], n[i + 1])]; }
  return b; };
function thumbPage() {
  const cells = THUMB_PAGE.map((t, i) => {
    const probe = renderHand(t.pose, { width: CW, height: 900, uid: `th${i}` });
    const W = 20 + (CW - 20) * K / probe.report.scalePxPerMm;          // width-limited fit: k grows with the width
    const r = renderHand(t.pose, { width: W, height: 900, uid: `th${i}`, role: t.risk ? 'wrong' : 'right', markers: t.markers ?? [], loadAxis: howto.handling.loadAxis, alt: t.alt });
    report.hand[`thumb-${t.mode}`] = r.report;
    const b = handBox(r.svg, `th${i}`), wr = r.svg.match(/h-joint wrist" cx="([\d.]+)" cy="([\d.]+)"/).map(Number);
    const top = Math.min(b[1], wr[2]), bot = Math.max(b[3], wr[2] + 30), y0 = Math.min(b[1] - 8, (top + bot) / 2 - CH / 2), x0 = (b[0] + b[2]) / 2 - CW / 2;
    report.hand[`thumb-${t.mode}`].cropFits = b[3] <= y0 + CH && b[1] >= y0 && b[0] >= x0 && b[2] <= x0 + CW;
    let svg = stripLoad(r.svg.replace(/viewBox="[^"]*"/, `viewBox="${f(x0)} ${f(y0)} ${CW} ${CH}"`));
    // hook: the bar section goes under the thumb, the thumb under the index finger (the engine draws the section on
    // top of the fist, which hides a hook thumb completely)
    if (t.thumbOverBar) {
      const hx = svg.match(/<circle class="h-eq" [^>]*\/><circle class="h-eq-core" [^>]*\/><path class="h-eq-core" [^>]*\/>/)[0];
      const hook = hookThumb(t.pose, r.svg, r.report.scalePxPerMm, `th${i}`, t.thumbOverBar.tipAngle);
      svg = svg.replace(hx, '').replace(/<g class="h-thumb">[\s\S]*?<\/g><\/g><path class="h-patch"[^>]*\/><path class="h-crease"[^>]*\/><path class="h-nail"[^>]*\/>/, hook.el)
        .replace('</defs>', hook.defs + '</defs>').replace(/(<g class="h-skin">[\s\S]*?<\/g><\/g>)/, `$1${hx}`);
      report.hand[`thumb-${t.mode}`].thumbOverBar = svg.indexOf(hx) < svg.indexOf('class="h-thumb"') && svg.indexOf('class="h-thumb"') < svg.lastIndexOf('class="h-skin"');
      report.hand[`thumb-${t.mode}`].hookTip = hook.report;
    }
    return `<figure class="th-cell${t.default ? ' def' : ''}${t.risk ? ' risk' : ''}"><figcaption><span class="th-title">${t.default ? I.check(16) : ''}${esc(t.title)}</span><span class="th-note">${esc(t.note)}</span></figcaption>${svg}</figure>`;
  }).join('');
  return `<div class="th-cam eyebrow">Thumb options, seen from the side</div><div class="th-grid">${cells}</div>`;
}

/* ---------- S3: posture zoom = two crops of the plate, at the plate's own camera ---------- */
const PANEL = 171, PH = 171;
const base = renderPlate(howto.plate, { id: 'base' });
const CAM = base.report.camera;                    // the fitted camera of the plate on screen; every crop reuses it
const H = howto.plate.body?.height ?? 1.75;
const mergeDeep = (a, b) => { if (b === undefined) return a; if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) { const o = { ...a }; for (const q of Object.keys(b)) o[q] = mergeDeep(a[q], b[q]); return o; } return b; };
const poseOf = ref => typeof ref === 'string' ? howto.plate.poses[ref] : mergeDeep(howto.plate.poses[ref.base], ref.pose);
// Camera of a crop: the plate's own (side view), or for `view: 'back'` the same scale and height, centred, drawn with
// the engine's front-view outline (a symmetric pose with no face reads the same from behind).
const camOf = z => z.view === 'back' ? { pxPerM: CAM.pxPerM, x0: 179, y0: CAM.y0 } : { pxPerM: CAM.pxPerM, x0: CAM.x0, y0: CAM.y0 };
const projOf = z => { const c = camOf(z); return z.view === 'back' ? (w => [c.x0 + w[0] * c.pxPerM, c.y0 - w[1] * c.pxPerM]) : (w => [c.x0 + w[2] * c.pxPerM, c.y0 - w[1] * c.pxPerM]); };
const wrongPose = z => mergeDeep(poseOf(z.right), poseOf(z.wrong));
function cropSpec(z, role) {
  const p = howto.plate, right = poseOf(z.right), back = z.view === 'back';
  const solidWrong = role === 'wrong' && z.wrong.solid, shown = solidWrong ? wrongPose(z) : right;
  const spec = { ...p, camera: camOf(z), poses: { start: shown, end: shown },
    equipment: z.equipment ?? p.equipment.filter(e => typeof e !== 'function'),      // the plate's hidden-line overlay belongs to its two-pose picture
    callouts: [], ghosts: { count: 0 }, trace: undefined, measure: undefined, checks: [],
    datum: z.key === 'top' ? [p.datum[0]] : [], mistake: undefined,
    ...(back ? { view: 'front', viewLabel: 'Back view', marks: [] } : {}) };
  if (role === 'wrong' && !solidWrong) spec.mistake = { pose: poseOf(z.wrong), parts: z.wrong.parts, guides: (z.guides ?? []).filter(g => !['level', 'drop', 'cap'].includes(g.kind)), tells: [] };
  return spec;
}
// Landmarks by pose name, the same for both crops: 'start'/'end' = the right pose, 'mistake' = the wrong pose, plus
// any points the zoom's `outlines` adds (e.g. the shoulder blades).
function cropLandmarks(z) {
  const lms = { end: landmarksOf(poseOf(z.right), H), start: landmarksOf(poseOf(z.right), H), mistake: landmarksOf(wrongPose(z), H) };
  if (z.outlines) for (const k of Object.keys(lms)) Object.assign(lms[k], z.outlines(lms[k]).points);
  return lms;
}
function resolveRefs(z, refs) {
  const lms = cropLandmarks(z), P = projOf(z);
  const res = (ref, pose = 'end') => {
    if (Array.isArray(ref)) return ref.length === 3 ? P(ref) : ref;
    if (typeof ref === 'string') return P(lms[pose][ref]);
    const p = res(ref.at, ref.pose ?? pose), o = ref.off ?? [0, 0]; return [p[0] + o[0], p[1] + o[1]];
  };
  return refs.map(r => res(r));
}
function cropHalf(z, role) {
  const spec = cropSpec(z, role);
  const p = renderPlate(spec, { id: `${z.key}-${role}`, mistake: role === 'wrong' });
  const cam2 = p.report.camera, want = camOf(z);
  if (Math.abs(cam2.pxPerM - CAM.pxPerM) > 0.01 || Math.abs(cam2.x0 - want.x0) > 0.1 || Math.abs(cam2.y0 - CAM.y0) > 0.1) report.lint.push(`crop ${z.key}: camera differs from the plate scale`);
  // zoom-only overlay (5.2): 'level' = a dashed level line across the crop at a right-pose landmark (both crops);
  // 'drop' = an arrow from a right-pose point to a mistake-pose point (wrong crop only)
  const levels = (z.guides ?? []).filter(g => g.kind === 'level'), drops = role === 'wrong' ? (z.guides ?? []).filter(g => g.kind === 'drop') : [];
  // 'cap' = the dashed outline of a joint cap in the wrong pose (wrong crop only): the plate's mistake layer draws the
  // outline of the union of the changed parts, so a shoulder that rolls forward inside the body outline stays unseen
  const caps = role === 'wrong' ? (z.guides ?? []).filter(g => g.kind === 'cap') : [];
  const anchors = resolveRefs(z, [z.crop.center, z.callout[role].anchor, ...levels.map(g => g.own ? { at: g.at, pose: role === 'wrong' ? 'mistake' : 'end' } : g.at), ...drops.flatMap(g => [g.from, g.to]),
    ...caps.flatMap(g => [{ at: g.at, pose: 'mistake' }, { at: g.top, pose: 'mistake' }])]);
  const [cx, cy] = anchors[0], s = z.crop.sizePx, vx = cx - s / 2, vy = cy - s / 2, k = PANEL / s;
  const inner = p.svg.replace(/<svg class="plate-svg"[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<rect width="358" height="358" fill="url\(#[^)]*\)"\/>/, '');
  const toPanel = ([x, y]) => [(x - vx) * k, (y - vy) * k];
  const c = z.callout[role], A = toPanel(anchors[1]), lns = c.text.split(/<br\s*\/?>/), w = capWidth(c.text), h = CAP_LH * lns.length;
  const occ = p.occ;
  const figureHits = b => occ.count(vx + b.x0 / k, vy + b.y0 / k, vx + b.x1 / k, vy + b.y1 / k);
  let best = null;
  for (let dy = -70; dy <= 70; dy += 2) for (let dx = -130; dx <= 130; dx += 2) {
    const b = { x0: A[0] + dx, y0: A[1] + dy, x1: A[0] + dx + w, y1: A[1] + dy + h };
    if (b.x0 < 8 || b.y0 < 8 || b.x1 > PANEL - 8 || b.y1 > PH - 8) continue;
    const hits = figureHits({ x0: b.x0 - 3, y0: b.y0 - 3, x1: b.x1 + 3, y1: b.y1 + 3 });
    const L = leaderFor(A, b), len = L.pts.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - L.pts[i][0], q[1] - L.pts[i][1]), 0);
    const cost = hits * 400 + len + Math.max(0, 14 - len) * 20;
    if (!best || cost < best.cost) best = { b, L, cost, hits };
  }
  report.crops[`${z.key}.${role}`] = { drawnLabel: false, cropPx: [f(vx), f(vy), s], scale: f(k), label: c.text.replace(/<br\s*\/?>/g, ' '), box: Object.values(best.b).map(f), figureCells: best.hits,
    anchorInside: A[0] > 6 && A[0] < PANEL - 6 && A[1] > 6 && A[1] < PH - 6 };
  const cls = role === 'right' ? 'ok' : 'm';
  const lv = levels.map((g, i) => `<path class="z-level ${g.tone === 'neutral' ? 'n' : cls}" d="M4 ${f(toPanel(anchors[2 + i])[1])}H${PANEL - 4}"/>`).join('');
  const dr = drops.map((g, i) => { const a = toPanel(anchors[2 + levels.length + 2 * i]), b = toPanel(anchors[3 + levels.length + 2 * i]);
    const x = a[0];   // drawn straight down at the start point's x: the drop is vertical
    return `<path class="z-drop" d="M${f(x)} ${f(a[1])}V${f(b[1] - 1)}"/><path class="z-drop-head" d="M${f(x - 4)} ${f(b[1] - 6)}L${f(x)} ${f(b[1])}L${f(x + 4)} ${f(b[1] - 6)}Z"/>`; }).join('');
  const i0 = 2 + levels.length + 2 * drops.length;
  const cp = caps.map((g, i) => { const c = toPanel(anchors[i0 + 2 * i]), t = toPanel(anchors[i0 + 2 * i + 1]);
    return `<circle class="z-cap" cx="${f(c[0])}" cy="${f(c[1])}" r="${f(Math.hypot(t[0] - c[0], t[1] - c[1]))}"/>`; }).join('');
  // outlines (e.g. the shoulder blades) of the pose this crop shows: accent in Right, --mistake in Wrong
  const ol = z.outlines ? z.outlines(cropLandmarks(z)[role === 'wrong' ? 'mistake' : 'end']).lines.map(o =>
    `<path class="z-ol ${o.kind} ${cls}" d="M${o.pts.map(w => toPanel(projOf(z)(w)).map(f).join(' ')).join('L')}"/>`).join('') : '';
  const label = lv + dr + cp + ol + `<circle class="z-anchor ${cls}" cx="${f(A[0])}" cy="${f(A[1])}" r="2.5"/>`;   // the words are the subtag under Right / Wrong (postureZoom), as on every posture zoom
  const svg = `<svg class="z-crop" viewBox="0 0 ${PANEL} ${PH}" role="img" aria-label="${esc(role === 'right' ? 'Right: ' + z.alt.right : 'Wrong: ' + z.alt.wrong)}" xmlns="http://www.w3.org/2000/svg">
    <rect class="z-bg" width="${PANEL}" height="${PH}" fill="url(#zdots)"/>
    <defs><clipPath id="zc-${z.key}-${role}"><rect width="${PANEL}" height="${PH}" rx="10"/></clipPath></defs>
    <g clip-path="url(#zc-${z.key}-${role})"><svg x="0" y="0" width="${PANEL}" height="${PH}" aria-hidden="true" viewBox="${f(vx)} ${f(vy)} ${s} ${s}" class="z-plate">${inner}</svg></g>
    <rect class="z-frame" x=".5" y=".5" width="${PANEL - 1}" height="${PH - 1}" rx="10"/>${label}</svg>`;
  report.crops[`${z.key}.${role}`].issues = p.report.issues.filter(i => !/^label|^check/.test(i));
  return `<div class="plate z-wrap">${svg}</div>`;
}
function postureZoom(z) {
  const sub = role => z.callout[role].text.replace(/<br\s*\/?>/g, ' ');   // the crop's own label, printed once under the word
  const head = ok => `<div class="z-head ${ok ? 'ok' : 'm'}">${ok ? I.check(18) : I.x(18)}<b>${ok ? 'Right' : 'Wrong'}</b></div><div class="z-sub ${ok ? 'ok' : 'm'}">${esc(sub(ok ? 'right' : 'wrong').toUpperCase())}</div>`;
  return `<section class="zoom" role="region" aria-labelledby="zh-${z.key}">${zoomTop(z)}
    ${z.camLabel ? `<div class="th-cam eyebrow z-cam">${esc(z.camLabel)}</div>` : ''}<div class="z-pair${z.camLabel ? ' has-cam' : ''}"><div>${head(true)}${cropHalf(z, 'right')}</div><div>${head(false)}${cropHalf(z, 'wrong')}</div></div>
    ${captions(z.caption)}${feelLink(z)}</section>`;
}

/* ---------- S4 / S6: the feel section ---------- */
function feelSection(openKey = null) {
  const F = howto.feel, open = F.rows.find(r => r.key === openKey);
  const watch = open ? (open.at.muscles ?? []).filter(m => F.watch.some(w => w.muscleId === m)) : [];
  const map = renderFeelMap({ primary: F.primary, secondary: F.secondary, avoid: watch, pain: open?.at.parts ?? [], views: ['front', 'back'], id: `feel-${openKey ?? 'rest'}` });
  report.browser[`feel-${openKey ?? 'rest'}`] = { label: map.label, drawn: map.drawn, textOnly: map.textOnly };
  const rows = F.rows.map((r, i) => {
    const isOpen = r.key === openKey;
    if (i >= 3 && !isOpen) return '';
    return `<li class="feel-row${isOpen ? ' open' : ''}"><button class="feel-row-btn" aria-expanded="${isOpen}">${esc(r.where)}${isOpen ? I.down(18) : I.chev(18)}</button>`
      + (isOpen ? `<div class="feel-row-body"><p><b>Usually means</b> ${esc(r.means)}</p><p><b>Fix</b> ${esc(r.fix)}</p>`
        + (r.zoom ? `<button class="feel-showme">Show me the ${esc(chipText(r.zoom).toLowerCase())}${I.chev(16)}</button>` : '')
        + (r.redFlag ? `<div class="red-flag">${I.alert(16)}<div><p>${esc(RED_FLAG.now)}</p><p>${esc(RED_FLAG.doctor)}</p></div></div>` : '') + `</div>` : '')
      + `</li>`;
  }).join('');
  const more = F.rows.slice(3).filter(r => r.key !== openKey).length;
  return `<section class="feel-section" aria-labelledby="feel-h"><h3 class="eyebrow" id="feel-h">Where you should feel it</h3>
    ${map.html}
    ${renderFeelLegend({ avoid: watch.length > 0 })}
    <p class="feel-line">${esc(F.feelLine)}</p>
    <h4 class="eyebrow sub">If you feel it in…</h4>
    <ul class="feel-rows">${rows}</ul>
    ${more ? `<button class="feel-more" aria-label="Show ${more} more">Show ${more} more</button>` : ''}
  </section>`;
}

/* ---------- page ---------- */
const CSS = `
@font-face { font-family: 'Inter Variable'; src: url('${FONT}') format('woff2-variations'); font-weight: 100 900; font-display: block; }
${TOKENS}
${allThemesCss()}
${PLATE_CSS}
${HAND_CSS}
${FEEL_CSS}
*,*::before,*::after { box-sizing: border-box; }
html, body { margin: 0; background: var(--surface-2); color: var(--text); font-family: var(--font); -webkit-font-smoothing: antialiased; }
body { width: 390px; padding: 16px; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
p, figure { margin: 0; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.eyebrow { font-size: var(--fs-cap); line-height: var(--lh-cap); letter-spacing: var(--ls-cap); text-transform: uppercase; font-weight: var(--fw-semibold); color: var(--text-2); margin: 0; }
.hint { font-size: var(--fs-meta); line-height: var(--lh-meta); color: var(--text-2); }
.zoom-chips-head { margin-bottom: var(--sp-2); }
.zoom-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: var(--sp-3); }
.zoom-chip { min-height: 44px; padding: 0 14px; border-radius: var(--radius-pill); border: 1px solid var(--border); color: var(--text-2); font-size: var(--fs-small); font-weight: var(--fw-medium); }
.zoom-chip[aria-pressed="true"] { background: var(--accent-soft); border-color: transparent; color: var(--accent-text); }
.zoom { border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); background: var(--surface-2); overflow: hidden; }
.zoom .hand-plate { border: 0; border-radius: 0; }
.zoom-top { display: flex; align-items: center; gap: 4px; padding: 0 12px 0 4px; border-bottom: 1px solid var(--border-subtle); }
.zoom-back { display: inline-flex; align-items: center; gap: 2px; min-height: 44px; min-width: 44px; padding: 0 8px 0 4px; color: var(--accent-text); font-size: var(--fs-small); font-weight: var(--fw-medium); }
.zoom-heading { margin: 0; font-size: var(--fs-small); font-weight: var(--fw-semibold); color: var(--text); }
.zoom-caps { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 10px 12px; font-size: var(--fs-meta); line-height: var(--lh-meta); color: var(--text-2); }
.pager { display: flex; gap: 6px; padding: 0 10px 10px; }
.pager-btn { flex: 1; min-height: 44px; border-radius: var(--radius-pill); border: 1px solid var(--border-subtle); color: var(--text-2); font-size: var(--fs-meta); font-weight: var(--fw-medium); }
.pager-btn[aria-selected="true"] { border-color: var(--border); color: var(--text); background: var(--surface-3); }
.th-cam { text-align: center; padding: 14px 0 4px; }
.th-grid { display: grid; grid-template-columns: ${171}px ${171}px; gap: 12px 14px; justify-content: center; padding: 6px 0 10px; }
.th-cell { display: grid; gap: 0; grid-row: span 2; grid-template-rows: subgrid; }   /* captions of one row share a height */
.th-cell figcaption { display: grid; gap: 1px; align-content: start; min-height: 36px; padding: 0 4px; }
.th-title { display: inline-flex; align-items: center; gap: 4px; font-size: var(--fs-small); font-weight: var(--fw-semibold); color: var(--text); }
.th-title svg { color: var(--accent); flex: none; }
.th-note { font-size: var(--fs-meta); line-height: var(--lh-meta); color: var(--text-2); }
.th-cell.def .th-note { color: var(--accent-text); }
.th-cell.risk .th-note { color: var(--mistake); }
/* thumb page: the page is about the thumb, so the thumb gets the heaviest line (5.1) */
.th-cell .hand-svg .h-thumb .u-stroke use { stroke: var(--text); stroke-width: 2.5; }
.hand-svg .h-base { fill: none; stroke: var(--text-3); stroke-width: 1; stroke-dasharray: 2 2.5; stroke-linecap: round; }
.hand-svg .h-base-t { font-size: 9px; font-weight: var(--fw-semibold); letter-spacing: var(--ls-cap); fill: var(--text-3); }
.th-cell .hand-svg { border-radius: 10px; border: 1px solid var(--border-subtle); }
.z-pair { display: grid; grid-template-columns: ${PANEL}px ${PANEL}px; gap: 14px; justify-content: center; padding: 12px 0 10px; }
.z-head { display: flex; align-items: center; gap: 5px; height: 26px; font-size: var(--fs-small); }
.z-head b { font-weight: var(--fw-semibold); color: var(--text); }
.z-sub { margin: -4px 0 6px 23px; font-size: var(--fs-cap); line-height: var(--lh-cap); letter-spacing: var(--ls-cap); font-weight: var(--fw-semibold); white-space: nowrap; } .z-sub.ok { color: var(--accent-text); } .z-sub.m { color: var(--mistake); }
.z-head.ok svg { color: var(--accent); } .z-head.m svg { color: var(--mistake); }
.plate.z-wrap { width: ${PANEL}px; height: ${PH}px; aspect-ratio: auto; border: 0; border-radius: 0; background: none; overflow: visible; }
.z-crop { display: block; width: ${PANEL}px; height: ${PH}px; }
.z-crop .z-frame { fill: none; stroke: var(--border); stroke-width: 1; }
.z-crop .z-plate path, .z-crop .z-plate use, .z-crop .z-plate circle, .z-crop .z-plate rect { vector-effect: non-scaling-stroke; }
.z-crop defs path { vector-effect: non-scaling-stroke; }
.z-level { fill: none; stroke-width: 1; stroke-dasharray: 3 3; } .z-level.ok { stroke: var(--accent); } .z-level.m { stroke: var(--text-3); } .z-level.n { stroke: var(--text-3); stroke-dasharray: 1 3; }
.z-ol { fill: none; stroke-width: 1.25; stroke-linejoin: round; stroke-linecap: round; } .z-ol.ridge { stroke-width: .9; }
.z-ol.ok { stroke: var(--accent); } .z-ol.m { stroke: var(--mistake); stroke-dasharray: 3 2; }
.z-cam { padding: 12px 0 0; } .z-pair.has-cam { padding-top: 6px; }
.z-cap { fill: none; stroke: var(--mistake); stroke-width: 1.25; stroke-dasharray: 3 2.5; }
.z-drop { fill: none; stroke: var(--mistake); stroke-width: 1.5; stroke-linecap: round; } .z-drop-head { fill: var(--mistake); }
.z-leader { fill: none; stroke-width: .75; } .z-leader.ok { stroke: var(--accent); } .z-leader.m { stroke: var(--mistake); }
.z-anchor.ok { fill: var(--accent); } .z-anchor.m { fill: var(--mistake); }
.z-callout { font-family: var(--font); font-size: var(--fs-cap); letter-spacing: var(--ls-cap); font-weight: var(--fw-semibold); }
.z-callout.ok { fill: var(--accent-text); } .z-callout.m { fill: var(--mistake); }
.z-feelrow { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; min-height: 44px; padding: 0 12px; border-top: 1px solid var(--border-subtle); text-align: left; font-size: var(--fs-meta); color: var(--accent-text); }
.grip-line { margin-top: var(--sp-3); font-size: var(--fs-body); line-height: var(--lh-body); color: var(--text); }
.limit { margin-top: var(--sp-2); }
.feel-section { display: grid; gap: var(--sp-3); --feel-map-h: 250px; }
.feel-line { font-size: var(--fs-body); line-height: var(--lh-body); color: var(--text); }
.eyebrow.sub { margin-top: var(--sp-1); }
.feel-rows { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--border-subtle); }
.feel-row { border-bottom: 1px solid var(--border-subtle); }
.feel-row-btn { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; min-height: 48px; text-align: left; font-size: var(--fs-body); color: var(--text); }
.feel-row-btn svg { color: var(--text-3); flex: none; }
.feel-row-body { display: grid; gap: var(--sp-2); padding: 0 0 var(--sp-3); font-size: var(--fs-small); line-height: var(--lh-body); color: var(--text); }
.feel-row-body b { display: block; font-size: var(--fs-cap); line-height: var(--lh-cap); letter-spacing: var(--ls-cap); text-transform: uppercase; font-weight: var(--fw-semibold); color: var(--text-2); margin-bottom: 2px; }
.feel-showme { display: inline-flex; align-items: center; gap: 2px; min-height: 44px; color: var(--accent-text); font-size: var(--fs-small); font-weight: var(--fw-medium); justify-self: start; }
.red-flag { display: flex; gap: 8px; padding: 10px 12px; border-radius: var(--radius-md, 10px); border: 1px solid var(--border); color: var(--text-2); font-size: var(--fs-meta); line-height: var(--lh-meta); }
.red-flag svg { color: var(--text-2); flex: none; margin-top: 2px; }
.red-flag div { display: grid; gap: 4px; }
.feel-more { min-height: 44px; padding: 0 16px; border-radius: var(--radius-pill); border: 1px solid var(--border); color: var(--text-2); font-size: var(--fs-small); font-weight: var(--fw-medium); justify-self: start; }
`;
const page = (theme, body) => `<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=390, initial-scale=1"><title>${esc(howto.plate.name)}</title><style>${CSS}</style></head>
<body><svg width="0" height="0" style="position:absolute"><defs><pattern id="zdots" width="16" height="16" patternUnits="userSpaceOnUse"><rect x="7.5" y="7.5" width="1" height="1" class="zdot"/></pattern></defs></svg>
<style>.zdot{fill:var(--border-subtle)}</style>${body}</body></html>`;

const LAYERS = {
  'zoom-hand': () => chipRow('hand') + handZoom('p1'),
  'zoom-hand-p2': () => chipRow('hand') + handZoom('p2'),
  'zoom-hand-thumb': () => chipRow('hand') + handZoom('thumb'),
  'zoom-shoulders': () => chipRow('shoulders') + postureZoom(howto.zooms.find(z => z.key === 'shoulders')),
  'zoom-top': () => chipRow('top') + postureZoom(howto.zooms.find(z => z.key === 'top')),
  feel: () => feelSection(null),
  'feel-open-traps': () => feelSection('traps'),
  'feel-open-wrist': () => feelSection('wrist'),
};
const THEMES = [['silent-black', 'dark', 'dark'], ['paper', 'light', 'paper']];
const { chromium } = createRequire('/home/user/M-arc/package.json')('playwright');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const tmp = mkdtempSync(join(outDir, `.howto-${ID}-`));
const pngs = [];
try {
  for (const [name, build] of Object.entries(LAYERS)) {
    if (ONLY && name !== ONLY) continue;
    const body = build();
    for (const [theme, scheme, tag] of THEMES) {
      const file = join(tmp, `${name}-${tag}.html`);
      writeFileSync(file, page(theme, body));
      const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2, colorScheme: scheme });
      const pg = await ctx.newPage();
      await pg.goto(pathToFileURL(file).href);
      await pg.evaluate(() => document.fonts.ready);
      const m = await pg.evaluate(() => {
        const issues = [];
        if (document.documentElement.scrollWidth > 390) issues.push(`horizontal-scroll:${document.documentElement.scrollWidth}`);
        for (const el of document.querySelectorAll('button')) { const r = el.getBoundingClientRect(); if (r.height < 44 || r.width < 44) issues.push(`target<44:${el.textContent.trim().slice(0, 24)}:${Math.round(r.width)}x${Math.round(r.height)}`); }
        for (const svg of document.querySelectorAll('svg.hand-svg, svg.z-crop')) {
          const sb = svg.getBoundingClientRect(), ts = [...svg.querySelectorAll('text')].map(t => ({ t: t.textContent, b: t.getBoundingClientRect() }));
          ts.forEach((a, i) => {
            if (a.b.left < sb.left + 2 || a.b.right > sb.right - 2 || a.b.top < sb.top + 2 || a.b.bottom > sb.bottom - 2) issues.push(`text-edge:${a.t}`);
            ts.slice(i + 1).forEach(c => { if (a.b.left < c.b.right && c.b.left < a.b.right && a.b.top < c.b.bottom && c.b.top < a.b.bottom) issues.push(`text-overlap:${a.t}|${c.t}`); });
          });
        }
        // Right / Wrong: word and icon present on every zoom (C16)
        for (const z of document.querySelectorAll('.zoom')) {
          const t = z.textContent; const hasPair = z.querySelector('.z-pair, .hand-plate .hand-svg text.h-head');
          if (hasPair && !(/Right/.test(t) || z.querySelector('text.h-head'))) issues.push('C16:no Right word');
        }
        return { issues, font: document.fonts.check('15px "Inter Variable"'), h: document.documentElement.scrollHeight };
      });
      await pg.setViewportSize({ width: 390, height: m.h });
      const png = join(outDir, `${ID}-howto-${name}-${tag}.png`);
      await pg.screenshot({ path: png, fullPage: true });
      pngs.push(png);
      report.browser[`${name}-${tag}`] = { issues: m.issues, font: m.font };
      await ctx.close();
    }
  }
} finally { await browser.close(); rmSync(tmp, { recursive: true, force: true }); }
report.pngs = pngs;
report.ok = !report.lint.length && Object.values(report.browser).every(b => !b.issues?.length) && Object.values(report.crops).every(c => (c.drawnLabel === false || !c.figureCells) && c.anchorInside && !c.issues?.length);
console.log(JSON.stringify(report, null, 1));
