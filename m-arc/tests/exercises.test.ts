import { describe, it, expect } from 'vitest';
import { findExercise, findExerciseExact } from '@/core/exercises';

describe('findExercise (ST-13)', () => {
  it('an ambiguous fragment resolves to nothing', () => {
    expect(findExercise('Press')).toBeUndefined();
  });
  it('plurals and aliases still resolve', () => {
    expect(findExercise('Pull Ups')).toBeDefined();
    expect(findExercise('lib_barbell_bench_press')!.id).toBe('lib_barbell_bench_press');
  });
  it('findExerciseExact never guesses from a substring', () => {
    expect(findExerciseExact('Machine Chest Press')?.id).toBe('lib_machine_chest_press');
    expect(findExerciseExact('Chest Pres')).toBeUndefined();
  });
});

describe('a longer name is not filed under the library name it contains (QA-R3b-3)', () => {
  it('extra movement words make it a different exercise', () => {
    expect(findExercise('Hack Squat Calf Raise')?.id).not.toBe(findExercise('Hack Squat')?.id);
    expect(findExercise('Hack Squat Calf')?.id).not.toBe(findExercise('Hack Squat')?.id);
  });
  it('extra words that name no movement still match', () => {
    expect(findExercise('Hack Squat heavy')?.id).toBe(findExercise('Hack Squat')?.id);
  });
});

describe('the heavy main-lift damage floor (QA-R7-2, QA-R7-3)', () => {
  it('comes from DAMAGE_HEAVY_MAIN, so changing it changes the model', async () => {
    const { vi } = await import('vitest');
    vi.resetModules();
    vi.doMock('@/data/recovery', async orig => ({ ...(await orig<typeof import('@/data/recovery')>()), DAMAGE_HEAVY_MAIN: 1.5 }));
    const { setDamage } = await import('@/core/exercises');
    expect(setDamage({ id: 'x', name: 'Bench', role: 'main' }, 5)).toBe(1.5);
    vi.doUnmock('@/data/recovery');
    vi.resetModules();
  });
});

describe('equipment words in legacy names (QA2-FC-7)', () => {
  it('a name that adds only an equipment word still maps to the library exercise', async () => {
    const { findExerciseWithEquipment } = await import('@/core/exercises');
    const pairs: Array<[string, string, string]> = [['Leg Press Machine', 'Machine', 'Leg Press'], ['Cable Lat Pulldown', 'Cable', 'Lat Pulldown'], ['Seated Leg Curl Machine', 'Machine', 'Seated Leg Curl'], ['Hip Thrust Barbell', 'Barbell', 'Hip Thrust'], ['Cable Triceps Pushdown', 'Cable', 'Triceps Pushdown']];
    for (const [name, eq, want] of pairs) expect(findExerciseWithEquipment(name, eq)?.name, name).toMatch(new RegExp(want, 'i'));
    // A second movement still means a different exercise (QA-R3b-3).
    expect(findExercise('Hack Squat Calf Raise')?.id).not.toBe(findExercise('Hack Squat')?.id);
  });
});

describe('QA3-2: an import never merges into a different-equipment lift', () => {
  it('a multi-word equipment name (Leg Press) is still a real movement word (QA-R3b-3)', () => {
    expect(findExercise('Leg Press Hack Squat')?.id).not.toBe(findExercise('Hack Squat')?.id);
  });
  it('a named lift merges only when its gear word agrees with the target equipment', async () => {
    const { findExerciseWithEquipment } = await import('@/core/exercises');
    // Each of these names a gear word that disagrees with the only library match's equipment.
    expect(findExerciseWithEquipment('Dumbbell Skull Crusher', 'Dumbbell')?.id).not.toBe(findExercise('Skull Crusher')?.id);
    expect(findExerciseWithEquipment('Cable Hammer Curl', 'Cable')?.id).not.toBe(findExercise('Hammer Curl')?.id);
    expect(findExerciseWithEquipment('Kettlebell Sumo Deadlift', 'Kettlebell')?.id).not.toBe(findExercise('Sumo Deadlift')?.id);
    expect(findExerciseWithEquipment('Smith Machine Romanian Deadlift', 'Smith Machine')?.id).not.toBe(findExercise('Romanian Deadlift')?.id);
  });
});

describe('QA3-2b: the gear check exempts an exact library or custom match', () => {
  it('an exact alias with a gear word in its own text still resolves (the gear check is for fuzzy matches only)', async () => {
    const { findExerciseWithEquipment } = await import('@/core/exercises');
    expect(findExerciseWithEquipment('bar pushdown', 'Cable')?.id).toBe('lib_straight_bar_triceps_pushdown');
    expect(findExerciseWithEquipment('straight bar pressdown', 'Cable')?.id).toBe('lib_straight_bar_triceps_pushdown');
    expect(findExerciseWithEquipment('landmine t bar row', 'Landmine')?.id).toBe('lib_landmine_row');
  });
});
