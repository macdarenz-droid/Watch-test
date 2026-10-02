/** O4: lift_trend's per-session effort split must never carry a body-weight-derived number when sharing.body is off (BODY_KEYS/BODY_FACT, escobar/loop.ts). */
import { describe, it, expect } from 'vitest';
import type { AppState } from '@/core/models';
import { summarize } from '@/escobar/tools/show';
import { ctxOf, emptyState, TODAY } from './fixtures';
import { session, sets } from '../helpers';

const PU = 'lib_pull_up'; // bodyweight, share 1 (src/brain/bodyweight.ts)

const stateWith = (bodySharing: boolean): AppState => {
  const s = emptyState();
  return {
    ...s,
    sessions: [session(TODAY, [{ id: PU, sets: sets(10, 5, 'ideal', 1) }])],
    weightLog: [{ day: '2026-09-01', kg: 80 }],
    escobar: { ...s.escobar, sharing: { health: false, body: bodySharing } },
  };
};

describe('O4: lift_trend effort split', () => {
  it('a bodyweight lift counts its sets as 0 kg (no body weight reaches the model) when sharing.body is off', () => {
    const off = summarize('lift_trend', { exerciseId: PU }, ctxOf(stateWith(false))) as { effort: Array<{ ideal: number }> };
    expect(off.effort.length).toBeGreaterThan(0);
    expect(off.effort.every(e => e.ideal === 0)).toBe(true);
  });

  it('the same lift shows its real, body-weight-derived load once sharing.body is on', () => {
    const on = summarize('lift_trend', { exerciseId: PU }, ctxOf(stateWith(true))) as { effort: Array<{ ideal: number }> };
    // +10 kg pull-up at 80 kg body weight, share 1: (80 + 10) * 5 reps = 450.
    expect(on.effort.some(e => e.ideal === 450)).toBe(true);
  });

  it('a weighted lift (no body weight involved) is unaffected by the sharing toggle', () => {
    const s = emptyState();
    const withWeighted = (bodySharing: boolean): AppState => ({
      ...s,
      sessions: [session(TODAY, [{ id: 'lib_barbell_bench_press', sets: sets(60, 5, 'ideal', 1) }])],
      escobar: { ...s.escobar, sharing: { health: false, body: bodySharing } },
    });
    const off = summarize('lift_trend', { exerciseId: 'lib_barbell_bench_press' }, ctxOf(withWeighted(false))) as { effort: Array<{ ideal: number }> };
    const on = summarize('lift_trend', { exerciseId: 'lib_barbell_bench_press' }, ctxOf(withWeighted(true))) as { effort: Array<{ ideal: number }> };
    expect(off.effort.some(e => e.ideal === 300)).toBe(true);
    expect(on.effort.some(e => e.ideal === 300)).toBe(true);
  });
});
