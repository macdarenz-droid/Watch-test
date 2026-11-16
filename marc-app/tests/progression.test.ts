import { describe, it, expect } from 'vitest';
import { suggestNext } from '@/brain/progression';
import { session, sets } from './helpers';

const ex = 'lib_barbell_bench_press';
const today = '2026-09-18';
describe('progression', () => {
  it('starts light with no history', () => {
    const s = suggestNext([], ex, 'lean', today);
    expect(s.mode).toBe('start');
    expect(s.kg).toBe(20);
  });
  it('bodyweight start has no load', () => {
    expect(suggestNext([], 'lib_push_up', 'lean', today).kg).toBeNull();
  });
  it('adds a rep when under the top of the range', () => {
    const s = suggestNext([session('2026-09-15', [{ id: ex, sets: sets(60, 8) }])], ex, 'lean', today);
    expect(s.mode).toBe('hold');
    expect(s.reps).toEqual([9, 9]);
  });
  it('confirms once at the top, then increases (two for two)', () => {
    const a = session('2026-09-12', [{ id: ex, sets: sets(60, 12) }]);
    expect(suggestNext([a], ex, 'lean', today).mode).toBe('confirm');
    const b = session('2026-09-15', [{ id: ex, sets: sets(60, 12) }]);
    const s = suggestNext([a, b], ex, 'lean', today);
    expect(s.mode).toBe('increase');
    expect(s.kg).toBe(62.5);
  });
  it('never increases on max effort', () => {
    const a = session('2026-09-12', [{ id: ex, sets: sets(60, 12, 'max') }]);
    const b = session('2026-09-15', [{ id: ex, sets: sets(60, 12, 'max') }]);
    expect(suggestNext([a, b], ex, 'lean', today).mode).toBe('hold');
  });
  it('reduces after two under-range max sessions', () => {
    const a = session('2026-09-12', [{ id: ex, sets: sets(60, 4, 'max') }]);
    const b = session('2026-09-15', [{ id: ex, sets: sets(60, 4, 'max') }]);
    const s = suggestNext([a, b], ex, 'lean', today);
    expect(s.mode).toBe('reduce');
    expect(s.kg).toBe(57.5);
  });
  it('asks for effort when ratings are missing', () => {
    const a = session('2026-09-12', [{ id: ex, sets: sets(60, 8, null) }]);
    const b = session('2026-09-15', [{ id: ex, sets: sets(60, 8, null) }]);
    expect(suggestNext([a, b], ex, 'lean', today).mode).toBe('confirm_effort');
  });
  it('re-entry after a long gap', () => {
    const a = session('2026-07-01', [{ id: ex, sets: sets(60, 12) }]);
    const s = suggestNext([a], ex, 'lean', today);
    expect(s.mode).toBe('reentry');
    expect(s.kg).toBe(60);
  });
  it('a clearly declining lift gets an easier week at the same load', () => {
    const days = ['2026-08-20', '2026-08-24', '2026-08-27', '2026-08-31', '2026-09-03', '2026-09-07', '2026-09-10', '2026-09-14', '2026-09-17'];
    const s = days.map((d, i) => session(d, [{ id: ex, sets: sets(70 - i * 2.5, 9, i === 8 ? 'max' : 'ideal') }]));
    const r = suggestNext(s, ex, 'lean', today);
    expect(r.mode).toBe('plateau');
    expect(r.kg).toBe(50);
    expect(r.reason).toMatch(/slipped/);
  });
  it('duration exercises add time', () => {
    const a = session('2026-09-15', [{ id: 'lib_plank', sets: [{ durationSec: 40, effort: 'ideal' }] }]);
    const s = suggestNext([a], 'lib_plank', 'lean', today);
    expect(s.mode).toBe('duration');
    expect(s.sets[0]!.durationSec).toBe(45);
  });
});
