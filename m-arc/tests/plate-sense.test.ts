import { describe, it, expect } from 'vitest';
import { displayToKg, enteredLoad, formatSetLoad, kgToDisplay, setLoadIn, approxIn } from '@/core/units';
import { freshState, DEFAULT_GYM_ID } from '@/core/models';
import { loadState, STATE_KEY } from '@/core/store';
import { normalizeUnits } from '@/core/escobarState';

const steps = (from: number, to: number, step: number): number[] => {
  const out: number[] = [];
  for (let i = Math.round(from / step); i * step <= to + 1e-9; i++) out.push(Math.round(i * step * 100) / 100);
  return out;
};

describe('Plate Sense round trip (§25.7)', () => {
  it('every 2.5 lb value from 2.5 to 500 lb survives entry → store → display exactly', () => {
    const bad = steps(2.5, 500, 2.5).filter(v => {
      const stored = JSON.parse(JSON.stringify(enteredLoad(v, 'lb')));
      return setLoadIn(stored, 'lb') !== v || kgToDisplay(stored.kg, 'lb') !== v;
    });
    expect(bad).toEqual([]);
  });
  it('every 0.5 kg value from 0.5 to 300 kg survives entry → store → display exactly', () => {
    const bad = steps(0.5, 300, 0.5).filter(v => {
      const stored = JSON.parse(JSON.stringify(enteredLoad(v, 'kg')));
      return setLoadIn(stored, 'kg') !== v || kgToDisplay(stored.kg, 'kg') !== v;
    });
    expect(bad).toEqual([]);
  });
  it('the canonical kg of a lb entry is unrounded to 3 decimals', () => {
    expect(displayToKg(35, 'lb')).toBe(15.876);
    expect(displayToKg(23.75, 'kg')).toBe(23.75);
  });
  it('an old set without `entered` still displays by conversion', () => {
    expect(formatSetLoad({ kg: 100 }, 'kg')).toBe('100 kg');
    expect(formatSetLoad({ kg: 100 }, 'lb')).toBe('220.5 lb');
    expect(formatSetLoad({}, 'kg')).toBe('—');
  });
  it('the other-unit hint reads to one decimal', () => {
    expect(approxIn(displayToKg(45, 'lb'), 'kg')).toBe('≈ 20.4 kg');
  });
});

describe('units state', () => {
  it('fresh state has one gym, "My gym", in the display unit', () => {
    const u = freshState().units;
    expect(u.gyms).toHaveLength(1);
    expect(u.gyms[0]!.name).toBe('My gym');
    expect(u.activeGymId).toBe(DEFAULT_GYM_ID);
  });
  it('a pre-Plate-Sense lb user gets an lb gym', () => {
    const old = freshState() as unknown as Record<string, unknown>;
    delete old.units;
    (old.preferences as { weightUnit: string }).weightUnit = 'lb';
    const map = new Map([[STATE_KEY, JSON.stringify(old)]]);
    const { state } = loadState({ getItem: k => map.get(k) ?? null, setItem: () => {}, removeItem: () => {} });
    expect(state.units.gyms[0]!.defaultUnit).toBe('lb');
  });
  it('drops malformed gyms, duplicates, profiles for unknown gyms and caps at 8', () => {
    const gyms = Array.from({ length: 10 }, (_, i) => ({ id: `g${i}`, name: `G${i}`, defaultUnit: 'lb', createdAt: 'x' }));
    const u = normalizeUnits({
      gyms: [{ id: 'g0', name: 'dup' }, ...gyms, { name: 'no id' }],
      activeGymId: 'nope',
      byExercise: { g0: { bench: { unit: 'lb', ladder: [10, 5, -1], source: 'user' }, bad: { unit: 'stone' } }, zzz: { x: { unit: 'kg' } } },
      byEquipment: { g1: { dumbbell: { unit: 'lb', step: 5, barKg: 99 } } },
    }, 'kg');
    expect(u.gyms).toHaveLength(8);
    expect(u.gyms[0]!.name).toBe('dup');
    expect(u.activeGymId).toBe('g0');
    expect(u.byExercise.g0!.bench!.ladder).toEqual([5, 10]);
    expect(u.byExercise.g0!.bad).toBeUndefined();
    expect(u.byExercise.zzz).toBeUndefined();
    expect(u.byEquipment.g1!.dumbbell!.barKg).toBeUndefined();
  });
  it('no gyms at all falls back to the default', () => {
    expect(normalizeUnits({ gyms: [] }, 'kg').gyms[0]!.id).toBe(DEFAULT_GYM_ID);
  });
});

import { resolveProfile, loadableNear, loadableValues, plateBreakdown, formatPerSide, inferGym, defaultProfile, LB_BAR_KG } from '@/brain/units';
import { suspectAlternative } from '@/brain/fidelity';
import { suggestNext } from '@/brain/progression';
import { warmupSets } from '@/brain/coach/pre';
import { autoregulationSuggestion } from '@/brain/coach/live';
import { freshUnits, type EquipmentProfile, type UnitsState } from '@/core/models';
import { session, sets } from './helpers';

const prof = (p: Partial<EquipmentProfile>): EquipmentProfile => ({ unit: 'kg', source: 'user', updatedAt: '2026-09-01', ...p });

describe('resolveProfile precedence', () => {
  const units: UnitsState = {
    ...freshUnits('kg'),
    gyms: [{ id: 'home', name: 'Home', defaultUnit: 'kg', createdAt: '' }, { id: 'work', name: 'Work', defaultUnit: 'lb', createdAt: '' }],
    activeGymId: 'home',
    byExercise: { work: { bench: prof({ unit: 'lb', step: 5, updatedAt: '2026-09-02' }) } },
    byEquipment: { home: { Dumbbells: prof({ unit: 'lb', ladder: [10, 20] }) } },
  };
  it('1: the exercise at this gym', () => {
    expect(resolveProfile('bench', 'work', units, { equipment: 'Barbell' }).step).toBe(5);
  });
  it('2: the exercise at any gym', () => {
    expect(resolveProfile('bench', 'home', units, { equipment: 'Barbell' }).unit).toBe('lb');
  });
  it('3: the equipment group at this gym', () => {
    expect(resolveProfile('db_press', 'home', units, { equipment: 'Dumbbells' }).ladder).toEqual([10, 20]);
  });
  it('4: the gym default unit with built-in ladders', () => {
    const p = resolveProfile('db_press', 'work', units, { equipment: 'Dumbbells' });
    expect(p.unit).toBe('lb');
    expect(p.source).toBe('default');
    expect(p.ladder![0]).toBe(5);
    expect(resolveProfile('squat', 'work', units, { equipment: 'Barbell' }).barKg).toBe(LB_BAR_KG);
  });
});

describe('loadableNear', () => {
  const lbDumbbells = defaultProfile('Dumbbells', 'lb');
  it('snaps to the lb dumbbell ladder', () => {
    expect(loadableNear(24.9, lbDumbbells)).toEqual({ kg: 24.948, value: 55, unit: 'lb' });
    expect(loadableNear(24.0, lbDumbbells, 'up').value).toBe(55);
    expect(loadableNear(24.9, lbDumbbells, 'down').value).toBe(50);
    expect(lbDumbbells.ladder).toContain(22.5);
    expect(lbDumbbells.ladder).not.toContain(27.5);
  });
  it('snaps to the kg plate set on a 20 kg bar', () => {
    const p = defaultProfile('Barbell', 'kg');
    expect(loadableNear(101.1, p).value).toBe(100);
    expect(loadableNear(101.1, p, 'up').value).toBe(102.5);
  });
  it('handles a kg bar with lb plates', () => {
    const p = prof({ unit: 'lb', barKg: 20, plates: [45, 25, 10, 5, 2.5] });
    const l = loadableNear(100, p);
    // 20 kg bar = 44.09 lb; totals are 44.09 + 2 × plate sums.
    expect(Math.abs(l.kg - 100)).toBeLessThan(1.2);
    expect(l.unit).toBe('lb');
    expect(Math.round((l.value - 44.09) * 100) % 500).toBe(0);
  });
  it('handles a stack with add-ons', () => {
    const p = prof({ unit: 'kg', step: 5, addOns: [2.5] });
    expect(loadableValues(p).slice(0, 4)).toEqual([5, 7.5, 10, 12.5]);
    expect(loadableNear(41, p).value).toBe(40);
    expect(loadableNear(41, p, 'up').value).toBe(42.5);
  });
  it('clamps beyond the ladder', () => {
    expect(loadableNear(500, lbDumbbells, 'up').value).toBe(150);
  });
});

describe('plateBreakdown', () => {
  it('100 kg on a 20 kg bar', () => {
    const b = plateBreakdown(100, defaultProfile('Barbell', 'kg'));
    expect(formatPerSide(b)).toBe('25 + 15 kg');
    expect(b.exactTotalKg).toBe(100);
    expect(b.remainderKg).toBe(0);
  });
  it('225 lb on a 45 lb bar', () => {
    const b = plateBreakdown(225 * 0.45359237, defaultProfile('Barbell', 'lb'));
    expect(formatPerSide(b)).toBe('45 + 45 lb');
    expect(b.remainderKg).toBeCloseTo(0, 2);
  });
  it('60 kg on a 45 lb bar with kg plates', () => {
    const b = plateBreakdown(60, prof({ unit: 'kg', barKg: LB_BAR_KG, plates: [25, 20, 15, 10, 5, 2.5, 1.25] }));
    expect(formatPerSide(b)).toBe('15 + 2.5 + 1.25 kg');
    expect(b.exactTotalKg).toBeCloseTo(57.912, 3);
    expect(b.remainderKg).toBeGreaterThan(0);
  });
  it('just the bar', () => {
    expect(formatPerSide(plateBreakdown(20, defaultProfile('Barbell', 'kg')))).toBe('Just the bar');
  });
});

describe('suggestNext with equipment', () => {
  const lbDumbbells = defaultProfile('Dumbbells', 'lb');
  const days = ['2026-09-01', '2026-09-04', '2026-09-08', '2026-09-11'];
  it('never returns a load off the ladder, and states it in lb', () => {
    const values = new Set(loadableValues(lbDumbbells));
    for (const kg of [9, 11.3, 15.9, 20, 22.7, 24.9, 31]) for (const effort of ['easy', 'ideal', 'max'] as const) {
      const hist = days.map(d => session(d, [{ id: 'lib_dumbbell_bench_press', sets: sets(kg, effort === 'max' ? 6 : 12, effort) }]));
      const s = suggestNext(hist, 'lib_dumbbell_bench_press', 'lean', '2026-09-14', 3, [], { equipment: lbDumbbells });
      expect(s.unit).toBe('lb');
      expect(values.has(s.value!)).toBe(true);
      for (const set of s.sets) if (set.kg != null) expect(values.has(Math.round(set.kg / 0.45359237 * 100) / 100)).toBe(true);
      expect(s.target).toContain(' lb');
    }
  });
  it('increases snap up, never down to the same load', () => {
    const hist = days.map(d => session(d, [{ id: 'lib_dumbbell_bench_press', sets: sets(22.68, 12, 'ideal') }]));
    const s = suggestNext(hist, 'lib_dumbbell_bench_press', 'lean', '2026-09-14', 3, [], { equipment: lbDumbbells });
    expect(s.mode).toBe('increase');
    expect(s.value).toBe(55);
  });
  it('without a profile the old step behaviour stays', () => {
    const hist = days.map(d => session(d, [{ id: 'lib_dumbbell_bench_press', sets: sets(20, 12, 'ideal') }]));
    const s = suggestNext(hist, 'lib_dumbbell_bench_press', 'lean', '2026-09-14');
    expect(s.unit).toBeUndefined();
    expect(s.kg).toBe(22);
  });
  it('warm-up ramp and autoregulation snap too', () => {
    const ramp = warmupSets(100, defaultProfile('Barbell', 'lb'));
    const values = new Set(loadableValues(defaultProfile('Barbell', 'lb')));
    for (const w of ramp) expect(values.has(Math.round(w.kg / 0.45359237 * 100) / 100)).toBe(true);
    const tip = autoregulationSuggestion({ exerciseId: 'x', exerciseName: 'DB press', firstSet: { kg: 22.68, reps: 12, effort: 'easy', fidelity: 'live' }, targetKg: 22.68, targetReps: 10, historyCount: 4, equipment: lbDumbbells });
    expect(tip!.action).toBe('Try 55 lb for the next set.');
  });
});

describe('suspectAlternative', () => {
  it('reads a 2.2× typo as lb', () => {
    expect(suspectAlternative(175, 80)).toEqual({ unit: 'lb', value: 175, kg: 79.379 });
  });
  it('reads a 0.45× typo as kg', () => {
    const alt = suspectAlternative(36.287, 80)!;
    expect(alt.unit).toBe('kg');
    expect(alt.value).toBe(80);
  });
  it('null when the load is plausible', () => {
    expect(suspectAlternative(82.5, 80)).toBeNull();
    expect(suspectAlternative(100, null)).toBeNull();
  });
});

describe('inferGym', () => {
  const gyms = ['home', 'work', 'travel'].map(id => ({ id, name: id, defaultUnit: 'kg' as const, createdAt: '' }));
  const at = (iso: string, gymId: string) => ({ ...session(iso.slice(0, 10), []), startedAt: iso, logging: { ...session(iso.slice(0, 10), []).logging, trainedAt: iso }, gymId });
  // 2026-09-22 is a Tuesday.
  const now = new Date('2026-09-22T18:00:00');
  it('picks the gym used most on this weekday near this hour', () => {
    const hist = [
      at('2026-09-15T18:30:00', 'work'), at('2026-09-08T17:10:00', 'work'), at('2026-09-01T19:00:00', 'home'),
      at('2026-09-17T18:00:00', 'home'), at('2026-09-16T18:00:00', 'home'), // other weekdays
      at('2026-09-15T07:00:00', 'travel'), // same day, wrong hour
      at('2026-06-02T18:00:00', 'travel'), at('2026-06-09T18:00:00', 'travel'), at('2026-06-16T18:00:00', 'travel'), // too old
    ];
    expect(inferGym(hist, gyms, now)).toBe('work');
  });
  it('null with no matching history or unknown gyms', () => {
    expect(inferGym([], gyms, now)).toBeNull();
    expect(inferGym([at('2026-09-15T18:00:00', 'gone')], gyms, now)).toBeNull();
  });
});

describe('plateBreakdown finds the best combination (BR-24)', () => {
  it('90 kg on a 20 kg bar with 25/20/15 plates is 20 + 15 a side', async () => {
    const { plateBreakdown } = await import('@/brain/units');
    const b = plateBreakdown(90, { unit: 'kg', barKg: 20, plates: [25, 20, 15] } as never);
    expect(b.perSide.map(p => ({ value: p.value, count: p.count }))).toEqual([{ value: 20, count: 1 }, { value: 15, count: 1 }]);
    expect(b.exactTotalKg).toBe(90);
  });
  it('uses the fewest plates for a standard set', async () => {
    const { plateBreakdown } = await import('@/brain/units');
    const b = plateBreakdown(140, { unit: 'kg', barKg: 20, plates: [25, 20, 15, 10, 5, 2.5, 1.25] } as never);
    expect(b.perSide.map(p => [p.value, p.count])).toEqual([[25, 2], [10, 1]]);
  });
});

describe('quarter-pound loads (QA-R7-5)', () => {
  it('26.25 lb reads as 26.25, other lb values still at 0.1', async () => {
    const { kgToDisplay, displayToKg } = await import('@/core/units');
    expect(kgToDisplay(displayToKg(26.25, 'lb'), 'lb')).toBe(26.25);
    expect(kgToDisplay(displayToKg(2.25, 'lb'), 'lb')).toBe(2.25);
    expect(kgToDisplay(displayToKg(26.3, 'lb'), 'lb')).toBe(26.3);
    expect(kgToDisplay(displayToKg(102.5, 'lb'), 'lb')).toBe(102.5);
    expect(kgToDisplay(46.4, 'lb')).toBe(102.3);
  });
});

// LT-1: the load menu (docs/LOAD-AWARE-TARGETS.md §2).
import { loadMenu, loggedLoads, jumpPct, type LoggedLoad } from '@/brain/units';
import type { LoggedSet, Session } from '@/core/models';

describe('LT-1 loadMenu', () => {
  const DB = { equipment: 'Dumbbells' };
  const base: UnitsState = {
    ...freshUnits('kg'),
    gyms: [{ id: DEFAULT_GYM_ID, name: 'Home', defaultUnit: 'kg', createdAt: '' }, { id: 'b', name: 'B', defaultUnit: 'kg', createdAt: '' }, { id: 'c', name: 'C', defaultUnit: 'lb', createdAt: '' }],
  };
  const at = (gymId: string | undefined, day: string, s: LoggedSet[]): Session => ({ ...session(day, [{ id: 'db_press', sets: s }]), ...(gymId ? { gymId } : {}) });
  const kgSet = (kg: number, extra: Partial<LoggedSet> = {}): LoggedSet => ({ kg, reps: 10, entered: { value: kg, unit: 'kg' }, ...extra });
  const twice = (gymId: string | undefined, ...kgs: number[]): LoggedLoad[] => loggedLoads([at(gymId, '2026-09-01', kgs.map(k => kgSet(k))), at(gymId, '2026-09-03', kgs.map(k => kgSet(k)))], 'db_press');

  it('A1 rank 1: the exercise profile here with a real source is known, even over a group profile', () => {
    for (const source of ['user', 'suspect_fix', 'escobar_scan', 'escobar_chat'] as const) {
      const units = { ...base, byExercise: { b: { db_press: prof({ source, ladder: [25, 30, 32.5, 35] }) } }, byEquipment: { b: { Dumbbells: prof({ ladder: [5, 10] }) } } };
      const m = loadMenu('db_press', 'b', units, DB, twice('b', 3, 11));
      expect(m).toMatchObject({ confidence: 'known', source: 'exercise', unit: 'kg', rungsKg: [25, 30, 32.5, 35] });
      expect(m.profile).toBe(units.byExercise.b.db_press);
    }
  });
  it('A1 rank 2: the group profile here with a real source is known when the exercise has none (or only a default one)', () => {
    const units = { ...base, byExercise: { b: { db_press: prof({ source: 'default', ladder: [1, 2] }) } }, byEquipment: { b: { Dumbbells: prof({ unit: 'lb', ladder: [10, 20] }) } } };
    const m = loadMenu('db_press', 'b', units, DB, []);
    expect(m).toMatchObject({ confidence: 'known', source: 'group', unit: 'lb' });
    expect(m.rungsKg).toEqual([4.536, 9.072]);
  });
  it('A1 rank 3: the built-in default is assumed with no learned loads, learned with two', () => {
    const none = loadMenu('db_press', 'b', base, DB, []);
    expect(none).toMatchObject({ confidence: 'assumed', source: 'default', unit: 'kg' });
    expect(none.rungsKg).toEqual(loadableValues(defaultProfile('Dumbbells', 'kg')));
    const one = loadMenu('db_press', 'b', base, DB, twice('b', 3));
    expect(one.confidence).toBe('assumed');
    expect(one.rungsKg).toContain(3);
    const two = loadMenu('db_press', 'b', base, DB, twice('b', 3, 11));
    expect(two.confidence).toBe('learned');
    expect(two.rungsKg.slice(0, 7)).toEqual([2, 3, 4, 6, 8, 10, 11]);
    // Loads the default already has count as confirmed rungs too.
    expect(loadMenu('db_press', 'b', base, DB, twice('b', 20, 22.5)).confidence).toBe('learned');
    // A default-source group profile is not known and its ladder is not used.
    const staleGroup = { ...base, byEquipment: { b: { Dumbbells: prof({ source: 'default', ladder: [5, 10] }) } } };
    expect(loadMenu('db_press', 'b', staleGroup, DB, [])).toMatchObject({ confidence: 'assumed', source: 'default' });
  });
  it('A1 rank 4: another gym\'s profile gives the unit only, never its rungs', () => {
    const units = { ...base, byExercise: { c: { db_press: prof({ unit: 'lb', ladder: [7, 14, 21], updatedAt: '2026-09-05' }) }, [DEFAULT_GYM_ID]: { db_press: prof({ unit: 'kg', ladder: [9], updatedAt: '2026-09-01' }) } } };
    const m = loadMenu('db_press', 'b', units, DB, []);
    expect(m).toMatchObject({ confidence: 'assumed', source: 'other_gym', unit: 'lb' });
    expect(m.profile).toEqual(defaultProfile('Dumbbells', 'lb'));
    expect(m.rungsKg).not.toContain(r3(14 * 0.45359237));
    expect(m.rungsKg[0]).toBe(r3(5 * 0.45359237));
  });
  it('A2 a load logged once, flagged, or in the other unit is not a rung; logged twice, it is', () => {
    const rungs = (loads: LoggedLoad[]) => loadMenu('db_press', 'b', base, DB, loads).rungsKg;
    expect(rungs(twice('b', 3))).toContain(3);
    expect(rungs(loggedLoads([at('b', '2026-09-01', [kgSet(3)])], 'db_press'))).not.toContain(3);
    // Twice in one session is still one session.
    expect(rungs(loggedLoads([at('b', '2026-09-01', [kgSet(3), kgSet(3)])], 'db_press'))).not.toContain(3);
    const suspect = loggedLoads([at('b', '2026-09-01', [kgSet(3, { flags: ['unit_suspect'] })]), at('b', '2026-09-03', [kgSet(3, { flags: ['unit_suspect'] })])], 'db_press');
    expect(rungs(suspect)).not.toContain(3);
    const inLb = loggedLoads([at('b', '2026-09-01', [{ kg: 3.175, reps: 10, entered: { value: 7, unit: 'lb' } }]), at('b', '2026-09-03', [{ kg: 3.175, reps: 10, entered: { value: 7, unit: 'lb' } }])], 'db_press');
    expect(rungs(inLb)).toEqual(rungs([]));
    // With no `entered`, the kg was typed in kg (Train.tsx SuspectChip rule).
    expect(rungs(loggedLoads([at('b', '2026-09-01', [{ kg: 3, reps: 8 }]), at('b', '2026-09-03', [{ kg: 3, reps: 8 }])], 'db_press'))).toContain(3);
    // Skipped sets are not loads.
    expect(rungs(loggedLoads([at('b', '2026-09-01', [kgSet(3, { status: 'skipped' })]), at('b', '2026-09-03', [kgSet(3, { status: 'skipped' })])], 'db_press'))).not.toContain(3);
  });
  it('A2 "flagged" is BUG-18\'s held rule: a held set is not a rung, a flagged load lifted again is', () => {
    const rungs = (sessions: Session[]) => loadMenu('db_press', 'b', base, DB, loggedLoads(sessions, 'db_press')).rungsKg;
    // 41 kg × 99: the reps are past the limit and never repeated, so that set is held; one clean session is not two.
    const heldReps = [at('b', '2026-09-01', [kgSet(41, { reps: 99 })]), at('b', '2026-09-03', [kgSet(41)])];
    expect(loggedLoads(heldReps, 'db_press').map(l => !!l.held)).toEqual([true, false]);
    expect(rungs(heldReps)).not.toContain(41);
    // A set to failure is summarised as a copy (rated max); it is still found held.
    const heldFailure = [at('b', '2026-09-01', [kgSet(41, { reps: 99, kind: 'failure' })]), at('b', '2026-09-03', [kgSet(41)])];
    expect(loggedLoads(heldFailure, 'db_press').map(l => !!l.held)).toEqual([true, false]);
    // A load 25 % over the best, stored as implausible, but lifted again: confirmed, so a rung.
    const confirmed = [at('b', '2026-09-01', [kgSet(20)]), at('b', '2026-09-03', [kgSet(41, { flags: ['implausible_load'] })]), at('b', '2026-09-05', [kgSet(41, { flags: ['implausible_load'] })])];
    expect(loggedLoads(confirmed, 'db_press').some(l => l.held)).toBe(false);
    expect(rungs(confirmed)).toContain(41);
    // A typo 41 kg once after 20 kg: held (and once is never a rung anyway).
    expect(loggedLoads([at('b', '2026-09-01', [kgSet(20)]), at('b', '2026-09-03', [kgSet(41)])], 'db_press').map(l => !!l.held)).toEqual([false, true]);
  });
  it('A3 loads at gym A never enter gym B\'s menu; sessions without a gymId count only for the default gym', () => {
    expect(loadMenu('db_press', 'b', base, DB, twice(DEFAULT_GYM_ID, 3, 11)).rungsKg).not.toContain(3);
    expect(loadMenu('db_press', DEFAULT_GYM_ID, base, DB, twice(DEFAULT_GYM_ID, 3, 11)).confidence).toBe('learned');
    // One session at each gym is not two at either.
    const split = loggedLoads([at(DEFAULT_GYM_ID, '2026-09-01', [kgSet(3)]), at('b', '2026-09-03', [kgSet(3)])], 'db_press');
    expect(loadMenu('db_press', 'b', base, DB, split).rungsKg).not.toContain(3);
    expect(loadMenu('db_press', DEFAULT_GYM_ID, base, DB, split).rungsKg).not.toContain(3);
    const undated = twice(undefined, 3, 11);
    expect(loadMenu('db_press', DEFAULT_GYM_ID, base, DB, undated).confidence).toBe('learned');
    expect(loadMenu('db_press', 'b', base, DB, undated).rungsKg).not.toContain(3);
    // The built-in gym deleted: the first gym owns the undated sessions, as resolveProfile falls back.
    const noDefault = { ...base, gyms: base.gyms.slice(1) };
    expect(loadMenu('db_press', 'b', noDefault, DB, undated).rungsKg).toContain(3);
    expect(loadMenu('db_press', 'c', noDefault, DB, undated).rungsKg).not.toContain(3);
  });
  it('loggedLoads keeps only this exercise\'s loaded sets', () => {
    const s = { ...session('2026-09-01', [{ id: 'db_press', sets: [kgSet(12), { reps: 10 }] }, { id: 'squat', sets: [kgSet(100)] }]), gymId: 'b' };
    expect(loggedLoads([s], 'db_press')).toEqual([{ sessionId: s.id, gymId: 'b', kg: 12, entered: { value: 12, unit: 'kg' }, flags: undefined }]);
  });
  it('jumpPct', () => {
    expect(jumpPct(25, 30)).toBe(20);
    expect(jumpPct(120, 110)).toBeCloseTo(-8.333, 3);
    expect(jumpPct(0, 5)).toBe(Infinity);
    expect(jumpPct(0, 0)).toBe(0);
  });
});
const r3 = (v: number) => Math.round(v * 1000) / 1000;

import { mergeAskAnswer } from '@/slices/workout/units';

// LT-4 (§2, §7, add-only): the ask chip's merge rule, on the menus LT-1's loadMenu actually returns.
describe('LT-4 §2 the ask-chip merge rule, on real assumed menus', () => {
  const units: UnitsState = freshUnits('kg');
  const gymId = DEFAULT_GYM_ID;
  it('a stack (Machine/Cable default: step, no ladder) saves step = answer − current', () => {
    const stack = loadMenu('leg_press', gymId, units, { equipment: 'Machine' }, []).profile;
    expect(stack.ladder).toBeUndefined();
    const out = mergeAskAnswer(stack, 40, 45);
    expect(out).toMatchObject({ step: 5, source: 'user' });
  });
  it('a ladder (Dumbbells default) merges around the answer and never leaves a two-rung ladder', () => {
    const dbProfile = loadMenu('db_press', gymId, units, { equipment: 'Dumbbells' }, []).profile;
    expect(dbProfile.ladder!.length).toBeGreaterThan(10);
    const out = mergeAskAnswer(dbProfile, 25, 27);
    // 27 replaces every default rung strictly between 25 and 27 (there is none at 2.5 kg steps); both sides survive.
    expect(out.ladder).toContain(27);
    expect(out.ladder).toContain(25);
    expect(out.ladder!.length).toBeGreaterThan(2);
    expect(out.source).toBe('user');
  });
});
