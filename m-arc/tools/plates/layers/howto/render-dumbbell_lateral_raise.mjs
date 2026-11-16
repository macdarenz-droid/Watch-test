// Render the How-to layers of the dumbbell lateral raise: node howto/render-dumbbell_lateral_raise.mjs
// Reads exercises/dumbbell_lateral_raise.howto.mjs and writes out/dumbbell_lateral_raise-howto-<layer>-<theme>.png
// (390 px wide sheet section, device scale 2) in Silent Black and Paper:
//   zoom-hand, zoom-top-height, zoom-shoulders    (S2 and S3: the plate box with Right and Wrong)
//   feel, feel-open-traps, feel-open-forearms     (S4 at rest, S6 with a row open)
// Prints a JSON report: copy lint, crop label checks (edge, overlap, figure), measured text boxes, hand report.
// Engine files are imported, never changed.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { allThemesCss } from '../engine/themes.mjs';
import { PLATE_CSS } from '../engine/plate.mjs';
import { renderHandPair, HAND_CSS } from '../engine/hand.mjs';
import { renderFeelMap, renderFeelLegend, FEEL_CSS } from '../engine/feelmap.mjs';
import { capWidth, leaderFor, CAP_LH } from '../engine/layout.mjs';
import { renderEndOnInset, END_ON_CSS } from './end-on-inset.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), outDir = process.env.DLR_OUT ?? join(root, 'out');
mkdirSync(outDir, { recursive: true });
const ID = 'dumbbell_lateral_raise';
const HT = (await import(pathToFileURL(join(root, 'exercises', `${ID}.howto.mjs`)).href + `?t=${Date.now()}`));
const howto = HT.default, RED_FLAG = HT.RED_FLAG;
const FONT = `data:font/woff2;base64,${readFileSync(join(root, 'engine', 'inter-latin-wght-normal.woff2')).toString('base64')}`;
const TOKENS = readFileSync(join(root, 'engine', 'tokens.css'), 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const f = v => +v.toFixed(2);
const report = { lint: [], crops: {}, hand: null, browser: {} };

/* ---------- copy lint (architecture 4.3 limits, 6.2 spirit) ---------- */
const words = s => String(s).trim().split(/\s+/).length;
const sentences = s => (String(s).match(/[.!?](\s|$)/g) ?? []).length;
const lint = (where, s, maxW, maxS) => { if (words(s) > maxW) report.lint.push(`${where}: ${words(s)} words > ${maxW}`); if (maxS && sentences(s) > maxS) report.lint.push(`${where}: ${sentences(s)} sentences > ${maxS}`); };
for (const r of howto.feel.rows) { lint(`row ${r.key} means`, r.means, 30, 2); lint(`row ${r.key} fix`, r.fix, 30, 2); if (/doctor|physio|checked|GP\b/i.test(r.fix)) report.lint.push(`row ${r.key}: red-flag wording in the fix (C8)`); }
for (const z of howto.zooms) { lint(`zoom ${z.key} caption.right`, z.caption.right, 14); lint(`zoom ${z.key} caption.wrong`, z.caption.wrong, 14); if (words(z.chip) > 2) report.lint.push(`chip ${z.chip}: > 2 words`); }
for (const p of howto.posture) if (words(p.label) > 3) report.lint.push(`posture ${p.key} label > 3 words`);
if (howto.chips.length > 4) report.lint.push('more than 4 chips');
if (howto.zooms[0].kind !== 'hand') report.lint.push('Hand is not the first zoom (the load goes through the hands)');
const feelIds = new Set([...howto.feel.primary, ...howto.feel.secondary].map(m => m.muscleId));
for (const w of howto.feel.watch) if (howto.feel.primary.some(p => p.muscleId === w.muscleId)) report.lint.push(`${w.muscleId}: primary and watch`);
void feelIds;
// 6.2: "little finger" everywhere, never "pinky". Checks every user-visible string of the spec (all but the plate and
// the research pointer), the shared red flag and the evidence labels.
{ const { plate: _p, research: _r, ...userCopy } = howto;
  const hits = JSON.stringify([userCopy, RED_FLAG, HT.EVIDENCE_LABELS]).match(/[^"]{0,30}pink(y|ies)[^"]{0,20}/gi) ?? [];
  for (const h of hits) report.lint.push(`"pinky" in user copy (6.2): ...${h}...`); }

/* ---------- shared UI pieces ---------- */
const icon = (d, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = { back: s => icon('<path d="M15 18l-6-6 6-6"/>', s), chev: s => icon('<path d="M9 6l6 6-6 6"/>', s), down: s => icon('<path d="M6 9l6 6 6-6"/>', s),
  check: s => icon('<path d="M5 12l4 4L19 7"/>', s), x: s => icon('<path d="M6 6l12 12M18 6L6 18"/>', s), alert: s => icon('<path d="M12 8v5M12 16.5v.5"/><path d="M10.3 3.9 2.4 17.5a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>', s) };
const CHIP_TEXT = { hand: 'Hand', 'top-height': 'Top height', shoulders: 'Shoulders', feel: 'Feel' };
const CHIP_ARIA = { feel: 'Where to feel it' };
const chipRow = active => `<div class="zoom-chips-head eyebrow">Look closer</div><div class="zoom-chips" role="group" aria-label="Look closer">${howto.chips.map(k =>
  `<button class="zoom-chip" aria-pressed="${k === active}"${CHIP_ARIA[k] ? ` aria-label="${CHIP_ARIA[k]}"` : ''}>${CHIP_TEXT[k] ?? howto.zooms.find(z => z.key === k).chip}</button>`).join('')}</div>`;
const zoomTop = z => `<div class="zoom-top"><button class="zoom-back" aria-label="Back to the plate">${I.back(18)}<span>Plate</span></button><h3 class="zoom-heading" id="zh-${z.key}" tabindex="-1">${esc(z.heading)}</h3></div>`;
const captions = z => `<div class="zoom-caps"><p><span class="sr-only">Right: </span>${esc(z.caption.right)}</p><p><span class="sr-only">Wrong: </span>${esc(z.caption.wrong)}</p></div>`;

/* ---------- S2: hand zoom ---------- */
function handZoom() {
  const z = howto.zooms.find(q => q.kind === 'hand'), h = howto.handling;
  const fault = z.hand.wrong[0];
  const wrongPose = { ...z.hand.right, ...fault.pose, wrist: { ...z.hand.right.wrist, ...fault.pose.wrist }, fingers: { ...z.hand.right.fingers, ...fault.pose.fingers } };
  const pair = renderHandPair({ uid: 'dlr', camera: 'side', loadAxis: h.loadAxis, markers: fault.markers, right: z.hand.right, wrong: wrongPose,
    rightNote: 'Middle of palm', wrongNote: fault.label, alt: { right: z.alt.right, wrong: z.alt.wrong }, panelHeight: 130 });   // arm level: a wide, low drawing
  report.hand = pair.report;
  // engine gap: renderHandPair prints only "above" or "side"; this hand is seen from the front (camera: 'front'),
  // so the spec's own cameraLabel is printed and read instead
  let svg = pair.svg;
  if (z.hand.camera === 'front') {
    const cam = z.hand.cameraLabel;
    if (!cam) throw new Error('hand zoom with camera "front" needs hand.cameraLabel');
    svg = svg.replace('>SEEN FROM THE SIDE<', `>${esc(cam.toUpperCase())}<`).replace('aria-label="Seen from the side.', `aria-label="${esc(cam)}.`);
  }
  // 5.1: the computed force line is drawn only for loadAxis 'along-forearm'. hand.mjs draws it along the forearm for
  // every pose; for this `hold` hand ('across', forearm horizontal) that line would be false, so it and the Right
  // half's wrist tick are removed. The contact dots (where the handle sits) stay.
  if (h.loadAxis !== 'along-forearm') {
    const n0 = svg.length;
    svg = svg.replace(/<path class="h-load( m)?" d="[^"]*"\/><path class="h-load-head( m)?" d="[^"]*"\/>/g, '').replace(/<path class="h-tick" d="[^"]*"\/>/g, '');
    if (svg.length === n0 || /h-load|h-tick/.test(svg)) report.lint.push('hand: along-forearm load line not removed');
  }
  // Wrong half: with the fingers peeled open, the far (middle) finger's lighter outline runs beside the index finger and
  // reads as a doubled line round the finger tips; it is left out of the Wrong half only (the Right fist keeps it)
  { const i = svg.indexOf('<g class="h-panel wrong">'), n0 = svg.length;
    svg = svg.slice(0, i) + svg.slice(i).replace(/<g class="h-far"><g class="u-stroke">(?:<use [^>]*\/>)*<\/g><g class="u-fill">(?:<use [^>]*\/>)*<\/g><\/g>/, '');
    if (i < 0 || svg.length === n0) report.lint.push('hand: far finger not removed from the Wrong half'); }
  // The bend value: the engine sets it on the wedge's bisector, which in this low, wide drawing lands on the wedge.
  // Move it above the forearm, just left of the wrist, clear of the wedge, the datum and the hand.
  { const wj = svg.split('<g class="h-panel wrong">')[1]?.match(/<circle class="h-joint wrist" cx="([\d.-]+)" cy="([\d.-]+)"/);
    const n0 = svg;
    if (wj) svg = svg.replace(/<text class="h-val m" x="[\d.-]+" y="[\d.-]+" text-anchor="\w+">(\d+°)<\/text>/, (m0, v) =>
      `<text class="h-val m" x="${f(+wj[1] - 6)}" y="${f(+wj[2] - 17)}" text-anchor="end">${v}</text>`);
    if (svg === n0) report.lint.push('hand: bend value not moved off the wedge'); }
  const inset = renderEndOnInset({ label: z.hand.inset.label, camera: z.hand.inset.cameraLabel, right: z.hand.inset.right, wrong: z.hand.inset.wrong, alt: { right: z.alt.insetRight, wrong: z.alt.insetWrong } });
  return `<section class="zoom" role="region" aria-labelledby="zh-${z.key}">${zoomTop(z)}
    <div class="hand-plate">${svg}</div>${captions(z)}
    <div class="hand-plate inset">${inset.svg}</div>
    ${feelLink(z)}
  </section>
  <p class="grip-line">${esc(h.gripLine)}</p>
  <p class="hint limit">${esc(h.wrist.limitText)}</p>`;
}

/* ---------- S3: posture zoom = two crops of the approved plate ---------- */
// Plan S-2 condition 2: every crop starts from the golden-A plate. For the lateral raise that is ref-src/plate.mjs
// (howto.plate.render), not an engine spec: the crop is the approved SVG itself, re-framed, with its teaching layers
// (ghosts, start pose, trace, measure, leaders, labels) removed. The wrong arm uses the approved plate's own arm().
import { arm as refArm } from '../ref-src/plate.mjs';
const PANEL = 171, PH = 171;
/** Remove every element <tag class="cls..."> with its balanced subtree. */
function dropEl(svg, tag, cls) {
  const re = new RegExp(`<${tag} class="${cls}[^"]*"[^>]*?(/?)>`, 'g');
  let out = '', i = 0, m;
  while ((m = re.exec(svg))) {
    out += svg.slice(i, m.index);
    if (m[1] === '/') { i = re.lastIndex; continue; }
    let depth = 1, j = re.lastIndex;
    const tagRe = new RegExp(`<${tag}\\b[^>]*?(/?)>|</${tag}>`, 'g'); tagRe.lastIndex = j;
    let t;
    while (depth && (t = tagRe.exec(svg))) { if (t[0].startsWith('</')) depth--; else if (t[1] !== '/') depth++; j = tagRe.lastIndex; }
    i = j; re.lastIndex = j;
  }
  return out + svg.slice(i);
}
const REF_LEAD = 8;   // ref-src leadAt(88): the elbows-lead angle at the top
const REF = { cx: 179, floor: 339, hpx: 256 };
const refP = ([x, y]) => [REF.cx + x * REF.hpx, REF.floor - y * REF.hpx];
/** Point references on the approved plate: engine names (SPEC.md 3) mapped to ref-src geometry. `.r` is the figure's
 *  right = the viewer's left (ref-src side -1). 'mistake' = the wrong still of this zoom. */
function refLandmarks(pose, z) {
  const abdR = pose === 'mistake' && z.wrong?.abd ? z.wrong.abd : 88;
  const R = refArm(abdR, REF_LEAD, -1), L = refArm(88, REF_LEAD, 1);
  const trapL = refP([0.078, 0.8335]);
  return { 'shoulder.r': R.S, 'elbow.r': R.E, 'wrist.r': R.W, 'grip.r': R.G, 'shoulder.l': L.S, 'elbow.l': L.E, 'wrist.l': L.W, 'grip.l': L.G,
    'trap.l': trapL, 'trap.r': [2 * REF.cx - trapL[0], trapL[1]], neck: refP([0, 0.854]) };
}
function resolveRefs(z, refs) {
  const res = (ref, pose = 'end') => {
    if (Array.isArray(ref)) return ref;
    if (typeof ref === 'string') { const [a, b] = ref.includes(':') ? ref.split(':') : [pose, ref]; const lm = refLandmarks(a, z)[b]; if (!lm) throw new Error(`ref-src landmark ${b}`); return lm; }
    if (ref.along) { const a = res(ref.along[0], ref.pose ?? pose), b = res(ref.along[1], ref.pose ?? pose), t = ref.t ?? 1, o = ref.off ?? [0, 0]; return [a[0] + (b[0] - a[0]) * t + o[0], a[1] + (b[1] - a[1]) * t + o[1]]; }
    const p = res(ref.at, ref.pose ?? pose), o = ref.off ?? [0, 0]; return [p[0] + o[0], p[1] + o[1]];
  };
  return refs.map(r => res(r));
}
const refPt = p => `${f(p[0])} ${f(p[1])}`;
function cropHalf(z, role) {
  const render = howto.plate.render;
  if (typeof render !== 'function') throw new Error('lateral raise: howto.plate.render (ref-src/plate.mjs) missing');
  const pid = `${z.key}-${role}`, fromMistake = role === 'wrong' && z.wrong === 'mistake';
  let inner = render({ id: pid, mistake: fromMistake }).svg;
  // re-frame: drop the svg wrapper and its dot grid (the panel has its own at 1x) and the teaching layers
  inner = inner.replace(/<svg class="plate-svg"[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<rect width="358" height="358" fill="url\(#[^)]*\)"\/>/, '');
  for (const [tag, cls] of [['g', 'pose-start'], ['g', 'ghost'], ['g', 'accent-layer'], ['path', 'arc measure'], ['path', 'leader'], ['circle', 'anchor']]) inner = dropEl(inner, tag, cls);
  if (/class="(ghost|pose-start|accent-layer|leader|anchor|trace)/.test(inner)) throw new Error(`${pid}: teaching layer left in the crop`);
  if (role === 'wrong' && !fromMistake) {
    // the wrong still: the approved arm() at z.wrong.abd, dashed in the mistake colour over the right position. Mask as
    // the engine's (plate.mjs mPose): the union's outline only, not where it runs on the correct outline, and not
    // inside the correct shapes named by hideInside.
    const W = refArm(z.wrong.abd, REF_LEAD, -1), shapes = [...W.shapes, W.disc];
    const defs = shapes.map((d, i) => `<path id="${pid}-w${i}" d="${d}"/>`).join('');
    const endIds = [...inner.matchAll(/<use href="#([^"]+)" class=""\/>/g)].map(m => m[1]).filter((k, i, a) => a.indexOf(k) === i && /-(head|torso|leg\d|e-?1\d)$/.test(k));
    const hideMap = { 'shcap.r': `${pid}-e-10`, 'upper.r': `${pid}-e-11` };
    const hide = (z.wrong.hideInside ?? []).map(k => { const id = hideMap[k]; if (!id || !inner.includes(`id="${id}"`)) throw new Error(`hideInside: no shape ${k}`); return id; });
    const mask = `<mask id="${pid}-mmask" maskUnits="userSpaceOnUse" x="0" y="0" width="358" height="358"><rect width="358" height="358" fill="#fff"/>`
      + shapes.map((d, i) => `<use href="#${pid}-w${i}" fill="#000"/>`).join('') + hide.map(k => `<use href="#${k}" fill="#000"/>`).join('')
      + endIds.map(k => `<use href="#${k}" fill="none" stroke="#000" stroke-width="3.5"/>`).join('') + `</mask>`;
    inner = inner.replace('</defs>', `${defs}${mask}</defs>`) + `<g class="m-pose" mask="url(#${pid}-mmask)"><g class="u-stroke">${shapes.map((d, i) => `<use href="#${pid}-w${i}"/>`).join('')}</g></g>`;
  }
  const levels = (z.guides ?? []).filter(g => g.kind === 'level');
  const anchors = resolveRefs(z, [z.crop.center, z.callout[role].anchor, ...levels.map(g => g.at)]);
  const [cx, cy] = anchors[0], s = z.crop.sizePx, vx = cx - s / 2, vy = cy - s / 2, k = PANEL / s;
  const toPanel = ([x, y]) => [(x - vx) * k, (y - vy) * k];
  const A = toPanel(anchors[1]);
  report.crops[`${z.key}.${role}`] = { drawnLabel: false, from: 'ref-src/plate.mjs', mistakeDrawing: fromMistake, cropPx: [f(vx), f(vy), s], scale: f(k), label: z.callout[role].text.replace(/<br\s*\/?>/g, ' '), anchor: A.map(f) };
  const cls = role === 'right' ? 'ok' : 'm';
  const levelEls = levels.map((g, i) => { const y = toPanel(anchors[2 + i])[1]; return `<path class="z-level ${cls}" d="M4 ${f(y)}H${PANEL - 4}"/>`; }).join('');
  const label = levelEls + `<circle class="z-anchor ${cls}" cx="${f(A[0])}" cy="${f(A[1])}" r="2.5"/>`;   // the words are the subtag under Right / Wrong (postureZoom), as on every posture zoom
  const svg = `<svg class="z-crop" viewBox="0 0 ${PANEL} ${PH}" role="img" aria-label="${esc(role === 'right' ? 'Right: ' + z.alt.right : 'Wrong: ' + z.alt.wrong)}" xmlns="http://www.w3.org/2000/svg">
    <rect class="z-bg" width="${PANEL}" height="${PH}" fill="url(#zdots)"/>
    <defs><clipPath id="zc-${z.key}-${role}"><rect width="${PANEL}" height="${PH}" rx="10"/></clipPath></defs>
    <g clip-path="url(#zc-${z.key}-${role})"><svg x="0" y="0" width="${PANEL}" height="${PH}" aria-hidden="true" viewBox="${f(vx)} ${f(vy)} ${s} ${s}" class="z-plate">${inner}</svg></g>
    <rect class="z-frame" x=".5" y=".5" width="${PANEL - 1}" height="${PH - 1}" rx="10"/>${label}</svg>`;
  void refPt;
  return `<div class="plate z-wrap">${svg}</div>`;
}
const feelLink = z => z.feelPrompt ? `<button class="z-feelrow">${esc(z.feelPrompt)}${I.chev(16)}</button>` : '';
function postureZoom(z) {
  const sub = role => z.callout[role].text.replace(/<br\s*\/?>/g, ' ');   // the crop's own label, printed once under the word
  const head = ok => `<div class="z-head ${ok ? 'ok' : 'm'}">${ok ? I.check(18) : I.x(18)}<b>${ok ? 'Right' : 'Wrong'}</b></div><div class="z-sub ${ok ? 'ok' : 'm'}">${esc(sub(ok ? 'right' : 'wrong').toUpperCase())}</div>`;
  return `<section class="zoom" role="region" aria-labelledby="zh-${z.key}">${zoomTop(z)}
    <div class="z-pair"><div>${head(true)}${cropHalf(z, 'right')}</div><div>${head(false)}${cropHalf(z, 'wrong')}</div></div>
    ${captions(z)}
    ${feelLink(z)}
  </section>`;
}

/* ---------- S4 / S6: the feel section ---------- */
function feelSection(openKey = null) {
  const F = howto.feel, open = F.rows.find(r => r.key === openKey);
  const watch = open ? (open.at.muscles ?? []).filter(m => F.watch.some(w => w.muscleId === m)) : [];
  const map = renderFeelMap({ primary: F.primary, secondary: F.secondary, avoid: watch, pain: open?.at.parts ?? [], views: ['front', 'back'], id: `feel-${openKey ?? 'rest'}` });
  report.browser[`feel-${openKey ?? 'rest'}`] = { label: map.label, drawn: map.drawn, textOnly: map.textOnly };
  const rows = F.rows.map((r, i) => {
    const isOpen = r.key === openKey, hidden = i >= 3 && !isOpen;
    if (hidden) return '';
    return `<li class="feel-row${isOpen ? ' open' : ''}"><button class="feel-row-btn" aria-expanded="${isOpen}">${esc(r.where)}${isOpen ? I.down(18) : I.chev(18)}</button>`
      + (isOpen ? `<div class="feel-row-body"><p><b>Usually means</b> ${esc(r.means)}</p><p><b>Fix</b> ${esc(r.fix)}</p>`
        + (r.zoom ? `<button class="feel-showme">Show me the ${esc(CHIP_TEXT[r.zoom].toLowerCase())}${I.chev(16)}</button>` : '')
        + (r.redFlag ? `<div class="red-flag">${I.alert(16)}<div><p>${esc(RED_FLAG.now)}</p><p>${esc(RED_FLAG.doctor)}</p></div></div>` : '') + `</div>` : '')
      + `</li>`;
  }).join('');
  const more = F.rows.length > 3 ? F.rows.slice(3).filter(r => r.key !== openKey).length : 0;
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
${END_ON_CSS}
${FEEL_CSS}
*,*::before,*::after { box-sizing: border-box; }
html, body { margin: 0; background: var(--surface-2); color: var(--text); font-family: var(--font); -webkit-font-smoothing: antialiased; }
body { width: 390px; padding: 16px; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
p { margin: 0; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.eyebrow { font-size: var(--fs-cap); line-height: var(--lh-cap); letter-spacing: var(--ls-cap); text-transform: uppercase; font-weight: var(--fw-semibold); color: var(--text-2); margin: 0; }
.hint { font-size: var(--fs-meta); line-height: var(--lh-meta); color: var(--text-2); }
/* chips: 44 px targets */
.zoom-chips-head { margin-bottom: var(--sp-2); }
.zoom-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: var(--sp-3); }
.zoom-chip { min-height: 44px; padding: 0 14px; border-radius: var(--radius-pill); border: 1px solid var(--border); color: var(--text-2); font-size: var(--fs-small); font-weight: var(--fw-medium); }
.zoom-chip[aria-pressed="true"] { background: var(--accent-soft); border-color: transparent; color: var(--accent-text); }
/* the plate box in zoom state */
.zoom { border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); background: var(--surface-2); overflow: hidden; }
.zoom .hand-plate { border: 0; border-radius: 0; }
.zoom .hand-plate.inset { border-top: 1px solid var(--border-subtle); }
.zoom-top { display: flex; align-items: center; gap: 4px; padding: 0 12px 0 4px; border-bottom: 1px solid var(--border-subtle); }
.zoom-back { display: inline-flex; align-items: center; gap: 2px; min-height: 44px; min-width: 44px; padding: 0 8px 0 4px; color: var(--accent-text); font-size: var(--fs-small); font-weight: var(--fw-medium); }
.zoom-heading { margin: 0; font-size: var(--fs-small); font-weight: var(--fw-semibold); color: var(--text); }
.zoom-caps { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 10px 12px; font-size: var(--fs-meta); line-height: var(--lh-meta); color: var(--text-2); }
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
.z-leader { fill: none; stroke-width: .75; } .z-leader.ok { stroke: var(--accent); } .z-leader.m { stroke: var(--mistake); }
.z-anchor.ok { fill: var(--accent); } .z-anchor.m { fill: var(--mistake); }
.z-callout { font-family: var(--font); font-size: var(--fs-cap); letter-spacing: var(--ls-cap); font-weight: var(--fw-semibold); }
.z-callout.ok { fill: var(--accent-text); } .z-callout.m { fill: var(--mistake); }
.z-feelrow { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; min-height: 44px; padding: 0 12px; border-top: 1px solid var(--border-subtle); text-align: left; font-size: var(--fs-meta); color: var(--accent-text); }
.grip-line { margin-top: var(--sp-3); font-size: var(--fs-body); line-height: var(--lh-body); color: var(--text); }
.limit { margin-top: var(--sp-2); }
/* feel section */
.feel-section { display: grid; gap: var(--sp-3); }
.feel-section { --feel-map-h: 250px; }
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
  'zoom-hand': () => chipRow('hand') + handZoom(),
  'zoom-top-height': () => chipRow('top-height') + postureZoom(howto.zooms.find(z => z.key === 'top-height')),
  'zoom-shoulders': () => chipRow('shoulders') + postureZoom(howto.zooms.find(z => z.key === 'shoulders')),
  feel: () => feelSection(null),
  'feel-open-traps': () => feelSection('traps'),
  'feel-open-forearms': () => feelSection('forearms'),
};
const THEMES = [['silent-black', 'dark', 'dark'], ['paper', 'light', 'paper']];
const { chromium } = createRequire('/home/user/M-arc/package.json')('playwright');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const tmp = mkdtempSync(join(outDir, `.howto-${ID}-`));
const pngs = [];
try {
  for (const [name, build] of Object.entries(LAYERS)) {
    const body = build();
    for (const [theme, scheme, tag] of THEMES) {
      const file = join(tmp, `${name}-${tag}.html`);
      writeFileSync(file, page(theme, body));
      const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: +(process.env.DLR_SCALE ?? 2), colorScheme: scheme });
      const pg = await ctx.newPage();
      await pg.goto(pathToFileURL(file).href);
      await pg.evaluate(() => document.fonts.ready);
      const m = await pg.evaluate(() => {
        const issues = [];
        if (document.documentElement.scrollWidth > 390) issues.push(`horizontal-scroll:${document.documentElement.scrollWidth}`);
        for (const el of document.querySelectorAll('button')) { const r = el.getBoundingClientRect(); if (r.height < 44 || r.width < 44) issues.push(`target<44:${el.textContent.trim().slice(0, 24)}:${Math.round(r.width)}x${Math.round(r.height)}`); }
        // text inside SVGs: stays inside its svg (8 px), no two texts overlap
        for (const svg of document.querySelectorAll('svg.hand-svg, svg.z-crop')) {
          const sb = svg.getBoundingClientRect(), ts = [...svg.querySelectorAll('text')].map(t => ({ t: t.textContent, b: t.getBoundingClientRect() }));
          ts.forEach((a, i) => {
            if (a.b.left < sb.left + 4 || a.b.right > sb.right - 4 || a.b.top < sb.top + 2 || a.b.bottom > sb.bottom - 2) issues.push(`text-edge:${a.t}`);
            ts.slice(i + 1).forEach(c => { if (a.b.left < c.b.right && c.b.left < a.b.right && a.b.top < c.b.bottom && c.b.top < a.b.bottom) issues.push(`text-overlap:${a.t}|${c.t}`); });
          });
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
report.ok = !report.lint.length && Object.values(report.browser).every(b => !b.issues?.length) && Object.values(report.crops).every(c => (c.drawnLabel === false || !c.figureCells));
console.log(JSON.stringify(report, null, 1));
