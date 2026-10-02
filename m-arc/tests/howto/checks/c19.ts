// HT-4b (HT4b-A4): C19, no sources or contacts in the How-to UI. Owner decision LR-23 (2026-09-30): "Dont put any
// emergency or whatever contacts. Even the source remove it in app ui. If its not required by pkaystore dont put."
// The patterns are imported from tests/guards/no-contacts.ts (the single definition, ESC-NC); never copied here.
// Wherever SOURCE_RE applies, SOURCE_CS_RE applies too (D-LR23-1). "Get emergency help now." passes: it names no
// number, service or link (D-LR23-1).
//
//   (a) checkC19Shared: the shared module (archetypes.ts; before HT-5, golden B's howto/shared.mjs) has no
//       SHOW_EVIDENCE export; every RED_FLAG* name/now/doctor and DISCLAIMER pass the patterns; the boxes also pass
//       SAFETY_LINE_RE.
//   (b) checkC19Copy: every copy field of a built sheet (copy-lint's copyFields, every kind but sourceNote) passes the
//       patterns and names no registry source (first-author surname or organisation; copy-lint's sourceNamePatterns).
//   (c) checkC19Files: markup and data in src/howto/** and src/slices/howto/** (no link, no source UI, no evidence
//       label; no url/cite key and no `sources` export or file under src/howto/generated). Attribute values are read
//       in the same escaped form as C17 (D-LR23-7): an optional backslash before each quote.
//   (d) checkC19Feel: the pre-rendered HTML in feel-*.ts, tags stripped, passes the patterns.
// Every entry point fails when it is given nothing to check, so a check can never pass on an empty run.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, sep } from 'node:path';
import { CONTACT_RE, SAFETY_LINE_RE, SOURCE_CS_RE, SOURCE_RE } from '../../guards/no-contacts';

export const RULE_CONTACT = 'no contact or emergency wording (LR-23)';
export const RULE_SOURCE = 'no source or evidence wording (LR-23)';
export const RULE_NAME = 'names a registry source (LR-23)';
export const RULE_SAFETY = 'no call, phone, GP, clinic or hospital in a red-flag box (LR-23)';
export const RULE_SHOW_EVIDENCE = 'SHOW_EVIDENCE is exported: sources and evidence labels are never shown (LR-23)';
export const RULE_LINK = 'no link element (LR-23)';
export const RULE_TARGET = 'no target= (LR-23)';
export const RULE_HREF = 'href must start with # (LR-23)';
export const RULE_CLASS = 'no source or evidence class (LR-23)';
export const RULE_LABEL = 'no evidence label word (LR-23)';
export const RULE_GEN_KEY = 'no url or cite key under src/howto/generated (LR-23)';
export const RULE_GEN_SOURCES = 'no sources export or file under src/howto/generated (LR-23)';

const NO_CONTACT_SOURCE: ReadonlyArray<readonly [string, RegExp]> = [
  [RULE_CONTACT, CONTACT_RE], [RULE_SOURCE, SOURCE_RE], [RULE_SOURCE, SOURCE_CS_RE],
];
export type SourceName = readonly [string, RegExp];

const plain = (s: string) => s.replace(/<br\s*\/?>/gi, ' ').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();

function textHits(where: string, raw: string, names: readonly SourceName[] = []): string[] {
  const t = plain(raw), bad: string[] = [];
  for (const [rule, re] of NO_CONTACT_SOURCE) { const m = t.match(re); if (m) bad.push(`C19: ${where}: ${rule}: "${m[0]}"`); }
  for (const [n, re] of names) if (re.test(t)) bad.push(`C19: ${where}: ${RULE_NAME}: "${n}"`);
  return bad;
}

/** (a) The shared module: SHOW_EVIDENCE, the red-flag boxes and the disclaimer. */
export function checkC19Shared(shared: Record<string, unknown>, label: string, names: readonly SourceName[] = []): string[] {
  const bad: string[] = [];
  if ('SHOW_EVIDENCE' in shared) bad.push(`C19: ${label}: ${RULE_SHOW_EVIDENCE}`);
  const boxes = Object.entries(shared).filter(([k, v]) => /^RED_FLAG/.test(k) && v !== null && typeof v === 'object');
  if (boxes.length === 0) bad.push(`C19: ${label}: no RED_FLAG box to check`);
  for (const [k, box] of boxes) {
    for (const f of ['name', 'now', 'doctor'] as const) {
      const text = (box as Record<string, unknown>)[f];
      if (typeof text !== 'string') { bad.push(`C19: ${label}: ${k}.${f} is missing`); continue; }
      bad.push(...textHits(`${label}: ${k}.${f}`, text, names));
      const m = plain(text).match(SAFETY_LINE_RE);
      if (m) bad.push(`C19: ${label}: ${k}.${f}: ${RULE_SAFETY}: "${m[0]}"`);
    }
  }
  if (typeof shared.DISCLAIMER !== 'string') bad.push(`C19: ${label}: DISCLAIMER is missing`);
  else bad.push(...textHits(`${label}: DISCLAIMER`, shared.DISCLAIMER, names));
  return bad;
}

export interface CopyField { readonly path: string; readonly text: string; readonly kind: string }

/** (b) Every copy field of one built sheet except the research-only source notes. */
export function checkC19Copy(fields: readonly CopyField[], label: string, names: readonly SourceName[] = []): string[] {
  const shown = fields.filter(f => f.kind !== 'sourceNote');
  if (shown.length === 0) return [`C19: ${label}: no copy field to check`];
  return shown.flatMap(f => textHits(`${label}: ${f.path}`, f.text, names));
}

const BANNED_CLASS = new Set(['srcs', 'src-cite', 'src-ev', 'src-key', 'src-n', 'src-list', 'ev']);
const LABEL_WORDS = '(?:Measured|Mechanics|Coaching consensus|Weak for this use)';
/** An attribute value, optionally backslash-escaped (the same escape on both sides), anchored as a whole attribute. */
const attr = (name: string) => new RegExp(`(?<![\\w:-])${name}=(\\\\?)(["'])(.*?)\\1\\2`, 'g');
const HREF_RE = attr('(?:xlink:)?href');
const CLASS_RE = attr('class(?:Name)?');
const CSS_CLASS_RE = /\.(srcs|src-cite|src-ev|src-key|src-n|src-list|ev(?:-[\w-]+)?)(?![\w-])/g;
const LABEL_LITERAL_RE = new RegExp(`(\\\\?["'\`])${LABEL_WORDS}\\1|>\\s*${LABEL_WORDS}\\s*<`, 'g');
const GEN_KEY_RE = /(?<![\w$-])(?:\\?["'])?(url|cite)(?:\\?["'])?\s*:/g;
const GEN_SOURCES_EXPORT_RE = /\bexport\s+(?:const|let|var|function|class)\s+sources\b|\bexport\s*\{[^}]*\bsources\b[^}]*\}/;

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : statSync(p).isFile() ? [p] : [];
  });
}

/** Every file under these folders (missing folders hold nothing). */
export function filesUnder(dirs: readonly string[]): string[] {
  return dirs.flatMap(d => { try { return walk(d); } catch { return []; } });
}

export const isGeneratedPath = (f: string) => f.split(sep).join('/').includes('/src/howto/generated/');

/** (c) One file's markup and data. `generated` marks a file under src/howto/generated. */
export function checkC19File(file: string, generated = isGeneratedPath(file)): string[] {
  const text = readFileSync(file, 'utf8'), bad: string[] = [];
  const hit = (rule: string, what: string) => bad.push(`C19: ${file}: ${rule}: "${what}"`);
  for (const m of text.matchAll(/<a(?=[\s>/\\])/g)) hit(RULE_LINK, text.slice(m.index, m.index + 40));
  for (const m of text.matchAll(/(?<![\w.$-])target=(?!=)/g)) hit(RULE_TARGET, text.slice(m.index, m.index + 30));
  for (const m of text.matchAll(HREF_RE)) if (!(m[3] ?? '').startsWith('#')) hit(RULE_HREF, m[0]);
  for (const m of text.matchAll(CLASS_RE)) {
    for (const tok of (m[3] ?? '').split(/\s+/)) if (BANNED_CLASS.has(tok) || /^ev-/.test(tok)) hit(RULE_CLASS, tok);
  }
  if (/\.css$/.test(file)) for (const m of text.matchAll(CSS_CLASS_RE)) hit(RULE_CLASS, m[1] ?? '');
  for (const m of text.matchAll(LABEL_LITERAL_RE)) hit(RULE_LABEL, m[0]);
  if (generated) {
    if (/^sources?\./.test(basename(file))) hit(RULE_GEN_SOURCES, basename(file));
    if (GEN_SOURCES_EXPORT_RE.test(text)) hit(RULE_GEN_SOURCES, text.match(GEN_SOURCES_EXPORT_RE)![0]);
    for (const m of text.matchAll(GEN_KEY_RE)) hit(RULE_GEN_KEY, m[1] ?? '');
  }
  return bad;
}

/** (c) Every file under the How-to folders. */
export function checkC19Files(files: readonly string[], generated: (f: string) => boolean = isGeneratedPath): string[] {
  if (files.length === 0) return ['C19: no How-to file to check'];
  return files.flatMap(f => checkC19File(f, generated(f)));
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", nbsp: ' ' };
const decode = (s: string) => s.replace(/&(amp|lt|gt|quot|apos|#39|nbsp);/g, (_, e: string) => ENTITIES[e] ?? e);
/** Tag stripping keeps what a screen reader reads: aria-label, title and alt values. */
const stripTags = (html: string) => html.replace(/<[^>]*>/g, tag =>
  ` ${[...tag.matchAll(/(?<![\w-])(?:aria-label|title|alt)=(\\?)(["'])(.*?)\1\2/g)].map(m => m[3]).join(' ')} `);
const STRING_LITERAL_RE = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;

/** (d) The pre-rendered HTML in one feel-*.ts file: every string literal, unescaped, tags stripped. */
export function checkC19Feel(file: string, names: readonly SourceName[] = []): string[] {
  const text = readFileSync(file, 'utf8');
  const literals = [...text.matchAll(STRING_LITERAL_RE)].map(m => (m[2] ?? '').replace(/\\(["'`\\])/g, '$1').replace(/\\n/g, ' '));
  if (literals.length === 0) return [`C19: ${file}: no pre-rendered HTML to check`];
  return literals.flatMap(l => textHits(file, decode(stripTags(l)), names));
}
