// HT-1 golden lock: rebuilds the approved Technical Plates gallery from the vendored sources, byte for byte,
// and extracts the per-exercise fragments the app will ship. Build time only (Node 22); never bundled.
//   node tools/plates/golden.mjs --check              L0 + L1 + fragments + reference fixtures against the committed golden
//   node tools/plates/golden.mjs --check --vendor DIR  the same, from a copy of the vendored folder (mutation proofs)
//   node tools/plates/golden.mjs --report FILE        --check, and write the measured facts as JSON (tests read this)
//   node tools/plates/golden.mjs --init               first creation only: writes the fixture, ref-fixtures and GOLDEN.json
// The vendored bytes are never edited to make a check pass (owner rule, 2026-09-30).
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const VENDOR = join(ROOT, 'tools/plates/vendor');
export const GOLDEN_DIR = join(ROOT, 'tests/howto/golden');
export const FIXTURE = join(GOLDEN_DIR, 'technical-plates.html');
export const GOLDEN_JSON = join(GOLDEN_DIR, 'GOLDEN.json');
export const REF_FIXTURES = join(GOLDEN_DIR, 'ref-fixtures');
export const FONT = join(ROOT, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');

/** The pins from the card (HT1-A1, HT1-A2). */
export const PINS = {
  refSrcMd5: { 'ref-src/plate.mjs': '31e7bfe3555c0c456ed4417f503dc93f', 'ref-src/themes.mjs': '37495b3d37d1a6a284a380c9e517fb18' },
  fontSha256: '3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62',
  pageSha256: 'e2bea90c8312132b93a2ab0bc004cee6ef43edd22e8227720be3958f6b2dcf48',
  pageBytes: 860766,
};

/** Gallery chrome id -> app library id. Explicit, so nobody infers it from a slug (critic fix 18). */
export const LIB_OF = {
  'lateral-raise': 'lib_dumbbell_lateral_raise',
  'barbell-back-squat': 'lib_barbell_back_squat',
  'pull-up': 'lib_pull_up',
  'hanging-leg-raise': 'lib_hanging_leg_raise',
  'lat-pulldown': 'lib_lat_pulldown',
  'seated-cable-row': 'lib_seated_cable_row',
  'leg-press': 'lib_leg_press',
  'machine-chest-press': 'lib_machine_chest_press',
};

export const sha256 = x => createHash('sha256').update(x).digest('hex');
const md5 = x => createHash('md5').update(x).digest('hex');
const gitBlob = b => createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
export const readManifest = (dir = VENDOR) => JSON.parse(readFileSync(join(dir, 'MANIFEST.json'), 'utf8'));

const walk = (dir, base = dir) => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(join(dir, e.name), base) : [join(dir, e.name).slice(base.length + 1).split('\\').join('/')]);

/** L0: every vendored file matches its MANIFEST entry and source pin; no file is missing or extra. Returns the problems. */
export function verifyVendor(dir = VENDOR, manifest = readManifest(VENDOR)) {
  const bad = [];
  const onDisk = new Set(walk(dir).filter(p => p !== 'MANIFEST.json'));
  for (const [path, e] of Object.entries(manifest.files)) {
    if (!/^(bc0f378|1a1e33b|7859292|de00174|48153c4|f214700):docs\/howto\/technical-plate\//.test(e.source)) bad.push(`${path}: source ${e.source} is not a bc0f378 blob, the ref-src commit or a golden update (7859292, de00174, 48153c4: LIB-25 poly; f214700: LIB-26 flat palm)`);
    if (!onDisk.delete(path)) { bad.push(`${path}: missing`); continue; }
    const b = readFileSync(join(dir, path));
    if (sha256(b) !== e.sha256) bad.push(`${path}: sha256 ${sha256(b)} != MANIFEST ${e.sha256}`);
    if (gitBlob(b) !== e.gitBlob) bad.push(`${path}: git blob ${gitBlob(b)} != ${e.source} (${e.gitBlob})`);
    const pin = PINS.refSrcMd5[path];
    if (path.startsWith('ref-src/') && (!pin || md5(b) !== pin || e.md5 !== pin)) bad.push(`${path}: md5 ${md5(b)} != pinned ${pin}`);
  }
  for (const p of onDisk) bad.push(`${p}: not in MANIFEST`);
  for (const p of Object.keys(PINS.refSrcMd5)) if (!manifest.files[p]) bad.push(`${p}: pinned ref-src file not in MANIFEST`);
  return bad;
}

/** L0 font: the woff2 the engine measured labels with (critic fix 14). Returns the problem or null. */
export function verifyFont(path = FONT) {
  if (!existsSync(path)) return `font missing: ${path}`;
  const s = sha256(readFileSync(path));
  return s === PINS.fontSha256 ? null : `font ${path}: sha256 ${s} != pinned ${PINS.fontSha256}`;
}

/** Index of the first differing byte, or -1 when equal. */
export function firstDiff(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return a.length === b.length ? -1 : n;
}

/** A temp copy of the vendored files (MANIFEST paths only) plus the app's woff2, laid out as build-page.mjs expects. */
export function makeMirror(dir = VENDOR, font = FONT) {
  const tmp = mkdtempSync(join(tmpdir(), 'ht1-mirror-'));
  for (const p of Object.keys(readManifest(VENDOR).files)) {
    mkdirSync(dirname(join(tmp, p)), { recursive: true });
    copyFileSync(join(dir, p), join(tmp, p));
  }
  copyFileSync(font, join(tmp, 'engine/inter-latin-wght-normal.woff2'));
  return tmp;
}

/** Runs `node file` in cwd with optional stdin; resolves to stdout (Buffer). Child processes run in parallel. */
const runNode = (cwd, file, input = '') => new Promise((resolve, reject) => {
  const c = spawn(process.execPath, [file], { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
  const out = [], err = [];
  c.stdout.on('data', d => out.push(d)); c.stderr.on('data', d => err.push(d));
  c.on('error', reject);
  c.on('close', code => (code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(`${file} exited ${code}: ${Buffer.concat(err).toString().slice(0, 2000)}`))));
  c.stdin.end(input);
});

/** L1: run the vendored build-page.mjs in a mirror; resolves to the gallery bytes. */
export async function buildGallery(mirror) {
  await runNode(mirror, 'artifact/build-page.mjs');
  return readFileSync(join(mirror, 'artifact/technical-plates.html'));
}

const unesc = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const cuesOf = (overlay, chromeId, mode) => [...overlay.matchAll(/<button type="button" id="([^"]+)" data-key="([^"]+)" data-cue="([^"]*)"/g)].map(m => {
  if (m[1] !== `${chromeId}-${mode}-${m[2]}`) throw new Error(`${chromeId}: button id ${m[1]} is not ${chromeId}-${mode}-${m[2]}`);
  return { key: m[2], cue: unesc(m[3]) };
});
const ARTICLE = /<article class="sheet-card" id="card-([a-z-]+)" data-ex="\1" data-sel-n="([^"]*)" data-sel-m="([^"]*)" aria-labelledby="\1-title">([\s\S]*?)<\/article>/g;
const SVG = '(<svg class="plate-svg"[^>]*>[\\s\\S]*?<\\/svg>)';

/** L2 source: the per-exercise fragments, sliced from the gallery by its own element ids, never re-serialized. */
export function extractPlates(html) {
  const out = [];
  for (const [, chromeId, selN, selM, body] of html.matchAll(ARTICLE)) {
    const id = chromeId.replace(/[-]/g, '\\-');
    const name = body.match(new RegExp(`<h3 id="${id}-title"><span class="eyebrow sheet-eyebrow">How to do it</span>([^<]*)</h3>`));
    const fit = body.match(new RegExp(`<div class="plate-fit" id="${id}-plate"><figure class="plate" data-mode="normal">${SVG}([\\s\\S]*?)<figcaption class="sr-only">([^<]*)</figcaption></figure><figure class="plate" data-mode="mistake" hidden>${SVG}([\\s\\S]*?)<figcaption class="sr-only">([^<]*)</figcaption></figure></div>`));
    const tellsAt = body.indexOf('<div class="tells" hidden>'), tempoAt = body.indexOf('<div class="tempo" role="img"');
    if (!name || !fit || tellsAt < 0 || tempoAt < 0 || !body.endsWith('\n')) throw new Error(`${chromeId}: the card does not have the approved structure`);
    const [, normalSvg, normalOverlay, alt, mistakeSvg, mistakeOverlay, mistakeAlt] = fit;
    const tells = body.slice(tellsAt, body.indexOf('\n', tellsAt));
    const tempo = body.slice(tempoAt, -1);
    if (!tells.endsWith('</ol></div>') || body.slice(tellsAt + tells.length, tempoAt) !== '\n  ' || tempo.includes('\n')) throw new Error(`${chromeId}: tells/tempo are not where the approved card has them`);
    for (const s of [normalSvg, mistakeSvg]) if (s.indexOf('<svg', 1) >= 0) throw new Error(`${chromeId}: nested svg`);
    const prefix = normalSvg.match(/ id="([a-z-]+?)-n-/)?.[1];
    if (!prefix) throw new Error(`${chromeId}: no id prefix in the normal svg`);
    for (const [s, m] of [[normalSvg, 'n'], [mistakeSvg, 'm']]) for (const [, v] of s.matchAll(/ id="([^"]+)"/g)) if (!v.startsWith(`${prefix}-${m}-`)) throw new Error(`${chromeId}: svg id ${v} is not under ${prefix}-${m}-`);
    const normalCues = cuesOf(normalOverlay, chromeId, 'n'), mistakeCues = cuesOf(mistakeOverlay, chromeId, 'm');
    if (normalCues[0]?.key !== selN || mistakeCues[0]?.key !== selM) throw new Error(`${chromeId}: the first callout/tell is not the selected one`);
    out.push({
      chromeId, prefix, name: unesc(name[1]),
      normal: { svg: normalSvg, overlay: normalOverlay, firstKey: selN, cues: normalCues },
      mistake: { svg: mistakeSvg, overlay: mistakeOverlay, firstKey: selM, cues: mistakeCues },
      tells, tempo, alt: unesc(alt), mistakeAlt: unesc(mistakeAlt),
    });
  }
  return out;
}

/** The GOLDEN.json fragment hashes of one extracted plate. `cues` hashes both figures' firstKey and cue list. */
export const fragmentsOf = p => ({
  normalSvg: sha256(p.normal.svg), normalOverlay: sha256(p.normal.overlay),
  mistakeSvg: sha256(p.mistake.svg), mistakeOverlay: sha256(p.mistake.overlay),
  tells: sha256(p.tells), tempo: sha256(p.tempo),
  cues: sha256(JSON.stringify({ normal: { firstKey: p.normal.firstKey, cues: p.normal.cues }, mistake: { firstKey: p.mistake.firstKey, cues: p.mistake.cues } })),
  alt: sha256(p.alt), mistakeAlt: sha256(p.mistakeAlt),
});

/** Hash chain and supersede rules of GOLDEN.json entries (plan 2.8). Returns the problems. */
export function verifyChain(entries) {
  const bad = [], latest = new Map();
  entries.forEach((e, i) => {
    const key = e.kind === 'plate' ? `plate:${e.id}` : e.kind;
    if (e.prev !== sha256(JSON.stringify(entries.slice(0, i)))) bad.push(`entry ${i} (${key}): prev does not match the entries before it (an older entry was edited)`);
    if (e.approvedBy !== 'owner') bad.push(`entry ${i} (${key}): approvedBy is not owner`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date ?? '')) bad.push(`entry ${i} (${key}): bad date`);
    if (e.supersedes == null) { if (latest.has(key)) bad.push(`entry ${i} (${key}): a second entry for ${key} must supersede entry ${latest.get(key)}`); }
    else {
      if (e.supersedes !== latest.get(key)) bad.push(`entry ${i} (${key}): supersedes ${e.supersedes}, but the latest ${key} entry is ${latest.get(key)}`);
      if (typeof e.decision !== 'string' || !e.decision.trim()) bad.push(`entry ${i} (${key}): a superseding entry needs a decision`);
    }
    latest.set(key, i);
  });
  return bad;
}

/** The latest entry per kind/id. */
export function latestEntries(entries) {
  const m = new Map();
  for (const e of entries) m.set(e.kind === 'plate' ? e.id : e.kind, e);
  return m;
}

/** Appends an entry, filling in `prev` (the only way entries should be added). */
export const appendEntry = (entries, e) => [...entries, { ...e, prev: sha256(JSON.stringify(entries)) }];

// ---- in-mirror probe: verifies each plate's spec source and renders the reference fixtures ----
const PROBE = `
import { renderPlate, PRIMITIVES } from './engine/index.mjs';
import { plate as refPlate } from './ref-src/plate.mjs';
const used = new Set();
for (const k of Object.keys(PRIMITIVES)) { const f = PRIMITIVES[k]; PRIMITIVES[k] = (...a) => { used.add(k); return f(...a); }; }
const render = (src, o) => { used.clear(); const r = src.ref ? refPlate(o) : renderPlate(src.spec, o); return { html: r.svg + r.overlay, svg: r.svg, prims: [...used].sort() }; };
import { readFileSync, readdirSync } from 'node:fs';
const { plates, tests } = JSON.parse(readFileSync(0, 'utf8'));
const specs = {};
for (const f of readdirSync('exercises').filter(f => f.endsWith('.mjs')).sort()) specs['exercises/' + f] = (await import('./exercises/' + f)).default;
const cands = [['ref-src', { ref: true }], ...Object.entries(specs).filter(([k]) => !k.includes('/_test')).map(([k, spec]) => [k, { spec }])];
const out = { plates: {}, fixtures: {}, primitives: Object.keys(PRIMITIVES).sort() };
for (const p of plates) {
  // the spec named like the card is tried first; the first source that reproduces both svgs exactly is recorded
  const order = [...cands].sort((a, b) => (b[0].includes(p.chromeId.replace(/-/g, '_')) - a[0].includes(p.chromeId.replace(/-/g, '_'))) || (p.prefix === 'lr' ? (b[0] === 'ref-src') - (a[0] === 'ref-src') : 0));
  const hit = order.find(([, src]) => {
    const n = render(src, { id: p.prefix + '-n' }).svg;
    return n === p.normalSvg.replace(/<path data-guide="[^"]*" style="display:none" [^>]*\\/>/g, '') && render(src, { id: p.prefix + '-m', mistake: true }).svg === p.mistakeSvg;
  });
  out.plates[p.chromeId] = hit ? hit[0] : null;
  if (!hit) continue;
  const src = hit[1];
  for (const k of p.normalKeys) out.fixtures[p.chromeId + '.n.' + k] = render(src, { id: p.prefix + '-n', selected: k });
  for (const k of p.mistakeKeys) out.fixtures[p.chromeId + '.m.' + k] = render(src, { id: p.prefix + '-m', mistake: true, selected: k });
}
for (const t of tests ? ['_test_front', '_test_side', '_test_poly', '_test_flat'] : []) {
  const spec = specs['exercises/' + t + '.mjs'];
  out.fixtures[t + '.n'] = render({ spec }, { id: t + '-n' });
  if (spec.mistake) out.fixtures[t + '.m'] = render({ spec }, { id: t + '-m', mistake: true });
}
for (const f of Object.values(out.fixtures)) delete f.svg;
process.stdout.write(JSON.stringify(out));
`;

/** Runs the probe in a mirror: which source reproduces each plate, and the reference fixtures with the primitives each one draws. */
/** Split over `workers` processes (renders are CPU bound: about 150 ms each). */
export async function probe(mirror, plates, workers = 4) {
  writeFileSync(join(mirror, '_ht1_probe.mjs'), PROBE);
  const job = plates.map(p => ({
    chromeId: p.chromeId, prefix: p.prefix, normalSvg: p.normal.svg, mistakeSvg: p.mistake.svg,
    normalKeys: p.normal.cues.map(c => c.key), mistakeKeys: p.mistake.cues.map(c => c.key),
  }));
  const groups = Array.from({ length: workers }, (_, w) => job.filter((_, i) => i % workers === w));
  const outs = await Promise.all(groups.map((g, w) => runNode(mirror, '_ht1_probe.mjs', JSON.stringify({ plates: g, tests: w === workers - 1 }))));
  const all = { plates: {}, fixtures: {}, primitives: [] };
  for (const o of outs.map(b => JSON.parse(b.toString('utf8')))) { Object.assign(all.plates, o.plates); Object.assign(all.fixtures, o.fixtures); all.primitives = o.primitives; }
  return all;
}

/** HT1-A4: the primitives no committed fixture covers (a fixture counts only if its bytes equal the fresh render). */
export function uncoveredPrimitives(probeOut, committed) {
  const covered = new Set();
  for (const [name, f] of Object.entries(probeOut.fixtures)) if (committed[name] === f.html) f.prims.forEach(k => covered.add(k));
  return probeOut.primitives.filter(k => !covered.has(k));
}

/** HT1-A4: every probe render is committed byte for byte, nothing extra, and every PRIMITIVES key is covered. */
export function fixtureProblems(probeOut, committed) {
  const bad = [];
  for (const [name, f] of Object.entries(probeOut.fixtures)) {
    if (committed[name] === undefined) bad.push(`A4 ref-fixture ${name}.html missing`);
    else if (committed[name] !== f.html) bad.push(`A4 ref-fixture ${name}.html differs from the vendored engine's render (first differing offset ${firstDiff(Buffer.from(committed[name]), Buffer.from(f.html))})`);
  }
  for (const name of Object.keys(committed)) if (!probeOut.fixtures[name]) bad.push(`A4 ref-fixture ${name}.html is not a render the probe makes`);
  const un = uncoveredPrimitives(probeOut, committed);
  if (un.length) bad.push(`A4 PRIMITIVES covered by no fixture: ${un.join(', ')}`);
  return bad;
}

export const readCommittedFixtures = (dir = REF_FIXTURES) => existsSync(dir)
  ? Object.fromEntries(readdirSync(dir).filter(f => f.endsWith('.html')).map(f => [f.slice(0, -5), readFileSync(join(dir, f), 'utf8')]))
  : {};

/** The full check. Returns { ok, problems, facts }. */
export async function check({ vendor = VENDOR } = {}) {
  const problems = [], facts = { node: process.version };
  problems.push(...verifyVendor(vendor).map(p => `L0 ${p}`));
  const fontBad = verifyFont(); if (fontBad) problems.push(`L0 ${fontBad}`);
  const golden = JSON.parse(readFileSync(GOLDEN_JSON, 'utf8'));
  problems.push(...verifyChain(golden.entries).map(p => `GOLDEN ${p}`));
  const latest = latestEntries(golden.entries), page = latest.get('page');
  const fixture = readFileSync(FIXTURE);
  if (sha256(fixture) !== page.pageSha256) problems.push(`L1 committed fixture sha256 ${sha256(fixture)} != GOLDEN page ${page.pageSha256}`);
  const mirror = makeMirror(vendor);
  try {
    const t0 = Date.now();
    const plates = extractPlates(fixture.toString('utf8'));
    const [built, pr] = await Promise.all([buildGallery(mirror), probe(mirror, plates, 3)]);
    Object.assign(facts, { checkMs: Date.now() - t0, pageSha256: sha256(built), bytes: built.length });
    const at = firstDiff(built, fixture);
    facts.firstDiff = at;
    if (sha256(built) !== page.pageSha256) problems.push(`L1 rebuilt gallery sha256 ${sha256(built)} (${built.length} B) != approved ${page.pageSha256} (${page.bytes} B); first differing byte at offset ${at} (node ${process.version})`);
    facts.plates = plates.map(p => ({ chromeId: p.chromeId, prefix: p.prefix, id: LIB_OF[p.chromeId], fragments: fragmentsOf(p) }));
    if (plates.length !== 8) problems.push(`L2 ${plates.length} plates in the fixture, expected 8`);
    facts.sources = pr.plates;
    facts.fixtures = Object.fromEntries(Object.entries(pr.fixtures).map(([k, f]) => [k, { sha256: sha256(f.html), prims: f.prims }]));
    for (const p of plates) {
      const e = latest.get(LIB_OF[p.chromeId]);
      if (!e) { problems.push(`GOLDEN no entry for ${p.chromeId}`); continue; }
      const src = pr.plates[p.chromeId];
      if (src !== e.src) problems.push(`GOLDEN ${p.chromeId}: src ${e.src}, but the vendored source that reproduces it is ${src}`);
      if (e.prefix !== p.prefix || e.chromeId !== p.chromeId) problems.push(`GOLDEN ${p.chromeId}: prefix/chromeId ${e.prefix}/${e.chromeId} != ${p.prefix}/${p.chromeId}`);
      for (const [k, v] of Object.entries(fragmentsOf(p))) if (e.fragments[k] !== v) problems.push(`L2 ${p.chromeId}.${k}: sha256 ${v} != GOLDEN ${e.fragments[k]}`);
    }
    problems.push(...fixtureProblems(pr, readCommittedFixtures()));
    return { ok: problems.length === 0, problems, facts, plates, probe: pr, built };
  } finally {
    rmSync(mirror, { recursive: true, force: true });
  }
}

/** First creation only (HT-1). A later golden update appends a superseding entry by hand, per plan 2.8. */
async function init() {
  if (existsSync(GOLDEN_JSON)) throw new Error('GOLDEN.json exists: golden updates append entries (plan 2.8), they never re-init');
  const bad = [...verifyVendor(), verifyFont()].filter(Boolean);
  if (bad.length) throw new Error(`L0 failed:\n${bad.join('\n')}`);
  const mirror = makeMirror();
  try {
    const built = await buildGallery(mirror);
    if (sha256(built) !== PINS.pageSha256 || built.length !== PINS.pageBytes) throw new Error(`rebuild ${sha256(built)} is not the approved gallery; stop (node ${process.version})`);
    mkdirSync(REF_FIXTURES, { recursive: true });
    writeFileSync(FIXTURE, built);
    const plates = extractPlates(built.toString('utf8')), pr = await probe(mirror, plates);
    for (const [k, f] of Object.entries(pr.fixtures)) writeFileSync(join(REF_FIXTURES, `${k}.html`), f.html);
    const base = { ref: 'bc0f378', approvedBy: 'owner', date: '2026-09-30', supersedes: null };
    let entries = appendEntry([], { kind: 'page', ...base, why: 'The approved Technical Plates gallery (owner, 2026-09-30: "Dont lower quality and output of the technical plates, i like it right now."), rebuilt from bc0f378 plus ref-src at 1a1e33b.', pageSha256: sha256(built), bytes: built.length });
    for (const p of plates) {
      const src = pr.plates[p.chromeId];
      if (!src) throw new Error(`${p.chromeId}: no vendored source reproduces it`);
      entries = appendEntry(entries, { kind: 'plate', ...base, why: 'Approved plate, golden A.', id: LIB_OF[p.chromeId], slug: LIB_OF[p.chromeId].slice(4).replace(/_/g, '-'), src, prefix: p.prefix, chromeId: p.chromeId, fragments: fragmentsOf(p) });
    }
    writeFileSync(GOLDEN_JSON, JSON.stringify({ schema: 1, entries }, null, 2) + '\n');
  } finally {
    rmSync(mirror, { recursive: true, force: true });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const a = process.argv.slice(2), opt = n => (a.includes(n) ? a[a.indexOf(n) + 1] : undefined);
  if (a.includes('--init')) { await init(); console.log('golden: created', GOLDEN_JSON); process.exit(0); }
  const vendor = opt('--vendor') ?? VENDOR;
  const r = await check({ vendor });
  const report = opt('--report');
  if (report) writeFileSync(report, JSON.stringify({ ok: r.ok, problems: r.problems, facts: r.facts }, null, 2));
  if (!r.ok) { console.error(`golden: FAIL (node ${process.version})\n${r.problems.join('\n')}`); process.exit(1); }
  console.log(`golden: PASS (node ${process.version}): L0 ${Object.keys(readManifest().files).length} files + font, L1 sha256 ${r.facts.pageSha256} (${r.facts.bytes} B), ${r.facts.checkMs} ms, L2 ${r.plates.length} plates, ${Object.keys(r.probe.fixtures).length} reference fixtures cover all ${r.probe.primitives.length} PRIMITIVES`);
}
