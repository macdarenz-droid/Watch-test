// HT3b-A1 (plan 2.9): ids.ts is the only How-to module main may load by static import, and lazy.tsx
// (the sheet's chunk wrapper) is the other piece that lands there. Both are esbuild-minified, bundled
// together as they are in the real chunk, with their shared runtime imports (preact, preact/hooks,
// @/app/toast) external: those are already part of main elsewhere, so counting them here would
// double-count against the real bundle. This measures the marginal footprint the plan's ceiling is
// about, without needing a full vite build (the gate's content probe on the real index-*.js chunk is
// the other half of A1, in scripts/screenshot-gate.mjs).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

// './HowToSheet' is lazy.tsx's own runtime import() (the real chunk split point): it must stay
// external here too, or esbuild inlines the whole HowToSheet module (and its CSS) into the bundle.
const EXTERNAL = ['preact', 'preact/hooks', '@/app/toast', './HowToSheet'];

/** Bundles `files` together into one esbuild-minified ESM output (as they land in the same real
 * chunk) and returns its byte size. A synthetic `export * as` entry, not `entryPoints`, so esbuild
 * cross-minifies them into a single output instead of one output per file. */
async function bundledSize(files: string[]): Promise<number> {
  const contents = files.map((f, i) => `export * as m${i} from ${JSON.stringify(resolve(f))};`).join('\n');
  const result = await build({
    stdin: { contents, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true,
    minify: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    jsx: 'automatic',
    jsxImportSource: 'preact',
    external: EXTERNAL,
    logLevel: 'silent',
  });
  return result.outputFiles.reduce((n, f) => n + f.contents.byteLength, 0);
}

describe('HT3b-A1: How-to footprint in main', () => {
  it('src/howto/ids.ts, esbuild-minified, is <= 2,048 B', async () => {
    expect(await bundledSize(['src/howto/ids.ts'])).toBeLessThanOrEqual(2048);
  });

  it('src/howto/ids.ts + src/slices/howto/lazy.tsx together, esbuild-minified, imports external, are <= 3,072 B', async () => {
    expect(await bundledSize(['src/howto/ids.ts', 'src/slices/howto/lazy.tsx'])).toBeLessThanOrEqual(3072);
  });

  // HT2-A5 already checks ids.ts's raw size and no-imports; this is the esbuild-minified figure the
  // plan's ceiling names, so the raw file is also checked directly here for a fast, build-free signal.
  it('src/howto/ids.ts raw source is <= 2,048 B (the esbuild-minified figure can only be smaller)', () => {
    expect(readFileSync('src/howto/ids.ts', 'utf8').length).toBeLessThanOrEqual(2048);
  });
});
