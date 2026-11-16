import { describe, it, expect } from 'vitest';
import { session, sets } from './helpers';
import { cardData, latestSession, MAX_COMPARE_COUNT, timeText, volumeCompare, volumeHero, volumeShort, type SharePeriod } from '@/slices/share/cardData';
import { WEIGHT_THINGS } from '@/data/weights';
import { CARD_PX, CARD_STYLES, cardSvg, mix, paletteFor, type CardFormat } from '@/slices/share/cards';
import { effectiveSetsByMuscle } from '@/brain/exposure';
import { allRecords } from '@/brain/prs';
import { weekSummary } from '@/brain/weekly';
import { kgToDisplay, enteredLoad } from '@/core/units';
import { addDays } from '@/core/dates';
import { THEMES } from '@/theme/themes';
import type { LoadUnit, Session } from '@/core/models';

const TODAY = '2026-09-23'; // a Wednesday
const BENCH = 'lib_barbell_bench_press', SQUAT = 'lib_barbell_back_squat', PULL = 'lib_lat_pulldown';

/** One session per period boundary, oldest first; bench gets heavier each time so records land. */
function history(): Session[] {
  const mk = (day: string, benchKg: number, extra: Session['exercises'] = []) => {
    const s = session(day, [{ id: BENCH, name: 'Barbell Bench Press', sets: sets(benchKg, 8) }]);
    return { ...s, exercises: [...s.exercises, ...extra] };
  };
  return [
    mk('2025-06-02', 50), // all time only
    mk('2026-02-02', 52.5), // this year
    mk('2026-07-15', 55, [{ exerciseId: SQUAT, name: 'Barbell Back Squat', sets: sets(80, 5) }]), // 3 months
    mk('2026-09-10', 57.5), // this month
    // This week: bench typed in lb (135 lb), a pulldown and a warm-up that never counts.
    { ...session('2026-09-21', []), exercises: [
      { exerciseId: BENCH, name: 'Barbell Bench Press', sets: [{ kind: 'warmup', kg: 20, reps: 10 }, ...Array.from({ length: 3 }, () => ({ ...enteredLoad(135, 'lb'), reps: 8, effort: 'ideal' as const }))] },
      { exerciseId: PULL, name: 'Lat Pulldown', sets: sets(45, 12) },
    ] },
  ];
}

const volumeOf = (ss: Session[]) => ss.flatMap(s => s.exercises).flatMap(e => e.sets).filter(x => x.kind !== 'warmup').reduce((a, x) => a + (x.kg ?? 0) * (x.reps ?? 0), 0);

describe('F12 share card data', () => {
  const all = history();
  const expected: Record<Exclude<SharePeriod, 'workout'>, { from: string; count: number }> = {
    week: { from: '2026-09-21', count: 1 },
    month: { from: '2026-09-01', count: 2 },
    quarter: { from: '2026-07-01', count: 3 },
    year: { from: '2026-01-01', count: 4 },
    all: { from: '2025-06-02', count: 5 },
  };

  for (const u of ['kg', 'lb'] as LoadUnit[]) {
    for (const [period, want] of Object.entries(expected) as Array<[Exclude<SharePeriod, 'workout'>, { from: string; count: number }]>) {
      it(`${period} in ${u}: range, sessions, sets, volume, records and muscle sets come from the brain`, () => {
        const d = cardData({ sessions: all, custom: [], unit: u, today: TODAY, period });
        const inRange = all.filter(s => s.day >= want.from && s.day <= TODAY);
        expect(d.from).toBe(want.from);
        expect(d.to).toBe(TODAY);
        expect(d.sessions).toBe(want.count);
        expect(d.sets).toBe(inRange.flatMap(s => s.exercises).flatMap(e => e.sets).filter(x => x.kind !== 'warmup').length);
        expect(d.volumeKg).toBe(Math.round(volumeOf(inRange)));
        expect(d.volume).toBe(Math.round(kgToDisplay(volumeOf(inRange), u)));
        expect(d.durationSec).toBe(inRange.length * 3600);
        const recs = allRecords(all, [], u).filter(r => r.day >= want.from && r.day <= TODAY);
        expect(d.records).toEqual(recs);
        for (const r of d.records) if (r.kind === 'heaviest') expect(r.detail).toContain(` ${u} ×`);
        expect(d.muscleSets).toEqual(effectiveSetsByMuscle(inRange, want.from, addDays(TODAY, 1), []));
        // Receipt lines: heaviest volume first, values in the person's unit.
        const vols = d.lines.map(l => l.volumeKg);
        expect([...vols].sort((a, b) => b - a)).toEqual(vols);
        for (const l of d.lines) expect(l.value).toMatch(u === 'kg' ? /( kg| t)$/ : / ?k? ?lb$/);
        expect(d.lines.find(l => l.exerciseId === BENCH)?.detail).toBe(`×${inRange.length}`);
      });
    }
  }

  it('week matches weekSummary (the Stats card) for sets and volume', () => {
    const d = cardData({ sessions: all, custom: [], unit: 'kg', today: TODAY, period: 'week' });
    const w = weekSummary(all, TODAY);
    expect([d.sessions, d.sets, d.volumeKg]).toEqual([w.workouts, w.sets, w.volumeKg]);
  });

  it('one workout: its own sets, volume, records and lines, in kg and in lb as typed', () => {
    const s = all[4]!;
    const kg = cardData({ sessions: all, custom: [], unit: 'kg', today: TODAY, period: 'workout', session: s });
    expect(kg.label).toBe(s.day === TODAY ? 'Today' : kg.label);
    expect(kg.title).toBe('Push');
    expect(kg.sessions).toBe(1);
    expect(kg.sets).toBe(6);
    expect(kg.volumeKg).toBe(Math.round(volumeOf([s])));
    expect(kg.muscleSets).toEqual(effectiveSetsByMuscle([s], s.day, addDays(s.day, 1), []));
    const bench = kg.lines.find(l => l.exerciseId === BENCH)!;
    expect(bench.detail).toBe(`3×8 @${kgToDisplay(enteredLoad(135, 'lb').kg, 'kg')}`);
    expect(bench.pr).toBe(true); // 135 lb beats 57.5 kg
    expect(kg.records.every(r => r.day === s.day)).toBe(true);
    const lb = cardData({ sessions: all, custom: [], unit: 'lb', today: TODAY, period: 'workout', session: s });
    expect(lb.lines.find(l => l.exerciseId === BENCH)!.detail).toBe('3×8 @135');
    expect(lb.volume).toBe(Math.round(kgToDisplay(volumeOf([s]), 'lb')));
    expect(lb.records.find(r => r.kind === 'heaviest')?.detail).toBe('135 lb × 8');
    expect(lb.lines.find(l => l.exerciseId === PULL)!.value).toBe(`${Math.round(kgToDisplay(45 * 36, 'lb')).toLocaleString('en-GB')} lb`);
  });

  it('a workout on today reads "Today"; with no session the card is empty', () => {
    const s = session(TODAY, [{ id: BENCH, sets: sets(60, 5) }]);
    expect(cardData({ sessions: [...all, s], custom: [], unit: 'kg', today: TODAY, period: 'workout', session: s }).label).toBe('Today');
    const none = cardData({ sessions: [], custom: [], unit: 'kg', today: TODAY, period: 'workout', session: null });
    expect([none.sessions, none.sets, none.volume, none.lines.length]).toEqual([0, 0, 0, 0]);
    expect(latestSession(all)?.day).toBe('2026-09-21');
    expect(latestSession([])).toBeNull();
  });

  it('words for the numbers', () => {
    expect(volumeHero(4710, 'kg')).toEqual({ big: '4,710', unit: 'kg lifted' });
    expect(volumeHero(29_840, 'kg')).toEqual({ big: '29.8', unit: 'tonnes lifted' });
    expect(volumeHero(297_300, 'kg')).toEqual({ big: '297', unit: 'tonnes lifted' });
    expect(volumeHero(65_800, 'lb')).toEqual({ big: '65.8', unit: 'k lb lifted' });
    expect([volumeShort(4710, 'kg'), volumeShort(29_840, 'kg'), volumeShort(9_340, 'lb'), volumeShort(65_800, 'lb')]).toEqual(['4,710 kg', '29.8 t', '9,340 lb', '65.8k lb']);
    expect(timeText({ period: 'workout', durationSec: 3492 })).toBe('58:12');
    expect(timeText({ period: 'week', durationSec: 13_920 })).toBe('3 h 52 m');
    expect(timeText({ period: 'month', durationSec: 1_800 })).toBe('30 m');
    expect(timeText({ period: 'year', durationSec: 131 * 3600 + 600 })).toBe('131 h');
    expect([timeText({ period: 'workout', durationSec: 0 }), timeText({ period: 'all', durationSec: 0 })]).toEqual(['—', '—']);
  });

  it('the comparison library: unique ids, real weights, each thing reachable', () => {
    expect(new Set(WEIGHT_THINGS.map(t => t.id)).size).toBe(WEIGHT_THINGS.length);
    expect(WEIGHT_THINGS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(WEIGHT_THINGS.map(t => t.group)).size).toBeGreaterThanOrEqual(6);
    for (const t of WEIGHT_THINGS) {
      expect(t.kg, t.id).toBeGreaterThan(0);
      expect(t.note.length, t.id).toBeGreaterThan(0);
      expect(volumeCompare(t.kg * 3, { unit: t.unit ?? 'kg', seen: WEIGHT_THINGS.filter(x => x.id !== t.id).map(x => x.id) })?.id, t.id).toBe(t.id);
    }
  });

  it('a comparison is a readable count of one thing, in words', () => {
    expect(volumeCompare(0)).toBeNull();
    expect(volumeCompare(5)).toBeNull();
    for (const kg of [300, 1_810, 4_710, 29_840, 297_300, 1_104_000, 20_000_000]) {
      for (const seed of ['a', 'b', 'c']) {
        const c = volumeCompare(kg, { seed })!;
        const t = WEIGHT_THINGS.find(x => x.id === c.id)!;
        const n = Math.round(kg / t.kg);
        expect(n, `${kg} ${t.id}`).toBeGreaterThanOrEqual(1);
        expect(n, `${kg} ${t.id}`).toBeLessThanOrEqual(MAX_COMPARE_COUNT);
        expect(c.text).toBe(`≈ ${n.toLocaleString('en-GB')} ${n === 1 ? t.one : t.many}`);
      }
    }
    expect(volumeCompare(6_000, { seen: WEIGHT_THINGS.filter(x => x.id !== 'elephant').map(x => x.id) })!.text).toBe('≈ 1 African elephant');
  });

  it('gym kit follows the unit: kg plates for kg lifters, 45 lb plates for lb lifters', () => {
    const ids = (unit: LoadUnit) => new Set(Array.from({ length: 60 }, (_, i) => volumeCompare(2_000, { unit, seed: String(i) })!.id));
    expect(ids('kg').has('plate-45lb')).toBe(false);
    expect(ids('lb').has('plate-25kg')).toBe(false);
    expect([...ids('kg')].some(id => id === 'plate-25kg' || id === 'barbell-20kg')).toBe(true);
    expect([...ids('lb')].some(id => id === 'plate-45lb' || id === 'barbell-45lb')).toBe(true);
  });

  it('no repeats: each share picks something not shown yet until every option has had a turn', () => {
    const kg = 12_000;
    const options = WEIGHT_THINGS.filter(t => (!t.unit || t.unit === 'kg') && kg / t.kg >= 0.95 && Math.round(kg / t.kg) <= MAX_COMPARE_COUNT).map(t => t.id);
    expect(options.length).toBeGreaterThanOrEqual(10);
    const seen: string[] = [];
    for (let i = 0; i < options.length; i++) seen.push(volumeCompare(kg, { seed: 'same card', seen })!.id);
    expect([...seen].sort()).toEqual([...options].sort());
    // Once all were used, the one shown longest ago comes back first.
    expect(volumeCompare(kg, { seed: 'same card', seen })!.id).toBe(seen[0]);
  });

  it('different cards start on different things', () => {
    const all = history();
    const picks = new Set((['week', 'month', 'quarter', 'year', 'all'] as const).map(period => cardData({ sessions: all, custom: [], unit: 'kg', today: TODAY, period }).compare?.id));
    expect(picks.size).toBeGreaterThanOrEqual(3);
  });
});

describe('F12 card drawings', () => {
  const d = cardData({ sessions: history(), custom: [], unit: 'kg', today: TODAY, period: 'week' });
  const pal = paletteFor(THEMES['silent-black']);

  for (const f of ['story', 'square'] as CardFormat[]) {
    for (const st of CARD_STYLES) {
      it(`${st.name} ${f}: a standalone SVG at ${CARD_PX[f].w}×${CARD_PX[f].h} in the theme's accent`, () => {
        const svg = cardSvg(d, st.id, f, pal);
        expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
        expect(svg).toContain(`width="${CARD_PX[f].w}" height="${CARD_PX[f].h}"`);
        expect(svg).toContain(pal.accent);
        expect(svg).not.toContain('var(');
        expect(svg).not.toContain('NaN');
        expect(svg).not.toContain('undefined');
      });
    }
  }

  it('shows the real numbers, escapes names, and draws the photo and mark when given', () => {
    const bad = { ...d, title: 'Push & <Pull>', lines: d.lines.map(l => ({ ...l, name: 'A&B <x>' })) };
    const poster = cardSvg(bad, 'poster', 'story', pal, { photo: 'data:image/jpeg;base64,AAAA', mark: 'data:image/png;base64,BBBB' });
    expect(poster).toContain(volumeHero(d.volume, 'kg').big);
    expect(poster).toContain('Push &amp; &lt;Pull&gt;');
    expect(poster).toContain('href="data:image/jpeg;base64,AAAA"');
    expect(poster).toContain('mask="url(#em)"');
    const receipt = cardSvg(bad, 'receipt', 'story', pal);
    expect(receipt).toContain('A&amp;B &lt;X&gt;');
    expect(receipt).toContain('TOTAL LIFTED');
    // A long name is cut, never the sets and load after it.
    const long = { ...d, lines: [{ ...d.lines[0]!, name: 'Single-Arm Chest-Supported Dumbbell Row On Incline', detail: '3×12 @32.5' }] };
    expect(cardSvg(long, 'receipt', 'square', pal)).toMatch(/SINGLE-ARM[^<]*… 3×12 @32\.5/);
    expect(cardSvg(d, 'sticker', 'story', pal)).toContain('viewBox="0 0 35 93"');
    // The sticker is see-through: no background rect before the content.
    expect(cardSvg(d, 'sticker', 'story', pal)).not.toMatch(/^<svg[^>]*><rect width="360"/);
  });

  it('mixes theme colours like CSS color-mix', () => {
    expect(mix('#ffffff', '#000000', 50)).toBe('#808080');
    expect(mix('#5e6ad2', '#1b1c1f', 100)).toBe('#5e6ad2');
    expect(mix('#5e6ad2', '#1b1c1f', 0)).toBe('#1b1c1f');
  });
});
