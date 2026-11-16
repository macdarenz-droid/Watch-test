// Render the How-to layers of the lat pulldown: node howto/render-lat_pulldown.mjs [layer]
// Reads exercises/lat_pulldown.howto.mjs and writes out/lat_pulldown-howto-<layer>-<theme>.png (390 px wide sheet
// section, device scale 2) in Silent Black and Paper:
//   zoom-hand, zoom-hand-p2, zoom-hand-thumb   (S2: Right vs curled and squeezed, Right vs slipping out, thumb page)
//   zoom-pad, zoom-path                        (S3: two crops of the plate, same camera as the plate)
//   feel, feel-open-arms, feel-open-wrist      (S4 at rest, S6 with a row open)
// Adapted from howto/render-pull_up.mjs (same sheet pieces and checks).
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
const ID = 'lat_pulldown';
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

/* ---------- S2: hand zoom, three pages ---------- */
const PAGES = [{ key: 'p1', label: 'Curled wrist' }, { key: 'p2', label: 'Slipping out' }, { key: 'thumb', label: 'Thumb' }];
const pager = active => `<div class="pager" role="tablist" aria-label="Hand pages">${PAGES.map((p, i) =>
  `<button class="pager-btn" role="tab" aria-selected="${p.key === active}" aria-label="${esc(`${p.label}, page ${i + 1} of ${PAGES.length}`)}">${esc(p.label)}</button>`).join('')}</div>`;
const mergePose = (a, b) => ({ ...a, ...b, wrist: { ...a.wrist, ...(b.wrist ?? {}) }, fingers: { ...a.fingers, ...(b.fingers ?? {}) }, handle: { ...a.handle, ...(b.handle ?? {}) }, load: { ...a.load, ...(b.load ?? {}) } });
// The two hand pages share ONE fit, so paging changes only the Wrong half: every page is drawn at the smallest of the
// pages' own scales (each half scaled about its wrist), the Right hand is centred in its column at the same place on
// every page, and the Wrong hand is centred in its column at the same wrist height. The engine's pair SVG is taken
// apart and put back together here (the engine is not changed). An orientation row (Face -> Machine) sits under the
// camera label (S2), so the header grows by ORIENT_H.
const PW = (358 - 16) / 2, ORIENT_H = 16;
const nums = s => s.match(/-?[\d.]+/g).map(Number);
const partBox = (svg, uid) => { let b = [1e9, 1e9, -1e9, -1e9];
  for (const m of svg.matchAll(new RegExp(`<path id="${uid}-[a-z0-9-]+" d="([^"]+)"`, 'g'))) { const n = nums(m[1]);
    for (let i = 0; i < n.length - 1; i += 2) b = [Math.min(b[0], n[i]), Math.min(b[1], n[i + 1]), Math.max(b[2], n[i]), Math.max(b[3], n[i + 1])]; }
  return b; };
let HAND_PAIRS = null;
function handPairs() {
  if (HAND_PAIRS) return HAND_PAIRS;
  const z = howto.zooms.find(q => q.kind === 'hand'), h = howto.handling;
  const raw = ['p1', 'p2'].map((page, i) => {
    const fault = z.hand.wrong[i];
    const pair = renderHandPair({ uid: `lp-${page}`, camera: z.hand.camera, loadAxis: h.loadAxis, markers: fault.markers, right: z.hand.right,
      wrong: mergePose(z.hand.right, fault.pose), rightNote: z.rightNote, wrongNote: fault.label,
      alt: { right: z.alt.right, wrong: i === 0 ? z.alt.wrong : z.alt.wrong2 }, panelHeight: 282 });
    const [wr, ww] = [...pair.svg.matchAll(/h-joint wrist" cx="([\d.]+)" cy="([\d.]+)"/g)].map(m => [+m[1], +m[2]]);
    return { page, fault, pair, k: pair.report.scalePxPerMm, wr, ww, bR: partBox(pair.svg, `lp-${page}-r`), bW: partBox(pair.svg, `lp-${page}-w`) };
  });
  const kc = Math.min(...raw.map(r => r.k)), ref = raw.find(r => r.k === kc);
  const rel = (b, w, s) => [(b[0] - w[0]) * s, (b[1] - w[1]) * s, (b[2] - w[0]) * s, (b[3] - w[1]) * s];
  const bR0 = rel(ref.bR, ref.wr, 1), Ty = ref.wr[1];                    // wrist height of the page drawn at kc
  const TR = [PW / 2 - (bR0[0] + bR0[2]) / 2, Ty];
  HAND_PAIRS = Object.fromEntries(raw.map(r => {
    const s = kc / r.k, bW = rel(r.bW, r.ww, s), TW = [PW + 16 + PW / 2 - (bW[0] + bW[2]) / 2, Ty];
    return [r.page, { ...r, s, TR, TW, map: (p, w, T) => [T[0] + (p[0] - w[0]) * s, T[1] + (p[1] - w[1]) * s] }];
  }));
  return HAND_PAIRS;
}
function sharedPairSvg(page) {
  const P = handPairs()[page], svg = P.pair.svg;
  const g0 = svg.indexOf('<g class="h-panel right">'), g1 = svg.indexOf('</g><g class="h-panel wrong">') + 4;
  const labelsAt = svg.search(/(<text class="h-val[^>]*>[^<]*<\/text>)*<\/svg>$/);
  const rightG = svg.slice(g0, g1);
  let wrongG = svg.slice(g1, labelsAt);
  const labels = svg.slice(labelsAt, -'</svg>'.length);
  // Slipping out: the load line starts at the bar and ends at wrist height (the bar pulls the hand back; below the wrist
  // the line would run in empty space beside the forearm, because the bent-back hand sits far in front of it).
  if (P.fault.markers.includes('slip-arrow')) {
    const line = wrongG.match(/<path class="h-load m" d="([^"]+)"\/>/), head = wrongG.match(/<path class="h-load-head m" d="([^"]+)"\/>/);
    const hn = nums(head[1]), tipY = Math.max(hn[1], hn[3], hn[5]), dy = P.ww[1] - tipY, ln = nums(line[1]);
    wrongG = wrongG.replace(line[0], `<path class="h-load m" d="M${ln[0]} ${ln[1]}L${ln[2]} ${f(ln[3] + dy)}"/>`)
      .replace(head[0], `<path class="h-load-head m" d="M${hn[0]} ${f(hn[1] + dy)}L${hn[2]} ${f(hn[3] + dy)}L${hn[4]} ${f(hn[5] + dy)}Z"/>`);
  }
  // Bend label (Curled wrist): moved from the arc's middle (where it sat on the back-of-hand outline) to the left of
  // the straight (dotted) forearm line, level with the arc; it also gets a surface halo (CSS .h-val).
  const lab = [...labels.matchAll(/<text class="(h-val[^"]*)" x="([\d.-]+)" y="([\d.-]+)" text-anchor="[a-z]+">([^<]*)<\/text>/g)].map(m => {
    const wrong = /\bm\b/.test(m[1]), w = wrong ? P.ww : P.wr;
    const [x, y] = P.map([wrong ? w[0] - 7 : +m[2], +m[3]], w, wrong ? P.TW : P.TR);
    return `<text class="${m[1]}" x="${f(x)}" y="${f(y)}" text-anchor="${wrong ? 'end' : 'middle'}">${m[4]}</text>`; }).join('');
  const tf = (w, T) => `translate(${f(T[0])} ${f(T[1])}) scale(${+P.s.toFixed(4)}) translate(${f(-w[0])} ${f(-w[1])})`;
  const W = 358, Hh = +svg.match(/viewBox="0 0 \d+ ([\d.]+)"/)[1], H2 = Hh + ORIENT_H;
  const headEnd = svg.indexOf('<text class="h-cam"'), camEnd = svg.indexOf('</text>', headEnd) + 7;
  const cx = W / 2, oy = 37;
  const orient = `<g class="h-orient" aria-hidden="true"><text x="${cx - 24}" y="${oy}" text-anchor="end">FACE</text>`
    + `<path d="M${cx - 17} ${oy - 4}H${cx + 16}M${cx + 12} ${oy - 7}L${cx + 16} ${oy - 4}L${cx + 12} ${oy - 1}"/>`
    + `<text x="${cx + 23}" y="${oy}">MACHINE</text></g>`;
  return svg.slice(0, headEnd).replace(`viewBox="0 0 ${W} ${Hh}"`, `viewBox="0 0 ${W} ${H2}"`).replace(`<rect width="${W}" height="${W}"`, `<rect width="${W}" height="${H2}"`)
      .replace(/aria-label="Seen from the side\. /, 'aria-label="Seen from the side, the lifter facing the machine on the right. ')
    + svg.slice(headEnd, camEnd) + orient + `<g transform="translate(0 ${ORIENT_H})">` + svg.slice(camEnd, g0)
    + `<g transform="${tf(P.wr, P.TR)}">${rightG}</g><g transform="${tf(P.ww, P.TW)}">${wrongG}</g>${lab}</g></svg>`;
}
function handZoom(page) {
  const z = howto.zooms.find(q => q.kind === 'hand'), h = howto.handling;
  let body;
  if (page === 'thumb') body = thumbPage();
  else {
    const P = handPairs()[page];
    report.hand[page] = { ...P.pair.report, sharedFit: { scale: +P.s.toFixed(4), rightWrist: P.TR.map(f), wrongWrist: P.TW.map(f) } };
    body = `<div class="hand-plate">${sharedPairSvg(page)}</div>${captions(page === 'p1' ? z.caption : z.captionPage2)}`;
  }
  return `<section class="zoom" role="region" aria-labelledby="zh-${z.key}">${zoomTop(z)}${body}${pager(page)}${feelLink(z)}</section>
  <p class="grip-line">${esc(h.gripLine)}</p>
  <p class="hint limit">${esc(h.wrist.limitText)}</p>${h.handleChoice ? `<p class="hint limit">${esc(h.handleChoice.sore)}</p>` : ''}`;
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
    // "Thumb" leader label: a dot on the thumb's end segment (tdp), a thin leader out to a small label at the cell's
    // right edge, 34 px lower (the right side of every cell is empty), so the thumb reads at a glance in both cells.
    const tn = nums(r.svg.match(new RegExp(`<path id="th${i}-tdp" d="([^"]+)"`))[1]), tp = [];
    for (let j = 0; j < tn.length - 1; j += 2) tp.push([tn[j], tn[j + 1]]);
    const ta = [tp.reduce((a, p) => a + p[0], 0) / tp.length, tp.reduce((a, p) => a + p[1], 0) / tp.length];
    // placement: the label box (padded 6-7 px) must hold no point of the hand's outline (every part path, sampled), the
    // leader must not cross another part's outline point either; among the clear spots the shortest leader wins.
    const LW = 44, LH = 11, hp = [];
    for (const m of r.svg.matchAll(new RegExp(`<path id="th${i}-([a-z0-9-]+)" d="([^"]+)"`, 'g'))) { const n = nums(m[2]);
      for (let j = 0; j + 3 < n.length; j += 2) for (let u = 0; u <= 4; u++) hp.push([n[j] + (n[j + 2] - n[j]) * u / 4, n[j + 1] + (n[j + 3] - n[j + 1]) * u / 4, m[1]]); }
    let bestL = null;
    for (let ly = y0 + 8 + LH; ly <= y0 + CH - 6; ly += 2) for (let lx = x0 + 8; lx + LW <= x0 + CW - 8; lx += 2) {
      const bx = [lx - 7, ly - LH - 6, lx + LW + 7, ly + 6];
      if (hp.some(([x, y]) => x > bx[0] && x < bx[2] && y > bx[1] && y < bx[3])) continue;
      const e = [Math.max(lx, Math.min(ta[0], lx + LW)), Math.max(ly - LH, Math.min(ta[1], ly))];   // nearest point of the box
      const L = Math.hypot(e[0] - ta[0], e[1] - ta[1]); if (L < 18) continue;
      let cross = 0; for (let u = 0.25; u <= 1; u += 0.02) { const q = [ta[0] + (e[0] - ta[0]) * u, ta[1] + (e[1] - ta[1]) * u];
        cross += hp.filter(([x, y, id]) => !/^t(pp|dp)$/.test(id) && Math.hypot(x - q[0], y - q[1]) < 1.6).length; }
      const cost = cross * 60 + L; if (!bestL || cost < bestL.cost) bestL = { lx, ly, e, cost, cross, L };
    }
    const { lx, ly, e } = bestL, u = [(e[0] - ta[0]) / bestL.L, (e[1] - ta[1]) / bestL.L], le = [e[0] - u[0] * 3, e[1] - u[1] * 3];
    const thumbMark = `<g class="th-mark" aria-hidden="true"><path d="M${f(ta[0])} ${f(ta[1])}L${f(le[0])} ${f(le[1])}"/><circle cx="${f(ta[0])}" cy="${f(ta[1])}" r="1.75"/>`
      + `<text x="${f(lx)}" y="${f(ly - 1)}">THUMB</text></g>`;
    report.hand[`thumb-${t.mode}`].thumbLabel = { anchor: ta.map(f), box: [f(lx), f(ly - LH), f(lx + LW), f(ly)], leaderCrossings: bestL.cross };
    return `<figure class="th-cell${t.default ? ' def' : ''}"><figcaption><span class="th-title">${t.default ? I.check(16) : ''}${esc(t.title)}</span><span class="th-note">${esc(t.note)}</span></figcaption>${svg.replace(/<\/svg>$/, thumbMark + '</svg>')}</figure>`;
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
  const inner = p.svg.replace(/<svg class="plate-svg"[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<rect width="358" height="358" fill="url\(#[^)]*\)"\/>/, '');
  const toPanel = ([x, y]) => [(x - vx) * k, (y - vy) * k];
  const c = z.callout[role], A = toPanel(anchors[1]), lns = c.text.split(/<br\s*\/?>/), w = capWidth(c.text), h = CAP_LH * lns.length;
  const occ = p.occ;
  // the zoom's own path guides are obstacles too (the plate's occupancy grid does not know them): sample them
  const cls0 = role === 'right' ? 'ok' : 'm';
  const guidePts = (z.guides ?? []).filter(g => g.kind === 'path' && g.role === role).flatMap(g => { const ps = g.pts.map(w => toPanel(P(w)));
    return ps.slice(1).flatMap((q, i) => Array.from({ length: 11 }, (_, j) => [ps[i][0] + (q[0] - ps[i][0]) * j / 10, ps[i][1] + (q[1] - ps[i][1]) * j / 10])); });
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
  const lv = paths + levels.map((g, i) => `<path class="z-level ${cls}" d="M4 ${f(toPanel(anchors[2 + i])[1])}H${PANEL - 4}"/>`).join('');
  const dr = drops.map((g, i) => { const a = toPanel(anchors[2 + levels.length + 2 * i]), b = toPanel(anchors[3 + levels.length + 2 * i]);
    const x = a[0];   // drawn vertically at the start point's x; the head points the way the point moves (up or down)
    const sg = Math.sign(b[1] - a[1]) || 1;
    return `<path class="z-drop" d="M${f(x)} ${f(a[1])}V${f(b[1] - sg)}"/><path class="z-drop-head" d="M${f(x - 4)} ${f(b[1] - 6 * sg)}L${f(x)} ${f(b[1])}L${f(x + 4)} ${f(b[1] - 6 * sg)}Z"/>`; }).join('');
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
.th-cell { display: grid; gap: 0; }
.th-cell figcaption { display: grid; gap: 1px; min-height: 36px; padding: 0 4px; }
.th-title { display: inline-flex; align-items: center; gap: 4px; font-size: var(--fs-small); font-weight: var(--fw-semibold); color: var(--text); }
.th-title svg { color: var(--accent); flex: none; }
.th-note { font-size: var(--fs-meta); line-height: var(--lh-meta); color: var(--text-2); }
.th-cell.def .th-note { color: var(--accent-text); }
.th-cell .hand-svg { border-radius: 10px; border: 1px solid var(--border-subtle); }
/* lat_pulldown fixer: the thumb reads first (--text outline on every hand here), a small leader label on the thumb page,
   the orientation row under the camera label, a surface halo under angle values */
.hand-svg .h-thumb .u-stroke use { stroke: var(--text); }
.th-mark path { fill: none; stroke: var(--text-3); stroke-width: .75; }
.th-mark circle { fill: var(--text); }
.th-mark text, .hand-svg .h-orient text { font-family: var(--font); font-size: var(--fs-cap); letter-spacing: var(--ls-cap); font-weight: var(--fw-semibold); fill: var(--text-3); }
.th-mark text { fill: var(--text-2); }
.hand-svg .h-orient path { fill: none; stroke: var(--text-3); stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; }
.hand-svg .h-val { paint-order: stroke; stroke: var(--surface-2); stroke-width: 3px; stroke-linejoin: round; }
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
  'zoom-pad': () => chipRow('pad') + postureZoom(howto.zooms.find(z => z.key === 'pad')),
  'zoom-path': () => chipRow('path') + postureZoom(howto.zooms.find(z => z.key === 'path')),
  feel: () => feelSection(null),
  'feel-open-arms': () => feelSection('arms'),
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
