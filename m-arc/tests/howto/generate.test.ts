// HT-2: the generated plate modules hold exactly the approved strings (HT2-A1, L2), every generated file's
// GENERATED header is fresh over its own inputs only (HT2-A2), and every module is checked by tsc (HT2-A4).
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { BuiltHowTo, GoldenFile, GoldenPlateEntry } from '../../src/howto/types';

const url = (p: string) => new URL(`../../${p}`, import.meta.url).href;
/* eslint-disable @typescript-eslint/no-explicit-any */
let g: any, core: any, gen: any, plates: any, golden: GoldenFile, fixturePlates: any[];
const tmps: string[] = [];
beforeAll(async () => {
  g = await import(/* @vite-ignore */ url('tools/plates/golden.mjs'));
  core = await import(/* @vite-ignore */ url('tools/plates/lib/inputs.mjs'));
  gen = await import(/* @vite-ignore */ url('tools/plates/generate.mjs'));
  plates = await import(/* @vite-ignore */ url('tools/plates/gen/plates.mjs'));
  golden = JSON.parse(readFileSync(g.GOLDEN_JSON, 'utf8'));
  fixturePlates = g.extractPlates(readFileSync(g.FIXTURE, 'utf8'));
});
afterAll(() => { for (const d of tmps) rmSync(d, { recursive: true, force: true }); });

const latest = () => { const m = new Map<string, GoldenPlateEntry>(); for (const e of golden.entries) if (e.kind === 'plate') m.set(e.id, e); return m; };
const rows = () => JSON.parse(readFileSync('tools/plates/plates.json', 'utf8')) as Record<string, { src: string; slug: string; prefix: string; chromeId: string }>;
const load = async (slug: string) => (await import(/* @vite-ignore */ url(`src/howto/generated/ht-${slug}.ts`))).default as BuiltHowTo;

describe('HT2-A1 (L2): each ht-<slug>.ts holds exactly the golden fragments', () => {
  it('there are 8 approved plates, one module each', () => {
    expect(fixturePlates).toHaveLength(8);
    expect([...latest().keys()]).toHaveLength(8);
  });

  it('every string field of plate is === the fragment extracted from the committed fixture, and hashes to its latest GOLDEN entry', async () => {
    const byChrome = new Map(fixturePlates.map(p => [p.chromeId, p]));
    for (const [id, e] of latest()) {
      const m = await load(rows()[id]!.slug), f = byChrome.get(e.chromeId)!;
      expect(m.id).toBe(id);
      expect(m.name).toBe(f.name);
      for (const k of ['svg', 'overlay', 'firstKey'] as const) {
        expect(m.plate.normal[k] === f.normal[k], `${id} normal.${k}`).toBe(true);
        expect(m.plate.mistake[k] === f.mistake[k], `${id} mistake.${k}`).toBe(true);
      }
      expect(m.plate.normal.cues).toEqual(f.normal.cues);
      expect(m.plate.mistake.cues).toEqual(f.mistake.cues);
      for (const k of ['tells', 'tempo', 'alt', 'mistakeAlt'] as const) expect(m.plate[k] === f[k], `${id} ${k}`).toBe(true);
      expect(m.plate.view).toBe(plates.viewOf(f.normal.overlay));
      const back = { ...f, normal: m.plate.normal, mistake: m.plate.mistake, tells: m.plate.tells, tempo: m.plate.tempo, alt: m.plate.alt, mistakeAlt: m.plate.mistakeAlt };
      expect(g.fragmentsOf(back), id).toEqual(e.fragments);
      expect(m.hashes.golden).toBe(core.sha256(JSON.stringify(e)));
    }
  });

  it('the view comes from the plate\'s own label: the lateral raise is front, the other 7 side', async () => {
    const views = Object.fromEntries(await Promise.all([...latest().keys()].map(async id => [id, (await load(rows()[id]!.slug)).plate.view])));
    expect(views).toEqual({ lib_dumbbell_lateral_raise: 'front', lib_barbell_back_squat: 'side', lib_pull_up: 'side', lib_hanging_leg_raise: 'side', lib_lat_pulldown: 'side', lib_seated_cable_row: 'side', lib_leg_press: 'side', lib_machine_chest_press: 'side' });
    expect(() => plates.viewOf('<span class="plate-meta">Front view</span><span class="plate-meta">Side view</span>')).toThrow();
  });

  it('plates.json matches GOLDEN; the lateral raise comes from ref-src, and mapping it to a spec file fails', () => {
    const r = rows(), l = latest();
    expect(Object.keys(r)).toEqual([...l.keys()]);
    for (const [id, e] of l) expect(r[id], id).toEqual({ src: e.src, slug: e.slug, prefix: e.prefix, chromeId: e.chromeId });
    expect(r.lib_dumbbell_lateral_raise).toEqual({ src: 'ref-src', slug: 'dumbbell-lateral-raise', prefix: 'lr', chromeId: 'lateral-raise' });
    const lr = fixturePlates.find(p => p.chromeId === 'lateral-raise'), e = l.get('lib_dumbbell_lateral_raise');
    expect(plates.problemsOf(lr, e, r.lib_dumbbell_lateral_raise)).toEqual([]);
    expect(plates.problemsOf(lr, e, { ...r.lib_dumbbell_lateral_raise, src: 'exercises/dumbbell_lateral_raise.mjs' }))
      .toEqual(['lib_dumbbell_lateral_raise: plates.json src exercises/dumbbell_lateral_raise.mjs != GOLDEN ref-src']);
  });

  it('a fragment that differs by one byte from GOLDEN is refused by the generator', () => {
    const lr = fixturePlates.find(p => p.chromeId === 'lateral-raise'), e = latest().get('lib_dumbbell_lateral_raise');
    const bad = { ...lr, normal: { ...lr.normal, svg: lr.normal.svg.replace('358', '359') } };
    expect(plates.problemsOf(bad, e, rows().lib_dumbbell_lateral_raise)[0]).toMatch(/^lib_dumbbell_lateral_raise\.normalSvg: sha256 /);
  });
});

describe('HT2-A2 (freshness): every generated file starts with a fresh header over its own inputs only', () => {
  const onDisk = () => gen.generatedOnDisk() as string[];
  const inputsOf = async (writers: string[]) => (await Promise.all(writers.map(async w => (await import(/* @vite-ignore */ url(w))).inputs()))).flat();

  // Plugins are found by glob (plan 2.2), so later cards add generated files. What stays pinned: plates.mjs's own
  // outputs are exactly these 11 files, and every file names only real plugins. `generate --check` (the gate) proves
  // the files on disk are exactly what the plugins write, with those writers.
  const PLATES = 'tools/plates/gen/plates.mjs';
  const writersOf = (p: string) => core.parseHeader(readFileSync(p, 'utf8')).writers as string[];
  it('plates.mjs writes exactly the 8 modules, the loader index, ids.ts and plate.css; no file in generated/ is hand-written', () => {
    expect(onDisk().filter(p => writersOf(p).includes(PLATES))).toEqual([
      'src/howto/generated/ht-barbell-back-squat.ts', 'src/howto/generated/ht-dumbbell-lateral-raise.ts', 'src/howto/generated/ht-hanging-leg-raise.ts',
      'src/howto/generated/ht-lat-pulldown.ts', 'src/howto/generated/ht-leg-press.ts', 'src/howto/generated/ht-machine-chest-press.ts',
      'src/howto/generated/ht-pull-up.ts', 'src/howto/generated/ht-seated-cable-row.ts', 'src/howto/generated/index.ts', 'src/howto/ids.ts',
      'src/slices/howto/css/plate.css',
    ]);
    for (const f of readdirSync('src/howto/generated')) expect(onDisk(), `hand-written file in generated/: ${f}`).toContain(`src/howto/generated/${f}`);
  });

  it('every header names real plugins: one writer per file, except ht-<slug>.ts and ids.ts, which plates.mjs writes and content.mjs (run after it) may extend', async () => {
    const plugins: string[] = core.pluginFiles();
    for (const p of onDisk()) {
      const w = writersOf(p);
      expect(w.length, p).toBeGreaterThan(0);
      expect(w, p).toEqual([...w].sort());
      for (const x of w) expect(plugins, `${p}: writer ${x} is not a plugin in tools/plates/gen/`).toContain(x);
      if (w.length === 1) continue;
      expect(p, `${p}: only ht-<slug>.ts and ids.ts may have more than one writer`).toMatch(/^src\/howto\/(generated\/ht-[a-z0-9-]+\.ts|ids\.ts)$/);
      expect(w, `${p}: plan 2.2 allows exactly plates.mjs then content.mjs`).toEqual(['tools/plates/gen/content.mjs', PLATES]);
      for (const x of w.filter(x => x !== PLATES)) expect((await import(/* @vite-ignore */ url(x))).after ?? [], `${p}: ${x} must run after plates.mjs`).toContain(PLATES);
    }
  });

  it('each header\'s inputsSha256 is recomputed from its writers and their inputs, with no render', async () => {
    for (const p of onDisk()) {
      const h = core.parseHeader(readFileSync(p, 'utf8'));
      expect(h.hash, p).toBe(core.inputsSha256(h.writers, await inputsOf(h.writers)));
    }
  });

  it('the inputs are the core, the vendored files, the font, golden.mjs, css.mjs, plates.json and GOLDEN.json', () => {
    const ins: string[] = plates.inputs();
    const manifest = Object.keys(g.readManifest().files).map(p => `tools/plates/vendor/${p}`);
    expect(ins).toEqual(expect.arrayContaining([...manifest, 'tools/plates/vendor/MANIFEST.json', 'tools/plates/plates.json', 'tests/howto/golden/GOLDEN.json', 'tools/plates/golden.mjs', 'tools/plates/css.mjs']));
    expect(core.coreFiles()).toEqual(expect.arrayContaining(['tools/plates/generate.mjs', 'tools/plates/lib/inputs.mjs']));
  });

  it('the module\'s own hashes.inputsSha256 equals its header', async () => {
    for (const [id] of latest()) {
      const slug = rows()[id]!.slug;
      const h = core.parseHeader(readFileSync(`src/howto/generated/ht-${slug}.ts`, 'utf8'));
      expect((await load(slug)).hashes.inputsSha256, id).toBe(h.hash);
    }
  });

  it('touching vendor/engine/layout.mjs without regenerating makes the header stale', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ht2-inputs-')); tmps.push(root);
    const ins: string[] = [...core.coreFiles(), 'tools/plates/gen/plates.mjs', ...plates.inputs()];
    for (const p of ins) { mkdirSync(dirname(join(root, p)), { recursive: true }); copyFileSync(p, join(root, p)); }
    // index.ts has plates.mjs as its only writer for good (plan 2.2), so later plugins never change this check.
    const w = ['tools/plates/gen/plates.mjs'], fresh = core.parseHeader(readFileSync('src/howto/generated/index.ts', 'utf8')).hash;
    expect(core.inputsSha256(w, plates.inputs(), root)).toBe(fresh);
    writeFileSync(join(root, 'tools/plates/vendor/engine/layout.mjs'), readFileSync('tools/plates/vendor/engine/layout.mjs', 'utf8') + ' ');
    expect(core.inputsSha256(w, plates.inputs(), root)).not.toBe(fresh);
  });

  it('adding a plugin that writes only its own file leaves every other file\'s header unchanged (plugins do not stale each other)', async () => {
    const d = mkdtempSync(join(tmpdir(), 'ht2-plugins-')); tmps.push(d);
    const stub = (name: string, out: string) => {
      writeFileSync(join(d, name), `export const inputs = () => ['tools/plates/plates.json'];\nexport async function outputs() { return [{ path: '${out}', text: 'x\\n' }]; }\n`);
      return relative(core.ROOT, join(d, name));
    };
    const a = stub('aa.mjs', 'src/howto/generated/ht-a.ts'), zz = stub('zz.mjs', 'src/howto/generated/zz.ts');
    const one = await gen.render([a]), two = await gen.render([a, zz]);
    expect(two.get('src/howto/generated/ht-a.ts').text).toBe(one.get('src/howto/generated/ht-a.ts').text);
    expect(two.get('src/howto/generated/zz.ts').hash).not.toBe(one.get('src/howto/generated/ht-a.ts').hash);
    expect(two.get('src/howto/generated/zz.ts').writers).toEqual([zz]);
  });

  it('parseHeader rejects a file without the header', () => {
    expect(core.parseHeader('export const x = 1;\n')).toBeNull();
    expect(core.parseHeader(core.header('a.css', ['w.mjs'], 'a'.repeat(64)) + 'x')).toEqual({ writers: ['w.mjs'], hash: 'a'.repeat(64) });
  });
});

describe('HT2-A4: every generated module ends in `satisfies BuiltHowTo`', () => {
  it('each ht-<slug>.ts default-exports an object literal checked by tsc against BuiltHowTo', () => {
    for (const f of readdirSync('src/howto/generated').filter(f => f.startsWith('ht-'))) {
      const t = readFileSync(`src/howto/generated/${f}`, 'utf8');
      expect(t.endsWith('} satisfies BuiltHowTo;\n'), f).toBe(true);
      expect(t).toContain("import type { BuiltHowTo } from '../types';\n\nexport default {\n");
      expect(t.match(/^import /gm), f).toHaveLength(1);
    }
  });
});
