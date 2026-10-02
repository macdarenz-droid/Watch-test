// BUG-15 review item 1: accepting a lighter week right after one (no session since) keeps the
// original pre-week base by reaching the window back to the first week's start.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { session, sets } from './helpers';

describe('acceptDeload chains back-to-back lighter weeks (BUG-15)', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 8, 21, 12, 0)); vi.resetModules(); });
  afterEach(() => { vi.useRealTimers(); });
  const ex = 'lib_barbell_bench_press';
  const week1 = { startDay: '2026-09-14', endDay: '2026-09-20', reason: 'first', setFactor: 0.6, loadFactor: 0.9 };
  const pre = session('2026-09-11', [{ id: ex, sets: sets(72.5, 8, 'ideal', 3) }]);
  const light = session('2026-09-16', [{ id: ex, sets: sets(65.5, 8, 'easy', 2) }]);

  async function accept(sessions: ReturnType<typeof session>[]) {
    const store = await import('@/core/store');
    const { freshState } = await import('@/core/models');
    store.replaceState({ ...freshState(), sessions, deload: week1 });
    (await import('@/slices/coach/coach')).acceptDeload('second');
    return store.state.value.deload!;
  }

  it('no session since the first week: the window starts at the first week, seven more days', async () => {
    const d = await accept([pre, light]);
    expect([d.startDay, d.endDay]).toEqual(['2026-09-14', '2026-09-27']);
  });
  it('a session since the first week: a fresh seven-day window', async () => {
    const d = await accept([pre, light, session('2026-09-21', [{ id: ex, sets: sets(72.5, 8, 'ideal', 3) }])]);
    expect([d.startDay, d.endDay]).toEqual(['2026-09-21', '2026-09-27']);
  });

  it('review round 2: the saved week carries 0.6 sets and 0.9 load, and a 5-set lift gets 3 sets at 0.9 ×', async () => {
    const five = session('2026-09-18', [{ id: ex, sets: sets(80, 8, 'ideal', 5) }]);
    const store = await import('@/core/store');
    const { freshState } = await import('@/core/models');
    store.replaceState({ ...freshState(), sessions: [five], deload: null });
    (await import('@/slices/coach/coach')).acceptDeload('test');
    const d = store.state.value.deload!;
    expect([d.setFactor, d.loadFactor]).toEqual([0.6, 0.9]);
    const { suggestNext } = await import('@/brain/progression');
    const s = suggestNext([five], ex, 'lean', '2026-09-21', 5, [], { deload: d, lastDeload: d });
    expect([s.kg, s.sets.length]).toEqual([72, 3]);
  });
});
