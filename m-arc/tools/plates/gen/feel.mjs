// HT-8 plugin: "Where you should feel it" -> src/howto/generated/feel-<chromeId>.ts (x8) and src/slices/howto/css/feel.css.
// (Named feel-<chromeId>, not ht-<slug>-feel: every ht-*.ts in generated/ is a plate module to HT-2/HT-3's tests;
// supervisor ruling, PR #119.)
// Every state is pre-rendered at build time by the vendored golden-B engine (critic fix 4, no TypeScript port):
// golden B's own feelSection() (artifact/howto-layers.mjs, run from a mirror copy so nothing is written into layers/)
// renders the rest map with renderFeelMap, splices each row's watch/pain marks from renderFeelMap({ avoid, pain })
// into the same SVGs as hidden <g class="feel-mark">, and adds renderFeelLegend + the rows. The section is cut out
// whole and emitted as one JSON string literal, so the parsed string is golden B's bytes, never re-serialized.
// CSS: FEEL_CSS plus the golden-B page rules the section's own elements use, through HT-2's rewriteCss with the
// feel pre-rules below (each unit-tested in tests/howto/feel.test.ts).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../lib/inputs.mjs';
import { parse, rewriteCss } from '../css.mjs';
import { cleanupMirror, makeMirror, readManifest } from '../layers.mjs';

export const PLATES_JSON = 'tools/plates/plates.json';
export const PAGE = 'tools/plates/layers/artifact/technical-plates.html';
export const BUILD_PAGE = 'tools/plates/layers/artifact/build-page.mjs';
export const CSS_OUT = 'src/slices/howto/css/feel.css';

export const inputs = () => [
  ...Object.keys(readManifest().files).map(p => `tools/plates/layers/${p}`),
  'tools/plates/layers/MANIFEST.json', 'tools/plates/layers.mjs', 'tools/plates/css.mjs', PLATES_JSON,
];

export const chunkName = chromeId => `feel-${chromeId}`;
/** golden B's card id and id prefix for a library id (the lateral raise's card is `lateral_raise`). */
export const cardOf = row => ({ cardId: row.chromeId.replace(/-/g, '_'), pre: row.chromeId });

/** Cuts the one feel section out of a card's layer HTML. */
export function feelSectionOf(after, pre) {
  const open = `<section class="hw-sec feel" id="${pre}-feel"`;
  const a = after.indexOf(open);
  if (a < 0 || after.indexOf(open, a + 1) >= 0) throw new Error(`feel: expected one feel section for ${pre}`);
  const b = after.indexOf('</section>', a);
  const s = after.slice(a, b + '</section>'.length);
  if (s.slice(open.length).includes('<section')) throw new Error(`feel: nested section in ${pre}`);
  return s;
}

/* ---------------------------------------------------------------- CSS ------------------------------------------- */

/** The golden-B page's HOWTO_CSS template, sliced from build-page.mjs (it holds no interpolation). */
export function pageHowtoCss(src) {
  const a = src.indexOf('const HOWTO_CSS = `'), b = src.indexOf('\n`;', a);
  if (a < 0 || b < 0) throw new Error('feel: HOWTO_CSS not found in build-page.mjs');
  const css = src.slice(a + 'const HOWTO_CSS = `'.length, b + 1);
  if (css.includes('${') || css.includes('`')) throw new Error('feel: HOWTO_CSS is not a plain template');
  return css;
}

/** The classes golden B's page script adds at runtime (build-page.mjs feel script): marks shown, playing, focus. */
export const RUNTIME_CLASSES = Object.freeze(['on', 'is-playing', 'is-focus']);
/** Every class token used in a markup string. */
export const classesOf = html => new Set([...html.matchAll(/class="([^"]*)"/g)].flatMap(m => m[1].split(/\s+/).filter(Boolean)));

/** Feel rule A (selection): keep the page rules for the section's own elements. A selector survives when it has at
 *  least one class, every class in it is used in the feel markup, and none is in OWNED_ELSEWHERE; a rule with no surviving selector is dropped;
 *  a @keyframes survives when a kept rule names it. */
/** Section chrome another card ships (supervisor ruling on HT-6's design note): HT-6 owns these rules. */
export const OWNED_ELSEWHERE = Object.freeze(['hw-sec', 'fr-show', 'st-show']);
export function selectRules(css, used) {
  const keep = sel => { const cls = [...sel.matchAll(/\.([\w-]+)/g)].map(m => m[1]); return cls.length > 0 && cls.every(c => used.has(c) && !OWNED_ELSEWHERE.includes(c)); };
  const rule = n => { const sels = n.sel.split(',').map(s => s.trim()).filter(keep); return sels.length ? `${sels.join(', ')} { ${n.body} }` : null; };
  const out = [], frames = [];
  for (const n of parse(css)) {
    if (n.sel != null) { const r = rule(n); if (r) out.push(r); continue; }
    if (n.at.startsWith('@keyframes')) { frames.push(n); continue; }
    const inner = n.body.map(rule).filter(Boolean);
    if (inner.length) out.push(`${n.at} { ${inner.join(' ')} }`);
  }
  // a keyframes rule survives when a kept rule names it
  const kept = out.join('\n');
  for (const n of frames) if (new RegExp(`\\b${n.at.split(/\s+/)[1]}\\b`).test(kept)) out.push(`${n.at} { ${n.body} }`);
  return out.join('\n');
}

/** Feel rule B (theme blocks): golden B's five `[data-theme]{--feel-main:…}` lines become one ht token. They must be
 *  one line per theme and all equal (FEEL_MAIN_MIX is 25 for every theme); otherwise the rewrite refuses. */
export function themeBlocks(css, themeIds) {
  const re = /^\[data-theme="([\w-]+)"\]\{--feel-main:([^}]+)\}\n/gm;
  const found = [...css.matchAll(re)];
  const ids = found.map(m => m[1]), vals = new Set(found.map(m => m[2]));
  if (JSON.stringify(ids) !== JSON.stringify(themeIds)) throw new Error(`feel: theme blocks ${ids} != ${themeIds}`);
  if (vals.size !== 1) throw new Error(`feel: --feel-main differs per theme (${[...vals].join(' | ')}); one ht token cannot carry it`);
  return { css: css.replace(re, ''), tokens: { '--ht-feel-main': [...vals][0] } };
}

/** Feel rule C (names and literal fallbacks): golden B's page-local custom properties become --ht-* names, and the
 *  literal times the lints ban move into ht tokens with identical values. Each pattern must be found. */
export const RENAMES = Object.freeze([
  ['var(--feel-main)', 'var(--ht-feel-main)'],
  ['var(--feel-map-h, 280px)', 'var(--ht-feel-map-h)', ['--ht-feel-map-h', '280px']],
  ['--feel-map-h: 236px', '--ht-feel-map-h: 236px'],
  ['var(--feel-delay, 0ms)', 'var(--feel-delay, var(--ht-feel-delay-0))', ['--ht-feel-delay-0', '0ms']],
  ['var(--dur-base, 200ms)', 'var(--dur-base, var(--ht-feel-mark-dur))', ['--ht-feel-mark-dur', '200ms']],
]);
export function renames(css, total) {
  const tokens = {};
  for (const [from, to, tok] of [...RENAMES, [`feel-sweep ${total}ms`, 'feel-sweep var(--ht-feel-sweep)', ['--ht-feel-sweep', `${total}ms`]]]) {
    if (!css.includes(from)) throw new Error(`feel: "${from}" not found`);
    css = css.split(from).join(to);
    if (tok) tokens[tok[0]] = tok[1];
  }
  return { css, tokens };
}

/** Feel rule D (keyframes with a literal timing function): `var()` is not resolved inside a keyframe's
 *  animation-timing-function (measured in Chromium: getKeyframes() reads `ease`), so feel-sweep keeps its literal
 *  bezier and is emitted verbatim inside the ht-tokens block, the one place literals are allowed. */
export function liftKeyframes(css, name) {
  const re = new RegExp(`@keyframes ${name} \\{[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\}\\n?`);
  const m = css.match(re);
  if (!m) throw new Error(`feel: @keyframes ${name} not found`);
  return { css: css.replace(re, ''), keyframes: m[0].trim().replace(/\s+/g, ' ') };
}

/** The app frame (not golden CSS): the section host inherits golden B's card text styles, as HT-3's `.ht-golden` does
 *  (sheet.css). The 358 px width comes from HT-3's one sheet-wide bleed, `.ht [data-section] { margin-inline: -1px }`
 *  (supervisor: no per-section bleed). */
export const FRAME = '.ht .ht-feel-host { color: var(--text); font-family: var(--font); font-size: var(--fs-body); line-height: var(--lh-body); letter-spacing: var(--ls-body); }\n';

/** The whole feel.css: rules B, C, D on FEEL_CSS, rule A on the page CSS, then rewriteCss, then the ht tokens. */
export function feelCss({ feelCss: F, pageCss, used, themeIds, total }) {
  const b = themeBlocks(F, themeIds);
  const c = renames(`${b.css}\n${selectRules(pageCss, used)}\n`, total);
  const d = liftKeyframes(c.css, 'feel-sweep');
  const out = rewriteCss(d.css);
  const tokens = { ...b.tokens, ...c.tokens };
  const head = '/* ht-tokens:start */\n.ht { ';
  if (!out.startsWith(head)) throw new Error('feel: rewriteCss output has no ht-tokens head');
  const decl = Object.entries(tokens).sort(([x], [y]) => x.localeCompare(y)).map(([k, v]) => `${k}: ${v};`).join(' ');
  return out.replace(head, `${head}${decl} `).replace('/* ht-tokens:end */', `${d.keyframes}\n/* ht-tokens:end */`) + FRAME;
}

/* ---------------------------------------------------------------- output ---------------------------------------- */

const lit = s => JSON.stringify(s);
export function moduleText(id, pre, section) {
  return `// One string per exercise: golden B's "Where you should feel it" section, every state pre-rendered.
export default {
  id: ${lit(id)},
  pre: ${lit(pre)},
  section: ${lit(section)},
} as const;
`;
}

/** Renders every section and the CSS from a mirror of the vendored layers. */
export async function renderAll() {
  const rows = JSON.parse(readFileSync(join(ROOT, PLATES_JSON), 'utf8'));
  const mirror = makeMirror();
  try {
    const url = p => pathToFileURL(join(mirror, p)).href;
    const { buildHowtoLayers } = await import(url('artifact/howto-layers.mjs'));
    const fm = await import(url('engine/feelmap.mjs'));
    const { THEME_IDS } = await import(url('engine/themes.mjs'));
    const { layers } = await buildHowtoLayers();
    const page = readFileSync(join(ROOT, PAGE), 'utf8');
    const sections = Object.entries(rows).map(([id, row]) => {
      const { cardId, pre } = cardOf(row);
      if (!layers[cardId]) throw new Error(`feel: golden B has no card ${cardId}`);
      const section = feelSectionOf(layers[cardId].after, pre);
      // the pinned golden-B page (L0-B hash-locked) carries these exact bytes
      if (!page.includes(section)) throw new Error(`feel: ${id} section is not in the pinned golden-B page`);
      return { id, slug: row.slug, pre, section };
    });
    const pageCss = pageHowtoCss(readFileSync(join(ROOT, BUILD_PAGE), 'utf8'));
    if (!page.includes(fm.FEEL_CSS) || !page.includes(pageCss)) throw new Error('feel: FEEL_CSS / HOWTO_CSS not in the pinned page');
    const used = new Set([...sections.flatMap(s => [...classesOf(s.section)]), ...RUNTIME_CLASSES]);
    const total = +fm.FEEL_CSS.match(/animation: feel-sweep (\d+)ms/)[1];
    const css = feelCss({ feelCss: fm.FEEL_CSS, pageCss, used, themeIds: THEME_IDS, total });
    // fm: the engine instance golden B rendered with, after the renderers loaded (howto/render-hanging_leg_raise.mjs
    // REGION_FIX edits the shared body parts for every map on the page, so callers re-render states with this one)
    return { sections, css, fm };
  } finally { cleanupMirror(mirror); }
}

export async function outputs() {
  const { sections, css } = await renderAll();
  return [
    ...sections.map(s => ({ path: `src/howto/generated/${chunkName(s.pre)}.ts`, text: moduleText(s.id, s.pre, s.section) })),
    { path: CSS_OUT, text: css },
  ];
}
