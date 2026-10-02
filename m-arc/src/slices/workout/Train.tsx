import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { AskAbout } from '@/escobar/ui/AskAbout';
import { HeartBpm, PulseLine } from '@/ui/PulseLine';
import { useReorder } from './reorder';
import { openEscobar } from '@/escobar/ui/open';
import { computed, signal } from '@preact/signals';
import { state } from '@/core/store';
import { nowMs, acquireTicker, today, unit, todayReadiness, todayCheckIn, recovery as recoverySelector, activeDeload, bodyWeightAt } from '@/app/selectors';
import { checkInDraft, saveCheckIn } from '@/slices/readiness/checkIn';
import { Button, Card, Chip, Empty, Field, HoldButton, Row, Section, Sheet, WeightInput, type WeightChange } from '@/ui/primitives';
import { IconCheck, IconChevronDown, IconDumbbell, IconEscobar, IconEdit, IconMinus, IconMore, IconPause, IconPlay, IconPlus, IconShare, IconTrash, IconTrophy } from '@/ui/icons';
import { ShareSheet } from '@/slices/share/lazy';
import { HowToSheet } from '@/slices/howto/lazy'; import { hasHowTo, HOWTO_HINTS, HOWTO_LABEL } from '@/howto/ids';
import { hasWorkingSets } from '@/brain/exposure';
import { dayKey, formatClock, formatTimeOfDay } from '@/core/dates';
import { parseDurationSec, parseMinutes, parseReps } from '@/core/parse';
import { enteredLoad, formatLoad, formatSetLoad, kgToDisplay } from '@/core/units';
import { findExercise } from '@/core/exercises';
import { bodyweightHint, loadColumnLabel, loadAriaLabel, modeLoadText } from '@/brain/bodyweight';
import { MUSCLES, muscleLabel, type MuscleId } from '@/data/muscles';
import type { AppState, Exercise, Split } from '@/core/models';
import { suggestNext, previousSet, type Suggestion } from '@/brain/progression';
import { liveRecordStatus } from '@/brain/prs';
import { sessionEmphasis } from '@/brain/exposure';
import { exerciseHistory } from '@/brain/history';
import { autoregulationSuggestion } from '@/brain/coach/live';
// LT-3: the live retarget owns the placeholders for sets 2..n; set 1's target is kept at its commit.
import { liveRetarget } from '@/brain/retarget';
import { loadableValues } from '@/brain/units';
import { KG_PER_LB } from '@/core/units';
import { setEntryTarget } from './session';
import { pickCue, pickReasonCue, reasonKeyFor } from '@/brain/coach/cues';
import { addExerciseToSession, todaySplit, addSet, active, changedFromPlan, insertEntry, insertSet, logWarmups, restRemainingSec, restDone, restTimerIsFloor, setEntryNote, setExerciseNote, moveEntry, adjustRest, stopRest, commitSet, discardSession, isCommitted, latestCommittedSetId, plannedExercises, setRestEffort, elapsedSec, finishCounts, finishSession, finishTiming, FINISH_MARGIN_SEC, logPastSession, markDone, pauseSession, removeEntry, removeSet, resolveSessionTiming, resumeSession, setSet, skipEntry, startSession, startsInFuture, substituteEntry, type FinishSummary } from './session';
import { substitutesFor } from '@/brain/substitute';
import { preSessionInsights, warmupOffer } from '@/brain/coach/pre';
import { postSessionInsights } from '@/brain/coach/post';
import { INSIGHT_COLOR } from '@/slices/coach/Coach';
import { CATEGORY_LABEL } from '@/brain/coach/rules';
import { addExerciseToSplit, addTemplates, createSplit, deleteSplit, insertExerciseInSplit, moveExercise, removeExerciseFromSplit, renameSplit, setFocus, setSplitSets, MAX_SPLITS } from './splits';
import { ExercisePicker } from './ExercisePicker';
import { showToast } from '@/app/toast';
import { MuscleMap } from '@/ui/MuscleMap';
import { GOALS } from '@/data/goals';
import { watchSupported, watchStatus, latestMeasurement } from '@/native/watch';
import { restAlertsDenied } from '@/native/notifications';
import { WatchSheet } from '@/slices/settings/Watch';
import { recentLiveBpms } from './heart';
import { usePalaceFocus } from '@/escobar/palace/focus';
import { activeGymId, addGym, mergeAskAnswer, profileFor, saveProfile, setActiveGym, setEquipmentUnit, setExerciseUnit, setGymDefaultUnit, renameGym } from './units';
import { formatLoadable, formatPerSide, inferGym, loadableNear, loadMenu, loggedLoads, plateBreakdown, type LoadMenu } from '@/brain/units';
import { setUnitSuspect, suspectAlternative } from '@/brain/fidelity';
import { equipmentGroup } from '@/brain/coach/cues';
import type { EquipmentProfile, LoadUnit, LoggedSet } from '@/core/models';
import { restTarget, hrMax, restingHr } from '@/brain/heart';
import { recoveryPctFor } from '@/brain/recovery';
import { firstWorkingSet, hasEntry, isWorkingSet, workingIndex } from '@/brain/exposure';
import { haptic } from '@/native/haptics';
import { durFor, EASE, reduced } from '@/ui/motion';
import { celebrateOnce } from './celebrate';
import { isNative } from '@/native/capacitor';

const EFFORTS: Array<{ v: 'easy' | 'ideal' | 'max'; l: string; title: string }> = [
  { v: 'easy', l: 'E', title: 'Easy: 3 or more reps left' },
  { v: 'ideal', l: 'I', title: 'Ideal: 1 to 3 reps left' },
  { v: 'max', l: 'M', title: 'Max: nothing left' },
];

/** Shown once after a session is saved, then dismissed. */
const lastFinish = signal<FinishSummary | null>(null);
/** Set instead of lastFinish when the just-saved session looks logged after training. */
const pendingTimeQuestion = signal<FinishSummary | null>(null);
/** I5: whether Train is currently showing the finish sheet/screen, so the coach dock (which would
 * otherwise reappear once `active` clears) stays hidden until Done is tapped. */
export const finishShowing = computed(() => !!lastFinish.value || !!pendingTimeQuestion.value);
/** Set when the user taps "Log a past session" from the split list. */
const loggingPast = signal<Split | null>(null);
/** Set when the user taps "Start" — shows the check-in (if not done today) then the pre-session brief before the timer begins. */
const startingSplit = signal<Split | null>(null);
/** UI-17: start from anywhere through the same check-in and pre-session sheets as the Train tab. */
export function requestStart(split: Split): void { startingSplit.value = split; }
/** "Skip" on the check-in sheet, so it doesn't reappear for the rest of this app session. */
const checkInDismissed = signal(false);
/** LT-4 (§2): "exercise|gym" pairs the ask-weight chip was dismissed for, or answered, this run —
 * so it never asks twice in one session. An answered pair also elevates the menu to `known`
 * (loadMenu's precedence, `src/brain/units.ts`), which alone keeps it from asking again. */
const askDismissed = signal<Set<string>>(new Set());
const askKey = (gymId: string, exerciseId: string): string => `${gymId}|${exerciseId}`;

/** LT-4 (§2): the chip fires only when the menu is unknown and the snapped jump broke the goal's
 * cap — the `earn` mode, or the `hold` lever whose text names the jump (never the "nothing heavier
 * here" lever, which is not a broken cap: `src/brain/retarget.ts`'s `chooseRung`) — and only for a
 * profile §2's merge rule actually covers (a ladder or a stack). A barbell/Smith-machine profile
 * (`plates`/`barKg`, no `ladder`, no `step`) is never asked about (review r1: an invariant, not an
 * assumption — the default plate set is fine-grained, but nothing else stopped it from firing). */
export function shouldAskWeight(next: Pick<Suggestion, 'mode' | 'menuConfidence' | 'reason'>, profile: Pick<EquipmentProfile, 'ladder' | 'step'>): boolean {
  if (next.menuConfidence !== 'assumed') return false;
  if (!profile.ladder?.length && !(profile.step != null && profile.step > 0)) return false;
  return next.mode === 'earn' || (next.mode === 'hold' && next.reason.includes('is too big a jump'));
}

/** LT-4 (§2): up to two menu rungs above `topKg` (canonical kg), in the menu's own unit, for the ask chip. */
export function askCandidates(menu: Pick<LoadMenu, 'rungsKg' | 'unit'>, topKg: number): number[] {
  return menu.rungsKg.filter(v => v > topKg + 0.011).slice(0, 2).map(v => kgToDisplay(v, menu.unit));
}
/** A9: the open card's next set to do, "62.5 kg × 8" (the exact A1 label), for the rest banner. */
export const nextUpHint = signal<string | null>(null);

/** A1/A8/A9: the kg placeholder a set's input shows — today's target, else last time's, else 'bw'. */
export function targetKgPh(target: { kg: number | null } | undefined, prev: { kg?: number | null } | null | undefined, eu: LoadUnit, mode: string): string {
  if (target?.kg != null) return String(kgToDisplay(target.kg, eu));
  if (prev?.kg != null) return String(kgToDisplay(prev.kg, eu));
  return mode === 'bodyweight' ? 'bw' : '';
}
/** A1/A8/A9: the reps placeholder a set's input shows — today's target, else last time's. */
export function targetRepsPh(target: { reps: number | null } | undefined, prev: { reps?: number | null } | null | undefined): string {
  return String(target?.reps ?? prev?.reps ?? '');
}
/** A1/A9: the exact text for a set that can be tapped to fill-and-log itself ("62.5 kg × 8", or
 * "8 reps" for bodyweight/no load). Null when there is no reps target to show at all. */
export function nextUpCore(kgPh: string, unitLabel: string, repsPh: string): string | null {
  if (!repsPh) return null;
  return !kgPh || kgPh === 'bw' ? `${repsPh} reps` : `${kgPh} ${unitLabel} × ${repsPh}`;
}
/** A1: whether a set is a standing candidate for "Log as planned" — has something to log, isn't
 * logged yet, and isn't a warm-up (warm-ups are optional and never auto-filled). The first such
 * set on the card, in order, is the one that gets the fill-row. */
/**
 * BUG-15 (PROGRESSION-F6): the planned rows a lighter week or a red day cuts today. A working row
 * past the suggestion's cut set list is set aside while empty; one the user fills counts as usual.
 */
export function setAsideRows(next: Pick<Suggestion, 'cutSets' | 'sets'>, sets: LoggedSet[]): boolean[] {
  return sets.map((set, j) => {
    const w = workingIndex(sets, j);
    return !!next.cutSets && w != null && w >= next.sets.length && !hasEntry(set);
  });
}

/**
 * AUD-10 (UI-12 follow-through): today's target for one exercise, built once for the split
 * preview, the "Before you start" brief and the live card, so all three agree. Its inputs:
 * today's readiness, the muscle's recovery, the lighter week, the session gym's equipment and load
 * menu, the set count and load factor, and the exercise it stands in for today (the person's own
 * substitute, or Escobar's one-day swap).
 */
export function todayTarget(s: AppState, input: { exerciseId: string; sets: number; loadFactor?: number; plannedId?: string; split?: Split }): Suggestion {
  const { exerciseId } = input;
  const gymId = s.active?.gymId ?? activeGymId();
  const ex = findExercise(exerciseId, s.customExercises);
  const replaced = input.plannedId ?? swappedFromToday(s, input.split, exerciseId);
  return suggestNext(s.sessions, exerciseId, s.goal, today.value, input.sets, s.customExercises, {
    readiness: todayReadiness.value, recoveryPct: recoveryPctFor(exerciseId, s.customExercises, recoverySelector.value),
    deload: activeDeload.value, lastDeload: s.deload, equipment: profileFor(exerciseId, gymId),
    menu: loadMenu(exerciseId, gymId, s.units, ex, loggedLoads(s.sessions, exerciseId, s.customExercises)),
    ...(input.loadFactor != null ? { loadFactor: input.loadFactor } : {}),
    ...(replaced && replaced !== exerciseId ? { replacedExerciseId: replaced } : {}),
  });
}

/** The split preview's rows: today's plan (with Escobar's applied change) and each row's target. */
export function previewTargets(s: AppState, split: Split): Array<{ se: ReturnType<typeof plannedExercises>[number]; next: Suggestion }> {
  return plannedExercises(split, s.escobar.todayOverride, today.value).map(se => ({ se, next: todayTarget(s, { ...se, split }) }));
}

/** The live card's target for one entry of the running session. */
export function entryTarget(s: AppState, entry: NonNullable<AppState['active']>['entries'][number]): Suggestion {
  return todayTarget(s, { exerciseId: entry.exerciseId, sets: entry.sets.filter(x => x.kind !== 'warmup').length || 1, ...(entry.loadFactor != null ? { loadFactor: entry.loadFactor } : {}), ...(entry.plannedId ? { plannedId: entry.plannedId } : {}), split: s.splits.find(sp => sp.id === s.active?.splitId) });
}

/** The split exercise today's Escobar swap replaced with `exerciseId`, as plannedExercises applies it. */
function swappedFromToday(s: AppState, split: Split | undefined, exerciseId: string): string | undefined {
  const o = s.escobar.todayOverride;
  if (!split || !o || o.day !== today.value || o.splitId !== split.id || split.exercises.some(e => e.exerciseId === exerciseId)) return undefined;
  for (const c of o.changes) if (c.kind === 'swap' && c.to === exerciseId && c.from !== c.to) return c.from;
  return undefined;
}

/**
 * AUD-10 (UI-06): the live card's kg/lb taps change the gym the session is running in, which can
 * differ from the active gym once another gym is made active mid-session.
 */
export function liveUnitActions(exerciseId: string, ex: Exercise | undefined, eu: LoadUnit, gymId = state.value.active?.gymId ?? activeGymId()) {
  const other: LoadUnit = eu === 'kg' ? 'lb' : 'kg';
  return {
    flip: () => setExerciseUnit(exerciseId, other, 'user', gymId),
    flipGroup: () => { if (ex) { const g = equipmentGroup(ex.equipment); setEquipmentUnit(g, other, gymId); showToast(`${other} for all ${g} here`); } },
    fixUnit: (unit: LoadUnit) => setExerciseUnit(exerciseId, unit, 'suspect_fix', gymId),
  };
}

export function isNextUpCandidate(core: string | null, committed: boolean, kind: LoggedSet['kind']): boolean {
  return core != null && !committed && kind !== 'warmup';
}
/** A8: the field after `current` in `fields` (DOM order), or null past the last one — Enter then
 * blurs instead, which commits the reps field the same as tapping away. */
export function nextSetField<T>(fields: readonly T[], current: T): T | null {
  const i = fields.indexOf(current);
  return i >= 0 && i + 1 < fields.length ? fields[i + 1]! : null;
}

export function Train() {
  const s = state.value;
  const live = s.active;
  if (pendingTimeQuestion.value) return <TimeQuestionSheet summary={pendingTimeQuestion.value} onResolved={r => { pendingTimeQuestion.value = null; lastFinish.value = r; }} />;
  if (lastFinish.value) return <FinishScreen summary={lastFinish.value} onClose={() => { lastFinish.value = null; }} />;
  if (loggingPast.value) return <PastSessionEntry split={loggingPast.value} onClose={() => { loggingPast.value = null; }} onSaved={r => { loggingPast.value = null; lastFinish.value = r; }} />;
  // BUG-36: the view stays rendered under the start sheet, so its scrim dims the page instead of an empty screen.
  return (
    <>
      {live ? <LiveSession /> : <Splits />}
      {startingSplit.value && <StartSheet split={startingSplit.value} />}
    </>
  );
}

/* ---------- Split list and editor ---------- */

let gymInferred = false;

/** A target line in the equipment's own unit when known (§25), else in the display unit. */
function targetText(next: ReturnType<typeof suggestNext>, u: LoadUnit): string {
  if (next.unit) return next.target;
  return next.kg != null && u === 'lb' ? next.target.replace(`${next.kg} kg`, formatLoad(next.kg, u)) : next.target;
}

/** The recent best top load for an exercise, the reference for spotting a kg/lb slip. */
function recentBestKg(sessions: import('@/core/models').Session[], exerciseId: string, custom: Exercise[]): number | null {
  const hist = exerciseHistory(sessions, exerciseId, custom).slice(-3);
  const best = Math.max(0, ...hist.map(h => h.topKg));
  return best > 0 ? best : null;
}

/** Sets the user already answered "No, kg" for, this app session. */
const suspectDismissed = signal<Set<string>>(new Set());

/** "At: Home ▾" → switch, add, rename a gym or set its default unit (§25.2 point 6). */
function GymSheet({ onClose }: { onClose: () => void }) {
  const s = state.value;
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  return (
    <Sheet title="Gym" onClose={() => { if (renaming) renameGym(renaming, name); onClose(); }}>
      <div class="stack">
        <div class="list">
          {s.units.gyms.map(g => (
            <div key={g.id} class="list-row">
              <div class="grow pressable" onClick={() => { setActiveGym(g.id); onClose(); }}>
                {renaming === g.id
                  ? <input value={name} maxLength={28} onClick={e => e.stopPropagation()} onInput={e => setName((e.target as HTMLInputElement).value)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} onBlur={() => { renameGym(g.id, name); setRenaming(null); }} />
                  : <div class="row">{g.name}{g.id === s.units.activeGymId && <Chip tone="accent">Here now</Chip>}</div>}
                <div class="hint">Mostly {g.defaultUnit}</div>
              </div>
              <div class="seg" style={{ width: 96 }}>
                <button type="button" aria-pressed={g.defaultUnit === 'kg'} onClick={() => setGymDefaultUnit(g.id, 'kg')}>kg</button>
                <button type="button" aria-pressed={g.defaultUnit === 'lb'} onClick={() => setGymDefaultUnit(g.id, 'lb')}>lb</button>
              </div>
              <Button variant="quiet" class="btn-icon" aria-label={`Rename ${g.name}`} onClick={() => { setRenaming(g.id); setName(g.name); }}><IconEdit size={16} /></Button>
            </div>
          ))}
        </div>
        {!adding ? (
          <Button onClick={() => setAdding(true)} disabled={s.units.gyms.length >= 8}><IconPlus size={16} /> Add a gym</Button>
        ) : (
          <Card class="card-quiet stack-sm">
            <Field label="Name"><input value={name} maxLength={28} placeholder="Work gym" onInput={e => setName((e.target as HTMLInputElement).value)} /></Field>
            <p class="small">Mostly kg or lb here?</p>
            <div class="grid-2">
              <Button onClick={() => { addGym(name || 'Gym', 'kg'); setAdding(false); setName(''); onClose(); }}>kg</Button>
              <Button onClick={() => { addGym(name || 'Gym', 'lb'); setAdding(false); setName(''); onClose(); }}>lb</Button>
            </div>
          </Card>
        )}
      </div>
    </Sheet>
  );
}

/** Tap a barbell target → plates per side, in the plates' own unit (§25.2 point 5). */
function PlateSheet({ kg, profile, name, onClose }: { kg: number; profile: EquipmentProfile; name: string; onClose: () => void }) {
  const b = plateBreakdown(kg, profile);
  const u = unit.value;
  const barLabel = profile.unit === 'lb' ? `${kgToDisplay(b.barKg, 'lb')} lb` : `${kgToDisplay(b.barKg, 'kg')} kg`;
  return (
    <Sheet title={`${name}: plates`} onClose={onClose}>
      <div class="stack" data-palace="train.plate-sheet">
        <p class="small">Per side: <b>{formatPerSide(b)}</b> (bar {barLabel})</p>
        <div class="plate-row">{b.perSide.flatMap(p => Array.from({ length: p.count }, (_, i) => <span key={`${p.value}-${i}`} class="plate">{p.value}</span>))}</div>
        <p class="hint">Total {kgToDisplay(b.exactTotalKg, 'kg')} kg · {kgToDisplay(b.exactTotalKg, 'lb')} lb{Math.abs(b.remainderKg) >= 0.05 ? ` · ${formatLoad(Math.abs(b.remainderKg), u)} ${b.remainderKg > 0 ? 'short of' : 'over'} the target` : ''}</p>
      </div>
    </Sheet>
  );
}

function Splits() {
  const s = state.value;
  const [selected, setSelected] = useState<string | null>(s.splits[0]?.id ?? null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const split = s.splits.find(x => x.id === selected) ?? s.splits[0];
  useEffect(() => { if (!split && s.splits[0]) setSelected(s.splits[0].id); }, [s.splits.length]);
  const u = unit.value;
  const [gymOpen, setGymOpen] = useState(false);
  const gym = s.units.gyms.find(g => g.id === s.units.activeGymId);
  // Pre-select the gym usually trained at on this weekday and hour, once per app session.
  useEffect(() => {
    if (gymInferred || s.units.gyms.length < 2) return;
    gymInferred = true;
    const guess = inferGym(s.sessions, s.units.gyms, new Date());
    if (guess && guess !== s.units.activeGymId) setActiveGym(guess);
  }, []);

  usePalaceFocus('train.workouts', split ? { splitId: split.id } : undefined);
  // I10: the active split tab scrolls into view (it can be off-screen in a long strip).
  useEffect(() => {
    if (!split) return;
    document.querySelector<HTMLElement>('.tabs-strip .tab[aria-pressed="true"]')?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  }, [split?.id]);

  return (
    // BUG-36: under the modal start sheet the view is out of the accessibility tree, as the dialog makes it inert.
    <div class="view" aria-hidden={startingSplit.value ? 'true' : undefined}>
      {liveBpm.value != null && <PulseLine bpm={liveBpm.value} />}
      <div class="topbar" data-palace="train.workouts">
        <div><div class="eyebrow">Train</div><h1>Workouts</h1></div>
        <div class="row" style={{ gap: 8 }}>
          {liveBpm.value != null && <HeartBpm bpm={liveBpm.value} />}
          <Button variant="quiet" size="sm" data-palace="train.new-split" onClick={() => setCreating(true)} disabled={s.splits.length >= MAX_SPLITS}><IconPlus size={16} /> Split</Button>
        </div>
      </div>
      <div class="row" style={{ marginBottom: 10 }}>
        <button type="button" class="chip chip-btn gym-chip" data-palace="train.gym-chip" aria-label={`Gym: ${gym?.name ?? ''}. Change gym`} onClick={() => setGymOpen(true)}>At: {gym?.name} <IconChevronDown size={16} /></button>
      </div>
      {gymOpen && <GymSheet onClose={() => setGymOpen(false)} />}

      {!s.splits.length && (
        <Card>
          <Empty align="center" icon={<IconDumbbell size={24} />} title="No workouts" action={<div class="row"><Button variant="primary" onClick={() => { addTemplates(); }}>Use Push / Pull / Legs</Button><Button onClick={() => setCreating(true)}>Build my own</Button></div>} />
        </Card>
      )}

      {s.splits.length > 0 && (
        <div class="tabs-strip" role="tablist">
          {s.splits.map(sp => <button type="button" key={sp.id} role="tab" class="tab" aria-pressed={sp.id === split?.id} style={{ '--dot': sp.color }} onClick={() => setSelected(sp.id)}><i />{sp.name}</button>)}
        </div>
      )}

      {split && (
        <>
          <Card data-palace="train.split">
            <div class="row-between">
              <div>
                <h2>{split.name}</h2>
                <span class="hint">{split.exercises.length} exercises · {split.exercises.reduce((a, e) => a + e.sets, 0)} sets{split.focus.length ? ` · focus: ${split.focus.map(muscleLabel).join(', ')}` : ''}</span>
              </div>
              <Button variant="quiet" class="btn-icon" aria-label="Edit split" data-palace="train.edit-split" onClick={() => setEditing(true)}><IconEdit /></Button>
            </div>
            <div class="list" style={{ marginTop: 6 }}>
              {/* ES-02: the preview shows today's applied Escobar adjustment, as Start will. */}
              {previewTargets(s, split).map(({ se, next }) => {
                const ex = findExercise(se.exerciseId, s.customExercises);
                return (
                  <Row key={se.exerciseId} trailing={<span class="hint num">{next.cutSets ? Math.min(se.sets, next.sets.length) : se.sets} sets</span>}>
                    <div class="ellipsis">{ex?.name ?? se.exerciseId}</div>
                    <div class="hint ellipsis">{targetText(next, u)} · {next.reason}</div>
                  </Row>
                );
              })}
              {!split.exercises.length && <p class="muted small" style={{ padding: '10px 0' }}>Empty split.</p>}
            </div>
            <Button variant="primary" block style={{ marginTop: 12 }} data-palace="train.start" disabled={!split.exercises.length} onClick={() => { startingSplit.value = split; }}><IconPlay /> Start {split.name}</Button>
            <Button variant="quiet" block data-palace="train.log-past" disabled={!split.exercises.length} onClick={() => { loggingPast.value = split; }}>Log a past session</Button>
          </Card>
          <p class="hint" style={{ marginTop: 10 }} data-palace="train.targets">Goal: {GOALS.find(g => g.id === s.goal)?.name}</p>
        </>
      )}

      {editing && split && <SplitEditor split={split} onClose={() => setEditing(false)} onDeleted={() => { setEditing(false); setSelected(null); }} />}
      {creating && <CreateSplit onClose={() => setCreating(false)} onCreated={id => { setCreating(false); setSelected(id); setEditing(true); }} />}
    </div>
  );
}

function CreateSplit({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  return (
    <Sheet title="New split" onClose={onClose}>
      <div class="stack">
        <Field label="Name"><input autofocus value={name} maxLength={28} placeholder="e.g. Upper A" onInput={e => setName((e.target as HTMLInputElement).value)} /></Field>
        <Button variant="primary" disabled={!name.trim()} onClick={() => { const sp = createSplit(name); if (sp) onCreated(sp.id); }}>Create</Button>
        {!state.value.splits.length && <Button variant="quiet" onClick={() => { addTemplates(); onClose(); }}>Or add Push / Pull / Legs templates</Button>}
      </div>
    </Sheet>
  );
}

function SplitEditor({ split, onClose, onDeleted }: { split: Split; onClose: () => void; onDeleted: () => void }) {
  const s = state.value;
  const [picking, setPicking] = useState(false);
  const [name, setName] = useState(split.name);
  const [confirm, setConfirm] = useState(false);
  const fresh = s.splits.find(x => x.id === split.id) ?? split;
  return (
    <Sheet title="Edit split" onClose={() => { renameSplit(split.id, name); onClose(); }}>
      <div class="stack">
        <Field label="Name"><input value={name} maxLength={28} onInput={e => setName((e.target as HTMLInputElement).value)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} onBlur={() => renameSplit(split.id, name)} /></Field>
        <div class="list">
          {fresh.exercises.map((se, i) => {
            const ex = findExercise(se.exerciseId, s.customExercises);
            return (
              <div key={se.exerciseId} class="list-row">
                <div class="grow"><div class="ellipsis">{ex?.name ?? se.exerciseId}</div><span class="hint">{ex?.equipment}</span></div>
                <div class="row" style={{ gap: 4 }}>
                  <Button variant="quiet" class="btn-icon" aria-label="Fewer sets" onClick={() => setSplitSets(split.id, se.exerciseId, se.sets - 1)}><IconMinus size={16} /></Button>
                  <span class="num small" style={{ minWidth: 44, textAlign: 'center' }}>{se.sets} sets</span>
                  <Button variant="quiet" class="btn-icon" aria-label="More sets" onClick={() => setSplitSets(split.id, se.exerciseId, se.sets + 1)}><IconPlus size={16} /></Button>
                  <Button variant="quiet" class="btn-icon" aria-label="Move up" disabled={i === 0} onClick={() => moveExercise(split.id, i, i - 1)}><IconChevronDown size={16} style={{ transform: 'rotate(180deg)' }} /></Button>
                  <Button variant="quiet" class="btn-icon" aria-label="Remove" onClick={() => { removeExerciseFromSplit(split.id, se.exerciseId); showToast('Removed', 'Undo', () => insertExerciseInSplit(split.id, i, se)); }}><IconTrash size={16} /></Button>
                </div>
              </div>
            );
          })}
        </div>
        <Button onClick={() => setPicking(true)}><IconPlus size={16} /> Add exercise</Button>
        <Field label="Focus muscles (up to two)">
          <div class="wrap">{MUSCLES.map(m => <Chip key={m.id} pressed={fresh.focus.includes(m.id)} onClick={() => setFocus(split.id, fresh.focus.includes(m.id) ? fresh.focus.filter(x => x !== m.id) : [...fresh.focus, m.id].slice(-2))}>{m.label}</Chip>)}</div>
        </Field>
        {!confirm ? <Button variant="danger" onClick={() => setConfirm(true)}>Delete split</Button>
          : <Card class="card-quiet"><p class="small">Delete {fresh.name}? Your history stays.</p><div class="row" style={{ marginTop: 10 }}><Button variant="quiet" onClick={() => setConfirm(false)}>Keep</Button><Button variant="danger" onClick={() => { deleteSplit(split.id); onDeleted(); }}>Delete</Button></div></Card>}
      </div>
      {picking && <ExercisePicker exclude={fresh.exercises.map(e => e.exerciseId)} onClose={() => setPicking(false)} onPick={ex => { if (!addExerciseToSplit(split.id, ex)) showToast('Already in this split'); setPicking(false); }} />}
    </Sheet>
  );
}

/* ---------- Live session ---------- */

function LiveSession() {
  const s = state.value;
  const a = active()!;
  usePalaceFocus('train.start', { live: 1, splitId: a.splitId });
  const split = s.splits.find(x => x.id === a.splitId);
  const [open, setOpen] = useState<number>(a.entries.findIndex(e => !e.done && !e.skipped));
  const [picking, setPicking] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [sessionNote, setSessionNote] = useState('');
  // Hold an exercise and drag to reorder; the open card follows its exercise.
  const reorder = useReorder((from, to) => {
    const openId = a.entries[open]?.exerciseId;
    moveEntry(from, to);
    if (openId) setOpen(state.value.active?.entries.findIndex(e => e.exerciseId === openId) ?? -1);
  });
  useEffect(() => acquireTicker(), []);
  const remaining = a.entries.filter(e => !e.done && !e.skipped);
  const done = a.entries.filter(e => e.done).length;
  // A2: the fraction of planned working sets already committed, for the sticky header's hairline.
  const planned = a.entries.filter(e => !e.skipped).flatMap(e => e.sets).filter(x => x.kind !== 'warmup');
  const progress = planned.filter(x => isCommitted(x) && isWorkingSet(x)).length / (planned.length || 1);
  const liveTopRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = liveTopRef.current;
    if (!el) return undefined;
    const sync = () => document.documentElement.style.setProperty('--live-top-h', `${el.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => { ro.disconnect(); document.documentElement.style.removeProperty('--live-top-h'); };
  }, []);
  // I2: once the next card has unfolded (or after a timeout, if it never does), glide the page so
  // it sits just under the sticky header — never while a keyboard could be about to pop up.
  const scrollToEntry = (i: number) => {
    if (i < 0) return;
    requestAnimationFrame(() => {
      const body = document.querySelector<HTMLElement>(`[data-entry-index="${i}"] .ex-body`);
      const go = () => document.querySelector(`[data-entry-index="${i}"] .exercise`)?.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
      if (!body) { setTimeout(go, durFor('enter') + 60); return; }
      let done2 = false;
      const onEnd = (e: TransitionEvent) => { if (e.target === body && e.propertyName === 'grid-template-rows') { done2 = true; body.removeEventListener('transitionend', onEnd); go(); } };
      body.addEventListener('transitionend', onEnd);
      setTimeout(() => { if (!done2) { body.removeEventListener('transitionend', onEnd); go(); } }, durFor('enter') + 60);
    });
  };

  return (
    <div class="view">
      {liveBpm.value != null && <PulseLine bpm={liveBpm.value} />}
      <div class="topbar">
        <div><div class="eyebrow">{a.pausedAt ? 'Paused' : 'Live'}</div><span class="hint">{split?.name ?? 'Workout'} · {done}/{a.entries.length} done</span></div>
      </div>
      {/* A2: a compact bar (clock left, controls right) that stays put once the list scrolls under it,
          with a hairline underneath that fills as working sets get logged. */}
      <div class="topbar live-top" ref={liveTopRef} data-palace="train.start">
        <div class="live-clock-wrap">
          <span class="live-dot" style={{ background: a.pausedAt ? 'var(--text-2)' : 'var(--accent)' }} />
          <LiveClock a={a} />
        </div>
        <div class="row">
          {s.escobar.enabled && <button type="button" class="esc-live-btn" data-palace="train.escobar" aria-label="Ask Escobar mid-session" onClick={() => openEscobar({ mode: 'live' })}><IconEscobar size={20} /></button>}
          <WatchPill />
          <Button variant="quiet" class="btn-icon" aria-label={a.pausedAt ? 'Resume' : 'Pause'} onClick={() => (a.pausedAt ? resumeSession() : pauseSession())}>{a.pausedAt ? <IconPlay /> : <IconPause />}</Button>
          <Button size="sm" class="tap" onClick={() => setFinishing(true)}>Finish</Button>
        </div>
        <div class="live-progress" aria-hidden="true"><i class={progress >= 1 ? 'full' : ''} style={{ transform: `scaleX(${progress})` }} /></div>
      </div>

      <div class="stack">
        <div class={`stack reorder-list${reorder.dragging ? ' dragging' : ''}`} ref={reorder.listRef}>
          {a.entries.map((entry, i) => (
            <div key={`${entry.exerciseId}#${a.entries.slice(0, i).filter(e => e.exerciseId === entry.exerciseId).length}`} class={`reorder-item ${reorder.isLifted(i) ? 'lifted' : ''}`} data-entry-index={i} style={reorder.styleFor(i)} onPointerDown={reorder.onPointerDown(i)}>
              {/* AUD-10 (UI-09): hidden until focused, so touch users see no new buttons. */}
              {(['up', 'down'] as const).map(dir => <button key={dir} type="button" class="btn reorder-move" data-move={dir} aria-label={`Move ${dir}, ${entry.name}`} aria-disabled={dir === 'up' ? i === 0 : i === a.entries.length - 1} onClick={() => {
                const to = i + (dir === 'up' ? -1 : 1);
                if (reorder.moveBy(i, dir === 'up' ? -1 : 1, a.entries.length)) requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-entry-index="${to}"] .reorder-move[data-move="${dir}"]`)?.focus());
              }}>Move {dir}</button>)}
              <EntryCard index={i} entry={entry} open={open === i} onToggle={() => { if (reorder.clickAllowed()) setOpen(open === i ? -1 : i); }} onDone={() => { markDone(i); const next = a.entries.findIndex((e, j) => j !== i && !e.done && !e.skipped); setOpen(next); scrollToEntry(next); }} />
            </div>
          ))}
        </div>
        <Button onClick={() => setPicking(true)}><IconPlus size={16} /> Add exercise to this session</Button>
      </div>

      {picking && <ExercisePicker exclude={a.entries.map(e => e.exerciseId)} onClose={() => setPicking(false)} onPick={ex => { addExerciseToSession(ex); setPicking(false); }} />}
      {finishing && (
        <Sheet title={remaining.length ? 'Exercises remaining' : 'Finish session'} onClose={() => setFinishing(false)}>
          <div class="stack">
            {remaining.length > 0 && <p class="small muted">{remaining.length} exercise{remaining.length > 1 ? 's' : ''} not marked done.</p>}
            <div class="grid-3">
              <div class="stat"><b class="num" data-finish-duration><Elapsed a={a} /></b><span>duration</span></div>
              {(() => { const { exercises: nEx, sets: nSets } = finishCounts(a); return <><div class="stat"><b class="num" data-finish-exercises>{nEx}</b><span>exercise{nEx === 1 ? '' : 's'}</span></div><div class="stat"><b class="num" data-finish-sets>{nSets}</b><span>set{nSets === 1 ? '' : 's'}</span></div></>; })()}
            </div>
            <TrimmedEndNote a={a} />
            <EffortRepair a={a} />
            <Field label="Session note"><textarea rows={2} maxLength={1000} value={sessionNote} placeholder="How it went, what to change" data-palace="train.session-note" onInput={e => setSessionNote((e.target as HTMLTextAreaElement).value)} /></Field>
            <FinishChoice onFinish={saveTemplate => { const r = finishSession(saveTemplate, { note: sessionNote }); setSessionNote(''); setFinishing(false); if (!r) { showToast('Nothing logged, so nothing was saved'); return; } if (r.session.logging.flags.includes('compressed')) pendingTimeQuestion.value = r; else lastFinish.value = r; }} changed={changedFromPlan(a, split)} />
            <Button variant="quiet" onClick={() => setFinishing(false)}>Keep going</Button>
            <HoldButton size="sm" class="tap" label="Hold to discard" onConfirm={() => { discardSession(); setFinishing(false); }} />
          </div>
        </Sheet>
      )}
    </div>
  );
}

/** bpm + freshness dot, tap to open the watch sheet (6.5). Hidden entirely on the web, same as haptics. */
/** A heart rate to show only while the watch is streaming right now. */
const liveBpm = computed(() => (watchStatus.value.freshness === 'LIVE' ? latestMeasurement.value?.bpm ?? null : null));

function WatchPill() {
  const [open, setOpen] = useState(false);
  if (!watchSupported.value) return null;
  const status = watchStatus.value;
  const bpm = latestMeasurement.value?.bpm;
  const live = status.freshness === 'LIVE';
  return (
    <>
      <button type="button" class="watch-pill" aria-label="Watch" onClick={() => setOpen(true)}>
        {live && bpm != null ? <HeartBpm bpm={bpm} /> : <><span class="dot" />{bpm != null ? `${bpm} bpm` : 'Watch'}</>}
      </button>
      {open && <WatchSheet onClose={() => setOpen(false)} />}
    </>
  );
}

/** F9: before saving, the working sets that have no effort yet (max 12), rated inline. Skipping is fine. */
function EffortRepair({ a }: { a: NonNullable<ReturnType<typeof active>> }) {
  const [skipped, setSkipped] = useState(false);
  // AUD-10 (UI-01): a skipped entry's logged sets are saved too, so they can be rated here.
  const missing = a.entries.flatMap((e, i) => e.sets.map((set, j) => ({ i, j, e, set })).filter(x => !e.skipped || isCommitted(x.set))).filter(x => isWorkingSet(x.set) && !x.set.effort).slice(0, 12);
  if (skipped || !missing.length) return null;
  return (
    <div class="stack-sm" data-palace="train.effort-repair">
      <div class="row-between"><span class="small">How hard were these?</span><Button size="sm" variant="quiet" onClick={() => setSkipped(true)}>Skip</Button></div>
      {missing.map(({ i, j, e, set }) => (
        <div key={`${i}-${j}`} class="row-between">
          <span class="hint ellipsis">{e.name} · set {j + 1}{set.reps ? ` · ${set.reps} reps` : ''}</span>
          <div class="effort">{EFFORTS.map(ef => <button type="button" key={ef.v} class={ef.v} title={ef.title} aria-label={ef.title} onClick={() => setSet(i, j, { effort: ef.v })}>{ef.l}</button>)}</div>
        </div>
      ))}
    </div>
  );
}

function FinishChoice({ changed, onFinish }: { changed: boolean; onFinish: (saveTemplate: boolean) => void }) {
  if (!changed) return <Button variant="primary" onClick={() => onFinish(false)}><IconCheck /> Finish and save</Button>;
  return (
    <div class="stack-sm">
      <p class="small">Keep today's exercise changes for future sessions?</p>
      <div class="grid-2"><Button onClick={() => onFinish(false)}>Just today</Button><Button variant="primary" onClick={() => onFinish(true)}>Save for future</Button></div>
    </div>
  );
}

/** The only part of the live screen that reads the 1 s clock (UI-10), so the cards do not re-render every second. */
/** QA-R2d-3: the Finish sheet's duration keeps ticking while the sheet is open. */
/** BUG-19: it shows the time that is saved, so a Finish long after the last set shows the trimmed time. */
function Elapsed({ a }: { a: NonNullable<ReturnType<typeof active>> }) {
  return <>{formatClock(finishTiming(a, nowMs.value).durationSec)}</>;
}

/** BUG-19 (DATES-F1): says when a forgotten Finish ends the session, with no extra step. */
function TrimmedEndNote({ a }: { a: NonNullable<ReturnType<typeof active>> }) {
  const t = finishTiming(a, nowMs.value);
  if (!t.trimmed) return null;
  return <p class="small muted" data-finish-trimmed>Saved as ending at {formatTimeOfDay(new Date(t.endedAtMs).toISOString())}, {FINISH_MARGIN_SEC / 60} min after your last set.</p>;
}

function LiveClock({ a }: { a: NonNullable<ReturnType<typeof active>> }) {
  return <h1 class="num">{formatClock(elapsedSec(a, nowMs.value))}</h1>;
}

/** LT-4 (§2): "Which weight comes after {current} here?" — chips from the menu plus "Other", and a way
 * to say not now. Nothing is saved until a chip or "Other" answer is confirmed. */
function AskWeightChip({ current, unit, candidates, onAnswer, onDismiss }: { current: number; unit: LoadUnit; candidates: number[]; onAnswer: (value: number) => void; onDismiss: () => void }) {
  const [other, setOther] = useState(false);
  const [draft, setDraft] = useState<WeightChange | undefined>(undefined);
  // review r1: "after" the current load — at or below it is never a valid answer, so Save stays off.
  const tooLow = other && draft?.entered != null && !(draft.entered.value > current);
  return (
    <div class="stack-sm" data-testid="ask-weight-chip">
      <p class="hint">Which weight comes after {current} {unit} here?</p>
      <div class="wrap">
        {!other && candidates.map(c => <Chip key={c} onClick={() => onAnswer(c)}>{c} {unit}</Chip>)}
        {!other && <Chip onClick={() => setOther(true)}>Other</Chip>}
        {other && (
          <>
            <WeightInput kg={draft?.kg} entered={draft?.entered} entryUnit={unit} placeholder={unit} ariaLabel={`Next weight in ${unit}`} onChange={setDraft} />
            <Button variant="primary" disabled={!draft?.entered || !(draft.entered.value > current)} onClick={() => { if (draft?.entered && draft.entered.value > current) onAnswer(draft.entered.value); }}>Save</Button>
          </>
        )}
        <Chip onClick={onDismiss}>Not now</Chip>
      </div>
      {tooLow && <p class="hint" style={{ color: 'var(--warning)' }}>Must be heavier than {current} {unit}.</p>}
    </div>
  );
}

function EntryCard({ index, entry, open, onToggle, onDone }: { index: number; entry: NonNullable<ReturnType<typeof active>>['entries'][number]; open: boolean; onToggle: () => void; onDone: () => void }) {
  const s = state.value;
  const u = unit.value;
  const ex: Exercise | undefined = findExercise(entry.exerciseId, s.customExercises);
  const mode = ex?.mode ?? 'weighted';
  const bwHint = bodyweightHint(ex, bodyWeightAt.value?.(today.value) ?? null, u);
  const recoveryPct = recoveryPctFor(entry.exerciseId, s.customExercises, recoverySelector.value);
  const profile = profileFor(entry.exerciseId, s.active?.gymId ?? activeGymId());
  // QA-R6-5: a loaded carry uses the gym's equipment unit too.
  const loaded = mode === 'weighted' || mode === 'conditioning';
  const eu = loaded ? profile.unit : u;
  const gymId = s.active?.gymId;
  const effectiveGymId = gymId ?? activeGymId();
  const memoDeps = [s.sessions, s.customExercises, s.units, s.goal, gymId, entry, today.value, todayReadiness.value, activeDeload.value, s.deload, recoveryPct];
  // LT-4: the gym's load menu (LT-1), so an increase sees the loads really learned here and the
  // suggestion carries `menuConfidence` for the ask chip below.
  const equipMenu = useMemo(() => loadMenu(entry.exerciseId, effectiveGymId, s.units, ex, loggedLoads(s.sessions, entry.exerciseId, s.customExercises)), memoDeps);
  // profileFor() returns a new object each render, so the memo keys on s.units and the gym instead.
  const next = useMemo(() => entryTarget(s, entry), [...memoDeps, s.escobar.todayOverride, s.splits]);
  // LT-4 (§2): the one-time ask, only on an assumed menu whose snapped jump broke the goal's cap.
  const askThisKey = askKey(effectiveGymId, entry.exerciseId);
  const askVisible = mode === 'weighted' && shouldAskWeight(next, equipMenu.profile) && !askDismissed.value.has(askThisKey);
  const askCurrent = next.value ?? kgToDisplay(next.kg ?? 0, equipMenu.unit);
  const askAnswer = (value: number) => {
    if (!(value > askCurrent)) return; // review r1: "after" the current load, never at or below it.
    // equipMenu.profile, not `profile`: on an assumed menu `profileFor` can still pick up a known
    // profile from another gym (resolveProfile's rank 2), whose ladder belongs to that gym, not this
    // one. `equipMenu.profile` is always the LT-1 precedence's own resolved-or-default profile.
    saveProfile('exercise', entry.exerciseId, mergeAskAnswer(equipMenu.profile, askCurrent, value), effectiveGymId);
    askDismissed.value = new Set(askDismissed.value).add(askThisKey);
    showToast('Saved the next weight for this gym');
  };
  const askDismiss = () => { askDismissed.value = new Set(askDismissed.value).add(askThisKey); };
  const [menu, setMenu] = useState(false);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [stickyDraft, setStickyDraft] = useState<string | null>(null);
  const [setMenuAt, setSetMenuAt] = useState<number | null>(null);
  const [plates, setPlates] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  // I2: `closing` keeps the body mounted from open->false until its fold transition finishes, so
  // the content doesn't vanish mid-animation; `settled` lifts the clip once fully open, so focus
  // rings and the palace spotlight are not cut off at rest.
  const [closing, setClosing] = useState(false);
  const [settled, setSettled] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const wasOpenRef = useRef(open);
  useEffect(() => {
    if (wasOpenRef.current && !open) {
      setClosing(true);
      setSettled(false);
      const t = setTimeout(() => setClosing(false), durFor('enter') + 60);
      wasOpenRef.current = open;
      return () => clearTimeout(t);
    }
    wasOpenRef.current = open;
    return undefined;
  }, [open]);
  // I4: the coach prose (target reason, reason cue, learn cue) sits behind "Why this target",
  // folded the same way as the card body itself (I2's ex-body pattern).
  const [why, setWhy] = useState(false);
  const [whyClosing, setWhyClosing] = useState(false);
  const [whySettled, setWhySettled] = useState(false);
  const whyBodyRef = useRef<HTMLDivElement | null>(null);
  const wasWhyRef = useRef(why);
  useEffect(() => {
    if (wasWhyRef.current && !why) {
      setWhyClosing(true);
      setWhySettled(false);
      const t = setTimeout(() => setWhyClosing(false), durFor('enter') + 60);
      wasWhyRef.current = why;
      return () => clearTimeout(t);
    }
    wasWhyRef.current = why;
    return undefined;
  }, [why]);
  const sticky = s.exerciseNotes[entry.exerciseId];
  const barbell = !!(profile.plates?.length || profile.barKg) && mode === 'weighted';
  const best = useMemo(() => (mode === 'weighted' ? recentBestKg(s.sessions, entry.exerciseId, s.customExercises) : null), memoDeps);
  const { flip, flipGroup, fixUnit } = liveUnitActions(entry.exerciseId, ex, eu);
  // A8: Enter moves kg -> reps -> the next set's kg, in DOM order; past the last field it blurs
  // (the reps field's blur already commits, same as tapping away).
  const onSetFieldKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' || e.isComposing) return;
    e.preventDefault();
    const target = e.target as HTMLInputElement;
    const root = target.closest('.exercise');
    const fields = root ? [...root.querySelectorAll<HTMLElement>('[data-set-field]')] : [];
    const next = nextSetField(fields, target as HTMLElement);
    if (next) next.focus(); else target.blur();
  };
  const [subOpen, setSubOpen] = useState(false);
  const logged = entry.sets.filter(isWorkingSet).length;
  const isTimed = mode === 'duration';
  // QA-R6-3: autoregulation reads the first working set; logged warm-ups sit in front of it.
  const firstSet = firstWorkingSet(entry.sets);
  const firstTarget = next.sets[0];
  const aside = useMemo(() => setAsideRows(next, entry.sets), [next, entry.sets]);
  const asideCount = aside.filter(Boolean).length;
  // LT-3 (§4, D-LT3): every loaded, non-timed lift; a load the user did not lift, and every line, only where 6.13 allows a prompt.
  const planned1 = entry.target ?? (firstTarget?.kg != null && firstTarget?.reps != null ? { kg: firstTarget.kg, reps: firstTarget.reps } : null);
  const retarget = useMemo(() => (mode === 'weighted' && firstSet && isCommitted(firstSet) && planned1
    ? liveRetarget([firstSet], planned1, s.goal, ex?.role === 'main' ? 'main' : 'accessory', { profile, unit: profile.unit, rungsKg: loadableValues(profile).map(v => Math.round(v * (profile.unit === 'lb' ? KG_PER_LB : 1) * 1000) / 1000) }, { historyCount: exerciseHistory(s.sessions, entry.exerciseId, s.customExercises).length, holdLoad: !!next.holdLoad, prompts: ex?.role === 'main' })
    : null), [...memoDeps, planned1?.kg, planned1?.reps]);
  useEffect(() => { if (planned1 && !entry.target && firstSet && isCommitted(firstSet) && mode === 'weighted') setEntryTarget(entry.id, planned1); }, [entry.id, entry.target, firstSet?.at, planned1?.kg, planned1?.reps]);
  const autoreg = useMemo(() => (ex?.role === 'main' && mode === 'weighted' && firstSet && firstTarget?.kg != null && firstTarget?.reps != null
    ? autoregulationSuggestion({ exerciseId: entry.exerciseId, exerciseName: entry.name, firstSet, targetKg: planned1?.kg ?? firstTarget.kg, targetReps: planned1?.reps ?? firstTarget.reps, historyCount: exerciseHistory(s.sessions, entry.exerciseId, s.customExercises).length, equipment: profile, holdLoad: !!next.holdLoad, retarget })
    : null), [...memoDeps, retarget]);
  /** LT-3: a working set after set 1 that is not logged yet takes the live retarget's load and reps. */
  const liveTarget = <T extends { kg: number | null; reps: number | null }>(t: T | undefined, wj: number, set: LoggedSet): T | undefined => (t && retarget && wj >= 1 && !isCommitted(set) ? { ...t, kg: retarget.kg, reps: retarget.reps } : t);
  // D10 / BR-09: warm-ups ramp to today's first working set, not to the e1RM.
  const workingKg = ex?.role === 'main' && mode === 'weighted' ? next.sets[0]?.kg ?? next.kg ?? 0 : 0;
  const warmup = useMemo(() => warmupOffer(workingKg, profile), [...memoDeps, workingKg]);
  const [warmupOpen, setWarmupOpen] = useState(false);
  // BUG-18: a record from a set the plausibility check flags keeps its pill, marked unconfirmed, until
  // today's sets repeat its load; only a confirmed record buzzes.
  const perSet = useMemo(() => entry.sets.map((set, j) => {
    const status = isTimed ? 'none' : liveRecordStatus(s.sessions, entry.exerciseId, set, s.customExercises, entry.sets.filter(isCommitted));
    return { prev: ((w: number | null) => (w == null ? null : previousSet(s.sessions, entry.exerciseId, w, s.customExercises)))(workingIndex(entry.sets, j)), pr: status !== 'none', prUnconfirmed: status === 'unconfirmed' };
  }), memoDeps);
  /** F3.5: one line, seeded by day + exercise so it rotates day to day, same as Coach's own cue card. */
  const cue = ex ? pickCue(ex, 'coach', `${today.value}|${ex.id}`) : null;
  const reasonCue = pickReasonCue(reasonKeyFor(next.mode, next.confidence, mode, next.sets[0]?.note), `${today.value}|${entry.exerciseId}`);
  // QA-hotfix2: `index` can point at a different entry by the time this fires (e.g. a remove just
  // ahead of it shifted the array), so only write "Note for today" while it still names this entry.
  const commitNoteDraft = (value: string) => { if (active()?.entries[index]?.id === entry.id) setEntryNote(index, value); };
  /** Flushes any pending note drafts and clears them before closing the menu sheet, however it closes
   * (Close/back/backdrop, or one of Skip/Put back/Substitute/Remove below, which used to bypass this). */
  const closeMenu = () => {
    if (stickyDraft != null) setExerciseNote(entry.exerciseId, stickyDraft);
    if (noteDraft != null) commitNoteDraft(noteDraft);
    setStickyDraft(null);
    setNoteDraft(null);
    setMenu(false);
  };

  // F9: a PR pops in once, the moment its set commits — never again on remount (a tab switch).
  const seenPrRef = useRef<Set<string> | null>(null);
  const [popIds, setPopIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const committedPrIds = entry.sets.filter((set, j) => perSet[j]?.pr && isCommitted(set) && set.id).map(set => set.id!);
    if (!seenPrRef.current) { seenPrRef.current = new Set(committedPrIds); return; }
    const freshIds = committedPrIds.filter(id => !seenPrRef.current!.has(id));
    if (!freshIds.length) return;
    for (const id of freshIds) seenPrRef.current.add(id);
    setPopIds(prev => new Set([...prev, ...freshIds]));
    const t = setTimeout(() => setPopIds(prev => { const next = new Set(prev); for (const id of freshIds) next.delete(id); return next; }), durFor('bounce'));
    const confirmedFresh = entry.sets.some((set, j) => set.id && freshIds.includes(set.id) && !perSet[j]?.prUnconfirmed);
    if (s.active && confirmedFresh && celebrateOnce(`${s.active.startedAt}|${entry.exerciseId}`)) setTimeout(() => void haptic.success(), 120);
    return () => clearTimeout(t);
  }, [entry.sets, perSet]);

  // A9: while this card is open, tell the rest banner what the next set to do is.
  useEffect(() => {
    if (!open || isTimed || mode === 'conditioning') { if (open) nextUpHint.value = null; return undefined; }
    let warmups = 0;
    let core: string | null = null;
    for (let j = 0; j < entry.sets.length; j++) {
      const set = entry.sets[j]!;
      if (set.kind === 'warmup') { warmups++; continue; }
      if (isCommitted(set) || aside[j]) continue;
      const wj = j - warmups;
      const target = liveTarget(next.sets[Math.min(wj, next.sets.length - 1)], wj, set);
      core = nextUpCore(targetKgPh(target, perSet[j]!.prev, eu, mode), eu, targetRepsPh(target, perSet[j]!.prev));
      break;
    }
    nextUpHint.value = core;
    return () => { nextUpHint.value = null; };
  }, [open, isTimed, mode, eu, entry.sets, next.sets, perSet, aside, retarget]);

  return (
    <Card class={`exercise ${open && !entry.skipped ? 'active' : ''} ${entry.skipped ? 'card-quiet skipped' : ''}`} onClick={e => { const c = e.currentTarget, t = String(Date.now()); if ((e.target as Element).closest('.effort button')) { c.dataset.hold = t; setTimeout(() => { if (c.dataset.hold === t) delete c.dataset.hold; }, 2000); } }}>
      <div class="row-between ex-head" onClick={onToggle} role="button" aria-expanded={open} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}>
        <div class="grow">
          <div class="row"><b class="ellipsis exname">{entry.name}</b>{entry.done && <Chip tone="positive"><IconCheck size={16} /> Done</Chip>}{entry.skipped && <Chip>Skipped</Chip>}</div>
          {sticky && <div class="hint ellipsis exercise-note" data-palace="train.exercise-note"><IconEdit size={16} /> {sticky}</div>}
          <div class="hint ellipsis">{barbell && next.kg != null ? <a class="target-link" onClick={e => { e.stopPropagation(); setPlates(true); }}>{targetText(next, u)}</a> : targetText(next, u)} · {logged}/{entry.sets.length - asideCount} sets</div>
        </div>
        <Button variant="quiet" class="btn-icon" aria-label="Options" onClick={e => { e.stopPropagation(); setStickyDraft(null); setNoteDraft(null); setMenu(true); }}><IconMore /></Button>
        <IconChevronDown class={`chev ${open ? 'up' : ''}`} />
      </div>
      <div class={`ex-body ${open ? 'open' : ''} ${settled ? 'settled' : ''}`} ref={bodyRef} onTransitionEnd={e => { if (e.target === bodyRef.current && open) setSettled(true); }}>
        <div class="ex-body-inner">
        {(open || closing) && (
        <div class="stack-sm" style={{ marginTop: 12 }}>
          {autoreg && <p class="hint" style={{ color: 'var(--accent-text)' }}>{autoreg.action}</p>}
          {askVisible && (
            <AskWeightChip current={askCurrent} unit={equipMenu.unit} candidates={askCandidates(equipMenu, next.kg ?? 0)} onAnswer={askAnswer} onDismiss={askDismiss} />
          )}
          {ex && recoveryPct != null && recoveryPct < 60 && (
            <p class="hint" style={{ color: 'var(--warning)' }}>Still recovering ({recoveryPct}%). <button type="button" class="link-btn" onClick={() => setSubOpen(true)}>See substitutes</button> or ease off today.</p>
          )}
          <div class="why-row">
            <button type="button" class="why-toggle" aria-expanded={why} onClick={() => setWhy(w => !w)}>Why this target <IconChevronDown size={16} class={`chev ${why ? 'up' : ''}`} /></button>
            {ex && !ex.custom && hasHowTo(ex.id) && <button type="button" class="ht-entry" onClick={() => setHowToOpen(true)}><IconPlay size={18} /> {HOWTO_LABEL}</button>}
          </div>
          {ex && !ex.custom && hasHowTo(ex.id) && HOWTO_HINTS[ex.id] && <p class="hint muted">{HOWTO_HINTS[ex.id]}</p>}
          <div class={`ex-body ${why ? 'open' : ''} ${whySettled ? 'settled' : ''}`} ref={whyBodyRef} onTransitionEnd={e => { if (e.target === whyBodyRef.current && why) setWhySettled(true); }}>
            <div class="ex-body-inner">
            {(why || whyClosing) && (
            <div class="stack-sm">
              <p class="hint">{next.reason}</p>
              {reasonCue && <p class="hint muted" data-cue={reasonCue.id}><b>{reasonCue.title}.</b> {reasonCue.text}</p>}
              {cue && <p class="hint muted">{cue.text}</p>}
            </div>
            )}
            </div>
          </div>
          {warmup && (
            <div class="warmup">
              <button type="button" class="btn btn-quiet btn-sm tap" onClick={() => setWarmupOpen(o => !o)}>{warmupOpen ? 'Hide warm-up' : 'Show warm-up'}</button>
              {warmupOpen && (
                <div class="list" style={{ marginTop: 4 }}>
                  {warmup.map((st, i) => <Row key={i} trailing={<span class="hint num">{formatLoadable(loadableNear(st.kg, profile))} × {st.reps}</span>}><span class="small muted">Warm-up {i + 1}</span></Row>)}
                  {/* F2: logged warm-ups are kept in history but never counted. */}
                  {!entry.sets.some(x => x.kind === 'warmup') && <Button size="sm" variant="quiet" data-palace="train.log-warmups" onClick={() => logWarmups(index, warmup.map(st => { const l = loadableNear(st.kg, profile); return { kg: l.kg, entered: { value: l.value, unit: l.unit }, reps: st.reps }; }))}>Log warm-ups</Button>}
                </div>
              )}
            </div>
          )}
          {bwHint && <p class="hint">{bwHint}</p>}
          <div class={`set-grid ${isTimed ? 'duration' : ''}`}><span class="set-index">Set</span>{isTimed ? <span class="hint">seconds</span> : <><span class="hint">{loadColumnLabel(mode, eu)}</span><span class="hint">reps</span></>}<span class="hint">effort</span></div>
          {(() => { let nextUpFound = false; return entry.sets.map((set, j) => {
            const { prev, pr, prUnconfirmed } = perSet[j]!;
            // Warm-ups sit in front: working targets line up with the working sets.
            const wj = j - entry.sets.slice(0, j).filter(x => x.kind === 'warmup').length;
            const target = set.kind === 'warmup' || aside[j] ? undefined : liveTarget(next.sets[Math.min(wj, next.sets.length - 1)], wj, set);
            // A1: the first not-yet-logged, non-warmup working set on this card can be tapped to
            // fill and log itself with exactly the values its own placeholders show.
            const core = !isTimed && mode !== 'conditioning' && !aside[j] ? nextUpCore(targetKgPh(target, prev, eu, mode), eu, targetRepsPh(target, prev)) : null;
            const isNextUp = !nextUpFound && isNextUpCandidate(core, isCommitted(set), set.kind);
            if (isNextUp) nextUpFound = true;
            const lastHint = aside[j] ? `Not today · ${next.mode === 'deload' ? 'lighter week' : 'readiness'}` : prev ? `Last: ${isTimed ? `${prev.durationSec ?? 0}s` : prev.distanceM || (mode === 'conditioning' && prev.durationSec) ? `${prev.kg ? `${formatSetLoad(prev, eu)} · ` : ''}${prev.distanceM ? `${prev.distanceM} m` : `${prev.durationSec}s`}` : `${modeLoadText(prev, mode, eu)} × ${prev.reps ?? 0}`}${prev.effort ? ` · ${prev.effort}` : ''}` : target?.note ?? '';
            return (
              <div key={j}>
                <div class={`set-grid ${isTimed ? 'duration' : ''} ${isCommitted(set) ? 'committed' : ''}`} data-set-aside={aside[j] ? '' : undefined} style={aside[j] ? { opacity: 0.55 } : undefined}>
                  <button type="button" class={`set-index set-kind ${set.kind ?? ''} ${isCommitted(set) ? 'committed' : ''}`} aria-label={isCommitted(set) ? `Set ${j + 1}, logged. Options` : `Set ${j + 1} options`} onClick={() => setSetMenuAt(j)}>{isCommitted(set) && set.kind !== 'warmup' && set.kind !== 'drop' && set.kind !== 'failure' ? <IconCheck size={16} /> : set.kind === 'warmup' ? 'W' : set.kind === 'drop' ? 'D' : set.kind === 'failure' ? 'F' : j + 1}</button>
                  {isTimed ? (
                    <input type="number" inputMode="numeric" aria-label={`${entry.name}, set ${j + 1}, seconds`} placeholder={aside[j] ? '' : String(target?.durationSec ?? prev?.durationSec ?? '')} value={set.durationSec ?? ''} onInput={e => setSet(index, j, { durationSec: parseDurationSec((e.target as HTMLInputElement).value) })} onBlur={() => commitSet(index, j)} />
                  ) : (
                    <>
                      <WeightInput kg={set.kg} entered={set.entered} entryUnit={eu} displayUnit={u} placeholder={aside[j] ? '' : targetKgPh(target, prev, eu, mode)} ariaLabel={loadAriaLabel(mode, eu)} onChange={v => setSet(index, j, v ? { kg: v.kg, entered: v.entered } : { kg: undefined, entered: undefined })} onUnitFlip={loaded ? flip : undefined} onUnitLongPress={loaded ? flipGroup : undefined} setField onFieldKeyDown={onSetFieldKeyDown} />
                      <input type="number" inputMode="numeric" aria-label={`${entry.name}, set ${j + 1}, reps`} placeholder={aside[j] ? '' : targetRepsPh(target, prev)} value={set.reps ?? ''} data-set-field="reps" enterKeyHint={j === entry.sets.length - 1 ? 'done' : 'next'} onFocus={e => (e.target as HTMLInputElement).select()} onKeyDown={onSetFieldKeyDown} onInput={e => setSet(index, j, { reps: parseReps((e.target as HTMLInputElement).value) })} onBlur={() => commitSet(index, j)} />
                    </>
                  )}
                  <div class="effort">{EFFORTS.map(ef => <button type="button" key={ef.v} class={ef.v} title={ef.title} aria-label={ef.title} aria-pressed={set.effort === ef.v} onClick={() => {
                    const effort = set.effort === ef.v ? undefined : ef.v;
                    setSet(index, j, { effort });
                    // UI-31: rating the set just done updates the running rest's heart target.
                    const live = active();
                    if (live?.rest && set.id && latestCommittedSetId(live) === set.id) setRestEffort(effort);
                  }}>{ef.l}</button>)}</div>
                </div>
                {isNextUp ? (
                  <button type="button" class="row-between fill-row" style={{ marginTop: 2 }} data-palace="train.log-planned" aria-label={`Log ${core}`} onClick={() => {
                    const kgNum = target?.kg ?? prev?.kg;
                    const v = kgNum != null && set.kg == null && mode !== 'bodyweight' ? enteredLoad(kgToDisplay(kgNum, eu), eu) : null;
                    setSet(index, j, { ...(v ? { kg: v.kg, entered: v.entered } : {}), ...(set.reps == null ? { reps: target?.reps ?? prev?.reps } : {}) });
                    commitSet(index, j);
                  }}>
                    <span class="hint">{lastHint}</span>
                    <span class="row" style={{ gap: 6, color: 'var(--text-2)' }}><span class="num">Log {core}</span><IconCheck size={16} /></span>
                  </button>
                ) : (
                  <div class="row-between" style={{ marginTop: 2 }}>
                    <span class="hint">{lastHint}</span>
                    <span class="row" style={{ gap: 6 }}>
                      {set.heart?.peakBpm != null && <span class="hint">peak {set.heart.peakBpm}</span>}
                      {pr && isCommitted(set) && <span class={`pr-badge ${set.id && popIds.has(set.id) ? 'pop' : ''}`}><IconTrophy size={16} /> {prUnconfirmed ? 'PR unconfirmed' : 'PR'}</span>}
                    </span>
                  </div>
                )}
                {mode === 'conditioning' && (
                  // UI-20: carries and sled work log distance and time next to load and reps.
                  <div class="row conditioning-extra" style={{ gap: 8, marginTop: 4 }}>
                    <input type="number" inputMode="numeric" aria-label={`${entry.name}, set ${j + 1}, metres`} placeholder="m" value={set.distanceM ?? ''} onInput={e => { const v = Number((e.target as HTMLInputElement).value); setSet(index, j, { distanceM: v >= 1 && v <= 1000 ? Math.round(v) : undefined }); }} onBlur={() => commitSet(index, j)} />
                    <input type="number" inputMode="numeric" aria-label={`${entry.name}, set ${j + 1}, seconds`} placeholder="s" value={set.durationSec ?? ''} onInput={e => setSet(index, j, { durationSec: parseDurationSec((e.target as HTMLInputElement).value) })} onBlur={() => commitSet(index, j)} />
                  </div>
                )}
                <SuspectChip set={set} best={best} dismissKey={`${s.active?.startedAt}|${entry.exerciseId}|${j}|${set.kg}`} onFix={alt => { setSet(index, j, { kg: alt.kg, entered: { value: alt.value, unit: alt.unit } }); fixUnit(alt.unit); }} />
              </div>
            );
          }); })()}
          <div class="row">
            <Button variant="quiet" class="btn-icon" aria-label="Add set" onClick={() => addSet(index)}><IconPlus size={20} /></Button>
            <Button variant="quiet" class="btn-icon" aria-label="Remove last set" onClick={() => {
              const n = entry.sets.length - 1;
              const removed = entry.sets[n]!;
              removeSet(index, n);
              const a = active();
              if (hasEntry(removed) && a?.id && entry.id) showToast(`Set ${n + 1} removed`, 'Undo', () => insertSet(a.id!, entry.id!, n, removed));
            }} disabled={entry.sets.length <= 1}><IconMinus size={20} /></Button>
            <span class="grow" />
            <Button variant={entry.done ? 'default' : 'primary'} onClick={entry.done ? () => markDone(index, false) : onDone}>{entry.done ? 'Undo done' : 'Done with exercise'}</Button>
          </div>
        </div>
        )}
        </div>
      </div>
      {menu && (
        <Sheet title={entry.name} onClose={closeMenu}>
          <div class="stack-sm">
            <Field label="Setup note (shown every time)"><input maxLength={200} value={stickyDraft ?? sticky ?? ''} placeholder="Seat 4, narrow grip" data-palace="train.exercise-note-edit" onInput={e => setStickyDraft((e.target as HTMLInputElement).value)} onChange={e => { setExerciseNote(entry.exerciseId, (e.target as HTMLInputElement).value); setStickyDraft(null); }} /></Field>
            <Field label="Note for today"><input maxLength={500} value={noteDraft ?? entry.note ?? ''} onInput={e => setNoteDraft((e.target as HTMLInputElement).value)} onChange={e => { commitNoteDraft((e.target as HTMLInputElement).value); setNoteDraft(null); }} /></Field>
            <Button onClick={() => { closeMenu(); skipEntry(index, !entry.skipped); }}>{entry.skipped ? 'Put back in today' : 'Skip today'}</Button>
            {ex && <Button variant="quiet" onClick={() => { closeMenu(); setSubOpen(true); }}>Substitute exercise</Button>}
            <Button variant="danger" onClick={() => {
              // QA10-1: closeMenu() just above commits any pending "Note for today" draft to the
              // store, so `entry` (the render-time prop) is now stale — re-read it by id, or the
              // note that was just typed is lost when Undo restores the old, note-less object.
              closeMenu();
              const a = active();
              const at = a ? a.entries.findIndex(x => x.id === entry.id) : -1;
              if (!a?.id || at < 0) return;
              const e = a.entries[at]!;
              removeEntry(at);
              showToast(`${e.name} removed`, 'Undo', () => insertEntry(a.id!, at, e));
            }}>Remove from this session</Button>
            {ex && <p class="hint">{ex.equipment} · main: {ex.primary.map(muscleLabel).join(', ')}{ex.secondary.length ? ` · helps: ${ex.secondary.map(muscleLabel).join(', ')}` : ''}</p>}
          </div>
        </Sheet>
      )}
      {setMenuAt != null && entry.sets[setMenuAt] && (
        <Sheet title={`Set ${setMenuAt + 1}`} onClose={() => setSetMenuAt(null)}>
          <div class="stack-sm">
            {([[undefined, 'Normal set'], ['warmup', 'Mark as warm-up'], ['drop', 'Mark as drop set'], ['failure', 'Mark as to failure']] as const).map(([k, label]) => (
              <Button key={label} variant={entry.sets[setMenuAt]!.kind === k ? 'primary' : 'default'} onClick={() => { setSet(index, setMenuAt, k === 'failure' ? { kind: k, effort: 'max' } : { kind: k }); setSetMenuAt(null); }}>{label}</Button>
            ))}
            <Button variant="danger" disabled={entry.sets.length <= 1} onClick={() => {
              const n = setMenuAt!;
              const removed = entry.sets[n]!;
              removeSet(index, n);
              setSetMenuAt(null);
              const a = active();
              if (a?.id && entry.id) showToast(`Set ${n + 1} removed`, 'Undo', () => insertSet(a.id!, entry.id!, n, removed));
            }}>Delete set</Button>
          </div>
        </Sheet>
      )}
      {plates && next.kg != null && <PlateSheet kg={next.kg} profile={profile} name={entry.name} onClose={() => setPlates(false)} />}
      {howToOpen && ex && <HowToSheet exerciseId={ex.id} name={ex.name} onClose={() => setHowToOpen(false)} />}
      {subOpen && ex && <SubstituteSheet exercise={ex} custom={s.customExercises} onPick={sub => { substituteEntry(index, sub); setSubOpen(false); }} onClose={() => setSubOpen(false)} />}
    </Card>
  );
}

/** A committed load that looks like a kg/lb slip (§25.2 point 3): one tap converts it and remembers the unit. */
function SuspectChip({ set, best, dismissKey, onFix }: { set: LoggedSet; best: number | null; dismissKey: string; onFix: (alt: { unit: LoadUnit; value: number; kg: number }) => void }) {
  if (!set.at || set.kg == null || !setUnitSuspect(set, best) || suspectDismissed.value.has(dismissKey)) return null;
  // What was typed, read in the other unit.
  const typed = set.entered?.value ?? set.kg;
  const typedUnit = set.entered?.unit ?? 'kg';
  const altUnit: LoadUnit = typedUnit === 'kg' ? 'lb' : 'kg';
  const alt = set.entered ? { unit: altUnit, value: typed, kg: altUnit === 'lb' ? Math.round(typed * 0.45359237 * 1000) / 1000 : typed } : suspectAlternative(set.kg, best);
  if (!alt) return null;
  const ratio = Math.round((set.kg / best!) * 10) / 10;
  return (
    <div class="suspect-chip" role="status">
      <span class="grow">That's {ratio}× your usual. Was it {alt.value} {alt.unit}?</span>
      <Button size="sm" variant="primary" onClick={() => onFix(alt)}>Yes, {alt.unit}</Button>
      <Button size="sm" variant="quiet" onClick={() => { suspectDismissed.value = new Set([...suspectDismissed.value, dismissKey]); }}>No, {typedUnit}</Button>
    </div>
  );
}

/** F3.7: substitutes sharing the primary muscle, when it is recovering or an insight suggests balance work. */
function SubstituteSheet({ exercise, custom, onPick, onClose }: { exercise: Exercise; custom: Exercise[]; onPick: (ex: Exercise) => void; onClose: () => void }) {
  const subs = substitutesFor(exercise, custom);
  return (
    <Sheet title={`Substitute ${exercise.name}`} onClose={onClose}>
      <div class="list">
        {subs.map(e => (
          // AUD-10 (UI-09): a Row, so each substitute is reachable and picked by keyboard too.
          <Row key={e.id} onClick={() => onPick(e)} trailing={<span class="chip">Swap</span>}>
            <div>{e.name}</div>
            <div class="hint">{e.equipment} · {e.primary.map(muscleLabel).join(', ')}</div>
          </Row>
        ))}
        {!subs.length && <p class="small muted" style={{ padding: '12px 0' }}>No substitutes found.</p>}
      </div>
    </Sheet>
  );
}

/** "Looks like you logged this after training." Never blocks: Skip files it on the schedule slot or 17:00. */
/** Shown when "Start" is tapped, before the timer begins (6.13 cadence 'pre'). */
const RATING_LABELS = ['1', '2', '3', '4', '5'] as const;

function RatingRow({ value, onChange }: { value: 1 | 2 | 3 | 4 | 5 | undefined; onChange: (v: 1 | 2 | 3 | 4 | 5) => void }) {
  return (
    <div class="row" style={{ gap: 6 }}>
      {RATING_LABELS.map((l, i) => {
        const n = (i + 1) as 1 | 2 | 3 | 4 | 5;
        return <Button key={l} size="sm" variant={value === n ? 'solid' : 'quiet'} onClick={() => onChange(n)}>{l}</Button>;
      })}
    </div>
  );
}

/** F2.2: optional, a few taps — sleep quality, mood, and soreness for today's target muscles. Shown once per day, before the pre-session brief. */
/** The daily check-in. With a split, soreness asks about its muscles; without one (the `checkin` panel), about the least-recovered ones. */
export function CheckInSheet({ split, onClose, onDone }: { split?: Split; onClose: () => void; onDone: () => void }) {
  return <Sheet title="Quick check-in" onClose={onClose} palace="panel.checkin"><CheckInBody split={split} onDone={onDone} /></Sheet>;
}

function CheckInBody({ split, onDone }: { split?: Split; onDone: () => void }) {
  const s = state.value;
  usePalaceFocus('panel.checkin');
  const muscles = split
    ? [...new Set(split.exercises.flatMap(se => findExercise(se.exerciseId, s.customExercises)?.primary ?? []))].slice(0, 4)
    : recoverySelector.value.filter(r => r.lastTrainedAt).sort((a, b) => a.pct - b.pct).slice(0, 4).map(r => r.muscle);
  // BUG-17 (RECOVERY-F5): reopened the same day, it starts from today's answers.
  // The day is fixed when the sheet opens, so a sheet left open past midnight saves to the day it showed.
  const [draft] = useState(() => ({ day: today.value, ...checkInDraft(todayCheckIn.value) }));
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5 | undefined>(draft.sleepQuality);
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | undefined>(draft.mood);
  const [soreness, setSoreness] = useState<Partial<Record<MuscleId, 1 | 2 | 3 | 4 | 5>>>(draft.soreness);
  const save = () => { saveCheckIn(draft.day, { sleepQuality, mood, soreness }); onDone(); };
  return (
    <div class="stack">
      <Field label="Sleep quality"><RatingRow value={sleepQuality} onChange={setSleepQuality} /></Field>
      <Field label="Mood"><RatingRow value={mood} onChange={setMood} /></Field>
      {muscles.map(m => (
        <Field key={m} label={`${muscleLabel(m)} soreness`}><RatingRow value={soreness[m]} onChange={v => setSoreness(cur => ({ ...cur, [m]: v }))} /></Field>
      ))}
      <div class="row"><Button variant="quiet" onClick={onDone}>Skip</Button><Button variant="primary" class="grow" onClick={save}>Save</Button></div>
    </div>
  );
}

/** BUG-36: Start opens one sheet. The check-in (once a day) gives way to the brief inside the same
 * sheet, so the scrim stays put and the panel never drops and slides in a second time. */
function StartSheet({ split }: { split: Split }) {
  const checkIn = !todayCheckIn.value && !checkInDismissed.value;
  const close = () => { startingSplit.value = null; };
  const anchor = useRef<HTMLSpanElement>(null);
  const swapFrom = useRef<number | null>(null);
  const panel = () => anchor.current?.closest<HTMLElement>('.sheet-panel') ?? null;
  // On the swap the panel's height changes, so its top would jump: it eases from the old top instead.
  useLayoutEffect(() => {
    const p = panel();
    const before = swapFrom.current;
    swapFrom.current = null;
    if (!p || before == null) return;
    p.scrollTop = 0;
    p.focus();
    const dy = before - p.getBoundingClientRect().top;
    if (dy && !reduced() && p.animate) p.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], { duration: durFor('sheet'), easing: EASE.drawer });
  }, [checkIn]);
  const done = () => { swapFrom.current = panel()?.getBoundingClientRect().top ?? null; checkInDismissed.value = true; };
  const body = checkIn
    ? <CheckInBody split={split} onDone={done} />
    : <PreSessionBody split={split} onStart={() => { startSession(startingSplit.value!); startingSplit.value = null; }} />;
  return (
    <Sheet title={checkIn ? 'Quick check-in' : split.name} onClose={close} palace={checkIn ? 'panel.checkin' : undefined}>
      <span ref={anchor} hidden />
      {body}
    </Sheet>
  );
}

function PreSessionBody({ split, onStart }: { split: Split; onStart: () => void }) {
  const s = state.value;
  const age = s.profile.birthYear ? new Date().getFullYear() - s.profile.birthYear : null;
  // BR-08: the brief quotes the same target the set rows will show, with today's plan change
  // from Escobar applied (QA-R4a-5, QA-R4a-9).
  const planned = todaySplit(split, s.escobar.todayOverride, today.value);
  const targetFor = (exerciseId: string) => {
    const equipment = profileFor(exerciseId, s.units.activeGymId);
    const se = planned.exercises.find(x => x.exerciseId === exerciseId);
    const n = todayTarget(s, { exerciseId, sets: se?.sets ?? 3, ...(se?.loadFactor != null ? { loadFactor: se.loadFactor } : {}), split });
    return { kg: n.sets[0]?.kg ?? n.kg, target: n.target, equipment };
  };
  const items = preSessionInsights({ sessions: s.sessions, custom: s.customExercises, today: today.value, split: planned, profile: s.profile, age, targetFor, unit: s.preferences.weightUnit });
  return (
    <div class="stack">
      <div class="row-between"><span class="hint">Today’s checks</span><AskAbout refTo={{ kind: 'session', id: `plan:${split.id}`, label: `Before ${split.name}` }} /></div>
      {items.map(i => (
        <Card key={i.id} class="insight" style={{ '--insight': INSIGHT_COLOR[i.category] }}>
          <div class="insight-cat">{CATEGORY_LABEL[i.category]}</div>
          <b class="small">{i.title}</b>
          {i.means && <p class="small muted" style={{ marginTop: 4 }}>{i.means}</p>}
          <p class="hint" style={{ marginTop: 4 }}>{i.action}</p>
        </Card>
      ))}
      {!items.length && <p class="small muted">Nothing to flag.</p>}
      <Button variant="primary" block onClick={onStart}><IconPlay /> Start {split.name}</Button>
    </div>
  );
}

function TimeQuestionSheet({ summary, onResolved }: { summary: FinishSummary; onResolved: (r: FinishSummary) => void }) {
  const s = state.value;
  const medianLiveMinutes = () => {
    const durations = s.sessions.filter(x => x.logging.mode === 'live').map(x => x.durationSec / 60);
    if (!durations.length) return 60;
    const sorted = [...durations].sort((a, b) => a - b);
    return Math.round(sorted[Math.floor(sorted.length / 2)]!);
  };
  const [durText, setDurText] = useState(() => String(medianLiveMinutes()));
  const duration = parseMinutes(durText) ?? medianLiveMinutes();
  const guessedTime = s.preferences.reminders.enabled ? s.preferences.reminders.time : '17:00';
  const now = Date.now();
  // Never default to a session that would end in the future: fall back to "ended just now" instead.
  const guessedEndsInFuture = new Date(`${summary.session.day}T${guessedTime}`).getTime() + medianLiveMinutes() * 60_000 > now;
  const fallbackStart = new Date(now - medianLiveMinutes() * 60_000);
  const [guessDay] = useState(() => guessedEndsInFuture ? dayKey(fallbackStart) : summary.session.day);
  const [guessTime] = useState(() => guessedEndsInFuture ? fallbackStart.toTimeString().slice(0, 5) : guessedTime);
  const [day, setDay] = useState(guessDay);
  const [time, setTime] = useState(guessTime);
  // AUD-10 (UI-05): a start after now is not saved; Save stays off, as in "Log a past session".
  const inFuture = !!day && !!time && startsInFuture(`${day}T${time}`);
  const valid = !!day && !!time && parseMinutes(durText) != null && !inFuture;

  const resolve = (timeSource: 'user' | 'schedule' | 'default') => {
    // QA-R2c-2: Skip and close with a cleared field fall back to the guess the sheet opened with.
    // AUD-10 (UI-05): so does a start after now; Save never closes the sheet on a time it did not save.
    const at = day && time && !inFuture ? `${day}T${time}` : `${guessDay}T${guessTime}`;
    if (timeSource === 'user' && !valid) return;
    resolveSessionTiming(summary.session.id, at, duration, timeSource);
    const updated = state.value.sessions.find(x => x.id === summary.session.id)!;
    onResolved({ session: updated, changedTemplate: summary.changedTemplate });
  };

  return (
    <Sheet title="Session time" onClose={() => resolve('schedule')}>
      <div class="stack">
        <p class="small muted">Looks like you logged this after training.</p>
        <div class="grid-2">
          <Field label="Day"><input type="date" max={today.value} value={day} onInput={e => setDay((e.target as HTMLInputElement).value)} /></Field>
          <Field label="Start time"><input type="time" value={time} onInput={e => setTime((e.target as HTMLInputElement).value)} /></Field>
        </div>
        <Field label="Duration (minutes)" hint={inFuture ? 'That start time is in the future.' : undefined}><input type="text" inputMode="numeric" value={durText} onInput={e => setDurText((e.target as HTMLInputElement).value)} /></Field>
        <div class="row"><Button variant="quiet" onClick={() => resolve('schedule')}>Skip</Button><Button variant="primary" class="grow" disabled={!valid} onClick={() => resolve('user')}>Save</Button></div>
        <Button variant="quiet" size="sm" onClick={() => {
          // The session ends now; start is `duration` minutes before that (never a future timestamp).
          const start = new Date(Date.now() - duration * 60_000);
          resolveSessionTiming(summary.session.id, start.toISOString(), duration, 'default');
          onResolved({ session: state.value.sessions.find(x => x.id === summary.session.id)!, changedTemplate: summary.changedTemplate });
        }}>I trained just now</Button>
      </div>
    </Sheet>
  );
}

/** "Log a past session": the split's usual sets, entered without a timer or rest banner. */
function PastSessionEntry({ split, onClose, onSaved }: { split: Split; onClose: () => void; onSaved: (r: FinishSummary) => void }) {
  const s = state.value;
  const u = unit.value;
  const [day, setDay] = useState(today.value);
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5)); // never defaults into the future
  const [durText, setDurText] = useState('60');
  const duration = parseMinutes(durText);
  const inFuture = !!day && !!time && startsInFuture(`${day}T${time}`);
  const valid = !!day && !!time && duration != null && !inFuture;
  const [entries, setEntries] = useState(() => split.exercises.map(se => {
    const ex = findExercise(se.exerciseId, s.customExercises);
    return { exerciseId: se.exerciseId, name: ex?.name ?? se.exerciseId, sets: Array.from({ length: se.sets }, () => ({}) as import('@/core/models').LoggedSet) };
  }));

  const patchSet = (ei: number, si: number, patch: Partial<import('@/core/models').LoggedSet>) =>
    setEntries(cur => cur.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.map((st, j) => (j !== si ? st : { ...st, ...patch })) })));

  const save = () => {
    if (!valid || duration == null) return;
    const r = logPastSession({ splitId: split.id, trainedAtLocal: `${day}T${time}`, durationMin: duration, entries });
    if (r) onSaved(r);
    else showToast('Add at least one set with reps');
  };

  return (
    <Sheet title={`Log ${split.name}`} onClose={onClose}>
      <div class="stack">
        <div class="grid-2">
          <Field label="Day"><input type="date" max={today.value} value={day} onInput={e => setDay((e.target as HTMLInputElement).value)} /></Field>
          <Field label="Start time"><input type="time" value={time} onInput={e => setTime((e.target as HTMLInputElement).value)} /></Field>
        </div>
        <Field label="Duration (minutes)" hint={inFuture ? 'That start time is in the future.' : undefined}><input type="text" inputMode="numeric" value={durText} onInput={e => setDurText((e.target as HTMLInputElement).value)} /></Field>
        {entries.map((entry, ei) => {
          // AUD-10 (UI-03): the same fields as the live card for each mode: seconds for a hold,
          // and metres and seconds next to load and reps for a carry or sled.
          const mode = findExercise(entry.exerciseId, s.customExercises)?.mode ?? 'weighted';
          const isTimed = mode === 'duration';
          const eu = profileFor(entry.exerciseId).unit;
          return (
            <Card key={entry.exerciseId}>
              <b class="small">{entry.name}</b>
              <div class={`set-grid ${isTimed ? 'duration' : ''}`} style={{ marginTop: 6 }}><span class="set-index">Set</span>{isTimed ? <span class="hint">seconds</span> : <><span class="hint">{loadColumnLabel(mode, eu)}</span><span class="hint">reps</span></>}<span class="hint">effort</span></div>
              {entry.sets.map((set, si) => (
                <div key={si}>
                  <div class={`set-grid ${isTimed ? 'duration' : ''}`}>
                    <span class="set-index">{si + 1}</span>
                    {isTimed ? (
                      <input type="number" inputMode="numeric" aria-label={`${entry.name}, set ${si + 1}, seconds`} value={set.durationSec ?? ''} onInput={e => patchSet(ei, si, { durationSec: parseDurationSec((e.target as HTMLInputElement).value) })} />
                    ) : (
                      <>
                        <WeightInput kg={set.kg} entered={set.entered} entryUnit={eu} displayUnit={u} ariaLabel={loadAriaLabel(mode, eu)} onChange={v => patchSet(ei, si, v ? { kg: v.kg, entered: v.entered } : { kg: undefined, entered: undefined })} onUnitFlip={() => setExerciseUnit(entry.exerciseId, eu === 'kg' ? 'lb' : 'kg')} />
                        <input type="number" inputMode="numeric" aria-label={`${entry.name}, set ${si + 1}, reps`} value={set.reps ?? ''} onInput={e => patchSet(ei, si, { reps: parseReps((e.target as HTMLInputElement).value) })} />
                      </>
                    )}
                    <div class="effort">{EFFORTS.map(ef => <button type="button" key={ef.v} class={ef.v} title={ef.title} aria-label={ef.title} aria-pressed={set.effort === ef.v} onClick={() => patchSet(ei, si, { effort: set.effort === ef.v ? undefined : ef.v })}>{ef.l}</button>)}</div>
                  </div>
                  {mode === 'conditioning' && (
                    <div class="row conditioning-extra" style={{ gap: 8, marginTop: 4 }}>
                      <input type="number" inputMode="numeric" aria-label={`${entry.name}, set ${si + 1}, metres`} placeholder="m" value={set.distanceM ?? ''} onInput={e => { const v = Number((e.target as HTMLInputElement).value); patchSet(ei, si, { distanceM: v >= 1 && v <= 1000 ? Math.round(v) : undefined }); }} />
                      <input type="number" inputMode="numeric" aria-label={`${entry.name}, set ${si + 1}, seconds`} placeholder="s" value={set.durationSec ?? ''} onInput={e => patchSet(ei, si, { durationSec: parseDurationSec((e.target as HTMLInputElement).value) })} />
                    </div>
                  )}
                </div>
              ))}
              <div class="row">
                <Button variant="quiet" size="sm" onClick={() => setEntries(cur => cur.map((e, i) => (i !== ei ? e : { ...e, sets: [...e.sets, {}] })))}><IconPlus size={16} /> Set</Button>
                <Button variant="quiet" size="sm" onClick={() => setEntries(cur => cur.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.slice(0, -1) })))} disabled={entry.sets.length <= 1}><IconMinus size={16} /> Set</Button>
              </div>
            </Card>
          );
        })}
        <Button variant="primary" block disabled={!valid} onClick={save}>Save past session</Button>
      </div>
    </Sheet>
  );
}

function FinishScreen({ summary, onClose }: { summary: FinishSummary; onClose: () => void }) {
  const { session } = summary;
  const s = state.value;
  const emphasis = sessionEmphasis(session.exercises, s.customExercises).percents;
  const top = (Object.entries(emphasis) as Array<[string, number]>).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const sets = session.exercises.reduce((a, e) => a + e.sets.length, 0);
  const priorSessions = s.sessions.filter(x => x.id !== session.id);
  const debrief = sets > 0 ? postSessionInsights({ session, priorSessions, custom: s.customExercises, goal: s.goal, restSettingSec: s.preferences.autoRest ? s.preferences.restDefaultSec : undefined, unit: s.preferences.weightUnit }) : [];
  /** F3.5: a "did you know" cue on the finish screen, for whichever main lift the session actually trained. */
  const learnExercise = findExercise((session.exercises.find(e => findExercise(e.exerciseId, s.customExercises)?.role === 'main') ?? session.exercises[0])?.exerciseId ?? '', s.customExercises);
  const learnCue = learnExercise ? pickCue(learnExercise, 'learn', `${session.day}|${learnExercise.id}`) : null;
  const [sharing, setSharing] = useState(false);
  return (
    <div class="view reveal">
      <div class="topbar"><div><div class="eyebrow">Session saved</div><h1>{session.splitName} done</h1></div><AskAbout refTo={{ kind: 'session', id: session.id, label: `${session.splitName} session` }} /></div>
      <Card>
        <div class="grid-3"><div class="stat"><b class="num">{formatClock(session.durationSec)}</b><span>duration</span></div><div class="stat"><b class="num">{session.exercises.length}</b><span>exercise{session.exercises.length === 1 ? '' : 's'}</span></div><div class="stat"><b class="num">{sets}</b><span>set{sets === 1 ? '' : 's'}</span></div></div>
      </Card>
      {session.heart && (
        <Section title="Heart">
          <Card>
            <div class="grid-3">
              <div class="stat"><b class="num">{session.heart.avgBpm}</b><span>avg bpm</span></div>
              <div class="stat"><b class="num">{session.heart.maxBpm}</b><span>max bpm</span></div>
              <div class="stat"><b class="num">{session.heart.hrr60Median ?? '—'}</b><span>HRR60</span></div>
            </div>
            <div class="row" style={{ marginTop: 12, gap: 2 }}>
              {session.heart.zoneSec.map((sec, i) => <div key={i} class="grow" style={{ height: 8, borderRadius: 'var(--radius-xs)', background: sec > 0 ? 'var(--accent)' : 'var(--border)', opacity: sec > 0 ? 0.4 + i * 0.15 : 1 }} />)}
            </div>
            {session.heart.energy && (
              <p class="small" style={{ marginTop: 10 }}>About {session.heart.energy.activeKcal} kcal active. {session.heart.energy.source === 'heart_rate' ? 'Estimated from heart rate.' : session.heart.energy.source === 'watch_energy' ? 'From your watch.' : 'From Health Connect.'}</p>
            )}
            <p class="hint" style={{ marginTop: 6 }}>Watch was live for {Math.round(session.heart.coverage * 100)}% of the session.</p>
          </Card>
        </Section>
      )}
      {hasWorkingSets(session) && <Button block data-palace="train.share" onClick={() => setSharing(true)} style={{ marginTop: 16 }}><IconShare size={20} /> Share workout</Button>}
      {sharing && <ShareSheet initial="workout" session={session} onClose={() => setSharing(false)} />}
      {debrief.length > 0 && (
        <Section title="Debrief">
          <div class="stack-sm">
            {debrief.map(i => (
              <Card key={i.id} class="insight" style={{ '--insight': INSIGHT_COLOR[i.category] }}>
                <div class="insight-cat">{CATEGORY_LABEL[i.category]}</div>
                <b class="small">{i.title}</b>
                <p class="small muted" style={{ marginTop: 4 }}>{i.means}</p>
                <p class="hint" style={{ marginTop: 4 }}>{i.action}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}
      {learnCue && (
        <Section title="Coach fact">
          <Card class="card-quiet"><b class="small">{learnCue.title}</b><p class="small muted" style={{ marginTop: 4 }}>{learnCue.text}</p></Card>
        </Section>
      )}
      <Section title="Muscles worked">
        <Card>
          <MuscleMap values={emphasis as never} mode="emphasis" />
          <div class="wrap" style={{ marginTop: 12 }}>{top.map(([m, v]) => <Chip key={m} tone="accent">{muscleLabel(m)} {v}%</Chip>)}</div>
          {sets === 0 && <p class="small muted" style={{ marginTop: 10 }}>No sets were logged, so nothing was added to history.</p>}
        </Card>
      </Section>
      <div class="finish-done"><Button variant="primary" block onClick={onClose}>Done</Button></div>
    </div>
  );
}

/** I1: the rest bar's WAAPI keyframes — starts at the fraction of totalSec already elapsed, always ends full. */
export function restBarKeyframes(remainingMs: number, totalSec: number): [string, string] {
  const p0 = totalSec > 0 ? 1 - remainingMs / (totalSec * 1000) : 1;
  return [`translateX(${(p0 - 1) * 100}%)`, 'translateX(0)'];
}

/** I1: what the banner shows; kept in a ref through the ~200ms exit animation, since `a.rest` is already gone by then. */
interface RestFrame { done: boolean; clockText: string; hintText: string }

export function RestBanner() {
  const s = state.value;
  const a = s.active;
  const rest = a?.rest;
  useEffect(() => (rest ? acquireTicker() : undefined), [!!rest]);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const lastFrame = useRef<RestFrame | null>(null);
  const lastTickSec = useRef<number | null>(null);
  const lastGoEndsAt = useRef<number | null>(null);
  const [wasResting, setWasResting] = useState(!!rest);
  const [leaving, setLeaving] = useState(false);
  const [goPulse, setGoPulse] = useState(false);

  // I1.1: catch the resting -> not-resting edge during this render (not in an effect), so the
  // banner never renders null for a frame between the rest ending and the exit animation starting.
  if (!!rest !== wasResting) {
    setWasResting(!!rest);
    setLeaving(!rest);
  }

  let frame: RestFrame | null = null;
  let remaining = 0;
  let done = false;
  let heartMode = false;
  if (rest && a) {
    // F6: nowMs can still be a hair stale on the first frame (acquireTicker resolves in an
    // effect, after paint). Clamp both ends so remaining never reads over total or under zero.
    const now = Math.max(nowMs.value, Date.now());
    remaining = Math.min(rest.totalSec, restRemainingSec(a, now) ?? 0);
    const timeDone = remaining <= 0;
    // Heart-guided rest (F1.2): only while the stream is LIVE; a DELAYED/STALE stream falls back to the timer.
    heartMode = s.preferences.rest.mode === 'heart' && !a.pausedAt && watchStatus.value.freshness === 'LIVE';
    let heartReady = false;
    let currentBpm: number | undefined;
    let targetBpm: number | undefined;
    if (heartMode) {
      const restingBpm = restingHr(s.healthDays, s.profile, today.value);
      if (restingBpm != null) {
        const elapsedSec = Math.max(0, rest.totalSec - remaining);
        const r = restTarget({ recentBpms: recentLiveBpms(3), preSetBpm: rest.preSetBpm, restingHrBpm: restingBpm, hrMaxBpm: hrMax(s.profile).bpm, effort: rest.effort, elapsedSec });
        heartReady = r.ready;
        targetBpm = r.readyBpm;
        currentBpm = latestMeasurement.value?.bpm;
      }
    }
    // BUG-21: heart rate ends an accessory's rest early; otherwise the rest runs to the timer.
    const timerIsFloor = restTimerIsFloor(a, s.customExercises);
    done = restDone(timeDone, heartReady, timerIsFloor);
    if (heartMode && timerIsFloor && heartReady) heartMode = false;
    const showBpm = heartMode && !done && currentBpm != null && targetBpm != null;
    frame = {
      done,
      clockText: done ? 'Go' : showBpm ? `${currentBpm} → ${targetBpm}` : formatClock(remaining),
      // A9: the open card's next set, when there is one to show.
      hintText: done ? 'Rest done. Next set.' : showBpm ? 'Resting until heart rate settles' : nextUpHint.value ? `Next · ${nextUpHint.value}` : `Rest · ${formatClock(rest.totalSec)}`,
    };
    lastFrame.current = frame;
  }

  // I1.4: a tick at 3, 2, 1 seconds left (timer mode; heart mode has no countdown to tick).
  const secLeft = rest && !done && !heartMode ? Math.ceil(remaining) : null;
  useEffect(() => {
    if (secLeft != null && secLeft !== lastTickSec.current && (secLeft === 3 || secLeft === 2 || secLeft === 1)) void haptic.tick();
    lastTickSec.current = secLeft;
  }, [secLeft]);

  // I1.3: the card swells once and, on the web (native's own scheduled notification already
  // vibrates), the phone gets a distinct alert — once per rest, only while the tab is visible.
  useEffect(() => {
    if (!rest || !done || document.visibilityState !== 'visible' || lastGoEndsAt.current === rest.endsAt) return;
    lastGoEndsAt.current = rest.endsAt;
    if (!isNative()) void haptic.alert();
    setGoPulse(true);
    const t = setTimeout(() => setGoPulse(false), durFor('bounce'));
    return () => clearTimeout(t);
  }, [rest?.endsAt, done]);

  // I1.1: the exit animation plays for durFor('exit')+40ms, then the banner unmounts.
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setLeaving(false), durFor('exit') + 40);
    return () => clearTimeout(t);
  }, [leaving]);

  // I1.2: the bar glides continuously via WAAPI, rebuilt only when the rest actually changes
  // (start, ±15, pause/resume) or the moment it finishes — never stepped once a second.
  useEffect(() => {
    const i = barRef.current;
    if (!rest || !i) return undefined;
    const ms = rest.endsAt - Date.now();
    const [from, to] = restBarKeyframes(ms, rest.totalSec);
    const anim = i.animate([{ transform: from }, { transform: to }], { duration: Math.max(0, ms), easing: 'linear', fill: 'forwards' });
    if (a?.pausedAt) anim.pause();
    return () => anim.cancel();
  }, [rest?.endsAt, rest?.totalSec, !!a?.pausedAt, done]);

  // I1.6: reserve space for the banner, so it never sits over the last button, a toast or the dock.
  useEffect(() => {
    document.documentElement.toggleAttribute('data-rest', !!rest);
    if (!rest) { document.documentElement.style.removeProperty('--rest-h'); return undefined; }
    const el = rootRef.current;
    if (!el) return undefined;
    const sync = () => document.documentElement.style.setProperty('--rest-h', `${el.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [!!rest]);
  useEffect(() => () => { document.documentElement.toggleAttribute('data-rest', false); document.documentElement.style.removeProperty('--rest-h'); }, []);

  const shown = frame ?? (leaving ? lastFrame.current : null);
  if (!shown) return null;
  return (
    <div ref={rootRef} class={`rest ${shown.done ? 'done' : ''} ${leaving ? 'leaving' : ''} ${goPulse ? 'go' : ''}`}>
      {/* UI-26: announced once when rest ends, not every second of the countdown. */}
      <span class="sr-only" aria-live="polite">{shown.done ? 'Rest done' : ''}</span>
      <div>
        <div class="clock">{shown.clockText}</div>
        <div class="hint">{shown.hintText}</div>
        {/* QA3-1: Android has firmly denied notifications, so no alert is coming for this rest. */}
        {restAlertsDenied.value && <div class="hint danger-text">Rest alerts are off — Settings → Precise rest alerts</div>}
      </div>
      <div class="grow"><div class="bar"><i ref={barRef} /></div></div>
      {!shown.done && <Button variant="quiet" class="rest-btn" aria-label="Less rest" onClick={() => adjustRest(-15)}>-15</Button>}
      {!shown.done && <Button variant="quiet" class="rest-btn" aria-label="More rest" onClick={() => adjustRest(15)}>+15</Button>}
      <Button class="rest-btn" onClick={() => stopRest()}>{shown.done ? 'OK' : 'Skip'}</Button>
    </div>
  );
}

