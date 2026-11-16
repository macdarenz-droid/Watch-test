import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { createPlateController, X_ICON, type PlateSetup } from '@/slices/howto/usePlateState';
import { CHECK_ICON, TRACE_ICON, chromeIdOf, goldenBlockHtml, mistakeFigureHtml } from '@/slices/howto/PlateView';
import type { BuiltHowTo, GoldenFile, GoldenPlateEntry } from '@/howto/types';

// HT-3 (card HT3-A4, HT3-A6): the How-to plate reproduces the approved gallery (tools/plates/vendor/artifact/
// build-page.mjs). Byte equality of the inserted block against the committed fixture, the gallery script's behaviour
// list on a fake DOM (project convention: no jsdom), and the zoom slot API. Gate block HT-3 proves the pixels.

const FIXTURE = readFileSync('tests/howto/golden/technical-plates.html', 'utf8');
const GOLDEN = JSON.parse(readFileSync('tests/howto/golden/GOLDEN.json', 'utf8')) as GoldenFile;
const PLATES = new Map<string, GoldenPlateEntry>();
for (const e of GOLDEN.entries) if (e.kind === 'plate') PLATES.set(e.id, e);
const modules = async () => Promise.all(readdirSync('src/howto/generated').filter(f => /^ht-.*\.ts$/.test(f))
  .map(async f => (await import(`../../src/howto/generated/${f.replace(/\.ts$/, '')}`)).default as BuiltHowTo));

/** The gallery card's block from plate-fit to the end of the tempo strip, with the 2 wrapper classes mapped. */
function fixtureBlock(chromeId: string): string {
  const card = FIXTURE.indexOf(`<article class="sheet-card" id="card-${chromeId}"`);
  const a = FIXTURE.indexOf(`<div class="plate-fit" id="${chromeId}-plate">`, card), b = FIXTURE.indexOf('\n</article>', a);
  expect(card).toBeGreaterThan(0); expect(a).toBeGreaterThan(card); expect(b).toBeGreaterThan(a);
  return FIXTURE.slice(a, b).replace('<div class="plate-fit"', '<div class="ht-plate-fit"').replaceAll('<figure class="plate"', '<figure class="ht-plate"');
}

/** The app's block after the first Mistake tap (the mistake figure after the normal one), without the zoom slot. */
const withMistake = (h: BuiltHowTo) => goldenBlockHtml(h).replace('<div class="ht-zoom-slot" hidden></div>', '').replace('</figure></div>', () => `</figure>${mistakeFigureHtml(h)}</div>`);

describe('HT3-A4: the inserted golden block is the gallery card, byte for byte', () => {
  it('for all 8: the S0 block with the mistake figure inserted and the zoom slot left out equals the fixture block', async () => {
    const all = await modules();
    expect(all).toHaveLength(8);
    for (const h of all) {
      const id = chromeIdOf(h);
      expect(id, h.id).toBe(PLATES.get(h.id)!.chromeId);
      const s0 = goldenBlockHtml(h);
      expect(s0.match(/<div class="ht-zoom-slot" hidden><\/div>/g), h.id).toHaveLength(1);
      expect(s0, h.id).not.toContain('data-mode="mistake"');
      expect(withMistake(h) === fixtureBlock(id), h.id).toBe(true);
    }
  });
  it('the icons and the X icon are the gallery\'s own strings', () => {
    expect(FIXTURE).toContain(`${TRACE_ICON} Trace</button>`);
    expect(FIXTURE).toContain(`${CHECK_ICON} Saved offline</span>`);
    expect(FIXTURE).toContain(`const X_ICON = ${JSON.stringify(X_ICON)};`);
  });
  it('a changed byte fails (failure path)', async () => {
    const [h] = await modules();
    const bad = { ...h!, plate: { ...h!.plate, tempo: `${h!.plate.tempo} ` } } as BuiltHowTo;
    expect(withMistake(bad) === fixtureBlock(chromeIdOf(bad))).toBe(false);
    expect(withMistake(h!) === fixtureBlock(chromeIdOf(h!))).toBe(true);
  });
});

describe('HT3-A4: every selector, attribute and value of the gallery script appears in the port', () => {
  it('the string literals of the per-card script (wrapper classes and the card root mapped) all occur in usePlateState.ts', () => {
    const page = readFileSync('tools/plates/vendor/artifact/build-page.mjs', 'utf8');
    const js = page.slice(page.indexOf('const fit = el =>'), page.indexOf('select(figN, sel.normal);') + 25);
    const port = readFileSync('src/slices/howto/usePlateState.ts', 'utf8');
    const lits = [...js.matchAll(/'([^'\n]*)'/g)].map(m => m[1]!).filter(Boolean)
      .map(l => l.replace(/^\.sheet-card$/, '.ht-golden').replace(/^\.plate-fit$/, '.ht-plate-fit').replace(/^\.plate(?=$|\[)/, '.ht-plate'));
    expect(lits.length).toBeGreaterThan(30);
    expect(lits.filter(l => !port.includes(`'${l}'`) && !port.includes(l))).toEqual([]);
    for (const expr of ['Math.min(1, w / 358)', '(t * 2.4).toFixed(2)', '(+g.dataset.th - 10) / 78', 'void figN.getBoundingClientRect()']) expect(port).toContain(expr);
  });
});

// ---- fake DOM: just what the controller touches ----
type Fn = () => void;
class El {
  attrs = new Map<string, string>();
  cls = new Set<string>();
  listeners: Record<string, Fn[]> = {};
  dataset: Record<string, string> = {};
  style = { props: new Map<string, string>(), zoom: '', display: '', setProperty(k: string, v: string) { this.props.set(k, v); } };
  hidden = false; inert = false; textContent = ''; innerHTML = ''; clientWidth = 0;
  q: Record<string, El[]> = {};
  constructor(cls = '') { cls.split(' ').filter(Boolean).forEach(c => this.cls.add(c)); }
  classList = { add: (c: string) => this.cls.add(c), remove: (c: string) => this.cls.delete(c), contains: (c: string) => this.cls.has(c), toggle: (c: string, on: boolean) => { if (on) this.cls.add(c); else this.cls.delete(c); } };
  get className() { return [...this.cls].join(' '); }
  set className(v: string) { this.cls = new Set(v.split(' ').filter(Boolean)); }
  setAttribute(k: string, v: string) { this.attrs.set(k, v); }
  getAttribute(k: string) { return this.attrs.get(k) ?? null; }
  querySelectorAll(s: string) { return this.q[s] ?? []; }
  querySelector(s: string) { return this.q[s]?.[0] ?? null; }
  addEventListener(t: string, f: Fn) { (this.listeners[t] ??= []).push(f); }
  removeEventListener(t: string, f: Fn) { this.listeners[t] = (this.listeners[t] ?? []).filter(x => x !== f); }
  getBoundingClientRect() { return {}; }
  fire(t: string) { for (const f of [...(this.listeners[t] ?? [])]) f(); }
}
const btn = (key: string, cue: string) => { const b = new El('plate-callout'); b.dataset = { key, cue }; b.setAttribute('aria-pressed', 'false'); return b; };

function fakePlate() {
  const card = new El('ht-golden'), fit = new El('ht-plate-fit'), figN = new El('ht-plate'), svg = new El('plate-svg'), trace = new El('trace');
  const cue = new El('cue-line'), tells = new El('tells'), trBtn = new El('howto-pill'), misBtn = new El('howto-pill mistake'), slot = new El('ht-zoom-slot');
  tells.hidden = true; slot.hidden = true; fit.clientWidth = 358;
  const nb = [btn('a', 'Cue A & <b>'), btn('b', 'Cue B'), btn('c', 'Cue C')];
  const leaders = nb.map(() => new El('leader')), anchors = nb.map(() => new El('anchor'));
  const guide = new El('lead-guide'); guide.dataset = { guide: 'b' }; guide.style.display = 'none';
  const g1 = new El('ghost'), g2 = new El('ghost'); g1.dataset = { t: '0.5' }; g2.dataset = { th: '49' };
  svg.q = { ':scope > path.leader:not(.m)': leaders, ':scope > circle.anchor': anchors, '[data-guide]': [guide] };
  figN.q = { '.plate-callout': nb, svg: [svg], '.trace': [trace] };
  const figM = new El('ht-plate'); figM.hidden = true;
  const mb = [btn('x', 'Tell X'), btn('y', 'Tell <Y>')];
  const g3 = new El('ghost'); g3.dataset = { t: '1' };
  figM.q = { '.plate-callout': mb, '.ghost': [g3] };
  fit.q = { '.ht-plate': [figN] };
  card.q = { '.ht-plate-fit': [fit], '.ht-plate[data-mode="normal"]': [figN], '.cue-line': [cue], '.tells': [tells], '#lr-trace': [trBtn], '#lr-mistake': [misBtn], '.ht-zoom-slot': [slot], '.ghost': [g1, g2] };
  const mount = vi.fn(() => { fit.q['.ht-plate'] = [figN, figM]; return figM as unknown as HTMLElement; });
  const setup: PlateSetup = { chromeId: 'lr', selN: 'a', selM: 'x', mountMistake: mount };
  return { card, fit, figN, figM, svg, trace, cue, tells, trBtn, misBtn, slot, nb, mb, leaders, anchors, guide, g1, g2, g3, mount, setup };
}
let motion: string | null = null;
beforeEach(() => {
  motion = null;
  vi.stubGlobal('document', { documentElement: { getAttribute: (k: string) => (k === 'data-motion' ? motion : null) } });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => vi.unstubAllGlobals());
const make = () => { const f = fakePlate(); const c = createPlateController(f.card as unknown as HTMLElement, f.setup); return { ...f, c }; };
const pressed = (bs: El[]) => bs.map(b => b.getAttribute('aria-pressed'));

describe('HT3-A4: the gallery script\'s behaviour list', () => {
  it('S0: the default callout is pressed, its leader and anchor are on (r 2.5, others 1.5), its guide shows, the cue is its text', () => {
    const f = make();
    expect(pressed(f.nb)).toEqual(['true', 'false', 'false']);
    expect(f.leaders.map(l => l.cls.has('on'))).toEqual([true, false, false]);
    expect(f.anchors.map(a => [a.cls.has('on'), a.getAttribute('r')])).toEqual([[true, '2.5'], [false, '1.5'], [false, '1.5']]);
    expect(f.guide.style.display).toBe('none');
    expect([f.cue.className, f.cue.textContent]).toEqual(['cue-line', 'Cue A & <b>']);
    expect(f.mount).not.toHaveBeenCalled();
  });
  it('a callout tap moves the selection, the leader, the anchor, the guide and the cue', () => {
    const f = make();
    f.nb[1]!.fire('click');
    expect(pressed(f.nb)).toEqual(['false', 'true', 'false']);
    expect(f.leaders.map(l => l.cls.has('on'))).toEqual([false, true, false]);
    expect(f.anchors.map(a => a.getAttribute('r'))).toEqual(['1.5', '2.5', '1.5']);
    expect(f.guide.style.display).toBe('');
    expect(f.cue.textContent).toBe('Cue B');
  });
  it('ghosts get --gd from data-t (engine) or data-th over 10..88 deg (reference plate), times 2.4 s', () => {
    const f = make();
    expect(f.g1.style.props.get('--gd')).toBe('1.20s');
    expect(f.g2.style.props.get('--gd')).toBe('1.20s');
  });
  it('Mistake: inserts the mistake figure once, shows it and the tells, presses the pill, and writes the X icon, sr-only "Mistake: " and the escaped tell', () => {
    const f = make();
    f.misBtn.fire('click');
    expect(f.mount).toHaveBeenCalledTimes(1);
    expect([f.figN.hidden, f.figM.hidden, f.tells.hidden, f.misBtn.getAttribute('aria-pressed')]).toEqual([true, false, false, 'true']);
    expect(pressed(f.mb)).toEqual(['true', 'false']);
    expect(f.cue.className).toBe('cue-line tell');
    expect(f.cue.innerHTML).toBe(`${X_ICON}<span><span class="sr-only">Mistake: </span>Tell X</span>`);
    expect(f.g3.style.props.get('--gd')).toBe('2.40s');
    f.mb[1]!.fire('click');
    expect(f.cue.innerHTML).toBe(`${X_ICON}<span><span class="sr-only">Mistake: </span>Tell &lt;Y></span>`);
    expect(f.leaders.map(l => l.cls.has('on'))).toEqual([true, false, false]);   // the mistake figure never touches the normal leaders
    f.misBtn.fire('click'); f.misBtn.fire('click');
    expect(f.mount).toHaveBeenCalledTimes(1);
    expect(pressed(f.mb)).toEqual(['false', 'true']);   // each mode keeps its own selection
  });
  it('Trace: from mistake mode it returns to normal, adds .tracing and presses the pill; animationend ends it', () => {
    const f = make();
    f.misBtn.fire('click');
    f.trBtn.fire('click');
    expect([f.figN.hidden, f.figM.hidden, f.tells.hidden]).toEqual([false, true, true]);
    expect([f.figN.cls.has('tracing'), f.trBtn.getAttribute('aria-pressed')]).toEqual([true, 'true']);
    f.trace.fire('animationend');
    expect([f.figN.cls.has('tracing'), f.trBtn.getAttribute('aria-pressed')]).toEqual([false, 'false']);
  });
  it('reduced motion: Trace shows the end state at once (no .tracing)', () => {
    const f = make();
    motion = 'reduce';
    f.trBtn.fire('click');
    expect([f.figN.cls.has('tracing'), f.trBtn.getAttribute('aria-pressed')]).toEqual([false, 'false']);
  });
  it('fit: zoom = min(1, w/358) on every plate figure, again on a mode change', () => {
    const f = make();
    expect(f.figN.style.zoom).toBe('1');
    f.fit.clientWidth = 328; f.misBtn.fire('click');
    expect([f.figN.style.zoom, f.figM.style.zoom]).toEqual([String(328 / 358), String(328 / 358)]);
  });
  it('destroy() removes every listener', () => {
    const f = make();
    f.c.destroy();
    f.nb[2]!.fire('click'); f.misBtn.fire('click'); f.trBtn.fire('click');
    expect(pressed(f.nb)).toEqual(['true', 'false', 'false']);
    expect(f.mount).not.toHaveBeenCalled();
    expect(f.figN.cls.has('tracing')).toBe(false);
  });
});

describe('HT3-A6: the zoom slot API', () => {
  it('snapshot, mutate, restore gives the same state and the same DOM', () => {
    const f = make();
    f.nb[2]!.fire('click'); f.misBtn.fire('click'); f.mb[1]!.fire('click');
    const s = f.c.snapshot();
    expect(s).toEqual({ mode: 'mistake', callout: 'c', tell: 'y' });
    const dom = () => JSON.stringify([pressed(f.nb), pressed(f.mb), f.figN.hidden, f.figM.hidden, f.tells.hidden, f.cue.innerHTML, f.cue.className, f.misBtn.getAttribute('aria-pressed'), f.leaders.map(l => l.cls.has('on'))]);
    const before = dom();
    f.misBtn.fire('click'); f.nb[0]!.fire('click'); f.misBtn.fire('click'); f.mb[0]!.fire('click'); f.misBtn.fire('click');
    expect(dom()).not.toBe(before);
    f.c.restore(s);
    expect(f.c.snapshot()).toEqual(s);
    expect(dom()).toBe(before);
    f.c.restore({ mode: 'normal', callout: 'b', tell: 'x' });
    expect([f.c.snapshot(), pressed(f.nb), pressed(f.mb), f.cue.textContent, f.figN.hidden]).toEqual([{ mode: 'normal', callout: 'b', tell: 'x' }, ['false', 'true', 'false'], ['true', 'false'], 'Cue B', false]);
  });
  it('restore into mistake before the mistake figure exists inserts it', () => {
    const f = make();
    f.c.restore({ mode: 'mistake', callout: 'a', tell: 'y' });
    expect(f.mount).toHaveBeenCalledTimes(1);
    expect(pressed(f.mb)).toEqual(['false', 'true']);
  });
  it('setPlateHidden: hidden and inert on the plate box, the slot shown in its place; a running Trace is ended; false reverses it', () => {
    const f = make();
    expect(f.c.slot).toBe(f.slot);
    f.trBtn.fire('click');
    f.c.setPlateHidden(true);
    expect([f.fit.hidden, f.fit.inert, f.slot.hidden, f.figN.cls.has('tracing'), f.trBtn.getAttribute('aria-pressed')]).toEqual([true, true, false, false, 'false']);
    f.c.setPlateHidden(false);
    expect([f.fit.hidden, f.fit.inert, f.slot.hidden]).toEqual([false, false, true]);
  });
  it('clearMistake from mistake mode gives normal mode with the default callout', () => {
    const f = make();
    f.nb[2]!.fire('click'); f.misBtn.fire('click');
    f.c.clearMistake();
    expect(f.c.snapshot().mode).toBe('normal');
    expect(f.c.snapshot().callout).toBe('a');
    expect([pressed(f.nb), f.figN.hidden, f.tells.hidden, f.misBtn.getAttribute('aria-pressed'), f.cue.textContent]).toEqual([['true', 'false', 'false'], false, true, 'false', 'Cue A & <b>']);
  });
});
