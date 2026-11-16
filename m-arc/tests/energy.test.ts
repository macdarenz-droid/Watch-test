import { describe, it, expect } from 'vitest';
import { age, bmrKcalPerDay, grossKcalPerMin, sessionEnergy, energyFromHealthConnect } from '@/brain/energy';
import type { Profile } from '@/core/models';

const full: Profile = { name: '', bodyWeightKg: 80, heightCm: 180, sex: 'male', birthYear: 1990 };
const today = '2026-01-01';

describe('age', () => {
  it('is null without a birth year', () => expect(age({ name: '' }, today)).toBeNull());
  it('computes from birth year', () => expect(age(full, today)).toBe(36));
});

describe('bmrKcalPerDay', () => {
  it('is null with an incomplete profile', () => expect(bmrKcalPerDay({ name: '' }, today)).toBeNull());
  it('is higher for male than female at the same stats', () => {
    const male = bmrKcalPerDay(full, today)!;
    const female = bmrKcalPerDay({ ...full, sex: 'female' }, today)!;
    expect(male).toBeGreaterThan(female);
  });
});

describe('grossKcalPerMin', () => {
  it('is null with an incomplete profile', () => expect(grossKcalPerMin(140, { name: '' }, today)).toBeNull());
  it('rises with bpm and clamps at 0', () => {
    const low = grossKcalPerMin(70, full, today)!;
    const high = grossKcalPerMin(160, full, today)!;
    expect(high).toBeGreaterThan(low);
    expect(grossKcalPerMin(0, full, today)).toBeGreaterThanOrEqual(0);
  });
});

describe('sessionEnergy', () => {
  const series: Array<[number, number]> = Array.from({ length: 60 }, (_, i) => [i * 5, 130]);
  it('is null with an incomplete profile', () => {
    expect(sessionEnergy({ series, profile: { name: '' }, today, quality: 1 })).toBeNull();
  });
  it('is null below quality 0.5', () => {
    expect(sessionEnergy({ series, profile: full, today, quality: 0.3 })).toBeNull();
  });
  it('active kcal never exceeds gross kcal', () => {
    const r = sessionEnergy({ series, profile: full, today, quality: 1 })!;
    expect(r.activeKcal).toBeLessThanOrEqual(r.grossKcal);
    expect(r.source).toBe('heart_rate');
  });
  it('is null with an empty series', () => {
    expect(sessionEnergy({ series: [], profile: full, today, quality: 1 })).toBeNull();
  });
});

describe('energyFromHealthConnect', () => {
  it('is null with a negative value', () => expect(energyFromHealthConnect(-1, 60, full, today)).toBeNull());
  // AUD-20 (SCI-10): the owner removed the ±10 % band; the value passes through as a plain estimate.
  it('passes through as a plain estimate, no band', () => {
    const r = energyFromHealthConnect(300, 60, full, today)!;
    expect(r.activeKcal).toBe(300);
    expect(r).not.toHaveProperty('high');
  });
});

