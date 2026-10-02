import type { LoadUnit, LoggedSet, Session } from './models';

export const KG_PER_LB = 0.45359237;

const round = (v: number, places: number): number => { const f = 10 ** places; return Math.round(v * f) / f; };

/**
 * Canonical kg to a number in `unit`. kg keeps two decimals (1.25 kg plates survive);
 * lb rounds to 0.1, so any kg that came from a typed lb value (stored to 3 decimals)
 * converts back to exactly what was typed. QA-R7-5: a value on the quarter-pound grid
 * (1.25 lb add-ons) keeps its two decimals, so 26.25 lb is not shown as 26.3.
 */
export function kgToDisplay(kg: number, unit: LoadUnit): number {
  if (unit !== 'lb') return round(kg, 2);
  const lb = kg / KG_PER_LB;
  const quarter = Math.round(lb * 4) / 4;
  return Math.abs(lb - quarter) < 0.004 && !Number.isInteger(quarter * 2) ? quarter : round(lb, 1);
}

/** A typed value to canonical kg, unrounded to 3 decimals (§25.3), so it survives its own round trip. */
export function displayToKg(value: number, unit: LoadUnit): number {
  return round(unit === 'lb' ? value * KG_PER_LB : value, 3);
}

export function formatLoad(kg: number | undefined, unit: LoadUnit): string {
  if (kg == null || !Number.isFinite(kg)) return '—';
  return `${kgToDisplay(kg, unit)} ${unit}`;
}

/** The load of a logged set in `unit`: exactly what was typed when it was typed in that unit, else converted from kg. */
export function setLoadIn(set: Pick<LoggedSet, 'kg' | 'entered'>, unit: LoadUnit): number | undefined {
  if (set.entered && set.entered.unit === unit) return set.entered.value;
  return set.kg != null ? kgToDisplay(set.kg, unit) : undefined;
}

/** Like formatLoad, but for a logged set: it respects the entered value. */
export function formatSetLoad(set: Pick<LoggedSet, 'kg' | 'entered'>, unit: LoadUnit): string {
  const v = setLoadIn(set, unit);
  return v == null ? '—' : `${v} ${unit}`;
}

/** The "≈ 20.4 kg" hint under an input whose entry unit differs from the display unit. */
export function approxIn(kg: number, unit: LoadUnit): string {
  return `≈ ${round(unit === 'lb' ? kg / KG_PER_LB : kg, 1)} ${unit}`;
}

/** Records a typed load: canonical kg plus exactly what was typed. */
export function enteredLoad(value: number, unit: LoadUnit): { kg: number; entered: { value: number; unit: LoadUnit } } {
  return { kg: displayToKg(value, unit), entered: { value, unit } };
}

/**
 * States saved before per-set `entered` values (RG-02): an lb user's loads were stored as kg
 * rounded to 0.25, so they now display as 224.9 lb instead of 225. When a set's kg is exactly
 * what the old app stored for a half-pound value, record that value as typed. `kg` is unchanged.
 */
export function backfillLegacyLbSets<T extends Pick<LoggedSet, 'kg' | 'entered'>>(sets: T[]): T[] {
  return sets.map(set => {
    if (set.entered || !(typeof set.kg === 'number' && set.kg > 0)) return set;
    const lb = Math.round((set.kg / KG_PER_LB) * 2) / 2;
    if (Math.abs(Math.round(lb * KG_PER_LB * 4) / 4 - set.kg) >= 1e-9) return set;
    return { ...set, entered: { value: lb, unit: 'lb' as const } };
  });
}

export function backfillLegacyLbEntries(sessions: Session[]): Session[] {
  return sessions.map(s => ({ ...s, exercises: s.exercises.map(e => ({ ...e, sets: backfillLegacyLbSets(e.sets) })) }));
}
