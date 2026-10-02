import { describe, it, expect } from 'vitest';
import { isNextUpCandidate, nextSetField, nextUpCore, targetKgPh, targetRepsPh } from '@/slices/workout/Train';

describe('A1/A9: the next-up set label', () => {
  it('targetKgPh prefers today\'s target, then last time, then bw, then empty', () => {
    expect(targetKgPh({ kg: 60 }, { kg: 55 }, 'kg', 'weighted')).toBe('60');
    expect(targetKgPh(undefined, { kg: 55 }, 'kg', 'weighted')).toBe('55');
    expect(targetKgPh(undefined, undefined, 'kg', 'bodyweight')).toBe('bw');
    expect(targetKgPh(undefined, undefined, 'kg', 'weighted')).toBe('');
  });

  it('targetRepsPh prefers today\'s target, then last time, then empty', () => {
    expect(targetRepsPh({ reps: 8 }, { reps: 10 })).toBe('8');
    expect(targetRepsPh(undefined, { reps: 10 })).toBe('10');
    expect(targetRepsPh(undefined, undefined)).toBe('');
  });

  it('nextUpCore formats a loaded set as "kg unit x reps"', () => {
    expect(nextUpCore('62.5', 'kg', '8')).toBe('62.5 kg × 8');
  });

  it('nextUpCore drops the load for bodyweight or no-load sets', () => {
    expect(nextUpCore('bw', 'kg', '8')).toBe('8 reps');
    expect(nextUpCore('', 'kg', '8')).toBe('8 reps');
  });

  it('nextUpCore is null with nothing to log yet', () => {
    expect(nextUpCore('', 'kg', '')).toBeNull();
  });
});

describe('A1: isNextUpCandidate', () => {
  it('is a candidate when there is something to log and it is not already logged', () => {
    expect(isNextUpCandidate('60 kg × 8', false, undefined)).toBe(true);
  });
  it('is not a candidate once committed', () => {
    expect(isNextUpCandidate('60 kg × 8', true, undefined)).toBe(false);
  });
  it('is not a candidate with nothing to log', () => {
    expect(isNextUpCandidate(null, false, undefined)).toBe(false);
  });
  it('is never a candidate for a warm-up, logged or not', () => {
    expect(isNextUpCandidate('20 kg × 10', false, 'warmup')).toBe(false);
  });
  it('a drop or failure set can still be a candidate', () => {
    expect(isNextUpCandidate('60 kg × 8', false, 'drop')).toBe(true);
    expect(isNextUpCandidate('60 kg × 8', false, 'failure')).toBe(true);
  });
});

describe('A8: nextSetField', () => {
  const fields = ['set1-kg', 'set1-reps', 'set2-kg', 'set2-reps'];
  it('moves to the next field in order', () => {
    expect(nextSetField(fields, 'set1-kg')).toBe('set1-reps');
    expect(nextSetField(fields, 'set1-reps')).toBe('set2-kg');
  });
  it('is null past the last field, so Enter blurs instead', () => {
    expect(nextSetField(fields, 'set2-reps')).toBeNull();
  });
  it('is null for a field not in the list', () => {
    expect(nextSetField(fields, 'nope')).toBeNull();
  });
});
