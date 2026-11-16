// HT-6: the hand close-ups. HT6-A1 (each generated panel is golden B's, byte for byte, one per exercise) and
// HT6-A2 (C5: the vendored hand renderer's geometry report is ok for every exercise's hand close-up).
import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { beforeAll, describe, expect, it } from 'vitest';
import { INLINE_ALLOW, inlineVars, lint } from './css.test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const url = (p: string) => new URL(`../../${p}`, import.meta.url).href;
const FIXTURE = readFileSync(new URL('golden/howto-layers.html', import.meta.url), 'utf8');
const ROWS = JSON.parse(readFileSync('tools/plates/plates.json', 'utf8')) as Record<string, { chromeId: string }>;
const IDS = Object.values(ROWS).map(r => r.chromeId);
const SLUG_OF = Object.fromEntries(Object.entries(ROWS).map(([lib, r]) => [r.chromeId, lib.slice(4)]));
let gen: any, layers: any, hand: any;
const chunks: Record<string, { panel: string; css: string }> = {};
const cssOf = (id: string) => readFileSync(`src/slices/howto/css/zoom-${id}.css`, 'utf8');
beforeAll(async () => {
  gen = await import(/* @vite-ignore */ url('tools/plates/gen/hands.mjs'));
  layers = await import(/* @vite-ignore */ url('tools/plates/layers.mjs'));
  hand = await import(/* @vite-ignore */ url('tools/plates/layers/engine/hand.mjs'));
  for (const id of IDS) chunks[id] = { ...(await import(/* @vite-ignore */ url(`src/howto/generated/hand-${id}.ts`))), css: cssOf(id) };
});

describe('HT6-A1: every hand-<key> panel === golden B', () => {
  it('the fixture is the approved golden-B page', () => {
    expect(layers.sha256(Buffer.from(FIXTURE, 'utf8'))).toBe(layers.PAGE_SHA256);
  });
  it('each chunk imports its exercise\'s close-up CSS and nothing else', () => {
    for (const id of IDS) expect(readFileSync(`src/howto/generated/hand-${id}.ts`, 'utf8').match(/^import .*$/gm)).toEqual([`import '../../slices/howto/css/zoom-${id}.css';`]);
  });
  it('one chunk per exercise with a hand close-up, keyed by the chrome id, and no other hand chunk', () => {
    const files = readdirSync('src/howto/generated').filter(f => f.startsWith('hand-')).sort();
    expect(files).toEqual(IDS.map(id => `hand-${id}.ts`).sort());
    expect(IDS).toHaveLength(8);
  });
  it.each(IDS)('%s: panel === the page\'s hand close-up (ids, labels, pages and all)', id => {
    const golden = gen.handPanel(FIXTURE, id);
    expect(chunks[id]!.panel === golden).toBe(true);
    expect(golden.startsWith(`<div class="zx" id="${id}-zoom-hand" data-zoom="hand"`)).toBe(true);
    expect(golden.endsWith('</div>')).toBe(true);
  });
  it('the 8 panels are distinct (golden B shares none), so no key could serve two exercises', () => {
    expect(new Set(IDS.map(id => chunks[id]!.panel)).size).toBe(8);
  });
  it('the chunk writes the panel as a single-quoted literal: same value, and golden B\'s xmlns attribute reads as written (C17)', () => {
    for (const s of ['a\\b', "it's", 'x"y', 'l1\nl2\r', '\u2028\u2029', chunks[IDS[2]!]!.panel]) expect(new Function(`return ${gen.lit(s)}`)()).toBe(s);
    for (const id of IDS) {
      const text = readFileSync(`src/howto/generated/hand-${id}.ts`, 'utf8');
      expect(text).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(text).not.toContain('xmlns=\\"');
    }
  });
  it('failure path: a 1-byte change fails the compare', () => {
    const id = IDS[0]!, golden = gen.handPanel(FIXTURE, id), p = chunks[id]!.panel;
    const i = p.indexOf('Right');
    const mutated = p.slice(0, i) + 'r' + p.slice(i + 1);
    expect(mutated === golden).toBe(false);
    expect(mutated.length).toBe(golden.length);
  });
  it('failure path: a page without the close-up, or with two, throws', () => {
    expect(() => gen.handPanel(FIXTURE.replace('id="pull-up-zoom-hand"', 'id="pull-up-zoom-x"'), 'pull-up')).toThrow(/no hand close-up/);
    const one = gen.handPanel(FIXTURE, 'pull-up');
    expect(() => gen.handPanel(FIXTURE + one, 'pull-up')).toThrow(/two hand close-ups/);
  });
  it.each(IDS)('%s: css/zoom-<id>.css (imported by the chunk) is the page\'s own .hx-<id> rules, rewritten, and passes the How-to style lints', id => {
    const css = chunks[id]!.css;
    expect(lint(css)).toEqual([]);
    const sels = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)].map(m => m[1]!.trim()).filter(s => s !== '.ht');
    for (const s of sels) for (const one of s.split(',')) expect(one.trim()).toMatch(new RegExp(`^\\.ht \\.(hx-${id} |hx >|hx \\.zoom)`));
    expect(css.lastIndexOf('.ht .hx .zoom')).toBeGreaterThan(css.lastIndexOf(`.ht .hx-${id} `));   // the page's tie order
  });
  it.each(IDS)('%s: zoom-<id>.css names exactly the classes golden B\'s .hx-<id> rules name (no class is renamed)', id => {
    const classes = (css: string) => new Set([...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)].map(m => m[1]!).filter(h => h.includes(`.hx-${id} `)).flatMap(h => [...h.matchAll(/\.([\w-]+)/g)].map(m => m[1]!)));
    const golden = classes(FIXTURE.slice(FIXTURE.indexOf('<style>'), FIXTURE.indexOf('</style>'))), app = classes(chunks[id]!.css);
    app.delete('ht');
    expect([...app].sort()).toEqual([...golden].sort());
    expect(golden.has('plate') === app.has('plate')).toBe(true);
    expect(app.has('ht-plate')).toBe(false);
  });
  it.each(IDS)('%s: the panel sets no inline custom property off the allow list', id => {
    expect(inlineVars(chunks[id]!.panel).filter(v => !INLINE_ALLOW.includes(v))).toEqual([]);
  });
  it('a literal the lints ban becomes an ht token of the same value; the rule body is otherwise unchanged', () => {
    const out = gen.rewrite('.hx-a .b { font-size: 10.5px; border-radius: 6px; transition: opacity 150ms cubic-bezier(.2,0,0,1); }');
    expect(out).toContain('--ht-fs-10-5px: 10.5px;');
    expect(out).toContain('--ht-r-6px: 6px;');
    expect(out).toContain('.ht .hx-a .b { font-size: var(--ht-fs-10-5px); border-radius: var(--ht-r-6px); transition: opacity var(--ht-t-150ms) var(--ht-ease-cubic-bezier-2-0-0-1); }');
    expect(lint(out)).toEqual([]);
  });
  it('HT6-A7 budget (D-HT6-budget): the measured sizes are pinned, and each ceiling is measured + 10 %, rounded up', () => {
    expect(gen.HAND_MEASURED).toEqual({
      'lateral-raise': { raw: 26570, gz: 8134 }, 'barbell-back-squat': { raw: 34361, gz: 10629 }, 'pull-up': { raw: 84470, gz: 23896 },
      'hanging-leg-raise': { raw: 44454, gz: 11445 }, 'lat-pulldown': { raw: 68272, gz: 19574 }, 'seated-cable-row': { raw: 23824, gz: 7673 },
      'leg-press': { raw: 22227, gz: 7430 }, 'machine-chest-press': { raw: 24375, gz: 7426 },
    });
    expect(Object.keys(gen.HAND_MEASURED).sort()).toEqual([...IDS].sort());
    expect(gen.handCeiling('pull-up')).toEqual({ raw: 92917, gz: 26286 });
    expect(gen.handCeiling('leg-press')).toEqual({ raw: 24450, gz: 8173 });
    expect(() => gen.handCeiling('bench-press')).toThrow(/no budget/);
  });
});

// C5 (GA 5.1, 3.1): the right hand is inside the exercise's wrist range, the wrong one visibly outside it (or carries
// a marker that is not an angle), push hands take the handle on the heel (contactAt <= .3) against the fingers
// (>= .8), and on an along-forearm load the lever rules hold (right within LEVER.maxRightMm, wrong behind the wrist).
const merge = (a: any, b: any) => ({ ...a, ...b, wrist: { ...a.wrist, ...(b.wrist ?? {}) }, fingers: { ...a.fingers, ...(b.fingers ?? {}) }, handle: { ...a.handle, ...(b.handle ?? {}) }, load: { ...a.load, ...(b.load ?? {}) } });
const NON_ANGLE = ['slip-arrow', 'skin-ridge', 'tendon', 'load-through-wrist'];
/** Every problem of one exercise's hand close-up; [] when the report is ok. */
function c5(content: any, renderHandPair: any): { problems: string[]; pairs: number } {
  const bad: string[] = [], h = content.handling, z = content.zooms.find((q: any) => q.kind === 'hand');
  if (!z) return { problems: [`${content.id}: no hand close-up`], pairs: 0 };
  let pairs = 0;
  for (const f of z.hand.wrong) {
    if (typeof f === 'string') { bad.push(`${content.id}: fault ${f} has no pose to check`); continue; }
    const r = renderHandPair({ camera: z.hand.camera, loadAxis: h.loadAxis, markers: f.markers, right: z.hand.right, wrong: merge(z.hand.right, f.pose) }).report;
    pairs++;
    const at = `${content.id}/${f.key}`;
    if (!r.ok) bad.push(`${at}: lever checks ${JSON.stringify(r.checks)}`);
    if ('ext' in h.wrist) {
      const [lo, hi] = h.wrist.ext;
      if (r.right.ext < lo || r.right.ext > hi) bad.push(`${at}: right wrist ${r.right.ext} outside ${lo}..${hi}`);
      if (r.wrong.ext >= lo && r.wrong.ext <= hi && !f.markers.some((m: string) => NON_ANGLE.includes(m))) bad.push(`${at}: wrong wrist ${r.wrong.ext} inside ${lo}..${hi} with no non-angle marker`);
    }
    if (h.archetype === 'push') {
      if (!(r.right.contactAt <= 0.3)) bad.push(`${at}: push right contactAt ${r.right.contactAt} > .3`);
      if (!(r.wrong.contactAt >= 0.8)) bad.push(`${at}: push wrong contactAt ${r.wrong.contactAt} < .8`);
      if (!(r.wrong.leverMm > 0)) bad.push(`${at}: push wrong lever ${r.wrong.leverMm} not on the back-of-hand side`);
    }
  }
  return { problems: bad, pairs };
}
describe('HT6-A2 (C5): the hand geometry report is ok for every HandlingSpec', () => {
  const content = async (id: string) => (await import(/* @vite-ignore */ url(`tools/plates/layers/exercises/${SLUG_OF[id]}.howto.mjs`))).default;
  it.each(IDS)('%s', async id => {
    const r = c5(await content(id), hand.renderHandPair);
    expect(r.problems).toEqual([]);
    expect(r.pairs).toBeGreaterThan(0);
  });
  it('failure path: a right pose outside its wrist range fails', async () => {
    const c = await content('machine-chest-press'), z = c.zooms.find((q: any) => q.kind === 'hand');
    const bad = { ...c, zooms: [{ ...z, hand: { ...z.hand, right: merge(z.hand.right, { wrist: { ext: 25 } }) } }] };
    expect(c5(bad, hand.renderHandPair).problems.join('\n')).toMatch(/right wrist 25 outside 0..10/);
  });
  it('failure path: a wrong pose inside the range with only an angle marker fails', async () => {
    const c = await content('lateral-raise'), z = c.zooms.find((q: any) => q.kind === 'hand'), f = z.hand.wrong[0];
    const bad = { ...c, zooms: [{ ...z, hand: { ...z.hand, wrong: [{ ...f, markers: ['lever-arc'], pose: { ...f.pose, wrist: { ext: 5 } } }] } }] };
    expect(c5(bad, hand.renderHandPair).problems.join('\n')).toMatch(/wrong wrist 5 inside -10..10/);
  });
  it('failure path: a push hand on the fingers (contactAt 1.0) fails the heel rule and the lever rule', async () => {
    const c = await content('machine-chest-press'), z = c.zooms.find((q: any) => q.kind === 'hand');
    const bad = { ...c, zooms: [{ ...z, hand: { ...z.hand, right: { ...z.hand.right, contactAt: 1.0, wrist: { ext: 8 } } } }] };
    const p = c5(bad, hand.renderHandPair).problems.join('\n');
    expect(p).toMatch(/push right contactAt 1 > .3/);
  });
});
