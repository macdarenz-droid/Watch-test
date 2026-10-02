// HT-4 (HT4-A3): C17, no network. Scans How-to source files for fetch(/XMLHttpRequest/Worker or an http(s) URL.
// HT-4b (D-LR23-7, owner decision LR-23): no URL is allowed at all - the source citations are research data outside
// src/ and are never shown - except the SVG and xlink namespace attributes below. The `allowedUrls` parameter is gone.
//
// D-HT4-C17 (supervisor ruling on PR #107, in reply to HT-7's note, 2026-09-30): golden B's own SVG markup carries
// the XML namespace identifiers `xmlns="http://www.w3.org/2000/svg"` and `xmlns:xlink="http://www.w3.org/1999/xlink"`
// (tools/plates/layers/engine/hand.mjs and feelmap.mjs; pinned bytes HT-6/HT-7 ship byte-for-byte). Neither is ever
// fetched - an XML namespace is an identifier, not a network call - so C17 allows exactly these two whole attribute
// forms and nothing else: the same URL anywhere else (an href, a CSS url(...), inside fetch(), or an xmlns pointing
// at a different host) still fails, same as any other bare URL.
//
// D-HT4-C17 escaped-quote form (HT-7's follow-up note, 2026-09-30): HT-6/HT-7's `src/howto/generated/*.ts` hold
// golden B's markup inside a JSON string literal, so the attribute appears as `xmlns=\"http://www.w3.org/2000/svg\"`
// - an escaped quote, which the first cut's pattern (unescaped quotes only) missed. An optional backslash is now
// allowed before each quote, with the backreference still requiring the closing delimiter to match the opening one
// exactly (both escaped, or both not) - never a mismatched pair, and never a bare backslash-quote anywhere else.
//
// D-HT4-C17 whole-attribute anchor (round-3 review fix, low 2, 2026-09-30): the pattern had no left boundary, so
// `data-xmlns="http://www.w3.org/2000/svg"` (or any `...xmlns=`) was blanked out and passed - the ruling says
// "matched as whole attributes". A negative lookbehind now requires `xmlns=`/`xmlns:xlink=` to not be preceded by
// a word character, `:` or `-` (so it can follow whitespace, a quote, `<`, `;` - an attribute/token boundary, but
// never sit inside a longer identifier).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BANNED = [/\bfetch\s*\(/, /\bXMLHttpRequest\b/, /\bnew Worker\s*\(/];
// `\\` ends a URL too (HT-4 round-4 review): an escaped-quote URL is reported without its trailing backslash.
const URL_RE = /https?:\/\/[^\s'"`)\\]+/g;
/** Exactly these whole attributes, either quote style, optionally backslash-escaped (matching escape on both
 *  sides), anchored so they can never match inside a longer attribute name - never a bare occurrence elsewhere. */
const ALLOWED_XMLNS_ATTRS = [
  /(?<![\w:-])xmlns=(\\?)(["'])http:\/\/www\.w3\.org\/2000\/svg\1\2/g,
  /(?<![\w:-])xmlns:xlink=(\\?)(["'])http:\/\/www\.w3\.org\/1999\/xlink\1\2/g,
];

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : statSync(p).isFile() ? [p] : [];
  });
}

export function checkC17(dirs: readonly string[]): string[] {
  const bad: string[] = [];
  for (const dir of dirs) {
    let files: string[];
    try { files = walk(dir); } catch { continue; }
    for (const f of files.filter(f => /\.(ts|tsx|mjs|js)$/.test(f))) {
      const text = readFileSync(f, 'utf8');
      for (const re of BANNED) if (re.test(text)) bad.push(`C17: ${f}: matches ${re}`);
      let scanned = text;
      for (const re of ALLOWED_XMLNS_ATTRS) scanned = scanned.replace(re, m => ' '.repeat(m.length));
      for (const m of scanned.matchAll(URL_RE)) bad.push(`C17: ${f}: URL "${m[0]}" is not allowed`);
    }
  }
  return bad;
}
