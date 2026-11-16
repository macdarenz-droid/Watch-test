// Render the How-to layers of the seated cable row: node howto/render-seated_cable_row.mjs [layer]
// Reads exercises/seated_cable_row.howto.mjs and writes out/seated_cable_row-howto-<layer>-<theme>.png (390 px wide
// sheet section, device scale 2) in Silent Black and Paper:
//   zoom-hand                                          (S2: Right vs curled and slipping, seen from above; one page)
//   zoom-back, zoom-finish                             (S3: two crops of the plate, same camera as the plate)
//   feel, feel-more, feel-open-traps, feel-open-wrist  (S4 at rest, all rows after "More", S6 with a row open)
// Adapted from howto/render-lat_pulldown.mjs (same sheet pieces and checks). Added: a C7 copy-style lint over every
// user-visible string, and the 'spine' zoom overlay (a straight dashed guide along the back of the right pose).
// Prints a JSON report: copy lint, crop label checks, text collisions, 44 px targets, hand reports.
// Engine files are imported, never changed.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { allThemesCss } from '../engine/themes.mjs';
import { renderPlate, PLATE_CSS } from '../engine/plate.mjs';
import { landmarksOf } from '../engine/body.mjs';
import { renderHandPair, renderHand, HAND_CSS } from '../engine/hand.mjs';
import { renderFeelMap, renderFeelLegend, FEEL_CSS } from '../engine/feelmap.mjs';
import { capWidth, leaderFor, CAP_LH } from '../engine/layout.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), outDir = join(root, 'out');
mkdirSync(outDir, { recursive: true });
const ID = 'seated_cable_row';
const HT = await import(pathToFileURL(join(root, 'exercises', `${ID}.howto.mjs`)).href + `?t=${Date.now()}`);
const howto = HT.default, RED_FLAG = HT.RED_FLAG;
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
// TalkBack alt vs drawing: a wrong crop drawn solid (wrong.solid) must not be described as dashed, and a dashed overlay
// crop must say so
for (const z of howto.zooms) if (z.kind === 'posture') { const dashed = /\bdashed\b/i.test(z.alt.wrong);
  if (z.wrong.solid && dashed) report.lint.push(`zoom ${z.key}: alt.wrong says dashed but the crop is solid`);
  if (!z.wrong.solid && !dashed) report.lint.push(`zoom ${z.key}: alt.wrong does not say the fault is drawn dashed`); }
// red flags: every row's redFlag names a block that exists, and that block's source is in the registry
const RED_FLAGS = { true: RED_FLAG, shoulder: HT.RED_FLAG_SHOULDER };
for (const r of howto.feel.rows) if (r.redFlag) { const b = RED_FLAGS[r.redFlag];
  if (!b) report.lint.push(`row ${r.key}: redFlag ${r.redFlag} has no block`);
  else for (const s of b.claim.sources) { if (!HT.SOURCES[s]) report.lint.push(`red flag ${r.redFlag}: source ${s} not in registry`); if (!r.claim.sources.includes(s) && r.redFlag !== true) report.lint.push(`row ${r.key}: red flag source ${s} not in its claim`); } }
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
// C7 copy style (architecture 6.2) over every user-visible string
{ const h = howto.handling, F = howto.feel;
  const copy = [['grip', h.gripLine], ['limit', h.wrist.limitText], ['width', h.width.text], ['feelLine', F.feelLine], ['setupLine', howto.copy.setupLine], ['mistakeLine', howto.copy.mistakeLine],
    ...howto.setup.map((x, i) => [`setup ${i + 1}`, x.text]), ...howto.posture.flatMap(p => [[`posture ${p.key} label`, p.label], [`posture ${p.key}`, p.detail]]),
    ...F.rows.flatMap(r => [[`row ${r.key} where`, r.where], [`row ${r.key} means`, r.means], [`row ${r.key} fix`, r.fix]]),
    ...howto.zooms.flatMap(z => [[`zoom ${z.key} right`, z.caption.right], [`zoom ${z.key} wrong`, z.caption.wrong], [`zoom ${z.key} prompt`, z.feelPrompt ?? ''],
      ...Object.entries(z.callout ?? {}).map(([k, c]) => [`zoom ${z.key} callout ${k}`, c.text.replace(/<br>/g, ' ')])]), ['cue', h.cue],
    ...h.faults.map(fl => [`fault ${fl.key} label`, fl.label])];
  const BAN = [/—/, /\s–\s/, /!/, /%/, /;/, /\([A-Z][a-z]+[^)]*\d{4}\)/, /et al/, /\bEMG\b/, /mind-muscle/i, /\b(engage|activat\w*|firing|torch|blast|sculpt|toned?|optimal|optimi[sz]e|maximi[sz]e|ultimate|crucial|essential|simply|ensure|seamless|effortless|elevate|journey)\b/i,
    /make sure|it's important|remember to|focus on|throughout the movement|controlled manner|proper form|key to|your core/i, /\bnot\b[^.,]{1,40}\bbut\b/i, /pinky|latissimus|trapezius|deltoid|erector|pectoralis/i];
  for (const [k, t] of copy) { for (const b of BAN) if (b.test(t)) report.lint.push(`C7 ${k}: ${b}`);
    for (const sn of String(t).split(/(?<=[.?])\s+/)) if (words(sn) > 25) report.lint.push(`C7 ${k}: sentence > 25 words`); }
  lint('feelLine', F.feelLine, 40, 2); if (!/^You should feel this/.test(F.feelLine)) report.lint.push('feelLine template');
  for (const [k, t] of [['grip', h.gripLine], ['setupLine', howto.copy.setupLine], ['mistakeLine', howto.copy.mistakeLine]]) lint(k, t, 45, 3);
  for (const r of F.rows) if (/^(Your|The|A|An|If|It|This)\b/.test(r.fix)) report.lint.push(`row ${r.key} fix does not start with a verb`);
  for (const z of howto.zooms) for (const c of Object.values(z.callout ?? {})) if (words(c.text.replace(/<br>/g, ' ')) > 3) report.lint.push(`zoom ${z.key} callout > 3 words`);
  if (words(h.cue) > 8) report.lint.push('cue > 8 words'); }
// C4 (pull): thumb default wrapped; `over` allowed only as an option (3.1)
if (howto.handling.thumb.mode !== 'wrapped' || (howto.handling.thumb.options ?? []).some(o => !['over', 'wrapped'].includes(o.mode))) report.lint.push('C4 thumb rule');
// the hand's wrong poses sit clearly outside the right range (drawing check, 3.1.1): curled below 0, slip above 25
{ const [lo, hi] = howto.handling.wrist.ext, fm = 10;
  for (const fl of howto.handling.faults) { const e = fl.pose.wrist?.ext; if (e != null && e > lo - fm && e < hi + fm) report.lint.push(`fault ${fl.key}: wrist ${e} not clearly outside ${lo}..${hi}`); }
  const e0 = howto.handling.pose.wrist.ext; if (e0 < lo || e0 > hi) report.lint.push('right wrist outside range'); }

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

/* ---------- S2: hand zoom, one page (one fault, no thumb option on a V-handle) ---------- */
const mergePose = (a, b) => ({ ...a, ...b, wrist: { ...a.wrist, ...(b.wrist ?? {}) }, fingers: { ...a.fingers, ...(b.fingers ?? {}) }, handle: { ...a.handle, ...(b.handle ?? {}) }, load: { ...a.load, ...(b.load ?? {}) } });
function handZoom() {
  const z = howto.zooms.find(q => q.kind === 'hand'), h = howto.handling, fault = z.hand.wrong[0];
  const pair = renderHandPair({ uid: 'scr', camera: z.hand.camera, loadAxis: h.loadAxis, markers: fault.markers, right: z.hand.right,
    wrong: mergePose(z.hand.right, fault.pose), rightNote: z.rightNote, wrongNote: fault.label,
    alt: { right: z.alt.right, wrong: z.alt.wrong }, panelHeight: 282 });
  report.hand.p1 = pair.report;
  // The engine sets the bend value on the wedge's bisector, which in this drawing lands on the wedge's far edge (the
  // "30°" sat on the line). Move it to the other side of the forearm axis, above the wrist, clear of the wedge, the
  // axis and the hand (same treatment as the lateral raise's hand zoom).
  let svg = pair.svg;
  { const i = svg.indexOf('<g class="h-panel wrong">');
    const wj = svg.slice(i).match(/<circle class="h-joint wrist" cx="([\d.-]+)" cy="([\d.-]+)"/), n0 = svg;
    if (i >= 0 && wj) svg = svg.replace(/<text class="h-val m" x="[\d.-]+" y="[\d.-]+" text-anchor="\w+">(\d+°)<\/text>/, (m0, v) =>
      `<text class="h-val m" x="${+(+wj[1] - 5).toFixed(2)}" y="${+(+wj[2] - 30).toFixed(2)}" text-anchor="end">${v}</text>`);
    if (svg === n0) report.lint.push('hand: bend value not moved off the wedge'); }
  return `<section class="zoom" role="region" aria-labelledby="zh-${z.key}">${zoomTop(z)}<div class="hand-plate">${svg}</div>${captions(z.caption)}${feelLink(z)}</section>
  <p class="grip-line">${esc(h.gripLine)}</p>
  <p class="hint limit">${esc(h.wrist.limitText)}</p>`;
}

/* ---------- S3: posture zoom = two crops of the plate, at the plate's own camera ---------- */
const PANEL = 171, PH = 171;
const base = renderPlate(howto.plate, { id: 'base' });
const CAM = base.report.camera;                    // the fitted camera of the plate on screen; every crop reuses it
const H = howto.plate.body?.height ?? 1.75;
const mergeDeep = (a, b) => { if (b === undefined) return a; if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) { const o = { ...a }; for (const q of Object.keys(b)) o[q] = mergeDeep(a[q], b[q]); return o; } return b; };
const poseOf = ref => typeof ref === 'string' ? howto.plate.poses[ref] : mergeDeep(howto.plate.poses[ref.base], ref.pose);
// Equipment functions: the bar (and its cable) and the stack follow the pose, so they stay. The lean construction rays
// (a function that returns only 'line' items on the correct end pose) belong to the plate's measured arc, which a crop
// does not carry, so they go.
const LM_END = landmarksOf(howto.plate.poses.end, howto.plate.body?.height ?? 1.75);
const isRays = e => { const r = [].concat(e(LM_END, { pose: 'end', mistake: false, start: LM_END, q: null }) ?? []); return r.length > 0 && r.every(it => it.type === 'line'); };
const EQ = howto.plate.equipment.filter(e => typeof e !== 'function' || !isRays(e));
const shiftEq = (eq, ov) => !ov ? eq : eq.map(e => (typeof e !== 'function' && ov[e.type]) ? { ...e, at: [e.at[0], e.at[1] + (ov[e.type].dy ?? 0), e.at[2]] } : e);
function cropSpec(z, role) {
  const p = howto.plate, right = poseOf(z.right);
  // wrong.solid: the wrong crop draws the wrong pose alone, solid (no dashed overlay on the right pose). Used where the
  // two poses would cross each other (bar path: the arm and bar move across the head) and the overlay stops reading.
  const solidWrong = role === 'wrong' && z.wrong.solid, drawn = solidWrong ? poseOf(z.wrong) : right;
  const spec = { ...p, camera: { pxPerM: CAM.pxPerM, x0: CAM.x0, y0: CAM.y0 }, poses: { start: drawn, end: drawn },
    equipment: shiftEq(EQ, role === 'wrong' ? z.wrong.equipment : null),
    callouts: [], ghosts: { count: 0 }, trace: undefined, measure: undefined, checks: [],
    datum: [], mistake: undefined };
  if (role === 'wrong' && !solidWrong) spec.mistake = { pose: poseOf(z.wrong), parts: z.wrong.parts, guides: (z.guides ?? []).filter(g => g.kind !== 'level' && g.kind !== 'drop'), tells: [] };
  return spec;
}
const P = w => [CAM.x0 + w[2] * CAM.pxPerM, CAM.y0 - w[1] * CAM.pxPerM];   // side view, facing right (plate.mjs makeCamera)
function resolveRefs(spec, refs) {
  const lms = { end: landmarksOf(spec.poses.end, H), start: landmarksOf(spec.poses.start, H) };
  if (spec.mistake?.pose) lms.mistake = landmarksOf(mergeDeep(spec.poses.end, spec.mistake.pose), H);
  const res = (ref, pose = 'end') => {
    if (Array.isArray(ref)) return ref.length === 3 ? P(ref) : ref;
    if (typeof ref === 'string') return P(lms[pose][ref]);
    const pp = ref.pose === 'mistake' && !lms.mistake ? 'end' : (ref.pose ?? pose);   // solid wrong crop: its pose is 'end'
    const p = res(ref.at, pp), o = ref.off ?? [0, 0]; return [p[0] + o[0], p[1] + o[1]];
  };
  return refs.map(r => res(r));
}
function cropHalf(z, role) {
  const spec = cropSpec(z, role);
  const p = renderPlate(spec, { id: `${z.key}-${role}`, mistake: role === 'wrong' });
  const cam2 = p.report.camera;
  if (Math.abs(cam2.pxPerM - CAM.pxPerM) > 0.01 || Math.abs(cam2.x0 - CAM.x0) > 0.1) report.lint.push(`crop ${z.key}: camera differs from the plate`);
  // zoom-only overlay (5.2): 'level' = a dashed level line across the crop at a right-pose landmark (both crops);
  // 'drop' = an arrow from a right-pose point to a mistake-pose point (wrong crop only)
  const levels = (z.guides ?? []).filter(g => g.kind === 'level'), drops = role === 'wrong' ? (z.guides ?? []).filter(g => g.kind === 'drop') : [];
  const anchors = resolveRefs(spec, [(role === 'wrong' && z.crop.centerWrong) || z.crop.center, z.callout[role].anchor, ...levels.map(g => g.at), ...drops.flatMap(g => [g.from, g.to])]);
  const [cx, cy] = anchors[0], s = z.crop.sizePx, vx = cx - s / 2, vy = cy - s / 2, k = PANEL / s;
  // wrong.trim: [{ at, pose, off, r }] = plate-px circles cut out of the dashed fault outline only (added to the
  // engine's mistake mask), for a dash fragment the mask leaves where the fault outline dives under a limb
  const trims = role === 'wrong' ? (z.wrong.trim ?? []) : [], trimAt = resolveRefs(spec, trims);
  const cut = trims.map((t, i) => `<circle cx="${f(trimAt[i][0])}" cy="${f(trimAt[i][1])}" r="${t.r}" fill="#000"/>`).join('');
  const svg0 = cut ? p.svg.replace(/(<mask id="[^"]*-mmask"[\s\S]*?)(<\/mask>)/, `$1${cut}$2`) : p.svg;
  if (cut && svg0 === p.svg) report.lint.push(`crop ${z.key}: trim not applied (no mistake mask)`);
  const inner = svg0.replace(/<svg class="plate-svg"[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<rect width="358" height="358" fill="url\(#[^)]*\)"\/>/, '');
  const toPanel = ([x, y]) => [(x - vx) * k, (y - vy) * k];
  const c = z.callout[role], A = toPanel(anchors[1]), lns = c.text.split(/<br\s*\/?>/), w = capWidth(c.text), h = CAP_LH * lns.length;
  const occ = p.occ;
  // 'spine': a straight dashed guide along the back of the RIGHT pose (both crops), offset 3 px off the skin, away from
  // the body; `extend` lengthens it past each end (fractions of its length). Sampled as an obstacle for the label.
  const spines = (z.guides ?? []).filter(g => g.kind === 'spine'), spineAt = resolveRefs(spec, spines.flatMap(g => [g.from, g.to]));
  const spineSegs = spines.map((g, i) => { const a = toPanel(spineAt[2 * i]), b = toPanel(spineAt[2 * i + 1]), d = [b[0] - a[0], b[1] - a[1]], [e0, e1] = g.extend ?? [0, 0];
    const L = Math.hypot(...d), n = [d[1] / L * 3, -d[0] / L * 3];
    return [[a[0] - d[0] * e0 + n[0], a[1] - d[1] * e0 + n[1]], [b[0] + d[0] * e1 + n[0], b[1] + d[1] * e1 + n[1]]]; });
  // the zoom's own path guides are obstacles too (the plate's occupancy grid does not know them): sample them
  const cls0 = role === 'right' ? 'ok' : 'm';
  const guidePts = (z.guides ?? []).filter(g => g.kind === 'path' && g.role === role).flatMap(g => { const ps = g.pts.map(w => toPanel(P(w)));
    return ps.slice(1).flatMap((q, i) => Array.from({ length: 11 }, (_, j) => [ps[i][0] + (q[0] - ps[i][0]) * j / 10, ps[i][1] + (q[1] - ps[i][1]) * j / 10])); })
    .concat(spineSegs.flatMap(([a, b]) => Array.from({ length: 21 }, (_, j) => [a[0] + (b[0] - a[0]) * j / 20, a[1] + (b[1] - a[1]) * j / 20])));
  const figureHits = b => occ.count(vx + b.x0 / k, vy + b.y0 / k, vx + b.x1 / k, vy + b.y1 / k)
    + guidePts.filter(([x, y]) => x > b.x0 - 4 && x < b.x1 + 4 && y > b.y0 - 4 && y < b.y1 + 4).length;
  let best = null;
  for (let dy = -70; dy <= 70; dy += 2) for (let dx = -130; dx <= 130; dx += 2) {
    const b = { x0: A[0] + dx, y0: A[1] + dy, x1: A[0] + dx + w, y1: A[1] + dy + h };
    if (b.x0 < 8 || b.y0 < 8 || b.x1 > PANEL - 8 || b.y1 > PH - 8) continue;
    const hits = figureHits({ x0: b.x0 - 3, y0: b.y0 - 3, x1: b.x1 + 3, y1: b.y1 + 3 });
    const L = leaderFor(A, b), len = L.pts.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - L.pts[i][0], q[1] - L.pts[i][1]), 0);
    // callout.prefer 'left' | 'right': keep the label on that side of its anchor (e.g. behind the head, so the leader
    // does not cross the face)
    const side = c.prefer === 'left' ? Math.max(0, b.x1 - A[0]) : c.prefer === 'right' ? Math.max(0, A[0] - b.x0) : 0;
    const cost = hits * 400 + len + Math.max(0, 14 - len) * 20 + side * 10;
    if (!best || cost < best.cost) best = { b, L, cost, hits };
  }
  report.crops[`${z.key}.${role}`] = { drawnLabel: false, cropPx: [f(vx), f(vy), s], scale: f(k), label: c.text.replace(/<br\s*\/?>/g, ' '), box: Object.values(best.b).map(f), figureCells: best.hits,
    anchorInside: A[0] > 6 && A[0] < PANEL - 6 && A[1] > 6 && A[1] < PH - 6 };
  const cls = role === 'right' ? 'ok' : 'm';
  // 'path' guide: a dashed bar path in world points (side view), accent in the right crop, --mistake in the wrong one,
  // with an arrow head at its end. Only the guide whose role matches this crop is drawn.
  const paths = (z.guides ?? []).filter(g => g.kind === 'path' && g.role === role).map(g => {
    const ps = g.pts.map(w => toPanel(P(w))), n = ps.length, a = ps[n - 2], b = ps[n - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, t = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], q = [-t[1], t[0]];
    const d = 'M' + ps.map(([x, y]) => `${f(x)} ${f(y)}`).join('L');
    const head = `M${f(b[0] - t[0] * 6 + q[0] * 4)} ${f(b[1] - t[1] * 6 + q[1] * 4)}L${f(b[0])} ${f(b[1])}L${f(b[0] - t[0] * 6 - q[0] * 4)} ${f(b[1] - t[1] * 6 - q[1] * 4)}`;
    return `<path class="z-path ${cls}" d="${d}"/><path class="z-path-head ${cls}" d="${head}"/>`; }).join('');
  const sp = spineSegs.map(([a, b]) => `<path class="z-spine ${cls}" d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}"/>`).join('');
  const lv = sp + paths + levels.map((g, i) => `<path class="z-level ${cls}" d="M4 ${f(toPanel(anchors[2 + i])[1])}H${PANEL - 4}"/>`).join('');
  const dr = drops.map((g, i) => { const a = toPanel(anchors[2 + levels.length + 2 * i]), b = toPanel(anchors[3 + levels.length + 2 * i]);
    const x = a[0];   // drawn straight down at the start point's x: the drop is vertical
    return `<path class="z-drop" d="M${f(x)} ${f(a[1])}V${f(b[1] - 1)}"/><path class="z-drop-head" d="M${f(x - 4)} ${f(b[1] - 6)}L${f(x)} ${f(b[1])}L${f(x + 4)} ${f(b[1] - 6)}Z"/>`; }).join('');
  const label = lv + dr + `<circle class="z-anchor ${cls}" cx="${f(A[0])}" cy="${f(A[1])}" r="2.5"/>`;   // the words are the subtag under Right / Wrong (postureZoom), as on every posture zoom
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
    <div class="z-pair"><div>${head(true)}${cropHalf(z, 'right')}</div><div>${head(false)}${cropHalf(z, 'wrong')}</div></div>
    ${captions(z.caption)}${feelLink(z)}</section>`;
}

/* ---------- S4 / S6: the feel section ---------- */
function feelSection(openKey = null, all = false) {
  const F = howto.feel, open = F.rows.find(r => r.key === openKey);
  const watch = open ? (open.at.muscles ?? []).filter(m => F.watch.some(w => w.muscleId === m)) : [];
  const map = renderFeelMap({ primary: F.primary, secondary: F.secondary, avoid: watch, pain: open?.at.parts ?? [], views: ['front', 'back'], id: `feel-${openKey ?? 'rest'}` });
  // Pain parts (the wrist row): the engine tints them --mistake but its legend and TalkBack label do not name them, so
  // this render adds a "Where it may hurt" key and a label sentence (as the hanging leg raise render). The map has no
  // wrist region; the hand parts stand in for it, and the label says so.
  const pain = open?.at.parts?.length ? `Where it may hurt: ${open.where.replace(/^Your /, 'your ').replace(/^The /, 'the ')}, marked on the hands.` : '';
  const label = pain ? `${map.label} ${pain}` : map.label;
  const mapHtml = pain ? map.html.replace(`aria-label="${map.label}"`, `aria-label="${esc(label)}"`) : map.html;
  if (pain && mapHtml === map.html) report.lint.push('pain label not applied');
  const legend = renderFeelLegend({ avoid: watch.length > 0 }).replace(/<\/div>$/, pain
    ? `<span><svg class="feel-sw sw-pain" viewBox="0 0 14 14" aria-hidden="true"><rect x="1.5" y="1.5" width="11" height="11" rx="3"/></svg>Where it may hurt</span></div>` : '</div>');
  if (pain && !legend.includes('sw-pain')) report.lint.push('pain legend not applied');
  report.browser[`feel-${openKey ?? 'rest'}`] = { label, drawn: map.drawn, textOnly: map.textOnly };
  const rows = F.rows.map((r, i) => {
    const isOpen = r.key === openKey;
    if (i >= 3 && !isOpen && !all) return '';
    return `<li class="feel-row${isOpen ? ' open' : ''}"><button class="feel-row-btn" aria-expanded="${isOpen}">${esc(r.where)}${isOpen ? I.down(18) : I.chev(18)}</button>`
      + (isOpen ? `<div class="feel-row-body"><p><b>Usually means</b> ${esc(r.means)}</p><p><b>Fix</b> ${esc(r.fix)}</p>`
        + (r.zoom ? `<button class="feel-showme">Show me the ${esc(chipText(r.zoom).toLowerCase())}${I.chev(16)}</button>` : '')
        + (r.redFlag ? `<div class="red-flag">${I.alert(16)}<div><p>${esc(RED_FLAGS[r.redFlag].now)}</p><p>${esc(RED_FLAGS[r.redFlag].doctor)}</p></div></div>` : '') + `</div>` : '')
      + `</li>`;
  }).join('');
  const more = all ? 0 : F.rows.slice(3).filter(r => r.key !== openKey).length;
  return `<section class="feel-section" aria-labelledby="feel-h"><h3 class="eyebrow" id="feel-h">Where you should feel it</h3>
    ${mapHtml}
    ${legend}
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
.th-cell { display: grid; gap: 0; }
.th-cell figcaption { display: grid; gap: 1px; min-height: 36px; padding: 0 4px; }
.th-title { display: inline-flex; align-items: center; gap: 4px; font-size: var(--fs-small); font-weight: var(--fw-semibold); color: var(--text); }
.th-title svg { color: var(--accent); flex: none; }
.th-note { font-size: var(--fs-meta); line-height: var(--lh-meta); color: var(--text-2); }
.th-cell.def .th-note { color: var(--accent-text); }
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
.z-level { fill: none; stroke-width: 1; stroke-dasharray: 3 3; } .z-level.ok { stroke: var(--accent); } .z-level.m { stroke: var(--text-3); }
.z-path { fill: none; stroke-width: 1.5; stroke-dasharray: 4 3; stroke-linecap: round; } .z-path.ok { stroke: var(--accent); } .z-path.m { stroke: var(--mistake); }
.z-path-head { fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; } .z-path-head.ok { stroke: var(--accent); } .z-path-head.m { stroke: var(--mistake); }
.z-spine { fill: none; stroke-width: 1.25; stroke-dasharray: 4 3; stroke-linecap: round; } .z-spine.ok { stroke: var(--accent); } .z-spine.m { stroke: var(--text-3); }
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
.feel-sw.sw-pain rect { fill: color-mix(in srgb, var(--mistake) 20%, transparent); stroke: var(--mistake); stroke-width: 1.2; }
.red-flag { display: flex; gap: 8px; padding: 10px 12px; border-radius: var(--radius-md, 10px); border: 1px solid var(--border); color: var(--text-2); font-size: var(--fs-meta); line-height: var(--lh-meta); }
.red-flag svg { color: var(--text-2); flex: none; margin-top: 2px; }
.red-flag div { display: grid; gap: 4px; }
.feel-more { min-height: 44px; padding: 0 16px; border-radius: var(--radius-pill); border: 1px solid var(--border); color: var(--text-2); font-size: var(--fs-small); font-weight: var(--fw-medium); justify-self: start; }
`;
const page = (theme, body) => `<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=390, initial-scale=1"><title>${esc(howto.plate.name)}</title><style>${CSS}</style></head>
<body><svg width="0" height="0" style="position:absolute"><defs><pattern id="zdots" width="16" height="16" patternUnits="userSpaceOnUse"><rect x="7.5" y="7.5" width="1" height="1" class="zdot"/></pattern></defs></svg>
<style>.zdot{fill:var(--border-subtle)}</style>${body}</body></html>`;

const LAYERS = {
  'zoom-hand': () => chipRow('hand') + handZoom(),
  'zoom-back': () => chipRow('back') + postureZoom(howto.zooms.find(z => z.key === 'back')),
  'zoom-finish': () => chipRow('finish') + postureZoom(howto.zooms.find(z => z.key === 'finish')),
  feel: () => feelSection(null),
  'feel-more': () => feelSection(null, true),
  'feel-open-traps': () => feelSection('traps'),
  'feel-open-wrist': () => feelSection('wrist'),
  'feel-open-pinch': () => feelSection('pinch'),
  'feel-open-arms': () => feelSection('arms'),
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
