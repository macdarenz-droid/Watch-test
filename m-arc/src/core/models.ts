import type { MuscleId } from '@/data/muscles';
import type { GoalId } from '@/data/goals';

export type Effort = 'easy' | 'ideal' | 'max';
export type Weekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
export const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * How resistance works for an exercise. It decides what "progress" means:
 * weighted → more load; bodyweight → more reps; assisted → less help;
 * duration → longer; conditioning → further or longer at the same load.
 */
export type ResistanceMode = 'weighted' | 'bodyweight' | 'assisted' | 'duration' | 'conditioning';

export interface Exercise {
  id: string;
  name: string;
  equipment: string;
  primary: MuscleId[];
  secondary: MuscleId[];
  stabilizers: MuscleId[];
  aliases: string[];
  pattern: string;
  defaultSets: number;
  mode: ResistanceMode;
  /** Main lifts get the goal's main rep range; everything else gets the accessory range. */
  role: 'main' | 'accessory';
  /** True for exercises the user created. */
  custom?: boolean;
}

export type LoadUnit = 'kg' | 'lb';

/** What a piece of equipment really loads, in its own unit (§25.3). */
export interface EquipmentProfile {
  unit: LoadUnit;
  /** Smallest jump in `unit` (stack pin step, dumbbell step). */
  step?: number;
  /** Explicit available loads in `unit`, ascending, at most 80. */
  ladder?: number[];
  /** Stack add-on weights in `unit`. */
  addOns?: number[];
  /** Barbell/EZ/trap bar weight, canonical kg. */
  barKg?: number;
  /** Plate denominations in `unit`, per side. */
  plates?: number[];
  source: 'user' | 'suspect_fix' | 'escobar_scan' | 'escobar_chat' | 'default';
  updatedAt: string;
}

export interface Gym { id: string; name: string; defaultUnit: LoadUnit; createdAt: string }

/** Gyms and their equipment (§25). Loads keep their canonical kg; this only decides entry units and loadable targets. */
export interface UnitsState {
  /** At least one; cap 8. */
  gyms: Gym[];
  activeGymId: string;
  byExercise: Record<string, Record<string, EquipmentProfile>>;
  byEquipment: Record<string, Partial<Record<string, EquipmentProfile>>>;
}

export const MAX_GYMS = 8;
export const DEFAULT_GYM_ID = 'gym_default';

export function freshUnits(defaultUnit: LoadUnit = 'kg', now = new Date()): UnitsState {
  return { gyms: [{ id: DEFAULT_GYM_ID, name: 'My gym', defaultUnit, createdAt: now.toISOString() }], activeGymId: DEFAULT_GYM_ID, byExercise: {}, byEquipment: {} };
}

export type SetFidelity = 'live' | 'delayed' | 'retro' | 'edited';
export type SetFlag = 'implausible_load' | 'implausible_reps' | 'unit_suspect' | 'duplicate' | 'future_time';

/** Heart rate around one set. Series live in heartStore (6.3); only aggregates live here. */
export interface SetHeart {
  /** Highest bpm from set start to the commit. */
  peakBpm: number;
  /** bpm at commit. */
  endBpm: number;
  restStartBpm?: number;
  /** endBpm minus bpm 60s after commit, only when a live sample existed there. */
  hrr60?: number;
}

export interface LoggedSet {
  /** Stable id (R2.8), created with the set in a live session and kept in history. Older sets have none. */
  id?: string;
  /** Live session only: draft until committed. Dropped when the session is finished. */
  status?: 'draft' | 'committed' | 'skipped';
  kg?: number;
  reps?: number;
  effort?: Effort;
  durationSec?: number;
  distanceM?: number;
  /** Commit time. Absent for sets from before this field existed, or the past-session flow. */
  at?: string;
  /** Seconds since the previous commit in this session, capped at 600. */
  restSec?: number;
  fidelity?: SetFidelity;
  flags?: SetFlag[];
  heart?: SetHeart;
  /** Exactly what was typed and in which unit (§25). `kg` stays the canonical number; display in the entered unit uses this verbatim. */
  entered?: { value: number; unit: LoadUnit };
  /** F2: a warm-up is logged but never counted; a drop set counts but sets no record; to failure implies max effort. */
  kind?: SetKind;
}

export type SetKind = 'warmup' | 'drop' | 'failure';

export interface LoggedExercise {
  exerciseId: string;
  name: string;
  sets: LoggedSet[];
  /** F1: a note for this exercise in this session. */
  note?: string;
  /** LT-3 (D-A4 a): set 1's target as shown when set 1 was committed; absent on older sessions. */
  target?: PlannedTarget;
}

/** LT-3 (D-A4 a): a planned load in kg and reps. */
export interface PlannedTarget { kg: number; reps: number }

/** How a session was logged, and how much its timing can be trusted. See brain/fidelity.ts. */
export interface SessionLogging {
  mode: 'live' | 'mixed' | 'retro' | 'legacy';
  /** When training actually started: the timer, the user's own answer, the schedule slot, or a 17:00 default. */
  trainedAt: string;
  trainedEndAt: string;
  /** When Finish (or Save) was tapped. */
  loggedAt: string;
  timeSource: 'timer' | 'user' | 'schedule' | 'default';
  /** 0-1 share of sets with fidelity 'live'. */
  liveShare: number;
  timingTrusted: boolean;
  contentConfidence: 'high' | 'medium' | 'low';
  flags: string[];
}

/** Energy for one session, frozen at finish time (6.10). Recomputing history when the
 * user's weight changes later would silently rewrite the past, so this is stored, not derived. */
export interface SessionEnergy {
  /** Total burn including resting metabolism. */
  grossKcal: number;
  /** Gross minus resting metabolism for the same minutes; comparable to a watch or Health Connect. */
  activeKcal: number;
  /** AUD-20 (SCI-10): no longer written or shown; sessions saved before it still carry the old ±25 % / ±10 % band. */
  low?: number;
  high?: number;
  minutes: number;
  source: 'heart_rate' | 'watch_energy' | 'health_connect';
  /** The profile values used to compute this, so History can say "estimated with 75 kg at the time". */
  profileSnapshot: { kg: number; age: number | null; sex: 'male' | 'female' | null };
}

export interface SessionHeart {
  source: 'ble';
  deviceName?: string;
  /** Valid samples: contact true and bpm > 0. */
  samples: number;
  avgBpm: number;
  maxBpm: number;
  minBpm: number;
  hrr60Median?: number;
  /** Seconds in each of zones 1-5. */
  zoneSec: [number, number, number, number, number];
  energy?: SessionEnergy;
  /** 0-1 share of session time with a live (not delayed/stale) sample. */
  coverage: number;
}

export interface Session {
  id: string;
  splitId: string;
  splitName: string;
  /** Local calendar day, YYYY-MM-DD. Derived from logging.trainedAt, never from when it was logged. */
  day: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  exercises: LoggedExercise[];
  logging: SessionLogging;
  heart?: SessionHeart;
  /** The gym this session was trained at (§25). */
  gymId?: string;
  /** F1: a note for the whole session, from the finish screen. */
  note?: string;
}

export interface SplitExercise {
  exerciseId: string;
  sets: number;
}

export interface Split {
  id: string;
  name: string;
  color: string;
  exercises: SplitExercise[];
  /** Up to two muscles the user wants to bring up with this split. */
  focus: MuscleId[];
  createdAt: string;
}

export interface RestState {
  endsAt: number;
  totalSec: number;
  pausedRemainingSec?: number;
  /** F1.2: bpm when rest started and the effort just committed, so heart-guided rest has a target. Absent when the stream wasn't LIVE at that moment. */
  preSetBpm?: number;
  effort?: Effort;
}

export interface ActiveSession {
  /** Created at start and kept as the finished Session's id (R2.8). */
  id?: string;
  splitId: string;
  startedAt: string;
  pausedMs: number;
  pausedAt?: number;
  /** Working copy of the exercises for this session. */
  entries: Array<{ id?: string; exerciseId: string; name: string; sets: LoggedSet[]; done: boolean; skipped: boolean; /** Today's applied load change from Escobar (ES-02). */ loadFactor?: number; /** F1: today's note for this exercise. */ note?: string; /** QA3-8b: the exerciseId this slot was planned as before a substitution changed it, so saving can find it by lineage instead of by array position. */ plannedId?: string; /** LT-3 (D-A4 a): set 1's target at commit, carried into the saved exercise. */ target?: PlannedTarget }>;
  rest?: RestState;
  /** The gym this session is at (§25), stamped at start. */
  gymId?: string;
}

export interface Reminders {
  enabled: boolean;
  /** HH:MM local time. */
  time: string;
  style: 'silent' | 'vibrate' | 'alert';
  /** F3.8: swap today's body for a readiness one-liner when today is a scheduled day. Off by default; only ever affects the notification already scheduled for today, since a future day's readiness cannot be known ahead of time. */
  readinessSummary?: boolean;
}

/** Remembers the last watch so a session can reconnect without scanning again. */
export interface WatchPreference {
  autoConnectOnSession: boolean;
  deviceAddress?: string;
  deviceName?: string;
}

/** How rest between sets decides it's done (F1.2). `heart` needs a connected, LIVE watch; a stale stream falls back to the timer. */
export interface RestPreference {
  mode: 'time' | 'heart';
  /** Share of heart-rate reserve that counts as "recovered enough", 0-1. */
  heartTargetPct: number;
  minSec: number;
}

export interface Preferences {
  /** The display unit ("Show weights in"). The entry unit is per exercise and gym (§25). */
  weightUnit: LoadUnit;
  restDefaultSec: number;
  autoRest: boolean;
  haptics: boolean;
  reminders: Reminders;
  /** Show the daily quote card. */
  showSpark: boolean;
  watch: WatchPreference;
  rest: RestPreference;
  /** F5: a weekly "save a backup" notification (default on in the Android app). */
  backupReminder?: boolean;
  /** 7.5: unset (old saves too) means off. Only on once the user says yes to the one-time ask. */
  errorReports?: boolean;
  /** 7.5: the one-time ask has been shown and answered, Yes or No. */
  errorReportsAsked?: boolean;
}

export interface Profile {
  name: string;
  bodyWeightKg?: number;
  heightCm?: number;
  sex?: 'male' | 'female';
  birthYear?: number;
  /** Month the user started training, YYYY-MM. Defaults to the first session's month. */
  trainingSince?: string;
  /** Preferred training days per week, independent of which days are actually scheduled. */
  plannedDays?: number;
  /** Manual override for hrMax(); otherwise derived from observed max or the Tanaka formula. */
  hrMaxOverride?: number;
  /** Manual override for restingHr(); otherwise the 7-day median of healthDays. */
  restingHrOverride?: number;
}

export interface WeightEntry {
  day: string;
  kg: number;
}

export type ProfileField = 'bodyWeightKg' | 'heightCm' | 'birthYear' | 'sex' | 'goal' | 'trainingSince' | 'plannedDays';
export interface ProfileChange {
  at: string;
  field: ProfileField;
  from: unknown;
  to: unknown;
  source: 'user' | 'onboarding' | 'health_connect' | 'migration' | 'escobar';
}

export interface Onboarding {
  completedAt?: string;
  /** ISO timestamps of "Later" taps, newest last, so the sheet can back off after a few. */
  dismissedAt: string[];
  lastReviewAt?: string;
  /** Set the first time a watch connects and the profile sheet was shown for it, so it only asks once (6.10). */
  watchPromptedAt?: string;
}

/** A day's soreness-only check-in (recovery v2). Sleep quality and mood join this later without a migration. */
export interface CheckIn {
  day: string;
  soreness?: Partial<Record<MuscleId, 1 | 2 | 3 | 4 | 5>>;
  sleepQuality?: 1 | 2 | 3 | 4 | 5;
  mood?: 1 | 2 | 3 | 4 | 5;
  note?: string;
}

/** Recovery-model self-calibration (6.11 point 8). Bounded, slow, two-sided. */
export interface RecoveryModel {
  tauScale: Partial<Record<MuscleId, number>>;
  observations: Partial<Record<MuscleId, number>>;
}

/** F3.3: a lighter week, offered by the coach and accepted by the user. Closes itself after endDay. */
export interface Deload {
  startDay: string;
  endDay: string;
  reason: string;
  setFactor: number;
  loadFactor: number;
}

/** F3.6: "Helpful" or a 7-day snooze on one insight id. Newest last. */
export interface InsightFeedback {
  id: string;
  day: string;
  verdict: 'helpful' | 'snoozed';
}

/** A muscle the user marked recovered from the muscle sheet, overriding the model for today. */
export interface FreshMark {
  muscle: MuscleId;
  at: string;
}

export interface BodyMeasurement {
  day: string;
  neckCm: number;
  waistCm: number;
  hipCm?: number;
  bodyFatPct: number;
  /** QA-R3a-10: set on readings computed with the cm formula; older readings are recomputed once on load. */
  formula?: 'navy-cm';
}

export interface HealthSnapshot {
  connected: boolean;
  lastSync?: string;
  sleepMinutes?: number;
  restingHr?: number;
  steps?: number;
  activeCalories?: number;
}

/** One day's Health Connect readings. `restingHr`/`latestHr` are point samples, not averages. */
export interface DailyHealth {
  day: string;
  restingHr?: number;
  restingHrAt?: string;
  latestHr?: number;
  latestHrAt?: string;
  sleepMinutes?: number;
  sleepEndAt?: string;
  steps?: number;
  activeCalories?: number;
  /** HRV (F2.3): only ever populated on a device that sends RR intervals — dormant on the GT6 (Appendix E). */
  rmssd?: number;
  lnRmssd?: number;
  rmssdAt?: string;
  source: 'health_connect' | 'watch' | 'manual';
  syncedAt: string;
  /** QA2-FE-1: when steps or active calories were last read; a later sync that failed them keeps this. */
  totalsSyncedAt?: string;
}

/** The closed set of inline components Escobar can draw (§4.4). */
export type ShowComponentId =
  | 'lift_trend' | 'recovery_map' | 'volume_bars' | 'readiness_gauge' | 'readiness_history' | 'week_summary'
  | 'session_summary' | 'records_list' | 'plan_week' | 'plan_evaluation' | 'exercise_card' | 'heart_session'
  | 'compare_periods' | 'body_trend';
export const SHOW_COMPONENT_IDS: ShowComponentId[] = [
  'lift_trend', 'recovery_map', 'volume_bars', 'readiness_gauge', 'readiness_history', 'week_summary',
  'session_summary', 'records_list', 'plan_week', 'plan_evaluation', 'exercise_card', 'heart_session',
  'compare_periods', 'body_trend',
];

export type MemoryKind = 'fact' | 'injury' | 'equipment' | 'preference' | 'goal' | 'agreement' | 'episode';
export const MEMORY_KINDS: MemoryKind[] = ['fact', 'injury', 'equipment', 'preference', 'goal', 'agreement', 'episode'];

/** Something Escobar remembers about the person (§17). Plain words, at most 200 characters. */
export interface MemoryItem {
  id: string;
  kind: MemoryKind;
  text: string;
  source: 'user_said' | 'inferred' | 'user_edit' | 'summary';
  createdAt: string;
  updatedAt: string;
  /** Injuries default to 42 days out, then ask "Still true?". */
  expiresOn?: string;
  conversationId?: string;
}

/** A component the person pinned to Today with consent (`pin_card`). */
export interface PinnedCard {
  id: string;
  component: ShowComponentId;
  params: Record<string, unknown>;
  title: string;
  pinnedAt: string;
  until?: string;
}

export type TodayChange =
  | { kind: 'swap'; from: string; to: string }
  | { kind: 'remove'; exerciseId: string }
  | { kind: 'add'; exerciseId: string; sets: number }
  | { kind: 'sets'; exerciseId: string; sets: number }
  | { kind: 'load'; exerciseId: string; factor: number };

/** Today's session, adjusted by Escobar and applied by the person (§10.4). Only valid while `day` is today. */
export interface TodayOverride {
  day: string;
  splitId: string;
  reason: string;
  changes: TodayChange[];
}

export interface DailyBrief {
  day: string;
  headline: string;
  priorities: Array<{ insightId: string; line: string }>;
  generatedAt: string;
  source: 'escobar' | 'brain';
}

/** The online coach (§6.1). Conversations live under their own key (`marc.escobar.v1`), not here. */
export interface EscobarState {
  /** "Online coach" toggle. Nothing leaves the phone while off. */
  enabled: boolean;
  /** null = the built-in proxy URL; only a Settings edit stores a string. */
  proxyUrl: string | null;
  /** 'dev_' + 24 hex chars, created lazily. Empty until first needed. */
  deviceId: string;
  sharing: { health: boolean; body: boolean };
  tone: 'warm' | 'direct';
  /** Off → the `remember` tool is refused. */
  memoryEnabled: boolean;
  memory: MemoryItem[];
  pins: PinnedCard[];
  todayOverride: TodayOverride | null;
  proactive: { enabled: boolean; shown: Record<string, string>; day: string; count: number };
  brief: DailyBrief | null;
  /** `costUsd` (F7): priced per step by the model that answered; absent on days recorded before it. */
  usage: { day: string; turns: number; inputTokens: number; outputTokens: number; cacheReadTokens: number; costUsd?: number };
  /** The old single-thread chat (`coach.askThread`) has been imported once (§6.3). */
  legacyImported: boolean;
}

export const MAX_MEMORY_ITEMS = 60;
export const MAX_MEMORY_TEXT = 200;
export const MAX_PINS = 4;

export function freshEscobar(): EscobarState {
  return {
    enabled: false,
    proxyUrl: null,
    deviceId: '',
    sharing: { health: false, body: false },
    tone: 'warm',
    memoryEnabled: true,
    memory: [],
    pins: [],
    todayOverride: null,
    proactive: { enabled: true, shown: {}, day: '', count: 0 },
    brief: null,
    usage: { day: '', turns: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 },
    legacyImported: false,
  };
}

export interface AppState {
  version: 1;
  createdAt: string;
  profile: Profile;
  goal: GoalId;
  splits: Split[];
  schedule: Record<Weekday, string | null>;
  sessions: Session[];
  active: ActiveSession | null;
  customExercises: Exercise[];
  preferences: Preferences;
  body: BodyMeasurement[];
  health: HealthSnapshot;
  /** Daily Health Connect history, newest last, capped at 180 days. */
  healthDays: DailyHealth[];
  /** Weigh-ins, newest last, capped at 400. */
  weightLog: WeightEntry[];
  /** Changes to profile facts, newest last, capped at 500. */
  profileHistory: ProfileChange[];
  onboarding: Onboarding;
  /** Per-muscle soreness check-ins, newest last, capped at 180. */
  checkIns: CheckIn[];
  recoveryModel: RecoveryModel;
  /** "Mark as fresh" overrides, newest last, capped at 100. Cleared once older than the muscle's fullInHours. */
  freshMarks: FreshMark[];
  /** The Monday key of the week whose review the user has already seen, so it stops reappearing. */
  weeklyReviewDismissedWeek?: string;
  /** Active lighter week, if any (F3.3). */
  deload: Deload | null;
  /** "Helpful"/snooze feedback per insight id, newest last, capped at 200 (F3.6). */
  insightFeedback: InsightFeedback[];
  /** Set once the old single-file app's data has been imported. */
  legacyImportedAt?: string;
  /** The online coach's settings, memory, pins and today's plan changes (§6.1). */
  escobar: EscobarState;
  /** Gyms and equipment units (§25). */
  units: UnitsState;
  /** RG-19 (D4): local days the person took off; a scheduled day off counts as unscheduled. Capped at 400. */
  daysOff: string[];
  /** F1: a sticky setup note per exercise id (seat height, grip), max 200 characters. */
  exerciseNotes: Record<string, string>;
  /** F5: when the last backup was exported. */
  lastBackupAt?: string;
}

export function emptySchedule(): Record<Weekday, string | null> {
  return { sun: null, mon: null, tue: null, wed: null, thu: null, fri: null, sat: null };
}

export function freshState(now = new Date()): AppState {
  return {
    version: 1,
    createdAt: now.toISOString(),
    profile: { name: '' },
    goal: 'lean',
    splits: [],
    schedule: emptySchedule(),
    sessions: [],
    active: null,
    customExercises: [],
    preferences: {
      weightUnit: 'kg',
      restDefaultSec: 90,
      autoRest: true,
      haptics: true,
      reminders: { enabled: false, time: '17:30', style: 'silent' },
      showSpark: true,
      watch: { autoConnectOnSession: true },
      rest: { mode: 'time', heartTargetPct: 0.6, minSec: 30 },
    },
    body: [],
    health: { connected: false },
    healthDays: [],
    weightLog: [],
    profileHistory: [],
    onboarding: { dismissedAt: [] },
    checkIns: [],
    recoveryModel: { tauScale: {}, observations: {} },
    freshMarks: [],
    deload: null,
    insightFeedback: [],
    escobar: freshEscobar(),
    units: freshUnits('kg', now),
    daysOff: [],
    exerciseNotes: {},
  };
}

export function newId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
