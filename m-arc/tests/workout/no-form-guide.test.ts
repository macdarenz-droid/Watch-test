import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { THEMES, THEME_IDS, themeToCss } from '@/theme/themes';

// FG-OFF: the owner paused the form-guide animation (2026-09-29; backup branch
// claude/backup-fg-2026-09-29-main). The app carries no old guide button, no guide player, and
// none of FG-1's figure theme tokens but `mistake`. The built bundle is checked by the gate's
// FG-OFF block. D-HT1 (owner approval 2026-09-30): "How to do it" returns only as the approved
// Technical Plate (HT-3), where approved content exists; A1-HT.a-c and A5 replace A1's old purpose.
const srcFiles = (readdirSync('src', { recursive: true }) as string[])
  .filter(f => /\.(ts|tsx|css)$/.test(f))
  .map(f => `src/${f.replace(/\\/g, '/')}`);

describe('FG-OFF: the old form guide is out of the app', () => {
  it('A1: the Train card never hard-codes the label and has no old form guide button or guide sheet, anywhere in src', () => {
    const train = readFileSync('src/slices/workout/Train.tsx', 'utf8');
    expect(train).not.toContain('How to do it');
    expect(srcFiles.filter(f => readFileSync(f, 'utf8').includes('btn-how-to'))).toEqual([]);
    expect(srcFiles.filter(f => /FormGuideSheet|hasGuide|guideOpen/.test(readFileSync(f, 'utf8')))).toEqual([]);
    const css = ['src/ui/styles.css', ...srcFiles.filter(f => /^src\/slices\/howto\/css\/[^/]+\.css$/.test(f))];
    expect(css.length).toBeGreaterThan(2);
    for (const f of css) expect(readFileSync(f, 'utf8'), f).not.toContain('.btn-how-to');
  });

  it('A1-HT.a: the label "How to do it" is written once in src, as HOWTO_LABEL in src/howto/ids.ts', () => {
    const hits = srcFiles.flatMap(f => (readFileSync(f, 'utf8').match(/How to do it/g) ?? []).map(() => f));
    expect(hits).toEqual(['src/howto/ids.ts']);
    expect(readFileSync('src/howto/ids.ts', 'utf8')).toContain('export const HOWTO_LABEL = "How to do it";');
  });

  it('A1-HT.b: Train has one entry, class ht-entry, only for a library exercise with approved content, labelled {HOWTO_LABEL}', () => {
    const train = readFileSync('src/slices/workout/Train.tsx', 'utf8');
    expect(train.match(/ht-entry/g)).toEqual(['ht-entry']);
    expect(train.match(/<button type="button" class="ht-entry"[^\n]*/g)).toEqual(['<button type="button" class="ht-entry" onClick={() => setHowToOpen(true)}><IconPlay size={18} /> {HOWTO_LABEL}</button>}']);
    expect(train).toContain('{ex && !ex.custom && hasHowTo(ex.id) && <button type="button" class="ht-entry" ');
    expect(train.match(/howToOpen/g)).toHaveLength(2);
    expect(train).toContain('const [howToOpen, setHowToOpen] = useState(false);');
    expect(train).toContain('{howToOpen && ex && <HowToSheet exerciseId={ex.id} name={ex.name} onClose={() => setHowToOpen(false)} />}');
    const others = srcFiles.filter(f => f !== 'src/slices/workout/Train.tsx' && readFileSync(f, 'utf8').includes('ht-entry'));
    expect(others).toEqual(['src/ui/styles.css']);
    const styles = readFileSync('src/ui/styles.css', 'utf8');
    const block = styles.slice(styles.indexOf('/* HT-3:'));
    expect(styles.indexOf('ht-entry')).toBeGreaterThan(styles.indexOf('/* HT-3:'));
    expect(block.match(/^[^\s/][^{]*\{/gm)?.every(sel => sel.startsWith('.ht-entry'))).toBe(true);
  });

  it('A1-HT.c: Train reaches How-to code only through @/slices/howto/lazy and @/howto/ids', () => {
    const train = readFileSync('src/slices/workout/Train.tsx', 'utf8');
    const specs = [...train.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map(m => m[1]!).filter(x => /howto/i.test(x));
    expect(specs.sort()).toEqual(['@/howto/ids', '@/slices/howto/lazy']);
  });

  it('A2: no old form guide code or player is left in src', () => {
    expect(existsSync('src/formguide')).toBe(false);
    expect(existsSync('src/slices/formguide')).toBe(false);
    const hits = srcFiles.filter(f => /formguide|ExercisePlayer|FormGuidePlayer|\.form-guide\b|\bfg4?-/.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });

  // D-HT1 (HT-2, owner approval 2026-09-30): the old guide's 14 figure tokens stay banned except
  // `mistake`, which returns for the How-to plate with the D-FG1 values (A3-HT.a-c replace it).
  it('A3: no source, CSS or theme still refers to a removed old form guide figure token', () => {
    const removed = ['target', 'help', 'quiet', 'pants', 'pants-hi', 'pants-sh', 'ink', 'iron', 'iron-hi', 'iron-sh', 'eye', 'floor', 'guide'];
    const token = new RegExp(`--(${removed.join('|')})(?![\\w-])`);
    const hits = [...srcFiles, 'index.html'].filter(f => token.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
    const keys = ['target', 'help', 'quiet', 'pants', 'pantsHi', 'pantsSh', 'ink', 'iron', 'ironHi', 'ironSh', 'eye', 'floor', 'guide'];
    for (const id of THEME_IDS) {
      expect(themeToCss(THEMES[id]), id).not.toMatch(token);
      expect(Object.keys(THEMES[id].tokens).filter(k => keys.includes(k)), id).toEqual([]);
    }
  });

  const mistake = /--mistake(?![\w-])/;
  it('A3-HT.a: --mistake is defined once in themes.ts and read only under src/slices/howto/', () => {
    const outside = [...srcFiles, 'index.html'].filter(f => !f.startsWith('src/slices/howto/') && mistake.test(readFileSync(f, 'utf8')));
    expect(outside).toEqual(['src/theme/themes.ts']);
    const themes = readFileSync('src/theme/themes.ts', 'utf8');
    expect(themes.match(/--mistake(?![\w-])/g)).toEqual(['--mistake']);
    expect(themes).toContain('`--mistake:${t.mistake}`,');
    expect(themes).not.toMatch(/var\(--mistake/);
  });

  const D_FG1 = { 'silent-black': '#eb5757', paper: '#c0392b', ember: '#b36bff', emerald: '#f04438', midnight: '#ff5c5c' } as const;
  it('A3-HT.b: every theme\'s CSS holds exactly one --mistake, with its D-FG1 value', () => {
    for (const id of THEME_IDS) {
      const css = themeToCss(THEMES[id]);
      expect([...css.matchAll(/--mistake(?![\w-])\s*:\s*([^;}]*)/g)].map(m => m[1]), id).toEqual([D_FG1[id]]);
    }
  });

  it('A3-HT.c: tokens.mistake is exactly the D-FG1 value in all 5 themes', () => {
    expect(Object.fromEntries(THEME_IDS.map(id => [id, THEMES[id].tokens.mistake]))).toEqual(D_FG1);
  });
});

// D-HT1 A4 (HT-2): the How-to stays out of the main bundle. Following static imports only (not
// `import type`, which the build erases, and not `import()`), main reaches no src/howto/** module
// except ids.ts (and HT-3's src/slices/howto/lazy.tsx, once it lands), and no src file imports tools/.
const SPEC = /^\s*(?:import|export)\s+(?!type\b)(?:[^'"()]*?\s+from\s+)?['"]([^'"]+)['"]/gm;
function resolveImport(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = `src/${spec.slice(2)}`;
  else if (spec.startsWith('.')) base = normalize(join(dirname(from), spec)).replace(/\\/g, '/');
  else return null;
  for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) if (existsSync(base + ext) && !base.endsWith('/') && (ext || /\.\w+$/.test(base))) return base + ext;
  return null;
}
export function staticGraph(entry: string): Set<string> {
  const seen = new Set<string>();
  const walk = (f: string) => {
    if (seen.has(f)) return;
    seen.add(f);
    if (!/\.(ts|tsx)$/.test(f)) return;
    for (const m of readFileSync(f, 'utf8').matchAll(SPEC)) {
      const r = resolveImport(f, m[1]!);
      if (r) walk(r);
    }
  };
  walk(entry);
  return seen;
}

describe('D-HT1 A4: the How-to is reached from main only through ids.ts', () => {
  it('the static graph from src/main.tsx reaches no src/howto/** but ids.ts, and no src/slices/howto/** but lazy.tsx', () => {
    const graph = [...staticGraph('src/main.tsx')];
    expect(graph.length).toBeGreaterThan(50);
    expect(graph).toContain('src/app/App.tsx');
    const howto = graph.filter(f => f.startsWith('src/howto/') || f.startsWith('src/slices/howto/'));
    expect(howto.filter(f => f !== 'src/howto/ids.ts' && f !== 'src/slices/howto/lazy.tsx')).toEqual([]);
  });
  it('ids.ts, main\'s one How-to module, statically reaches nothing else; generated/** is reached only through import()', () => {
    expect([...staticGraph('src/howto/ids.ts')]).toEqual(['src/howto/ids.ts']);
    const statics = srcFiles.filter(f => /\.(ts|tsx)$/.test(f) && [...staticGraph(f)].some(r => r !== f && r.startsWith('src/howto/generated/')));
    expect(statics.filter(f => !f.startsWith('src/howto/generated/'))).toEqual([]);
  });
  it('no src file imports tools/', () => {
    const hits = srcFiles.filter(f => [...readFileSync(f, 'utf8').matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g)]
      .some(m => /^\/?tools\//.test(m[1]!) || (m[1]!.startsWith('.') && normalize(join(dirname(f), m[1]!)).replace(/\\/g, '/').startsWith('tools/'))));
    expect(hits).toEqual([]);
  });
});

// D-HT1 A5 (HT-3): the entry exists exactly where approved content exists, with no fallback.
describe('D-HT1 A5: hasHowTo is true exactly for the approved plates', () => {
  it('true for the GOLDEN plate ids, false for every other library id and for custom ids; ids = LOADERS keys = generated files', async () => {
    const { hasHowTo, HOWTO_IDS } = await import('@/howto/ids');
    const { LOADERS } = await import('@/howto/generated');
    const golden = JSON.parse(readFileSync('tests/howto/golden/GOLDEN.json', 'utf8')) as { entries: { kind: string; id?: string }[] };
    const approved = [...new Set(golden.entries.filter(e => e.kind === 'plate').map(e => e.id!))].sort();
    expect(approved).toHaveLength(8);
    const lib = (JSON.parse(readFileSync('src/data/exercises.json', 'utf8')) as { id: string }[]).map(e => e.id);
    expect(lib.length).toBeGreaterThan(140);
    for (const id of approved) expect(lib, id).toContain(id);
    expect(lib.filter(id => hasHowTo(id)).sort()).toEqual(approved);
    for (const id of ['custom_1', 'custom_lib_pull_up', 'lib_pull_up ', '', 'LIB_PULL_UP']) expect(hasHowTo(id), id).toBe(false);
    expect([...HOWTO_IDS].sort()).toEqual(approved);
    expect(Object.keys(LOADERS).sort()).toEqual(approved);
    const files = readdirSync('src/howto/generated').filter(f => /^ht-.*\.ts$/.test(f)).map(f => `lib_${f.slice(3, -3).replace(/-/g, '_')}`).sort();
    expect(files).toEqual(approved);
  });
  it('the gate\'s no-How-to control is the first library id without approved content, and has none', async () => {
    const { hasHowTo } = await import('@/howto/ids');
    const h = await import(/* @vite-ignore */ new URL('../../tools/plates/fidelity/harness.mjs', import.meta.url).href) as { firstWithoutHowTo: () => string; HT_NO_HOWTO: string; HT_ORDER: string[] };
    const { firstWithoutHowTo, HT_NO_HOWTO, HT_ORDER } = h;
    const lib = (JSON.parse(readFileSync('src/data/exercises.json', 'utf8')) as { id: string }[]).map(e => e.id);
    const id = firstWithoutHowTo();
    expect(id).toBe(lib.find(i => !hasHowTo(i)));
    expect(hasHowTo(id)).toBe(false);
    expect(HT_NO_HOWTO).toBe(id);
    expect(HT_ORDER).toContain(id);
  });
  it('no fallback: the sheet closes with the load-failed toast for an id without content, and renders nothing until the content is in', () => {
    const sheet = readFileSync('src/slices/howto/HowToSheet.tsx', 'utf8');
    expect(sheet).toContain('if (!hasHowTo(exerciseId)) { howToLoadFailed(onClose); return; }');
    expect(sheet).toContain('if (!howTo) return null;');
  });
});
