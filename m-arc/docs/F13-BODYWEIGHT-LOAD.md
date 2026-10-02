# F13: body weight counts as load (plus carry targets that show the weight)

Base: origin/main 4ba40bc. Every file:line below is at that commit. Owner-approved design. This spec makes every decision, so the coder has none to make. If a line number has moved, match on the quoted code.

Drift: main has since moved to 406c73c (polish b1). Of the files this spec edits, only two changed: `src/ui/primitives.tsx` (+5 lines above WeightInput: it starts at `:133`, its `aria-label` is at `:156`) and `src/slices/share/ShareSheet.tsx` (+6 lines: the `cardData` memo is at `:66-67`). Every other cited line is unchanged at 406c73c.

Checked in review: §3 (as now written), C1, C5 and Part B were applied to a scratch copy of 4ba40bc (`git archive`, so the repo was not touched), and the §7 tests for those parts were run there. All pass, including exact float totals such as 1536 with `toEqual`. The only failure was the old test-13 source guard, which is fixed below. The existing suite stayed green with the changes applied (80 files, 981 tests, plain `vitest run`). Typecheck is clean apart from a missing `@capacitor/app` module in that environment, which is unrelated. C2–C4 and C6–C10 (UI wiring) and `MARC_PERF=1` were not run.

## 1. Goal

The owner asked: "if I input my data in Settings, this should auto fill my real weight too? Home workouts, or whatever workouts that use body weight only." **Yes.** The body weight saved in Settings → Profile → Body weight ("Weigh in", `Profile.tsx:78-99`) fills in on its own, and there is nothing new to type.

| | Before (today) | After, with a body weight saved | After, with no body weight saved |
|---|---|---|---|
| 3 × 8 pull-ups | 0 kg of volume | 80 kg body weight → 1,920 kg | 0 kg, same as today |
| Pull-up with +10 kg, 3 × 5 | 150 kg (added load only) | 90 kg × 15 = 1,350 kg | 150 kg |
| Assisted pull-up with 40 kg help, 3 × 10 | 0 kg (QA4-1) | (80 − 40) × 30 = 1,200 kg | 0 kg |
| Push-ups, 3 × 10 | 0 kg | 0.64 × 80 = 51.2 kg × 30 = 1,536 kg | 0 kg |
| Home-workout share card | "5 sets done" | "3,914 kg lifted" | "5 sets done" |
| Stats "last top load", pull-up | "0 kg" | "≈ 80 kg" | "BW" |
| Train kg box on a bodyweight move | header "kg", reads as total load | header "+kg" (weight you add) | header "+kg" |
| Train, bodyweight move | nothing | "Your body weight counts: ≈ 51 kg, plus anything you add." | "Add your body weight in Settings to count bodyweight work" |
| Farmer's carry logged as kg × reps | target "3 reps", no weight shown | target "32 kg · 3 reps" (Part B; body weight not involved) | same |

What does not change: what counts as progress (bodyweight moves still progress by adding reps), records, trends, suggested targets for bodyweight and assisted moves, and the stored data. No-body-weight rule: when no body weight is saved, **every number is exactly what it is today**. Only the wording changes: "+kg", "BW", "BW+10 kg", "20 kg assist", and the hint line.

## 2. Rules

**R1. Formula** (canonical kg, per rep):
- bodyweight mode: `effective = bw × share + max(0, addedKg ?? 0)`
- assisted mode: `effective = max(0, bw × share − max(0, helpKg ?? 0))`. This can never go below 0 (assisted floor).
- Volume for a set = `effective × reps`. A set with no reps adds 0.
- Other modes (weighted, duration, conditioning) never use body weight.

**R2. Share table.** Keyed by library id. It applies only when the exercise is a library exercise (`!ex.custom`) in bodyweight or assisted mode. Any other exercise gets `null`, which means today's rule applies. Custom exercises are always `null`: their `pattern` is always `'other'` (`exercises.ts:257`) or `'custom'` (`escobar/apply.ts:177`), so a pattern fallback is impossible. Hevy also leaves custom exercises out. Sources below come from the fractions research pass at 4ba40bc and were not re-opened while this spec was written.

| id | share | basis | confidence |
|---|---|---|---|
| lib_push_up | 0.64 | Ebben et al., J Strength Cond Res 2011;25(10):2891-4, PMID 21873902 (https://pubmed.ncbi.nlm.nih.gov/21873902/): 0.64 × body mass. Conference version: Wurm, …, Ebben, ISBS **2010** (https://ojs.ub.uni-konstanz.de/cpa/article/view/4457). That landing page shows only the abstract, with no numbers, and PubMed returned a captcha in review, so 0.64 / 0.55 / 0.41 are unverified here; Gouvali 2005: 0.664 (https://pubmed.ncbi.nlm.nih.gov/15705025/); Suprak 2011 0.69/0.75, seen only as cited by Vural 2023 (https://pubmed.ncbi.nlm.nih.gov/20179649/, https://pmc.ncbi.nlm.nih.gov/articles/PMC10516423/) | high |
| lib_diamond_push_up | 0.64 | Same as push-up. Gouvali hand-width variants 0.53–0.73; the narrow-grip value itself is unconfirmed | medium |
| lib_incline_push_up | 0.50 | Ebben 2011 (as above, unverified here): 0.55 with hands on a 30 cm box, 0.41 on a 61 cm box. 0.50 ≈ a 40 cm step, interpolated, not measured | medium |
| lib_pike_push_up | 0.60 | No force study found. A non-primary blog reports ~0.66 | low, unverified |
| lib_bench_dip | 0.70 | No study. Static de Leva segment model gives 0.74 (knees bent) to 0.81; rounded down | low, unverified |
| lib_pull_up, lib_chin_up | 1.00 | Whole body lifted. Sánchez-Moreno 2017 treats body mass as load, abstract only (https://pubmed.ncbi.nlm.nih.gov/28338365/). Hevy counts 100% (https://help.hevyapp.com/hc/en-us/articles/38386262243223; returned 403 in review, so unverified here) | high |
| lib_assisted_pull_up | 1.00 (minus help) | Hevy: assisted = body weight − assistance (same URL) | high |
| lib_inverted_row | 0.65 | Melrose & Dawes 2015: 0.37 / 0.53 / 0.68 / 0.79 at 30 / 45 / 60 / 75° (https://www.scitechnol.com/resistance-characteristics-of-the-trx-suspension-training-system-at-different-angles-and-distances-from-the-hanging-point-pIuk.php?article_id=3265); Vural 2023: 0.69–0.73 with the body about parallel to the floor. Conservative pick | medium |
| lib_bodyweight_squat | 0.88 | Body minus both shanks and feet, de Leva 1996: 0.886 M / 0.878 F (https://wiki.has-motion.com/doku.php?id=visual3d%3Adocumentation%3Adefinitions%3Aadjusted_zatsiorsky-seluyanov_s_segment_inertia_parameters). Method as in Cormie 2007 (https://pubmed.ncbi.nlm.nih.gov/18076268/) | medium |
| lib_bodyweight_lunge, lib_bodyweight_split_squat | 0.88 | Same segment model. ExRx is said to give 0.74 for a split squat, but only from a search snippet; the page returned 403 (https://exrx.net/WeightTraining/Bodyweight) | low–medium, model only |
| lib_pistol_squat | 0.94 | Body minus one shank and foot (de Leva 0.943 M / 0.939 F) | medium |
| lib_bodyweight_calf_raise | 0.97 | Body minus both feet (de Leva 0.973) | medium-high |
| lib_crunch, lib_reverse_crunch, lib_v_up, lib_bicycle_crunch, lib_hanging_leg_raise, lib_hanging_knee_raise, lib_flutter_kicks, lib_ab_wheel_rollout, lib_dead_bug, lib_bird_dog, lib_superman | not in the table, so `null` | These move a body part around a pivot rather than lift the body, so kg × reps would mislead. No primary source | unverified |

That is 25 library moves in bodyweight or assisted mode (24 bodyweight, 1 assisted), taken from `inferMode` (`exercises.ts:20-26`): 14 ids are in the table and 11 are core moves.

How other apps count (context only, not a requirement; these pages were not re-opened in review):
- Hevy counts only 100% moves; custom exercises are never counted (https://help.hevyapp.com/hc/en-us/articles/34380762441111).
- Fitbod never counts body weight (https://help.fitbod.me/hc/en-us/articles/29486697282711, https://help.fitbod.me/hc/en-us/articles/12732749777047).
- Strong: no statement found (https://help.strongapp.io/). Unverified.

**R3. Nearest weigh-in.**
- The body weight for a session is the `weightLog` entry (`models.ts:274-277, 494-495`) whose `day` is nearest the session's `day`, measured in absolute days with `daysBetween` (`dates.ts:56`).
- On a tie, the earlier entry wins. There is no maximum distance.
- The log is never assumed to be sorted.
- Entries are skipped when `day` does not match `/^\d{4}-\d{2}-\d{2}$/`, or when `kg` is not a number in **30–300 kg** (`BODY_WEIGHT_RANGE_KG`). This is the bound Escobar already enforces (`escobar/tools/actions.ts:219`). Reason: the Weigh-in field accepts any positive value (`Profile.tsx:86`), and its typo check (`isWeightTypo`, `brain/onboarding.ts:55-58`) never fires on a first weigh-in. So "800" typed for 80.0 would otherwise multiply every bodyweight volume by 10. An out-of-range value counts as missing, so the numbers stay as they are today.
- Dates in both directions count. A weigh-in the day after a session is as good an estimate as one the day before. A weigh-in dated after *today* is not filtered out: the resolver is pure and has no clock. `logWeight` always stamps `todayKey()` (`profile.ts:49`, and Escobar goes through it, `apply.ts:159`), so such an entry can only come from a restored backup or a wrong device clock. It wins only when it is the nearest entry.

**R4. Fallback.**
- No usable log entry: use `profile.bodyWeightKg` (`models.ts:260`) if it passes the same 30–300 kg check. Legacy imports set it with no log entry (`migrate.ts:255`).
- Neither exists: the resolver is `undefined`, and every caller runs today's code path unchanged.

**R5. Units.**
- All maths is in canonical kg. `weightLog.kg` is stored in kg (`Profile.tsx:87` `displayToKg`), and `set.kg` is canonical kg.
- Display uses the display unit through `kgToDisplay` (`units.ts:13`). Nothing new is stored.

**R6. Rounding.**
- `effectiveLoadKg` returns an unrounded value.
- Totals keep today's rounding: `Math.round` at the end (`weekly.ts:57,125`; `cardData.ts:177-178,194-195`; the Stats tile at `History.tsx:237`).
- A single effective load is shown as `≈ ${Math.round(kgToDisplay(kg, unit))} ${unit}`, for example "≈ 51 kg" or "≈ 113 lb". It is whole units because the share is an estimate.

**R7. Read-time only.**
- Effective kg is never written to a session, a set, a backup or an export.
- There is no migration and no change to `models.ts`.

## 3. The one shared helper: new file `src/brain/bodyweight.ts`

Every path uses `effectiveLoadKg`. Nothing else multiplies body weight. Write the file exactly as follows:

```ts
/**
 * F13: body weight as load for bodyweight and assisted moves (docs/F13-BODYWEIGHT-LOAD.md).
 * Read-time only: stored sets keep the added kg (bodyweight) or the help (assisted).
 * Progression, records, trends and plate maths never import this file.
 */
import type { AppState, Exercise, LoadUnit, LoggedSet, ResistanceMode, WeightEntry } from '@/core/models';
import { daysBetween } from '@/core/dates';
import { formatLoad, formatSetLoad, kgToDisplay } from '@/core/units';
import { isWorkingSet } from './exposure';
import type { ExerciseSessionSummary } from './history';

/** Body weight in kg on a day, or null. */
export type BodyWeightAt = (day: string) => number | null;

/** Share of body weight moved per rep, by library id. Sources: docs/F13-BODYWEIGHT-LOAD.md §2 R2. */
export const BODYWEIGHT_SHARE: Readonly<Record<string, number>> = {
  lib_push_up: 0.64, lib_diamond_push_up: 0.64, lib_incline_push_up: 0.5, lib_pike_push_up: 0.6, lib_bench_dip: 0.7,
  lib_pull_up: 1, lib_chin_up: 1, lib_assisted_pull_up: 1, lib_inverted_row: 0.65,
  lib_bodyweight_squat: 0.88, lib_bodyweight_lunge: 0.88, lib_bodyweight_split_squat: 0.88, lib_pistol_squat: 0.94,
  lib_bodyweight_calf_raise: 0.97,
};

/** The share for a library bodyweight/assisted move; null for everything else (custom, core, other modes). */
export function bodyweightShare(ex: Exercise | undefined): number | null {
  if (!ex || ex.custom || (ex.mode !== 'bodyweight' && ex.mode !== 'assisted')) return null;
  return BODYWEIGHT_SHARE[ex.id] ?? null;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** A usable body weight: the 30–300 kg bound Escobar already enforces (escobar/tools/actions.ts:219). Outside it = missing (R3). */
export const BODY_WEIGHT_RANGE_KG: readonly [number, number] = [30, 300];
const validKg = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= BODY_WEIGHT_RANGE_KG[0] && v <= BODY_WEIGHT_RANGE_KG[1];
const validEntry = (w: WeightEntry | null | undefined): w is WeightEntry => !!w && typeof w.day === 'string' && DAY.test(w.day) && validKg(w.kg);

/** The weigh-in nearest `day` (tie: the earlier one); none: `fallbackKg`; none: null. Never assumes the log is sorted. */
export function bodyWeightOn(day: string, log: WeightEntry[], fallbackKg?: number): number | null {
  let best: WeightEntry | null = null;
  let bestGap = Infinity;
  for (const w of log) {
    if (!validEntry(w)) continue;
    const gap = Math.abs(daysBetween(w.day, day));
    if (gap < bestGap || (gap === bestGap && best != null && w.day < best.day)) { best = w; bestGap = gap; }
  }
  if (best) return best.kg;
  return validKg(fallbackKg) ? fallbackKg : null;
}

/** undefined when there is no weigh-in and no profile weight: every caller then behaves exactly as before F13. */
export function bodyWeightResolver(s: Pick<AppState, 'weightLog' | 'profile'>): BodyWeightAt | undefined {
  const log = s.weightLog ?? [];
  const fallback = s.profile?.bodyWeightKg;
  if (!log.some(validEntry) && !validKg(fallback)) return undefined;
  const memo = new Map<string, number | null>();
  return day => {
    if (!memo.has(day)) memo.set(day, bodyWeightOn(day, log, fallback));
    return memo.get(day)!;
  };
}

/** THE rule (F13 R1). null = no share or no body weight: the caller keeps its pre-F13 rule. */
export function effectiveLoadKg(addedKg: number | undefined, mode: ResistanceMode, share: number | null, bwKg: number | null): number | null {
  if (share == null || bwKg == null || !(bwKg > 0)) return null;
  const extra = Math.max(0, addedKg ?? 0);
  if (mode === 'bodyweight') return bwKg * share + extra;
  if (mode === 'assisted') return Math.max(0, bwKg * share - extra);
  return null;
}

/** Heaviest effective load among working sets, and the most reps done at it (as history.ts:32-34 does for topKg/topReps). null when effectiveLoadKg is null. */
export function topEffective(sets: LoggedSet[], mode: ResistanceMode, share: number | null, bwKg: number | null): { kg: number; reps: number } | null {
  let top: { kg: number; reps: number } | null = null;
  for (const s of sets) {
    if (!isWorkingSet(s)) continue;
    const v = effectiveLoadKg(s.kg, mode, share, bwKg);
    if (v == null) continue;
    const reps = s.reps ?? 0;
    if (!top || v > top.kg) top = { kg: v, reps };
    else if (v === top.kg && reps > top.reps) top = { kg: v, reps };
  }
  return top;
}

/** "≈ 51 kg": whole units, because the share is an estimate (R6). */
export const approxLoadText = (kg: number, unit: LoadUnit): string => `≈ ${Math.round(kgToDisplay(kg, unit))} ${unit}`;

/** A set's load by mode: "BW", "BW+10 kg", "20 kg assist". Other modes: exactly formatSetLoad (unchanged text). */
export function modeLoadText(set: Pick<LoggedSet, 'kg' | 'entered'>, mode: ResistanceMode, unit: LoadUnit): string {
  const loaded = (set.kg ?? 0) > 0;
  if (mode === 'bodyweight') return loaded ? `BW+${formatSetLoad(set, unit)}` : 'BW';
  if (mode === 'assisted') return loaded ? `${formatSetLoad(set, unit)} assist` : 'BW';
  return formatSetLoad(set, unit);
}

/**
 * Stats "last top load" and "reps at top", taken from the same set. For assisted work the heaviest
 * effective set is the one with the LEAST help, while topKg/topReps describe the MOST help, so the
 * reps must come from here too. Weighted and other modes: formatLoad(topKg) and topReps, unchanged.
 * An effective top of 0 (help >= body weight) falls back to today's text.
 */
export function lastTopStats(h: Pick<ExerciseSessionSummary, 'day' | 'sets' | 'topKg' | 'topReps'>, ex: Exercise | undefined, bw: BodyWeightAt | undefined, unit: LoadUnit): { load: string; reps: number } {
  const mode = ex?.mode ?? 'weighted';
  if (mode !== 'bodyweight' && mode !== 'assisted') return { load: formatLoad(h.topKg, unit), reps: h.topReps };
  const top = topEffective(h.sets, mode, bodyweightShare(ex), bw?.(h.day) ?? null);
  return top && top.kg > 0 ? { load: approxLoadText(top.kg, unit), reps: top.reps } : { load: modeLoadText({ kg: h.topKg }, mode, unit), reps: h.topReps };
}

/** The kg column header / placeholder: "+kg" for bodyweight moves, else the unit. */
export const loadColumnLabel = (mode: ResistanceMode, unit: LoadUnit): string => (mode === 'bodyweight' ? `+${unit}` : unit);

/** WeightInput aria-label; "Load in kg" (today's text) for every other mode. */
export const loadAriaLabel = (mode: ResistanceMode, unit: LoadUnit): string =>
  mode === 'bodyweight' ? `Added load in ${unit}` : mode === 'assisted' ? `Assistance in ${unit}` : `Load in ${unit}`;

export const NO_BODY_WEIGHT_HINT = 'Add your body weight in Settings to count bodyweight work';

/** The one Train line for a move with a share; null for moves without one. */
export function bodyweightHint(ex: Exercise | undefined, bwKg: number | null, unit: LoadUnit): string | null {
  const share = bodyweightShare(ex);
  if (share == null || !ex) return null;
  const base = effectiveLoadKg(undefined, ex.mode, share, bwKg);
  if (base == null) return NO_BODY_WEIGHT_HINT;
  return ex.mode === 'assisted'
    ? `Your body weight counts: ${approxLoadText(base, unit)}, minus the machine's help.`
    : `Your body weight counts: ${approxLoadText(base, unit)}, plus anything you add.`;
}
```

## 4. Where it applies (exact changes)

**C1. `src/brain/weekly.ts`**
- Imports: add `import { findExercise } from '@/core/exercises';` and `import { bodyweightShare, effectiveLoadKg, type BodyWeightAt } from './bodyweight';`.
- `:14-25` `workingTotals` becomes:
```ts
export function workingTotals(exercises: LoggedExercise[], custom: Exercise[] = [], bwKg: number | null = null): { sets: number; volumeKg: number } {
  let sets = 0, volumeKg = 0;
  for (const e of exercises) {
    const mode = modeOf(e.exerciseId, custom);
    const share = bwKg != null ? bodyweightShare(findExercise(e.exerciseId, custom)) : null;
    for (const x of e.sets) {
      if (!isWorkingSet(x)) continue;
      sets++;
      const eff = effectiveLoadKg(x.kg, mode, share, bwKg);
      if (eff != null) volumeKg += eff * (x.reps ?? 0);
      else if (mode !== 'assisted' && (x.kg ?? 0) > 0) volumeKg += (x.kg ?? 0) * (x.reps ?? 0);
    }
  }
  return { sets, volumeKg };
}

/** F13: workingTotals with each session's own body weight. No resolver: exactly the pre-F13 flat sum. */
export function sessionTotals(sessions: Session[], custom: Exercise[] = [], bw?: BodyWeightAt): { sets: number; volumeKg: number } {
  if (!bw) return workingTotals(sessions.flatMap(s => s.exercises), custom);
  let sets = 0, volumeKg = 0;
  for (const s of sessions) { const t = workingTotals(s.exercises, custom, bw(s.day)); sets += t.sets; volumeKg += t.volumeKg; }
  return { sets, volumeKg };
}
```
- Update the QA4-1 doc comment at `:12` to read: "assisted help never counts as weight lifted; with body weight (F13) an assisted set counts bw × share − help".
- `:40` becomes `weekSummary(sessions: Session[], today: string, custom: Exercise[] = [], plannedPerWeek: number | null = 3, bw?: BodyWeightAt)`. Keep `number | null`, because `plannedThisWeek` returns null (`:74`). `:45` becomes `const { sets, volumeKg } = sessionTotals(inWeek, custom, bw);`.
- `:117` becomes `weeklyVolumeHistory(sessions: Session[], today: string, weeks = 8, custom: Exercise[] = [], bw?: BodyWeightAt)`. `:122` becomes `const { sets, volumeKg } = sessionTotals(inWeek, custom, bw);`.
- Existing callers that pass no `bw` keep today's numbers: `selectors.ts:41`, `escobar/context/brief.ts:96`, `escobar/tools/read.ts:125,275`, and `escobar/tools/show.ts:118,128,183`.

**C2. `src/app/selectors.ts`**
- After `:27`, add `const weightLog = field('weightLog');` and `export const bodyWeightAt = computed(() => bodyWeightResolver({ weightLog: weightLog.value, profile: profile.value }));`.
- Import `bodyWeightResolver`.
- `:41` `week`: no change. Today and Coach show only its workouts, sets and records, not its volume.

**C3. `src/slices/history/volumeChart.ts:6-8`**
- Signature: `volumeChartWeeks(sessions, today, custom, unit, weeks = 12, bw?: BodyWeightAt)`.
- Pass `bw` as the fifth argument of `weeklyVolumeHistory`.

**C4. `src/slices/history/History.tsx`** (import `bodyWeightAt` from `@/app/selectors`, `findExercise` from `@/core/exercises`, `modeLoadText, lastTopStats, loadColumnLabel, loadAriaLabel` from `@/brain/bodyweight`, and add `ResistanceMode` to the type import at `:11`)
- `:127-132` `setLabel(st, u, mode: ResistanceMode)`. The line `const load = ...` becomes `const load = mode === 'bodyweight' || mode === 'assisted' ? modeLoadText({ kg: st.kg }, mode, u) : st.kg ? formatLoad(st.kg, u) : 'bw';`. Weighted text is unchanged.
  - Callers: `:113` gets `setLabel(st, u, modeOf(e.exerciseId, state.value.customExercises))`; `:262` gets `setLabel(st, u, mode)` (`mode` is already defined at `:228`).
- `:177` SessionEditor `WeightInput`: `placeholder={loadColumnLabel(modeOf(e.exerciseId, state.value.customExercises), st.entered?.unit ?? u)}` and `ariaLabel={loadAriaLabel(modeOf(e.exerciseId, state.value.customExercises), st.entered?.unit ?? u)}`.
- `:200` WeeklyVolumeChart becomes `const bw = bodyWeightAt.value;` then `useMemo(() => volumeChartWeeks(s.sessions, today.value, s.customExercises, u, 12, bw), [s.sessions, s.customExercises, today.value, u, bw])`.
- `:219` becomes `weekSummary(s.sessions, today.value, s.customExercises, plannedThisWeek(...), bodyWeightAt.value)`. That drives the `:237` volume tile, and `:237` itself does not change.
- After `:229`, add `const lastTop = hist.length ? lastTopStats(hist[hist.length - 1]!, findExercise(exercise, s.customExercises), bodyWeightAt.value, u) : null;`.
- `:258` becomes `<Stat value={lastTop!.load} label="last top load" />`, and `:259` becomes `<Stat value={`${lastTop!.reps}`} label="reps at top" />`. Both are inside `hist.length >= 2`. Reason: for an assisted move, `topKg`/`topReps` come from the set with the *most* help. Today the Stats view would read "≈ 50 kg" (the 30 kg-help set) next to "10 reps at top" (the 40 kg-help set). Weighted output is identical.
- No change: `:220` records, `:229` `progressTrend`, `:257` sparkline (`progressValue`).

**C5. `src/slices/share/cardData.ts`**
- `:55-65` CardInput: add `/** F13: body weight per day; undefined = pre-F13 numbers. */ bodyWeight?: BodyWeightAt;`.
- `:111` `workoutLines(session, unit, prIds, custom, bwKg: number | null)`:
  - `:117` becomes `const mode = modeOf(e.exerciseId, custom); const assisted = mode === 'assisted';`.
  - `:127` becomes `` const load = (top.kg ?? 0) > 0 ? `@${mode === 'bodyweight' ? '+' : ''}${setLoadIn(top, unit)}${assisted ? ' assist' : ''}` : ''; ``.
  - `:131` becomes `workingTotals([e], custom, bwKg)`.
  - `:132` lineValue option becomes `assisted: assisted && volumeKg === 0`.
- `:137` `periodLines(inRange, unit, prIds, custom, bw?: BodyWeightAt)`:
  - `:142` becomes `workingTotals([e], custom, bw?.(s.day) ?? null)`.
  - `:150` option becomes `assisted: modeOf(exerciseId, custom) === 'assisted' && r.volumeKg === 0`.
- `:166` becomes `workingTotals(s?.exercises ?? [], custom, s ? input.bodyWeight?.(s.day) ?? null : null)`, and `:181` passes `s ? input.bodyWeight?.(s.day) ?? null : null` to `workoutLines`.
- `:187` becomes `sessionTotals(inRange, custom, input.bodyWeight)`, and `:198` passes `input.bodyWeight` to `periodLines`.
- Import `sessionTotals` and `type BodyWeightAt`. Update the `:100` doc comment: "Assisted work counts sets when it has no volume (QA4-1; F13 gives it volume when body weight is known)".

**C6. `src/slices/share/ShareSheet.tsx:60-61`**
- Add `bodyWeightAt` to the `@/app/selectors` import at `:8`. Add `bodyWeight: bodyWeightAt.value` to the `cardData` input, and add `bodyWeightAt.value` to the deps (these are at `:66-67` on 406c73c).
- `cards.ts:145,272`: no change. The hero and TOTAL LIFTED already follow `d.volume > 0`.

**C7. `src/slices/workout/Train.tsx`** (import `bodyWeightAt` from `@/app/selectors`, and `bodyweightHint, loadColumnLabel, loadAriaLabel, modeLoadText` from `@/brain/bodyweight`)
- After `:429` (`const mode = ex?.mode ?? 'weighted';`), add `const bwHint = bodyweightHint(ex, bodyWeightAt.value?.(today.value) ?? null, u);`.
- `:497`: insert `{bwHint && <p class="hint">{bwHint}</p>}` immediately before the `set-grid` header div, and replace `<span class="hint">{eu}</span>` with `<span class="hint">{loadColumnLabel(mode, eu)}</span>`.
- `:511`: add `ariaLabel={loadAriaLabel(mode, eu)}`. Keep the placeholder as it is (the `'bw'` fallback stays; target and previous kg are already added kg).
- `:524`: in the last branch only, `` `${formatSetLoad(prev, eu)} × ${prev.reps ?? 0}` `` becomes `` `${modeLoadText(prev, mode, eu)} × ${prev.reps ?? 0}` ``. Weighted text stays identical because `modeLoadText` returns `formatSetLoad`.
- `:776`: `{profileFor(entry.exerciseId).unit}` becomes `{loadColumnLabel(findExercise(entry.exerciseId, s.customExercises)?.mode ?? 'weighted', profileFor(entry.exerciseId).unit)}`.
- `:780`: add `ariaLabel={loadAriaLabel(findExercise(entry.exerciseId, s.customExercises)?.mode ?? 'weighted', profileFor(entry.exerciseId).unit)}`.

**C8. `src/ui/primitives.tsx`**
- `:128-137` (`:133-142` on 406c73c): add `ariaLabel` to the destructured props and `ariaLabel?: string` to the prop type.
- `:151` (`:156` on 406c73c): `aria-label={ariaLabel ?? `Load in ${entryUnit}`}`.
- `scripts/screenshot-gate.mjs:593` finds `input[aria-label="Load in lb"]` on Dumbbell Bench Press, a weighted move, so it is unaffected.

**C9. `src/slices/coach/Coach.tsx:154`**
- Replace `formatLoad(h.topKg, s.preferences.weightUnit)` with `modeLoadText({ kg: h.topKg }, ex?.mode ?? 'weighted', s.preferences.weightUnit)`.
- **`src/slices/body/Body.tsx:142`**: replace `formatLoad(last.topKg, u)` with `modeLoadText({ kg: last.topKg }, e.mode, u)`.
- Weighted output is byte-identical: for a finite kg, `formatSetLoad({kg})` equals `formatLoad(kg)`.
- In both files, import `modeLoadText` from `@/brain/bodyweight` and remove the `formatLoad` import, which is now unused (`Coach.tsx:18`, `Body.tsx:14`; each had exactly one use).

**C10. `src/slices/profile/Profile.tsx:95`**
- Change to `<Field label={`Body weight (${u})`} hint="Also counts as the load on bodyweight exercises.">`.

## 5. Where it must NOT apply

- **Progression targets:** `brain/progression.ts`. Bodyweight and assisted branches `:167`, `:209`, `:217-219` and `:228-231` behave identically; Part B only adds carry branches. Also `brain/deload.ts:43`, `brain/coach/rules.ts:156,173`, and `brain/coach/pre.ts`.
- **History summaries:** `brain/history.ts:29-90`. `topKg`, `bestE1rm` and `volume` stay raw, because they feed progression, `trend.ts:78-101` and deload.
- **Records and e1RM:** `brain/prs.ts:79-82` keeps `best_reps` only. A body-weight gain must never create a strength record (`coach/post.ts:30` "genuine personal best"). `brain/e1rm.ts` is unchanged, and no e1RM includes body weight.
- **Trends:** `brain/trend.ts`, `slices/history/progressTrend.ts:10-33`.
- **Stored data:** `core/models.ts`, `core/store.ts`, `core/migrate.ts`, `settings/backup.ts:18` (it already saves `weightLog`), `settings/exportCsv.ts` (loads stay as typed).
- **Plate maths and equipment:** snapping (`progression.ts:98-150`), `loadableNear`, plates (`Train.tsx:443`, weighted only), warm-ups (`:457-458`), `SuspectChip` (`:444`, `:537`, weighted only), `autoregulationSuggestion` (`:454`). These never see effective kg.
- **Energy:** `brain/energy.ts`.
- **Escobar:** every file under `src/escobar` is untouched (see Out of scope).

## 6. Part B: carry targets show the weight (the owner's first line)

`lib_farmer_s_carry` has equipment "Dumbbells / Trap Bar" and is in conditioning mode (`exercises.ts:8,17`). A carry logged with distance or time already reads "32 kg · 45 m" (`progression.ts:189-205`). A carry logged as kg × reps drops the weight. Body weight is **not** added to carries, because the load is the implement. Changes, all in `src/brain/progression.ts`:
- After `:188`, add `const carryLoad = carryOrSled && last.topKg > 0;`.
- `:209` re-entry: the target condition `mode === 'weighted'` becomes `mode === 'weighted' || carryLoad`. `kg` is already `last.topKg || null`.
- `:217-219` deload: inside the bodyweight/assisted/conditioning block, before the existing return, add:
  `if (carryLoad) { const down = half(last.topKg * d.loadFactor); return { mode: 'deload', target: `${down} kg · ${reps} reps · easy`, kg: down, reps: [reps, reps], reason, confidence: conf, sets: setPlan(deloadSets, down, reps, null, 'Deload') }; }`
- `:228-231` reps: after `const nextReps = ...`, add:
  `if (carryLoad) { const kg = ctx?.equipment ? last.topKg : half(last.topKg); return { mode: 'reps', target: `${kg} kg · ${nextReps} reps`, kg, reps: [nextReps, nextReps], reason: <same reason expression as :231>, confidence: conf, sets: setPlan(setCount, kg, nextReps, null, last.hasMax ? 'Match it' : 'Add a rep') }; }`
- `suggestNext` (`:139-150`) already snaps a conditioning suggestion with `kg` to the equipment and rewrites "`${kg} kg`" in the target, so lb users see "70 lb · 3 reps".
- Bodyweight and assisted moves never reach these new branches: `carryOrSled` requires conditioning mode or a `CARRY_OR_SLED_IDS` id.
- Scope of `carryLoad`: it follows `carryOrSled` (`:188`). That covers the three library carry and sled ids, and also **any custom conditioning exercise** (`!!meta?.custom && mode === 'conditioning'`), for example a user-made "Trap Bar Carry" or "KB Swing" logged as kg × reps. Those get "24 kg · 16 reps" too. This is intended, because the owner named the trap bar and the library has no separate trap-bar carry (only `lib_farmer_s_carry`, "Dumbbells / Trap Bar"). Rep-based *library* conditioning moves with a load (`lib_wall_ball`, `lib_medicine_ball_slam`) are not `carryOrSled` and stay as today.

## 7. Tests (vitest; existing tests must pass without edits)

Fixtures: `session` and `sets` come from `tests/helpers.ts`. `TODAY = '2026-09-23'`. `bw80 = bodyWeightResolver({ weightLog: [{ day: '2026-09-01', kg: 80 }], profile: { name: 'T' } })!`. `PU = 'lib_pull_up'`.

**New `tests/bodyweight.test.ts`**
1. **Table guard:** for every `[id, v]` in `BODYWEIGHT_SHARE`: `findExercise(id)?.id === id`, the mode is `bodyweight` or `assisted`, and `0 < v <= 1`.
2. **Coverage:** in `searchExercises('', [], 10000)`, the non-custom bodyweight/assisted ids *not* in the table equal exactly (sorted) the 11 core ids of R2.
3. **`bodyweightShare`:**
   - `lib_push_up` → 0.64; `lib_assisted_pull_up` → 1.
   - `lib_crunch`, `lib_barbell_bench_press`, `lib_weighted_dip`, `lib_farmer_s_carry` and `undefined` → `null`.
   - `makeCustomExercise({ name: 'Ring Push-Up', equipment: 'Bodyweight', primary: ['chest'] })` → `null`.
4. **`effectiveLoadKg`:**
   - `(undefined,'bodyweight',1,80)` → 80
   - `(10,'bodyweight',1,80)` → 90 (weighted pull-up)
   - `(0,'bodyweight',0.64,80)` → 51.2
   - `(20,'assisted',1,80)` → 60
   - `(90,'assisted',1,80)` → 0 (floor)
   - `(-5,'bodyweight',1,80)` → 80
   - `(10,'bodyweight',null,80)` → null
   - `(10,'bodyweight',1,null)` → null
   - `(10,'weighted',1,80)` → null
5. **`bodyWeightOn`**, with log `[{day:'2026-09-21',kg:70},{day:'2026-09-01',kg:80}]`, which is deliberately unsorted:
   - `'2026-09-05'` → 80; `'2026-09-15'` → 70
   - `'2026-09-11'` (a 10/10-day tie) → 80, the earlier entry
   - `'2026-08-01'` → 80; `'2026-12-01'` → 70
   - Bad entries `{day:'x',kg:90}`, `{day:'2026-09-11',kg:0}`, `{day:'2026-09-11',kg:NaN}`, `{day:'2026-09-11',kg:800}`, `{day:'2026-09-11',kg:12}` and `{day:'2026-09-11',kg:'80'}` are ignored: `'2026-09-11'` still → 80.
   - `([], 82)` → 82; `([], undefined)` → null; `([], 0)` → null; `([], 12)` → null; `([], 800)` → null; a log plus fallback 99 → the log wins.
   - Future-dated entries (R3): with `[{day:'2026-09-01',kg:80},{day:'2027-01-01',kg:95}]`, `'2026-09-22'` → 80. With only `[{day:'2027-01-01',kg:95}]` → 95. For a weigh-in after the session, `[{day:'2026-09-21',kg:80},{day:'2026-09-23',kg:82}]` gives `'2026-09-22'` → 80 (a 1/1-day tie, so the earlier entry wins).
6. **`bodyWeightResolver`:**
   - `{weightLog:[],profile:{name:'T'}}` → `undefined`.
   - `{weightLog:[],profile:{name:'T',bodyWeightKg:82}}` → `r('2026-01-01') === 82`.
   - `{weightLog:[{day:'2026-09-01',kg:800}],profile:{name:'T',bodyWeightKg:800}}` → `undefined` (typo guard, R3).
7. **No body weight, same as today:**
   - For fixture `F = session(TODAY, [{id:PU,sets:sets(10,5)}, {id:'lib_assisted_pull_up',sets:sets(40,10)}, {id:'lib_barbell_bench_press',sets:sets(60,5)}, {id:'lib_push_up',sets:sets(0,10)}]).exercises`, `workingTotals(F)` deep-equals `workingTotals(F, [], null)` and deep-equals `{ sets: 12, volumeKg: 1050 }` (150 + 0 + 900 + 0).
   - `sessionTotals([s], [], undefined)` equals `workingTotals(s.exercises)`.
8. **With body weight 80:**
   - Build every case with `session(TODAY, [{ id, sets }]).exercises`. `workingTotals(<PU sets(0,8)>, [], 80)` → `{sets:3, volumeKg:1920}`.
   - Weighted pull-up `sets(10,5)` → 1350.
   - Assisted `sets(40,10)` → 1200; assisted `[{kg:90,reps:5}]` → 0.
   - Push-up `sets(0,10)` → 1536.
   - `lib_crunch` `sets(0,15)` → `{sets:3, volumeKg:0}`; bench `sets(60,5)` → 900 (unchanged).
   - Pull-up `[{kind:'warmup',reps:10},{reps:8}]` → 640.
   - `weekSummary([session('2026-09-22',[{id:PU,sets:sets(0,8)}])], TODAY, [], 3, bw80).volumeKg` → 1920, and 0 without `bw80`.
9. **Weigh-in changes over time:** log `[{day:'2026-09-01',kg:80},{day:'2026-09-21',kg:70}]`, sessions `a = session('2026-09-02', [{id:PU, sets:sets(0,8)}])` and `b = session('2026-09-22', …same)`.
   - `sessionTotals([a,b], [], r).volumeKg` → 3600.
   - `weeklyVolumeHistory([a,b], TODAY, 4, [], r)`: `[0]` is `{week:'2026-09-21', volumeKg:1680}`, and `[3]` is `{week:'2026-08-31', volumeKg:1920}`.
   - After adding `{day:'2026-09-02',kg:90}` to the log (new resolver): the total is 3840. Only session `a` changed.
10. **Labels:**
    - `modeLoadText`:
      - `({},'bodyweight','kg')` → `'BW'`
      - `({kg:10},'bodyweight','kg')` → `'BW+10 kg'`
      - `({kg:9.072, entered:{value:20,unit:'lb'}},'bodyweight','lb')` → `'BW+20 lb'`
      - `({kg:20},'assisted','kg')` → `'20 kg assist'`
      - `({},'assisted','kg')` → `'BW'`
      - `({kg:60},'weighted','kg')` → `'60 kg'`
      - `({},'weighted','kg')` → `'—'`
    - `loadColumnLabel`: `('bodyweight','kg')` → `'+kg'`; `('bodyweight','lb')` → `'+lb'`; `'assisted'` and `'weighted'` → `'kg'`.
    - `loadAriaLabel`: `'Added load in kg'`, `'Assistance in kg'`, `'Load in kg'`.
11. **`bodyweightHint`:**
    - `(findExercise('lib_push_up'), 80, 'kg')` → `'Your body weight counts: ≈ 51 kg, plus anything you add.'`
    - `(findExercise('lib_assisted_pull_up'), 80, 'kg')` → `"Your body weight counts: ≈ 80 kg, minus the machine's help."`
    - `(push-up, null, 'kg')` → `NO_BODY_WEIGHT_HINT`, which equals `'Add your body weight in Settings to count bodyweight work'`.
    - `(lib_crunch, 80)` → null; `(bench, null)` → null.
    - lb: `(push-up, 79.832, 'lb')` → `'… ≈ 113 lb, …'`; `(PU, 79.832, 'lb')` → `'… ≈ 176 lb, …'`.
12. **Stats `lastTopStats`** (`toEqual` on `{ load, reps }`): use `h = exerciseHistory([session('2026-09-22',[{id, sets}])], id)[0]`.
    - Pull-up `sets(0,8)`: with `bw80` → `{load:'≈ 80 kg', reps:8}`; with lb and a log `[{day:'2026-09-01',kg:79.832}]` → `load '≈ 176 lb'`; with no resolver → `{load:'BW', reps:8}`.
    - Pull-up `sets(10,5)`: with `bw80` → `load '≈ 90 kg'`; with none → `load 'BW+10 kg'`. Pull-up `[{kg:10,reps:5},{kg:5,reps:8}]` with `bw80` → `{load:'≈ 90 kg', reps:5}`.
    - Assisted `[{kg:40,reps:10},{kg:30,reps:8}]`: with `bw80` → `{load:'≈ 50 kg', reps:8}` (reps from the same set as the load); with none → `{load:'40 kg assist', reps:10}` (today's pair).
    - Assisted `[{kg:90,reps:6},{kg:85,reps:7}]` with `bw80` (effective 0) → `{load:'90 kg assist', reps:6}`.
    - Bench `sets(60,5)` with `bw80` → `{load:'60 kg', reps:5}`; crunch `sets(0,15)` with `bw80` → `{load:'BW', reps:15}`.
13. **Progression and records ignore body weight (pins):**
    - `suggestNext([session('2026-09-10',[{id:PU,sets:sets(0,8)}])], PU, 'lean', '2026-09-14')` has `target:'9 reps'`, `kg:null` and `mode:'reps'`.
    - The same holds for `lib_assisted_pull_up` with `sets(40,8)`.
    - `allRecords` over two pull-up sessions (`sets(0,8)` on `2026-09-10`, then `sets(0,9)` on `2026-09-14`) gives only `kind:'best_reps'`.
    - Source guard: `readFileSync` each of `src/brain/{progression,prs,trend,history,deload,e1rm}.ts` and `src/slices/history/progressTrend.ts`; none may match `/from ['"](?:\.\/|@\/brain\/)bodyweight['"]/`. As a control, `src/brain/weekly.ts` must match it. (The earlier `/bodyweight'/` failed on unchanged code: it matches the `'bodyweight'` mode literals at `progression.ts:167,217,228`, `prs.ts:79`, `trend.ts:44` and `progressTrend.ts:11,22,30`.)

**`tests/share-qa4.test.ts`: add `describe('F13: body weight on share cards')`**, using `bodyWeight: bw80`.
- QA4-9 fixture:
  - `volumeKg` → 3914 (push-ups 53 reps × 51.2 = 2713.6, plus pull-ups 15 × 80 = 1200, rounded).
  - Line values: `'2,714 kg'` for push-ups and `'1,200 kg'` for pull-ups; push-ups sort first.
  - Poster SVG matches `/KG LIFTED/i` and not `/SETS DONE/i`; the receipt contains `TOTAL LIFTED`.
- QA4-1 fixture:
  - Assisted line: `value` `'1,200 kg'`, `volumeKg` 1200, detail `'3×10 @40 assist'`.
  - Week card `volumeKg` → 2100.
- Weighted pull-up `sets(10,5)`: detail `'3×5 @+10'`, value `'1,350 kg'`. With no `bodyWeight`: detail `'3×5 @+10'`, value `'150 kg'`.
- `bodyWeight: () => null` gives the same result as no `bodyWeight` (`toEqual`) for the QA4-9 and QA4-1 fixtures.
- Month card over sessions `a` and `b` from test 9 → `volumeKg` 3600.

**`tests/volume-chart.test.ts`:** sessions `a` and `b` with the test-9 resolver. `volumeChartWeeks([a,b], TODAY, [], 'kg', 12, r).at(-1)` → `{week:'2026-09-21', value:1680}`. The existing test passes unchanged.

**`tests/progression.test.ts`, Part B:**
- Carry `[{kg:32,reps:2,effort:'ideal'}]` on `2026-09-10`, today `2026-09-14`: `target '32 kg · 3 reps'`, `kg 32`, `mode 'reps'`.
- The same session on `2026-08-01` (re-entry, 44 days > `REENTRY_DAYS` 28): the target matches `/^32 kg · \d+–\d+ reps$/`, `kg 32`.
- Deload `{startDay:'2026-09-14',endDay:'2026-09-20',reason:'test',setFactor:1,loadFactor:0.9}` with no equipment: `target '29 kg · 2 reps · easy'`, `kg 29`.
- `[{kg:31.751, entered:{value:70,unit:'lb'}, reps:2, effort:'ideal'}]` with `equipment: defaultProfile('Dumbbells','lb')` (`brain/units.ts:30`): `target '70 lb · 3 reps'`. This mirrors `progression.test.ts:139`. Verified in review: it passes on the scratch copy with Part B applied, and the existing 34 progression tests pass unchanged.
- Unchanged pins: `lib_sled_push` `[{reps:10,effort:'ideal'}]` → `'11 reps'`, `kg null`; `lib_push_up` `sets(0,10)` → `'11 reps'`, `kg null`.

Run `npm run check`, which covers typecheck, `vitest run`, `MARC_PERF=1 vitest run` and the build.

## 8. Risks and mitigations

1. **Lower-body moves don't compare like-for-like.** A barbell squat logs only the bar, while a bodyweight squat counts 0.88 × body weight. Someone switching from bodyweight squats to a 40 kg back squat sees volume drop. The owner asked for "whatever workouts use body weight only", so all 14 are included. Mitigation: one table; setting an entry to absent returns that move to its pre-F13 numbers.
2. **Estimated shares.** Pike push-up, bench dip, lunge and split squat are low-confidence. Mitigation: they live in one table, tests pin the values so any change is deliberate, and sources are listed in R2.
3. **Past weeks change retroactively.** Once a body weight exists, the history chart and past share cards grow. This is expected, and each session uses its own nearest weigh-in. Mitigation: mention it in the release note.
4. **Share card privacy.** A card from a pull-up-only workout lets anyone work out body weight (total ÷ reps). The user sees the card before sharing. Mitigation: a "count body weight" toggle as a follow-up only if the owner wants one.
5. **Escobar mismatch.** `week_summary` (`show.ts:115-119`), `get_volume` (`read.ts:270-281`) and `compare_periods` (`show.ts:178-185`) still count added load only, so the coach can quote a lower volume than Stats. Mitigation: F13b below.
6. **Dips.** `lib_weighted_dip` is in weighted mode, with equipment "Dip Station" and alias "dip". A plain dip logged at 0 kg still counts 0. The same applies to the mixed-equipment moves `lib_back_extension`, `lib_step_up`, `lib_single_leg_romanian_deadlift`, `lib_glute_bridge` and `lib_russian_twist`.
7. **A far-away weigh-in.** A single weigh-in from today is applied to sessions from years ago. This is accepted as the best information available; there is no window.
8. **Performance.** The resolver is memoised per day and the log holds at most 400 entries. `bodyWeightAt` recomputes only when `weightLog` or `profile` changes. The `MARC_PERF=1` suite must pass.
9. **QA4-1 intent is preserved.** Assistance never counts as weight lifted; only `bw × share − help` does, and it floors at 0.
10. **Part B.** A kg × reps carry, or a custom conditioning move, now carries its kg into the target, the input placeholder (`Train.tsx:511`) and the equipment snap. Existing carry tests log distance or time and are unaffected (checked, see the header).
11. **Custom bodyweight moves don't count.** The owner asked for "whatever workouts that use body weight only", but a custom move (for example "Ring Dip") has no known share, so it stays at today's numbers with no hint line. Only its column header changes to "+kg". Mitigation: a follow-up could add a share picker to the custom-exercise form (Out of scope).
12. **Weigh-in typos.** A first weigh-in is saved without a typo check (`isWeightTypo` needs a previous weight). Mitigation: the 30–300 kg range in R3. Out-of-range values count as missing and change nothing.

## 9. Out of scope

- **F13b, Escobar:** pass `bodyWeightResolver(state)` only when `state.escobar.sharing.body` is on. Add new keys (`withBodyweightKg`, `effectiveKg`, `effective`) rather than changing `volumeKg`, and add them to `BODY_KEYS` and `BODY_FACT` (`loop.ts:120,123`). Note that the Generic card shows at most 6 rows (`ui/components/index.tsx:35`).
- **Records:** records and e1RM on effective load, and any change to progression for bodyweight or assisted moves.
- **Other exercises:** custom exercises; core moves; `lib_weighted_dip` and the mixed-equipment weighted moves; body weight for duration and conditioning moves (plank, burpee, carry volume).
- **Carry follow-ups:**
  - The first-time carry target still reads "Start light · 8–12 reps" (`progression.ts:167`) and needs a separate fix.
  - Body-weight-scaled carry starting loads. The only figure found is a *maximum*: the heaviest one-hand farmer's walk averaged 64% of body weight for men and 53% for women (Sports 2018, https://pmc.ncbi.nlm.nih.gov/articles/PMC6315369/). It is not a starting load.
- **CSV:** a `load_type` column in `exportCsv.ts`.
- **Existing problems found, not caused by F13:**
  - `coach/post.ts:2-4` mentions `Session.debrief`, but no such field exists.
  - The records memo at `History.tsx:220` does not list `s.customExercises` in its deps.

## 10. Supervisor decisions (2026-09-25)

- **F13b is in scope for this same PR.** It goes after Part A and Part B, as its own commits. When `state.escobar.sharing.body` is on, the coach's `week_summary`, `get_volume` and `compare_periods` use the same helper, so Escobar and Stats never disagree. When it is off, the coach sees today's numbers, and no body weight leaks through volume. Follow §9's F13b notes: new keys, and add them to `BODY_KEYS`/`BODY_FACT`.
- **Still out of scope, as listed:**
  - custom-move shares (they need a picker);
  - `lib_weighted_dip` and the mixed-equipment moves;
  - records and e1RM;
  - the first-time carry target.
- **The base has moved to main f86a8b5**, which now includes polish batch 1 plus its gate fix. Re-find every line reference before editing. A parallel PR (polish batch 2a) also edits `src/slices/workout/Train.tsx`. If it merges first, merge origin/main and keep both changes.
