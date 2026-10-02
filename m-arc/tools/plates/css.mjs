// HT-2: the approved gallery CSS -> src/slices/howto/css/plate.css. A mechanical, tested rewrite (plan 2.6):
//   1. the class map: `.plate` -> `.ht-plate`, `.plate-fit` -> `.ht-plate-fit` (class tokens only);
//   2. every selector is scoped under `.ht` (the How-to sheet body root);
//   3. page-only rules are dropped: the gallery page chrome, its token copy and per-theme blocks (the app's own
//      tokens and equal global rules apply), keeping only the part of a reset the app lacks (`figure` margin);
//   4. literals the app's style lints ban outside a token block (times, font-size / border-radius literals) move
//      into one `ht-tokens` block on `.ht` with identical values.
// Declaration bodies are otherwise copied byte for byte. rewriteCss() is reused by HT-8 (gen/feel.mjs).

/** The class map (injective; class tokens only). */
export const CLASS_MAP = Object.freeze({ plate: 'ht-plate', 'plate-fit': 'ht-plate-fit' });
const CLASS_RE = /\.(plate(?:-fit)?)(?![\w-])/g;
export const mapClasses = sel => sel.replace(CLASS_RE, (_, c) => `.${CLASS_MAP[c]}`);

/** Literal -> ht token, for every literal the lints ban. The rewrite throws on a banned literal not listed here. */
export const HT_TOKENS = Object.freeze({
  '2.4s': '--ht-trace',
  '2.3s': '--ht-arrow-at',
  '160ms': '--ht-arrow-dur',
  '80ms': '--ht-ghost-step',
  '1px': '--ht-radius-tick',
});

// Selectors (whole, after trimming) of the page-only rules. Anything with --pg-, .pg-, .group, .seg or #sheets
// (except `#sheets <plate class>`) is page chrome too, checked by PAGE_RE.
const PAGE_SELECTORS = new Set([
  '*, *::before, *::after', 'html, body', 'body', 'button', 'svg', '.sr-only', ':focus-visible', ':root',
  ':root[data-theme="dark"]', ':root:not([data-theme="light"])', 'html[data-motion="reduce"]',
  '.eyebrow', '.grow', '.hint', '.sheet-card', '.sheet-grab', '.sheet-head', '.sheet-head .sheet-eyebrow',
  '#sheets', '#sheets :focus-visible', '#sheets h3', '.segmented', '.seg', '.seg[aria-pressed="true"]', '.seg:hover',
]);
const PAGE_RE = /--pg-|\.pg-|\.group\b|\.group-|^\[data-theme=/;
/** A reset the app has only in part: keep just the selectors the app lacks (styles.css has h1-h3, p but no figure). */
const PARTIAL = Object.freeze({ 'h1, h2, h3, p, figure': 'figure' });

/** Parses a flat stylesheet into [{ at?: string, sel?: string, body: string | nodes[] }]. Comments are dropped;
 * the `tokens:start` .. `tokens:end` region (the page's copy of the app token block) is dropped whole. */
export function parse(css) {
  const a = css.indexOf('/* tokens:start */'), b = css.indexOf('/* tokens:end */');
  if (a >= 0 !== b >= 0) throw new Error('css: unpaired tokens:start/end');
  if (a >= 0) css = css.slice(0, a) + css.slice(b + '/* tokens:end */'.length);
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let i = 0;
  const block = () => {
    const out = [];
    for (;;) {
      while (i < css.length && /\s/.test(css[i])) i++;
      if (i >= css.length || css[i] === '}') return out;
      const open = css.indexOf('{', i);
      if (open < 0) throw new Error(`css: no '{' after offset ${i}`);
      const head = css.slice(i, open).trim().replace(/\s+/g, ' ');
      i = open + 1;
      if (head.startsWith('@') && !head.startsWith('@font-face')) {
        const body = head.startsWith('@keyframes') ? raw() : block();
        if (!head.startsWith('@keyframes')) { if (css[i] !== '}') throw new Error(`css: unclosed ${head}`); i++; }
        out.push({ at: head, body });
      } else {
        const close = css.indexOf('}', i);
        const body = css.slice(i, close);
        if (body.includes('{')) throw new Error(`css: nested block in ${head}`);
        i = close + 1;
        out.push({ sel: head, body: body.trim() });
      }
    }
  };
  const raw = () => {   // @keyframes: copy the body verbatim (its from/to are not selectors)
    let depth = 1, s = i;
    for (; i < css.length && depth; i++) { if (css[i] === '{') depth++; else if (css[i] === '}') depth--; }
    return css.slice(s, i - 1).trim().replace(/\s+/g, ' ');
  };
  const nodes = block();
  if (i < css.length) throw new Error(`css: stray '}' at ${i}`);
  return nodes;
}

const splitSel = sel => sel.split(',').map(s => s.trim()).filter(Boolean);
/** Scopes one simple selector under `.ht`: `html:…` / `html[…]` prefixes stay in front, `#sheets` becomes `.ht`. */
export function scope(s) {
  if (s.startsWith('#sheets ')) return `.ht ${s.slice(8)}`;
  const m = s.match(/^(html(?:[:[][^\s]*)?)\s+(.*)$/);
  return m ? `${m[1]} .ht ${m[2]}` : `.ht ${s}`;
}
const isPage = sel => PAGE_SELECTORS.has(sel) || PAGE_RE.test(sel) || sel === '#sheets' || (sel.startsWith('#sheets ') && PAGE_SELECTORS.has(sel));

function tokenize(body, used) {
  return body.replace(/(^|[\s:(,*])(\d*\.?\d+m?s|cubic-bezier\([^)]*\))(?=[\s;,)]|$)/g, (all, pre, lit) => {
    const t = HT_TOKENS[lit];
    if (!t) throw new Error(`css: banned literal ${lit} has no ht token`);
    used.set(t, lit);
    return `${pre}var(${t})`;
  }).replace(/(border-radius\s*:\s*)(\d*\.?\d+px)(?=\s*(;|$))/g, (all, pre, lit) => {
    const t = HT_TOKENS[lit];
    if (!t) throw new Error(`css: border-radius ${lit} has no ht token`);
    used.set(t, lit);
    return `${pre}var(${t})`;
  }).replace(/font-size\s*:\s*([^;]+)/g, (m, v) => { if (!/^var\(--(fs|ht)-[\w-]+\)$/.test(v.trim())) throw new Error(`css: literal ${m}`); return m; });
}

/** The whole rewrite. Returns the CSS text (no header). */
export function rewriteCss(css) {
  const used = new Map(), lines = [];
  const rule = (sel, body, indent = '') => {
    let sels = splitSel(sel);
    if (PARTIAL[sels.join(', ')]) sels = [PARTIAL[sels.join(', ')]];
    else if (isPage(sels.join(', ')) || sels.every(isPage)) return null;
    if (sels.some(isPage)) sels = sels.filter(s => !isPage(s));
    return `${indent}${sels.map(s => scope(mapClasses(s))).join(', ')} { ${tokenize(body, used)} }`;
  };
  for (const n of parse(css)) {
    if (n.sel != null) { const r = rule(n.sel, n.body); if (r) lines.push(r); continue; }
    if (n.at.startsWith('@keyframes')) { lines.push(`${n.at} { ${tokenize(n.body, used)} }`); continue; }
    const inner = n.body.map(c => (c.sel != null ? rule(c.sel, c.body, '  ') : null)).filter(Boolean);
    if (n.body.some(c => c.sel == null)) throw new Error(`css: nested at-rule in ${n.at}`);
    if (inner.length) lines.push(`${n.at} {`, ...inner, '}');
  }
  const tokens = [...used].sort(([a], [b]) => a.localeCompare(b)).map(([t, v]) => `${t}: ${v};`);
  return ['/* ht-tokens:start */', `.ht { ${tokens.join(' ')} }`, '/* ht-tokens:end */', ...lines, ''].join('\n');
}

/** The gallery's one <style> element, without the inline SVG icons it may hold. */
export function galleryCss(html) {
  const all = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)];
  if (all.length !== 1) throw new Error(`css: expected one <style>, found ${all.length}`);
  return all[0][1];
}
