import { describe, it, expect } from 'vitest';
import { sessionEmphasis, toPercents, weeklyMuscleSets, trainingLevels } from '@/brain/exposure';
import { session, sets } from './helpers';

describe('exposure', () => {
  it('splits emphasis across primary and secondary muscles and sums to 100', () => {
    const { percents } = sessionEmphasis([{ exerciseId: 'lib_machine_chest_press', name: 'Machine Chest Press', sets: sets(50, 8) }]);
    const total = Object.values(percents).reduce((a, b) => a + (b ?? 0), 0);
    expect(total).toBe(100);
    expect(percents.chest!).toBeGreaterThan(percents.triceps ?? 0);
  });
  it('largest remainder keeps 100', () => {
    expect(Object.values(toPercents({ chest: 1, triceps: 1, front_delts: 1 })).reduce((a, b) => a + b!, 0)).toBe(100);
  });
  it('counts secondary work as half a set per week', () => {
    const s = session('2026-09-15', [{ id: 'lib_machine_chest_press', sets: sets(50, 8, 'ideal', 4) }]);
    const weeks = weeklyMuscleSets([s], '2026-09-18', 2);
    expect(weeks[0]!.sets.chest).toBe(4);
    expect(weeks[0]!.sets.triceps).toBe(2);
    expect(weeks[1]!.sets.chest).toBeUndefined();
  });
  it('levels start at New and grow with training', () => {
    const many = Array.from({ length: 20 }, (_, i) => session(`2026-08-${String(i + 1).padStart(2, '0')}`, [{ id: 'lib_lat_pulldown', sets: sets(50, 10, 'max', 4) }]));
    const levels = trainingLevels(many);
    expect(levels.lats.levelIndex).toBeGreaterThan(1);
    expect(levels.calves.level).toBe('New');
  });
});
