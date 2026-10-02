import { describe, it, expect } from 'vitest';
import { recordsInsight } from '@/brain/coach/post';
import { coachInsights } from '@/brain/coach/rules';
import { workingLoadTarget } from '@/brain/coach/pre';
import { exerciseHistory } from '@/brain/history';
import { emptySchedule } from '@/core/models';
import { baseCoachExtras, session, sets } from './helpers';

const bench = 'lib_barbell_bench_press';
const LB = 0.45359237;

describe('coach text in pounds (QA-R3b-2, QA-R3b-5)', () => {
  it('a heaviest-load record says what it beat in lb', () => {
    const prior = session('2026-09-01', [{ id: bench, sets: sets(225 * LB, 5, 'ideal') }]);
    const current = session('2026-09-05', [{ id: bench, sets: sets(230 * LB, 5, 'ideal') }]);
    const heaviest = recordsInsight(current, [prior], [], 'lb').find(i => i.id.endsWith(':heaviest'))!;
    expect(heaviest.noticed).toContain('up from 225 lb');
    expect(heaviest.noticed).not.toMatch(/102\.\d/);
  });
  it('a body weight typed in lb is read back in lb', () => {
    const ctx = { sessions: [], splits: [], schedule: emptySchedule(), custom: [], today: '2026-09-18', now: new Date('2026-09-18T12:00:00Z').getTime(), ...baseCoachExtras, unit: 'lb' as const };
    const out = coachInsights({ ...ctx, profileHistory: [{ at: '2026-09-17T08:00:00Z', field: 'bodyWeightKg', from: 182 * LB, to: 180 * LB, source: 'user' }] });
    const w = out.find(i => i.id.startsWith('profile-changed:weight'))!;
    expect(w.title).toBe('Weight updated to 180 lb');
    expect(w.noticed).toContain('down 2 lb');
  });
  it('the fallback load target speaks lb', () => {
    const hist = exerciseHistory(['2026-08-01', '2026-08-08', '2026-08-15', '2026-08-22'].map((d, i) => session(d, [{ id: bench, sets: sets(80 + i * 2.5, 5, 'ideal') }])), bench);
    const t = workingLoadTarget(hist, bench, 'Bench', 8, 'lb')!;
    expect(t.action).toMatch(/lb\.$/);
    expect(t.noticed).not.toContain(' kg');
  });
});
