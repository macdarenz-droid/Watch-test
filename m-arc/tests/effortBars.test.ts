import { describe, it, expect } from 'vitest';
import { summarizeSets } from '@/brain/history';
import { effortSplit, effortUsesSets, fmtTotal } from '@/ui/EffortBars';
import type { LoggedSet } from '@/core/models';

const set = (kg: number, reps: number, effort?: LoggedSet['effort'], kind?: LoggedSet['kind']): LoggedSet => ({ kg, reps, effort, kind });
const noBw = () => null;

describe('effortSplit (O4)', () => {
  it('splits a weighted session\'s kg (load × reps) by effort', () => {
    const h = [summarizeSets('s1', '2024-01-01', [set(100, 5, 'easy'), set(100, 5, 'ideal')])];
    const p = effortSplit(h, 'weighted', noBw)[0]!;
    expect(p).toEqual({ day: '2024-01-01', easy: 500, ideal: 500, max: 0, unrated: 0 });
  });

  it('counts a set taken to failure as max, even without an explicit effort tag', () => {
    const h = [summarizeSets('s1', '2024-01-01', [set(100, 5, undefined, 'failure'), set(100, 5, 'max')])];
    const p = effortSplit(h, 'weighted', noBw)[0]!;
    // Both sets land in max: the explicit one and the failure set (F2).
    expect(p.max).toBe(1000);
    expect(p.easy).toBe(0);
    expect(p.ideal).toBe(0);
  });

  it('shows sets with no effort tag as unrated, separate from the rated buckets', () => {
    const h = [summarizeSets('s1', '2024-01-01', [set(50, 10), set(50, 10, 'ideal')])];
    const p = effortSplit(h, 'weighted', noBw)[0]!;
    expect(p.unrated).toBe(500);
    expect(p.ideal).toBe(500);
  });

  it('uses the F13 effective load for a bodyweight set when a body weight is available', () => {
    // A +10 kg pull-up; bwAt folds in body weight × share, as effectiveLoadKg would for this caller.
    const h = [summarizeSets('s1', '2024-01-01', [set(10, 5, 'ideal')])];
    const p = effortSplit(h, 'bodyweight', (_day, added) => 78 + added)[0]!;
    expect(p.ideal).toBe((78 + 10) * 5);
  });

  it('counts a bodyweight set as 0 kg when no body weight is saved (same rule as Stats)', () => {
    const h = [summarizeSets('s1', '2024-01-01', [set(10, 5, 'ideal')])];
    const p = effortSplit(h, 'bodyweight', noBw)[0]!;
    expect(p.ideal).toBe(0);
  });

  it('counts working sets, not kg, for a timed exercise', () => {
    const sets = [{ durationSec: 30, effort: 'easy' }, { durationSec: 45, effort: 'max' }] as LoggedSet[];
    const h = [summarizeSets('s1', '2024-01-01', sets)];
    expect(effortUsesSets(h, 'duration')).toBe(true);
    const p = effortSplit(h, 'duration', noBw)[0]!;
    expect(p).toEqual({ day: '2024-01-01', easy: 1, ideal: 0, max: 1, unrated: 0 });
  });

  it('a conditioning move logged as kg × reps (a loaded carry) still splits by kg', () => {
    const h = [summarizeSets('s1', '2024-01-01', [set(40, 8, 'ideal')])];
    expect(effortUsesSets(h, 'conditioning')).toBe(false);
    expect(effortSplit(h, 'conditioning', noBw)[0]!.ideal).toBe(320);
  });

  it("QA13-2: a Farmer's Carry (kg and distance/time, no reps) counts sets, not a 0 kg stub", () => {
    const carry = (kg: number): LoggedSet[] => [{ kg, distanceM: 20, effort: 'ideal' } as LoggedSet];
    const h = [
      summarizeSets('s1', '2024-01-01', carry(32)),
      summarizeSets('s2', '2024-01-08', carry(36)),
      summarizeSets('s3', '2024-01-15', carry(40)),
    ];
    expect(effortUsesSets(h, 'conditioning')).toBe(true);
    const points = effortSplit(h, 'conditioning', noBw);
    expect(points.every(p => p.ideal === 1)).toBe(true);
    expect(points.some(p => p.easy + p.ideal + p.max + p.unrated > 0)).toBe(true);
  });

  it('a conditioning move with no kg (distance/time only) counts sets', () => {
    const sets = [{ distanceM: 100, effort: 'ideal' }] as LoggedSet[];
    const h = [summarizeSets('s1', '2024-01-01', sets)];
    expect(effortUsesSets(h, 'conditioning')).toBe(true);
    expect(effortSplit(h, 'conditioning', noBw)[0]!.ideal).toBe(1);
  });

  it('QA13-7: the owner\'s Leg Press reference sessions give the plan\'s exact splits and totals', () => {
    const h = [
      summarizeSets('s1', '2026-08-25', [set(40, 15, 'easy'), set(50, 15, 'easy'), set(60, 15, 'ideal')]),
      summarizeSets('s2', '2026-09-03', [set(40, 15, 'easy'), set(50, 15, 'ideal'), set(70, 10, 'max')]),
      summarizeSets('s3', '2026-09-19', [set(60, 15, 'easy'), set(60, 15, 'ideal'), set(60, 15, 'max')]),
      summarizeSets('s4', '2026-09-26', [set(60, 15, 'easy'), set(55, 15, 'ideal'), set(55, 12, 'ideal')]),
    ];
    const points = effortSplit(h, 'weighted', noBw);
    expect(points).toEqual([
      { day: '2026-08-25', easy: 1350, ideal: 900, max: 0, unrated: 0 },
      { day: '2026-09-03', easy: 600, ideal: 750, max: 700, unrated: 0 },
      { day: '2026-09-19', easy: 900, ideal: 900, max: 900, unrated: 0 },
      { day: '2026-09-26', easy: 900, ideal: 1485, max: 0, unrated: 0 },
    ]);
    const totals = points.map(p => p.easy + p.ideal + p.max + p.unrated);
    expect(totals).toEqual([2250, 2050, 2700, 2385]);
  });

  it('totals across every bucket equal the session\'s own load × reps sum', () => {
    const raw: Array<[number, number, LoggedSet['effort']]> = [[50, 5, 'easy'], [60, 5, 'ideal'], [70, 5, 'max'], [70, 5, 'ideal']];
    const h = [summarizeSets('s1', '2024-01-01', raw.map(([kg, reps, effort]) => set(kg, reps, effort)))];
    const p = effortSplit(h, 'weighted', noBw)[0]!;
    const expected = raw.reduce((a, [kg, reps]) => a + kg * reps, 0);
    expect(p.easy + p.ideal + p.max + p.unrated).toBe(expected);
  });
});

describe('fmtTotal (OBS-TONNE)', () => {
  it('a 5-figure lb total is not shown as tonnes — "t" is a metric tonne, only right for kg', () => {
    expect(fmtTotal(22_046, 'lb')).toBe('22,046');
    expect(fmtTotal(22_046, 'lb')).not.toContain('t');
  });
  it('a 5-figure kg total still shows as tonnes', () => {
    expect(fmtTotal(12_000, 'kg')).toBe('12t');
  });
  it('sets are rounded, not thousands-grouped', () => {
    expect(fmtTotal(12_345, 'sets')).toBe('12345');
  });
});
