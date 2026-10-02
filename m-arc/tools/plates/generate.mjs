// HT-2 generator core. Runs every plugin in tools/plates/gen/*.mjs (found by glob; no registry) and writes each
// output with its GENERATED header. `--check` regenerates in memory and exits 1 if any file differs or a stale
// generated file is left on disk. The core is frozen after HT-2 (plan 2.2): a change to it is its own PR.
//
// Plugin contract (one module per plugin):
//   export const inputs = () => string[]      repo-relative files it reads (static: no render needed to list them)
//   export const after = string[]              optional: plugin paths whose outputs it may extend (run first)
//   export async function outputs(ctx)         -> [{ path, text }]; ctx.prev: Map(path -> text) of earlier writers,
//                                                ctx.hashFor(path): that file's inputsSha256 with this plugin as a writer
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ROOT, header, inputsSha256, parseHeader, pluginFiles } from './lib/inputs.mjs';

/** The folders generated files live in; --check fails on a GENERATED file here that no plugin writes. */
export const GENERATED_DIRS = ['src/howto', 'src/slices/howto/css'];

export async function loadPlugins(paths = pluginFiles()) {
  const mods = new Map();
  for (const p of paths) mods.set(p, await import(pathToFileURL(join(ROOT, p)).href));
  const order = [], state = new Map();
  const visit = p => {
    if (state.get(p) === 'done') return;
    if (state.get(p) === 'busy') throw new Error(`generate: plugin cycle at ${p}`);
    if (!mods.has(p)) throw new Error(`generate: unknown plugin ${p}`);
    state.set(p, 'busy');
    for (const a of mods.get(p).after ?? []) visit(a);
    state.set(p, 'done');
    order.push(p);
  };
  for (const p of mods.keys()) visit(p);
  return order.map(path => ({ path, mod: mods.get(path) }));
}

/** Every output: Map(path -> { text (with header), writers, hash }). */
export async function render(paths) {
  const plugins = await loadPlugins(paths), prev = new Map(), writers = new Map(), inputs = new Map();
  for (const { path, mod } of plugins) {
    const own = mod.inputs();
    const hashFor = p => inputsSha256([...(writers.get(p) ?? []), path].sort(), [...(inputs.get(p) ?? []), ...own]);
    for (const o of await mod.outputs({ prev, hashFor })) {
      if (!o.path || typeof o.text !== 'string') throw new Error(`generate: ${path} returned a bad output`);
      prev.set(o.path, o.text);
      writers.set(o.path, [...new Set([...(writers.get(o.path) ?? []), path])].sort());
      inputs.set(o.path, [...(inputs.get(o.path) ?? []), ...own]);
    }
  }
  const out = new Map();
  for (const [p, text] of prev) {
    const w = writers.get(p), hash = inputsSha256(w, inputs.get(p));
    out.set(p, { text: header(p, w, hash) + text, writers: w, hash });
  }
  return out;
}

const walk = d => (existsSync(d) ? readdirSync(d).flatMap(n => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; }) : []);
/** Generated files on disk (repo-relative), by their header. */
export const generatedOnDisk = () => GENERATED_DIRS.flatMap(d => walk(join(ROOT, d)))
  .filter(p => parseHeader(readFileSync(p, 'utf8'))).map(p => p.slice(ROOT.length + 1).split('\\').join('/')).sort();

/** The --check diff: [{ path, why }]. */
export function diff(out) {
  const bad = [];
  for (const [p, { text }] of out) {
    const abs = join(ROOT, p);
    if (!existsSync(abs)) bad.push({ path: p, why: 'missing' });
    else if (readFileSync(abs, 'utf8') !== text) bad.push({ path: p, why: 'differs' });
  }
  for (const p of generatedOnDisk()) if (!out.has(p)) bad.push({ path: p, why: 'stale: no plugin writes it' });
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const t0 = Date.now(), out = await render();
  if (process.argv.includes('--check')) {
    const bad = diff(out);
    if (bad.length) { console.error(`generate --check: FAIL\n${bad.map(b => `  ${b.path}: ${b.why}`).join('\n')}\nRun node tools/plates/generate.mjs and commit the result.`); process.exit(1); }
    console.log(`generate --check: PASS, ${out.size} files fresh (${Date.now() - t0} ms)`);
  } else {
    for (const [p, { text }] of out) { mkdirSync(dirname(join(ROOT, p)), { recursive: true }); writeFileSync(join(ROOT, p), text); }
    console.log(`generate: wrote ${out.size} files (${Date.now() - t0} ms)`);
  }
}
