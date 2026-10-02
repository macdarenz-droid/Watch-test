/**
 * Parameter table for the impulse-response recovery model (plan 6.11).
 * Values are starting points, tuned by the two-sided calibration loop
 * (brain/recovery.ts), not by editing this file per user.
 */
export const EFFORT_IMPULSE = { easy: 0.55, ideal: 1.0, max: 2.0 } as const;
export const EFFORT_STRETCH = { easy: 0.7, ideal: 1.0, max: 1.4 } as const;

/** Per-set size/load factor by rep count. */
export function repFactor(reps: number): number {
  if (reps <= 5) return 0.8;
  if (reps <= 10) return 1.0;
  return 1.2;
}

/** Sets beyond the 6th hard set for a muscle in one session cost less each (diminishing, still growing). */
export const HARD_SET_DIMINISH_AFTER = 6;
export const HARD_SET_DIMINISH_FACTOR = 0.7;

export const LOAD_FACTOR_MIN = 0.7;
export const LOAD_FACTOR_MAX = 1.15;

export const NOVELTY_FIRST_EXPOSURE = 1.3;
export const NOVELTY_SECOND_EXPOSURE = 1.15;
export const NOVELTY_LAYOFF_DAYS = 28;
export const NOVELTY_LAYOFF_FACTOR = 1.3;

export const DAMAGE_HIGH = 1.3; // eccentric / lengthened-position movements
export const DAMAGE_LOW = 0.8; // short-range machine / concentric-dominant
export const DAMAGE_HEAVY_MAIN = 1.15; // main-pattern lift at <=5 reps
export const DAMAGE_DEFAULT = 1.0;

export const VOLUME_STRETCH_MIN = 0.8;
export const VOLUME_STRETCH_MAX = 1.6;
export const VOLUME_STRETCH_DIVISOR = 3;

export const TRAINING_AGE_PRIOR = { novice: 1.5, intermediate: 1.2, established: 1.0 } as const;
export const TRAINING_AGE_NOVICE_MONTHS = 6;
export const TRAINING_AGE_INTERMEDIATE_MONTHS = 24;
export const AGE_PRIOR_PER_DECADE = 0.05;
export const AGE_PRIOR_START = 40;
export const AGE_PRIOR_CAP = 1.3;

export const SYSTEMIC_SLEEP_HOURS = 6.5;
export const SYSTEMIC_SLEEP_FACTOR = 1.1;
export const SYSTEMIC_RHR_SD = 0.5;
export const SYSTEMIC_RHR_FACTOR = 1.1;
export const SYSTEMIC_LOAD_RATIO = 1.3;
export const SYSTEMIC_LOAD_FACTOR_MAX = 1.25;
export const SYSTEMIC_CAP = 1.25;

export const TAU_BASE_HOURS = 18;
export const FAST_TAU_HOURS = 6;
export const FAST_SHARE = 0.35;
export const SLOW_SHARE = 0.65;

export const IMPULSE_LOOKBACK_DAYS = 7;
export const FLOOR_DAYS = 7;
export const READY_TO_HOURS_CAP = 120;

export const READY_PCT = 90;
export const FULL_PCT = 97;

export const F_REF_FLOOR = 3.0; // one ordinary 3-set ideal session on a primary muscle
export const F_REF_SESSION_LOOKBACK = 8;

export const SORENESS_CAP_PCT = 60;
export const SORENESS_CAP_MIN_RATING = 4;

export const TAU_SCALE_MIN = 0.7;
export const TAU_SCALE_MAX = 1.6;
export const TAU_SCALE_UP = 1.1;
export const TAU_SCALE_DOWN = 0.92;
export const CALIBRATION_PREDICTED_HIGH = 85;
export const CALIBRATION_PREDICTED_LOW = 65;
/**
 * BUG-17 (RECOVERY-F4): an e1RM change counts only beyond two typical errors. Plan App D.1 puts the
 * typical error of 1RM-type measures at 2-5 %, plan 6.x uses 4 % as the default personal TE.
 */
export const CALIBRATION_TYPICAL_ERROR = 0.04;
export const CALIBRATION_PERFORMANCE_DROP = 2 * CALIBRATION_TYPICAL_ERROR;
/** Each finished session that trains a muscle without evidence moves its tauScale this share of the way back to 1.0. */
export const TAU_SCALE_DECAY = 0.05;
