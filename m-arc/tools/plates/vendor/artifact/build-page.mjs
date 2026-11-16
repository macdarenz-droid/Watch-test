// Builds ONE self-contained review page with every finished Technical Plate: artifact/technical-plates.html.
// Run: node artifact/build-page.mjs. Imports the engine, every exercise spec and the reference plate unchanged.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderPlate, PLATE_CSS } from '../engine/index.mjs';
import { plate as refPlate } from '../ref-src/plate.mjs';
import { THEMES, THEME_IDS, allThemesCss } from '../ref-src/themes.mjs';

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

// ---- sources (from each spec file's header; the lateral raise from the M/ARC research file) ----
const WINTER = 'Winter DA. Biomechanics and Motor Control of Human Movement, 4th ed. (Wiley, 2009), ch. 4: body segment proportions used for every figure.';
const SOURCES = {
  lateral_raise: [
    'ACE Exercise Library, Lateral Raise (acefitness.org, exercise 26).',
    'Physiopedia, Scapulohumeral Rhythm.',
    'PubMed Central articles PMC7503819 and PMC12277279 (cited by the M/ARC research file lib_dumbbell_lateral_raise).',
    'M/ARC research file lib_dumbbell_lateral_raise: tempo, shoulder range, elbows-lead ramp.',
  ],
  barbell_back_squat: [
    'NSCA, Essentials of Strength Training and Conditioning, 4th ed. (Haff & Triplett 2016), ch. 15, back squat.',
    'Glassbrook, Helms, Brown & Storey 2017. High-bar vs low-bar back squat. JSCR 31(9):2618-2634.',
    'Fry, Smith & Schilling 2003. Effect of knee position on hip and knee torques during the barbell squat. JSCR 17(4):629-633.',
    'Myer et al. 2014. The back squat: a proposed assessment of functional deficits and technical factors. Strength Cond J 36(6):4-27.',
    'Schoenfeld 2010. Squatting kinematics and kinetics. JSCR 24(12):3497-3506.',
    'Rippetoe. Starting Strength, 3rd ed. (2011): bar over the middle of the foot.',
  ],
  pull_up: [
    'ACE Exercise Library, Pull-ups (acefitness.org, exercise 191).',
    'Snarr et al. 2017. J Hum Kinet 58:5-13 (grip 1.5x shoulder width; rep ends with the chin at the bar).',
    'Youdas et al. 2010. JSCR 24(12):3404-3414.',
    'Dickie et al. 2017. J Electromyogr Kinesiol 32:30-36.',
    'Williamson & Price 2021. Kipping vs strict pull-ups. Int J Exerc Sci 8(5) (abstract).',
    'Prinold & Bull 2016. Scapular kinematics in pull-ups. J Sci Med Sport (PMID 26383875).',
  ],
  hanging_leg_raise: [
    'Catalyst Athletics exercise library, hanging leg raise (hang still, curl the pelvis up).',
    'ExRx, Hanging Straight Leg-Hip Raise (the abs work dynamically only when the pelvis tilts back).',
    'M/ARC research file lib_hanging_leg_raise (SetForSet, Bodybuilding Wizard, American Sport and Fitness): hip 0 to 90 deg, mistake "swing and short-change it", tempo.',
  ],
  lat_pulldown: [
    'ACE Exercise Library, Seated Lat Pulldown (acefitness.org, exercise 158): lean back no more than 30 deg, bar to the upper chest.',
    'NSCA, Exercise Technique Manual for Resistance Training, 3rd ed. (2016), lat pulldown.',
    'Andersen et al. 2014. JSCR 28(4):1135-1142 (grip width).',
    'Signorile et al. 2002. JSCR 16(4):539-546; Sperandei et al. 2009. JSCR 23(7):2033-2038 (front vs behind the neck).',
    'Durall et al. 2001. Strength Cond J 23(5):10-18.',
    'M/ARC research file lib_lat_pulldown: lean 0-15 deg, mistake "Lean and heave", tempo.',
  ],
  seated_cable_row: [
    'ACE Exercise Library, Seated Row (acefitness.org, exercise 48): elbows back close to the ribs, pause 1 s.',
    'NSCA, Essentials of Strength Training and Conditioning, 4th ed. (2016), ch. 15, low-pulley seated row (book, not re-checked online).',
    'Bodybuilding.com, Seated Cable Rows; REP Fitness, How to do a seated cable low row.',
    'M/ARC research file lib_seated_cable_row (ACE, Olaben, TZFIT): torso -5 to +5 deg at the finish; rocking back is the classic error.',
  ],
  leg_press: [
    'ACE Exercise Library, Seated Leg Press (acefitness.org, exercise 154): back and sacrum flat on the pad, knees about 90 deg, no lockout.',
    'Lopes et al. 2020. Inclined leg press, muscle activation and kinematics. IJERPH 17(22):8698.',
    'NASM Exercise Library, Leg Press (listed, page not opened).',
    'PureGym, 45-degree leg press (toes slightly out).',
    'ISSA, Leg Press Exercise Guide plus Common Mistakes (issaonline.com): knees collapsing inwards; lowering the sled too far lifts the buttocks and lower back off the pad.',
    'M/ARC research file lib_leg_press (PureGym, ISSA, GymPT). Machine angles (30 deg back pad, 15 deg plate tilt) are inferred, not from a maker drawing.',
  ],
  machine_chest_press: [
    'ACE Exercise Library, Seated Chest Press (acefitness.org, exercise 188): handles at mid-chest, blades on the pad, elbows not locked.',
    'Fees, Decker, Snyder-Mackler & Axe 1998. Upper extremity weight-training modifications for the injured athlete. Am J Sports Med 26(5):732-742.',
    'NSCA, Exercise Technique Manual for Resistance Training, 3rd ed. (2016), seated chest press (book, not re-checked online).',
    'M/ARC research file lib_machine_chest_press: elbow 15-90 deg, mistake "Round and lock", tempo.',
  ],
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
  const n0 = e.normal.cues[0], m0 = e.mistake?.cues[0];
  const svgN = withGuides(e.normal.svg, e.guides ?? {});
  const figN = `<figure class="plate" data-mode="normal">${svgN}${tagButtons(e.normal.overlay, e.normal.cues, id, 'n', n0?.key)}<figcaption class="sr-only">${esc(e.alt)}</figcaption></figure>`;
  const figM = e.mistake ? `<figure class="plate" data-mode="mistake" hidden>${e.mistake.svg}${tagButtons(e.mistake.overlay, e.mistake.cues, id, 'm', m0?.key)}<figcaption class="sr-only">${esc(`${e.name}: the common mistake, drawn dashed in the mistake colour over the correct end position.`)}</figcaption></figure>` : '';
  const tells = e.mistake ? `<div class="tells" hidden><span class="eyebrow">Tells</span><ol>${e.mistake.cues.map(t => `<li><b>${plain(t.text)}</b><span>${esc(t.cue)}</span></li>`).join('')}</ol></div>` : '';
  return `<article class="sheet-card" id="card-${id}" data-ex="${id}" data-sel-n="${n0?.key ?? ''}" data-sel-m="${m0?.key ?? ''}" aria-labelledby="${id}-title">
  <div class="sheet-grab" aria-hidden="true"></div>
  <div class="sheet-head"><h3 id="${id}-title"><span class="eyebrow sheet-eyebrow">How to do it</span>${esc(e.name)}</h3></div>
  <div class="plate-fit" id="${id}-plate">${figN}${figM}</div>
  <p class="cue-line" id="${id}-cue" aria-live="polite">${esc(n0?.cue ?? '')}</p>
  <div class="plate-controls">
    <button type="button" class="howto-pill" id="${id}-trace" aria-pressed="false" aria-label="Trace the movement once">${I.trace(18)} Trace</button>
    ${e.mistake ? `<button type="button" class="howto-pill mistake" id="${id}-mistake" aria-pressed="false">Mistake</button>` : ''}
    <span class="grow"></span>
    <span class="hint howto-offline">${I.check(14)} Saved offline</span>
  </div>
  ${tells}
  ${e.tempo ? tempoStrip(e.tempo) : ''}
</article>`;
}

const themeButtons = THEME_IDS.map(t => `<button type="button" class="seg" id="theme-${t}" data-theme-id="${t}" aria-pressed="${t === 'silent-black'}">${esc(THEMES[t].name)}</button>`).join('');
const ORDER = ['silent-black', 'paper', 'midnight', 'ember', 'emerald'];
const themeSeg = ORDER.map(t => themeButtons.match(new RegExp(`<button[^>]*id="theme-${t}"[^>]*>[^<]*</button>`))[0]).join('');

const sourcesList = GROUPS.flatMap(g => g.ids).map(id => `<li><b>${esc(EX[id].name)}</b><ul>${SOURCES[id].map(s => `<li>${esc(s)}</li>`).join('')}</ul></li>`).join('');

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
.pg-theme { display: grid; gap: 8px; margin-top: 8px; }
.pg-theme-label { font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--pg-text-2); }
.segmented { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px; border-radius: 12px; background: var(--pg-seg); border: 1px solid var(--pg-border); width: fit-content; max-width: 100%; }
.seg { min-height: 44px; padding: 0 14px; border-radius: 9px; font-size: 14px; font-weight: 500; color: var(--pg-text-2); white-space: nowrap; }
.seg[aria-pressed="true"] { background: var(--pg-seg-on); color: var(--pg-text); box-shadow: 0 1px 2px rgba(0,0,0,.12); }
.seg:hover { color: var(--pg-text); }
@media (max-width: 479px) { .segmented { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); width: 100%; }
  .seg { padding: 2px 4px; font-size: 13px; line-height: 16px; white-space: normal; } }
.pg-foot { max-width: calc(var(--wrap) + 32px); margin: 0 auto; padding: 24px 16px 48px; color: var(--pg-text-2); font-size: 14px; display: grid; gap: 12px; }
.pg-foot details { border: 1px solid var(--pg-border); border-radius: 12px; background: var(--pg-surface); }
.pg-foot summary { min-height: 44px; display: flex; align-items: center; padding: 0 16px; cursor: pointer; color: var(--pg-text); font-weight: 500; }
.pg-foot details > ul { margin: 0; padding: 0 16px 16px 16px; list-style: none; display: grid; gap: 12px; }
.pg-foot details b { color: var(--pg-text); font-weight: 600; }
.pg-foot details ul ul { margin: 4px 0 0; padding-left: 18px; display: grid; gap: 2px; list-style: disc; overflow-wrap: anywhere; }
/* ---- the app band: app theme tokens scoped to #sheets ---- */
#sheets { background: var(--bg); color: var(--text); font-family: var(--font); font-size: var(--fs-body); line-height: var(--lh-body); letter-spacing: var(--ls-body); padding: 28px 16px 36px; border-block: 1px solid var(--pg-border); transition: background-color var(--dur-base) var(--ease-standard); }
#sheets :focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
#sheets .plate-callout:focus-visible { outline-offset: -2px; }
.group { max-width: var(--wrap); margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 358px), 1fr)); align-items: start; gap: 20px; }
.group + .group { margin-top: 36px; }
.group-title { grid-column: 1 / -1; font-size: var(--fs-cap); line-height: var(--lh-cap); letter-spacing: var(--ls-cap); text-transform: uppercase; font-weight: var(--fw-semibold); color: var(--text-2); padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle); }
`;

// ---- the app's sheet CSS (as ref-src/build.mjs / engine/sheet.mjs), plus the card frame and the trace timing ----
const SHEET_CSS = `
${TOKENS}
${allThemesCss()}
:root { --focus-ring: color-mix(in srgb, var(--accent) 80%, var(--text)); }
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
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  document.querySelectorAll('.sheet-card').forEach(card => {
    const ex = card.dataset.ex;
    const fitEl = card.querySelector('.plate-fit');
    if (ro) ro.observe(fitEl); fit(fitEl);
    const figN = card.querySelector('.plate[data-mode="normal"]'), figM = card.querySelector('.plate[data-mode="mistake"]');
    const cue = card.querySelector('.cue-line'), tells = card.querySelector('.tells');
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
      if (btnMis) btnMis.setAttribute('aria-pressed', String(m === 'mistake'));
      select(m === 'normal' ? figN : figM, sel[m]);
      fit(fitEl);
    };
    [figN, figM].filter(Boolean).forEach(fig => fig.querySelectorAll('.plate-callout').forEach(b => b.addEventListener('click', () => select(fig, b.dataset.key))));
    if (btnMis) btnMis.addEventListener('click', () => setMode(mode === 'mistake' ? 'normal' : 'mistake'));
    const tracePath = figN.querySelector('.trace');
    const endTrace = () => { figN.classList.remove('tracing'); btnTrace.setAttribute('aria-pressed', 'false'); };
    if (tracePath) tracePath.addEventListener('animationend', endTrace);
    btnTrace.addEventListener('click', () => {
      if (mode !== 'normal') setMode('normal');
      figN.classList.remove('tracing');
      void figN.getBoundingClientRect();
      if (document.documentElement.getAttribute('data-motion') === 'reduce' || !tracePath) { endTrace(); return; }   // reduced motion: the end state is already shown
      figN.classList.add('tracing');
      btnTrace.setAttribute('aria-pressed', 'true');
    });
    select(figN, sel.normal);
  });
})();
`;

const html = `<title>M/ARC Technical Plates</title>
<style>${PAGE_CSS}${SHEET_CSS}</style>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<header class="pg-head">
  <span class="pg-kicker">M/ARC · How to do it</span>
  <h1>Option 2 · Technical Plate</h1>
  <p>Still drawings computed from joint angles, in the app's own colours: no photos, no video. Tap Trace to play the path once, Mistake to see the common fault, and a label to highlight its cue.</p>
  <div class="pg-theme">
    <span class="pg-theme-label" id="theme-label">App theme</span>
    <div class="segmented" role="group" aria-labelledby="theme-label" id="theme-control">${themeSeg}</div>
  </div>
</header>
<main id="sheets" data-theme="silent-black" aria-label="Exercise sheets">
${GROUPS.map(g => `<section class="group" id="group-${g.id}" aria-labelledby="group-${g.id}-title"><h2 class="group-title" id="group-${g.id}-title">${esc(g.title)}</h2>
${g.ids.map(id => card(EX[id])).join('\n')}
</section>`).join('\n')}
</main>
<footer class="pg-foot">
  <p>Mockup for the owner's review. Drawings are computed by our own code from cited joint angles (Winter 2009 body proportions); sources per exercise below.</p>
  <details id="sources">
    <summary id="sources-toggle">Sources per exercise</summary>
    <ul>${sourcesList}<li><b>Every figure</b><ul><li>${esc(WINTER)}</li></ul></li></ul>
  </details>
</footer>
<script>${JS}</script>
`;
const out = join(here, 'technical-plates.html');
writeFileSync(out, html);
console.log(out, (html.length / 1024).toFixed(0) + ' KB');
