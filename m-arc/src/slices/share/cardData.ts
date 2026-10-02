/**
 * F12: what a share card says, for one workout or a period. Every number comes from the
 * brain: volume and sets from `workingTotals` (the weekly sum), records from `allRecords`,
 * muscle sets from `effectiveSetsByMuscle`, per-exercise tops from `summarizeSets`.
 * Loads are in the person's unit. Pure, so it is tested without a DOM.
 */
import type { Exercise, LoadUnit, LoggedSet, Session } from '@/core/models';
import { addDays, formatClock, formatDay, parseDay, dayKey, weekStart } from '@/core/dates';
import { kgToDisplay, setLoadIn } from '@/core/units';
import { sessionTotals, workingTotals } from '@/brain/weekly';
import { allRecords, type PersonalRecord } from '@/brain/prs';
import { effectiveSetsByMuscle, hasWorkingSets, isWorkingSet } from '@/brain/exposure';
import { modeOf, summarizeSets } from '@/brain/history';
import type { MuscleId } from '@/data/muscles';
import { WEIGHT_THINGS } from '@/data/weights';
import type { BodyWeightAt } from '@/brain/bodyweight';

export type SharePeriod = 'workout' | 'week' | 'month' | 'quarter' | 'year' | 'all';
export const SHARE_PERIODS: Array<{ id: SharePeriod; label: string }> = [
  { id: 'workout', label: 'This workout' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: '3 months' },
  { id: 'year', label: 'Year' },
  { id: 'all', label: 'All time' },
];

/** One receipt line: an exercise with its sets or sessions, and its volume. */
export interface CardLine { exerciseId: string; name: string; detail: string; value: string; volumeKg: number; pr: boolean }

export interface ShareCardData {
  period: SharePeriod;
  unit: LoadUnit;
  /** Short pill text, e.g. "Today", "This week", "September". */
  label: string;
  title: string;
  sub: string;
  from: string;
  to: string;
  sessions: number;
  sets: number;
  durationSec: number;
  /** Some session in the period has no recorded duration, so `durationSec` is a minimum (QA4-10). */
  timePartial: boolean;
  volumeKg: number;
  /** Volume in `unit`, rounded to a whole number. */
  volume: number;
  records: PersonalRecord[];
  muscleSets: Partial<Record<MuscleId, number>>;
  /** Heaviest volume first. */
  lines: CardLine[];
  /** The poster's "≈ 3 hippos" line, or null when nothing fits. */
  compare: { id: string; text: string } | null;
}

export interface CardInput {
  sessions: Session[];
  custom: Exercise[];
  unit: LoadUnit;
  today: string;
  period: SharePeriod;
  /** The workout for `period: 'workout'`. */
  session?: Session | null;
  /** Comparison ids used by recent shares, oldest first, so the next card picks something new. */
  seen?: string[];
  /** F13: body weight per day; undefined = pre-F13 numbers. */
  bodyWeight?: BodyWeightAt;
}

const NUM = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
export const groupInt = (v: number): string => NUM.format(Math.round(v));

/** A card with no working sets: Save and Share stay off. */
export const isEmptyCard = (d: Pick<ShareCardData, 'sets'>): boolean => d.sets === 0;

/** The newest session with working sets, by start time, for "This workout" when no session was picked. */
export function latestSession(sessions: Session[]): Session | null {
  return sessions.filter(hasWorkingSets).reduce<Session | null>((best, s) => (!best || `${s.day}|${s.startedAt}` > `${best.day}|${best.startedAt}` ? s : best), null);
}

function periodStart(period: Exclude<SharePeriod, 'workout'>, today: string, sessions: Session[]): string {
  if (period === 'week') return weekStart(today);
  if (period === 'month') return `${today.slice(0, 7)}-01`;
  if (period === 'year') return `${today.slice(0, 4)}-01-01`;
  if (period === 'quarter') { const d = parseDay(`${today.slice(0, 7)}-01`); d.setMonth(d.getMonth() - 2); return dayKey(d); }
  return sessions.reduce((m, s) => (s.day < m ? s.day : m), today);
}

const dm = (key: string) => formatDay(key, { day: 'numeric', month: 'short' });
const my = (key: string) => formatDay(key, { month: 'short', year: 'numeric' });
const mon = (key: string, month: 'short' | 'long' = 'short') => formatDay(key, { month });

function periodWords(period: Exclude<SharePeriod, 'workout'>, from: string, to: string): { label: string; title: string; sub: string } {
  const year = to.slice(0, 4);
  if (period === 'week') return { label: 'This week', title: 'Week in the gym', sub: `${dm(from)} – ${dm(to)}` };
  if (period === 'month') return { label: mon(to, 'long'), title: mon(to, 'long'), sub: `${dm(from)} – ${dm(to)} ${year}` };
  if (period === 'quarter') return { label: `${mon(from)} – ${mon(to)}`, title: 'Last 3 months', sub: `${dm(from)} – ${dm(to)} ${year}` };
  if (period === 'year') return { label: year, title: `Your ${year}`, sub: `${mon(from)} – ${my(to)}` };
  return { label: `Since ${my(from)}`, title: 'All time', sub: `${my(from)} – today` };
}

/**
 * Volume of one exercise's working sets, in `unit`, as receipt text.
 * Assisted work counts sets when it has no volume (QA4-1; F13 gives it volume when body weight is known).
 * With no volume, "BW" only when nothing was loaded; a loaded carry or hold reads "—" (QA4-2).
 */
function lineValue(volumeKg: number, unit: LoadUnit, o: { assisted?: boolean; sets?: number; loaded?: boolean } = {}): string {
  if (o.assisted) return `${groupInt(o.sets ?? 0)} sets`;
  if (volumeKg > 0) return volumeShort(kgToDisplay(volumeKg, unit), unit);
  return o.loaded ? '—' : 'BW';
}

const isLoaded = (sets: LoggedSet[]) => sets.some(x => isWorkingSet(x) && (x.kg ?? 0) > 0);

function workoutLines(session: Session, unit: LoadUnit, prIds: Set<string>, custom: Exercise[], bwKg: number | null): CardLine[] {
  const out: CardLine[] = [];
  for (const e of session.exercises) {
    const sum = summarizeSets(session.id, session.day, e.sets);
    if (!sum.sets.length) continue;
    const n = sum.sets.length;
    const mode = modeOf(e.exerciseId, custom); const assisted = mode === 'assisted';
    const w = sum.sets;
    const loaded = w.filter(x => (x.kg ?? 0) > 0);
    // The top set: the heaviest (assisted: the least help), then the most reps, metres, seconds.
    const better = (a: LoggedSet, b: LoggedSet) => (b.reps ?? 0) - (a.reps ?? 0) || (b.distanceM ?? 0) - (a.distanceM ?? 0) || (b.durationSec ?? 0) - (a.durationSec ?? 0);
    // QA4-1b: an assisted top comes from every working set, least help first; no help at all is the best.
    const pool = assisted || !loaded.length ? w : loaded;
    const top = [...pool].sort((a, b) => (assisted ? (a.kg ?? 0) - (b.kg ?? 0) : loaded.length ? (b.kg ?? 0) - (a.kg ?? 0) : 0) || better(a, b))[0]!;
    // QA4-2: a set with no reps (a carry, a sled, a hold) is measured in metres, then seconds.
    const measure = (x: LoggedSet) => ((x.reps ?? 0) > 0 ? `${x.reps}` : (x.distanceM ?? 0) > 0 ? `${x.distanceM} m` : (x.durationSec ?? 0) > 0 ? `${x.durationSec}s` : '0');
    const load = (top.kg ?? 0) > 0 ? `@${mode === 'bodyweight' ? '+' : ''}${setLoadIn(top, unit)}${assisted ? ' assist' : ''}` : '';
    // QA4-6: "3×5 @80" only when every working set was the same; a ramp names its top set.
    const same = w.every(x => x.kg === w[0]!.kg && x.reps === w[0]!.reps && x.distanceM === w[0]!.distanceM && x.durationSec === w[0]!.durationSec);
    const detail = same ? `${n}×${measure(top)}${load ? ` ${load}` : ''}` : `${n} sets, top ${measure(top)}${load}`;
    const { volumeKg } = workingTotals([e], custom, bwKg);
    out.push({ exerciseId: e.exerciseId, name: e.name, detail, value: lineValue(volumeKg, unit, { assisted: assisted && volumeKg === 0, sets: n, loaded: isLoaded(e.sets) }), volumeKg, pr: prIds.has(e.exerciseId) });
  }
  return out.sort((a, b) => b.volumeKg - a.volumeKg);
}

function periodLines(inRange: Session[], unit: LoadUnit, prIds: Set<string>, custom: Exercise[], bw?: BodyWeightAt): CardLine[] {
  const by = new Map<string, { name: string; count: number; sets: number; volumeKg: number; loaded: boolean }>();
  for (const s of inRange) for (const e of s.exercises) {
    if (!e.sets.some(isWorkingSet)) continue;
    const row = by.get(e.exerciseId) ?? { name: e.name, count: 0, sets: 0, volumeKg: 0, loaded: false };
    const t = workingTotals([e], custom, bw?.(s.day) ?? null);
    row.loaded ||= isLoaded(e.sets);
    row.name = e.name;
    row.count++;
    row.sets += t.sets;
    row.volumeKg += t.volumeKg;
    by.set(e.exerciseId, row);
  }
  return [...by].map(([exerciseId, r]) => ({ exerciseId, name: r.name, detail: `×${r.count}`, value: lineValue(r.volumeKg, unit, { assisted: modeOf(exerciseId, custom) === 'assisted' && r.volumeKg === 0, sets: r.sets, loaded: r.loaded }), volumeKg: r.volumeKg, pr: prIds.has(exerciseId) }))
    .sort((a, b) => b.volumeKg - a.volumeKg || a.name.localeCompare(b.name));
}

/** Everything a card shows for one period. With no session for 'workout', the card is empty. */
export function cardData(input: CardInput): ShareCardData {
  const base = cardNumbers(input);
  return { ...base, compare: volumeCompare(base.volumeKg, { unit: input.unit, seed: `${base.period}|${base.from}|${base.to}|${base.volumeKg}`, seen: input.seen }) };
}

function cardNumbers(input: CardInput): Omit<ShareCardData, 'compare'> {
  const { sessions, custom, unit, today, period } = input;
  const records = allRecords(sessions, custom, unit);
  if (period === 'workout') {
    const s = input.session ?? null;
    const recs = s ? records.filter(r => r.sessionId === s.id) : [];
    const bwKg = s ? input.bodyWeight?.(s.day) ?? null : null;
    const totals = workingTotals(s?.exercises ?? [], custom, bwKg);
    return {
      period, unit,
      label: !s ? 'Today' : s.day === today ? 'Today' : dm(s.day),
      title: s?.splitName ?? 'Workout',
      sub: !s ? '' : s.durationSec > 0 ? `${formatDay(s.day)} · ${Math.round(s.durationSec / 60)} min` : formatDay(s.day),
      from: s?.day ?? today, to: s?.day ?? today,
      sessions: s ? 1 : 0,
      sets: totals.sets,
      durationSec: s?.durationSec ?? 0,
      timePartial: false,
      volumeKg: Math.round(totals.volumeKg),
      volume: Math.round(kgToDisplay(totals.volumeKg, unit)),
      records: recs,
      muscleSets: s ? effectiveSetsByMuscle([s], s.day, addDays(s.day, 1), custom) : {},
      lines: s ? workoutLines(s, unit, new Set(recs.map(r => r.exerciseId)), custom, bwKg) : [],
    };
  }
  const from = periodStart(period, today, sessions);
  const inRange = sessions.filter(s => s.day >= from && s.day <= today);
  const recs = records.filter(r => r.day >= from && r.day <= today);
  const totals = sessionTotals(inRange, custom, input.bodyWeight);
  return {
    period, unit, ...periodWords(period, from, today), from, to: today,
    sessions: inRange.length,
    sets: totals.sets,
    durationSec: inRange.reduce((a, s) => a + (s.durationSec || 0), 0),
    timePartial: inRange.some(s => !(s.durationSec > 0)),
    volumeKg: Math.round(totals.volumeKg),
    volume: Math.round(kgToDisplay(totals.volumeKg, unit)),
    records: recs,
    muscleSets: effectiveSetsByMuscle(inRange, from, addDays(today, 1), custom),
    lines: periodLines(inRange, unit, new Set(recs.map(r => r.exerciseId)), custom, input.bodyWeight),
  };
}

/* ---------- words for the numbers ---------- */

/** The poster's big number and the words under it: 4,710 "kg lifted", 29.8 "tonnes lifted", 65.8 "k lb lifted". */
export function volumeHero(volume: number, unit: LoadUnit): { big: string; unit: string } {
  if (volume < 10_000) return { big: groupInt(volume), unit: `${unit} lifted` };
  const k = new Intl.NumberFormat('en-GB', { maximumFractionDigits: volume >= 100_000 ? 0 : 1 }).format(volume / 1000);
  return { big: k, unit: unit === 'kg' ? 'tonnes lifted' : 'k lb lifted' };
}

/** Compact volume for receipts: "4,710 kg", "29.8 t", "65.8k lb". */
export function volumeShort(volume: number, unit: LoadUnit): string {
  const h = volumeHero(volume, unit);
  if (volume < 10_000) return `${h.big} ${unit}`;
  return unit === 'kg' ? `${h.big} t` : `${h.big}k lb`;
}

/** Training time: a workout as a clock (58:12), a period in hours and minutes (3 h 52 m, 131 h). */
export function timeText(d: Pick<ShareCardData, 'period' | 'durationSec'> & { timePartial?: boolean }): string {
  // Imported and past sessions can have no recorded duration: a dash, not "0 m".
  if (!(d.durationSec > 0)) return '—';
  if (d.period === 'workout') return formatClock(d.durationSec);
  const mins = Math.round(d.durationSec / 60);
  const h = Math.floor(mins / 60), m = mins % 60;
  // QA4-10: with untimed sessions in the period the total is a minimum.
  const plus = d.timePartial ? '+' : '';
  if (h >= 100) return `${h} h${plus}`;
  return `${h ? `${h} h ${m} m` : `${m} m`}${plus}`;
}

/** The most of one thing a card will count: "≈ 188 red 25 kg plates" reads well, "≈ 4,000 gold bars" doesn't. */
export const MAX_COMPARE_COUNT = 200;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * A playful comparison for the kg total, from the WEIGHT_THINGS library: only things that give a
 * count of 1 to MAX_COMPARE_COUNT, gym kit in the lifter's unit. `seed` shuffles the choice per
 * card; `seen` (oldest first) holds what recent shares used, so the pick is something not shown
 * yet, or the one shown longest ago once every option has had a turn.
 */
export function volumeCompare(volumeKg: number, opts: { unit?: LoadUnit; seed?: string; seen?: string[] } = {}): { id: string; text: string } | null {
  const fits = WEIGHT_THINGS.filter(t => (!t.unit || t.unit === (opts.unit ?? 'kg')) && volumeKg / t.kg >= 0.95 && Math.round(volumeKg / t.kg) <= MAX_COMPARE_COUNT);
  if (!fits.length) return null;
  const seed = opts.seed ?? '';
  const order = [...fits].sort((a, b) => hash(`${seed}|${a.id}`) - hash(`${seed}|${b.id}`));
  const seen = opts.seen ?? [];
  const pick = order.find(t => !seen.includes(t.id)) ?? order.reduce((best, t) => (seen.indexOf(t.id) < seen.indexOf(best.id) ? t : best));
  const n = Math.max(1, Math.round(volumeKg / pick.kg));
  return { id: pick.id, text: `≈ ${groupInt(n)} ${n === 1 ? pick.one : pick.many}` };
}
