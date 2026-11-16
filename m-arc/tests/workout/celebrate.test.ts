import { describe, it, expect } from 'vitest';
import { celebrateOnce } from '@/slices/workout/celebrate';

describe('F9: celebrateOnce', () => {
  it('is true the first time a key is seen, false after', () => {
    const key = `session-${Math.random()}|lib_barbell_bench_press`;
    expect(celebrateOnce(key)).toBe(true);
    expect(celebrateOnce(key)).toBe(false);
    expect(celebrateOnce(key)).toBe(false);
  });

  it('tracks each key independently', () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(celebrateOnce(a)).toBe(true);
    expect(celebrateOnce(b)).toBe(true);
    expect(celebrateOnce(a)).toBe(false);
  });
});
