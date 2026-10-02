/**
 * Daily readiness (F2.1, 6.4): a 0-100 score from whichever inputs actually
 * exist today, self-report leading over sensors. Missing inputs renormalise
 * the weights; they never count as zero. Never produces a score from zero
 * inputs — returns null and the UI says so.
 */
import type { CheckIn, DailyHealth, Exercise, Session, Split, Weekday } from '@/core/models';
import type { MuscleId } from '@/data/muscles';
import type { MuscleRecovery } from './recovery';
import { acuteChronicRatio, avg, stddev, clamp } from './recovery';
import { SYSTEMIC_LOAD_RATIO } from '@/data/recovery';
import { daysBetween, trainedToday, WEEKDAY_LABEL } from '@/core/dates';
import { findExercise } from '@/core/exercises';

function withinDays(day: string, today: string, days: number): boolean {
  const d = daysBetween(day, today);
  return d >= 0 && d < days;
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

export interface ReadinessBaselines {
  restingHr7d: number | null;
  restingHr28d: number | null;
  restingHr28dSd: number | null;
  /** ADAPT-2 (B-3): days with a resting HR in the last 28, and the spread of the ones before the last 7 (the user's usual day-to-day noise). */
  restingHr28dCount: number;
  restingHrBaselineSd: number | null;
  sleep14dMedian: number | null;
  lnRmssd7dMean: number | null;
  lnRmssd7dSd: number | null;
  /** Coefficient of variation of the 7-day lnRMSSD window, |sd/mean|. */
  cv: number | null;
}

export function readinessBaselines(healthDays: DailyHealth[], today: string): ReadinessBaselines {
  const rhr7 = healthDays.filter(d => withinDays(d.day, today, 7) && d.restingHr != null).map(d => d.restingHr!);
  const rhr28 = healthDays.filter(d => withinDays(d.day, today, 28) && d.restingHr != null).map(d => d.restingHr!);
  const sleep14 = healthDays.filter(d => withinDays(d.day, today, 14) && d.sleepMinutes != null).map(d => d.sleepMinutes!);
  const lnRmssd7 = healthDays.filter(d => withinDays(d.day, today, 7) && d.lnRmssd != null).map(d => d.lnRmssd!);
  const rhrBefore = healthDays.filter(d => withinDays(d.day, today, 28) && !withinDays(d.day, today, 7) && d.restingHr != null).map(d => d.restingHr!);
  const lnMean = lnRmssd7.length ? avg(lnRmssd7) : null;
  return {
    restingHr7d: rhr7.length ? avg(rhr7) : null,
    restingHr28d: rhr28.length ? avg(rhr28) : null,
    restingHr28dSd: rhr28.length >= 2 ? stddev(rhr28) : null,
    restingHr28dCount: rhr28.length,
    restingHrBaselineSd: rhrBefore.length >= 2 ? stddev(rhrBefore) : null,
    sleep14dMedian: median(sleep14),
    lnRmssd7dMean: lnMean,
    lnRmssd7dSd: lnRmssd7.length >= 2 ? stddev(lnRmssd7) : null,
    cv: lnRmssd7.length >= 2 && lnMean ? Math.abs(stddev(lnRmssd7) / lnMean) : null,
  };
}

/** BUG-17 (RECOVERY-F11): the smallest spread a 1-5 check-in history counts as, so a flat history still sees a bad day. */
export const CHECKIN_MIN_SD = 0.5;

/** A value's z-score against a series, or null when there isn't enough of the user's own history (n<3) to mean anything. */
function zScore(value: number, series: number[]): number | null {
  if (series.length < 3) return null;
  return (value - avg(series)) / Math.max(stddev(series), CHECKIN_MIN_SD);
}

/** How much each input counts toward the score; missing inputs are left out and the rest renormalised. */
export const READINESS_WEIGHTS = { checkIn: 0.35, sleep: 0.25, recovery: 0.15, rhr: 0.10, hrv: 0.10, load: 0.05 } as const;
export const READINESS_GREEN_AT = 67;
export const READINESS_RED_AT = 33;
/**
 * AUD-1 (SCI-02): the least sleep need the sleep part assumes, in minutes: the knowledge card
 * sleep_duration's 7 h adult minimum (AASM/SRS consensus, Watson et al. 2015).
 */
export const SLEEP_NEED_FLOOR_MIN = 7 * 60;
/** Under this many days of check-ins and sleep, the score reads as calibrating. */
export const READINESS_CALIBRATING_DAYS = 14;
/**
 * ADAPT-2 (B-1): where the user's usual check-in lands on the 0-1 check-in part. 0.75 reads as a
 * normal day, so an average check-in no longer pulls the score under the green line on its own.
 */
export const CHECKIN_CENTRE = 0.75;
/** ADAPT-2 (B-3): personal resting-HR scoring needs this many days in the last 28; below it, the fixed 10 bpm scale. */
export const RHR_PERSONAL_MIN_DAYS = 14;
/** ADAPT-2 (B-3): the smallest day-to-day resting-HR spread counted, in bpm, so a very steady watch still reads a small rise sanely. */
export const RHR_MIN_SD = 1.5;

/** "5h 10m", "7h". */
function hm(min: number): string {
  const m = Math.round(min), h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

/**
 * AUD-20 (SCI-11): the sleep driver states the hours against the user's usual (the 14-night
 * median) or AUD-1's 7 h floor, never that sleep caused the score. Starts with "Sleep:" so ES-12's
 * health filter (redactDrivers) still finds it.
 */
export function sleepDriver(lastNight: number | null, last3: number[], usual: number, floor = SLEEP_NEED_FLOOR_MIN): string {
  const vs = (min: number) => `(${min < usual ? `below your usual ${hm(usual)}` : min < floor ? `under ${hm(floor)}` : `your usual ${hm(usual)}`})`;
  if (lastNight != null && (lastNight < usual || lastNight < floor)) return `Sleep: ${hm(lastNight)} last night ${vs(lastNight)}`;
  const mean = avg(last3);
  // Reached only without last night's data, so the one night in the window is older: name it as such.
  if (last3.length === 1) return `Sleep: ${hm(mean)} on your last logged night ${vs(mean)}`;
  return `Sleep: ${hm(mean)} a night over the last ${last3.length} nights ${vs(mean)}`;
}

export type LoadAdvice = 'normal' | 'no_increase' | 'reduce';
export type ReadinessBand = 'green' | 'amber' | 'red';

export interface ReadinessResult {
  score: number;
  band: ReadinessBand;
  confidence: 'low' | 'medium' | 'high';
  loadAdvice: LoadAdvice;
  drivers: string[];
  /** Fewer than 14 days of check-ins or sleep history: the score exists but should read as provisional. */
  calibrating: boolean;
  /**
   * QA8-2: set only once today's session is already done (trainedToday). Ready-to-show prose —
   * "Today's session is done..." — so callers (Today card, brief, readinessSummaryText) don't each
   * invent their own pre-workout-vs-done wording. Left out (undefined) otherwise, so the rest of
   * this result stays byte-identical to before this field existed.
   */
  postSessionAdvice?: string;
}

export interface ReadinessInput {
  today: string;
  /** QA8-2/QA8-4: for the shared trainedToday check. */
  now: number;
  healthDays: DailyHealth[];
  /** Today's check-in, if any. */
  checkIn?: CheckIn;
  /** Past check-ins. readiness() itself keeps only the 30 days before `today` (today excluded), so callers may pass the whole list (BR-03). */
  checkInHistory: CheckIn[];
  /** Recovery status for every muscle, from recoveryStatus() (6.11). */
  recovery: MuscleRecovery[];
  scheduledSplit?: Split;
  /** QA8-2: the next scheduled split after today, once today's own session is done. Null/undefined reads as "nothing scheduled soon". */
  next?: { split: Split; weekday: Weekday } | null;
  custom: Exercise[];
  sessions: Session[];
}

/** The scheduled split's primary muscles. Empty when nothing is scheduled — there is no "today's target muscle" to speak of, and falling back to every muscle would pad the recovery/soreness subscores with untrained muscles sitting at 100%. */
function targetMuscles(split: Split | undefined, custom: Exercise[]): MuscleId[] {
  if (!split) return [];
  const set = new Set<MuscleId>();
  for (const se of split.exercises) findExercise(se.exerciseId, custom)?.primary.forEach(m => set.add(m));
  return [...set];
}

interface Weighted { key: string; weight: number; score: number | null; }

/** BUG-16: the readiness inputs by name, as copy may say them ("sleep", "resting heart rate"). */
export const READINESS_INPUT_LABEL = {
  checkIn: 'your check-in', sleep: 'sleep', recovery: 'muscle recovery', rhr: 'resting heart rate', hrv: 'HRV', load: 'training load',
} as const;
export type ReadinessInputKey = keyof typeof READINESS_INPUT_LABEL;
/** BUG-16: the driver the load part adds when it reads low. */
export const LOAD_DRIVER = 'training load is well above your recent weeks';

export function readiness(input: ReadinessInput): ReadinessResult | null {
  return readinessWithInputs(input).result;
}

/**
 * readiness(), plus the inputs that actually fed today's score (BUG-16), so copy can name only
 * those. The result object itself keeps its shape.
 */
export function readinessWithInputs(input: ReadinessInput): { result: ReadinessResult | null; inputs: ReadinessInputKey[]; low: ReadinessInputKey[] } {
  const { today, healthDays, checkIn, recovery, scheduledSplit, custom, sessions } = input;
  const checkInHistory = input.checkInHistory.filter(c => { const d = daysBetween(c.day, today); return d > 0 && d <= 30; });
  const baselines = readinessBaselines(healthDays, today);
  // QA8-2: once today's own session is done, "today's target muscles" means the NEXT scheduled
  // split's, not the one already trained — advice about "today" no longer makes sense otherwise.
  const isDoneToday = trainedToday(sessions, today, input.now);
  const next = input.next ?? null;
  const activeSplit = isDoneToday ? next?.split : scheduledSplit;
  const muscles = targetMuscles(activeSplit, custom);
  const drivers: string[] = [];

  // Check-in (0.35): soreness of today's target muscles, sleep quality, mood — each a z-score
  // against the user's own last-30-days distribution of that same field (6.4 names the three
  // components; combining them as an equal-weight average is this build's reading, undocumented
  // by the plan beyond naming them — see COACHING-DECISIONS.md).
  let checkInScore: number | null = null;
  if (checkIn) {
    const priorSoreness = checkInHistory.map(c => {
      const vals: number[] = muscles.map(m => c.soreness?.[m]).filter(v => v != null) as number[];
      return vals.length ? avg(vals) : null;
    }).filter(v => v != null) as number[];
    const todaySoreness = (() => {
      const vals: number[] = muscles.map(m => checkIn.soreness?.[m]).filter(v => v != null) as number[];
      return vals.length ? avg(vals) : null;
    })();
    const sorenessZ = todaySoreness != null ? zScore(todaySoreness, priorSoreness) : null;
    const sleepQZ = checkIn.sleepQuality != null ? zScore(checkIn.sleepQuality, checkInHistory.map(c => c.sleepQuality).filter(v => v != null) as number[]) : null;
    const moodZ = checkIn.mood != null ? zScore(checkIn.mood, checkInHistory.map(c => c.mood).filter(v => v != null) as number[]) : null;
    // Before there's enough history for a z-score (n<3), fall back to the raw 1-5 rating against
    // its own midpoint (3) — still "calibrating", per 6.4, but a first-ever check-in should count
    // for something rather than vanishing entirely for lack of a personal baseline.
    // ADAPT-2 (B-1): both map the user's usual answer (or a 3) to CHECKIN_CENTRE, a normal day.
    const C = CHECKIN_CENTRE;
    const rawFallback = (raw: number | undefined, invert: boolean) => raw == null ? null : clamp(invert ? C - (raw - 3) / 4 : C + (raw - 3) / 4, 0, 1);
    // Soreness is inverted (higher = worse); sleep quality and mood are not.
    const parts = [
      sorenessZ != null ? clamp(C - sorenessZ / 3, 0, 1) : rawFallback(todaySoreness ?? undefined, true),
      sleepQZ != null ? clamp(C + sleepQZ / 3, 0, 1) : rawFallback(checkIn.sleepQuality, false),
      moodZ != null ? clamp(C + moodZ / 3, 0, 1) : rawFallback(checkIn.mood, false),
    ].filter((v): v is number => v != null);
    if (parts.length) {
      checkInScore = avg(parts);
      if (checkInScore < 0.4) drivers.push('how you feel today (soreness, sleep quality or mood)');
    }
  }

  // Sleep hours (0.25): last night vs the need, and a 3-night debt. AUD-1 (SCI-02): the need is
  // the 14-night median (consistency) but never under the 7 h adult floor (sufficiency), so
  // habitual short sleep never reads as enough. Bedtime regularity
  // (6.4's third component) has no source anywhere in this app yet, so the other two are
  // renormalised to fill the full 0.25 rather than leaving it permanently short — see decisions.
  let sleepScore: number | null = null;
  if (baselines.sleep14dMedian != null) {
    const need = Math.max(baselines.sleep14dMedian, SLEEP_NEED_FLOOR_MIN);
    const lastNight = healthDays.find(d => withinDays(d.day, today, 1) && d.sleepMinutes != null)?.sleepMinutes ?? null;
    const last3 = healthDays.filter(d => withinDays(d.day, today, 3) && d.sleepMinutes != null).map(d => d.sleepMinutes!);
    const lastNightScore = lastNight != null ? clamp(lastNight / need, 0, 1) : null;
    const debtMinutes = last3.length ? last3.reduce((a, m) => a + Math.max(0, need - m), 0) : null;
    const debtScore = debtMinutes != null ? clamp(1 - debtMinutes / (need * 1.5), 0, 1) : null;
    const w1 = 60 / 85, w2 = 25 / 85;
    if (lastNightScore != null && debtScore != null) sleepScore = w1 * lastNightScore + w2 * debtScore;
    else if (lastNightScore != null) sleepScore = lastNightScore;
    else if (debtScore != null) sleepScore = debtScore;
    if (sleepScore != null && sleepScore < 0.5) drivers.push(sleepDriver(lastNight, last3, baselines.sleep14dMedian));
  }

  // Recovery of today's target muscles (0.15), from 6.11.
  let recoveryScore: number | null = null;
  const targetRecovery = recovery.filter(r => muscles.includes(r.muscle));
  if (targetRecovery.length) {
    recoveryScore = clamp(avg(targetRecovery.map(r => r.pct)) / 100, 0, 1);
    if (recoveryScore < 0.6) {
      drivers.push(isDoneToday && next
        ? `the muscles for ${next.split.name} on ${WEEKDAY_LABEL[next.weekday]} are not fully recovered`
        : 'the muscles you would train today are not fully recovered');
    }
  }

  // Resting-HR deviation (0.10). ADAPT-2 (B-3): with 14+ days of resting HR, the 7-day rise over
  // the 28-day mean as a z-score against the user's own day-to-day spread (the days before the
  // last 7, at least 1.5 bpm): s = clamp(1 - z/3, 0, 1), so the driver line (0.5) is z 1.5.
  // Before that, the fixed scale s = clamp(1 - delta/10, 0, 1), driver at +5 bpm.
  let rhrScore: number | null = null;
  if (baselines.restingHr7d != null && baselines.restingHr28d != null) {
    const delta = baselines.restingHr7d - baselines.restingHr28d;
    const personal = baselines.restingHr28dCount >= RHR_PERSONAL_MIN_DAYS && baselines.restingHrBaselineSd != null;
    rhrScore = personal ? clamp(1 - delta / Math.max(baselines.restingHrBaselineSd!, RHR_MIN_SD) / 3, 0, 1) : clamp(1 - delta / 10, 0, 1);
    if (rhrScore <= 0.5) drivers.push('resting heart rate is up over your usual');
  }

  // HRV z-score (0.10): only with clean RR data and >=14 values. Dormant on the GT6 (Appendix E).
  let hrvScore: number | null = null;
  if (baselines.lnRmssd7dMean != null && baselines.lnRmssd7dSd != null) {
    const recentLn = healthDays.filter(d => withinDays(d.day, today, 1) && d.lnRmssd != null).map(d => d.lnRmssd!);
    if (recentLn.length) {
      const z = baselines.lnRmssd7dSd > 0 ? (avg(recentLn) - baselines.lnRmssd7dMean) / baselines.lnRmssd7dSd : 0;
      hrvScore = clamp(0.5 + z / 3, 0, 1);
      if (hrvScore < 0.4) drivers.push('HRV is below your usual range');
    }
  }

  // Acute load (0.05): 7-day session load vs the chronic mean, the same ATL/CTL ratio as the
  // systemic recovery factor (6.11/F2.4). BUG-16: no penalty up to 1.3 (the systemic factor's own
  // start, Gabbett's upper bound), falling to 0 at 1.5.
  const ratio = acuteChronicRatio(sessions, today);
  let loadScore: number | null = ratio == null ? null : clamp(1 - Math.max(0, ratio - SYSTEMIC_LOAD_RATIO) / 0.2, 0, 1);
  const loadLow = loadScore != null && loadScore < 0.5;
  if (loadLow) drivers.push(LOAD_DRIVER);

  const W = READINESS_WEIGHTS;
  const weighted: Weighted[] = [
    { key: 'checkIn', weight: W.checkIn, score: checkInScore },
    { key: 'sleep', weight: W.sleep, score: sleepScore },
    { key: 'recovery', weight: W.recovery, score: recoveryScore },
    { key: 'rhr', weight: W.rhr, score: rhrScore },
    { key: 'hrv', weight: W.hrv, score: hrvScore },
    { key: 'load', weight: W.load, score: loadScore },
  ];
  // BUG-16: which present inputs are past their driver thresholds (the same lines that add a driver).
  const low: Record<string, boolean> = {
    checkIn: checkInScore != null && checkInScore < 0.4,
    sleep: sleepScore != null && sleepScore < 0.5,
    recovery: recoveryScore != null && recoveryScore < 0.6,
    rhr: rhrScore != null && rhrScore <= 0.5,
    hrv: hrvScore != null && hrvScore < 0.4,
    load: loadLow,
  };
  const lowCount = Object.values(low).filter(Boolean).length;
  // BUG-16 (Plan Appendix B, self-report leads): acute load confirms, it never leads. A low load
  // part counts in full only when another input is low too; on its own it cannot pull the score
  // under the green line, so load alone is never red or amber and never holds a load.
  if (loadLow && lowCount < 2) {
    loadScore = Math.max(loadScore!, READINESS_GREEN_AT / 100);
    weighted.find(w => w.key === 'load')!.score = loadScore;
  }
  const present = weighted.filter(w => w.score != null);
  const inputs = present.map(w => w.key as ReadinessInputKey);
  const lowInputs = inputs.filter(k => low[k]);
  if (!present.length) return { result: null, inputs, low: lowInputs };

  const totalWeight = present.reduce((a, w) => a + w.weight, 0);
  const score = Math.round(100 * present.reduce((a, w) => a + w.weight * w.score!, 0) / totalWeight);
  const band: ReadinessBand = score >= READINESS_GREEN_AT ? 'green' : score <= READINESS_RED_AT ? 'red' : 'amber';
  // BUG-16 (RECOVERY-F9): "reduce" needs today's check-in or 2+ agreeing inputs; one signal alone
  // at most blocks the increase.
  const corroborated = checkInScore != null || lowCount >= 2;
  const loadAdvice: LoadAdvice = band === 'red' ? (corroborated ? 'reduce' : 'no_increase') : band === 'amber' ? 'no_increase' : 'normal';
  const confidence = present.length >= 4 ? 'high' : present.length >= 2 ? 'medium' : 'low';
  const distinctCheckInDays = new Set(checkInHistory.map(c => c.day)).size;
  const sleepDays = healthDays.filter(d => d.sleepMinutes != null).length;
  const calibrating = distinctCheckInDays < READINESS_CALIBRATING_DAYS && sleepDays < READINESS_CALIBRATING_DAYS;
  const postSessionAdvice = isDoneToday
    ? `Today's session is done. Recover well${next ? `; ${next.split.name} is next on ${WEEKDAY_LABEL[next.weekday]}` : ''}.`
    : undefined;

  return { result: { score, band, confidence, loadAdvice, drivers: drivers.slice(0, 3), calibrating, ...(postSessionAdvice ? { postSessionAdvice } : {}) }, inputs, low: lowInputs };
}

/** F3.8: a one-line summary for the optional morning notification. */
export function readinessSummaryText(r: ReadinessResult): string {
  // QA8-2: once today's session is done, "ease off today" no longer makes sense.
  if (r.postSessionAdvice) return `Readiness: ${r.band} (${r.score}). ${r.postSessionAdvice}`;
  const advice = r.loadAdvice === 'reduce' ? ' Ease off today.' : r.loadAdvice === 'no_increase' ? ' Keep loads steady today.' : '';
  return `Readiness: ${r.band} (${r.score}).${advice}`;
}
