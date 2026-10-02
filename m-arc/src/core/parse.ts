/**
 * Parsers for what people type (UI-13). Commas are decimal points; out-of-range or partial
 * input is `undefined`, never a clamped guess, so nothing surprising gets logged.
 */
import type { LoadUnit } from './models';

const MAX_LOAD: Record<LoadUnit, number> = { kg: 1000, lb: 2200 };
const DECIMAL = /^\d+(\.\d+)?$|^\d+\.$|^\.\d+$/;
const INTEGER = /^\d+$/;

function decimal(raw: string): number | undefined {
  const t = raw.trim().replace(',', '.');
  if (!DECIMAL.test(t)) return undefined;
  const v = Number(t);
  return Number.isFinite(v) ? v : undefined;
}

function integerIn(raw: string, min: number, max: number): number | undefined {
  const t = raw.trim();
  if (!INTEGER.test(t)) return undefined;
  const v = Number(t);
  return v >= min && v <= max ? v : undefined;
}

/** A load in the entry unit: 0 up to 1000 kg / 2200 lb. */
export function parseLoad(raw: string, unit: LoadUnit): number | undefined {
  const v = decimal(raw);
  return v != null && v >= 0 && v <= MAX_LOAD[unit] ? v : undefined;
}

export const parseReps = (raw: string): number | undefined => integerIn(raw, 1, 100);
export const parseDurationSec = (raw: string): number | undefined => integerIn(raw, 1, 3600);
export const parseMinutes = (raw: string): number | undefined => integerIn(raw, 1, 600);
