/**
 * Muscle recovery: an impulse-response model (plan 6.11). Every set leaves
 * an impulse sized by role, effort, volume, load, exercise damage and
 * novelty; impulses decay fast-then-slow and stack across the last 7 days;
 * the percentage compares today's leftover fatigue against the muscle's
 * own typical session dose. Heart rate never touches this file — only the
 * systemic (whole-body) factor, from sleep, resting heart rate and training
 * load, which slows every muscle a little without ever being the reason a
 * specific muscle looks unrecovered.
 */
import type { CheckIn, DailyHealth, Exercise, FreshMark, LoggedSet, Profile, RecoveryModel, Session } from '@/core/models';
import { MUSCLE_BY_ID, MUSCLE_IDS, type MuscleId } from '@/data/muscles';
import { findExercise, setDamage } from '@/core/exercises';
import { ROLE_WEIGHT, effortLabel, isWorkingSet, rolesFor } from './exposure';
import { exerciseHistory, heldIn, loadIsChecked, plausibilityRef, summarizeSets, type ExerciseSessionSummary } from './history';
import { daysBetween, dayKey } from '@/core/dates';
import {
  EFFORT_IMPULSE, EFFORT_STRETCH, repFactor, HARD_SET_DIMINISH_AFTER, HARD_SET_DIMINISH_FACTOR,
  LOAD_FACTOR_MIN, LOAD_FACTOR_MAX, NOVELTY_FIRST_EXPOSURE, NOVELTY_SECOND_EXPOSURE, NOVELTY_LAYOFF_DAYS, NOVELTY_LAYOFF_FACTOR,
  VOLUME_STRETCH_MIN, VOLUME_STRETCH_MAX, VOLUME_STRETCH_DIVISOR,
  TRAINING_AGE_PRIOR, TRAINING_AGE_NOVICE_MONTHS, TRAINING_AGE_INTERMEDIATE_MONTHS,
  AGE_PRIOR_PER_DECADE, AGE_PRIOR_START, AGE_PRIOR_CAP,
  SYSTEMIC_SLEEP_HOURS, SYSTEMIC_SLEEP_FACTOR, SYSTEMIC_RHR_SD, SYSTEMIC_RHR_FACTOR, SYSTEMIC_LOAD_RATIO, SYSTEMIC_LOAD_FACTOR_MAX, SYSTEMIC_CAP,
  TAU_BASE_HOURS, FAST_TAU_HOURS, FAST_SHARE, SLOW_SHARE,
  IMPULSE_LOOKBACK_DAYS, FLOOR_DAYS, READY_TO_HOURS_CAP, READY_PCT, FULL_PCT,
  F_REF_FLOOR, F_REF_SESSION_LOOKBACK,
  SORENESS_CAP_PCT, SORENESS_CAP_MIN_RATING,
  TAU_SCALE_MIN, TAU_SCALE_MAX, TAU_SCALE_UP, TAU_SCALE_DOWN, TAU_SCALE_DECAY, CALIBRATION_PREDICTED_HIGH, CALIBRATION_PREDICTED_LOW, CALIBRATION_PERFORMANCE_DROP,
} from '@/data/recovery';

export interface MuscleRecovery {
  muscle: MuscleId;
  /** 0-100. 100 means fully recovered. */
  pct: number;
  /** Hours remaining until "ready for hard work" (90%), 0 once past it. */
  hoursLeft: number;
  /** The solved hours-since-training to reach "ready", before the ± display band. */
  windowHours: number;
  lastTrainedAt: string | null;
  lastDay: string | null;
  /** True when the window was widened from the user's own history (calibration observed this muscle needing more, or fewer, hours). */
  personalized: boolean;
  /** True while below "ready for hard work" (under 90%). */
  recovering: boolean;
  ready: boolean;
  readyInHours: [number, number] | null;
  fullInHours: number | null;
  confidence: 'low' | 'medium' | 'high';
  drivers: Array<{ text: string; hours: number }>;
  systemicFactor: number;
  /** QA-R3a-9: today's soreness rating holds this muscle below ready; no clock time can say when that eases. */
  soreToday?: boolean;
  /** BUG-17 (RECOVERY-F1): more than 120 h still to go before 90 %: shown as "5+ days", never as ready. */
  beyondCap?: boolean;
}

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function avg(xs: number[]): number { return xs.reduce((a, b) => a + b, 0) / xs.length; }
export function stddev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = avg(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length);
}

function monthsBetween(fromDay: string, toMs: number): number {
  return Math.max(0, daysBetween(fromDay, dayKey(new Date(toMs))) / 30.44);
}

export function trainingAgeMonths(profile: Profile, sessions: Session[], atMs: number): number | null {
  const since = profile.trainingSince ? `${profile.trainingSince}-01` : sessions[0]?.day;
  return since ? monthsBetween(since, atMs) : null;
}

function trainingAgePrior(months: number | null): number {
  if (months == null || months < TRAINING_AGE_NOVICE_MONTHS) return TRAINING_AGE_PRIOR.novice;
  if (months < TRAINING_AGE_INTERMEDIATE_MONTHS) return TRAINING_AGE_PRIOR.intermediate;
  return TRAINING_AGE_PRIOR.established;
}

export function ageOf(profile: Profile, atMs: number): number | null {
  return profile.birthYear ? new Date(atMs).getFullYear() - profile.birthYear : null;
}

/**
 * BUG-20 (§19): with only a birth year, someone born (this year - 18) may still be 17 until their
 * birthday, so they count as possibly under 18 all year. Born (this year - 19) or earlier is 18+.
 */
export function possiblyMinor(profile: Profile, atMs: number): boolean {
  const age = ageOf(profile, atMs);
  return age != null && age <= 18;
}

function agePrior(age: number | null): number {
  if (age == null || age <= AGE_PRIOR_START) return 1.0;
  const decades = (age - AGE_PRIOR_START) / 10;
  return clamp(1 + decades * AGE_PRIOR_PER_DECADE, 1.0, AGE_PRIOR_CAP);
}

/** Session-RPE proxy load (no heart rate needed): effort-weighted minutes. */
/** Sessions are never mutated in place (every edit makes a new object), so the load is remembered per object. */
const rpeLoadCache = new WeakMap<Session, number>();
export function sessionRpeLoad(session: Session): number {
  const hit = rpeLoadCache.get(session);
  if (hit !== undefined) return hit;
  const sets = session.exercises.flatMap(e => e.sets).filter(isWorkingSet);
  const weight = { easy: 4, ideal: 7, max: 10 } as const;
  const load = sets.length ? avg(sets.map(s => weight[effortLabel(s) ?? 'ideal'])) * (session.durationSec / 60) : 0;
  rpeLoadCache.set(session, load);
  return load;
}

/** ADAPT-2 (B-9): the usual trained week is the median of the last 4 trained weeks among the 8 before this one, from 3 trained weeks. */
const USUAL_WEEK_LOOKBACK = 8;
const USUAL_WEEK_SAMPLE = 4;
const USUAL_WEEK_MIN_TRAINED = 3;

/**
 * 7-day over 28-day session load (ATL/CTL), one definition for recovery and readiness (BR-19).
 * Null until training has spanned most of the window: 3+ sessions in the 28 days, the oldest at
 * least 14 days back. The chronic mean divides by the days training actually covers, at most 28
 * (BUG-16, RECOVERY-F2): a fixed 28 made steady training on days 14 to 27 read as a spike.
 */
export function acuteChronicRatio(sessions: Session[], refDay: string): number | null {
  const ago = (day: string) => daysBetween(day, refDay);
  const chronic = sessions.filter(s => { const d = ago(s.day); return d >= 0 && d < 28; });
  if (chronic.length < 3 || Math.max(...chronic.map(s => ago(s.day))) < 14) return null;
  const covered = Math.min(28, 1 + Math.max(...sessions.map(s => ago(s.day))));
  const ctl = chronic.reduce((a, s) => a + sessionRpeLoad(s), 0) / covered;
  if (!(ctl > 0)) return null;
  const acuteLoad = chronic.filter(s => ago(s.day) < 7).reduce((a, s) => a + sessionRpeLoad(s), 0);
  const ratio = (acuteLoad / 7) / ctl;
  // ADAPT-2 (B-9): empty weeks in the chronic window make an ordinary return week read as a spike.
  // With 3+ trained weeks among the 8 before this one, the ratio is also read against the user's
  // usual trained week (median of the last 4 trained weeks) and the smaller of the two counts, so
  // a real jump above the usual week still shows and nothing reads higher than before.
  const byWeek = new Array<number>(USUAL_WEEK_LOOKBACK + 1).fill(0);
  for (const s of sessions) {
    const w = Math.floor(ago(s.day) / 7);
    if (w >= 1 && w <= USUAL_WEEK_LOOKBACK) byWeek[w]! += sessionRpeLoad(s);
  }
  const weekLoads = byWeek.slice(1).filter(load => load > 0);
  if (weekLoads.length < USUAL_WEEK_MIN_TRAINED) return ratio;
  const recent = weekLoads.slice(0, USUAL_WEEK_SAMPLE).sort((a, b) => a - b);
  const mid = recent.length / 2;
  const usual = recent.length % 2 ? recent[Math.floor(mid)]! : (recent[mid - 1]! + recent[mid]!) / 2;
  return Math.min(ratio, acuteLoad / usual);
}

/** Whole-body slowdown from multi-day sleep debt, resting-HR deviation and acute training load. Never from one bad night. Capped. */
export function systemicFactor(healthDays: DailyHealth[], sessions: Session[], atMs: number): number {
  let factor = 1.0;
  // One day key for the reference time; per-item dayKey() calls made this O(n) in Date work per session.
  const ref = dayKey(new Date(atMs));
  const within = (day: string, days: number): boolean => { const d = daysBetween(day, ref); return d >= 0 && d < days; };
  const sleep7 = healthDays.filter(d => within(d.day, 7) && d.sleepMinutes != null).map(d => d.sleepMinutes! / 60);
  if (sleep7.length && avg(sleep7) < SYSTEMIC_SLEEP_HOURS) factor *= SYSTEMIC_SLEEP_FACTOR;

  const rhr7 = healthDays.filter(d => within(d.day, 7) && d.restingHr != null).map(d => d.restingHr!);
  const rhr28 = healthDays.filter(d => within(d.day, 28) && d.restingHr != null).map(d => d.restingHr!);
  if (rhr7.length && rhr28.length >= 2) {
    const sd = stddev(rhr28);
    // AUD-6 (SCI-06): only a rise is the adverse direction, as in readiness; a fall alone is not fatigue.
    if (sd > 0 && (avg(rhr7) - avg(rhr28)) / sd > SYSTEMIC_RHR_SD) factor *= SYSTEMIC_RHR_FACTOR;
  }

  const ratio = acuteChronicRatio(sessions, ref);
  if (ratio != null && ratio > SYSTEMIC_LOAD_RATIO) factor *= clamp(1 + (ratio - SYSTEMIC_LOAD_RATIO) * 0.5, 1.0, SYSTEMIC_LOAD_FACTOR_MAX);
  return Math.min(SYSTEMIC_CAP, factor);
}

export interface Dose { sessionId: string; muscle: MuscleId; at: number; day: string; A: number; tau: number; drivers: Array<{ text: string; hours: number }> }

/** Every session's per-muscle dose and time constant, chronological. Pure over plain data. */
function sessionMuscleDoses(sessions: Session[], custom: Exercise[], profile: Profile, healthDays: DailyHealth[], recoveryModel: RecoveryModel): Record<MuscleId, Dose[]> {
  const out = Object.fromEntries(MUSCLE_IDS.map(m => [m, [] as Dose[]])) as Record<MuscleId, Dose[]>;
  const exposureCount = new Map<string, number>();
  const lastTopKg = new Map<string, number>();
  const lastMuscleTouch = new Map<MuscleId, number>();
  const sorted = [...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  // systemicFactor depends on the time only through its day (BR-23): one evaluation per day.
  const systemicByDay = new Map<string, number>();
  let lo = 0;

  for (const [idx, session] of sorted.entries()) {
    const at = new Date(session.logging?.trainedEndAt || session.endedAt || session.startedAt).getTime();
    const perMuscle = new Map<MuscleId, { total: number; effortWeighted: number; roleWeightSum: number; topL: number; topDriver: { text: string; hours: number } | null }>();
    const hardSetIndex = new Map<MuscleId, number>();
    const seenExerciseThisSession = new Set<string>();

    for (const ex of session.exercises) {
      const meta = findExercise(ex.exerciseId, custom) ?? findExercise(ex.name, custom);
      if (!meta) continue;
      const working = ex.sets.filter(isWorkingSet);
      if (!working.length) continue;
      const priorExposure = exposureCount.get(meta.id) ?? 0;
      const exerciseNovelty = priorExposure === 0 ? NOVELTY_FIRST_EXPOSURE : priorExposure === 1 ? NOVELTY_SECOND_EXPOSURE : 1.0;
      const recentTop = lastTopKg.get(meta.id) ?? null;
      const sessionTopKg = Math.max(0, ...working.map(s => s.kg ?? 0));

      for (const set of working) {
        const reps = set.reps ?? 0;
        const rF = reps > 0 ? repFactor(reps) : 1.0;
        const loadFactor = meta.mode === 'weighted' && recentTop && recentTop > 0 && (set.kg ?? 0) > 0
          ? clamp((set.kg ?? 0) / recentTop, LOAD_FACTOR_MIN, LOAD_FACTOR_MAX) : 1.0;
        const effort = effortLabel(set) ?? 'ideal';
        const e = EFFORT_IMPULSE[effort];
        const damage = setDamage({ id: meta.id, name: meta.name, role: meta.role }, reps);
        for (const r of rolesFor(meta)) {
          const roleW = ROLE_WEIGHT[r.role];
          const idx = (hardSetIndex.get(r.muscle) ?? 0) + 1;
          hardSetIndex.set(r.muscle, idx);
          const diminish = idx > HARD_SET_DIMINISH_AFTER ? HARD_SET_DIMINISH_FACTOR : 1.0;
          const layoffDays = lastMuscleTouch.has(r.muscle) ? (at - lastMuscleTouch.get(r.muscle)!) / 86_400_000 : Infinity;
          const layoffNovelty = layoffDays >= NOVELTY_LAYOFF_DAYS ? NOVELTY_LAYOFF_FACTOR : 1.0;
          const novelty = Math.max(exerciseNovelty, layoffNovelty);
          const L = roleW * e * rF * loadFactor * diminish * damage * novelty;
          const cur = perMuscle.get(r.muscle) ?? { total: 0, effortWeighted: 0, roleWeightSum: 0, topL: 0, topDriver: null };
          cur.total += L;
          cur.effortWeighted += EFFORT_STRETCH[effort] * L;
          cur.roleWeightSum += roleW;
          // BR-31: the driver is the set with the biggest dose, and the set count is this exercise's own.
          if (!cur.topDriver || L > cur.topL) {
            cur.topL = L;
            const reason = effort === 'max' ? `${meta.name}: max effort` : layoffNovelty > 1 ? `${meta.name}: first time in a while` : exerciseNovelty > 1 ? `${meta.name}: new exercise` : `${meta.name}: ${working.length} set${working.length === 1 ? '' : 's'}`;
            cur.topDriver = { text: reason, hours: 0 };
          }
          perMuscle.set(r.muscle, cur);
        }
      }
      exposureCount.set(meta.id, priorExposure + 1);
      seenExerciseThisSession.add(meta.id);
      if (sessionTopKg > 0) lastTopKg.set(meta.id, sessionTopKg);
    }

    const atDay = dayKey(new Date(at));
    let systemic = systemicByDay.get(atDay);
    if (systemic === undefined) {
      // systemicFactor only reads sessions from the 28 days up to this day: pass that window (with
      // a 2-day margin for day/start ordering) instead of the whole history. BUG-17 (RECOVERY-F7):
      // never a session that started later, so a dose is the same whatever came after it.
      while (lo < idx && daysBetween(sorted[lo]!.day, atDay) > 30) lo++;
      systemic = systemicFactor(healthDays, sorted.slice(lo, idx + 1), at);
      systemicByDay.set(atDay, systemic);
    }
    const trainingAge = trainingAgePrior(trainingAgeMonths(profile, sorted, at));
    const age = agePrior(ageOf(profile, at));

    for (const [muscle, agg] of perMuscle) {
      if (agg.total <= 0) continue;
      const effortStretch = agg.effortWeighted / agg.total;
      const volumeStretch = clamp(Math.sqrt(agg.roleWeightSum / VOLUME_STRETCH_DIVISOR), VOLUME_STRETCH_MIN, VOLUME_STRETCH_MAX);
      const tauScale = recoveryModel.tauScale[muscle] ?? 1.0;
      const tau = TAU_BASE_HOURS * MUSCLE_BY_ID[muscle].recoveryFactor * effortStretch * volumeStretch * trainingAge * age * systemic * tauScale;
      out[muscle].push({ sessionId: session.id, muscle, at, day: session.day, A: agg.total, tau, drivers: agg.topDriver ? [agg.topDriver] : [] });
    }
    for (const m of perMuscle.keys()) lastMuscleTouch.set(m, at);
  }
  return out;
}

function fRefFor(doses: Dose[], atMs: number): number {
  const prior = doses.filter(d => d.at <= atMs).slice(-F_REF_SESSION_LOOKBACK).map(d => d.A);
  if (!prior.length) return F_REF_FLOOR;
  const sorted = [...prior].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;
  return Math.max(median, F_REF_FLOOR);
}

function residualOf(dose: Dose, atMs: number): number {
  const hours = (atMs - dose.at) / 3_600_000;
  if (hours < 0) return 0;
  return dose.A * (FAST_SHARE * Math.exp(-hours / FAST_TAU_HOURS) + SLOW_SHARE * Math.exp(-hours / dose.tau));
}

function stackedResidual(doses: Dose[], atMs: number): number {
  const cutoff = atMs - IMPULSE_LOOKBACK_DAYS * 86_400_000;
  return doses.filter(d => d.at >= cutoff && d.at <= atMs).reduce((a, d) => a + residualOf(d, atMs), 0);
}

function pctAt(doses: Dose[], fRef: number, atMs: number, lastTouchAt: number): number {
  if ((atMs - lastTouchAt) / 3_600_000 >= FLOOR_DAYS * 24) return 100;
  const f = stackedResidual(doses, atMs);
  return clamp(Math.round((1 - f / fRef) * 100), 0, 100);
}

/**
 * Smallest hours-since-`fromMs` where pct first reaches `targetPct`. BUG-17 (RECOVERY-F1): searched up
 * to the 120 h cap first (unchanged results inside it), then on to the 7-day floor, where pct is 100 by
 * definition, so a recovering muscle always gets its real time.
 */
function solveHours(doses: Dose[], fRef: number, lastTouchAt: number, fromMs: number, targetPct: number): number {
  const fromHours = Math.max(0, (fromMs - lastTouchAt) / 3_600_000);
  if (pctAt(doses, fRef, fromMs, lastTouchAt) >= targetPct) return fromHours;
  let lo = fromHours, hi = Math.max(fromHours, READY_TO_HOURS_CAP);
  if (hi === fromHours || pctAt(doses, fRef, lastTouchAt + hi * 3_600_000, lastTouchAt) < targetPct) { lo = hi; hi = FLOOR_DAYS * 24; }
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const p = pctAt(doses, fRef, lastTouchAt + mid * 3_600_000, lastTouchAt);
    if (p >= targetPct) hi = mid; else lo = mid;
  }
  return hi;
}

function confidenceFor(observations: number): MuscleRecovery['confidence'] {
  if (observations >= 8) return 'high';
  if (observations >= 3) return 'medium';
  return 'low';
}

export interface RecoveryInputs {
  sessions: Session[];
  custom?: Exercise[];
  now?: number;
  profile?: Profile;
  healthDays?: DailyHealth[];
  checkIns?: CheckIn[];
  freshMarks?: FreshMark[];
  recoveryModel?: RecoveryModel;
  /** Only `pct` is needed (calibration): skip solving the ready/full times. */
  pctOnly?: boolean;
}

export type MuscleDoses = Record<MuscleId, Dose[]>;

/** The per-muscle doses for a session list: build once, then evaluate at several times with recoveryAt. */
export function muscleDoses(input: RecoveryInputs): MuscleDoses {
  const { sessions, custom = [], profile = { name: '' }, healthDays = [], recoveryModel = { tauScale: {}, observations: {} } } = input;
  return sessionMuscleDoses(sessions, custom, profile, healthDays, recoveryModel);
}

export function recoveryStatus(input: RecoveryInputs): MuscleRecovery[] {
  return recoveryAt(muscleDoses(input), input);
}

/** Recovery at `input.now` from doses already built for the same sessions. */
export function recoveryAt(doses: MuscleDoses, input: RecoveryInputs): MuscleRecovery[] {
  const { sessions, now = Date.now(), healthDays = [], checkIns = [], freshMarks = [], recoveryModel = { tauScale: {}, observations: {} } } = input;
  const today = dayKey(new Date(now));
  // Calibration needs only pct; the whole-body factor shown next to it is left out there.
  const systemicNow = input.pctOnly ? 1 : Math.round(systemicFactor(healthDays, sessions, now) * 100) / 100;

  return MUSCLE_IDS.map(muscle => {
    const list = doses[muscle];
    const last = list[list.length - 1];
    // BUG-17 (RECOVERY-F3): "Mark as fresh" sets the residual to zero (plan 6.11 point 7): doses at or
    // before the latest mark up to now never stack again, also after a later session.
    const freshMs = Math.max(-Infinity, ...freshMarks.filter(f => f.muscle === muscle).map(f => Date.parse(f.at)).filter(ms => ms <= now));
    const freshOverridesLast = last && freshMs >= last.at;

    if (!last || freshOverridesLast) {
      // AUD-6 (SCI-03): today's soreness still caps a muscle with no log or a fresh mark. Only a mark made
      // today outranks it; check-ins carry a day, not a time, so a mark from an earlier day is older.
      const rating = checkIns.find(c => c.day === today)?.soreness?.[muscle];
      const soreToday = rating != null && rating >= SORENESS_CAP_MIN_RATING && !(freshMs > -Infinity && dayKey(new Date(freshMs)) === today);
      const pct = soreToday ? SORENESS_CAP_PCT : 100;
      return {
        muscle, pct, hoursLeft: 0, windowHours: 0,
        lastTrainedAt: last ? new Date(last.at).toISOString() : null, lastDay: last?.day ?? null,
        personalized: false, recovering: pct < READY_PCT, ready: pct >= READY_PCT, readyInHours: null, fullInHours: null,
        confidence: 'low', drivers: [], systemicFactor: 1,
        ...(soreToday ? { soreToday } : {}),
      };
    }

    const fRef = fRefFor(list, now);
    // Every time evaluated below is now or later, so doses older than the lookback never count:
    // drop them once instead of in each of the ~80 bisection steps.
    // fRef (the muscle's typical dose) still reads the doses before a fresh mark: it sizes a session, it is not a residual.
    const recent = list.filter(d => d.at >= now - IMPULSE_LOOKBACK_DAYS * 86_400_000 && d.at > freshMs);
    let pct = pctAt(recent, fRef, now, last.at);

    // Soreness caps today's pct; it never raises it, and no soreness never implies ready either.
    const todaySoreness = checkIns.find(c => c.day === today)?.soreness?.[muscle];
    const modelPct = pct;
    if (todaySoreness != null && todaySoreness >= SORENESS_CAP_MIN_RATING) pct = Math.min(pct, SORENESS_CAP_PCT);
    const soreToday = pct < modelPct && pct < READY_PCT;

    const tReady = input.pctOnly ? null : solveHours(recent, fRef, last.at, now, READY_PCT);
    const tFull = input.pctOnly ? null : solveHours(recent, fRef, last.at, now, FULL_PCT);
    // solveHours counts from the last session; ready/full times are shown from now (BR-02).
    const r1 = (x: number) => Math.round(x * 10) / 10;
    const elapsedH = Math.max(0, (now - last.at) / 3_600_000);
    // Sore but past the model's own ready time: the soreness decides, not the clock.
    const soreOnly = soreToday && tReady != null && tReady <= elapsedH;
    const readyInHours: [number, number] | null = pct >= READY_PCT || tReady == null || soreOnly || (tReady - elapsedH > READY_TO_HOURS_CAP) ? null : [r1(Math.max(0, tReady - elapsedH) * 0.85), Math.min(READY_TO_HOURS_CAP, r1(Math.max(0, tReady - elapsedH) * 1.15))];
    const observations = recoveryModel.observations[muscle] ?? 0;
    const tauScale = recoveryModel.tauScale[muscle] ?? 1.0;
    // BUG-17 (RECOVERY-F1): more than 120 h still to go is shown as "5+ days", never as "0 hours left".
    const beyondCap = !input.pctOnly && tReady != null && tReady - elapsedH > READY_TO_HOURS_CAP;

    return {
      muscle,
      pct,
      hoursLeft: tReady == null ? 0 : Math.max(0, Math.round((tReady - elapsedH) * 10) / 10),
      windowHours: tReady == null ? READY_TO_HOURS_CAP : Math.round(tReady * 10) / 10,
      lastTrainedAt: new Date(last.at).toISOString(),
      lastDay: last.day,
      personalized: Math.abs(tauScale - 1) > 0.01,
      recovering: pct < READY_PCT,
      ready: pct >= READY_PCT,
      readyInHours,
      // QA2-FC-5: held back by soreness past the model's own time, no clock time says when it is full either.
      fullInHours: tFull == null || soreOnly ? null : r1(Math.max(0, tFull - elapsedH)),
      confidence: confidenceFor(observations),
      drivers: last.drivers,
      systemicFactor: systemicNow,
      ...(soreToday ? { soreToday } : {}),
      ...(beyondCap ? { beyondCap } : {}),
    };
  });
}

export function recoveryTier(pct: number): 'low' | 'mid' | 'high' | 'ready' {
  if (pct >= READY_PCT) return 'ready';
  if (pct >= 75) return 'high';
  if (pct >= 40) return 'mid';
  return 'low';
}

/** Two-sided, bounded calibration (6.11 point 8): run once per primary muscle after a session finishes. */
export function calibrateTauScale(currentScale: number, predictedPct: number, performanceDeltaPct: number | null): number {
  if (performanceDeltaPct == null) return currentScale;
  let next = currentScale;
  if (performanceDeltaPct <= -CALIBRATION_PERFORMANCE_DROP * 100 && predictedPct >= CALIBRATION_PREDICTED_HIGH) next = currentScale * TAU_SCALE_UP;
  else if (performanceDeltaPct >= 0 && predictedPct <= CALIBRATION_PREDICTED_LOW) next = currentScale * TAU_SCALE_DOWN;
  return clamp(next, TAU_SCALE_MIN, TAU_SCALE_MAX);
}

/**
 * Runs once, right after a session finishes: for each primary muscle of an exercise rated max
 * effort with a matched-effort prior session, compares the predicted recovery at session start
 * against the e1RM change and nudges that muscle's tauScale. Pure: `priorSessions` must not yet
 * include `newSession`.
 *
 * BUG-17: a change counts only beyond two typical errors (RECOVERY-F4); the prior session must be
 * inside the model's 7-day window, so a layoff never reads as slow recovery (RECOVERY-F6); and a
 * muscle this session trains without evidence drifts TAU_SCALE_DECAY of the way back to 1.0.
 */
/**
 * BUG-18 x BUG-17 (A6): the exercise's last session before this one, summarised on its own, the
 * way `replayRecoveryModel` sees it. BUG-24: only a cheap first check (was a set rated max, is it
 * inside the window); the numbers calibration learns from come from `judgedPair`.
 */
export function lastSummaryAlone(priorSessions: Session[], exerciseId: string, custom: Exercise[]): ExerciseSessionSummary | undefined {
  const last = exerciseHistory(priorSessions, exerciseId, custom).at(-1);
  const sess = last && priorSessions.find(s => s.id === last.sessionId);
  return sess ? exerciseHistory([sess], exerciseId, custom)[0] : undefined;
}

/**
 * BUG-24: this session's summary and the exercise's previous one, with held sets judged in
 * `history`, every session up to and including `sessionId`, as finish sees them. So a typo BUG-18
 * holds at that moment never moves tauScale, and a rebuild that judges each step against its own
 * prefix learns what finish learned.
 */
export function judgedPair(history: Session[], sessionId: string, exerciseId: string, custom: Exercise[]): { cur?: ExerciseSessionSummary; prev?: ExerciseSessionSummary } {
  const hist = exerciseHistory(history, exerciseId, custom);
  return { cur: hist.find(h => h.sessionId === sessionId), prev: hist.filter(h => h.sessionId !== sessionId).at(-1) };
}

/**
 * BUG-24: `judgedPair` at each step of a rebuild, without judging the whole prefix again each time
 * (that is O(n^2) per step). Per exercise, each session's summary is kept as the last step judged
 * it. A new step can change a summary only by confirming one of its held sets (a later set repeats
 * the load) or by moving its reference (an earlier session's best load or e1RM changed), so only
 * those are judged again; the result is what `exerciseHistory` over the prefix gives.
 */
export function stepJudge(sorted: Session[], custom: Exercise[]): (i: number, exerciseId: string) => ReturnType<typeof judgedPair> {
  interface Row { id: string; day: string; sets: LoggedSet[]; sum?: ExerciseSessionSummary; refKg: number; refE1rm: number }
  const byExercise = new Map<string, { rows: Row[]; next: number; isMain: boolean; checkLoad: boolean }>();
  return (i, exerciseId) => {
    let st = byExercise.get(exerciseId);
    if (!st) byExercise.set(exerciseId, (st = { rows: [], next: 0, isMain: findExercise(exerciseId, custom)?.role === 'main', checkLoad: loadIsChecked(exerciseId, custom) }));
    for (; st.next <= i; st.next++) {
      const sess = sorted[st.next]!;
      // Its working sets as exerciseHistory gathers them; summarising them again gives the same numbers.
      const alone = exerciseHistory([sess], exerciseId, custom)[0];
      if (!alone) continue;
      // exerciseHistory orders by day, a tie keeping the input (start) order.
      const at = st.rows.findIndex(r => r.day > sess.day);
      st.rows.splice(at < 0 ? st.rows.length : at, 0, { id: sess.id, day: sess.day, sets: alone.sets, refKg: 0, refE1rm: 0 });
    }
    let bestKg = 0, bestE1rm = 0;
    st.rows.forEach((r, j) => {
      if (!r.sum || r.sum.held.length || r.refKg !== bestKg || r.refE1rm !== bestE1rm) {
        // plausibilityRef reads only the best top load and e1RM before this session.
        const ref = plausibilityRef([{ topKg: bestKg, bestE1rm } as ExerciseSessionSummary], st!.isMain);
        const later = st!.rows.slice(j + 1).flatMap(x => x.sets);
        r.sum = summarizeSets(r.id, r.day, r.sets, heldIn(r.sets, later, ref, st!.checkLoad));
        r.refKg = bestKg;
        r.refE1rm = bestE1rm;
      }
      bestKg = Math.max(bestKg, r.sum.topKg);
      bestE1rm = Math.max(bestE1rm, r.sum.bestE1rm);
    });
    const id = sorted[i]!.id;
    return { cur: st.rows.find(r => r.id === id)?.sum, prev: st.rows.filter(r => r.id !== id).at(-1)?.sum };
  };
}

const ratedMax = (h: ExerciseSessionSummary | undefined): boolean => !!h?.sets.some(s => s.effort === 'max');

/**
 * `prevSummary`, when given, returns the exercise's last summary before this session; `predict`,
 * when given, returns the predicted recovery at the session start from doses already built
 * (replayRecoveryModel), so a full rebuild stays linear; `judge`, when given, returns `judgedPair`
 * for the exercise. All must give what the defaults would.
 */
export function calibrateAfterSession(priorSessions: Session[], newSession: Session, custom: Exercise[], profile: Profile, healthDays: DailyHealth[], recoveryModel: RecoveryModel, prevSummary?: (exerciseId: string) => ExerciseSessionSummary | undefined, predict?: (atMs: number) => MuscleRecovery[], judge?: (exerciseId: string) => ReturnType<typeof judgedPair>): RecoveryModel {
  const startedAtMs = new Date(newSession.logging?.trainedAt ?? newSession.startedAt).getTime();
  // Only computed when some exercise has a max-effort comparison to learn from (most sessions have none).
  let predictedMemo: MuscleRecovery[] | null = null;
  const predicted = (): MuscleRecovery[] => (predictedMemo ??= predict ? predict(startedAtMs) : recoveryStatus({ sessions: priorSessions, custom, now: startedAtMs, profile, healthDays, checkIns: [], freshMarks: [], recoveryModel, pctOnly: true }));
  const tauScale = { ...recoveryModel.tauScale };
  const observations = { ...recoveryModel.observations };
  const touched = new Set<MuscleId>();
  const trained = new Set<MuscleId>();
  let withNew: Session[] | null = null;

  for (const ex of newSession.exercises) {
    const meta = findExercise(ex.exerciseId, custom);
    if (!meta) continue;
    if (ex.sets.some(isWorkingSet)) meta.primary.forEach(m => trained.add(m));
    // AUD-1 (SCI-01): e1RM compares lifted loads, so only modes whose kg is the load (BUG-18's
    // loadIsChecked). Assisted kg is help and bodyweight kg is added load only: never evidence.
    if (!loadIsChecked(ex.exerciseId, custom)) continue;
    // A cheap first check on every set, held ones included (BUG-24: held-out sets only rate lower).
    if (!ratedMax(exerciseHistory([newSession], ex.exerciseId, custom).at(-1))) continue;
    const prevAlone = prevSummary ? prevSummary(ex.exerciseId) : lastSummaryAlone(priorSessions, ex.exerciseId, custom);
    if (!prevAlone || !ratedMax(prevAlone)) continue;
    // Past the 7-day window the predicted pct is the 100 % floor whatever happened: nothing to learn.
    if (daysBetween(prevAlone.day, newSession.day) >= FLOOR_DAYS) continue;
    // BUG-24: the numbers leave out the sets BUG-18 holds at this finish.
    const { cur, prev } = judge ? judge(ex.exerciseId) : judgedPair((withNew ??= [...priorSessions, newSession]), newSession.id, ex.exerciseId, custom);
    if (!cur?.hasMax || cur.bestE1rm <= 0 || !prev?.hasMax || prev.bestE1rm <= 0) continue;
    const deltaPct = ((cur.bestE1rm - prev.bestE1rm) / prev.bestE1rm) * 100;
    for (const muscle of meta.primary) {
      if (touched.has(muscle)) continue;
      touched.add(muscle);
      const predictedPct = predicted().find(r => r.muscle === muscle)?.pct ?? 50;
      const before = tauScale[muscle] ?? 1.0;
      const after = calibrateTauScale(before, predictedPct, deltaPct);
      // Evidence beyond the noise margin never decays, even when the clamp holds tauScale where it is.
      if (calibrateTauScale(1.0, predictedPct, deltaPct) !== 1.0) trained.delete(muscle);
      if (after !== before) {
        tauScale[muscle] = after;
        observations[muscle] = (observations[muscle] ?? 0) + 1;
      }
    }
  }
  for (const muscle of trained) {
    const before = tauScale[muscle];
    if (before == null || before === 1) continue;
    const after = 1 + (before - 1) * (1 - TAU_SCALE_DECAY);
    tauScale[muscle] = Math.abs(after - 1) < 0.001 ? 1 : after;
  }
  return { tauScale, observations };
}

/**
 * UI-12 / BUG-17 (RECOVERY-F7): the recovery model rebuilt from history, as finishSession learned it
 * session by session. Each step gets what finish had: the whole prior history (doses are built once
 * for all sessions, then the step's tauScale is applied to those before it), the real training start
 * and the exercise's last summary (BUG-25: last by day, as finish reads it). `calibrates` says which
 * sessions finish calibrated.
 */
export function replayRecoveryModel(sorted: Session[], custom: Exercise[], profile: Profile, healthDays: DailyHealth[], calibrates: (s: Session) => boolean): RecoveryModel {
  const empty: RecoveryModel = { tauScale: {}, observations: {} };
  // tauScale 1 leaves every tau exactly as built (x * 1 === x), so scaling later matches finish bit for bit.
  const all = sessionMuscleDoses(sorted, custom, profile, healthDays, empty);
  const indexOf = new Map(sorted.map((sess, i) => [sess.id, i]));
  const lastSummary = new Map<string, ExerciseSessionSummary>();
  const keyOf = (exerciseId: string) => findExercise(exerciseId, custom)?.id ?? exerciseId;
  const judgeAt = stepJudge(sorted, custom);
  let model = empty;
  sorted.forEach((sess, i) => {
    if (calibrates(sess)) {
      const predict = (atMs: number): MuscleRecovery[] => {
        const scaled = Object.fromEntries(MUSCLE_IDS.map(m => {
          const scale = model.tauScale[m] ?? 1.0;
          const prior = all[m].filter(d => indexOf.get(d.sessionId)! < i);
          return [m, scale === 1 ? prior : prior.map(d => ({ ...d, tau: d.tau * scale }))];
        })) as MuscleDoses;
        return recoveryAt(scaled, { sessions: [], custom, now: atMs, profile, healthDays, checkIns: [], freshMarks: [], recoveryModel: model, pctOnly: true });
      };
      // BUG-24: held sets judged against this step's prefix, the history finish had. Only asked
      // when an exercise passes the cheap check (rated max twice inside the window).
      const judge = (id: string) => judgeAt(i, id);
      // All callbacks are given, so the prior list itself is never read: no O(n) copy per step.
      model = calibrateAfterSession([], sess, custom, profile, healthDays, model, id => lastSummary.get(keyOf(id)), predict, judge);
    }
    for (const e of sess.exercises) {
      const h = exerciseHistory([sess], e.exerciseId, custom);
      const last = h[h.length - 1];
      // BUG-25: the previous session is the last by day, as finish's lastSummaryAlone reads it; a
      // tie goes to the later start. A session dated before the one kept does not replace it.
      const key = keyOf(e.exerciseId);
      const kept = lastSummary.get(key);
      if (last && (!kept || last.day >= kept.day)) lastSummary.set(key, last);
    }
  });
  return model;
}

/** The lowest recovery % among an exercise's primary muscles (F2.1's progression hook). Moved from Train.tsx so Escobar's tools share it. */
export function recoveryPctFor(exerciseId: string, custom: Exercise[], recovery: Array<Pick<MuscleRecovery, 'muscle' | 'pct'>>): number | undefined {
  const meta = findExercise(exerciseId, custom);
  if (!meta) return undefined;
  const pcts = meta.primary.map(m => recovery.find(r => r.muscle === m)?.pct).filter((v): v is number => v != null);
  return pcts.length ? Math.min(...pcts) : undefined;
}
