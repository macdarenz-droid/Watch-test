// "Where to feel it" body map (architecture GRIP-AND-FEEL 2.2 S4-S7, 2.5, 2.6, 5.3).
//
// The app's front/back body map (drawn like src/ui/MuscleMap.tsx) in a `feel` mode:
//   main (primary)      solid --feel-main fill + --text outline; one slow diagonal light band clipped to the main
//                       muscles' own shapes, 2 passes (300 ms delay + 2.4 s + 0.4 s + 2.4 s = 5.5 s), then rests.
//                       Never loops. No band at all under reduced motion (the resting state shows at once).
//   helpers (secondary) the roles-mode secondary fill (accent 45 % over --map-body), steady.
//   watch (avoid)       "should not take over": --mistake dashed outline, NO fill, never a colour difference
//                       (accent and mistake are too close in several themes, 2.6). Shown only while a row naming
//                       the muscle is open (S6), so passing `avoid` also pauses the shimmer. Watch beats helper.
//   pain (optional)     non-muscle parts (hand-left, elbow-right, knee-left, nape...): --mistake stroke + 20 % fill.
//   everything else     quiet map body, as the app draws it.
// Id rules (5.3): aliases are OFF (brachialis and rotator_cuff are never painted on a neighbour), `core` is text-only
// (the map draws it on the serratus, the wrong place). Such ids come back in `textOnly`.
//
// Body paths: engine/bodymap-parts.mjs, a copy of the app's src/svg/bodyMuscles.ts, which comes from the
// body-muscles package by Ivan Vulovic (https://github.com/vulovix/body-muscles), Apache License 2.0.
//
// API
//   renderFeelMap({ primary, secondary = [], avoid = [], pain = [], views = ['front','back'], side, shimmer = true,
//                   autoplay = false, id = 'feel', labels = true })
//     -> { html, svg, css: FEEL_CSS, label, drawn: { primary, secondary, avoid }, textOnly, views }
//   renderFeelLegend({ avoid = false }) -> html (2 entries at rest, a 3rd dashed entry in S6)
//   FEEL_CSS, FEEL_JS (starts the shimmer once the map is 50 % in view for 300 ms; a tap replays it),
//   FEEL_MAIN_MIX, feelMainHex(themeId), contrast(a, b)
// Muscle entries may be ids or { muscleId } objects (the cards' FeelMuscle shape).
import { FRONT_PARTS, BACK_PARTS, FRONT_VIEWBOX, BACK_VIEWBOX } from './bodymap-parts.mjs';
import { THEMES, THEME_IDS } from './themes.mjs';

const MUSCLE_LABEL = {
  chest: 'Chest', upper_chest: 'Upper chest', front_delts: 'Front shoulders', side_delts: 'Side shoulders',
  rear_delts: 'Rear shoulders', rotator_cuff: 'Rotator cuff', biceps: 'Biceps', triceps: 'Triceps',
  brachialis: 'Brachialis', forearms: 'Forearms', lats: 'Lats', mid_back: 'Mid back', upper_traps: 'Upper traps',
  lower_back: 'Lower back', abs: 'Abs', obliques: 'Obliques', core: 'Deep core', hip_flexors: 'Hip flexors',
  quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', adductors: 'Inner thighs', abductors: 'Outer hips',
  calves: 'Calves',
};
/** Ids that are never painted in feel mode (5.3, C2): core sits on the serratus; the others have no region. */
const TEXT_ONLY = new Set(['core', 'brachialis', 'rotator_cuff']);

const VIEWS = {
  front: { parts: FRONT_PARTS, viewBox: FRONT_VIEWBOX, name: 'Front' },
  back: { parts: BACK_PARTS, viewBox: BACK_VIEWBOX, name: 'Back' },
};

/* ---- --feel-main: accent mixed with 25 % --text, per theme (2.6). One entry per theme so a theme can be tuned. ---- */
export const FEEL_MAIN_MIX = { 'silent-black': 25, paper: 25, ember: 25, emerald: 25, midnight: 25 };
const feelMainDecl = id => `--feel-main:color-mix(in srgb, var(--accent) ${100 - FEEL_MAIN_MIX[id]}%, var(--text))`;

/* colour maths for the contrast report (color-mix in srgb = straight mix of the encoded channels) */
const hex = h => { const s = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16)); };
const toHex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const mix = (a, b, pa) => a.map((v, i) => v * pa + b[i] * (1 - pa));
const lum = c => { const l = c.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]; };
export function contrast(a, b) {
  const [x, y] = [lum(typeof a === 'string' ? hex(a) : a), lum(typeof b === 'string' ? hex(b) : b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function feelMainHex(themeId) {
  const t = THEMES[themeId].tokens;
  return toHex(mix(hex(t.accent), hex(t.text), (100 - FEEL_MAIN_MIX[themeId]) / 100));
}

/* ---- path points (vertices and control points: a safe over-estimate of the shape) ---- */
function pathPts(d) {
  const tok = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g);
  let i = 0, cmd = 'M', x = 0, y = 0, sx = 0, sy = 0;
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  const pts = [];
  const add = (px, py) => { pts.push([px, py]); b[0] = Math.min(b[0], px); b[1] = Math.min(b[1], py); b[2] = Math.max(b[2], px); b[3] = Math.max(b[3], py); };
  const n = () => +tok[i++];
  const ARGS = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
  while (i < tok.length) {
    if (/[a-zA-Z]/.test(tok[i])) cmd = tok[i++];
    const lc = cmd.toLowerCase(), rel = cmd !== cmd.toUpperCase();
    if (lc === 'z') { x = sx; y = sy; continue; }
    const a = Array.from({ length: ARGS[lc] }, n);
    const ox = rel ? x : 0, oy = rel ? y : 0;
    if (lc === 'h') { x = ox + a[0]; add(x, y); continue; }
    if (lc === 'v') { y = oy + a[0]; add(x, y); continue; }
    if (lc === 'a') { x = ox + a[5]; y = oy + a[6]; add(x, y); continue; }
    for (let k = 0; k < a.length; k += 2) add(ox + a[k], oy + a[k + 1]);
    x = ox + a[a.length - 2]; y = oy + a[a.length - 1];
    if (lc === 'm') { sx = x; sy = y; cmd = rel ? 'l' : 'L'; }
  }
  return { box: b, pts };
}
const union = bs => bs.reduce((u, b) => [Math.min(u[0], b[0]), Math.min(u[1], b[1]), Math.max(u[2], b[2]), Math.max(u[3], b[3])], [Infinity, Infinity, -Infinity, -Infinity]);
const f = v => +v.toFixed(2);

const idOf = m => (typeof m === 'string' ? m : m.muscleId);
const onSide = (p, side) => !side || !/-(left|right)$/.test(p.id) || p.id.endsWith('-' + side);
const lower = s => s.charAt(0).toLowerCase() + s.slice(1);
const list = ids => ids.map(m => lower(MUSCLE_LABEL[m] ?? m)).join(', ');

/* band geometry (viewBox units) */
const BAND_ANGLE = 20;     // degrees off horizontal (2.3: "about 20 degrees")
/** The outer 15 % of the band on each side is fully transparent: only the middle 70 % carries light. */
export const BAND_INSET = 0.15;
// a bell-shaped light: no hard edge anywhere, so it reads as light passing over, not a bar
const BAND_STOPS = [[0, 0], [BAND_INSET, 0], [0.3, 0.2], [0.42, 0.52], [0.5, 0.62], [0.58, 0.52], [0.7, 0.2], [1 - BAND_INSET, 0], [1, 0]];

export function renderFeelMap({
  primary = [], secondary = [], avoid = [], pain = [], views = ['front', 'back'], side = null,
  shimmer = true, autoplay = false, id = 'feel', labels = true,
} = {}) {
  const P = primary.map(idOf), S = secondary.map(idOf), W = avoid.map(idOf);
  for (const m of [...P, ...S, ...W]) if (!(m in MUSCLE_LABEL)) throw new Error(`feelmap: unknown muscle id "${m}"`);
  const both = P.filter(m => W.includes(m));
  if (both.length) throw new Error(`feelmap: ${both.join(', ')} is both main and "should not take over" (4.3 forbids it)`);
  // Watch wins over helper while its row is open (5.3: "shows as a helper until its row opens").
  const role = new Map();
  for (const m of S) role.set(m, 'sec');
  for (const m of P) role.set(m, 'pri');
  for (const m of W) role.set(m, 'watch');
  const textOnly = [...new Set([...P, ...S, ...W].filter(m => TEXT_ONLY.has(m)))];
  const focus = W.length > 0 || pain.length > 0;     // S6: a row is open, shimmer paused
  const band = shimmer && !focus;

  const drawn = { primary: new Set(), secondary: new Set(), avoid: new Set() };
  const svgs = views.map(v => {
    const V = VIEWS[v];
    if (!V) throw new Error(`feelmap: unknown view "${v}"`);
    const base = [], priOut = [], watchOut = [], painOut = [], clip = [], priBoxes = [], priPts = [];
    for (const p of V.parts) {
      const r = p.muscle && !TEXT_ONLY.has(p.muscle) && onSide(p, side) ? role.get(p.muscle) : null;
      const isPain = pain.includes(p.id);
      const cls = !p.muscle ? 'body-part' : r === 'pri' ? 'muscle feel-pri' : r === 'sec' ? 'muscle feel-sec' : 'muscle';
      base.push(`<path class="${cls}" d="${p.d}"/>`);
      if (r === 'pri') { priOut.push(`<path d="${p.d}"/>`); clip.push(`<path d="${p.d}"/>`); { const g = pathPts(p.d); priBoxes.push(g.box); priPts.push(...g.pts); } drawn.primary.add(p.muscle); }
      if (r === 'sec') drawn.secondary.add(p.muscle);
      if (r === 'watch') { watchOut.push(`<path d="${p.d}"/>`); drawn.avoid.add(p.muscle); }
      if (isPain) painOut.push(`<path d="${p.d}"/>`);
    }
    let bandEl = '';
    if (band && priBoxes.length) {
      const [x0, y0, x1, y1] = union(priBoxes);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, D = Math.hypot(x1 - x0, y1 - y0);
      const th = BAND_ANGLE * Math.PI / 180;
      const T = Math.max(4, D * 0.4);              // band thickness: soft and wide, never a hard stripe
      const L = D * 2 + T;                          // long enough to cross the box at any point of its travel
      // the muscles' own extent across the band (every point projected on the band's travel axis), so the pass
      // spends its time ON the muscle, not in the empty corners of a bounding box
      const proj = priPts.map(([x, y]) => -(x - cx) * Math.sin(th) + (y - cy) * Math.cos(th));
      const pad = T * (0.5 - BAND_INSET) + 0.2;       // the lit middle starts and ends just outside the muscle
      const from = Math.min(...proj) - pad, to = Math.max(...proj) + pad;
      const cid = `${id}-${v}-clip`, gid = `${id}-${v}-band`;
      bandEl = `<defs><clipPath id="${cid}">${clip.join('')}</clipPath>`
        + `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">`
        + BAND_STOPS.map(([o, a]) => `<stop offset="${o}" class="feel-stop" stop-opacity="${a}"/>`).join('')
        + `</linearGradient></defs>`
        + `<g clip-path="url(#${cid})"><g transform="rotate(${BAND_ANGLE} ${f(cx)} ${f(cy)})">`
        + `<rect class="feel-band" x="${f(cx - L / 2)}" y="${f(cy - T / 2)}" width="${f(L)}" height="${f(T)}" fill="url(#${gid})" style="--feel-from:${f(from)}px;--feel-to:${f(to)}px"/>`
        + `</g></g>`;
    }
    const layers = [
      `<g class="feel-base">${base.join('')}</g>`,
      bandEl,
      priOut.length ? `<g class="feel-pri-line">${priOut.join('')}</g>` : '',
      painOut.length ? `<g class="feel-pain">${painOut.join('')}</g>` : '',
      watchOut.length ? `<g class="feel-watch">${watchOut.join('')}</g>` : '',
    ].join('');
    return `<figure class="feel-view"><svg class="feel-svg" viewBox="${V.viewBox}" aria-hidden="true" focusable="false">${layers}</svg>`
      + (labels ? `<figcaption class="map-label" aria-hidden="true">${V.name}</figcaption>` : '') + `</figure>`;
  });

  // TalkBack (2.5): one label for the whole map (read once, not once per view); paths are aria-hidden. The label says
  // what is drawn: text-only ids (no region, e.g. brachialis) are left out; the sheet's plain-word note under the map
  // covers them (GA A6/A7: brachialis is text only, and the anatomy word is jargon in user copy).
  const spoken = ms => ms.filter(m => !TEXT_ONLY.has(m));
  let label = `Where you should feel it. Main: ${list(spoken(P))}.`;
  if (S.length) label += ` Also working: ${list(spoken(S.filter(m => !W.includes(m))))}.`;
  if (W.length) label += ` Should not take over: ${list(W)}.`;
  label = label.replace(' Also working: .', '');
  const html = `<div class="feel-map${autoplay && band ? ' is-playing' : ''}${focus ? ' is-focus' : ''}"${autoplay ? ` style="--feel-delay:${DELAY}ms"` : ''} role="img" aria-label="${label}" data-feel-map>${svgs.join('')}</div>`;
  return {
    html, svg: svgs.join(''), css: FEEL_CSS, label, views,
    drawn: { primary: [...drawn.primary], secondary: [...drawn.secondary], avoid: [...drawn.avoid] },
    textOnly,
  };
}

/** Legend: "Main" and "Also working" at rest (S4, 2 entries); a dashed "Should not take over" entry in S6. */
export function renderFeelLegend({ avoid = false } = {}) {
  const sw = (cls, d) => `<svg class="feel-sw ${cls}" viewBox="0 0 14 14" aria-hidden="true"><rect x="1.5" y="1.5" width="11" height="11" rx="3"${d ?? ''}/></svg>`;
  return `<div class="feel-legend">`
    + `<span>${sw('sw-pri')}Main</span><span>${sw('sw-sec')}Also working</span>`
    + (avoid ? `<span>${sw('sw-watch')}Should not take over</span>` : '')
    + `</div>`;
}

const FEEL_EASE = 'cubic-bezier(.45,0,.55,1)';   // literal: var() is not resolved inside @keyframes timing functions
const SWEEP = 2400, GAP = 400, DELAY = 300, TOTAL = SWEEP * 2 + GAP;    // 5.2 s of motion + 0.3 s delay = 5.5 s
const k1 = (SWEEP / TOTAL * 100).toFixed(3), k2 = ((SWEEP + GAP) / TOTAL * 100).toFixed(3);

export const FEEL_CSS = `
/* feel map (GRIP-AND-FEEL 5.3). Body paths: body-muscles by Ivan Vulovic, Apache License 2.0. */
${THEME_IDS.map(tid => `[data-theme="${tid}"]{${feelMainDecl(tid)}}`).join('\n')}
/* Sweep easing: a symmetric ease-in-out, not EASE.standard. With EASE.standard (.2,0,0,1) about 70 % of the travel
   happens in the first quarter of each 2.4 s pass, so the band flicks across in about half a second and then idles
   off the muscle; a symmetric curve keeps the whole pass slow and even. */
.feel-map { display: flex; justify-content: center; gap: var(--sp-5); -webkit-tap-highlight-color: transparent; }
.feel-view { margin: 0; display: flex; flex-direction: column; align-items: center; }
.feel-svg { display: block; height: var(--feel-map-h, 280px); width: auto; overflow: visible; }
.feel-view .map-label { font-size: var(--fs-cap); line-height: var(--lh-cap); font-weight: var(--fw-semibold); letter-spacing: var(--ls-cap); text-transform: uppercase; color: var(--text-2); margin-top: var(--sp-2); }
/* quiet body, exactly as the app's map */
.feel-svg .body-part, .feel-svg .muscle { fill: var(--map-body); stroke: var(--map-line); stroke-width: .12; stroke-linejoin: round; }
/* helpers: roles-mode secondary fill, steady */
.feel-svg .muscle.feel-sec { fill: color-mix(in srgb, var(--accent) 45%, var(--map-body)); stroke: color-mix(in srgb, var(--accent) 45%, var(--map-line)); }
/* main: solid --feel-main; outline on top of the band so the shape reads without colour */
.feel-svg .muscle.feel-pri { fill: var(--feel-main); stroke: none; }
.feel-svg .feel-pri-line path { fill: none; stroke: color-mix(in srgb, var(--text) 55%, var(--feel-main)); stroke-width: .22; stroke-linejoin: round; }
/* the light band: feel-main mixed with 55 % text, soft edges from the gradient */
.feel-svg .feel-stop { stop-color: color-mix(in srgb, var(--feel-main) 45%, var(--text)); }
.feel-svg .feel-band { transform: translateY(var(--feel-from)); }
.feel-map.is-playing .feel-band {
  animation: feel-sweep ${TOTAL}ms linear var(--feel-delay, 0ms) 1 both;
}
@keyframes feel-sweep {
  0%        { transform: translateY(var(--feel-from)); animation-timing-function: ${FEEL_EASE}; }
  ${k1}%  { transform: translateY(var(--feel-to)); animation-timing-function: step-end; }
  ${(+k1 + 0.001).toFixed(3)}%  { transform: translateY(var(--feel-from)); }
  ${k2}%  { transform: translateY(var(--feel-from)); animation-timing-function: ${FEEL_EASE}; }
  100%      { transform: translateY(var(--feel-to)); }
}
/* S6: watch = dashed --mistake outline, no fill; fades in once (opacity only) */
.feel-svg .feel-watch path { fill: none; stroke: var(--mistake); stroke-width: .45; stroke-dasharray: .9 .6; stroke-linejoin: round; stroke-linecap: round; }
.feel-svg .feel-pain path { fill: color-mix(in srgb, var(--mistake) 20%, transparent); stroke: var(--mistake); stroke-width: .35; stroke-linejoin: round; }
.feel-map.is-focus .feel-watch, .feel-map.is-focus .feel-pain { animation: feel-mark-in var(--dur-base, 200ms) var(--ease-standard, ease) both; }
@keyframes feel-mark-in { from { opacity: 0; } to { opacity: 1; } }
/* reduced motion (S7): no band, resting state at once, marks static */
@media (prefers-reduced-motion: reduce) { .feel-band { display: none; } .feel-map .feel-watch, .feel-map .feel-pain { animation: none; } }
html[data-motion="reduce"] .feel-band { display: none; }
html[data-motion="reduce"] .feel-map .feel-watch, html[data-motion="reduce"] .feel-map .feel-pain { animation: none; }
/* legend: never colour alone; the watch swatch is dashed */
.feel-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--sp-2) var(--sp-4); font-size: var(--fs-meta); line-height: var(--lh-meta); color: var(--text-2); }
.feel-legend span { display: inline-flex; align-items: center; gap: 6px; }
.feel-sw { width: 14px; height: 14px; flex: none; }
.feel-sw.sw-pri rect { fill: var(--feel-main); stroke: color-mix(in srgb, var(--text) 55%, var(--feel-main)); stroke-width: 1; }
.feel-sw.sw-sec rect { fill: color-mix(in srgb, var(--accent) 45%, var(--map-body)); stroke: none; }
.feel-sw.sw-watch rect { fill: none; stroke: var(--mistake); stroke-width: 1.4; stroke-dasharray: 2.4 1.8; }
`;

/** Plays the shimmer once the map has been 50 % in view for 300 ms (the architecture's 300 ms delay; with `autoplay`
 *  and no script, the CSS delay --feel-delay stands in for it). First time only; a tap on the map replays it.
 *  While the map is scrolled fully out of view a running sweep is paused, and it resumes where it stopped when the map
 *  comes back (plan S-2 condition 6; plan R10). Behaviour only: inline animation-play-state on the bands, no CSS rule,
 *  so no pixel changes while the map is visible. */
export const FEEL_JS = `
(() => {
  const reduce = () => document.documentElement.dataset.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const play = el => { if (reduce() || el.classList.contains('is-focus')) return; el.classList.remove('is-playing'); void el.offsetWidth; el.classList.add('is-playing'); };
  const hold = (el, off) => el.querySelectorAll('.feel-band').forEach(b => { b.style.animationPlayState = off ? 'paused' : ''; });
  document.querySelectorAll('[data-feel-map]').forEach(el => {
    let t = null, done = false;
    const io = new IntersectionObserver(([e]) => {
      if (done) return;
      if (e.intersectionRatio >= 0.5) t = t ?? setTimeout(() => { done = true; io.disconnect(); play(el); }, 300);
      else { clearTimeout(t); t = null; }
    }, { threshold: [0, 0.5] });
    io.observe(el);
    new IntersectionObserver(([e]) => hold(el, !e.isIntersecting), { threshold: 0 }).observe(el);
    el.addEventListener('click', () => play(el));
  });
})();
`;
