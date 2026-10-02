import { describe, it, expect } from 'vitest';
import { THEMES, THEME_IDS, allThemesCss, themeToCss } from '@/theme/themes';

describe('themes', () => {
  it('has five themes with a complete token contract', () => {
    expect(THEME_IDS).toHaveLength(5);
    const keys = Object.keys(THEMES['silent-black'].tokens).sort();
    for (const id of THEME_IDS) expect(Object.keys(THEMES[id].tokens).sort()).toEqual(keys);
  });
  it('emits css custom properties per theme', () => {
    const css = themeToCss(THEMES.paper);
    expect(css).toContain('[data-theme="paper"]');
    expect(css).toContain('--accent:#2383e2');
    expect(allThemesCss().split('\n')).toHaveLength(5);
  });
});

import { readFileSync } from 'node:fs';
import { isDarkBg } from '@/theme/engine';
describe('first paint (ST-25)', () => {
  const html = readFileSync('index.html', 'utf8');
  it.each(THEME_IDS)('index.html paints %s in its own bg and text before the bundle', id => {
    const rule = new RegExp(`html\\[data-theme="${id}"\\][^{]*\\{\\s*background:\\s*(#[0-9a-f]{6});\\s*color:\\s*(#[0-9a-f]{6})`, 'i').exec(html);
    expect(rule, id).not.toBeNull();
    expect(rule![1]!.toLowerCase()).toBe(THEMES[id].tokens.bg.toLowerCase());
    expect(rule![2]!.toLowerCase()).toBe(THEMES[id].tokens.text.toLowerCase());
  });
  it('the pre-paint script only accepts known ids and the page can zoom', () => {
    for (const id of THEME_IDS) expect(html).toContain(`'${id}'`);
    expect(html).not.toContain('maximum-scale');
  });
  it('system bar icons follow the background', () => {
    expect(isDarkBg(THEMES.paper.tokens.bg)).toBe(false);
    for (const id of THEME_IDS.filter(t => t !== 'paper')) expect(isDarkBg(THEMES[id].tokens.bg), id).toBe(true);
  });
});

describe('launch overlay theme map (O1)', () => {
  it('index.html THEME map matches src/theme/themes.ts bg/text/accent for every theme', () => {
    const script = /var THEME = \{([\s\S]*?)\};/.exec(readFileSync('index.html', 'utf8'));
    expect(script).not.toBeNull();
    // eslint-disable-next-line no-eval
    const THEME = new Function(`return {${script![1]}};`)() as Record<string, { bg: string; ink: string; accent: string }>;
    for (const id of THEME_IDS) {
      expect(THEME[id], id).toBeDefined();
      expect(THEME[id]!.bg.toLowerCase()).toBe(THEMES[id].tokens.bg.toLowerCase());
      expect(THEME[id]!.ink.toLowerCase()).toBe(THEMES[id].tokens.text.toLowerCase());
      expect(THEME[id]!.accent.toLowerCase()).toBe(THEMES[id].tokens.accent.toLowerCase());
    }
  });
});

describe('stylesheet custom properties (QA-R7-4)', () => {
  it('every var() the stylesheet reads is a theme token, defined in the sheet, or set inline by a component', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/ui/styles.css', 'utf8');
    const used = new Set([...css.matchAll(/var\((--[\w-]+)/g)].map(m => m[1]!));
    const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g), ...themeToCss(THEMES.paper).matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]!));
    // Set from a style attribute or by the platform.
    const inline = new Set(['--dot', '--insight', '--muscle-fill', '--pulse-beat', '--hold-ms', '--safe-area-inset-bottom', '--safe-area-inset-top', '--scrim-o']);
    expect([...used].filter(v => !defined.has(v) && !inline.has(v))).toEqual([]);
  });
});

// UI-1: the exercise-title sweep paints only var(--text) and the accent, never a dim tone (A4); it
// lives inside its keyframes, so at rest and under reduced motion the title is plain var(--text)
// (A3); only the open card's title runs it, finite on open (A1, A6); I3's static border stays and no
// box-shadow loop comes back (A5); and every theme's accent is a real colour, not a grey (A4).
describe('exercise-title sweep (UI-1)', () => {
  const css = readFileSync('src/ui/styles.css', 'utf8');
  const kfAt = css.indexOf('@keyframes exercise-shimmer');
  const keyframes = kfAt === -1 ? '' : css.slice(kfAt, css.indexOf('\n}', kfAt) + 2);
  const rules = css.split('\n').filter(l => /animation\s*:[^;]*exercise-/.test(l));
  it('the keyframes paint only var(--text), the accent and transparent', () => {
    expect(keyframes).not.toBe('');
    const vars = [...keyframes.matchAll(/var\((--[\w-]+)\)/g)].map(m => m[1]);
    expect(new Set(vars)).toEqual(new Set(['--text', '--accent']));
    expect(keyframes).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\bgr[ae]y\b/i);
    expect(keyframes).toMatch(/background-clip:\s*text/);
  });
  it('nothing outside the keyframes clips or hides the title text (plain at rest and under reduce)', () => {
    const outside = css.replace(keyframes, '');
    expect(outside).not.toMatch(/\.exname[^{]*\{[^}]*(background|text-fill-color|color:\s*transparent)/);
  });
  it('only the open card title animates, never under reduce, finite on open', () => {
    expect(rules.length).toBe(2);
    for (const r of rules) {
      expect(r.startsWith('html:not([data-motion="reduce"]) .exercise.active')).toBe(true);
      expect(r).toMatch(/\.exname \{ animation: exercise-shimmer /);
    }
    const [open, logging] = rules;
    expect(open).toMatch(/exercise-shimmer [\d.]+s linear 2;/);
    expect(logging).toMatch(/:has\(\.set-grid input:focus\)/);
    expect(logging).toMatch(/\[data-hold\]:focus-within/);
    expect(logging).toMatch(/linear infinite;/);
  });
  it('keeps I3: static accent border, no breathe loop, no box-shadow in the sweep', () => {
    expect(css).toContain('.exercise.active { border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); }');
    expect(css).not.toContain('exercise-breathe');
    expect(keyframes).not.toContain('box-shadow');
  });
  it('every theme accent is a saturated colour, distinct from its text', () => {
    const hsl = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
      const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
      return { s: max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1)), l };
    };
    for (const id of THEME_IDS) {
      const { accent, text } = THEMES[id].tokens;
      expect(hsl(accent).s, `${id} accent ${accent}`).toBeGreaterThan(0.5);
      expect(accent.toLowerCase(), id).not.toBe(text.toLowerCase());
    }
  });
});

// HT-2 (D-HT1 A3-HT.d, C9): the How-to plate's --mistake stroke reads at >= 3:1 (WCAG non-text
// contrast) on the body fill and both sheet surfaces, in every theme, computed from themes.ts.
describe('How-to mistake token contrast (HT-2)', () => {
  const lum = (hex: string) => {
    expect(hex, 'a #rrggbb colour').toMatch(/^#[0-9a-f]{6}$/i);
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number]; return (x + 0.05) / (y + 0.05); };
  it.each(THEME_IDS)('%s: --mistake >= 3:1 against --map-body, --surface-1 and --surface-2', id => {
    const t = THEMES[id].tokens;
    for (const [name, bg] of [['map-body', t.mapBody], ['surface-1', t.surface1], ['surface-2', t.surface2]] as const)
      expect(ratio(t.mistake, bg), `${id} mistake ${t.mistake} on ${name} ${bg}`).toBeGreaterThanOrEqual(3);
  });
});
