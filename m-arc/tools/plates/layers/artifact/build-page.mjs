// Builds ONE self-contained review page with every finished Technical Plate: artifact/technical-plates.html.
// Run: node artifact/build-page.mjs. Imports the engine, every exercise spec and the reference plate unchanged.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderPlate, PLATE_CSS } from '../engine/index.mjs';
import { plate as refPlate } from '../ref-src/plate.mjs';
import { THEMES, THEME_IDS, allThemesCss } from '../ref-src/themes.mjs';
import { buildHowtoLayers, ZDOTS, FEEL_CSS, HAND_CSS } from './howto-layers.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..');
const TOKENS = readFileSync(join(root, 'engine', 'tokens.css'), 'utf8');   // the app's styles.css token block
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = s => String(s).replace(/<br\s*\/?>/g, ' ');

// ---- icons (the app's base() icon style, as in ref-src/build.mjs) ----
const ic = (d, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${(1.5 * 24 / size).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  x: s => ic('<path d="M6 6l12 12M18 6L6 18"/>', s),
  check: s => ic('<path d="M5 12l4 4L19 7"/>', s),
  trace: s => ic('<path d="M5 18c2-7 7-11 14-12"/><path d="M15.5 4.5L19 6l-2 3.2"/>', s),
};

// ---- the reference lateral raise (ref-src/plate.mjs, unchanged); cues and tells as ref-src/build.mjs draws them ----
const REF_TELLS = { shrug: 'The shoulders shrug toward the ears.', dip: 'The knees dip to swing it up.', thumbs: 'Thumbs turn down at the top.' };
const refExercise = () => {
  const n = refPlate({ id: 'lr-n' }), m = refPlate({ id: 'lr-m', mistake: true });
  const mKeys = ['shrug', 'dip', 'thumbs'], mText = { shrug: 'Shrug', dip: 'Dip', thumbs: 'Thumbs<br>down' };
  return {
    id: 'lateral_raise', name: 'Dumbbell Lateral Raise', view: 'front',
    normal: { svg: n.svg, overlay: n.overlay, cues: n.cues.map(c => ({ key: c.k, text: c.text, cue: c.cue })) },
    mistake: { svg: m.svg, overlay: m.overlay, cues: mKeys.map(k => ({ key: k, text: mText[k], cue: REF_TELLS[k] })) },
    guides: { elbows: guideFor(n.svg, refPlate({ id: 'lr-n', selected: 'elbows' }).svg) },
    tempo: [{ phase: 'Lift', s: 1, move: true }, { phase: 'Hold', s: 0.5 }, { phase: 'Lower', s: 2, move: true }, { phase: 'Rest', s: 0.5 }],
    alt: 'Dumbbell lateral raise, front view. Start: standing tall, arms at the sides, drawn dashed. Four in-between positions show the arms rising out to the sides with a slight elbow bend, elbows a little ahead of the hands. End: arms level with the shoulders, drawn solid. Shoulder abduction up to 90 degrees.',
  };
};

// The selected-callout guide (class lead-guide) as a hidden element spliced into the base SVG at the same spot.
function guideFor(base, sel) {
  const m = sel.match(/<path class="lead-guide"[^>]*\/>/);
  if (!m) return null;
  const i = m.index;
  if (sel.slice(0, i) !== base.slice(0, i)) throw new Error('guide splice: prefix differs');
  return { at: i, el: m[0] };
}
const withGuides = (svg, guides) => {
  const list = Object.entries(guides).filter(([, g]) => g).sort((a, b) => b[1].at - a[1].at);
  for (const [k, g] of list) svg = svg.slice(0, g.at) + g.el.replace('<path ', `<path data-guide="${k}" style="display:none" `) + svg.slice(g.at);
  return svg;
};

// The How-to layers (chips, close-ups, feel, setup, risks) per card, from exercises/<id>.howto.mjs.
const { layers: HOWTO, css: HOWTO_ZOOM_CSS } = await buildHowtoLayers();

const specExercise = async id => {
  const spec = (await import(pathToFileURL(join(root, 'exercises', `${id}.mjs`)).href)).default;
  const pre = id.replace(/_/g, '-');
  const n = renderPlate(spec, { id: `${pre}-n` }), m = spec.mistake ? renderPlate(spec, { id: `${pre}-m`, mistake: true }) : null;
  const issues = [...n.report.issues, ...(m?.report.issues ?? [])];
  if (issues.length) console.warn(id, 'engine issues:', issues);
  const guides = {};
  for (const c of spec.callouts ?? []) if (c.guide) guides[c.key] = guideFor(n.svg, renderPlate(spec, { id: `${pre}-n`, selected: c.key }).svg);
  return {
    id, name: spec.name, view: spec.view,
    normal: { svg: n.svg, overlay: n.overlay, cues: spec.callouts ?? [] },
    mistake: m ? { svg: m.svg, overlay: m.overlay, cues: spec.mistake.tells ?? [] } : null,
    guides, tempo: spec.tempo, alt: spec.alt ?? `${spec.name}, ${spec.view} view.`,
  };
};

const GROUPS = [
  { id: 'free', title: 'Free weights', ids: ['lateral_raise', 'barbell_back_squat'] },
  { id: 'hanging', title: 'Hanging', ids: ['pull_up', 'hanging_leg_raise'] },
  { id: 'machines', title: 'Machines', ids: ['lat_pulldown', 'seated_cable_row', 'leg_press', 'machine_chest_press'] },
];
const EX = {};
for (const g of GROUPS) for (const id of g.ids) EX[id] = id === 'lateral_raise' ? refExercise() : await specExercise(id);

// Give every plate callout button a stable id and its key (overlay buttons come out in cue order).
function tagButtons(overlay, cues, exId, mode, selKey) {
  let i = 0;
  const out = overlay.replace(/<button class="plate-callout([^"]*)"([^>]*)>/g, (all, cls, rest) => {
    const c = cues[i++];
    if (!c) throw new Error(`${exId}/${mode}: more buttons than cues`);
    rest = rest.replace(/\s*data-key="[^"]*"/, '').replace(/aria-pressed="[^"]*"/, `aria-pressed="${c.key === selKey}"`);
    return `<button type="button" id="${exId}-${mode}-${c.key}" data-key="${c.key}" data-cue="${esc(c.cue)}" class="plate-callout${cls}"${rest}>`;
  });
  if (i !== cues.length) throw new Error(`${exId}/${mode}: ${cues.length} cues, ${i} buttons`);
  return out;
}

const tempoStrip = tempo => {
  const words = tempo.map(t => `${plain(t.phase).toLowerCase()} ${t.s} second${t.s === 1 ? '' : 's'}`).join(', ');
  return `<div class="tempo" role="img" aria-label="Tempo: ${esc(words)}">${tempo.map(t =>
    `<div class="tempo-seg${t.move ? ' move' : ''}" style="flex:${t.s} 1 0"><i></i><div class="tempo-label"><b>${esc(t.phase)}</b><span>${t.s} s</span></div></div>`).join('')}</div>`;
};

function card(e) {
  const id = e.id.replace(/_/g, '-');
  const H = HOWTO[e.id];
  // ---- the approved plate block (golden A, bc0f378), byte for byte: plate, cue line, pills, tells, tempo ----
  const n0 = e.normal.cues[0], m0 = e.mistake?.cues[0];
  const svgN = withGuides(e.normal.svg, e.guides ?? {});
  const figN = `<figure class="plate" data-mode="normal">${svgN}${tagButtons(e.normal.overlay, e.normal.cues, id, 'n', n0?.key)}<figcaption class="sr-only">${esc(e.alt)}</figcaption></figure>`;
  const figM = e.mistake ? `<figure class="plate" data-mode="mistake" hidden>${e.mistake.svg}${tagButtons(e.mistake.overlay, e.mistake.cues, id, 'm', m0?.key)}<figcaption class="sr-only">${esc(`${e.name}: the common mistake, drawn dashed in the mistake colour over the correct end position.`)}</figcaption></figure>` : '';
  const tells = e.mistake ? `<div class="tells" hidden><span class="eyebrow">Tells</span><ol>${e.mistake.cues.map(t => `<li><b>${plain(t.text)}</b><span>${esc(t.cue)}</span></li>`).join('')}</ol></div>` : '';
  // ---- the How-to layers, all outside the plate block (below the tempo strip; plan 2.4) ----
  return `<article class="sheet-card" id="card-${id}" data-ex="${id}" data-sel-n="${n0?.key ?? ''}" data-sel-m="${m0?.key ?? ''}" aria-labelledby="${id}-title">
  <div class="sheet-grab" aria-hidden="true"></div>
  <div class="sheet-head"><h3 id="${id}-title"><span class="eyebrow sheet-eyebrow">How to do it</span>${esc(e.name)}</h3></div>
  <div class="plate-stage"><div class="plate-fit" id="${id}-plate">${figN}${figM}</div>${H ? H.zooms : ''}</div>
  <p class="cue-line" id="${id}-cue" aria-live="polite">${esc(n0?.cue ?? '')}</p>
  <div class="plate-controls">
    <button type="button" class="howto-pill" id="${id}-trace" aria-pressed="false" aria-label="Trace the movement once">${I.trace(18)} Trace</button>
    ${e.mistake ? `<button type="button" class="howto-pill mistake" id="${id}-mistake" aria-pressed="false">Mistake</button>` : ''}
    <span class="grow"></span>
    <span class="hint howto-offline">${I.check(14)} Saved offline</span>
  </div>
  ${tells}
  ${e.tempo ? tempoStrip(e.tempo) : ''}
  ${H ? H.after : ''}
</article>`;
}

const themeButtons = THEME_IDS.map(t => `<button type="button" class="seg" id="theme-${t}" data-theme-id="${t}" aria-pressed="${t === 'silent-black'}">${esc(THEMES[t].name)}</button>`).join('');
const ORDER = ['silent-black', 'paper', 'midnight', 'ember', 'emerald'];
const themeSeg = ORDER.map(t => themeButtons.match(new RegExp(`<button[^>]*id="theme-${t}"[^>]*>[^<]*</button>`))[0]).join('');

// ---- page chrome CSS (its own --pg-* tokens so the app tokens inside the sheets never collide) ----
const PAGE_CSS = `
:root { --pg-bg: #f5f5f3; --pg-surface: #ffffff; --pg-text: #18191b; --pg-text-2: #5c5f66; --pg-border: #dedfdb; --pg-seg: #ebebe8; --pg-seg-on: #ffffff; --pg-focus: #3e63dd;
  --pg-font: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color-scheme: light; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --pg-bg: #0a0b0c; --pg-surface: #141517; --pg-text: #eceef0; --pg-text-2: #9a9ea6; --pg-border: #26282c; --pg-seg: #141517; --pg-seg-on: #2b2d32; --pg-focus: #8da4ef; color-scheme: dark; } }
:root[data-theme="dark"] { --pg-bg: #0a0b0c; --pg-surface: #141517; --pg-text: #eceef0; --pg-text-2: #9a9ea6; --pg-border: #26282c; --pg-seg: #141517; --pg-seg-on: #2b2d32; --pg-focus: #8da4ef; color-scheme: dark; }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; }
body { background: var(--pg-bg); color: var(--pg-text); font-family: var(--pg-font); font-size: 15px; line-height: 1.5; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
button { font: inherit; color: inherit; cursor: pointer; background: none; border: 0; padding: 0; }
h1, h2, h3, p, figure { margin: 0; }
svg { display: block; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
:focus-visible { outline: 2px solid var(--pg-focus); outline-offset: 2px; }
/* one content width for header, grid and footer: 1 or 2 cards of 390 px + a 20 px gap, so every edge lines up.
   Capped at 2 columns: the groups hold 2, 2 and 4 cards, so a 3rd column left holes on wide screens. */
:root { --wrap: 390px; }
@media (min-width: 832px) { :root { --wrap: 800px; } }
.pg-head { max-width: calc(var(--wrap) + 32px); margin: 0 auto; padding: 32px 16px 24px; display: grid; gap: 12px; }
.pg-kicker { font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--pg-text-2); }
.pg-head h1 { font-size: 28px; line-height: 34px; letter-spacing: -.02em; font-weight: 600; }
.pg-head p { max-width: 68ch; color: var(--pg-text-2); }
.pg-jump { justify-self: start; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 16px; border-radius: 12px; border: 1px solid var(--pg-border); background: var(--pg-surface); color: var(--pg-text); font-size: 14px; font-weight: 500; text-decoration: none; }
.pg-jump:hover { border-color: var(--pg-text-2); }
.pg-theme { display: grid; gap: 8px; margin-top: 8px; }
.pg-theme-label { font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--pg-text-2); }
.segmented { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px; border-radius: 12px; background: var(--pg-seg); border: 1px solid var(--pg-border); width: fit-content; max-width: 100%; }
.seg { min-height: 44px; padding: 0 14px; border-radius: 9px; font-size: 14px; font-weight: 500; color: var(--pg-text-2); white-space: nowrap; }
.seg[aria-pressed="true"] { background: var(--pg-seg-on); color: var(--pg-text); box-shadow: 0 1px 2px rgba(0,0,0,.12); }
.seg:hover { color: var(--pg-text); }
@media (max-width: 479px) { .segmented { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); width: 100%; }
  .seg { padding: 2px 4px; font-size: 13px; line-height: 16px; white-space: normal; } }
.pg-foot { max-width: calc(var(--wrap) + 32px); margin: 0 auto; padding: 24px 16px 48px; color: var(--pg-text-2); font-size: 14px; display: grid; gap: 12px; }
.pg-foot a { color: var(--pg-text); text-underline-offset: 2px; }
/* ---- the app band: app theme tokens scoped to #sheets ---- */
#sheets { background: var(--bg); color: var(--text); font-family: var(--font); font-size: var(--fs-body); line-height: var(--lh-body); letter-spacing: var(--ls-body); padding: 28px 16px 36px; border-block: 1px solid var(--pg-border); transition: background-color var(--dur-base) var(--ease-standard); }
#sheets :focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
#sheets .plate-callout:focus-visible { outline-offset: -2px; }
.group { max-width: var(--wrap); margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 358px), 1fr)); align-items: start; gap: 20px; }
.group + .group { margin-top: 36px; }
.group-title { grid-column: 1 / -1; font-size: var(--fs-cap); line-height: var(--lh-cap); letter-spacing: var(--ls-cap); text-transform: uppercase; font-weight: var(--fw-semibold); color: var(--text-2); padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle); }
`;

// ---- How-to layers (architecture 2.1-2.7): chips, close-up frame, feel, setup, risks. Every colour a theme token. ----
const HOWTO_CSS = `
.plate-stage { position: relative; }
.plate-stage > .plate-fit[hidden], .cue-line[hidden] { display: none; }
/* Mistake view on a hand-loaded exercise: one quiet line under the tempo (outside the approved block) that opens the
   hand close-up, so the wrist fault is one tap away while the approved body mistake stays on the plate */
.ht-also { display: flex; flex-wrap: wrap; align-items: center; gap: 0 6px; margin-top: var(--sp-3); font-size: var(--fs-small); line-height: var(--lh-small); color: var(--text-2); }
.ht-also[hidden] { display: none; }
.ht-also button { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; color: var(--accent-text); font-weight: var(--fw-medium); }
.zx[hidden] { display: none; }
.zx { will-change: auto; }
.zx-top { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-2); min-height: 44px; margin: -4px 0 var(--sp-2); }
.zx-h { margin: 0; font-size: var(--fs-body); line-height: var(--lh-body); font-weight: var(--fw-semibold); color: var(--text); }
.zx-h:focus { outline: none; } .zx-h:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; border-radius: 4px; }
.zx-close { flex: none; display: inline-grid; place-items: center; width: 44px; height: 44px; margin-right: -6px; border-radius: var(--radius-pill); color: var(--text-2); }
.zx-close:hover { color: var(--text); background: color-mix(in srgb, var(--text) 6%, transparent); }
.zx-page[hidden] { display: none; }
.hx > .zx-page > .hsec:first-child, .hx .zoom { margin-top: 0; }
.zx-chips-wrap { display: grid; gap: var(--sp-2); margin-top: var(--sp-4); }
.zx-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.zx-chip { scroll-margin-top: 40px; display: inline-flex; align-items: center; min-height: 44px; padding: 0 13px; border-radius: var(--radius-pill); border: 1px solid var(--border); color: var(--text-2); font-size: var(--fs-small); font-weight: var(--fw-medium); white-space: nowrap; }
.zx-chip:hover { color: var(--text); }
.zx-chip[aria-pressed="true"] { background: var(--accent-soft); border-color: transparent; color: var(--accent-text); }
.zx-chip-cap { margin-left: 6px; padding-left: 7px; border-left: 1px solid var(--border); font-weight: var(--fw-regular, 400); color: var(--text-2); }
.zx-chip[aria-pressed="true"] .zx-chip-cap { color: inherit; border-color: color-mix(in srgb, var(--accent-text) 35%, transparent); }
/* grip + common handling mistakes (plan 2.4 item 4) */
.grip { display: grid; gap: var(--sp-2); }
.grip-lead { font-size: var(--fs-body); line-height: var(--lh-body); letter-spacing: var(--ls-body); font-weight: var(--fw-medium); color: var(--text); }
.grip-note { font-size: var(--fs-small); line-height: var(--lh-small); color: var(--text-2); }
.hm-head { margin: var(--sp-2) 0 0; }
.hm-list { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--border-subtle); }
.hm { display: grid; gap: 4px; padding: var(--sp-3) 0; border-bottom: 1px solid var(--border-subtle); }
.hm-t { display: flex; align-items: flex-start; gap: 8px; font-size: var(--fs-body); line-height: var(--lh-body); color: var(--text); }
.hm-t b { font-weight: var(--fw-medium); }
.hm-t svg { flex: none; margin-top: 3px; color: var(--mistake); }
.hm-fix { padding-left: 24px; font-size: var(--fs-small); line-height: var(--lh-small); color: var(--text-2); }
.hm-show { margin-left: 24px; }
/* risks and when to stop (plan 2.4 item 7): the one red-flag block of the sheet lives here */
.risks { display: grid; gap: var(--sp-3); }
.rk-list { margin: 0; padding-left: 18px; display: grid; gap: var(--sp-2); font-size: var(--fs-small); line-height: var(--lh-small); color: var(--text); }
.rk-list li::marker { color: var(--text-3); }
.redflag:focus { outline: none; } .redflag:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.rf-link { justify-self: start; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; color: var(--text); font-size: var(--fs-small); font-weight: var(--fw-medium); text-decoration: underline; text-decoration-color: color-mix(in srgb, var(--mistake) 50%, transparent); text-underline-offset: 3px; }
.rf-link svg { color: var(--mistake); }
/* the owner's safety line, once per sheet, small, last, after the risks */
.ht-disclaimer { margin-top: var(--sp-2); font-size: var(--fs-meta); line-height: var(--lh-meta); color: var(--text-2); }
.hw-sec { margin-top: var(--sp-5); padding-top: var(--sp-4); border-top: 1px solid var(--border-subtle); }
.hw-sec > h4.eyebrow { margin: 0; }
.hw-sec h4:focus { outline: none; } .hw-sec h4:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
/* feel (S4-S7) */
.feel { display: grid; gap: var(--sp-3); --feel-map-h: 236px; }
.feel-lead { font-size: var(--fs-body); line-height: var(--lh-body); letter-spacing: var(--ls-body); font-weight: var(--fw-medium); color: var(--text); }
.feel .feel-map { padding: var(--sp-2) 0 0; cursor: pointer; }
.feel-svg .feel-mark { display: none; } .feel-svg .feel-mark.on { display: inline; }
.feel-svg .feel-quiet path { fill: var(--map-body); stroke: var(--map-line); stroke-width: .12; }
.feel-sw.sw-pain rect { fill: color-mix(in srgb, var(--mistake) 20%, transparent); stroke: var(--mistake); stroke-width: 1.2; }
.feel-legend span[hidden] { display: none; }
.feel-note { font-size: var(--fs-small); line-height: var(--lh-small); color: var(--text-2); }
.fr-head { margin: var(--sp-1) 0 0; }
.fr-list { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--border-subtle); }
.fr { border-bottom: 1px solid var(--border-subtle); }
.fr[hidden] { display: none; }
.fr-btn { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-2); width: 100%; min-height: 48px; padding: 4px 0; text-align: left; font-size: var(--fs-body); line-height: var(--lh-body); color: var(--text); }
.fr-btn svg { flex: none; color: var(--text-3); transition: transform var(--dur-base) var(--ease-standard); }
.fr-btn[aria-expanded="true"] svg { transform: rotate(180deg); }
.fr-body { display: grid; gap: var(--sp-2); padding: 0 0 var(--sp-3); font-size: var(--fs-small); line-height: var(--lh-small); color: var(--text); }
.fr-body[hidden] { display: none; }
html:not([data-motion="reduce"]) .fr-body:not([hidden]) { animation: fr-in var(--dur-base) var(--ease-standard) both; }
@keyframes fr-in { from { opacity: 0; transform: translateY(-4px); } }
.fr-body b { display: block; margin-bottom: 2px; font-size: var(--fs-cap); line-height: var(--lh-cap); letter-spacing: var(--ls-cap); text-transform: uppercase; font-weight: var(--fw-semibold); color: var(--text-2); }
.fr-show, .st-show { justify-self: start; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; color: var(--accent-text); font-size: var(--fs-small); font-weight: var(--fw-medium); }
.fr-more { justify-self: start; min-height: 44px; padding: 0 16px; border-radius: var(--radius-pill); border: 1px solid var(--border); color: var(--text-2); font-size: var(--fs-small); font-weight: var(--fw-medium); }
.fr-more:hover { color: var(--text); }
.redflag { display: flex; gap: 8px; padding: 10px 12px; border-radius: var(--radius-md, 10px); border: 1px solid color-mix(in srgb, var(--mistake) 35%, var(--border)); color: var(--text); font-size: var(--fs-small); line-height: var(--lh-small); }
.redflag svg { flex: none; margin-top: 1px; color: var(--mistake); }
.redflag div { display: grid; gap: 4px; }
.redflag .rf-name { font-weight: var(--fw-medium); }
/* setup */
.setup { display: grid; gap: var(--sp-3); }
.st-list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-3); }
.st-list li { display: grid; grid-template-columns: 24px 1fr; gap: 10px; align-items: start; font-size: var(--fs-body); line-height: var(--lh-body); color: var(--text); }
.st-list li[hidden] { display: none; }
.st-n { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: var(--radius-pill); background: var(--surface-3, var(--surface-2)); border: 1px solid var(--border); font-size: var(--fs-meta); font-weight: var(--fw-semibold); color: var(--text-2); font-variant-numeric: tabular-nums; }
.st-show { margin-top: 2px; }
.zdot { fill: var(--border-subtle); }
@media (prefers-reduced-motion: reduce) { .fr-body:not([hidden]) { animation: none; } .fr-btn svg { transition: none; } }
`;

// ---- the app's sheet CSS (as ref-src/build.mjs / engine/sheet.mjs), plus the card frame and the trace timing ----
const SHEET_CSS = `
${TOKENS}
${allThemesCss()}
/* declared where --accent exists (the theme sits on #sheets, not on :root), so the ring resolves in every theme */
#sheets, [data-theme] { --focus-ring: color-mix(in srgb, var(--accent) 80%, var(--text)); }
#sheets h3 { font-size: var(--fs-title); line-height: var(--lh-title); font-weight: var(--fw-semibold); letter-spacing: -0.01em; }
.eyebrow { font-size: var(--fs-cap); line-height: var(--lh-cap); font-weight: var(--fw-semibold); letter-spacing: var(--ls-cap); text-transform: uppercase; color: var(--text-2); }
.grow { flex: 1; min-width: 0; }
.hint { font-size: var(--fs-meta); color: var(--text-2); }
.sheet-card { min-width: 0; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 8px 15px 20px; }
/* phone: the card is the sheet itself, 390 wide like the app, so the plate stays 358 px (1:1) and text keeps a 16 px gutter */
@media (max-width: 421px) { .sheet-card { width: calc(100% + 32px); max-width: 390px; margin-inline: max(-16px, calc((100% - 390px) / 2)); } }
.sheet-grab { width: 36px; height: 4px; border-radius: var(--radius-pill); background: var(--border-strong); margin: 4px auto 14px; }
.sheet-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; margin-bottom: 14px; }
.sheet-head .sheet-eyebrow { display: block; margin-bottom: 2px; color: var(--text-2); }
${PLATE_CSS}
/* the plate is drawn at 358 px (1:1 at a 390 px phone) and zoomed to fit a narrower card */
.plate-fit { width: 100%; overflow: hidden; border-radius: var(--radius-lg); }
.plate-fit .plate { width: 358px; max-width: none; }
/* phones under 350 px: the plate alone bleeds 9 px into the card padding (text keeps its 16 px gutter), so the
   358 px drawing is zoomed to about 0.86 instead of 0.80 and the 11 px callouts stay about 9.4 px or larger */
@media (max-width: 349px) { .plate-fit { width: calc(100% + 18px); margin-inline: -9px; } }
/* the arc label is not interactive: taps on its box reach the callout button under it */
.plate-arc-label { pointer-events: none; }
.cue-line { margin-top: var(--sp-3); min-height: 22px; font-size: var(--fs-title); line-height: var(--lh-title); letter-spacing: var(--ls-title); font-weight: var(--fw-medium); color: var(--text); }
.cue-line.tell { display: flex; align-items: flex-start; gap: 8px; }
.cue-line.tell svg { color: var(--mistake); flex: none; margin-top: 2px; }
.tells { margin-top: var(--sp-3); display: grid; gap: 6px; }
.tells[hidden] { display: none; }
.tells .eyebrow { color: var(--mistake); }
.tells ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.tells li { display: grid; grid-template-columns: 104px 1fr; column-gap: 8px; align-items: baseline; font-size: var(--fs-body); line-height: var(--lh-body); color: var(--text); }
.tells li b { font-size: var(--fs-cap); line-height: var(--lh-cap); letter-spacing: var(--ls-cap); text-transform: uppercase; font-weight: var(--fw-semibold); color: var(--mistake); }
.plate-controls { display: flex; align-items: center; gap: var(--sp-2); margin-top: var(--sp-3); }
.howto-pill { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 16px; border-radius: var(--radius-pill); border: 1px solid var(--border); color: var(--text-2); font-size: var(--fs-small); font-weight: var(--fw-medium); }
.howto-pill svg { color: var(--accent-text); }
.howto-pill[aria-pressed="true"]:not(.mistake) { color: var(--accent-text); border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); }
.howto-pill.mistake[aria-pressed="true"] { background: color-mix(in srgb, var(--mistake) 14%, transparent); border-color: transparent; color: var(--mistake); }
.howto-offline { display: inline-flex; align-items: center; gap: 4px; color: var(--text-2); white-space: nowrap; }
.tempo { display: flex; gap: 2px; margin-top: var(--sp-4); }
.tempo-label > * { padding-right: 6px; }
.tempo-seg { min-width: max-content; }
.tempo-seg > i { display: block; height: 4px; border-radius: 1px; background: var(--text-3); }
.tempo-seg.move > i { background: var(--accent); }
.tempo-label { display: grid; margin-top: 6px; font-size: var(--fs-cap); line-height: var(--lh-cap); letter-spacing: var(--ls-cap); font-variant-numeric: tabular-nums; color: var(--text-2); white-space: nowrap; }
.tempo-label b { font-weight: var(--fw-semibold); text-transform: uppercase; }
.tempo-label span { letter-spacing: 0; color: var(--text); font-size: var(--fs-meta); line-height: var(--lh-meta); }
/* Trace plays once: the path draws, each ghost appears as the path reaches it, the arrowhead and the angle land last. */
html:not([data-motion="reduce"]) .plate.tracing .ghost { animation: plate-ghost var(--dur-enter) var(--ease-standard) both; animation-delay: var(--gd, calc(var(--i) * 80ms)); }
html:not([data-motion="reduce"]) .plate.tracing .arrow { animation: plate-fade 160ms var(--ease-standard) 2.3s both; }
html:not([data-motion="reduce"]) .plate.tracing .measure,
html:not([data-motion="reduce"]) .plate.tracing .plate-arc-label { animation: plate-fade var(--dur-enter) var(--ease-standard) 2.4s both; }
@keyframes plate-fade { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .plate .trace, .plate .ghost, .plate .arrow, .plate .measure, .plate-arc-label { animation: none !important; } #sheets { transition: none; } }
${HAND_CSS}
${FEEL_CSS}
${HOWTO_ZOOM_CSS}
${HOWTO_CSS}
`;

const JS = `
(() => {
  const KEY = 'marc-plates-theme', IDS = ${JSON.stringify(THEME_IDS)};
  const band = document.getElementById('sheets');
  const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const setMotion = () => { if (mq && mq.matches) document.documentElement.setAttribute('data-motion', 'reduce'); else document.documentElement.removeAttribute('data-motion'); };
  setMotion(); if (mq && mq.addEventListener) mq.addEventListener('change', setMotion);

  // ---- app theme ----
  const applyTheme = id => {
    if (!IDS.includes(id)) id = 'silent-black';
    band.setAttribute('data-theme', id);
    document.querySelectorAll('.seg').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeId === id)));
  };
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { saved = null; }
  applyTheme(saved || 'silent-black');
  document.querySelectorAll('.seg').forEach(b => b.addEventListener('click', () => {
    applyTheme(b.dataset.themeId);
    try { localStorage.setItem(KEY, b.dataset.themeId); } catch (e) { /* storage blocked: the choice lasts for this visit */ }
  }));

  // ---- plate zoom: drawn at 358 px, scaled to the card ----
  const fit = el => { const w = el.clientWidth; if (!w) return; const k = Math.min(1, w / 358); el.querySelectorAll('.plate').forEach(p => { p.style.zoom = String(k); }); };
  const ro = window.ResizeObserver ? new ResizeObserver(es => es.forEach(e => fit(e.target))) : null;

  const X_ICON = ${JSON.stringify(I.x(18))};
  const reduced = () => document.documentElement.getAttribute('data-motion') === 'reduce';
  const rootCs = () => getComputedStyle(document.documentElement);
  const tok = (name, dflt) => { const v = parseFloat(rootCs().getPropertyValue(name)); return isFinite(v) ? v : dflt; };
  const ease = name => rootCs().getPropertyValue(name).trim() || 'ease';
  let current = null;   // the open close-up: { card, close }
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  document.querySelectorAll('.sheet-card').forEach(card => {
    const ex = card.dataset.ex;
    const fitEl = card.querySelector('.plate-fit');
    if (ro) ro.observe(fitEl); fit(fitEl);
    const figN = card.querySelector('.plate[data-mode="normal"]'), figM = card.querySelector('.plate[data-mode="mistake"]');
    const cue = card.querySelector('.cue-line'), tells = card.querySelector('.tells'), also = card.querySelector('.ht-also');
    const btnTrace = document.getElementById(ex + '-trace'), btnMis = document.getElementById(ex + '-mistake');
    // ghosts appear when the traced path reaches them (engine: data-t; reference plate: data-th over 10..88 deg)
    card.querySelectorAll('.ghost').forEach(g => {
      const t = g.dataset.t != null ? +g.dataset.t : g.dataset.th != null ? (+g.dataset.th - 10) / 78 : null;
      if (t != null && isFinite(t)) g.style.setProperty('--gd', (t * 2.4).toFixed(2) + 's');
    });
    let mode = 'normal';
    const sel = { normal: card.dataset.selN, mistake: card.dataset.selM };
    const select = (fig, key) => {
      const btns = [...fig.querySelectorAll('.plate-callout')];
      let text = '';
      btns.forEach(b => { const on = b.dataset.key === key; b.setAttribute('aria-pressed', String(on)); if (on) text = b.dataset.cue; });
      if (fig === figN) {
        const svg = fig.querySelector('svg');
        const leaders = [...svg.querySelectorAll(':scope > path.leader:not(.m)')], anchors = [...svg.querySelectorAll(':scope > circle.anchor')];
        if (leaders.length === btns.length && anchors.length === btns.length) btns.forEach((b, i) => {
          const on = b.dataset.key === key;
          leaders[i].classList.toggle('on', on); anchors[i].classList.toggle('on', on); anchors[i].setAttribute('r', on ? '2.5' : '1.5');
        });
        svg.querySelectorAll('[data-guide]').forEach(g => { g.style.display = g.dataset.guide === key ? '' : 'none'; });
        cue.className = 'cue-line';
        cue.textContent = text;
      } else {
        cue.className = 'cue-line tell';
        cue.innerHTML = X_ICON + '<span><span class="sr-only">Mistake: </span>' + esc(text) + '</span>';
      }
      sel[fig === figN ? 'normal' : 'mistake'] = key;
    };
    const setMode = m => {
      mode = m;
      figN.hidden = m !== 'normal';
      if (figM) figM.hidden = m !== 'mistake';
      if (tells) tells.hidden = m !== 'mistake';
      if (also) also.hidden = m !== 'mistake';
      if (btnMis) btnMis.setAttribute('aria-pressed', String(m === 'mistake'));
      select(m === 'normal' ? figN : figM, sel[m]);
      fit(fitEl);
    };
    [figN, figM].filter(Boolean).forEach(fig => fig.querySelectorAll('.plate-callout').forEach(b => b.addEventListener('click', () => select(fig, b.dataset.key))));
    // the target is read before the close: closing a close-up opened from Mistake view puts Mistake back (prevMode), and
    // toggling after that would undo the tap
    if (btnMis) btnMis.addEventListener('click', () => { const next = mode === 'mistake' ? 'normal' : 'mistake'; closeZoom(true); setMode(next); });
    const tracePath = figN.querySelector('.trace');
    const endTrace = () => { figN.classList.remove('tracing'); btnTrace.setAttribute('aria-pressed', 'false'); };
    if (tracePath) tracePath.addEventListener('animationend', endTrace);
    btnTrace.addEventListener('click', () => {
      closeZoom(true);
      if (mode !== 'normal') setMode('normal');
      figN.classList.remove('tracing');
      void figN.getBoundingClientRect();
      if (document.documentElement.getAttribute('data-motion') === 'reduce' || !tracePath) { endTrace(); return; }   // reduced motion: the end state is already shown
      figN.classList.add('tracing');
      btnTrace.setAttribute('aria-pressed', 'true');
    });
    select(figN, sel.normal);

    // ---- close-ups (S2/S3): one at a time on the page, in place of the plate ----
    const panels = [...card.querySelectorAll('.zx')], stage = card.querySelector('.plate-stage');
    const zoomBtns = [...card.querySelectorAll('.zx-chip[data-zoom]')];
    let openKey = null, opener = null, prevMode = 'normal', anim = null;
    const panelOf = k => panels.find(p => p.dataset.zoom === k);
    const show = k => {
      panels.forEach(p => { p.hidden = p.dataset.zoom !== k; });
      fitEl.hidden = !!k; cue.hidden = !!k;
      zoomBtns.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.zoom === k)));
    };
    function openZoom(k, from) {
      const panel = panelOf(k);
      if (!panel) return;
      if (openKey === k) { closeZoom(false); return; }            // a second tap closes it
      if (current && current.card !== card) current.close(true);  // only one close-up open on the page
      const swap = openKey !== null;
      if (anim) { anim.cancel(); anim = null; }
      if (!swap) { prevMode = mode; if (mode !== 'normal') setMode('normal'); }
      opener = from || null; openKey = k; current = { card, close: closeZoom };
      show(k);
      panel.querySelectorAll('.zx-page').forEach((pg, i) => { pg.hidden = i !== 0; });
      // an opener outside the plate and the chip row ("Show me" further down) brings the close-up into view and it
      // grows from its own top; otherwise it grows out of the tapped callout or chip (2.3)
      const far = !!(from && !stage.contains(from) && !from.closest('.zx-chips'));
      const h = panel.querySelector('.zx-h');
      h.focus({ preventScroll: true });
      const r = h.getBoundingClientRect();
      if (far || r.top < 8 || r.top > innerHeight * 0.55) panel.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
      if (!reduced()) {
        if (swap) anim = panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: tok('--dur-fast', 150), easing: ease('--ease-standard') });
        else {
          const pr = panel.getBoundingClientRect(), fr = (from || panel).getBoundingClientRect();
          panel.style.transformOrigin = far ? '50% 0' : (fr.left + fr.width / 2 - pr.left).toFixed(0) + 'px ' + (fr.top + fr.height / 2 - pr.top).toFixed(0) + 'px';
          anim = panel.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: tok('--dur-enter', 240), easing: ease('--ease-enter') });
        }
        anim.onfinish = () => { anim = null; };
      }
    }
    function closeZoom(instant) {
      if (openKey === null) return;
      const panel = panelOf(openKey), back = opener;
      if (anim) { anim.cancel(); anim = null; }
      const done = () => {
        anim = null; openKey = null; opener = null; if (current && current.card === card) current = null;
        show(null); fit(fitEl);
        if (prevMode !== 'normal') setMode(prevMode);
        if (!instant && back && document.contains(back)) back.focus();
      };
      if (instant || reduced()) { done(); return; }
      anim = panel.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: tok('--dur-exit', 160), easing: ease('--ease-exit') });
      anim.onfinish = done;
    }
    zoomBtns.forEach(c => c.addEventListener('click', () => openZoom(c.dataset.zoom, c)));
    // the Mistake view's "Also check your wrist" line: opens the hand close-up in the plate box (it scrolls into view)
    card.querySelectorAll('.ht-also-btn').forEach(b => b.addEventListener('click', () => openZoom(b.dataset.zoom, b)));
    panels.forEach(p => {
      p.querySelector('.zx-close').addEventListener('click', () => closeZoom(false));
      p.querySelectorAll('.pager-btn').forEach(b => b.addEventListener('click', () => {
        const i = +b.dataset.page;
        p.querySelectorAll('.zx-page').forEach((pg, j) => { pg.hidden = j !== i; });
        const nb = p.querySelector('.zx-page[data-page="' + i + '"] .pager-btn[data-page="' + i + '"]');
        if (nb) nb.focus({ preventScroll: true });
      }));
      p.querySelectorAll('[data-feelrow]').forEach(b => b.addEventListener('click', () => openRow(b.dataset.feelrow, true, true)));
    });

    // ---- where you should feel it (S4-S6) ----
    const feel = card.querySelector('.feel');
    if (!feel) return;
    const map = feel.querySelector('[data-feel-map]'), feelH = feel.querySelector('h4');
    const rows = [...feel.querySelectorAll('.fr')], more = feel.querySelector('.fr-more');
    let played = false, openRowKey = null;
    const play = () => {
      played = true;
      if (reduced() || map.classList.contains('is-focus')) return;
      map.classList.remove('is-playing'); void map.getBoundingClientRect(); map.classList.add('is-playing');
    };
    map.addEventListener('animationend', e => { if (e.animationName === 'feel-sweep') map.classList.remove('is-playing'); });
    if (window.IntersectionObserver) {
      let t = null;
      const io = new IntersectionObserver(([e]) => {
        if (played) { io.disconnect(); return; }
        if (e.intersectionRatio >= 0.5) t = t || setTimeout(() => { io.disconnect(); if (!played) play(); }, 300);
        else { clearTimeout(t); t = null; }
      }, { threshold: [0, 0.5] });
      io.observe(map);
    }
    map.addEventListener('click', play);
    // pause a running sweep while the map is scrolled fully out of view; it resumes where it stopped (FEEL_JS, plan
    // S-2 condition 6). Behaviour only: inline animation-play-state, no pixel change while visible.
    if (window.IntersectionObserver) new IntersectionObserver(([e]) => {
      map.querySelectorAll('.feel-band').forEach(b => { b.style.animationPlayState = e.isIntersecting ? '' : 'paused'; });
    }, { threshold: 0 }).observe(map);
    const setMore = open => {
      if (!more) return;
      rows.forEach(r => { if (r.hasAttribute('data-more')) r.hidden = !open && r.dataset.row !== openRowKey; });
      more.setAttribute('aria-expanded', String(open));
      more.textContent = open ? 'Show fewer' : 'Show ' + more.dataset.n + ' more';
    };
    function openRow(k, scroll, force) {
      const target = k === openRowKey && !force ? null : k;   // a row button toggles; a "This is usually why" link only opens
      rows.forEach(r => {
        const on = r.dataset.row === target, b = r.querySelector('.fr-btn');
        b.setAttribute('aria-expanded', String(on));
        r.querySelector('.fr-body').hidden = !on;
        if (on) r.hidden = false;
      });
      const prevKey = openRowKey; openRowKey = target;
      if (more && more.getAttribute('aria-expanded') !== 'true') rows.forEach(r => { if (r.hasAttribute('data-more')) r.hidden = r.dataset.row !== openRowKey; });
      const btn = target ? feel.querySelector('.fr[data-row="' + target + '"] .fr-btn') : null;
      map.querySelectorAll('.feel-mark').forEach(g => g.classList.toggle('on', g.dataset.row === target));
      const marked = !!(btn && (btn.hasAttribute('data-watch') || btn.hasAttribute('data-pain')));
      map.classList.toggle('is-focus', marked);
      if (marked) map.classList.remove('is-playing');
      feel.querySelector('.lg-watch').hidden = !(btn && btn.hasAttribute('data-watch'));
      feel.querySelector('.lg-pain').hidden = !(btn && btn.hasAttribute('data-pain'));
      map.setAttribute('aria-label', btn ? btn.dataset.label : map.dataset.restLabel);
      if (scroll && btn) { btn.focus({ preventScroll: true }); btn.closest('.fr').scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); }
      return prevKey;
    }
    rows.forEach(r => r.querySelector('.fr-btn').addEventListener('click', () => openRow(r.dataset.row, false)));
    if (more) more.addEventListener('click', () => setMore(more.getAttribute('aria-expanded') !== 'true'));
    const feelChip = card.querySelector('.zx-chip[data-feel]');
    if (feelChip) feelChip.addEventListener('click', () => {
      feel.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
      feelH.focus({ preventScroll: true });
      played = true; setTimeout(play, reduced() ? 0 : 450);
    });
    // "Show me" from a row or a setup step: the close-up opens on the plate, which comes into view
    card.querySelectorAll('.fr-show, .st-show').forEach(b => b.addEventListener('click', () => {
      if (openKey !== b.dataset.zoom) openZoom(b.dataset.zoom, b);
      else { const p = panelOf(b.dataset.zoom); p.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); p.querySelector('.zx-h').focus({ preventScroll: true }); }
    }));
    // a feel row's "When to get it checked": the sheet's one red-flag block, in Risks (plan 2.4, HT9-A3)
    card.querySelectorAll('.rf-link').forEach(b => b.addEventListener('click', () => {
      const f = card.querySelector('#' + b.getAttribute('aria-controls'));
      if (!f) return;
      f.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
      f.focus({ preventScroll: true });
    }));
    const stMore = card.querySelector('.st-more');
    if (stMore) stMore.addEventListener('click', () => {
      const open = stMore.getAttribute('aria-expanded') !== 'true';
      card.querySelectorAll('.st-list li[data-more]').forEach(li => { li.hidden = !open; });
      stMore.setAttribute('aria-expanded', String(open));
      stMore.textContent = open ? 'Fewer steps' : 'All ' + stMore.dataset.n + ' steps';
    });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && current) { e.preventDefault(); current.close(false); } });
})();
`;

const html = `<title>M/ARC Technical Plates</title>
<style>${PAGE_CSS}${SHEET_CSS}</style>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<header class="pg-head">
  <span class="pg-kicker">M/ARC · How to do it</span>
  <h1>Option 2 · Technical Plate</h1>
  <p>Still drawings computed from joint angles, in the app's own colours: no photos, no video. Tap Trace to play the path once, Mistake to see the common fault, and a label to highlight its cue. Under each plate you can now look closer at the hand and posture (right next to wrong), see where you should feel it, follow the setup steps, and see when to stop.</p>
  <a class="pg-jump" href="#machine-chest-press-chip-hand">Machine chest press: the wrist fix <span aria-hidden="true">&darr;</span></a>
  <div class="pg-theme">
    <span class="pg-theme-label" id="theme-label">App theme</span>
    <div class="segmented" role="group" aria-labelledby="theme-label" id="theme-control">${themeSeg}</div>
  </div>
</header>
<main id="sheets" data-theme="silent-black" aria-label="Exercise sheets">
${ZDOTS}
${GROUPS.map(g => `<section class="group" id="group-${g.id}" aria-labelledby="group-${g.id}-title"><h2 class="group-title" id="group-${g.id}-title">${esc(g.title)}</h2>
${g.ids.map(id => card(EX[id])).join('\n')}
</section>`).join('\n')}
</main>
<footer class="pg-foot">
  <p>Mockup for the owner's review. Drawings are computed by our own code from joint angles.</p>
  <p>Body map drawings: from the <a href="https://github.com/vulovix/body-muscles" target="_blank" rel="noopener noreferrer">body-muscles</a> package by Ivan Vulovic, Apache License 2.0, as used in the app's muscle map.</p>
</footer>
<script>${JS}</script>
`;
const out = join(here, 'technical-plates.html');
writeFileSync(out, html);
console.log(out, (html.length / 1024).toFixed(0) + ' KB');
