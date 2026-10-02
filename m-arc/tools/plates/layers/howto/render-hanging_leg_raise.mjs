// Render the How-to layers of the hanging leg raise: node howto/render-hanging_leg_raise.mjs [layer]
// Reads exercises/hanging_leg_raise.howto.mjs and writes out/hanging_leg_raise-howto-<layer>-<theme>.png (390 px wide
// sheet section, device scale 2) in Silent Black and Paper. Based on render-pull_up.mjs (same sheet pieces):
//   zoom-hand, zoom-hand-thumb                  (S2: Right vs curling and slipping out, thumb page: full vs thumbless)
//   zoom-pelvis, zoom-shoulders                 (S3: two crops of the plate, same camera as the plate)
//   feel, feel-open-hips, feel-open-low-back, feel-open-wrist, feel-more   (S4 at rest, S6 with a row open, rows expanded)
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
import { FRONT_PARTS } from '../engine/bodymap-parts.mjs';
import { capWidth, leaderFor, CAP_LH } from '../engine/layout.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), outDir = join(root, 'out');
mkdirSync(outDir, { recursive: true });
const ID = 'hanging_leg_raise';
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
// C7 (6.2): the rest of the copy lint, over every user-visible string
{
  const H_ = howto, F_ = H_.feel;
  const copy = [['gripLine', H_.handling.gripLine], ['limitText', H_.handling.wrist.limitText], ['width', H_.handling.width.text], ['cue', H_.handling.cue],
    ['feelLine', F_.feelLine], ['setupLine', H_.copy.setupLine], ['mistakeLine', H_.copy.mistakeLine],
    ...H_.setup.map((x, i) => [`setup ${i}`, x.text]), ...H_.posture.flatMap(p => [[`posture ${p.key}`, p.detail], [`posture ${p.key} label`, p.label]]),
    ...F_.rows.flatMap(r => [[`row ${r.key} where`, r.where], [`row ${r.key} means`, r.means], [`row ${r.key} fix`, r.fix]]),
    ...H_.zooms.flatMap(z => [[`zoom ${z.key} cap.r`, z.caption.right], [`zoom ${z.key} cap.w`, z.caption.wrong], [`zoom ${z.key} prompt`, z.feelPrompt ?? ''],
      [`zoom ${z.key} callouts`, Object.values(z.callout ?? {}).map(c => c.text.replace(/<br>/g, ' ')).join('. ')]]),
    ...THUMB_PAGE.flatMap(t => [[`thumb ${t.mode}`, t.title + '. ' + t.note]])];
  const BAN = [/\u2014/, /\s\u2013\s/, /!/, /%/, /;/, /\bet al\b/, /\(\w+ \d{4}\)/, /\bEMG\b/, /\bMVI?C\b/, /mind-muscle/i,
    /\bengag/i, /\bactivat/i, /\bfir(e|ing)\b/i, /\btorch/i, /\bblast/i, /\bsculpt/i, /\btoned?\b/i, /your core/i, /maximi[sz]e/i, /\boptimal/i, /optimi[sz]e/i,
    /\bultimate/i, /\bcrucial/i, /\bessential/i, /key to/i, /game changer/i, /powerhouse/i, /effortless/i, /seamless/i, /\belevate/i, /\bjourney/i, /\bsimply\b/i,
    /make sure/i, /\bensure/i, /it's important/i, /remember to/i, /focus on/i, /throughout the movement/i, /controlled manner/i, /proper form/i,
    /\bnot\b[^.,]{1,40}\bbut\b/i, /not just/i, /pectoralis|deltoid|latissimus|trapezius|rectus|supraspinatus|iliopsoas|erector/i, /\bpinky\b/i];
  for (const [w, t] of copy) {
    for (const b of BAN) if (b.test(t)) report.lint.push(`C7 ${w}: banned ${b}`);
    for (const sn of String(t).split(/(?<=[.!?])\s+/)) if (words(sn) > 25) report.lint.push(`C7 ${w}: sentence > 25 words`);
  }
  lint('feelLine', F_.feelLine, 40, 2); if (!/^You should feel this/.test(F_.feelLine)) report.lint.push('feelLine template');
  for (const k of ['gripLine']) lint(k, H_.handling[k], 45, 3);
  for (const k of ['setupLine', 'mistakeLine']) lint(k, H_.copy[k], 45, 3);
  if (words(H_.handling.cue) > 8) report.lint.push('cue > 8 words');
  for (const z of H_.zooms) for (const c of Object.values(z.callout ?? {})) if (words(c.text.replace(/<br>/g, ' ')) > 3) report.lint.push(`callout ${c.text} > 3 words`);
  const VERB = /^(Bend|Do|Start|Put|Pull|Keep|Pause|Use|Bring|Try|Set|Move|Go|Lower|Hang|Step|Stop)\b/;
  for (const r of F_.rows) if (!VERB.test(r.fix)) report.lint.push(`row ${r.key} fix does not start with a verb`);
  report.wordCounts = { feelLine: words(F_.feelLine), rows: Object.fromEntries(F_.rows.map(r => [r.key, [words(r.means), words(r.fix)]])) };
}

/* ---------- body map region correction (stomach), this render only ---------- */
// The app's src/svg/bodyMuscles.ts (from body-muscles by Ivan Vulovic, Apache-2.0, copied to engine/bodymap-parts.mjs)
// labels two stomach regions the wrong way round:
//   `abs-upper-left/right`  (muscle abs)      sit on the FLANKS, x 19.6-22.9 and 8.8-12.0, beside the lower abs;
//   `obliques-left/right`   (muscle obliques) are three blocks: two on the UPPER CENTRE of the stomach (the upper
//                            six-pack, x 16.3-18.8 and 12.9-15.3, y 27.8-34) and one small block on the side (x 19.8-21.3
//                            and 10.4-12.1).
// So `abs` painted the lower stomach plus the sides of the waist, and `obliques` painted the upper six-pack: the map
// contradicted the card ("from the ribs to below your belly button"; obliques "the sides of your waist") and C2 forbids a
// misleading region carrying a shimmer or map role. Correction, applied in this process only (engine files are not
// changed): the two central `obliques-*` blocks paint as abs, the side block and `abs-upper-*` paint as obliques.
// Result: Main = the whole central column from the ribs to below the navel; Also working = the flanks.
// FOLLOW-UPS (supervisor): make this a documented correction in engine/bodymap-parts.mjs (shared, needs the
// supervisor's OK) and fix the labels upstream in the app's src/svg/bodyMuscles.ts (the owner-facing map uses the same ids).
export const REGION_FIX = { swapToObliques: ['abs-upper-left', 'abs-upper-right'], splitObliques: ['obliques-left', 'obliques-right'] };
for (const id of REGION_FIX.swapToObliques) { const q = FRONT_PARTS.find(x => x.id === id); if (!q || q.muscle !== 'abs') throw new Error(`region fix: ${id} not abs`); q.muscle = 'obliques'; }
for (const id of REGION_FIX.splitObliques) {
  const i = FRONT_PARTS.findIndex(x => x.id === id), q = FRONT_PARTS[i];
  if (!q || q.muscle !== 'obliques') throw new Error(`region fix: ${id} not obliques`);
  const sub = q.d.split(/(?=M )/).map(t => t.trim());
  if (sub.length !== 3) throw new Error(`region fix: ${id} has ${sub.length} blocks, expected 3`);
  const sideOf = t => Math.abs(+t.match(/M ([\d.]+)/)[1] - 15.845);        // distance of the block's start from the midline
  const order = sub.map((t, k) => [sideOf(t), k]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const central = order.slice(0, 2).map(k => sub[k]), lateral = sub[order[2]];
  const sd = id.endsWith('left') ? 'left' : 'right';
  FRONT_PARTS.splice(i, 1, { id: `abs-upper-central-${sd}`, muscle: 'abs', d: central.join(' ') }, { id: `obliques-side-${sd}`, muscle: 'obliques', d: lateral });
}
report.regionFix = FRONT_PARTS.filter(x => x.muscle === 'abs' || x.muscle === 'obliques').map(x => `${x.id}=${x.muscle}`);

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
const PAGES = [{ key: 'p1', label: 'Slipping out' }, { key: 'thumb', label: 'Thumb' }];
const pager = active => `<div class="pager" role="tablist" aria-label="Hand pages">${PAGES.map((p, i) =>
  `<button class="pager-btn" role="tab" aria-selected="${p.key === active}" aria-label="${esc(`${p.label}, page ${i + 1} of ${PAGES.length}`)}">${esc(p.label)}</button>`).join('')}</div>`;
const mergePose = (a, b) => ({ ...a, ...b, wrist: { ...a.wrist, ...(b.wrist ?? {}) }, fingers: { ...a.fingers, ...(b.fingers ?? {}) }, handle: { ...a.handle, ...(b.handle ?? {}) }, load: { ...a.load, ...(b.load ?? {}) } });
function handZoom(page) {
  const z = howto.zooms.find(q => q.kind === 'hand'), h = howto.handling;
  let body;
  if (page === 'thumb') body = thumbPage();
  else {
    const fault = z.hand.wrong[page === 'p1' ? 0 : 1];
    const pair = renderHandPair({ uid: `hlr-${page}`, camera: z.hand.camera, loadAxis: h.loadAxis, markers: fault.markers, right: z.hand.right,
      wrong: mergePose(z.hand.right, fault.pose), rightNote: 'Base of fingers', wrongNote: fault.label,
      alt: { right: z.alt.right, wrong: page === 'p1' ? z.alt.wrong : z.alt.wrong2 }, panelHeight: 250 });
    report.hand[page] = pair.report;
    const svg = pair.svg;
    body = `<div class="hand-plate">${svg}</div>${captions(page === 'p1' ? z.caption : z.captionPage2)}`;
  }
  return `<section class="zoom" role="region" aria-labelledby="zh-${z.key}">${zoomTop(z)}${body}${pager(page)}${feelLink(z)}</section>
  <p class="grip-line">${esc(h.gripLine)}</p>
  <p class="hint limit">${esc(h.wrist.limitText)}</p>`;
}
// Thumb page: 2 x 2 small hands, the same pose with each thumb mode, no load line (the page is about the thumb).
// Every cell is drawn at one scale (K px per mm) and cropped to the hand plus a short piece of forearm, at 1:1, so
// strokes keep the plate's weights and the four thumbs compare directly.
const K = 0.95, CW = 171, CH = 176;
const handBox = (svg, uid) => { let b = [1e9, 1e9, -1e9, -1e9];
  for (const m of svg.matchAll(new RegExp(`<path id="${uid}-([a-z0-9-]+)" d="([^"]+)"`, 'g'))) { if (m[1] === 'fore') continue;
    const n = m[2].match(/-?[\d.]+/g).map(Number); for (let i = 0; i < n.length - 1; i += 2) b = [Math.min(b[0], n[i]), Math.min(b[1], n[i + 1]), Math.max(b[2], n[i]), Math.max(b[3], n[i + 1])]; }
  return b; };
function thumbPage() {
  const cells = THUMB_PAGE.map((t, i) => {
    const probe = renderHand(t.pose, { width: CW, height: 900, uid: `th${i}` });
    const W = 20 + (CW - 20) * K / probe.report.scalePxPerMm;          // width-limited fit: k grows with the width
    const r = renderHand(t.pose, { width: W, height: 900, uid: `th${i}`, role: 'right', alt: t.alt });
    report.hand[`thumb-${t.mode}`] = r.report;
    const b = handBox(r.svg, `th${i}`), wr = r.svg.match(/h-joint wrist" cx="([\d.]+)" cy="([\d.]+)"/).map(Number);
    const top = Math.min(b[1], wr[2]), bot = Math.max(b[3], wr[2] + 30), y0 = Math.min(b[1] - 8, (top + bot) / 2 - CH / 2), x0 = (b[0] + b[2]) / 2 - CW / 2;
    report.hand[`thumb-${t.mode}`].cropFits = b[3] <= y0 + CH && b[1] >= y0 && b[0] >= x0 && b[2] <= x0 + CW;
    const svg = r.svg.replace(/viewBox="[^"]*"/, `viewBox="${f(x0)} ${f(y0)} ${CW} ${CH}"`).replace(/<path class="h-load[^"]*"[^>]*\/>/g, '').replace(/<path class="h-load-head[^"]*"[^>]*\/>/g, '')
      .replace(/<circle class="h-contact[^"]*"[^>]*\/>/g, '').replace(/<path class="h-tick"[^>]*\/>/g, '');
    return `<figure class="th-cell${t.default ? ' def' : ''}"><figcaption><span class="th-title">${t.default ? I.check(16) : ''}${esc(t.title)}</span><span class="th-note">${esc(t.note)}</span></figcaption>${svg}</figure>`;
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
function cropSpec(z, role) {
  const p = howto.plate, right = poseOf(z.right);
  // `wrongAlone` (pelvis curl): the wrong crop draws the wrong pose by itself, solid, so the two pelvis positions
  // compare side by side. Drawn dashed over the right pose, two whole trunks and four thighs crossed each other.
  // `view: 'back'` (Shoulders): the pull-up's "Seen from behind" drawing (render-pull_up.mjs): the same pose, same
  // scale and height, drawn centred with the engine's front-view outline (a symmetric hang with no face reads the same
  // from behind). From the side the near arm hides the head and the shoulder tops, so the shrug cannot be seen there.
  const back = z.view === 'back';
  const own = role === 'wrong' && (z.wrongAlone || z.wrong.solid) ? poseOf(z.wrong) : right;
  const spec = { ...p, camera: camOf(z), poses: { start: own, end: own },
    equipment: z.equipment ?? p.equipment.filter(e => typeof e !== 'function'),      // the plate's hidden-line overlay belongs to its two-pose picture
    callouts: [], ghosts: { count: 0 }, trace: undefined, measure: undefined, checks: [],
    datum: [], mistake: undefined, ...(back ? { view: 'front', viewLabel: 'Back view', marks: [] } : {}) };
  if (role === 'wrong' && !z.wrongAlone && !z.wrong.solid) spec.mistake = { pose: poseOf(z.wrong), parts: z.wrong.parts, guides: (z.guides ?? []).filter(g => g.kind !== 'level' && g.kind !== 'drop'), tells: [] };
  return spec;
}
const P = w => [CAM.x0 + w[2] * CAM.pxPerM, CAM.y0 - w[1] * CAM.pxPerM];   // side view, facing right (plate.mjs makeCamera)
const camOf = z => z.view === 'back' ? { pxPerM: CAM.pxPerM, x0: 179, y0: CAM.y0 } : { pxPerM: CAM.pxPerM, x0: CAM.x0, y0: CAM.y0 };
const projOf = z => z.view === 'back' ? (w => [179 + w[0] * CAM.pxPerM, CAM.y0 - w[1] * CAM.pxPerM]) : P;
function resolveRefs(spec, refs, z) {
  // 'right' = the zoom's right pose in every crop, so a `wrongAlone` crop can still show where the right pose was
  const lms = { end: landmarksOf(spec.poses.end, H), start: landmarksOf(spec.poses.start, H), right: landmarksOf(poseOf(z.right), H) };
  if (spec.mistake?.pose) lms.mistake = landmarksOf(mergeDeep(spec.poses.end, spec.mistake.pose), H);
  if (z.outlines) for (const k of Object.keys(lms)) Object.assign(lms[k], z.outlines(lms[k]).points);   // e.g. the shoulder blades
  const P = projOf(z);
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
  const cam2 = p.report.camera;
  if (Math.abs(cam2.pxPerM - CAM.pxPerM) > 0.01 || Math.abs(cam2.x0 - camOf(z).x0) > 0.1) report.lint.push(`crop ${z.key}: camera differs from the plate`);
  // zoom-only overlay (5.2): 'level' = a dashed level line across the crop at a right-pose landmark (both crops);
  // 'drop' = an arrow from a right-pose point to a mistake-pose point (wrong crop only)
  const levels = (z.guides ?? []).filter(g => g.kind === 'level'), drops = role === 'wrong' ? (z.guides ?? []).filter(g => g.kind === 'drop') : [];
  const anchors = resolveRefs(spec, [z.crop.center, z.callout[role].anchor, ...levels.map(g => g.at), ...drops.flatMap(g => [g.from, g.to])], z);
  const [cx, cy] = anchors[0], s = z.crop.sizePx, vx = cx - s / 2, vy = cy - s / 2, k = PANEL / s;
  const inner = p.svg.replace(/<svg class="plate-svg"[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<rect width="358" height="358" fill="url\(#[^)]*\)"\/>/, '');
  const toPanel = ([x, y]) => [(x - vx) * k, (y - vy) * k];
  const c = z.callout[role], A = toPanel(anchors[1]), lns = c.text.split(/<br\s*\/?>/), w = capWidth(c.text), h = CAP_LH * lns.length;
  const occ = p.occ;
  const figureHits = b => occ.count(vx + b.x0 / k, vy + b.y0 / k, vx + b.x1 / k, vy + b.y1 / k);
  // zoom-only overlay first, so the label keeps off it too (its box counts as figure; a leader through it costs)
  const ov = z.pelvisGuide ? pelvisOverlay(spec, role, toPanel, k) : null;
  const ovHit = b => ov && b.x0 < ov.box[2] && ov.box[0] < b.x1 && b.y0 < ov.box[3] && ov.box[1] < b.y1 ? 1 : 0;
  const segHitsBox = (pts, B) => { if (!B) return 0; let n = 0; for (let i = 1; i < pts.length; i++) for (let t = 0; t <= 1; t += 0.05) {
    const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t;
    if (x > B[0] && x < B[2] && y > B[1] && y < B[3]) n++; } return n; };
  const guideBoxes = [...levels.map((g, i) => { const y = toPanel(anchors[2 + i])[1]; return [0, y - 1, PANEL, y + 1]; }),
    ...drops.map((g, i) => { const a = toPanel(anchors[2 + levels.length + 2 * i]), q = toPanel(anchors[3 + levels.length + 2 * i]); return [a[0] - 5, Math.min(a[1], q[1]), a[0] + 5, Math.max(a[1], q[1])]; })];
  let best = null;
  for (let dy = -70; dy <= 70; dy += 2) for (let dx = -130; dx <= 130; dx += 2) {
    const b = { x0: A[0] + dx, y0: A[1] + dy, x1: A[0] + dx + w, y1: A[1] + dy + h };
    if (b.x0 < 8 || b.y0 < 8 || b.x1 > PANEL - 8 || b.y1 > PH - 8) continue;
    const hits = figureHits({ x0: b.x0 - 3, y0: b.y0 - 3, x1: b.x1 + 3, y1: b.y1 + 3 });
    const L = leaderFor(A, b), len = L.pts.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - L.pts[i][0], q[1] - L.pts[i][1]), 0);
    const oh = ovHit({ x0: b.x0 - 3, y0: b.y0 - 3, x1: b.x1 + 3, y1: b.y1 + 3 }), ol = segHitsBox(L.pts, ov?.box);
    // the zoom-only level lines and drop arrows count as figure too: a label never sits on them
    const gb = { x0: b.x0 - 3, y0: b.y0 - 3, x1: b.x1 + 3, y1: b.y1 + 3 };
    const gHit = guideBoxes.filter(G => gb.x0 < G[2] && G[0] < gb.x1 && gb.y0 < G[3] && G[1] < gb.y1).length;
    const cost = (hits + oh * 50 + gHit * 50) * 400 + len + Math.max(0, 14 - len) * 20 + ol * 40;
    if (!best || cost < best.cost) best = { b, L, cost, hits };
  }
  report.crops[`${z.key}.${role}`] = { drawnLabel: false, cropPx: [f(vx), f(vy), s], scale: f(k), label: c.text.replace(/<br\s*\/?>/g, ' '), box: Object.values(best.b).map(f), figureCells: best.hits,
    anchorInside: A[0] > 6 && A[0] < PANEL - 6 && A[1] > 6 && A[1] < PH - 6 };
  const cls = role === 'right' ? 'ok' : 'm';
  const lv = levels.map((g, i) => `<path class="z-level ${g.tone === 'neutral' ? 'n' : cls}" d="M4 ${f(toPanel(anchors[2 + i])[1])}H${PANEL - 4}"/>`).join('');
  const dr = drops.map((g, i) => { const a = toPanel(anchors[2 + levels.length + 2 * i]), b = toPanel(anchors[3 + levels.length + 2 * i]);
    const x = a[0];   // drawn straight down at the start point's x: the drop is vertical
    return `<path class="z-drop" d="M${f(x)} ${f(a[1])}V${f(b[1] - 1)}"/><path class="z-drop-head" d="M${f(x - 4)} ${f(b[1] - 6)}L${f(x)} ${f(b[1])}L${f(x + 4)} ${f(b[1] - 6)}Z"/>`; }).join('');
  // outlines (the shoulder blades) of the pose this crop shows: accent in Right, --mistake in Wrong
  const ol = z.outlines ? z.outlines(landmarksOf(spec.poses.end, H)).lines.map(o =>
    `<path class="z-ol ${o.kind} ${cls}" d="M${o.pts.map(w => toPanel(projOf(z)(w)).map(f).join(' ')).join('L')}"/>`).join('') : '';
  const label = lv + dr + ol + `<circle class="z-anchor ${cls}" cx="${f(A[0])}" cy="${f(A[1])}" r="2.5"/>`;   // the words are the subtag under Right / Wrong (postureZoom), as on every posture zoom
  const overlay = ov ? ov.svg : '';
  const svg = `<svg class="z-crop" viewBox="0 0 ${PANEL} ${PH}" role="img" aria-label="${esc(role === 'right' ? 'Right: ' + z.alt.right : 'Wrong: ' + z.alt.wrong)}" xmlns="http://www.w3.org/2000/svg">
    <rect class="z-bg" width="${PANEL}" height="${PH}" fill="url(#zdots)"/>
    <defs><clipPath id="zc-${z.key}-${role}"><rect width="${PANEL}" height="${PH}" rx="10"/></clipPath></defs>
    <g clip-path="url(#zc-${z.key}-${role})"><svg x="0" y="0" width="${PANEL}" height="${PH}" aria-hidden="true" viewBox="${f(vx)} ${f(vy)} ${s} ${s}" class="z-plate">${inner}</svg></g>
    <rect class="z-frame" x=".5" y=".5" width="${PANEL - 1}" height="${PH - 1}" rx="10"/>${overlay}${label}</svg>`;
  report.crops[`${z.key}.${role}`].issues = p.report.issues.filter(i => !/^label|^check/.test(i));
  return `<div class="plate z-wrap">${svg}</div>`;
}
// Pelvis guide (card zoom "pelvis curl": "the pelvis drawn as a bowl and a dashed vertical reference line"). The bowl
// is a thin open outline in the pelvis frame, tipped by the pose's own pelvis tilt (SPEC.md 3: tilt + forward), so a
// posterior tilt tips the rim back and an anterior tilt tips it forward against the same dashed vertical. Right crop:
// the right pose's bowl in accent. Wrong crop (drawn alone, `wrongAlone`): the wrong pose's bowl in the mistake colour.
// Centre: between the hip joint and the sacrum, where the pelvis sits in this side view.
function pelvisOverlay(spec, role, toPanel, k) {
  const pose = spec.mistake ? mergeDeep(spec.poses.end, spec.mistake.pose) : spec.poses.end;
  const lm = landmarksOf(pose, H), t = (pose.root?.tilt ?? 0) * Math.PI / 180;
  const hip = lm['hip.r'], sac = lm.sacrum;
  const c = [0, hip[1] + (sac[1] - hip[1]) * 0.45 + 0.01, hip[2] + (sac[2] - hip[2]) * 0.45];
  const up = [0, Math.cos(t), Math.sin(t)], fw = [0, -Math.sin(t), Math.cos(t)];     // world (y, z): pelvis up, pelvis forward
  const W = (a, b) => [0, c[1] + up[1] * a + fw[1] * b, c[2] + up[2] * a + fw[2] * b];   // a along up, b along forward (m)
  const px = w => toPanel(P(w));
  // bowl: rim 16 cm, round bottom 6.5 cm deep (about the body's depth at the waist, SPEC.md 2)
  const bowl = Array.from({ length: 13 }, (_, i) => { const a = Math.PI * i / 12; return [0.04 - 0.065 * Math.sin(a), -0.065 * Math.cos(a)]; }).map(([a, b]) => px(W(a, b)));
  const rim = [px(W(0.04, -0.08)), px(W(0.04, 0.08))];
  const cs = px(c), vx = cs[0];
  const cls = role === 'right' ? 'ok' : 'm';
  const d = 'M' + bowl.map(q => q.map(f).join(' ')).join('L');
  const v0 = cs[1] - 0.2 * CAM.pxPerM * k, v1 = cs[1] + 0.1 * CAM.pxPerM * k, all = [...bowl, ...rim];
  const box = [Math.min(vx, ...all.map(q => q[0])) - 2, Math.min(v0, ...all.map(q => q[1])) - 2, Math.max(vx, ...all.map(q => q[0])) + 2, Math.max(v1, ...all.map(q => q[1])) + 2];
  return { box, svg: `<g class="z-pelvis ${cls}"><path class="z-vert" d="M${f(vx)} ${f(v0)}V${f(v1)}"/>`
    + `<path class="z-bowl" d="${d}"/><path class="z-rim" d="M${rim.map(q => q.map(f).join(' ')).join('L')}"/></g>` };
}
function postureZoom(z) {
  const sub = role => z.callout[role].text.replace(/<br\s*\/?>/g, ' ');   // the crop's own label, printed once under the word
  const head = ok => `<div class="z-head ${ok ? 'ok' : 'm'}">${ok ? I.check(18) : I.x(18)}<b>${ok ? 'Right' : 'Wrong'}</b></div><div class="z-sub ${ok ? 'ok' : 'm'}">${esc(sub(ok ? 'right' : 'wrong').toUpperCase())}</div>`;
  return `<section class="zoom" role="region" aria-labelledby="zh-${z.key}">${zoomTop(z)}
    ${z.camLabel ? `<div class="th-cam eyebrow z-cam">${esc(z.camLabel)}</div>` : ''}<div class="z-pair${z.camLabel ? ' has-cam' : ''}"><div>${head(true)}${cropHalf(z, 'right')}</div><div>${head(false)}${cropHalf(z, 'wrong')}</div></div>
    ${captions(z.caption)}${feelLink(z)}</section>`;
}

/* ---------- S4 / S6: the feel section ---------- */
function feelSection(openKey = null, showAll = false) {
  const F = howto.feel, open = F.rows.find(r => r.key === openKey);
  const watch = open ? (open.at.muscles ?? []).filter(m => F.watch.some(w => w.muscleId === m)) : [];
  const map = renderFeelMap({ primary: F.primary, secondary: F.secondary, avoid: watch, pain: open?.at.parts ?? [], views: ['front', 'back'], id: `feel-${openKey ?? 'rest'}` });
  // Pain parts (the wrist row): the engine draws them in --mistake but its legend and label do not name them, so this
  // render adds a "Where it hurts" key and a TalkBack sentence. The map has no wrist region: the hand parts stand in for
  // the wrist (engine/bodymap-parts.mjs has hand-*, no wrist-*), and the label says so.
  const pain = open?.at.parts?.length ? `Where it hurts: ${open.where.replace(/^The /, 'the ').toLowerCase()}, marked on the hands.` : '';
  const label = pain ? `${map.label} ${pain}` : map.label;
  const mapHtml = pain ? map.html.replace(`aria-label="${map.label}"`, `aria-label="${esc(label)}"`) : map.html;
  if (pain && mapHtml === map.html) report.lint.push('pain label not applied');
  const legend = renderFeelLegend({ avoid: watch.length > 0 }).replace(/<\/div>$/, pain
    ? `<span><svg class="feel-sw sw-pain" viewBox="0 0 14 14" aria-hidden="true"><rect x="1.5" y="1.5" width="11" height="11" rx="3"/></svg>Where it hurts</span></div>` : '</div>');
  report.browser[`feel-${openKey ?? 'rest'}`] = { label, drawn: map.drawn, textOnly: map.textOnly };
  const rows = F.rows.map((r, i) => {
    const isOpen = r.key === openKey;
    if (i >= 3 && !isOpen && !showAll) return '';
    return `<li class="feel-row${isOpen ? ' open' : ''}"><button class="feel-row-btn" aria-expanded="${isOpen}">${esc(r.where)}${isOpen ? I.down(18) : I.chev(18)}</button>`
      + (isOpen ? `<div class="feel-row-body"><p><b>Usually means</b> ${esc(r.means)}</p><p><b>Fix</b> ${esc(r.fix)}</p>`
        + (r.zoom ? `<button class="feel-showme">Show me the ${esc(chipText(r.zoom).toLowerCase())}${I.chev(16)}</button>` : '')
        + (r.redFlag ? `<div class="red-flag">${I.alert(16)}<div><p>${esc(RED_FLAG.now)}</p><p>${esc(RED_FLAG.doctor)}</p></div></div>` : '') + `</div>` : '')
      + `</li>`;
  }).join('');
  const more = showAll ? 0 : F.rows.slice(3).filter(r => r.key !== openKey).length;
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
.z-level { fill: none; stroke-width: 1; stroke-dasharray: 3 3; } .z-level.ok { stroke: var(--accent); } .z-level.m { stroke: var(--text-3); } .z-level.n { stroke: var(--text-3); stroke-dasharray: 1 3; }
.z-ol { fill: none; stroke-width: 1.25; stroke-linejoin: round; stroke-linecap: round; } .z-ol.ridge { stroke-width: .9; }
.z-ol.ok { stroke: var(--accent); } .z-ol.m { stroke: var(--mistake); stroke-dasharray: 3 2; }
.z-cam { padding: 12px 0 0; } .z-pair.has-cam { padding-top: 6px; }
.z-drop { fill: none; stroke: var(--mistake); stroke-width: 1.5; stroke-linecap: round; } .z-drop-head { fill: var(--mistake); }
.z-leader { fill: none; stroke-width: .75; } .z-leader.ok { stroke: var(--accent); } .z-leader.m { stroke: var(--mistake); }
.z-anchor.ok { fill: var(--accent); } .z-anchor.m { fill: var(--mistake); }
.z-callout { font-family: var(--font); font-size: var(--fs-cap); letter-spacing: var(--ls-cap); font-weight: var(--fw-semibold); }
.z-callout.ok { fill: var(--accent-text); } .z-callout.m { fill: var(--mistake); }
.z-pelvis .z-vert { stroke: var(--text-2); stroke-width: 1; stroke-dasharray: 3 3; fill: none; }
.z-pelvis .z-bowl, .z-pelvis .z-rim { fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.z-pelvis.ok .z-bowl, .z-pelvis.ok .z-rim { stroke: var(--accent); } .z-pelvis.m .z-bowl, .z-pelvis.m .z-rim { stroke: var(--mistake); }
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
.feel-sw.sw-pain rect { fill: color-mix(in srgb, var(--mistake) 20%, transparent); stroke: var(--mistake); stroke-width: 1.2; }
.feel-more { min-height: 44px; padding: 0 16px; border-radius: var(--radius-pill); border: 1px solid var(--border); color: var(--text-2); font-size: var(--fs-small); font-weight: var(--fw-medium); justify-self: start; }
`;
const page = (theme, body) => `<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=390, initial-scale=1"><title>${esc(howto.plate.name)}</title><style>${CSS}</style></head>
<body><svg width="0" height="0" style="position:absolute"><defs><pattern id="zdots" width="16" height="16" patternUnits="userSpaceOnUse"><rect x="7.5" y="7.5" width="1" height="1" class="zdot"/></pattern></defs></svg>
<style>.zdot{fill:var(--border-subtle)}</style>${body}</body></html>`;

const LAYERS = {
  'zoom-hand': () => chipRow('hand') + handZoom('p1'),
  'zoom-hand-thumb': () => chipRow('hand') + handZoom('thumb'),
  'zoom-pelvis': () => chipRow('pelvis') + postureZoom(howto.zooms.find(z => z.key === 'pelvis')),
  'zoom-shoulders': () => chipRow('shoulders') + postureZoom(howto.zooms.find(z => z.key === 'shoulders')),
  feel: () => feelSection(null),
  'feel-open-hips': () => feelSection('hips'),
  'feel-open-low-back': () => feelSection('low-back'),
  'feel-open-wrist': () => feelSection('wrist', true),
  'feel-more': () => feelSection(null, true),
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
