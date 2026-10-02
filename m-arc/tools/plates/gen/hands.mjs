// HT-6 plugin: golden B's hand close-ups -> src/howto/generated/hand-<chromeId>.ts, each exercise's close-up CSS ->
// src/slices/howto/css/zoom-<chromeId>.css, and the hand, chip, close-up frame and grip CSS ->
// src/slices/howto/css/hand.css. Found by glob (no registry line).
//
// Golden B draws one hand close-up per exercise (8, all distinct: each exercise's own render script draws its pages),
// so the key is the gallery chrome id. Each chunk carries:
//   - `panel`: the close-up's `<div class="zx" …>` block, cut byte for byte from the committed golden-B page
//     (tests/howto/golden/howto-layers.html), after the page is checked against its approved sha256;
//   - an import of `css/zoom-<chromeId>.css`: that exercise's scoped close-up rules (`.hx-<chromeId> …`, the page's
//     HOWTO_ZOOM_CSS part for it) through HT-2's rewriteCss. Vite splits it off with the chunk and loads it on first
//     open, after hand.css. The posture close-ups (HT-7) use the same rules and import the same file.
// Nothing is re-rendered or re-serialized: every string is a slice of the approved page.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, sha256 } from '../lib/inputs.mjs';
import { LAYERS, PAGE_SHA256, readManifest } from '../layers.mjs';
import { galleryCss, rewriteCss } from '../css.mjs';

export const PLATES_JSON = 'tools/plates/plates.json';
export const FIXTURE = 'tests/howto/golden/howto-layers.html';
export const inputs = () => [
  ...Object.keys(readManifest().files).map(p => `tools/plates/layers/${p}`),
  'tools/plates/layers/MANIFEST.json', 'tools/plates/layers.mjs', 'tools/plates/css.mjs', PLATES_JSON, FIXTURE,
];

/** The ht token a banned literal moves to, named from the literal (`font-size: 10.5px` -> --ht-fs-10-5px), so the
 *  mapping is mechanical and one literal always gets one name. */
export const tokenFor = (kind, lit) => `--ht-${kind}-${lit.replace(/[^\w]+/g, '-').replace(/-+$/, '')}`;
/** The whole element starting at `start` (a `<div`), by balanced div tags. */
export function divAt(html, start) {
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let d = 0;
  for (let m; (m = re.exec(html));) { d += m[0] === '</div>' ? -1 : 1; if (!d) return html.slice(start, m.index + 6); }
  throw new Error(`hands: unclosed div at ${start}`);
}

/** The hand close-up panel of one exercise, exactly as the golden-B page holds it. */
export function handPanel(html, id) {
  const open = `<div class="zx" id="${id}-zoom-hand" data-zoom="hand"`;
  const a = html.indexOf(open);
  if (a < 0) throw new Error(`hands: ${id}: no hand close-up in the golden-B page`);
  if (html.indexOf(open, a + 1) >= 0) throw new Error(`hands: ${id}: two hand close-ups`);
  return divAt(html, a);
}

/** Flat rules `sel { body }` of a stylesheet without at-rules (the scoped close-up CSS has none). */
const rulesOf = css => {
  if (/@(media|supports|keyframes)/.test(css)) throw new Error('hands: at-rule in the close-up CSS');
  return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim(), body: m[2] }));
};

/** The rules of one exercise's scope, as the page holds them (every selector starts `.hx-<id> `). */
export function scopedRules(zoomCss, id) {
  const pre = `.hx-${id} `;
  const out = rulesOf(zoomCss).filter(r => r.sel.split(',').some(s => s.trim().startsWith(pre)));
  for (const r of out) if (!r.sel.split(',').every(s => s.trim().startsWith(pre))) throw new Error(`hands: ${id}: mixed scope ${r.sel}`);
  if (!out.length) throw new Error(`hands: ${id}: no scoped close-up CSS`);
  return out.map(r => `${r.sel}{${r.body}}`).join('\n');
}

/** Literals -> var(--ht-…) before rewriteCss (which knows only the plate's tokens); returns [css, used]. */
export function preTokenize(css) {
  const used = new Map();
  const put = (kind, lit) => { const t = tokenFor(kind, lit); used.set(t, lit); return `var(${t})`; };
  // any border-radius / font-size value the lints would refuse (a literal, 0, a var() with a fallback) moves whole
  css = css.replace(/(border-radius\s*:\s*)([^;}]+?)(\s*)(?=;|}|$)/g, (m, p, v, sp) => (/^var\(--(radius|ht)-[\w-]+\)$/.test(v) ? m : p + put('r', v) + sp))
    .replace(/(font-size\s*:\s*)([^;}]+?)(\s*)(?=;|}|$)/g, (m, p, v, sp) => (/^var\(--(fs|ht)-[\w-]+\)$/.test(v) ? m : p + put('fs', v) + sp))
    .replace(/(^|[\s:(,*])(\d*\.?\d+m?s)(?=[\s;,)}]|$)/g, (m, p, lit) => p + put('t', lit))
    .replace(/cubic-bezier\([^)]*\)/g, lit => put('ease', lit));
  return [css, used];
}
/** rewriteCss, plus this plugin's own tokens, merged into its one ht-tokens block (sorted, as rewriteCss sorts).
 *  `inPanel`: the CSS styles golden-B close-up markup, whose crops keep `class="plate"` byte for byte, so HT-2's class
 *  map (`.plate` -> `.ht-plate`, for the app's plate block) is undone there. */
export function rewrite(css, { inPanel = false } = {}) {
  const [pre, used] = preTokenize(css);
  const out = rewriteCss(pre), line = /^\.ht \{ (.*) \}$/m, m = out.match(line);
  if (!m) throw new Error('hands: rewriteCss wrote no ht-tokens line');
  const all = new Map([...m[1].split(';').map(x => x.trim()).filter(Boolean).map(x => x.split(/:\s*/)), ...used]);
  const res = out.replace(line, `.ht { ${[...all].sort(([a], [b]) => a.localeCompare(b)).map(([t, v]) => `${t}: ${v};`).join(' ')} }`);
  return inPanel ? res.replace(/\.ht-(plate(?:-fit)?)(?![\w-])/g, '.$1') : res;
}

/** Selectors (whole rule heads) of the page's HOWTO_CSS that this card ships: the hand-loaded Mistake line, the
 *  close-up frame, the chip row, the grip section with its handling mistakes, the shared section frame, and the
 *  "Show me" link rules the handling mistakes use (`.st-show hm-show`). */
export const CHROME_SELECTORS = [
  '.plate-stage > .plate-fit[hidden], .cue-line[hidden]',
  '.ht-also', '.ht-also[hidden]', '.ht-also button',
  '.zx[hidden]', '.zx', '.zx-top', '.zx-h', '.zx-h:focus', '.zx-h:focus-visible', '.zx-close', '.zx-close:hover', '.zx-page[hidden]',
  '.zx-chips-wrap', '.zx-chips', '.zx-chip', '.zx-chip:hover', '.zx-chip[aria-pressed="true"]', '.zx-chip-cap', '.zx-chip[aria-pressed="true"] .zx-chip-cap',
  '.grip', '.grip-lead', '.grip-note', '.hm-head', '.hm-list', '.hm', '.hm-t', '.hm-t b', '.hm-t svg', '.hm-fix', '.hm-show',
  '.hw-sec', '.hw-sec > h4.eyebrow', '.hw-sec h4:focus', '.hw-sec h4:focus-visible',
  '.fr-show, .st-show', '.st-show',
];
/** The one HOWTO_CSS rule that styles inside a close-up (`.hx …`). The page has it after the scoped close-up CSS, so
 *  it wins their ties; each chunk's CSS (injected after hand.css) carries it after its scoped rules, keeping that. */
export const HX_TAIL = ['.hx > .zx-page > .hsec:first-child, .hx .zoom'];
/** The page's HOWTO_CSS text: cut from build-page.mjs and proven to be in the built page's style verbatim. */
export function howtoCss(buildPageSrc, style) {
  const a = buildPageSrc.indexOf('const HOWTO_CSS = `'), b = buildPageSrc.indexOf('\n`;', a);
  if (a < 0 || b < 0) throw new Error('hands: no HOWTO_CSS in build-page.mjs');
  const css = buildPageSrc.slice(a + 'const HOWTO_CSS = `'.length, b + 1);
  if (css.includes('${')) throw new Error('hands: HOWTO_CSS is a template');
  if (!style.includes(css)) throw new Error('hands: HOWTO_CSS is not in the golden-B page verbatim');
  return css;
}
/** The chrome rules, in page order; `.plate-stage > .plate-fit[hidden]` is the golden's own plate box (HT-3 hides
 *  the app's), so only `.cue-line[hidden]` of that rule is kept. */
export function chromeRules(css, selectors = CHROME_SELECTORS) {
  const flat = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@(media|keyframes)[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  const rules = rulesOf(flat).map(r => ({ sel: r.sel.replace(/\s+/g, ' '), body: r.body }));
  const out = [];
  for (const sel of selectors) {
    const r = rules.filter(x => x.sel === sel);
    if (r.length !== 1) throw new Error(`hands: HOWTO_CSS rule ${sel}: ${r.length} matches`);
  }
  for (const r of rules) if (selectors.includes(r.sel)) out.push(`${r.sel === CHROME_SELECTORS[0] ? '.cue-line[hidden]' : r.sel} {${r.body}}`);
  return out.join('\n');
}

/** D-HT6-budget (supervisor, 2026-09-30): each built `hand-<id>-*.js` chunk (www/assets, gzip default level) may be at
 *  most its size measured at the ruling + 10 %, rounded up. No detail is cut to fit (golden B is the reference). The
 *  measured sizes are pinned in hands.test; gate block HT-6 holds the built chunks to `handCeiling`. */
export const HAND_MEASURED = Object.freeze({
  'lateral-raise': { raw: 26570, gz: 8134 }, 'barbell-back-squat': { raw: 34361, gz: 10629 }, 'pull-up': { raw: 84470, gz: 23896 },
  'hanging-leg-raise': { raw: 44454, gz: 11445 }, 'lat-pulldown': { raw: 68272, gz: 19574 }, 'seated-cable-row': { raw: 23824, gz: 7673 },
  'leg-press': { raw: 22227, gz: 7430 }, 'machine-chest-press': { raw: 24375, gz: 7426 },
});
export const handCeiling = id => { const m = HAND_MEASURED[id]; if (!m) throw new Error(`hands: no budget for ${id}`); return { raw: Math.ceil((m.raw * 11) / 10), gz: Math.ceil((m.gz * 11) / 10) }; };   // integer maths (84470 * 1.1 is 92917.00000000001)

/** A single-quoted JS string literal of `s`: its value is `s` exactly, and the markup's double quotes stay unescaped,
 *  so golden B's `xmlns="http://www.w3.org/2000/svg"` reads as that attribute, which C17 allows (D-HT4-C17). */
export const lit = s => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')}'`;

/** The page's style without its at-rule blocks (@media, @keyframes, @font-face, @supports). Throws if one of them holds
 *  a close-up rule, which scopedRules would then miss. */
export function flatStyle(style) {
  const at = /@[\w-]+[^{;]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g;
  for (const m of style.matchAll(at)) if (/\.hx-[a-z-]+ /.test(m[0])) throw new Error('hands: a close-up rule inside an at-rule');
  return style.replace(at, '');
}

export async function outputs() {
  const rows = JSON.parse(readFileSync(join(ROOT, PLATES_JSON), 'utf8'));
  // The committed golden-B page (HT-4's fixture), refused unless it is the approved page. HT-4's gate block rebuilds
  // it from the vendored layers (L1-B), so reading it here keeps `generate` fast (no page build per run).
  const page = readFileSync(join(ROOT, FIXTURE));
  if (sha256(page) !== PAGE_SHA256) throw new Error(`hands: golden-B page sha256 ${sha256(page)} != approved ${PAGE_SHA256}`);
  const html = page.toString('utf8'), style = galleryCss(html), zoomCss = flatStyle(style);
  const H = await import(pathToFileURL(join(LAYERS, 'engine', 'hand.mjs')).href);
  if (!style.includes(H.HAND_CSS)) throw new Error('hands: HAND_CSS is not in the golden-B page verbatim');
  const chrome = howtoCss(readFileSync(join(LAYERS, 'artifact', 'build-page.mjs'), 'utf8'), style);
  const out = [];
  for (const row of Object.values(rows)) {
    const id = row.chromeId;
    const panel = handPanel(html, id), css = rewrite(`${scopedRules(zoomCss, id)}\n${chromeRules(chrome, HX_TAIL)}`, { inPanel: true });
    out.push({ path: `src/slices/howto/css/zoom-${id}.css`, text: css });
    out.push({ path: `src/howto/generated/hand-${id}.ts`, text:
      `// The ${id} hand close-up (golden B), loaded on its first open (plan 2.5), with its close-up CSS.\n`
      + `import '../../slices/howto/css/zoom-${id}.css';\n`
      + `export const panel = ${lit(panel)};\n` });
  }
  out.push({ path: 'src/slices/howto/css/hand.css', text: rewrite(`${H.HAND_CSS}\n${chromeRules(chrome)}`) });
  return out;
}
