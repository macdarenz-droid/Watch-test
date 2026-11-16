// HT-5 plugin: the 8 approved exercises' golden-B *.howto.mjs -> HowToContent, generated. Nobody types the content
// a second time: every string here is read straight from the vendored file. Runs after plates.mjs (`after`) and
// patches its own fields into the same ht-<slug>.ts / ids.ts text (plan 2.2, "Writers per file... sequential"),
// so `prev` holds plates.mjs's already-rendered text for those two paths and we replace it whole (the core's
// contract: a plugin returns the *new* full text for a path, last writer in `prev` wins; `writers`/`inputs` still
// accumulate across both plugins, so the final header and hashes.inputsSha256 cover both).
//
// `feel` is NOT written here: golden B's `*.howto.mjs` has it, but per module layout 2.2 it is HT-8's own generated
// file (`ht-<slug>-feel.ts`), with exactly one writer. `zooms` IS written here, but only the minimal descriptor
// each needs for the S0 "Look closer" chip row before any lazy crop/hand chunk loads (HT-6 on PR #116; supervisor
// ruling, same PR): `{key, chip, chipCaption?, heading, kind, feelRow?}`, `===` golden B, golden-B order. The
// rendered crop and hand strings stay only in HT-7's and HT-6's own lazy chunks.
// The content checks (C1-C8, C16) still need the *full* `zooms`/`feel` to run (several read them directly), so
// `loadContent()` returns the full normalized HowToContent (everything golden B authors, minus `plate`) for the
// checks to run against, while `baseFieldsText()` narrows `zooms` to descriptors and leaves `feel` out entirely.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../lib/inputs.mjs';
import { PLATES_JSON, chunkName } from './plates.mjs';

export const after = ['tools/plates/gen/plates.mjs'];

const LAYERS = 'tools/plates/layers';
const EXERCISES_DIR = join(ROOT, LAYERS, 'exercises');
const SHARED_REL = `${LAYERS}/howto/shared.mjs`;

/** The base-file fields HT-5 writes into ht-<slug>.ts. `zooms` is narrowed to descriptors (below); `feel` stays out
 *  (HT-8's own file); `plate`, `schema`, `id`, `name` are already written by plates.mjs. */
export const BASE_KEYS = ['rev', 'extends', 'handling', 'contacts', 'setup', 'posture', 'zooms', 'chips', 'copy', 'mistakes', 'risks', 'riskFlags', 'redFlag', 'sources', 'research'];
/** Fields a golden-B default export may carry that are neither BASE_KEYS nor {schema, id, name, plate, zooms, feel}
 *  (review finding on PR #116): page-only, never read by the generator, and named here so a new one can't go
 *  silently unmapped. `openItems` (leg_press): what the sheet still owes the card (mockup-only render-report list). */
export const PAGE_ONLY_KEYS = ['openItems'];

const DESCRIPTOR_KEYS = ['key', 'chip', 'chipCaption', 'heading', 'kind', 'feelRow'];

/** ZoomSpec -> ZoomDescriptor: the fields the S0 chip row needs, `===` golden B, in golden-B order (supervisor
 *  ruling on PR #116). */
export function zoomDescriptors(zooms) {
  return zooms.map(z => Object.fromEntries(DESCRIPTOR_KEYS.filter(k => z[k] !== undefined).map(k => [k, z[k]])));
}

const rowsOf = () => JSON.parse(readFileSync(join(ROOT, PLATES_JSON), 'utf8'));

export const inputs = () => {
  const out = [SHARED_REL];
  for (const id of Object.keys(rowsOf())) out.push(`${LAYERS}/exercises/${id.slice(4)}.howto.mjs`);
  return out;
};

/** Normalizes the plate engine's older PointRef spelling ({ landmark, pose?, dx?, dy? }, GA 4.1) to the one
 *  content-types.ts actually uses ({ at, pose?, off? }, the plate engine's own convention, SPEC.md 3): some golden-B
 *  files (barbell_back_squat, leg_press, machine_chest_press) still author the old spelling, the rest already use
 *  the new one. Applied to the whole tree: `landmark`/`dx`/`dy` are distinctive keys no other field in this content
 *  uses (Guide and PoseOverride are explicitly free-form and copied as authored, per content-types.ts), so a blanket
 *  walk is safe and needs no per-field special-casing. */
export function normalizeRefs(node) {
  if (Array.isArray(node)) return node.map(normalizeRefs);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === 'landmark' || k === 'dx' || k === 'dy') continue;
      out[k] = normalizeRefs(v);
    }
    if ('landmark' in node) out.at = node.landmark;
    if ('dx' in node || 'dy' in node) out.off = [node.dx ?? 0, node.dy ?? 0];
    return out;
  }
  return node;
}

/** The full normalized HowToContent for one id (minus `plate`), plus its raw SOURCES registry (cite/url/kind/
 *  access/checked/use/note; `use`/`note` are per-use evidence labels, already folded into each field's own Claim by
 *  golden B, so they are dropped when building the app-wide Source registry). */
export async function loadContent(id) {
  const file = join(EXERCISES_DIR, `${id.slice(4)}.howto.mjs`);
  const mod = await import(pathToFileURL(file).href);
  const raw = mod.default;
  if (!raw || raw.id !== id) throw new Error(`content: ${file} default export id "${raw?.id}" != "${id}"`);
  const { plate: _plate, ...rest } = raw;
  // 3 of 8 files embed `redFlag: RED_FLAG` on the default export; the other 5 only `export { RED_FLAG }` (the same
  // shared-module value every file imports) and rely on it there. Same data either way, so this is wiring the
  // reference the same way the other 3 already do, never inventing content: HowToContent.redFlag is required.
  if (rest.redFlag === undefined && mod.RED_FLAG) rest.redFlag = mod.RED_FLAG;
  return { content: normalizeRefs(rest), sources: mod.SOURCES ?? {} };
}

const ser = (value, pad) => JSON.stringify(value, null, 2).replace(/\n/g, `\n${pad}`);

/** The `key: value,\n` lines for the fields this file persists, 2-space indented to match `plate`'s own indent.
 *  `zooms` is narrowed to descriptors; every other key is the content value as is. */
export function baseFieldsText(content, pad = '  ') {
  return BASE_KEYS.filter(k => content[k] !== undefined).map(k => {
    const value = k === 'zooms' ? zoomDescriptors(content.zooms) : content[k];
    return `${pad}${k}: ${ser(value, pad)},\n`;
  }).join('');
}

/** One Source registry entry, in content-types.ts's `Source` shape (drops golden-B's per-use `use`/`note`). */
export function sourceEntry(id, s) {
  return { id, cite: s.cite, url: s.url, kind: s.kind, access: s.access, checked: s.checked };
}

/** How many of `access`/`checked` are filled in (used to pick the better side of a disagreeing registry entry). */
export function completeness(entry) {
  return (entry.access !== null ? 1 : 0) + (entry.checked !== null ? 1 : 0);
}

const HASHES_RE = /hashes: \{ inputsSha256: "[0-9a-f]{64}", golden: "([0-9a-f]{64})" \}/;
const TAIL_RE = /\n\} satisfies BuiltHowTo;\n$/;

/** Patches plates.mjs's already-rendered ht-<slug>.ts text: refreshes the embedded hashes.inputsSha256 (now that
 *  content.mjs is a second writer, per-file inputsSha256 covers both plugins' inputs) and inserts this file's own
 *  fields before the closing `satisfies BuiltHowTo`. */
export function patchModule(prevText, content, hash) {
  const goldenMatch = prevText.match(HASHES_RE);
  if (!goldenMatch) throw new Error('content: no "hashes: { ... }" line to patch');
  const tailMatch = prevText.match(TAIL_RE);
  if (!tailMatch) throw new Error('content: no "} satisfies BuiltHowTo;" tail to patch');
  const withHash = prevText.replace(HASHES_RE, `hashes: { inputsSha256: ${JSON.stringify(hash)}, golden: ${JSON.stringify(goldenMatch[1])} }`);
  const body = withHash.slice(0, withHash.length - tailMatch[0].length);
  return `${body}\n${baseFieldsText(content)}} satisfies BuiltHowTo;\n`;
}

export function hintsText(idsPrevText, hints) {
  const entries = Object.keys(hints).map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(hints[id])},`).join('\n');
  return `${idsPrevText}export const HOWTO_HINTS: Partial<Record<HowToId, string>> = {\n${entries}\n};\n`;
}

export function archetypesText(shared) {
  return `import type { RedFlagBlock } from './content-types';

// GENERATED from tools/plates/layers/howto/shared.mjs (HT-5): the shared "Risks and when to stop" copy, one block
// per joint, plus the owner's one-line disclaimer. No card carries its own red-flag wording (C8).
export const RED_FLAG: RedFlagBlock = ${ser(shared.RED_FLAG, '')};
export const RED_FLAG_SHOULDER: RedFlagBlock = ${ser(shared.RED_FLAG_SHOULDER, '')};
export const RED_FLAG_KNEE: RedFlagBlock = ${ser(shared.RED_FLAG_KNEE, '')};
export const RED_FLAG_ELBOW: RedFlagBlock = ${ser(shared.RED_FLAG_ELBOW, '')};
export const DISCLAIMER: string = ${JSON.stringify(shared.DISCLAIMER)};
`;
}

export async function outputs({ prev, hashFor }) {
  const rows = rowsOf(), ids = Object.keys(rows), out = [], hints = {}, registry = {}, byId = new Map();

  for (const id of ids) {
    const { content, sources } = await loadContent(id);
    byId.set(id, content);
    if (content.handling && content.handling.archetype === 'push' && content.handling.cue) hints[id] = content.handling.cue;

    for (const [sid, s] of Object.entries(sources)) {
      const entry = sourceEntry(sid, s);
      const prevEntry = registry[sid];
      if (prevEntry && JSON.stringify(prevEntry) !== JSON.stringify(entry)) {
        // A golden-B defect (two files typed the same source differently), never a generator decision to hide: keep
        // the more complete entry (fewer nulls) so C8 still gets an access/checked value, and warn so it reaches the
        // supervisor for a golden-B fix (risk_and_recovery: "never patch the app copy"). See COACHING-DECISIONS.md.
        console.warn(`content: source "${sid}" disagrees between exercises (from ${id}): ${JSON.stringify(prevEntry)} vs ${JSON.stringify(entry)}`);
        registry[sid] = completeness(entry) > completeness(prevEntry) ? entry : prevEntry;
        continue;
      }
      registry[sid] = entry;
    }

    const path = `src/howto/generated/${chunkName(rows[id].slug)}.ts`;
    const prevText = prev.get(path);
    if (!prevText) throw new Error(`content: no plates.mjs output for ${path}; content.mjs must run after plates.mjs`);
    out.push({ path, text: patchModule(prevText, content, hashFor(path)) });
  }

  const idsPath = 'src/howto/ids.ts';
  const idsPrev = prev.get(idsPath);
  if (!idsPrev) throw new Error('content: no plates.mjs output for ids.ts');
  out.push({ path: idsPath, text: hintsText(idsPrev, hints) });

  const shared = await import(pathToFileURL(join(ROOT, SHARED_REL)).href);
  out.push({ path: 'src/howto/archetypes.ts', text: archetypesText(shared) });

  const sortedRegistry = Object.fromEntries(Object.keys(registry).sort().map(k => [k, registry[k]]));
  out.push({ path: 'docs/research/howto/sources.json', text: `${JSON.stringify(sortedRegistry, null, 2)}\n` });
  for (const id of ids) {
    const content = byId.get(id);
    const card = { id, rev: content.rev, research: content.research, sources: content.sources, riskFlags: content.riskFlags };
    out.push({ path: `docs/research/howto/${id}.json`, text: `${JSON.stringify(card, null, 2)}\n` });
  }

  return out;
}
