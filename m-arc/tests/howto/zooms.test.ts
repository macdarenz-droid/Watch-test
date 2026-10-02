// HT-7: the posture close-ups. HT7-A1 (each shipped crop panel is golden B's, byte for byte, and fresh), HT7-A2 (no
// duplicate id inside one How-to, none shared by two), HT7-A5 (chunk size, imports) and HT7-A6 (the right/wrong
// halves as role=img with the content's alt, the printed Right/Wrong word and icon).
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INLINE_ALLOW, inlineVars, lint } from './css.test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const url = (p: string) => new URL(`../../${p}`, import.meta.url).href;
const FIXTURE = readFileSync(new URL('golden/howto-layers.html', import.meta.url), 'utf8');
const ROWS = JSON.parse(readFileSync('tools/plates/plates.json', 'utf8')) as Record<string, { chromeId: string; slug: string }>;
const IDS = Object.values(ROWS).map(r => r.chromeId);
const ROW_OF = Object.fromEntries(Object.entries(ROWS).map(([lib, r]) => [r.chromeId, { ...r, lib }]));
let gen: any, layers: any, L: any, core: any;
const chunks: Record<string, { panels: Record<string, string>; zdots: string }> = {};
const content: Record<string, any> = {};
const tmps: string[] = [];
beforeAll(async () => {
  gen = await import(/* @vite-ignore */ url('tools/plates/gen/zooms.mjs'));
  layers = await import(/* @vite-ignore */ url('tools/plates/layers.mjs'));
  L = await import(/* @vite-ignore */ url('tools/plates/layers/artifact/howto-layers.mjs'));
  core = await import(/* @vite-ignore */ url('tools/plates/lib/inputs.mjs'));
  for (const id of IDS) {
    chunks[id] = await import(/* @vite-ignore */ url(`src/howto/generated/posture-${id}.ts`));
    content[id] = (await import(/* @vite-ignore */ url(`tools/plates/layers/exercises/${ROW_OF[id]!.lib.slice(4)}.howto.mjs`))).default;
  }
});
afterAll(() => { for (const d of tmps) rmSync(d, { recursive: true, force: true }); });
const postureZooms = (id: string) => content[id].zooms.filter((z: any) => z.kind === 'posture');
const src = (id: string) => readFileSync(`src/howto/generated/posture-${id}.ts`, 'utf8');

describe('HT7-A1: every posture panel === golden B', () => {
  it('the fixture is the approved golden-B page', () => {
    expect(layers.sha256(Buffer.from(FIXTURE, 'utf8'))).toBe(layers.PAGE_SHA256);
  });
  it('one chunk per exercise, keyed by the chrome id, and no other posture chunk', () => {
    const files = readdirSync('src/howto/generated').filter(f => f.startsWith('posture-')).sort();
    expect(files).toEqual(IDS.map(id => `posture-${id}.ts`).sort());
    expect(IDS).toHaveLength(8);
  });
  it.each(IDS)('%s: the panels are the page\'s posture close-ups, same keys, same order, each ===', id => {
    const golden = gen.posturePanels(FIXTURE, id) as { key: string; panel: string }[];
    expect(Object.keys(chunks[id]!.panels)).toEqual(golden.map(g => g.key));
    expect(golden.map(g => g.key)).toEqual(postureZooms(id).map((z: any) => z.key));
    for (const g of golden) {
      expect(chunks[id]!.panels[g.key] === g.panel, `${id}/${g.key}`).toBe(true);
      expect(g.panel.startsWith(`<div class="zx" id="${id}-zoom-${g.key}" data-zoom="${g.key}"`)).toBe(true);
    }
  });
  it('the 16 crops keep golden B\'s own re-render: a nested <svg> and a clip-path in each', () => {
    let n = 0;
    for (const id of IDS) for (const p of Object.values(chunks[id]!.panels)) {
      n++;
      expect((p.match(/<svg\b/g) ?? []).length).toBeGreaterThanOrEqual(2);
      expect(p).toMatch(/clip-path="url\(#[a-z0-9-]+\)"/);
    }
    expect(n).toBe(16);
  });
  it.each(IDS)('%s: zdots === golden B\'s ZDOTS, which the page holds exactly once', id => {
    expect(chunks[id]!.zdots === L.ZDOTS).toBe(true);
    expect(FIXTURE.split(L.ZDOTS)).toHaveLength(2);
  });
  it('failure path: a 1-byte change to a crop fails the compare', () => {
    const golden = gen.posturePanels(FIXTURE, 'pull-up')[0].panel as string, p = chunks['pull-up']!.panels.shoulders!;
    const i = p.indexOf('Right');
    const mutated = p.slice(0, i) + 'r' + p.slice(i + 1);
    expect(mutated === golden).toBe(false);
    expect(mutated.length).toBe(golden.length);
  });
  it('failure paths: a page without posture close-ups, or with a panel twice, throws', () => {
    expect(() => gen.posturePanels(FIXTURE.replace(/ data-zoom="(shoulders|top)"/g, ' data-zoom="hand"'), 'pull-up')).toThrow();
    const one = gen.posturePanels(FIXTURE, 'pull-up')[0].panel;
    expect(() => gen.posturePanels(FIXTURE + one, 'pull-up')).toThrow(/two shoulders close-ups/);
  });
  it('freshness: each chunk\'s header is recomputed from its writer and inputs; a vendored render file changed without regenerating stales it', () => {
    const w = ['tools/plates/gen/zooms.mjs'];
    for (const id of IDS) {
      const h = core.parseHeader(src(id));
      expect(h.writers).toEqual(w);
      expect(h.hash, id).toBe(core.inputsSha256(w, gen.inputs()));
    }
    expect(gen.inputs()).toContain('tools/plates/layers/exercises/leg_press.howto-render.mjs');
    const root = mkdtempSync(join(tmpdir(), 'ht7-inputs-')); tmps.push(root);
    for (const p of [...core.coreFiles(), ...w, ...gen.inputs()]) { mkdirSync(dirname(join(root, p)), { recursive: true }); copyFileSync(p, join(root, p)); }
    const fresh = core.parseHeader(src('leg-press')).hash;
    expect(core.inputsSha256(w, gen.inputs(), root)).toBe(fresh);
    const f = 'tools/plates/layers/exercises/leg_press.howto-render.mjs';
    writeFileSync(join(root, f), readFileSync(f, 'utf8') + ' ');
    expect(core.inputsSha256(w, gen.inputs(), root)).not.toBe(fresh);
  });
  it('css/posture.css: the page\'s .zdot rule and its .plate drawing rules for the crops, and it passes the How-to style lints', () => {
    const css = readFileSync('src/slices/howto/css/posture.css', 'utf8');
    expect(lint(css)).toEqual([]);
    expect(css).toContain('.ht .zdot { fill: var(--border-subtle); }');
    expect(FIXTURE).toContain('.zdot { fill: var(--border-subtle); }');
    expect(css).not.toMatch(/\.ht-plate\b/);
    // every page rule whose selector starts with .plate, for the crops only, in page order, after the reset
    const page = [...FIXTURE.match(/<style>([\s\S]*?)<\/style>/)![1]!.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(?:^|})\s*((?:html[^{]*?\s)?\.plate(?![\w-])[^{]*)\{/g)].map(m => m[1]!.trim());
    const shipped = [...css.matchAll(/^\s*([^{}@\n]*:where\(\.hx\) \.plate[^{]*)\{/gm)].map(m => m[1]!.trim());
    expect(page.length).toBeGreaterThan(40);
    expect(shipped[0]).toBe('.ht :where(.hx) .plate');
    const reset = css.indexOf('.ht :where(.hx) .plate { all: revert; }'), base = css.indexOf('.ht :where(.hx) .plate { position: relative;');
    expect(reset).toBeGreaterThan(-1);
    expect(base).toBeGreaterThan(reset);
    for (const sel of page.filter(x => !x.includes(',') || x.split(',').every(y => /^(html[^.]*\s)?\.plate(?![\w-])/.test(y.trim())))) {
      const want = sel.split(',').map(x => x.trim().replace(/^((?:html\S*\s+)?)\.plate/, (m, h) => `${h}.ht :where(.hx) .plate`)).join(', ');
      expect(shipped, sel).toContain(want);
    }
  });
  it('failure path: a page with no .plate rule throws; a .plate rule is re-scoped for the crops, never class-mapped', () => {
    expect(() => gen.cropPlateCss('.plate-fit { x: 1 }')).toThrow(/no .plate rules/);
    expect(gen.cropPlateCss('.plate .joint { fill: red; }')).toContain('.ht :where(.hx) .plate .joint { fill: red; }');
    expect(gen.cropPlateCss('.plate .joint { fill: red; }')).not.toContain('ht-plate');
  });
  it.each(IDS)('%s: the panels set no inline custom property off the allow list', id => {
    for (const p of Object.values(chunks[id]!.panels)) expect(inlineVars(p).filter(v => !INLINE_ALLOW.includes(v))).toEqual([]);
  });
});

/** Every id attribute in `html`. */
const idsOf = (html: string) => [...html.matchAll(/\sid="([^"]*)"/g)].map(m => m[1]!);
/** HT7-A2: the duplicate ids inside each How-to and the ids shared by two How-tos. */
export function idProblems(figures: Record<string, Record<string, string>>): string[] {
  const bad: string[] = [], all: Record<string, string[]> = {};
  for (const [ex, parts] of Object.entries(figures)) {
    const seen = new Map<string, string>();
    for (const [part, html] of Object.entries(parts)) for (const i of idsOf(html)) {
      if (seen.has(i)) bad.push(`${ex}: id ${i} in ${seen.get(i)} and ${part}`);
      else seen.set(i, part);
    }
    all[ex] = [...seen.keys()];
  }
  const ks = Object.keys(all);
  for (let a = 0; a < ks.length; a++) for (let b = a + 1; b < ks.length; b++) {
    const B = new Set(all[ks[b]!]);
    for (const i of all[ks[a]!]!) if (B.has(i)) bad.push(`${ks[a]} and ${ks[b]} both hold id ${i}`);
  }
  return bad;
}
describe('HT7-A2: no duplicate id in one How-to, none between two', () => {
  const figures = async () => {
    const out: Record<string, Record<string, string>> = {};
    for (const id of IDS) {
      const base = (await import(/* @vite-ignore */ url(`src/howto/generated/ht-${ROW_OF[id]!.slug}.ts`))).default;
      const hand = (await import(/* @vite-ignore */ url(`src/howto/generated/hand-${id}.ts`))).panel;
      out[id] = { normal: base.plate.normal.svg + base.plate.normal.overlay, mistake: base.plate.mistake.svg + base.plate.mistake.overlay, hand, ...chunks[id]!.panels };
    }
    return out;
  };
  it('the normal, mistake, hand and crop figures of each How-to, and all 28 pairs of How-tos', async () => {
    const f = await figures();
    expect(Object.values(f).reduce((n, p) => n + Object.values(p).reduce((m, h) => m + idsOf(h).length, 0), 0)).toBeGreaterThan(2000);
    expect(idProblems(f)).toEqual([]);
  });
  it('the dot pattern id is held once per document (Posture.tsx), never inside a panel', () => {
    for (const id of IDS) for (const p of Object.values(chunks[id]!.panels)) expect(idsOf(p)).not.toContain('zdots');
    expect(idsOf(L.ZDOTS)).toEqual(['zdots']);
  });
  it('failure paths: a crop reusing a plate id, and a crop id held by two How-tos', async () => {
    const f = await figures(), plateId = idsOf(f['pull-up']!.normal!)[0]!;
    const dup = { ...f, 'pull-up': { ...f['pull-up']!, shoulders: f['pull-up']!.shoulders!.replace(/\sid="[^"]*"/, ` id="${plateId}"`) } };
    expect(idProblems(dup).join('\n')).toMatch(new RegExp(`pull-up: id ${plateId} in normal and shoulders`));
    const cropId = idsOf(f['leg-press']!.foot!)[0]!;
    const cross = { ...f, 'pull-up': { ...f['pull-up']!, top: f['pull-up']!.top!.replace(/\sid="[^"]*"/, ` id="${cropId}"`) } };
    expect(idProblems(cross).join('\n')).toMatch(/pull-up and leg-press both hold id|leg-press and pull-up both hold id/);
  });
});

describe('HT7-A5: each posture-<id> chunk is at most 24 KB gz and imports only its close-up CSS', () => {
  it.each(IDS)('%s', id => {
    expect(src(id).match(/^import .*$/gm)).toEqual([`import '../../slices/howto/css/zoom-${id}.css';`]);
    const s = readFileSync(`src/howto/generated/posture-${id}.ts`);
    expect(gzipSync(s, { level: 9 }).length).toBeLessThanOrEqual(24 * 1024);
  });
  it('nothing outside the zoom registry\'s loader reaches the chunks (they load on first open only)', () => {
    const hits = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? hits(join(dir, e.name))
      : /\.(ts|tsx)$/.test(e.name) && readFileSync(join(dir, e.name), 'utf8').includes('generated/posture-') ? [join(dir, e.name)] : []);
    expect(hits('src').filter(p => !p.startsWith('src/howto/generated'))).toEqual(['src/slices/howto/sections/Posture.tsx']);
    expect(readFileSync('src/slices/howto/sections/Posture.tsx', 'utf8')).toMatch(/import\.meta\.glob<PostureModule>\('\.\.\/\.\.\/\.\.\/howto\/generated\/posture-\*\.ts'\)/);
  });
});

const unesc = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const TICK = 'd="M5 12l4 4L19 7"', CROSS = 'd="M6 6l12 12M18 6L6 18"';
describe('HT7-A6: each crop half is role=img with alt.right or alt.wrong, plus a printed Right/Wrong word and icon', () => {
  it.each(IDS)('%s', id => {
    for (const z of postureZooms(id)) {
      const p = chunks[id]!.panels[z.key]!;
      const imgs = [...p.matchAll(/<(?:svg|g)\b[^>]*\srole="img"[^>]*\saria-label="([^"]*)"/g)].map(m => unesc(m[1]!));
      expect(imgs, `${id}/${z.key}`).toEqual([`Right: ${z.alt.right}`, `Wrong: ${z.alt.wrong}`]);
      expect(p).toMatch(/<b>Right<\/b>|>Right<\/text>/);
      expect(p).toMatch(/<b>Wrong<\/b>|>Wrong<\/text>/);
      expect(p).toContain(TICK);
      expect(p).toContain(CROSS);
    }
  });
});

// The dot pattern's lifetime (Posture.tsx), on a fake DOM (project convention: no jsdom). The gate checks it live.
describe('HT7-A2: the dot pattern is mounted once per document while any sheet holds it', () => {
  const fakeDom = () => {
    const body: any[] = [];
    const doc = { body: { appendChild: (n: any) => { body.push(n); n.remove = () => body.splice(body.indexOf(n), 1); } },
      createElement: () => ({ attrs: {} as Record<string, string>, style: {} as any, setAttribute(k: string, v: string) { this.attrs[k] = v; } }) };
    return { doc, body };
  };
  it('two sheets (a closing one and the next) share one node; it goes when the last lets go; loader keys and misses', async () => {
    const { doc, body } = fakeDom(), g = globalThis as any, was = g.document;
    g.document = doc;
    try {
      const P = await import('@/slices/howto/sections/Posture');
      const a = P.holdZdots();
      expect(body).toHaveLength(0);                                   // nothing until a posture chunk has loaded
      const z = await P.postureZoom('pull-up', 'shoulders');
      expect(z.panel === chunks['pull-up']!.panels.shoulders).toBe(true);
      expect(body).toHaveLength(1);
      expect(body[0].innerHTML === L.ZDOTS).toBe(true);
      expect(body[0].className).toBe('ht');
      const b = P.holdZdots();
      await P.postureZoom('lateral-raise', 'shoulders');
      expect(body).toHaveLength(1);
      a(); a();
      expect(body).toHaveLength(1);
      b();
      expect(body).toHaveLength(0);
      const c = P.holdZdots();
      expect(body).toHaveLength(1);                                   // the string is known now: mounts at once
      c();
      expect(body).toHaveLength(0);
      await expect(P.postureZoom('pull-up', 'hand')).rejects.toThrow(/no hand close-up for pull-up/);
      await expect(P.postureZoom('no-such', 'top')).rejects.toThrow(/no close-ups for no-such/);
    } finally { g.document = was; }
  });
  it('the registry\'s posture line is this loader', async () => {
    const R = await import('@/slices/howto/zoom/registry');
    expect(R.hasZoomKind('posture')).toBe(true);
    expect(readFileSync('src/slices/howto/zoom/registry.ts', 'utf8')).toContain("posture: (chromeId, key) => postureZoom(chromeId, key),");
  });
});
