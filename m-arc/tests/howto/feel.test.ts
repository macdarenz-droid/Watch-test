// HT-8: "Where you should feel it". A1: every shipped state === golden B's vendored renderFeelMap / renderFeelLegend
// output, feel.css = FEEL_CSS through the tested rewrite (one test per feel rule). A2: golden B's feel behaviour list on
// a fake DOM (project convention: no jsdom). A3: text-only ids, feel-main contrast, C12 from the constants. A5: text
// names and row buttons. A6: chunk size. Gate block HT-8 proves the pixels, the animation list and the tripwire.
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEMES, THEME_IDS } from '@/theme/themes';
import { createFeelController } from '@/slices/howto/feel/useFeelMap';

const FEEL_EVENTS = { row: 'ht:feel-row', chip: 'ht:feel-chip' } as const;   // events.ts (HT-6), the supervisor's contract
import { lint } from './css.test';

/* eslint-disable @typescript-eslint/no-explicit-any */
const LAYERS = 'tools/plates/layers';
const url = (p: string) => new URL(`../../${p}`, import.meta.url).href;
let gen: any, core: any, fm: any, raw: any, rendered: { sections: { id: string; slug: string; pre: string; section: string }[]; css: string; fm: any };
const specs = new Map<string, any>();
const rows = JSON.parse(readFileSync('tools/plates/plates.json', 'utf8')) as Record<string, { slug: string; chromeId: string }>;
const shipped = (chromeId: string) => import(/* @vite-ignore */ url(`src/howto/generated/feel-${chromeId}.ts`)).then(m => m.default as { id: string; pre: string; section: string });
const specId = (id: string) => id.replace(/^lib_/, '');

beforeAll(async () => {
  gen = await import(/* @vite-ignore */ url('tools/plates/gen/feel.mjs'));
  core = await import(/* @vite-ignore */ url('tools/plates/lib/inputs.mjs'));
  raw = await import(/* @vite-ignore */ url(`${LAYERS}/engine/feelmap.mjs`));
  for (const id of Object.keys(rows)) specs.set(id, (await import(/* @vite-ignore */ url(`${LAYERS}/exercises/${specId(id)}.howto.mjs`))).default);
  rendered = await gen.renderAll();
  fm = rendered.fm;   // golden B's engine instance (the page-wide REGION_FIX applied), as the page renders with it
}, 120_000);

/** golden B's row states, from the vendored spec: the watch muscles and pain parts each row marks. */
const rowStates = (F: any) => F.rows.map((r: any) => ({
  key: r.key,
  watch: (r.at?.muscles ?? []).filter((m: string) => F.watch.some((w: any) => w.muscleId === m) && !F.primary.some((p: any) => p.muscleId === m)),
  pain: r.at?.parts ?? [],
}));
const MAP_RE = /<div class="feel-map[^"]*"[^>]*data-feel-map[\s\S]*?<\/figure><\/div>/;

describe('HT8-A1: every state is golden B\'s vendored output, byte for byte', () => {
  it('the 8 shipped sections === the sections golden B renders now (feelSection from the mirror)', async () => {
    expect(rendered.sections).toHaveLength(8);
    for (const s of rendered.sections) {
      const m = await shipped(s.pre);
      expect(m.id).toBe(s.id);
      expect(m.section === s.section, s.id).toBe(true);
    }
  });
  it('rest: the map is renderFeelMap(rest).html, with only golden B\'s splice (id, rest label, each row\'s marks before </svg>)', async () => {
    for (const [id, row] of Object.entries(rows)) {
      const F = specs.get(id).feel, pre = row.chromeId, { section } = await shipped(row.chromeId);
      const rest = fm.renderFeelMap({ primary: F.primary, secondary: F.secondary, views: ['front', 'back'], id: `${pre}-feel`, shimmer: true });
      const marks: string[][] = [[], []];
      for (const r of rowStates(F)) {
        if (!r.watch.length && !r.pain.length) continue;
        const m = fm.renderFeelMap({ primary: F.primary, secondary: F.secondary, avoid: r.watch, pain: r.pain, views: ['front', 'back'], id: `${pre}-feel-${r.key}`, shimmer: false });
        m.svg.split('</figure>').slice(0, 2).forEach((v: string, vi: number) => {
          const w = v.match(/<g class="feel-watch">[\s\S]*?<\/g>/)?.[0] ?? '', p = v.match(/<g class="feel-pain">[\s\S]*?<\/g>/)?.[0] ?? '';
          if (w || p) marks[vi]!.push(`<g class="feel-mark" data-row="${r.key}">${w.replace('class="feel-watch"', 'class="feel-quiet"')}${p}${w}</g>`);
        });
      }
      let k = 0;
      const expected = rest.html.replace(/<\/svg>/g, (x: string) => `${marks[k++]?.join('') ?? ''}${x}`)
        .replace('data-feel-map>', `data-feel-map id="${pre}-feel-map" data-rest-label="${rest.label}">`);
      expect(section.match(MAP_RE)![0] === expected, id).toBe(true);
      expect(rest.html).toContain('<rect class="feel-band"');
      expect(section.match(/role="img"/g), id).toHaveLength(1);
    }
  });
  it('each row open: its mark holds the watch and pain groups of renderFeelMap({ avoid, pain }) for that row, per view', async () => {
    let marks = 0;
    for (const [id, row] of Object.entries(rows)) {
      const F = specs.get(id).feel, pre = row.chromeId, { section } = await shipped(row.chromeId);
      for (const r of rowStates(F)) {
        const has = section.includes(`<g class="feel-mark" data-row="${r.key}">`);
        if (!r.watch.length && !r.pain.length) { expect(has, `${id} ${r.key}`).toBe(false); continue; }
        const m = fm.renderFeelMap({ primary: F.primary, secondary: F.secondary, avoid: r.watch, pain: r.pain, views: ['front', 'back'], id: `${pre}-feel-${r.key}`, shimmer: false });
        m.svg.split('</figure>').slice(0, 2).forEach((v: string) => {
          const w = v.match(/<g class="feel-watch">[\s\S]*?<\/g>/)?.[0] ?? '', p = v.match(/<g class="feel-pain">[\s\S]*?<\/g>/)?.[0] ?? '';
          if (w || p) { marks++; expect(section, `${id} ${r.key}`).toContain(`<g class="feel-mark" data-row="${r.key}">${w.replace('class="feel-watch"', 'class="feel-quiet"')}${p}${w}</g>`); }
        });
        expect(section, `${id} ${r.key}`).toContain(`data-label="${m.label}`);
      }
    }
    expect(marks).toBeGreaterThan(8);
  });
  it('the legend is renderFeelLegend({ avoid: true }) with golden B\'s two edits (watch and pain entries hidden until a row opens)', async () => {
    const lg = fm.renderFeelLegend({ avoid: true }).replace(/<span>(<svg class="feel-sw sw-watch)/, '<span class="lg-watch" hidden>$1');
    for (const row of Object.values(rows)) expect((await shipped(row.chromeId)).section).toContain(lg.replace(/<\/div>$/, ''));
  });
  it('playing and reduced motion are the same markup: no is-playing / is-focus in any shipped string (the script and CSS set them)', async () => {
    for (const row of Object.values(rows)) expect((await shipped(row.chromeId)).section).not.toMatch(/is-playing|is-focus|feel-mark on/);
  });
  it('a 1-byte change to a shipped state fails the === check (failure path)', async () => {
    const s = rendered.sections[0]!, m = await shipped(s.pre);
    const bad = m.section.replace('stop-opacity="0.62"', 'stop-opacity="0.63"');
    expect(bad).not.toBe(m.section);
    expect(bad === s.section).toBe(false);
  });
  it('BAND_INSET changed in feelmap.mjs: the rendered band differs and every feel file\'s inputsSha256 goes stale (failure path)', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ht8-inset-'));
    try {
      cpSync(LAYERS, join(tmp, LAYERS), { recursive: true });
      for (const p of core.coreFiles().concat(['tools/plates/gen/feel.mjs', 'tools/plates/layers.mjs', 'tools/plates/css.mjs', 'tools/plates/plates.json'])) cpSync(p, join(tmp, p));
      const f = join(tmp, LAYERS, 'engine/feelmap.mjs'), src = readFileSync(f, 'utf8');
      expect(src).toContain('export const BAND_INSET = 0.15;');
      writeFileSync(f, src.replace('export const BAND_INSET = 0.15;', 'export const BAND_INSET = 0.16;'));
      const bent = await import(/* @vite-ignore */ `${new URL(`file://${f}`).href}?inset`);
      const F = specs.get('lib_pull_up').feel;
      const a = raw.renderFeelMap({ primary: F.primary, secondary: F.secondary, id: 'x' }).html, b = bent.renderFeelMap({ primary: F.primary, secondary: F.secondary, id: 'x' }).html;
      expect(a).not.toBe(b);
      const writers = ['tools/plates/gen/feel.mjs'], inputs = gen.inputs();
      expect(inputs).toContain(`${LAYERS}/engine/feelmap.mjs`);
      for (const s of rendered.sections) {
        const h = core.parseHeader(readFileSync(`src/howto/generated/feel-${s.pre}.ts`, 'utf8'));
        expect(h.writers).toEqual(writers);
        expect(core.inputsSha256(writers, inputs)).toBe(h.hash);
        expect(core.inputsSha256(writers, inputs, tmp)).not.toBe(h.hash);
      }
    } finally { rmSync(tmp, { recursive: true, force: true }); }
  });
});

describe('HT8-A1: feel.css is FEEL_CSS (+ the page rules the section uses) through the tested rewrite', () => {
  it('the generated feel.css is exactly the rewrite of the vendored CSS, header aside', () => {
    const t = readFileSync(gen.CSS_OUT, 'utf8');
    expect(t.slice(t.indexOf('\n') + 1)).toBe(rendered.css);
    expect(lint(t)).toEqual([]);
  });
  it('rule A, selection: a page rule survives only for classes the feel markup uses and no other card owns; a keyframes only when a kept rule names it', () => {
    const used = new Set(['fr-btn', 'feel', 'fr-show', 'hw-sec']);
    expect(gen.selectRules('.hw-sec .fr-btn { z: 0; } .fr-btn svg { a: 1; } .fr-show, .st-show { b: 2; } .feel, .srcs > summary { c: 3; } h4 { d: 4; } @media (x) { .fr-btn { e: 5; } .srcs { f: 6; } } @keyframes fr-in { from { opacity: 0; } } @keyframes zz { to { opacity: 1; } } .fr-btn { animation: fr-in 1s; }', used))
      .toBe('.fr-btn svg { a: 1; }\n.feel { c: 3; }\n@media (x) { .fr-btn { e: 5; } }\n.fr-btn { animation: fr-in 1s; }\n@keyframes fr-in { from { opacity: 0; } }');
  });
  it('rule B, theme blocks: the five equal --feel-main lines become one --ht-feel-main; a differing theme or a missing one throws', () => {
    const ids = ['a', 'b'], line = (t: string, v: string) => `[data-theme="${t}"]{--feel-main:${v}}\n`;
    expect(gen.themeBlocks(`x\n${line('a', 'V')}${line('b', 'V')}.y{}`, ids)).toEqual({ css: 'x\n.y{}', tokens: { '--ht-feel-main': 'V' } });
    expect(() => gen.themeBlocks(`${line('a', 'V')}${line('b', 'W')}`, ids)).toThrow(/differs per theme/);
    expect(() => gen.themeBlocks(line('a', 'V'), ids)).toThrow(/theme blocks/);
  });
  it('rule C, names and literal fallbacks: each rename is applied with its identical-value token; a missing pattern throws', () => {
    const src = '.a{fill:var(--feel-main);height:var(--feel-map-h, 280px)}.f{--feel-map-h: 236px}.b{animation:feel-sweep 5200ms linear var(--feel-delay, 0ms) 1 both}.c{animation:m var(--dur-base, 200ms)}';
    expect(gen.renames(src, 5200)).toEqual({
      css: '.a{fill:var(--ht-feel-main);height:var(--ht-feel-map-h)}.f{--ht-feel-map-h: 236px}.b{animation:feel-sweep var(--ht-feel-sweep) linear var(--feel-delay, var(--ht-feel-delay-0)) 1 both}.c{animation:m var(--dur-base, var(--ht-feel-mark-dur))}',
      tokens: { '--ht-feel-map-h': '280px', '--ht-feel-delay-0': '0ms', '--ht-feel-mark-dur': '200ms', '--ht-feel-sweep': '5200ms' },
    });
    expect(() => gen.renames(src.replace('280px', '281px'), 5200)).toThrow(/not found/);
  });
  it('rule D, keyframes with a literal timing function are lifted verbatim into the ht-tokens block', () => {
    expect(gen.liftKeyframes('.a{}\n@keyframes feel-sweep {\n  0% { x: 1; animation-timing-function: cubic-bezier(1,0,0,1); }\n}\n.b{}', 'feel-sweep'))
      .toEqual({ css: '.a{}\n.b{}', keyframes: '@keyframes feel-sweep { 0% { x: 1; animation-timing-function: cubic-bezier(1,0,0,1); } }' });
    expect(() => gen.liftKeyframes('.a{}', 'feel-sweep')).toThrow(/not found/);
    const css = readFileSync(gen.CSS_OUT, 'utf8'), a = css.indexOf('/* ht-tokens:start */'), b = css.indexOf('/* ht-tokens:end */');
    expect(css.slice(a, b)).toContain('@keyframes feel-sweep { 0% { transform: translateY(var(--feel-from)); animation-timing-function: cubic-bezier(.45,0,.55,1); }');
  });
  it('every FEEL_CSS declaration survives with only .ht, the class-free renames and the ht tokens; the band runs once (no infinite)', () => {
    const css = readFileSync(gen.CSS_OUT, 'utf8');
    for (const d of ['stroke-dasharray: .9 .6', 'stroke-width: .22', 'stop-color: color-mix(in srgb, var(--ht-feel-main) 45%, var(--text))', 'fill: color-mix(in srgb, var(--accent) 45%, var(--map-body))'])
      expect(css).toContain(d);
    expect(css).toContain('.ht .feel-map.is-playing .feel-band { animation: feel-sweep var(--ht-feel-sweep) linear var(--feel-delay, var(--ht-feel-delay-0)) 1 both; }');
    expect(css).toContain('html[data-motion="reduce"] .ht .feel-band { display: none; }');
    expect(css).not.toMatch(/\binfinite\b/);
    expect(lint(css.replace(' 1 both; }', ' infinite both; }'))).toContain('infinite: animation: feel-sweep var(--ht-feel-sweep) linear var(--feel-delay, var(--ht-feel-delay-0)) infinite both');
  });
});

// ---- fake DOM: just what the feel controller touches ----
type Fn = (e?: any) => void;
const ALL: El[] = [];
class El {
  attrs = new Map<string, string>(); cls = new Set<string>(); listeners: Record<string, Fn[]> = {}; dataset: Record<string, string> = {};
  style: Record<string, string> = {}; hidden = false; textContent = ''; q: Record<string, El[]> = {}; focused = 0; scrolled: any[] = []; sent: any[] = [];
  parentFr: El | null = null;
  constructor(cls = '') { cls.split(' ').filter(Boolean).forEach(c => this.cls.add(c)); ALL.push(this); }
  classList = { add: (c: string) => this.cls.add(c), remove: (c: string) => this.cls.delete(c), contains: (c: string) => this.cls.has(c), toggle: (c: string, on: boolean) => { if (on) this.cls.add(c); else this.cls.delete(c); } };
  setAttribute(k: string, v: string) { this.attrs.set(k, v); }
  getAttribute(k: string) { return this.attrs.get(k) ?? null; }
  hasAttribute(k: string) { return this.attrs.has(k); }
  querySelectorAll(s: string) { return this.q[s] ?? []; }
  querySelector(s: string) { return this.q[s]?.[0] ?? null; }
  addEventListener(t: string, f: Fn) { (this.listeners[t] ??= []).push(f); }
  removeEventListener(t: string, f: Fn) { this.listeners[t] = (this.listeners[t] ?? []).filter(x => x !== f); }
  dispatchEvent(e: any) { this.sent.push(e); return true; }
  getBoundingClientRect() { return {}; }
  focus() { this.focused++; }
  scrollIntoView(o: any) { this.scrolled.push(o); }
  closest() { return this.parentFr; }
  fire(t: string, e?: any) { for (const f of [...(this.listeners[t] ?? [])]) f(e); }
  count() { return Object.values(this.listeners).reduce((n, l) => n + l.length, 0); }
}
const ios: { cb: (e: any[]) => void; opts: any; observed: number; disconnected: number }[] = [];
let motion: string | null = null;
beforeEach(() => {
  motion = null; ios.length = 0; ALL.length = 0;
  vi.useFakeTimers();
  vi.stubGlobal('document', { documentElement: { getAttribute: (k: string) => (k === 'data-motion' ? motion : null) } });
  const IO = class { rec: any; constructor(cb: any, opts: any) { this.rec = { cb, opts, observed: 0, disconnected: 0 }; ios.push(this.rec); } observe() { this.rec.observed++; } disconnect() { this.rec.disconnected++; } };
  vi.stubGlobal('IntersectionObserver', IO);
  vi.stubGlobal('window', { IntersectionObserver: IO });
  vi.stubGlobal('CustomEvent', class { constructor(public type: string, public init: any) {} });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function fakeFeel() {
  const card = new El('ht'), feel = new El('hw-sec feel'), map = new El('feel-map'), h4 = new El('eyebrow');
  map.dataset = { restLabel: 'REST' };
  const bands = [new El('feel-band'), new El('feel-band')];
  const marks = [new El('feel-mark'), new El('feel-mark'), new El('feel-mark')];
  marks[0]!.dataset = { row: 'traps' }; marks[1]!.dataset = { row: 'traps' }; marks[2]!.dataset = { row: 'elbow' };
  const views = [new El('feel-view'), new El('feel-view')], svgs = [new El('feel-svg'), new El('feel-svg')];
  map.q = { '.feel-band': bands, '.feel-mark': marks, '.feel-view': views, figure: views, svg: svgs, '.feel-svg': svgs, path: [] };
  const mkRow = (key: string, attrs: string[]) => {
    const r = new El('fr'), b = new El('fr-btn'), body = new El('fr-body');
    r.dataset = { row: key }; b.dataset = { label: `LABEL ${key}` }; body.hidden = true; b.parentFr = r;
    attrs.forEach(a => b.setAttribute(a, '')); b.setAttribute('aria-expanded', 'false');
    r.q = { '.fr-btn': [b], '.fr-body': [body] };
    return { r, b, body };
  };
  const rs = [mkRow('traps', ['data-watch']), mkRow('pinch', []), mkRow('elbow', ['data-pain'])];
  const lgW = new El('lg-watch'), lgP = new El('lg-pain'); lgW.hidden = true; lgP.hidden = true;
  const show = new El('fr-show'); show.dataset = { zoom: 'shoulders' };
  const flag = new El('rf-link'); flag.setAttribute('aria-controls', 'pull-up-redflag-elbow');
  const target = new El('redflag');
  feel.q = { '[data-feel-map]': [map], h4: [h4], '.fr': rs.map(x => x.r), '.fr-more': [], '.lg-watch': [lgW], '.lg-pain': [lgP], '.fr-show': [show], '.rf-link': [flag] };
  for (const x of rs) feel.q[`.fr[data-row="${x.r.dataset.row}"] .fr-btn`] = [x.b];
  card.q = { '#pull-up-redflag-elbow': [target] };
  return { card, feel, map, h4, bands, marks, rs, lgW, lgP, show, flag, target };
}
const make = () => { const f = fakeFeel(); const c = createFeelController(f.card as any, f.feel as any); return { ...f, c }; };
const inView = (ratio: number) => ios[0]!.cb([{ intersectionRatio: ratio }]);
const visible = (on: boolean) => ios[1]!.cb([{ isIntersecting: on }]);

describe('HT8-A2: golden B\'s feel behaviour list, and nothing more', () => {
  it('when play starts: 50 % in view for 300 ms plays once (is-playing), then the observer disconnects', () => {
    const f = make();
    expect(ios.map(i => i.opts)).toEqual([{ threshold: [0, 0.5] }, { threshold: 0 }]);
    inView(0.6); vi.advanceTimersByTime(299);
    expect(f.map.cls.has('is-playing')).toBe(false);
    vi.advanceTimersByTime(1);
    expect(f.map.cls.has('is-playing')).toBe(true);
    expect(ios[0]!.disconnected).toBe(1);
  });
  it('falling under 50 % before 300 ms cancels; after a play, the observer never plays again', () => {
    const f = make();
    inView(0.6); vi.advanceTimersByTime(200); inView(0.2); vi.advanceTimersByTime(500);
    expect(f.map.cls.has('is-playing')).toBe(false);
    f.map.fire('click');
    f.map.fire('animationend', { animationName: 'feel-sweep' });
    inView(0.9); vi.advanceTimersByTime(400);
    expect(f.map.cls.has('is-playing')).toBe(false);
  });
  it('replay on tap; animationend of feel-sweep (only) ends it', () => {
    const f = make();
    f.map.fire('click');
    expect(f.map.cls.has('is-playing')).toBe(true);
    f.map.fire('animationend', { animationName: 'feel-mark-in' });
    expect(f.map.cls.has('is-playing')).toBe(true);
    f.map.fire('animationend', { animationName: 'feel-sweep' });
    expect(f.map.cls.has('is-playing')).toBe(false);
    f.map.fire('click');
    expect(f.map.cls.has('is-playing')).toBe(true);
  });
  it('S6: a row with a watch mark opens: its marks on, is-focus, play stopped, the watch legend shown, its label; a tap then does not play', () => {
    const f = make();
    f.map.fire('click');
    f.rs[0]!.b.fire('click');
    expect(f.marks.map(m => m.cls.has('on'))).toEqual([true, true, false]);
    expect([f.map.cls.has('is-focus'), f.map.cls.has('is-playing'), f.lgW.hidden, f.lgP.hidden]).toEqual([true, false, false, true]);
    expect(f.map.getAttribute('aria-label')).toBe('LABEL traps');
    expect([f.rs[0]!.b.getAttribute('aria-expanded'), f.rs[0]!.body.hidden, f.rs[1]!.b.getAttribute('aria-expanded')]).toEqual(['true', false, 'false']);
    f.map.fire('click');
    expect(f.map.cls.has('is-playing')).toBe(false);
  });
  it('a row toggles closed (rest label back); a row with no mark keeps the map unfocused; a pain row shows the pain legend', () => {
    const f = make();
    f.rs[0]!.b.fire('click'); f.rs[0]!.b.fire('click');
    expect([f.map.cls.has('is-focus'), f.map.getAttribute('aria-label'), f.rs[0]!.body.hidden]).toEqual([false, 'REST', true]);
    f.rs[1]!.b.fire('click');
    expect([f.map.cls.has('is-focus'), f.map.getAttribute('aria-label'), f.lgW.hidden, f.lgP.hidden]).toEqual([false, 'LABEL pinch', true, true]);
    f.rs[2]!.b.fire('click');
    expect([f.map.cls.has('is-focus'), f.lgW.hidden, f.lgP.hidden, f.marks[2]!.cls.has('on')]).toEqual([true, true, false, true]);
  });
  it('out of view: a running sweep is paused inline on both bands; back in view it resumes', () => {
    const f = make();
    f.map.fire('click');
    visible(false);
    expect(f.bands.map(b => b.style.animationPlayState)).toEqual(['paused', 'paused']);
    visible(true);
    expect(f.bands.map(b => b.style.animationPlayState)).toEqual(['', '']);
  });
  it('reduced motion: no play, by timer or by tap', () => {
    motion = 'reduce';
    const f = make();
    inView(1); vi.advanceTimersByTime(400); f.map.fire('click');
    expect(f.map.cls.has('is-playing')).toBe(false);
  });
  it('the Feel chip event: scroll to the section, focus its heading, play after 450 ms (0 ms under reduced motion)', () => {
    const f = make();
    f.card.fire(FEEL_EVENTS.chip, { detail: {} });
    expect([f.feel.scrolled[0], f.h4.focused]).toEqual([{ block: 'start', behavior: 'smooth' }, 1]);
    vi.advanceTimersByTime(449); expect(f.map.cls.has('is-playing')).toBe(false);
    vi.advanceTimersByTime(1); expect(f.map.cls.has('is-playing')).toBe(true);
  });
  it('a close-up\'s "This is usually why" event opens (never toggles) the row, focuses it and centres it', () => {
    const f = make();
    f.card.fire(FEEL_EVENTS.row, { detail: { row: 'traps' } });
    f.card.fire(FEEL_EVENTS.row, { detail: { row: 'traps' } });
    expect([f.rs[0]!.b.getAttribute('aria-expanded'), f.rs[0]!.b.focused, f.rs[0]!.r.scrolled[1]]).toEqual(['true', 2, { block: 'center', behavior: 'smooth' }]);
  });
  it('"Show me the …" is left to HT-6\'s delegated handler (no listener here); "When to get it checked" focuses the red-flag block', () => {
    const f = make();
    expect(f.show.count()).toBe(0);
    f.flag.fire('click');
    expect([f.target.scrolled[0], f.target.focused]).toEqual([{ block: 'center', behavior: 'smooth' }, 1]);
  });
  it('the list is complete: exactly these listeners and two observers; destroy() removes them all', () => {
    const f = make();
    const listeners = (e: El) => Object.entries(e.listeners).filter(([, l]) => l.length).map(([t, l]) => `${t}x${l.length}`).sort();
    expect(listeners(f.map)).toEqual(['animationendx1', 'clickx1']);
    expect(listeners(f.card)).toEqual([`${FEEL_EVENTS.chip}x1`, `${FEEL_EVENTS.row}x1`]);
    expect(f.rs.map(r => listeners(r.b))).toEqual([['clickx1'], ['clickx1'], ['clickx1']]);
    expect([listeners(f.show), listeners(f.flag), listeners(f.feel), listeners(f.h4)]).toEqual([[], ['clickx1'], [], []]);
    expect(ios.map(i => i.observed)).toEqual([1, 1]);
    expect(ALL.reduce((n, e) => n + e.count(), 0)).toBe(8);   // nothing else, anywhere (a per-view listener fails)
    f.c.destroy();
    expect(ALL.reduce((n, e) => n + e.count(), 0)).toBe(0);
    expect([f.map, f.card, f.flag, ...f.rs.map(r => r.b)].map(e => e.count())).toEqual([0, 0, 0, 0, 0, 0]);
    expect(ios.map(i => i.disconnected)).toEqual([1, 1]);
  });
  it('every string literal of golden B\'s feel script occurs in the port', () => {
    const page = readFileSync(`${LAYERS}/artifact/build-page.mjs`, 'utf8');
    const js = page.slice(page.indexOf('// ---- where you should feel it (S4-S6) ----'), page.indexOf('// "Show me" from a row or a setup step'));
    const port = readFileSync('src/slices/howto/feel/useFeelMap.ts', 'utf8');
    const lits = [...js.matchAll(/'([^'\n]*)'/g)].map(m => m[1]!).filter(Boolean);
    expect(lits.length).toBeGreaterThan(25);
    expect(lits.filter(l => !port.includes(`'${l}'`))).toEqual(['.zx-chip[data-feel]']);   // HT-6's chip; it arrives as ht:feel-chip
    for (const expr of ['e!.intersectionRatio >= 0.5', 'setTimeout(play, reduced() ? 0 : 450)', "animationPlayState = e!.isIntersecting ? '' : 'paused'", 'k === openRowKey && !force ? null : k']) expect(port).toContain(expr);
  });
  it('one role=img per map with golden B\'s rest label, the views and paths aria-hidden (a per-view role fails)', async () => {
    for (const [id, row] of Object.entries(rows)) {
      const { section } = await shipped(row.chromeId);
      const map = section.match(MAP_RE)![0];
      expect(map.match(/role="/g), id).toHaveLength(1);
      expect(map.match(/<svg class="feel-svg"[^>]*>/g)!.every(s => s.includes('aria-hidden="true"')), id).toBe(true);
      expect(map.match(/<svg class="feel-svg"/g), id).toHaveLength(2);
      const perView = map.replace('<svg class="feel-svg"', '<svg class="feel-svg" role="img"');
      expect(perView.match(/role="/g)).toHaveLength(2);
    }
  });
});

/** Channel mix in sRGB (color-mix in srgb) and WCAG contrast, from themes.ts values. */
const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = (c: number[]) => { const l = c.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * l[0]! + 0.7152 * l[1]! + 0.0722 * l[2]!; };
const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

/** C12 constants, read from the vendored engine (never typed here). */
export function c12(src = readFileSync(`${LAYERS}/engine/feelmap.mjs`, 'utf8')) {
  const m = src.match(/const SWEEP = (\d+), GAP = (\d+), DELAY = (\d+), TOTAL = SWEEP \* 2 \+ GAP;/)!;
  const [SWEEP, GAP, DELAY] = [+m[1]!, +m[2]!, +m[3]!];
  return { SWEEP, GAP, DELAY, TOTAL: SWEEP * 2 + GAP, END: DELAY + SWEEP * 2 + GAP };
}

describe('HT8-A3: text-only ids, feel-main contrast, C12', () => {
  it('core, brachialis and rotator_cuff are never drawn; the ones a spec names are in its plain-word note instead', async () => {
    let seen = 0;
    for (const [id, row] of Object.entries(rows)) {
      const F = specs.get(id).feel, { section } = await shipped(row.chromeId);
      const all = [...F.primary, ...F.secondary, ...F.watch].map((m: any) => m.muscleId);
      const r = fm.renderFeelMap({ primary: F.primary, secondary: F.secondary, avoid: F.watch.map((w: any) => w.muscleId).filter((m: string) => !F.primary.some((p: any) => p.muscleId === m)) });
      for (const t of ['core', 'brachialis', 'rotator_cuff']) {
        expect([...r.drawn.primary, ...r.drawn.secondary, ...r.drawn.avoid], `${id} ${t}`).not.toContain(t);
        if (all.includes(t)) { seen++; expect(r.textOnly, id).toContain(t); }
      }
      for (const m of F.textOnly ?? []) { seen++; expect(section, id).toContain(`<p class="feel-note">`); expect(section.replace(/&#39;/g, "'").replace(/&amp;/g, '&'), id).toContain(m.plain); }
    }
    expect(seen).toBeGreaterThan(0);
  });
  it('the feel main colour against --map-body is >= 3:1 in every theme (themes.ts values, the mix read from feel.css)', () => {
    const css = readFileSync(gen.CSS_OUT, 'utf8');
    const pa = +css.match(/--ht-feel-main: color-mix\(in srgb, var\(--accent\) (\d+)%, var\(--text\)\)/)![1]! / 100;
    expect(THEME_IDS).toHaveLength(5);
    for (const t of THEME_IDS) {
      const k = THEMES[t].tokens, main = rgb(k.accent).map((v, i) => v * pa + rgb(k.text)[i]! * (1 - pa));
      expect(ratio(main, rgb(k.mapBody)), t).toBeGreaterThanOrEqual(3);
    }
  });
  it('C12: the end time from SWEEP, GAP and DELAY is <= 5.5 s, and feel.css runs exactly TOTAL with the keyframe stops at SWEEP and SWEEP + GAP', () => {
    const { SWEEP, GAP, TOTAL, END } = c12();
    expect(END).toBeLessThanOrEqual(5500);
    const css = readFileSync(gen.CSS_OUT, 'utf8');
    expect(css).toContain(`--ht-feel-sweep: ${TOTAL}ms;`);
    expect(css).toContain(`${(SWEEP / TOTAL * 100).toFixed(3)}% { transform: translateY(var(--feel-to)); animation-timing-function: step-end; }`);
    expect(css).toContain(`${((SWEEP + GAP) / TOTAL * 100).toFixed(3)}% { transform: translateY(var(--feel-from));`);
    expect(readFileSync('tools/plates/layers/artifact/build-page.mjs', 'utf8')).toContain('setTimeout(() => { io.disconnect(); if (!played) play(); }, 300)');
  });
  it('C12 failure path: a longer sweep in the engine source (SWEEP 2700) ends after 5.5 s', () => {
    const src = readFileSync(`${LAYERS}/engine/feelmap.mjs`, 'utf8').replace('const SWEEP = 2400,', 'const SWEEP = 2700,');
    expect(c12(src).END).toBe(6100);
    expect(c12(src).END).toBeGreaterThan(5500);
  });
});

describe('HT8-A5: named in text; rows are buttons with aria-expanded', () => {
  it('every drawn main and helper muscle is named in the map\'s spoken label; a text-only one in the plain-word note', async () => {
    const unnamed: string[] = [];
    for (const [id, row] of Object.entries(rows)) {
      const F = specs.get(id).feel, { section } = await shipped(row.chromeId);
      const label = section.match(/data-rest-label="([^"]*)"/)![1]!.toLowerCase();
      for (const m of [...F.primary, ...F.secondary]) {
        const r = fm.renderFeelMap({ primary: [m] });
        if (r.textOnly.length) { if (!section.includes('class="feel-note"')) unnamed.push(`${id}:${m.muscleId}`); continue; }
        expect(label, `${id} ${m.muscleId}`).toContain(r.label.replace('Where you should feel it. Main: ', '').replace(/\.$/, '').toLowerCase());
      }
    }
    // golden B's own gap, reported for a golden-B update (PR #111): the brachialis helper (lat pulldown, seated cable row) is text only
    // and golden B shows no note for it. Pinned exactly, so the list can neither grow nor silently disappear.
    expect(unnamed).toEqual(GOLDEN_B_UNNAMED);
  });
  it('each row is a <button type="button" class="fr-btn" aria-expanded="false" aria-controls=…> over a hidden body', async () => {
    for (const [id, row] of Object.entries(rows)) {
      const F = specs.get(id).feel, { section } = await shipped(row.chromeId);
      for (const r of F.rows) expect(section, `${id} ${r.key}`).toMatch(new RegExp(`<button type="button" class="fr-btn" id="${row.chromeId}-row-${r.key}" aria-expanded="false" aria-controls="${row.chromeId}-row-${r.key}-body"[^>]*>[\\s\\S]*?<div class="fr-body" id="${row.chromeId}-row-${r.key}-body" hidden>`));
    }
  });
});

/** Text-only helpers golden B names nowhere (no note, left out of the spoken label); reported on PR #111. */
export const GOLDEN_B_UNNAMED = ['lib_lat_pulldown:brachialis', 'lib_seated_cable_row:brachialis'];

/** HT8-A6: measured 8,190-8,420 B gz per module (2026-10-01); ceiling 8,930 = an earlier max measured + 10 %, still above 8,420. */
export const FEEL_MODULE_GZ = 8_930;
describe('HT8-A6: chunk size', () => {
  it(`each feel-<chromeId> module is <= ${FEEL_MODULE_GZ} B gz (the plan's 24 KB start, lowered to measured + 10 %)`, () => {
    const files = readdirSync('src/howto/generated').filter(f => /^feel-.*\.ts$/.test(f));
    expect(files).toHaveLength(8);
    for (const f of files) expect(gzipSync(readFileSync(`src/howto/generated/${f}`)).length, f).toBeLessThanOrEqual(FEEL_MODULE_GZ);
    expect(FEEL_MODULE_GZ).toBeLessThanOrEqual(24 * 1024);
  });
});

describe('HT-8 fix (#166, "Feel it" before mount): the preload observer watches the sheet panel', () => {
  it('whenNear observes with the sheet panel as root and one panel height of margin, and fires only after two frames', async () => {
    const { whenNear } = await import('@/slices/howto/sections/Feel');
    const frames: (() => void)[] = [];
    vi.stubGlobal('requestAnimationFrame', (f: () => void) => frames.push(f));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const panel = { id: 'sheet-panel' }, done = vi.fn();
    whenNear({} as Element, done, panel as unknown as Element);
    expect(ios.map(i => i.opts)).toEqual([{ root: panel, rootMargin: '100% 0px' }]);
    ios[0]!.cb([{ isIntersecting: true }]);
    expect(done).not.toHaveBeenCalled();
    frames.shift()!(); frames.shift()!();
    expect(done).toHaveBeenCalledTimes(1);
    expect(ios[0]!.disconnected).toBe(1);
  });
});
