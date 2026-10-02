// HT2-A5: ids.ts is the only How-to module main may load: the approved ids, the label and hasHowTo(), under
// 2,048 B with no runtime imports; the LOADERS keys equal HOWTO_IDS, which equal the generated modules.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HOWTO_IDS, HOWTO_LABEL, hasHowTo } from '@/howto/ids';
import { LOADERS } from '@/howto/generated';
import exercises from '@/data/exercises.json';
import type { GoldenFile } from '@/howto/types';

const golden = JSON.parse(readFileSync('tests/howto/golden/GOLDEN.json', 'utf8')) as GoldenFile;
const approved = () => { const m = new Map<string, string>(); for (const e of golden.entries) if (e.kind === 'plate') m.set(e.id, e.slug); return m; };
const rows = JSON.parse(readFileSync('tools/plates/plates.json', 'utf8')) as Record<string, { slug: string }>;

/** The HT2-A5 set equality, as a function so its failure path can be shown on a bad input. */
export function idProblems(ids: readonly string[], loaderKeys: string[], files: string[], goldenIds: Map<string, string>): string[] {
  const bad: string[] = [], want = [...goldenIds.keys()];
  if (JSON.stringify([...ids]) !== JSON.stringify(want)) bad.push(`HOWTO_IDS ${ids} != GOLDEN plates ${want}`);
  if (JSON.stringify([...loaderKeys].sort()) !== JSON.stringify([...ids].sort())) bad.push(`LOADERS keys ${loaderKeys} != HOWTO_IDS`);
  const expectFiles = want.map(id => `ht-${goldenIds.get(id)}.ts`).sort();
  if (JSON.stringify([...files].sort()) !== JSON.stringify(expectFiles)) bad.push(`generated modules ${files} != ${expectFiles}`);
  return bad;
}

describe('HT2-A5: ids.ts', () => {
  const src = readFileSync('src/howto/ids.ts', 'utf8');
  const files = () => readdirSync('src/howto/generated').filter(f => /^ht-.*\.ts$/.test(f));

  it('HOWTO_IDS are the approved plates slugs in GOLDEN.json; LOADERS keys equal them; they equal the generated files', () => {
    expect(HOWTO_IDS).toHaveLength(8);
    expect(idProblems(HOWTO_IDS, Object.keys(LOADERS), files(), approved())).toEqual([]);
  });

  it('an extra LOADERS key, a missing file or a reordered id list fails', () => {
    expect(idProblems(HOWTO_IDS, [...Object.keys(LOADERS), 'lib_barbell_bench_press'], files(), approved())).toHaveLength(1);
    expect(idProblems(HOWTO_IDS, Object.keys(LOADERS), files().slice(1), approved())).toHaveLength(1);
    expect(idProblems([...HOWTO_IDS].reverse(), Object.keys(LOADERS), files(), approved())).toHaveLength(1);
  });

  it('each LOADERS entry imports its own generated module dynamically', () => {
    const index = readFileSync('src/howto/generated/index.ts', 'utf8');
    for (const id of HOWTO_IDS) expect(index).toContain(`  ${id}: () => import('./ht-${rows[id]!.slug}'),\n`);
    expect(index.match(/import\(/g)).toHaveLength(HOWTO_IDS.length);
    expect(index.match(/^import (?!type )/gm)).toBeNull();
  });

  it('HOWTO_LABEL is "How to do it"', () => expect(HOWTO_LABEL).toBe('How to do it'));

  it('hasHowTo is true for exactly the 8 approved ids: false for the other 145 library ids and for a custom id', () => {
    const lib = (exercises as { id: string }[]).map(e => e.id);
    expect(lib).toHaveLength(153);
    expect(lib.filter(hasHowTo).sort()).toEqual([...HOWTO_IDS].sort());
    expect(lib.filter(id => !hasHowTo(id))).toHaveLength(145);
    for (const id of ['custom_1727000000000', 'lib_', '', 'LIB_PULL_UP', 'lib_pull_up ']) expect(hasHowTo(id), id).toBe(false);
  });

  it('is <= 2,048 B and has no runtime imports', () => {
    expect(statSync('src/howto/ids.ts').size).toBeLessThanOrEqual(2048);
    expect(src).not.toMatch(/^\s*(import|export\s+\*|export\s*\{[^}]*\}\s*from)\b/m);
    expect(src).not.toMatch(/\bimport\s*\(|\brequire\s*\(/);
  });
});
