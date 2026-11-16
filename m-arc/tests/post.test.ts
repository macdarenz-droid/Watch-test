import { describe, it, expect } from 'vitest';
import { durationDriftInsight, effortMixInsight, postSessionInsights, recordsInsight, restAndDensityInsight } from '@/brain/coach/post';
import { session, sessionAt, sets } from './helpers';

const bench = 'lib_barbell_bench_press';

describe('recordsInsight', () => {
  it('reports a record set in the current session', () => {
    const prior = session('2026-09-01', [{ id: bench, sets: sets(60, 8, 'ideal') }]);
    const current = session('2026-09-05', [{ id: bench, sets: sets(65, 8, 'ideal') }]);
    const out = recordsInsight(current, [prior]);
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]!.cadence).toBe('post');
  });
  it('nothing on a baseline (first-ever) session', () => {
    const current = session('2026-09-01', [{ id: bench, sets: sets(60, 8, 'ideal') }]);
    expect(recordsInsight(current, [])).toHaveLength(0);
  });
});

describe('effortMixInsight', () => {
  it('needs 4+ rated sets', () => {
    const s = session('2026-09-01', [{ id: bench, sets: sets(60, 8, 'ideal', 2) }]);
    expect(effortMixInsight(s)).toBeNull();
  });
  it('flags a session over 50% max effort', () => {
    const s = session('2026-09-01', [{ id: bench, sets: sets(60, 8, 'max', 4) }]);
    const i = effortMixInsight(s)!;
    expect(i.title).toContain('max effort');
  });
  it('says nothing alarming for a balanced mix', () => {
    const s = session('2026-09-01', [{ id: bench, sets: [...sets(60, 8, 'easy', 1), ...sets(60, 8, 'ideal', 2), ...sets(60, 8, 'max', 1)] }]);
    const i = effortMixInsight(s)!;
    expect(i.action).toBe('No change needed.');
  });
});

describe('restAndDensityInsight', () => {
  it('flags short rest with falling reps on a compound', () => {
    const s = session('2026-09-01', [{ id: bench, sets: [
      { kg: 100, reps: 8, effort: 'ideal', restSec: 60 },
      { kg: 100, reps: 8, effort: 'ideal', restSec: 60 },
      { kg: 100, reps: 6, effort: 'ideal', restSec: 60 },
      { kg: 100, reps: 5, effort: 'ideal', restSec: 60 },
    ] }]);
    const i = restAndDensityInsight(s, false);
    expect(i).not.toBeNull();
  });
  it('says nothing when rest is already long enough', () => {
    const s = session('2026-09-01', [{ id: bench, sets: [
      { kg: 100, reps: 8, effort: 'ideal', restSec: 150 },
      { kg: 100, reps: 8, effort: 'ideal', restSec: 150 },
      { kg: 100, reps: 7, effort: 'ideal', restSec: 150 },
      { kg: 100, reps: 6, effort: 'ideal', restSec: 150 },
    ] }]);
    expect(restAndDensityInsight(s, false)).toBeNull();
  });
});

describe('restAndDensityInsight per lift (BR-20)', () => {
  it('a light accessory after a heavy lift does not read as reps falling', () => {
    const s = session('2026-09-01', [
      { id: bench, sets: [{ kg: 100, reps: 5, effort: 'ideal', restSec: 60 }, { kg: 100, reps: 5, effort: 'ideal', restSec: 60 }, { kg: 100, reps: 5, effort: 'ideal', restSec: 60 }] },
      { id: 'lib_cable_fly', sets: [{ kg: 20, reps: 15, effort: 'ideal', restSec: 60 }, { kg: 20, reps: 15, effort: 'ideal', restSec: 60 }, { kg: 20, reps: 15, effort: 'ideal', restSec: 60 }] },
    ]);
    expect(restAndDensityInsight(s, false)).toBeNull();
  });
  it('names the drop within one main lift', () => {
    const s = session('2026-09-01', [{ id: bench, sets: [8, 8, 7, 5].map(reps => ({ kg: 100, reps, effort: 'ideal' as const, restSec: 60 })) }]);
    expect(restAndDensityInsight(s, false)!.noticed).toContain('fell from 8 on the first set to 5 on the last');
  });
});

describe('strength record text (BR-21)', () => {
  it('rounds the previous estimate', () => {
    const prior = session('2026-08-01', [{ id: bench, sets: [{ kg: 80, reps: 7, effort: 'max' }] }]);
    const now = session('2026-09-01', [{ id: bench, sets: [{ kg: 85, reps: 8, effort: 'max' }] }]);
    const rec = recordsInsight(now, [prior]).find(i => i.id.endsWith(':strength'))!;
    expect(rec.noticed).toMatch(/up from about \d+ kg\.$/);
  });
});

describe('durationDriftInsight', () => {
  it('needs 5 prior sessions of the same split', () => {
    const s = session('2026-09-18', [{ id: bench, sets: sets(60, 8) }]);
    expect(durationDriftInsight(s, [])).toBeNull();
  });
  it('flags a session 20%+ longer than the usual median', () => {
    const prior = Array.from({ length: 5 }, (_, i) => sessionAt(`2026-09-0${i + 1}T17:00:00.000Z`, `2026-09-0${i + 1}T18:00:00.000Z`, [{ id: bench, sets: sets(60, 8) }]));
    const long = sessionAt('2026-09-18T17:00:00.000Z', '2026-09-18T19:00:00.000Z', [{ id: bench, sets: sets(60, 8) }]);
    expect(durationDriftInsight(long, prior)).not.toBeNull();
  });
});

describe('postSessionInsights', () => {
  it('skips rest and duration rows for a retro (non-timing-trusted) session', () => {
    const s = session('2026-09-18', [{ id: bench, sets: [
      { kg: 100, reps: 8, effort: 'ideal', restSec: 60 },
      { kg: 100, reps: 5, effort: 'ideal', restSec: 60 },
      { kg: 100, reps: 8, effort: 'ideal', restSec: 60 },
      { kg: 100, reps: 5, effort: 'ideal', restSec: 60 },
    ] }]);
    s.logging.timingTrusted = false;
    const out = postSessionInsights({ session: s, priorSessions: [], custom: [], isStrengthGoal: false });
    expect(out.some(i => i.id.startsWith('post:rest') || i.id.startsWith('post:duration'))).toBe(false);
  });
});
