import { describe, it, expect } from 'vitest';
import { calculate } from '@/escobar/tools/calc';
import { ctxOf, twoWeeksState } from './fixtures';

const ctx = ctxOf(twoWeeksState());
const calc = (op: string, args: Record<string, unknown>) => calculate({ op, args }, ctx);

describe('calculate', () => {
  it('bmi', () => expect(calc('bmi', { kg: 80, cm: 180 }).result).toBe(24.7));
  it('weight_for_bmi', () => expect(calc('weight_for_bmi', { bmi: 25, cm: 180 }).result).toBe(81));
  it('e1rm uses effort as reps in reserve', () => {
    expect(calc('e1rm', { kg: 100, reps: 5, effort: 'max' }).result).toBe(116.7);
    expect(calc('e1rm', { kg: 100, reps: 5 }).result).toBe(123.3);
    expect(() => calc('e1rm', { kg: 100, reps: 12 })).toThrow(/reps must be between 1 and 10/);
  });
  it('load_for_reps', () => expect(calc('load_for_reps', { e1rm: 120, reps: 8 }).result).toBe(94.7));
  it('percent_change', () => {
    expect(calc('percent_change', { from: 100, to: 110 }).result).toBe(10);
    expect(() => calc('percent_change', { from: 0, to: 5 })).toThrow(/cannot be 0/);
  });
  it('convert_load both ways and same unit', () => {
    expect(calc('convert_load', { value: 100, from: 'kg', to: 'lb' }).result).toBe(220.5);
    expect(calc('convert_load', { value: 45, from: 'lb', to: 'kg' }).result).toBe(20.41);
    expect(calc('convert_load', { value: 45, from: 'lb', to: 'lb' }).result).toBe(45);
    expect(() => calc('convert_load', { value: 45, from: 'stone', to: 'kg' })).toThrow();
  });
  it('plate_breakdown with the gym bar and an explicit bar', () => {
    const r = calc('plate_breakdown', { kg: 100 }).result as { perSideText: string; exactTotalKg: number };
    expect(r.perSideText).toBe('25 + 15 kg');
    expect(r.exactTotalKg).toBe(100);
    const r2 = calc('plate_breakdown', { kg: 60, barKg: 15 }).result as { barKg: number };
    expect(r2.barKg).toBe(15);
  });
  it('weekly_rate', () => expect(calc('weekly_rate', { fromKg: 84, toKg: 82, weeks: 4 }).result).toEqual({ kgPerWeek: -0.5, pctPerWeek: -0.6 }));
  it('protein_range', () => {
    expect(calc('protein_range', { kg: 80, gPerKgLow: 1.6, gPerKgHigh: 2.2 }).result).toEqual({ lowG: 128, highG: 176 });
    expect(() => calc('protein_range', { kg: 80, gPerKgLow: 2.2, gPerKgHigh: 1.6 })).toThrow();
  });
  it('days_between', () => {
    expect(calc('days_between', { from: '2026-09-01', to: '2026-09-22' }).result).toBe(21);
    expect(() => calc('days_between', { from: 'Sep 1', to: '2026-09-22' })).toThrow(/YYYY-MM-DD/);
  });
  it('every op returns a formula; unknown ops and missing args are errors', () => {
    expect(calc('bmi', { kg: 80, cm: 180 }).formula.length).toBeGreaterThan(0);
    expect(() => calc('sqrt', {})).toThrow(/unknown op/);
    expect(() => calc('bmi', { kg: 80 })).toThrow(/cm is required/);
  });
});
