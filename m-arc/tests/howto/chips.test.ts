// HT-6: the Look closer chips (HT6-A3, a pure function), and the markup of the chip row, the Mistake view's wrist
// line and the Grip section with its handling mistakes, each `===` golden B's page for all 8 exercises.
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { alsoRowHtml, chipKeys, chipRowHtml, HAND_FIRST, MAX_CHIPS, type ChipContent, type Registered } from '@/slices/howto/sections/LookCloser';
import { gripHtml } from '@/slices/howto/sections/Hand';
import { handlingMistakesHtml } from '@/slices/howto/sections/HandlingMistakes';
import { durMs } from '@/slices/howto/zoom/ZoomHost';

/* eslint-disable @typescript-eslint/no-explicit-any */
const FIXTURE = readFileSync(new URL('golden/howto-layers.html', import.meta.url), 'utf8');
const ROWS = JSON.parse(readFileSync('tools/plates/plates.json', 'utf8')) as Record<string, { chromeId: string }>;
const IDS = Object.values(ROWS).map(r => r.chromeId);
const SLUG_OF = Object.fromEntries(Object.entries(ROWS).map(([lib, r]) => [r.chromeId, lib.slice(4)]));
const C: Record<string, any> = {};
beforeAll(async () => {
  for (const id of IDS) C[id] = (await import(/* @vite-ignore */ new URL(`../../tools/plates/layers/exercises/${SLUG_OF[id]}.howto.mjs`, import.meta.url).href)).default;
});
const ALL: Registered = { kind: () => true, feel: true };
/** The element of the page that starts with `open`, by balanced tags of `tag`. */
function el(open: string, tag: string): string {
  const a = FIXTURE.indexOf(open);
  if (a < 0) throw new Error(`fixture: no ${open}`);
  if (FIXTURE.indexOf(open, a + 1) >= 0) throw new Error(`fixture: two ${open}`);
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  re.lastIndex = a;
  let d = 0;
  for (let m; (m = re.exec(FIXTURE));) { d += m[0] === `</${tag}>` ? -1 : 1; if (!d) return FIXTURE.slice(a, m.index + tag.length + 3); }
  throw new Error(`fixture: unclosed ${open}`);
}
const cardOf = (id: string) => el(`<article class="sheet-card" id="card-${id}"`, 'article');

describe('HT6-A3: chipKeys (pure function)', () => {
  it.each(IDS)('%s: Hand first for hand archetypes (not the leg press), at most 4, "Where to feel it" last', id => {
    const c: ChipContent = C[id], keys = chipKeys(c, ALL);
    expect(keys.length).toBeLessThanOrEqual(MAX_CHIPS);
    expect(keys[keys.length - 1]).toBe('feel');
    if (id === 'leg-press') expect(keys[0]).not.toBe('hand');
    else expect(keys[0]).toBe('hand');
    expect(HAND_FIRST.includes(c.handling.archetype)).toBe(id !== 'leg-press');
  });
  it('the feel chip shows only when the feel section is registered', () => {
    const c = C['pull-up'];
    expect(chipKeys(c, { ...ALL, feel: false })).not.toContain('feel');
    expect(chipKeys(c, ALL)).toContain('feel');
  });
  it('a zoom chip shows only when its kind is registered (posture after HT-7)', () => {
    const c = C['machine-chest-press'];
    expect(chipKeys(c, { kind: k => k === 'hand', feel: false })).toEqual(['hand']);
  });
  it('failure paths: 5 chips, Hand not first on a hand archetype, feel not last', () => {
    const c = C['pull-up'];
    expect(() => chipKeys({ ...c, chips: ['hand', 'shoulders', 'top', 'hand', 'feel'] }, ALL)).toThrow(/5 chips/);
    expect(() => chipKeys({ ...c, chips: ['shoulders', 'hand', 'feel'] }, ALL)).toThrow(/Hand must be the first chip/);
    expect(() => chipKeys({ ...c, chips: ['hand', 'feel', 'top'] }, ALL)).toThrow(/must be the last chip/);
  });
});

describe('the markup equals golden B\'s page', () => {
  it.each(IDS)('%s: chip row ===', id => {
    const card = cardOf(id), a = card.indexOf('<div class="zx-chips-wrap">');
    const re = /<div\b|<\/div>/g; re.lastIndex = a; let d = 0, golden = '';
    for (let m; (m = re.exec(card));) { d += m[0] === '</div>' ? -1 : 1; if (!d) { golden = card.slice(a, m.index + 6); break; } }
    expect(chipRowHtml(id, C[id], chipKeys(C[id], ALL))).toBe(golden);
  });
  it.each(IDS)('%s: grip section with the handling mistakes ===', id => {
    expect(gripHtml(id, C[id])).toBe(el(`<section class="hw-sec grip" id="${id}-grip"`, 'section'));
    expect(gripHtml(id, C[id])).toContain(handlingMistakesHtml(id, C[id]));
  });
  it.each(IDS)('%s: the Mistake view\'s wrist line === (push only)', id => {
    const html = alsoRowHtml(id, C[id]);
    if (C[id].handling.archetype === 'push') expect(html).toBe(el(`<p class="ht-also" id="${id}-also"`, 'p'));
    else { expect(html).toBe(''); expect(FIXTURE.includes(`id="${id}-also"`)).toBe(false); }
  });
  it('the page order under the tempo is: wrist line, chips, grip', () => {
    for (const id of IDS) {
      const card = cardOf(id), chips = card.indexOf('zx-chips-wrap'), grip = card.indexOf(`id="${id}-grip"`), tempo = card.lastIndexOf('class="tempo"');
      expect(tempo).toBeLessThan(chips);
      expect(chips).toBeLessThan(grip);
      const also = card.indexOf(`id="${id}-also"`);
      if (also >= 0) expect(also).toBeLessThan(chips);
    }
  });
});

describe('the zoom host reads golden B\'s durations with their unit', () => {
  it('"240ms", ".24s" and "0.24s" are all 240 ms (the app\'s minified CSS writes seconds)', () => {
    expect(durMs('240ms')).toBe(240);
    expect(durMs('.24s')).toBe(240);
    expect(durMs(' 0.24s')).toBe(240);
    expect(durMs('160ms')).toBe(160);
    expect(durMs('')).toBeNaN();
  });
});
