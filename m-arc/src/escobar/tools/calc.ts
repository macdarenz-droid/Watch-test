/**
 * The `calculate` tool (§8.1): the model never does arithmetic on the person's numbers
 * in its head. Each op returns the result and the formula used.
 */
import { effectiveOneRm, loadForReps } from '@/brain/e1rm';
import { daysBetween } from '@/core/dates';
import { KG_PER_LB } from '@/core/units';
import { defaultProfile, formatPerSide, plateBreakdown, resolveProfile } from '@/brain/units';
import { ToolError } from './read';
import { exerciseOf, type ToolCtx } from './context';

type Args = Record<string, unknown>;
const r = (v: number, p = 2): number => { const f = 10 ** p; return Math.round(v * f) / f; };
const n = (a: Args, k: string, lo = -1e9, hi = 1e9): number => {
  const v = Number(a[k]);
  if (a[k] == null || !Number.isFinite(v)) throw new ToolError(`${k} is required and must be a number`);
  if (v < lo || v > hi) throw new ToolError(`${k} must be between ${lo} and ${hi}`);
  return v;
};
const day = (a: Args, k: string): string => {
  const v = a[k];
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new ToolError(`${k} must be YYYY-MM-DD`);
  return v;
};

export interface CalcResult { result: unknown; formula: string }

export function calculate(input: { op?: string; args?: Args }, ctx: ToolCtx): CalcResult {
  const a = input.args ?? {};
  switch (input.op) {
    case 'bmi': {
      const kg = n(a, 'kg', 20, 400), cm = n(a, 'cm', 100, 250);
      return { result: r(kg / (cm / 100) ** 2, 1), formula: 'kg / (m × m)' };
    }
    case 'weight_for_bmi': {
      const bmi = n(a, 'bmi', 10, 60), cm = n(a, 'cm', 100, 250);
      return { result: r(bmi * (cm / 100) ** 2, 1), formula: 'bmi × (m × m)' };
    }
    case 'e1rm': {
      const kg = n(a, 'kg', 0.5, 600), reps = n(a, 'reps', 1, 10);
      const effort = a.effort === 'easy' || a.effort === 'max' || a.effort === 'ideal' ? a.effort : undefined;
      const v = effectiveOneRm(kg, reps, effort);
      if (v == null) throw new ToolError('e1rm needs a load and 1–10 reps');
      return { result: r(v, 1), formula: 'Epley: kg × (1 + (reps + reps in reserve from effort) / 30)' };
    }
    case 'load_for_reps': {
      const e1 = n(a, 'e1rm', 1, 700), reps = n(a, 'reps', 1, 15);
      return { result: r(loadForReps(e1, reps), 1), formula: 'e1rm / (1 + reps / 30)' };
    }
    case 'percent_change': {
      const from = n(a, 'from'), to = n(a, 'to');
      if (from === 0) throw new ToolError('from cannot be 0');
      return { result: r(((to - from) / Math.abs(from)) * 100, 1), formula: '(to − from) / from × 100' };
    }
    case 'convert_load': {
      const value = n(a, 'value', 0, 2000);
      const from = a.from, to = a.to;
      if ((from !== 'kg' && from !== 'lb') || (to !== 'kg' && to !== 'lb')) throw new ToolError('from and to must be kg or lb');
      if (from === to) return { result: value, formula: 'same unit' };
      return from === 'kg' ? { result: r(value / KG_PER_LB, 1), formula: 'kg / 0.45359237' } : { result: r(value * KG_PER_LB, 2), formula: 'lb × 0.45359237' };
    }
    case 'plate_breakdown': {
      const kg = n(a, 'kg', 5, 600);
      const units = ctx.state.units;
      const gym = units.gyms.find(g => g.id === units.activeGymId);
      let profile = typeof a.exerciseId === 'string' && exerciseOf(ctx, a.exerciseId)
        ? resolveProfile(a.exerciseId, units.activeGymId, units, exerciseOf(ctx, a.exerciseId))
        : units.byEquipment[units.activeGymId]?.Barbell ?? defaultProfile('Barbell', gym?.defaultUnit ?? 'kg');
      if (!profile.plates?.length && !profile.barKg) profile = defaultProfile('Barbell', profile.unit);
      if (a.barKg != null) profile = { ...profile, barKg: n(a, 'barKg', 5, 30) };
      const b = plateBreakdown(kg, profile);
      return { result: { perSide: b.perSide, perSideText: formatPerSide(b), barKg: b.barKg, exactTotalKg: b.exactTotalKg, remainderKg: b.remainderKg }, formula: 'greedy per side from the heaviest plate: (total − bar) / 2' };
    }
    case 'weekly_rate': {
      const fromKg = n(a, 'fromKg', 20, 400), toKg = n(a, 'toKg', 20, 400), weeks = n(a, 'weeks', 0.1, 520);
      return { result: { kgPerWeek: r((toKg - fromKg) / weeks, 2), pctPerWeek: r(((toKg - fromKg) / fromKg / weeks) * 100, 2) }, formula: '(to − from) / weeks; ÷ from × 100 for %' };
    }
    case 'protein_range': {
      const kg = n(a, 'kg', 20, 400), lo = n(a, 'gPerKgLow', 0.5, 4), hi = n(a, 'gPerKgHigh', 0.5, 4);
      if (hi < lo) throw new ToolError('gPerKgHigh must be at least gPerKgLow');
      return { result: { lowG: Math.round(kg * lo), highG: Math.round(kg * hi) }, formula: 'kg × g/kg' };
    }
    case 'days_between': {
      return { result: daysBetween(day(a, 'from'), day(a, 'to')), formula: 'to − from, in days' };
    }
    default:
      throw new ToolError(`unknown op ${String(input.op)}`);
  }
}
