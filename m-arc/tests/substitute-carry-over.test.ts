// LT-6 (docs/LOAD-AWARE-TARGETS.md §5): wires LT-5's carryOverStart into the no-history branch of
// suggestNext, so a substitute with no history of its own opens on a carried-over estimate from the
// lift it replaced, instead of blindly on startingLoadKg.
import { describe, it, expect } from 'vitest';
import { suggestNext } from '@/brain/progression';
import { defaultProfile } from '@/brain/units';
import { session, sets } from './helpers';

const today = '2026-09-18';
const barbellBench = 'lib_barbell_bench_press';
const dumbbellBench = 'lib_dumbbell_bench_press';
const barbellSquat = 'lib_barbell_back_squat';
const machineSquat = 'lib_hack_squat';
const kettlebellSquat = 'lib_goblet_squat';
const dbProfile = defaultProfile('Dumbbells', 'kg');

describe('LT-6 carry-over start after a swap', () => {
  it('A1: a dumbbell bench swapped in for a barbell bench with history gets "Start around X kg for N"', () => {
    const a = session('2026-09-15', [{ id: barbellBench, sets: sets(60, 8) }]);
    const s = suggestNext([a], dumbbellBench, 'lean', today, 3, [], { equipment: dbProfile, replacedExerciseId: barbellBench });
    expect(s.mode).toBe('start');
    expect(s.confidence).toBe('low');
    // AUD-8 (SCI-08): from 60 x 8's e1RM (80 kg), not from 60 kg read as a max.
    expect(s.kg).toBe(25);
    expect(s.reps).toEqual([7, 7]);
    expect(s.reason).toBe('Start around 25 kg for 7.');
  });

  it('A2: no sourced ratio for the pair gives today\'s startingLoadKg result, unchanged', () => {
    const a = session('2026-09-15', [{ id: barbellSquat, sets: sets(80, 8) }]);
    const withCarryOver = suggestNext([a], machineSquat, 'lean', today, 3, [], { equipment: dbProfile, replacedExerciseId: barbellSquat });
    const withoutSwap = suggestNext([a], machineSquat, 'lean', today, 3, [], { equipment: dbProfile });
    expect(withCarryOver).toEqual(withoutSwap);
  });

  it('A3: the replaced lift has no history keeps today\'s behaviour', () => {
    const withCarryOver = suggestNext([], dumbbellBench, 'lean', today, 3, [], { equipment: dbProfile, replacedExerciseId: barbellBench });
    const withoutSwap = suggestNext([], dumbbellBench, 'lean', today, 3, [], { equipment: dbProfile });
    expect(withCarryOver).toEqual(withoutSwap);
  });

  it('A3: a pattern change (not a real substitute pair) keeps today\'s behaviour', () => {
    const a = session('2026-09-15', [{ id: barbellBench, sets: sets(60, 8) }]);
    const withCarryOver = suggestNext([a], kettlebellSquat, 'lean', today, 3, [], { equipment: dbProfile, replacedExerciseId: barbellBench });
    const withoutSwap = suggestNext([a], kettlebellSquat, 'lean', today, 3, [], { equipment: dbProfile });
    expect(withCarryOver).toEqual(withoutSwap);
  });

  it('A4: once the substitute has its own history, its own history wins', () => {
    const replaced = session('2026-09-10', [{ id: barbellBench, sets: sets(60, 8) }]);
    const own = session('2026-09-15', [{ id: dumbbellBench, sets: sets(20, 8) }]);
    const s = suggestNext([replaced, own], dumbbellBench, 'lean', today, 3, [], { equipment: dbProfile, replacedExerciseId: barbellBench });
    expect(s.mode).not.toBe('start');
    expect(s.kg).toBe(20);
  });
});
