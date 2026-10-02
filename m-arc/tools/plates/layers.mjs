// HT-4 golden-B lock (L0-B): verifies every file vendored into tools/plates/layers/ against MANIFEST.json, and
// rebuilds the layer page from a mirror copy. Build time only (Node 22); never bundled.
// The vendored bytes are never edited to make a check pass (owner rule, 2026-09-30).
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const LAYERS = join(ROOT, 'tools/plates/layers');
export const PAGE_SHA256 = 'e7b8141368e59cf993f29555efce53bc06f36131d8e283c79e11a9f2614c928a';
/** The golden-B commit every vendored file and the page approval are pinned to (supervisor: the single constant). */
export const GOLDEN_B_REF = '6b86baa';

export const sha256 = x => createHash('sha256').update(x).digest('hex');
export const readManifest = (dir = LAYERS) => JSON.parse(readFileSync(join(dir, 'MANIFEST.json'), 'utf8'));

/**
 * HT-2's own review fix, repeated here (supervisor, PR #107): one literal hash over the MANIFEST as a whole (the
 * sorted `path:sha256` list, plus the page approval), so editing a vendored file together with its own MANIFEST
 * entry - which the per-file check alone cannot catch - still shows up as a visible change to this string.
 */
export function manifestPinList(manifest = readManifest(LAYERS)) {
  const files = Object.entries(manifest.files).map(([p, e]) => `${p}:${e.sha256}`).sort().join('\n');
  return `${files}\n--\n${JSON.stringify(manifest.pageApproval)}`;
}

/**
 * A later golden-B update appends to `pageApproval.history` instead of overwriting `current` in place (supervisor,
 * PR #107). `historyPin` is the literal a future update pins in a test: if that update ever changes an entry that
 * was already in `history` (rather than only appending its own retired `current`), the pin changes and the test
 * written against the pin fails.
 */
export const historyPin = (history) => sha256(JSON.stringify(history));

const walk = (dir, base = dir) => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(join(dir, e.name), base) : [join(dir, e.name).slice(base.length + 1).split('\\').join('/')]);

const gitBlob = b => createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');

/** L0-B: every vendored file matches its MANIFEST entry (sha256, git blob) and its source is the S-2 pin. Returns the problems. */
export function verifyLayers(dir = LAYERS, manifest = readManifest(LAYERS)) {
  const bad = [];
  const onDisk = new Set(walk(dir).filter(p => p !== 'MANIFEST.json'));
  for (const [path, e] of Object.entries(manifest.files)) {
    if (e.source !== `${GOLDEN_B_REF}:docs/howto/golden-b/${path}`) bad.push(`${path}: source ${e.source} is not the ${GOLDEN_B_REF} pin`);
    if (!onDisk.delete(path)) { bad.push(`${path}: missing`); continue; }
    const b = readFileSync(join(dir, path));
    if (sha256(b) !== e.sha256) bad.push(`${path}: sha256 ${sha256(b)} != MANIFEST ${e.sha256}`);
    if (gitBlob(b) !== e.gitBlob) bad.push(`${path}: git blob ${gitBlob(b)} != MANIFEST ${e.gitBlob}`);
  }
  for (const p of onDisk) bad.push(`${p}: not in MANIFEST`);
  return bad;
}

/** A temp copy of the vendored files (MANIFEST paths only), laid out as build-page.mjs expects. */
export function makeMirror(dir = LAYERS) {
  const tmp = mkdtempSync(join(tmpdir(), 'ht4-layers-'));
  cpSync(dir, tmp, { recursive: true });
  return tmp;
}

const runNode = (cwd, file) => new Promise((resolve, reject) => {
  const c = spawn(process.execPath, [file], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  const out = [], err = [];
  c.stdout.on('data', d => out.push(d)); c.stderr.on('data', d => err.push(d));
  c.on('error', reject);
  c.on('close', code => (code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(`${file} exited ${code}: ${Buffer.concat(err).toString().slice(0, 2000)}`))));
});

/** Rebuilds the layer page from a mirror; resolves to its bytes. */
export async function buildLayerPage(mirror) {
  await runNode(mirror, 'artifact/build-page.mjs');
  return readFileSync(join(mirror, 'artifact', 'technical-plates.html'));
}

export function cleanupMirror(dir) { rmSync(dir, { recursive: true, force: true }); }
