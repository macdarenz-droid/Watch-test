// HT2-A7 theme coupling (critic fix 16): every token the generated plate CSS reads through var() has, per theme,
// the same value in src/theme/themes.ts as in the vendored ref-src/themes.mjs the approved plates were drawn with.
// The non-theme tokens it reads (sizes, timings) equal the vendored engine/tokens.css in styles.css's token block.
// A theme change that touches the plate must go through a golden update, not surface as a pixel diff elsewhere.
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { THEME_IDS, allThemesCss } from '@/theme/themes';

let vendored = '';
beforeAll(async () => {
  vendored = (await import(/* @vite-ignore */ new URL('../../tools/plates/vendor/ref-src/themes.mjs', import.meta.url).href)).allThemesCss();
});
const byTheme = (css: string) => {
  const o: Record<string, Record<string, string>> = {};
  for (const [, t, body] of css.matchAll(/\[data-theme="([\w-]+)"\]\{([^}]*)\}/g)) for (const [, k, v] of body!.matchAll(/(--[\w-]+):([^;]+)/g)) (o[t!] ??= {})[k!] = v!.trim();
  return o;
};
const kv = (s: string) => Object.fromEntries([...s.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(m => [m[1]!, m[2]!.trim()]));
const read = () => { const css = readFileSync('src/slices/howto/css/plate.css', 'utf8'); return [...new Set([...css.matchAll(/var\((--[\w-]+)/g)].map(m => m[1]!))].filter(t => !t.startsWith('--ht-')); };

/** Per theme, the tokens `used` whose app value differs from the vendored one; "<token> in <theme>: app | vendored". */
export function themeDiffs(app: string, vend: string, used: string[]): string[] {
  const a = byTheme(app), v = byTheme(vend), bad: string[] = [];
  for (const t of Object.keys(v)) for (const k of used) if (k in v[t]!) { if (a[t]?.[k] !== v[t]![k]) bad.push(`${k} in ${t}: ${a[t]?.[k]} | ${v[t]![k]}`); }
  return bad;
}

describe('HT2-A7 theme parity: themes.ts vs the vendored ref-src themes, for every token plate.css reads', () => {
  it('the vendored and app theme sets are the same 5 themes', () => {
    expect(Object.keys(byTheme(vendored))).toEqual(THEME_IDS);
    expect(Object.keys(byTheme(allThemesCss()))).toEqual(THEME_IDS);
  });
  it('every theme token plate.css reads has the same value in every theme', () => {
    const used = read(), v = byTheme(vendored);
    const themed = used.filter(k => k in v['paper']!);
    expect(themed).toEqual(expect.arrayContaining(['--mistake', '--accent', '--text-2', '--text-3', '--surface-2', '--surface-3', '--border-strong', '--accent-text']));
    expect(themeDiffs(allThemesCss(), vendored, used)).toEqual([]);
  });
  it('one Paper token changed by one step fails, naming the token and the theme', () => {
    const app = allThemesCss().replace('--text-3:#9b9a97', '--text-3:#9b9a98');
    expect(app).not.toBe(allThemesCss());
    expect(themeDiffs(app, vendored, read())).toEqual(['--text-3 in paper: #9b9a98 | #9b9a97']);
  });
  it('the non-theme tokens plate.css reads equal the vendored engine/tokens.css in styles.css\'s token block', () => {
    const app = readFileSync('src/ui/styles.css', 'utf8'), block = app.slice(app.indexOf('/* tokens:start */'), app.indexOf('/* tokens:end */'));
    const eng = readFileSync('tools/plates/vendor/engine/tokens.css', 'utf8');
    const rootOf = (s: string) => kv(s.slice(s.indexOf(':root'), s.indexOf('}', s.indexOf(':root'))));
    const E = rootOf(eng), A = rootOf(block), themeKeys = byTheme(vendored)['paper']!;
    const nonTheme = read().filter(k => !(k in themeKeys) && !['--o', '--i', '--gd'].includes(k));
    expect(nonTheme.length).toBeGreaterThan(10);
    for (const k of nonTheme) { expect(E[k], `${k} in engine/tokens.css`).toBeDefined(); expect(A[k], k).toBe(E[k]); }
  });
});
