// HT-1 L0 (HT1-A1) and the src/tools split (HT1-A6): the vendored Technical Plate sources and the font are the approved ones.
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..', '..');
const GOLDEN_URL = new URL('../../tools/plates/golden.mjs', import.meta.url).href;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let g: any;
const tmps: string[] = [];
const copyVendor = () => {
  const d = mkdtempSync(join(tmpdir(), 'ht1-vendor-'));
  tmps.push(d);
  cpSync(g.VENDOR, d, { recursive: true });
  return d;
};
const flipByte = (file: string, at = 100) => {
  const b = readFileSync(file);
  b[at] = b[at] === 0x20 ? 0x21 : 0x20;
  writeFileSync(file, b);
};

beforeAll(async () => { g = await import(/* @vite-ignore */ GOLDEN_URL); });
afterAll(() => { for (const d of tmps) rmSync(d, { recursive: true, force: true }); });

describe('HT1-A1 vendor lock (L0)', () => {
  it('every vendored file matches its MANIFEST sha256, git blob and source pin', () => {
    expect(g.verifyVendor()).toEqual([]);
  });

  it('the MANIFEST lists the engine, tokens.css, SPEC.md, the 7 specs, the 4 test specs, ref-src and build-page, and nothing else', () => {
    const m = g.readManifest();
    const paths = Object.keys(m.files).sort();
    const engine = ['body', 'equipment', 'gallery', 'geom', 'index', 'layout', 'measure-chars', 'plate', 'render', 'sheet', 'themes', 'zoom'].map(f => `engine/${f}.mjs`);
    const specs = ['_test_flat', '_test_front', '_test_poly', '_test_side', 'barbell_back_squat', 'hanging_leg_raise', 'lat_pulldown', 'leg_press', 'machine_chest_press', 'pull_up', 'seated_cable_row'].map(f => `exercises/${f}.mjs`);
    expect(paths).toEqual([...engine, 'engine/SPEC.md', 'engine/tokens.css', ...specs, 'ref-src/plate.mjs', 'ref-src/themes.mjs', 'artifact/build-page.mjs'].sort());
    for (const [p, e] of Object.entries(m.files) as [string, { source: string; md5?: string }][]) {
      if (p.startsWith('ref-src/')) {
        expect(e.source).toBe(`1a1e33b:docs/howto/technical-plate/${p}`);
        expect(e.md5).toBe(g.PINS.refSrcMd5[p]);
      } else {
        // LIB-25 [golden update]: the additive poly primitive (7859292, its input checks 48153c4) and its engine test
        // (de00174), claude/howto-options. LIB-26 [golden update]: the flat-palm hand option (body, plate) and its engine
        // test, f214700; SPEC.md at 48153c4 documents both.
        const ref = ['engine/body.mjs', 'engine/plate.mjs', 'exercises/_test_flat.mjs'].includes(p) ? 'f214700'
          : ['engine/equipment.mjs', 'engine/SPEC.md'].includes(p) ? '48153c4' : p === 'exercises/_test_poly.mjs' ? 'de00174' : 'bc0f378';
        expect(e.source).toBe(`${ref}:docs/howto/technical-plate/${p === 'artifact/build-page.mjs' ? 'build-page.mjs' : p}`);
      }
    }
    expect(g.PINS.refSrcMd5).toEqual({ 'ref-src/plate.mjs': '31e7bfe3555c0c456ed4417f503dc93f', 'ref-src/themes.mjs': '37495b3d37d1a6a284a380c9e517fb18' });
  });

  it('the font is the fontsource 5.3.0 latin woff2 the engine measured labels with', () => {
    expect(g.PINS.fontSha256).toBe('3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62');
    expect(g.readManifest().font).toMatchObject({ sha256: g.PINS.fontSha256, md5: '260c81a4759baf163c025001c4f27872', package: '@fontsource-variable/inter@5.3.0' });
    expect(g.verifyFont()).toBeNull();
  });

  it('fails and names the file on a 1-byte change to engine/plate.mjs', () => {
    const d = copyVendor();
    flipByte(join(d, 'engine/plate.mjs'));
    const bad: string[] = g.verifyVendor(d);
    expect(bad.some(p => p.startsWith('engine/plate.mjs: sha256'))).toBe(true);
    expect(bad.every(p => p.startsWith('engine/plate.mjs'))).toBe(true);
  });

  it('fails and names the file on a 1-byte change to ref-src/plate.mjs (sha256 and the md5 pin)', () => {
    const d = copyVendor();
    flipByte(join(d, 'ref-src/plate.mjs'));
    const bad: string[] = g.verifyVendor(d);
    expect(bad.some(p => p.startsWith('ref-src/plate.mjs: sha256'))).toBe(true);
    expect(bad.some(p => p.startsWith('ref-src/plate.mjs: md5'))).toBe(true);
  });

  it('fails on a missing or an extra vendored file', () => {
    const d = copyVendor();
    rmSync(join(d, 'exercises/pull_up.mjs'));
    writeFileSync(join(d, 'exercises/extra.mjs'), 'export default {};\n');
    expect(g.verifyVendor(d)).toEqual(['exercises/pull_up.mjs: missing', 'exercises/extra.mjs: not in MANIFEST']);
  });

  it('fails on a different woff2 at the font path', () => {
    const other = join(ROOT, 'node_modules/@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2');
    expect(g.verifyFont(other)).toMatch(/sha256 .* != pinned 3100e775/);
  });

  // HT-2 (supervisor, HT-1 review): one literal pin over the MANIFEST, so editing a vendored file together
  // with its MANIFEST entry still fails here and shows up as a visible change to this test.
  it('HT-2: the sorted path:sha256 list of MANIFEST.json hashes to its pinned literal', () => {
    const list = Object.entries(g.readManifest().files as Record<string, { sha256: string }>).map(([p, e]) => `${p}:${e.sha256}`).sort().join('\n');
    expect(g.sha256(list)).toBe('abd55ac0348f1a1c297d23c68ce6d5b16b44c17ecc654931dea45b09db93f906');
  });
});

describe('HT1-A6 vendored files stay outside src', () => {
  const walk = (d: string): string[] => readdirSync(d).flatMap(f => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

  it('the vendor folder is under tools/plates, not src', () => {
    expect(relative(ROOT, g.VENDOR)).toBe(join('tools', 'plates', 'vendor'));
  });

  it('nothing in src imports tools/**', () => {
    const tools = join(ROOT, 'tools') + sep;
    const resolveSpec = (file: string, spec: string) =>
      spec.startsWith('.') ? resolve(dirname(file), spec) : spec.startsWith('@/') ? join(ROOT, 'src', spec.slice(2)) : resolve(ROOT, spec);
    const hits = walk(join(ROOT, 'src')).filter(f => /\.(ts|tsx|js|mjs|css)$/.test(f)).flatMap(f =>
      [...readFileSync(f, 'utf8').matchAll(/(?:from\s*|import\s*\(\s*|import\s+|url\(\s*)['"]([^'"]+)['"]/g)]
        .filter(m => resolveSpec(f, m[1]!).startsWith(tools)).map(m => `${relative(ROOT, f)}: ${m[1]}`));
    expect(hits).toEqual([]);
  });

  it('no vendored file is copied into src', () => {
    const vendored = new Set(Object.values(g.readManifest().files).map(e => (e as { sha256: string }).sha256));
    const sha = (f: string) => g.sha256(readFileSync(f));
    expect(walk(join(ROOT, 'src')).filter(f => vendored.has(sha(f))).map(f => relative(ROOT, f))).toEqual([]);
  });
});
