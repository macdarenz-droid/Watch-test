import { describe, it, expect } from 'vitest';
import { suggestNext } from '@/brain/progression';
import { GOALS, GOAL_BY_ID, type GoalId } from '@/data/goals';
import { session, sets } from './helpers';

const mainLift = 'lib_barbell_bench_press'; // horizontal_push -> role: main
const accessory = 'lib_dumbbell_lateral_raise'; // shoulder_abduction -> role: accessory
const bodyweight = 'lib_push_up';
const timed = 'lib_plank';
const today = '2026-09-18';

describe('goal policy object', () => {
  it('every goal has an accessory range, a rest suggestion and templates', () => {
    for (const g of GOALS) {
      expect(g.accessoryReps[0]).toBeGreaterThan(0);
      expect(g.accessoryReps[1]).toBeGreaterThanOrEqual(g.accessoryReps[0]);
      expect(g.restDefaultSec).toBeGreaterThan(0);
      expect(g.templates.length).toBeGreaterThan(0);
      expect(g.failureShareCap).toBeGreaterThan(0);
    }
  });

  for (const goal of GOALS.map(g => g.id)) {
    describe(`goal: ${goal}`, () => {
      const g = GOAL_BY_ID[goal];

      it('a main lift is targeted with the main rep range', () => {
        const s = suggestNext([session('2026-09-15', [{ id: mainLift, sets: sets(60, g.mainReps[0], 'ideal') }])], mainLift, goal, today);
        expect(s.reps?.[1]).toBeLessThanOrEqual(g.mainReps[1]);
        expect(s.reps?.[0]).toBeGreaterThanOrEqual(g.mainReps[0]);
      });

      it('an accessory is targeted with the accessory rep range, not the main range', () => {
        const s = suggestNext([], accessory, goal, today);
        expect(s.reps).toEqual(g.accessoryReps);
      });

      it('bodyweight exercises start with no load', () => {
        expect(suggestNext([], bodyweight, goal, today).kg).toBeNull();
      });

      it('timed holds start around 20-30s', () => {
        const s = suggestNext([], timed, goal, today);
        expect(s.mode).toBe('start');
        expect(s.sets[0]?.durationSec).toBe(30);
      });
    });
  }

  it('lean/growth (range starts at 6+): reps-under-range step-down still fires', () => {
    const a = session('2026-09-12', [{ id: mainLift, sets: sets(60, 4, 'max') }]);
    const b = session('2026-09-15', [{ id: mainLift, sets: sets(60, 4, 'max') }]);
    expect(suggestNext([a, b], mainLift, 'lean', today).mode).toBe('reduce');
  });

  it('strength (range starts at 1): reps-under-range can never fire, so e1RM decline steps down instead', () => {
    // topReps=1 is never "below" a range that starts at 1, so the old rule could never trigger here.
    const a = session('2026-09-09', [{ id: mainLift, sets: sets(100, 3, 'max') }]);
    const b = session('2026-09-12', [{ id: mainLift, sets: sets(97.5, 2, 'max') }]);
    const c = session('2026-09-15', [{ id: mainLift, sets: sets(95, 1, 'max') }]);
    const s = suggestNext([a, b, c], mainLift, 'strength', today);
    expect(s.mode).toBe('reduce');
  });

  it('strength goal does not reduce when e1RM is flat or rising at max effort', () => {
    const a = session('2026-09-09', [{ id: mainLift, sets: sets(100, 3, 'max') }]);
    const b = session('2026-09-12', [{ id: mainLift, sets: sets(102.5, 3, 'max') }]);
    const c = session('2026-09-15', [{ id: mainLift, sets: sets(105, 3, 'max') }]);
    const s = suggestNext([a, b, c], mainLift, 'strength', today);
    expect(s.mode).not.toBe('reduce');
  });
});
