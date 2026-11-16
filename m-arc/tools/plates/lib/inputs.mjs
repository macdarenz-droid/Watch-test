// HT-2 generator core: plugin discovery, per-file inputs hashing and the GENERATED header (plan 2.2, critic fix 7).
// A file's inputsSha256 covers only its own inputs: the core (generate.mjs, lib/**), the plugins that write it,
// and the files those plugins declare they read. So adding a plugin stales no other plugin's files.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const sha256 = x => createHash('sha256').update(x).digest('hex');
const rel = p => relative(ROOT, p).split('\\').join('/');
const files = dir => readdirSync(dir).sort().flatMap(n => { const p = join(dir, n); return statSync(p).isDirectory() ? files(p) : [rel(p)]; });

/** The core files, repo-relative. */
export const coreFiles = () => ['tools/plates/generate.mjs', ...files(join(ROOT, 'tools/plates/lib'))].sort();
/** The plugins, found by glob tools/plates/gen/*.mjs (no registry). */
export const pluginFiles = (dir = join(ROOT, 'tools/plates/gen')) => readdirSync(dir).filter(n => n.endsWith('.mjs')).sort().map(n => rel(join(dir, n)));

/** sha256 over the sorted `path\0sha256(bytes)\n` lines of the given repo-relative paths (duplicates removed). */
export function hashPaths(paths, root = ROOT) {
  const h = createHash('sha256');
  for (const p of [...new Set(paths)].sort()) {
    const abs = join(root, p);
    if (!existsSync(abs)) throw new Error(`inputs: ${p} does not exist`);
    h.update(`${p}\0${sha256(readFileSync(abs))}\n`);
  }
  return h.digest('hex');
}

/** The inputsSha256 of one output file, written by `writers` (plugin paths) that read `inputs`. */
export const inputsSha256 = (writers, inputs, root = ROOT) => hashPaths([...coreFiles(), ...writers, ...inputs], root);

const MARK = 'GENERATED, do not edit.';
/** The first line of a generated file. `writers` are plugin paths. */
export function header(path, writers, hash) {
  const text = `${MARK} Written by tools/plates/generate.mjs (${writers.join(', ')}). inputsSha256=${hash}`;
  return path.endsWith('.css') ? `/* ${text} */\n` : `// ${text}\n`;
}
/** Parses a generated file's header: { writers, hash } or null when the file does not start with it. */
export function parseHeader(text) {
  const m = text.match(/^(?:\/\/|\/\*) GENERATED, do not edit\. Written by tools\/plates\/generate\.mjs \(([^)]*)\)\. inputsSha256=([0-9a-f]{64})(?: \*\/)?\n/);
  return m ? { writers: m[1].split(', '), hash: m[2] } : null;
}
