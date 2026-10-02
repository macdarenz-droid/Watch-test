// HT2-A6 class map (design A 1.5): injective, touches only class tokens, and never needs to touch the shipped
// fragments. The SVG, overlay, tells and tempo carry neither `plate` nor `plate-fit` as a class, so they ship verbatim.
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
let c: any, g: any, plates: any[], css: string;
beforeAll(async () => {
  c = await import(/* @vite-ignore */ new URL('../../tools/plates/css.mjs', import.meta.url).href);
  g = await import(/* @vite-ignore */ new URL('../../tools/plates/golden.mjs', import.meta.url).href);
  const html = readFileSync(g.FIXTURE, 'utf8');
  plates = g.extractPlates(html);
  css = c.galleryCss(html);
});
const classTokens = (html: string) => [...html.matchAll(/\bclass="([^"]*)"/g)].flatMap(m => m[1]!.split(/\s+/));

describe('HT2-A6 class map', () => {
  it('is injective, maps only plate and plate-fit, and its targets are new names', () => {
    const vals = Object.values(c.CLASS_MAP);
    expect(Object.keys(c.CLASS_MAP)).toEqual(['plate', 'plate-fit']);
    expect(new Set(vals).size).toBe(vals.length);
    const goldenClasses = new Set([...css.matchAll(/\.([\w-]+)/g)].map(m => m[1]));
    for (const v of vals) expect(goldenClasses.has(v as string), `${v} already used by the golden`).toBe(false);
  });

  it('touches only class tokens: reversing it on every mapped golden selector gives the original', () => {
    const sels = c.parse(css).flatMap((n: any) => (n.sel != null ? [n.sel] : Array.isArray(n.body) ? n.body.map((r: any) => r.sel) : []));
    expect(sels.filter((s: string) => /\.plate(?![\w-])|\.plate-fit(?![\w-])/.test(s)).length).toBeGreaterThan(40);
    const unmap = (s: string) => s.replace(/\.ht-(plate(?:-fit)?)(?![\w-])/g, '.$1');
    for (const s of sels) {
      const m = c.mapClasses(s);
      expect(unmap(m), s).toBe(s);
      expect(m.replace(/\.ht-plate(?:-fit)?(?![\w-])/g, '').replace(/\.plate(?:-fit)?(?![\w-])/g, ''), s).toBe(s.replace(/\.plate(?:-fit)?(?![\w-])/g, ''));
    }
  });

  it('no shipped fragment has a plate or plate-fit class, so the SVG, overlay, tells and tempo ship verbatim', () => {
    expect(plates).toHaveLength(8);
    for (const p of plates) {
      for (const [k, s] of Object.entries({ normalSvg: p.normal.svg, normalOverlay: p.normal.overlay, mistakeSvg: p.mistake.svg, mistakeOverlay: p.mistake.overlay, tells: p.tells, tempo: p.tempo })) {
        const tokens = classTokens(s as string);
        expect(tokens.length, `${p.chromeId}.${k}`).toBeGreaterThan(0);
        expect(tokens.filter(t => t in c.CLASS_MAP), `${p.chromeId}.${k}`).toEqual([]);
        expect(s as string).not.toContain('ht-plate');
      }
    }
  });

  it('the generated CSS never selects the app\'s own .plate chip (styles.css)', () => {
    const out = readFileSync('src/slices/howto/css/plate.css', 'utf8');
    expect(out).not.toMatch(/\.plate(?![\w-])/);
    expect(out).not.toMatch(/\.plate-fit(?![\w-])/);
    expect(readFileSync('src/ui/styles.css', 'utf8')).toMatch(/\.plate(?![\w-])/);
  });
});
