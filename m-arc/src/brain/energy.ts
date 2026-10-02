/**
 * Active-calorie estimates (6.10). Needs sex, body weight and age; height
 * too for the resting-metabolism correction. Any of the four missing
 * returns null everywhere, never a number the coach can't stand behind.
 */
import type { Profile, SessionEnergy } from '@/core/models';
import { parseDay } from '@/core/dates';

export function age(profile: Profile, today: string): number | null {
  if (!profile.birthYear) return null;
  return parseDay(today).getFullYear() - profile.birthYear;
}

interface EnergyProfile { bodyWeightKg: number; heightCm: number; sex: 'male' | 'female'; ageYears: number }

function profileFor(profile: Profile, today: string): EnergyProfile | null {
  const a = age(profile, today);
  if (!profile.bodyWeightKg || !profile.heightCm || !profile.sex || a == null) return null;
  return { bodyWeightKg: profile.bodyWeightKg, heightCm: profile.heightCm, sex: profile.sex, ageYears: a };
}

/** Mifflin-St Jeor resting metabolism, kcal/day. */
export function bmrKcalPerDay(profile: Profile, today: string): number | null {
  const p = profileFor(profile, today);
  if (!p) return null;
  const base = 10 * p.bodyWeightKg + 6.25 * p.heightCm - 5 * p.ageYears;
  return p.sex === 'male' ? base + 5 : base - 161;
}

/** Keytel 2005, without VO2max. kcal/min, clamped at 0. */
export function grossKcalPerMin(bpm: number, profile: Profile, today: string): number | null {
  const p = profileFor(profile, today);
  if (!p) return null;
  const raw = p.sex === 'male'
    ? (-55.0969 + 0.6309 * bpm + 0.1988 * p.bodyWeightKg + 0.2017 * p.ageYears) / 4.184
    : (-20.4022 + 0.4472 * bpm - 0.1263 * p.bodyWeightKg + 0.074 * p.ageYears) / 4.184;
  return Math.max(0, raw);
}

export interface SessionEnergyInput {
  /** [secondsIntoSession, bpm], 5-second buckets from heartStore. */
  series: Array<[number, number]>;
  profile: Profile;
  today: string;
  /** signalQuality() over the same series. */
  quality: number;
  /** NAT-02: the session's training seconds (pauses out). The series' wall span includes paused gaps, so it caps the minutes. */
  activeSec?: number;
}

/** Integrates grossKcalPerMin over the session's valid minutes. Null below profile completeness or quality 0.5. */
export function sessionEnergy(input: SessionEnergyInput): SessionEnergy | null {
  const { series, profile, today, quality, activeSec } = input;
  if (!series.length || quality < 0.5) return null;
  const bmr = bmrKcalPerDay(profile, today);
  const a = age(profile, today);
  if (bmr == null || a == null || !profile.bodyWeightKg || !profile.sex) return null;
  const restingKcalPerMin = bmr / 1440;
  // 5-second buckets: each point covers 5s = 1/12 min. Gaps <= 5s are just the next bucket (already
  // covered); the session's median rate fills the remaining time while quality stays >= 0.8.
  const rates = series.map(([, bpm]) => grossKcalPerMin(bpm, profile, today)!).filter(r => Number.isFinite(r));
  if (!rates.length) return null;
  const minutesCovered = series.length * (5 / 60);
  const spanSec = series[series.length - 1]![0] - series[0]![0] + 5;
  const totalSessionSec = activeSec != null && activeSec > 0 ? Math.min(spanSec, Math.max(activeSec, minutesCovered * 60)) : spanSec;
  const minutes = totalSessionSec / 60;
  const coveredKcal = rates.reduce((sum, r) => sum + r * (5 / 60), 0);
  const sorted = [...rates].sort((x, y) => x - y);
  const medianRate = sorted[Math.floor(sorted.length / 2)]!;
  const uncoveredMin = Math.max(0, minutes - minutesCovered);
  const grossKcal = coveredKcal + (quality >= 0.8 ? medianRate * uncoveredMin : 0);
  const activeKcal = Math.max(0, grossKcal - restingKcalPerMin * minutes);
  // AUD-20 (SCI-10): a plain estimate, no ± band; no error bound is validated for lifting.
  return {
    grossKcal: Math.round(grossKcal), activeKcal: Math.round(activeKcal),
    minutes: Math.round(minutes), source: 'heart_rate',
    profileSnapshot: { kg: profile.bodyWeightKg, age: a, sex: profile.sex },
  };
}


/** From a Health Connect ActiveCaloriesBurnedRecord total already aggregated over the session window. */
export function energyFromHealthConnect(activeKcalInRange: number, minutes: number, profile: Profile, today: string): SessionEnergy | null {
  if (!(activeKcalInRange >= 0) || !profile.bodyWeightKg || !profile.sex) return null;
  const a = age(profile, today);
  if (a == null) return null;
  return {
    grossKcal: Math.round(activeKcalInRange), activeKcal: Math.round(activeKcalInRange),
    minutes: Math.round(minutes), source: 'health_connect',
    profileSnapshot: { kg: profile.bodyWeightKg, age: a, sex: profile.sex },
  };
}



