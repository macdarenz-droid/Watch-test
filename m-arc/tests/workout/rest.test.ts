import { describe, it, expect } from 'vitest';
import { restBarKeyframes } from '@/slices/workout/Train';

describe('I1: restBarKeyframes', () => {
  it('starts empty and always ends full', () => {
    const [from, to] = restBarKeyframes(90_000, 90);
    expect(from).toBe('translateX(-100%)');
    expect(to).toBe('translateX(0)');
  });

  it('reflects a rest already half elapsed', () => {
    const [from] = restBarKeyframes(45_000, 90);
    expect(from).toBe('translateX(-50%)');
  });

  it('is full (no jump) once time is up', () => {
    const [from] = restBarKeyframes(0, 90);
    expect(from).toBe('translateX(0%)');
  });

  it('never divides by zero for a zero-length rest', () => {
    const [from, to] = restBarKeyframes(0, 0);
    expect(from).toBe('translateX(0%)');
    expect(to).toBe('translateX(0)');
  });
});
