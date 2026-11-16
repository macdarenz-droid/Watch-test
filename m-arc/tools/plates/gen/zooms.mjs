// HT-7 plugin: golden B's posture close-ups (S3, right next to wrong) -> src/howto/generated/posture-<chromeId>.ts, and
// the page's crop-background rule -> src/slices/howto/css/posture.css. Found by glob (no registry line).
//
// Golden B draws two posture close-ups per exercise (16). Its crops are re-renders with their own ids, labels, nested
// `<svg>` and `clip-path` (critic fix 3), so nothing is cut or redrawn here: each chunk carries
//   - `panels`: {key: the close-up's `<div class="zx" …>` block}, cut byte for byte from the golden-B page built from
//     the vendored, hash-locked layers (tools/plates/layers.mjs), after the page is checked against its approved sha256;
//   - `zdots`: the page's one hidden dot pattern (`ZDOTS`, howto-layers.mjs) that most crops fill their background
//     with (`url(#zdots)`), proven to be in the page verbatim; Posture.tsx mounts it once per document;
//   - an import of `css/zoom-<chromeId>.css` (HT-6 generates it: the exercise's scoped close-up rules). Never duplicated.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, sha256 } from '../lib/inputs.mjs';
import { LAYERS, PAGE_SHA256, buildLayerPage, cleanupMirror, makeMirror, readManifest } from '../layers.mjs';
import { galleryCss, parse } from '../css.mjs';
import { chromeRules, divAt, howtoCss, rewrite } from './hands.mjs';

export const PLATES_JSON = 'tools/plates/plates.json';
export const inputs = () => [
  ...Object.keys(readManifest().files).map(p => `tools/plates/layers/${p}`),
  'tools/plates/layers/MANIFEST.json', 'tools/plates/layers.mjs', 'tools/plates/css.mjs', 'tools/plates/gen/hands.mjs', PLATES_JSON,
];

/** The page's rule for the dot pattern's dots (HOWTO_CSS). */
export const POSTURE_SELECTORS = ['.zdot'];

/** A selector whose first compound is golden B's `.plate` (the drawing rules), after an optional `html…` prefix. */
const PLATE_FIRST = /^(html(?:[:[][^\s]*)?\s+)?\.plate(?![\w-])/;
/**
 * The page's plate drawing rules for the crops. A crop is a plate re-render inside the close-up, marked `class="plate …"`
 * (golden B's own class, kept byte for byte), so the page styles its strokes, joints, discs and equipment with the
 * gallery's `.plate …` rules. The app has those rules only as `.ht .ht-plate …` (HT-2's class map, for the sheet's own
 * plate figure), which never match a crop. So each rule whose selector starts with `.plate` is shipped for the crops as
 * `.ht :where(.hx) .plate …`: `:where` adds nothing, so every rule keeps golden's specificity plus the one `.ht` class
 * every app How-to rule carries, and golden's order (these come before the close-up CSS, as in the page).
 * First, one reset: the app's own global `.plate` (the weight-plate chip, styles.css) would otherwise style every crop's
 * `.plate` box; `all: revert` drops it to the browser default, as the page has it, before golden's `.plate` rule.
 */
export function cropPlateCss(galleryStyle) {
  const keep = sel => sel.split(',').map(x => x.trim()).filter(x => PLATE_FIRST.test(x));
  const text = [];
  for (const n of parse(galleryStyle)) {
    if (n.sel != null) { const k = keep(n.sel); if (k.length) text.push(`${k.join(', ')} { ${n.body} }`); continue; }
    if (!Array.isArray(n.body)) continue;
    const inner = n.body.filter(c => c.sel != null).map(c => [keep(c.sel), c.body]).filter(([k]) => k.length);
    if (inner.length) text.push(`${n.at} { ${inner.map(([k, b]) => `${k.join(', ')} { ${b} }`).join(' ')} }`);
  }
  if (!text.length) throw new Error('zooms: no .plate rules in the golden-B page');
  const MARK = 'htzoomplate';
  const css = rewrite(`.plate { all: revert; }\n${text.join('\n')}`.replace(/\.plate(?![\w-])/g, `.${MARK}`));
  if (/\.ht-plate\b/.test(css)) throw new Error('zooms: a crop rule was class-mapped');
  return css.replace(new RegExp(`\\.ht \\.${MARK}(?![\\w-])`, 'g'), '.ht :where(.hx) .plate').replace(new RegExp(`\\.${MARK}(?![\\w-])`, 'g'), '.plate');
}

/** The posture close-up panels of one exercise, in page order: [{ key, panel }], each exactly as the page holds it. */
export function posturePanels(html, id) {
  const out = [], re = new RegExp(`<div class="zx" id="${id}-zoom-([a-z0-9-]+)" data-zoom="([a-z0-9-]+)"`, 'g');
  for (const m of html.matchAll(re)) {
    if (m[2] === 'hand') continue;
    if (m[1] !== m[2]) throw new Error(`zooms: ${id}: panel id ${m[1]} != data-zoom ${m[2]}`);
    if (out.some(o => o.key === m[2])) throw new Error(`zooms: ${id}: two ${m[2]} close-ups`);
    out.push({ key: m[2], panel: divAt(html, m.index) });
  }
  if (!out.length) throw new Error(`zooms: ${id}: no posture close-up in the golden-B page`);
  return out;
}

const lit = s => JSON.stringify(s);

export async function outputs() {
  const rows = JSON.parse(readFileSync(join(ROOT, PLATES_JSON), 'utf8'));
  const mirror = makeMirror();
  try {
    const page = await buildLayerPage(mirror);
    if (sha256(page) !== PAGE_SHA256) throw new Error(`zooms: golden-B page sha256 ${sha256(page)} != approved ${PAGE_SHA256}`);
    const html = page.toString('utf8');
    const L = await import(pathToFileURL(join(mirror, 'artifact', 'howto-layers.mjs')).href);
    if (html.split(L.ZDOTS).length !== 2) throw new Error('zooms: ZDOTS is not in the golden-B page exactly once');
    const style = galleryCss(html), chrome = howtoCss(readFileSync(join(LAYERS, 'artifact', 'build-page.mjs'), 'utf8'), style);
    const out = [];
    for (const row of Object.values(rows)) {
      const id = row.chromeId, panels = posturePanels(html, id);
      out.push({ path: `src/howto/generated/posture-${id}.ts`, text:
        `// The ${id} posture close-ups (golden B), loaded on the first posture open (plan 2.5), with its close-up CSS.\n`
        + `import '../../slices/howto/css/zoom-${id}.css';\n`
        + `export const panels: Readonly<Record<string, string>> = {\n${panels.map(p => `  ${lit(p.key)}: ${lit(p.panel)},\n`).join('')}};\n`
        + `export const zdots = ${lit(L.ZDOTS)};\n` });
    }
    const plate = cropPlateCss(style), zdot = rewrite(chromeRules(chrome, POSTURE_SELECTORS));
    out.push({ path: 'src/slices/howto/css/posture.css', text: `${plate}${zdot.slice(zdot.indexOf('/* ht-tokens:end */\n') + 20)}` });
    return out;
  } finally {
    cleanupMirror(mirror);
  }
}
