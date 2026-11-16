import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { AskAbout } from '@/escobar/ui/AskAbout';
import { state, update } from '@/core/store';
import { minuteNow, recovery, today, unit } from '@/app/selectors';
import { Button, Card, Chip, Field, Row, Section, Segmented, Sheet, Stat } from '@/ui/primitives';
import { MapLegend, MuscleMap, type MapMode } from '@/ui/MuscleMap';
import { MUSCLES, MUSCLE_BY_ID, muscleLabel, type MuscleId } from '@/data/muscles';
import { BEYOND_CAP_TEXT, addDays, dayKey, dayOrToday, formatDay, formatFullAt, formatFullBy, formatHours, readyDayWindow, readyGroupFor } from '@/core/dates';
import { durFor } from '@/ui/motion';
import { trainingLevels, weeklyMuscleSets, LEVELS } from '@/brain/exposure';
import { muscleVolumeStatus } from '@/brain/volume';
import { navyBodyFat } from '@/core/bodyfat';
import { LIBRARY } from '@/core/exercises';
import { exerciseHistory, type ExerciseSessionSummary } from '@/brain/history';
import { modeLoadText } from '@/brain/bodyweight';
import { FULL_PCT, READY_PCT } from '@/data/recovery';
import type { MuscleRecovery } from '@/brain/recovery';
import { DATA_LABEL } from '@/brain/trend';
import type { LoadUnit, ResistanceMode } from '@/core/models';
import { addExerciseToSession } from '@/slices/workout/session';
import { showToast } from '@/app/toast';
import { bodyView, openPanel, showPanel } from '@/app/router';
import { usePalaceFocus } from '@/escobar/palace/focus';
import { IconChevron } from '@/ui/icons';

type View = 'recovery' | 'levels' | 'week';

export function Body() {
  const s = state.value;
  const view = bodyView.value;
  const setView = (v: View) => { bodyView.value = v; };
  const setSelected = (m: MuscleId) => showPanel('muscle', { muscle: m });
  const selected = openPanel.value?.id === 'muscle' ? (openPanel.value.params?.muscle as MuscleId | undefined) ?? null : null;
  usePalaceFocus('body.map', { view });
  const rec = recovery.value;
  const levels = useMemo(() => trainingLevels(s.sessions, s.customExercises, { trainingSince: s.profile.trainingSince, today: today.value }), [s.sessions, s.profile.trainingSince, today.value]);
  const weekSets = useMemo(() => weeklyMuscleSets(s.sessions, today.value, 1, s.customExercises)[0]?.sets ?? {}, [s.sessions, today.value]);
  const maxWeek = Math.max(1, ...Object.values(weekSets).map(v => v ?? 0));
  /** F3.2: this week's effective sets vs. the level-based band, faint-range on each bar. */
  const volumeStatus = useMemo(() => muscleVolumeStatus(s.sessions, today.value, s.customExercises, { schedule: s.schedule, daysOff: s.daysOff, plannedDays: s.profile.plannedDays }, s.profile.trainingSince).filter(r => r.status !== 'unknown').sort((a, b) => b.thisWeekSets - a.thisWeekSets), [s.sessions, today.value, s.customExercises, s.schedule, s.daysOff, s.profile]);

  const values: Partial<Record<MuscleId, number>> = view === 'recovery'
    ? Object.fromEntries(rec.filter(r => r.lastTrainedAt).map(r => [r.muscle, r.pct]))
    : view === 'levels'
      ? Object.fromEntries(MUSCLES.map(m => [m.id, levels[m.id].levelIndex ? (levels[m.id].levelIndex / (LEVELS.length - 1)) * 100 : undefined]))
      : Object.fromEntries((Object.entries(weekSets) as Array<[MuscleId, number]>).map(([m, v]) => [m, (v / maxWeek) * 100]));
  const mode: MapMode = view === 'recovery' ? 'recovery' : 'emphasis';
  const fullyRecovered = rec.filter(r => r.pct >= FULL_PCT && r.lastTrainedAt);
  const wholeBody = rec.find(r => r.systemicFactor > 1);

  return (
    <div class="view">
      <div class="topbar"><div><div class="eyebrow">Body</div><h1>Muscle map</h1></div></div>
      <Segmented value={view} onChange={setView} options={[{ value: 'recovery', label: 'Recovery' }, { value: 'week', label: 'This week' }, { value: 'levels', label: 'Levels' }]} />
      <Card style={{ marginTop: 14 }} data-palace="body.map">
        <MuscleMap values={values} mode={mode} selected={selected} onSelect={m => setSelected(m)} />
        <div style={{ marginTop: 10 }}><MapLegend mode={mode} /></div>
        {view === 'recovery' && <p class="hint" style={{ marginTop: 8 }}>Ready at {READY_PCT}%, full at {FULL_PCT}%.</p>}
        {view === 'recovery' && wholeBody && <p class="hint" style={{ marginTop: 4 }}>Whole body: recovering about {Math.round((wholeBody.systemicFactor - 1) * 100)}% slower than usual this week.</p>}
      </Card>

      {view === 'recovery' && (
        <>
          <Section title="Ready times" palace="body.recovering" aside={<span class="small muted">{confidenceAside(rec)}</span>}>
            <ReadyTimesCard rec={rec} setSelected={setSelected} />
          </Section>
          <Section title="Recovered muscles" palace="body.full" aside={<span class="small muted">{fullyRecovered.length}</span>}>
            <Card><div class="wrap">{fullyRecovered.map(r => <Chip key={r.muscle} tone="positive" onClick={() => setSelected(r.muscle)}>{muscleLabel(r.muscle)}</Chip>)}{!fullyRecovered.length && <span class="small muted">None yet.</span>}</div></Card>
          </Section>
        </>
      )}

      {view === 'levels' && (
        <Section title="Training levels" palace="body.levels">
          <Card><div class="list">{MUSCLES.map(m => levels[m.id]).map((l, i) => ({ l, m: MUSCLES[i]! })).sort((a, b) => b.l.score - a.l.score).map(({ l, m }) => <Row key={m.id} onClick={() => setSelected(m.id)} trailing={<Chip tone={l.levelIndex >= 4 ? 'accent' : undefined}>{l.level}</Chip>}><span class="small">{m.label}</span></Row>)}</div></Card>
        </Section>
      )}

      {view === 'week' && (
        <Section title="Effective sets" palace="body.week-volume">
          <Card><div class="list">
            {volumeStatus.map(r => {
              const scaleMax = Math.max(r.thisWeekSets, r.band[1]) * 1.15 || 1;
              return (
                <Row key={r.muscle} onClick={() => setSelected(r.muscle)} trailing={<span class="num small">{r.thisWeekSets}</span>}>
                  <span class="small">{muscleLabel(r.muscle)}</span>
                  <div class="bar" style={{ marginTop: 4 }}>
                    <span class="range" style={{ left: `${(r.band[0] / scaleMax) * 100}%`, width: `${((r.band[1] - r.band[0]) / scaleMax) * 100}%` }} />
                    <i style={{ width: `${(r.thisWeekSets / scaleMax) * 100}%`, background: r.thisWeekSets > r.band[1] ? 'var(--warning)' : 'var(--positive)' }} />
                  </div>
                </Row>
              );
            })}
            {!volumeStatus.length && <p class="small muted">No sets logged this week yet.</p>}
          </div></Card>
        </Section>
      )}

      <BodyFat />
    </div>
  );
}

// O3: "Ready times" — the recovery list as ring tiles grouped by the day each muscle is ready.

type RtGroupKey = 'today' | 'tomorrow' | 'later' | 'sore';
interface RtGroup { key: RtGroupKey; label: string; muscles: MuscleId[] }
interface RtLayout { readyNow: MuscleId[]; groups: RtGroup[] }

const rtGroupInput = (r: MuscleRecovery) => ({ readyInHours: r.readyInHours, hoursLeft: r.hoursLeft, soreToday: r.soreToday, beyondCap: r.beyondCap });

/** QA7-6: a tile's time text as its unbreakable parts ("10 pm – midnight" -> ["10 pm", "midnight"]),
 * so the line can only break at the dash, never inside "10 pm". */
const nwParts = (text: string): string[] => text.split(' – ');

/** The Section aside: a data summary across every muscle the card lists (Ready now + the day groups). */
function confidenceAside(rec: MuscleRecovery[]): string | undefined {
  const listed = rec.filter(r => r.lastTrainedAt && r.pct < FULL_PCT);
  if (!listed.length) return undefined;
  const first = listed[0]!.confidence;
  return listed.every(r => r.confidence === first) ? DATA_LABEL[first] : 'Mixed data';
}

function buildRtLayout(rec: MuscleRecovery[], now: number): RtLayout {
  const readyOnly = rec.filter(r => r.ready && r.pct < FULL_PCT && r.lastTrainedAt);
  const recoveringList = rec.filter(r => r.recovering);
  const withGroup = recoveringList.map(r => ({ r, g: readyGroupFor(now, rtGroupInput(r)) }));
  const cmp = (a: typeof withGroup[number], b: typeof withGroup[number]) =>
    a.g.latestMs - b.g.latestMs || a.g.earliestMs - b.g.earliestMs || b.r.pct - a.r.pct || muscleLabel(a.r.muscle).localeCompare(muscleLabel(b.r.muscle));
  const byKey = (k: RtGroupKey) => withGroup.filter(x => x.g.group === k).sort(cmp).map(x => x.r.muscle);

  const todayKey = dayKey(now);
  const tomorrowKey = addDays(todayKey, 1);
  const groups: RtGroup[] = [];
  const push = (key: RtGroupKey, label: string) => { const muscles = byKey(key); if (muscles.length) groups.push({ key, label, muscles }); };
  push('today', `Today · ${formatDay(todayKey, { weekday: 'short', day: 'numeric' })}`);
  push('tomorrow', `Tomorrow · ${formatDay(tomorrowKey, { weekday: 'short', day: 'numeric' })}`);
  push('later', 'Later');
  push('sore', 'Sore today');

  const readyNow = [...readyOnly]
    .sort((a, b) => (a.fullInHours ?? Infinity) - (b.fullInHours ?? Infinity) || b.pct - a.pct || muscleLabel(a.muscle).localeCompare(muscleLabel(b.muscle)))
    .map(r => r.muscle);

  return { readyNow, groups };
}

/** 40px ring: an arc to READY_PCT (a full circle means ready), a tick at the ready mark, dashed track when sore. */
function RtRing({ pct, sore }: { pct: number; sore?: boolean }) {
  const C = 106.81; // 2 * PI * 17 (r=17)
  const dash = (C * Math.min(pct, READY_PCT)) / READY_PCT;
  const color = pct >= READY_PCT ? 'var(--positive)' : pct >= 75 ? 'var(--warning)' : 'var(--text-2)';
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" class="rt-ring" aria-hidden="true">
      <circle cx="20" cy="20" r="17" fill="none" stroke="var(--surface-3)" stroke-width="4" stroke-dasharray={sore ? '3.2 2.14' : undefined} />
      {!sore && <circle cx="20" cy="20" r="17" fill="none" stroke={color} stroke-width="4" stroke-linecap="round" stroke-dasharray={`${dash} ${C}`} transform="rotate(-90 20 20)" />}
      {!sore && pct < READY_PCT && <rect x="19" y="0" width="2" height="6" fill="var(--text)" />}
      <text x="20" y="20" text-anchor="middle" dominant-baseline="central">{Math.round(pct)}</text>
    </svg>
  );
}

function RtTile({ r, now, group, full, expanded, onClick, tileRef }: {
  r: MuscleRecovery; now: number; group: RtGroupKey | 'ready'; full: boolean; expanded: boolean;
  onClick: () => void; tileRef: (el: HTMLButtonElement | null) => void;
}) {
  const tileText = group === 'ready' ? formatFullBy(now, r.fullInHours) : readyGroupFor(now, rtGroupInput(r)).tileText;
  const windowLabel = group === 'ready' ? 'now' : tileText;
  return (
    <button type="button" ref={tileRef} class={`rt-tile ${full ? 'rt-tile-full' : ''} ${expanded ? 'open' : ''}`}
      aria-expanded={expanded} aria-controls={`rt-detail-${r.muscle}`}
      aria-label={`${muscleLabel(r.muscle)}, ${r.pct} percent, ready ${windowLabel}`}
      onClick={onClick}>
      <RtRing pct={r.pct} sore={!!r.soreToday} />
      <span class="rt-tile-info">
        <span class="rt-tile-name">{muscleLabel(r.muscle)}</span>
        <span class="rt-tile-time">
          {nwParts(tileText).flatMap((part, i) => i === 0 ? [<span class="nw" key={i}>{part}</span>] : [' – ', <span class="nw" key={i}>{part}</span>])}
        </span>
      </span>
    </button>
  );
}

/** The strip under a tapped line: name + status, the ready window, and the full time + confidence. Tapping it opens the muscle panel. */
function RtDetail({ r, now, col, full, oneColumn, onOpen }: { r: MuscleRecovery; now: number; col: number; full: boolean; oneColumn: boolean; onOpen: () => void }) {
  const headline = r.ready ? 'Ready' : r.soreToday && !r.readyInHours ? 'Sore today' : `${READY_PCT - r.pct}% to go`;
  const readyLine = r.ready ? 'Ready now' : readyGroupFor(now, rtGroupInput(r)).detailText;
  const fullLine = r.fullInHours != null ? `Full ${formatFullAt(now, r.fullInHours)}` : null;
  const caretLeft = full || oneColumn || col === 0 ? '28px' : 'calc(50% + 28px)';
  return (
    <button type="button" class="rt-detail" id={`rt-detail-${r.muscle}`} onClick={onOpen}>
      <span class="rt-caret" style={{ left: caretLeft }} aria-hidden="true" />
      <span class="rt-detail-row1"><b>{muscleLabel(r.muscle)}</b><span class="muted">{headline}</span></span>
      <span class="rt-detail-row2">{readyLine}</span>
      <span class="rt-detail-row3">{[fullLine, DATA_LABEL[r.confidence]].filter((x): x is string => !!x).join(' · ')}</span>
      <IconChevron class="rt-detail-chevron" size={16} />
    </button>
  );
}

function ReadyTimesCard({ rec, setSelected }: { rec: MuscleRecovery[]; setSelected: (m: MuscleId) => void }) {
  const now = minuteNow.value;
  const byId = useMemo(() => new Map(rec.map(r => [r.muscle, r] as const)), [rec]);
  const layout = useMemo(() => buildRtLayout(rec, now), [rec, now]);

  const [openMuscle, setOpenMuscle] = useState<MuscleId | null>(null);
  const [openCol, setOpenCol] = useState(0);
  const [renderedMuscle, setRenderedMuscle] = useState<MuscleId | null>(null);
  const frozenRef = useRef<RtLayout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef(new Map<MuscleId, HTMLButtonElement>());
  const [oneColumn, setOneColumn] = useState(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(scrollTimer.current), []);

  // QA-O3: while a strip is open, the grouping/order is frozen so the grid never reshuffles
  // under the finger; the numbers shown still come from the live `rec` on every minute tick.
  useEffect(() => {
    if (openMuscle) {
      if (!frozenRef.current) frozenRef.current = layout;
      setRenderedMuscle(openMuscle);
      return;
    }
    frozenRef.current = null;
    if (renderedMuscle == null) return undefined;
    const t = setTimeout(() => setRenderedMuscle(null), durFor('base') + 20);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMuscle]);

  const shown = openMuscle && frozenRef.current ? frozenRef.current : layout;
  const allMuscles = useMemo(() => [...shown.readyNow, ...shown.groups.flatMap(g => g.muscles)], [shown]);
  const longestName = useMemo(() => allMuscles.map(muscleLabel).reduce((a, b) => (b.length > a.length ? b : a), ''), [allMuscles]);
  // QA7-6: the widest single unbreakable part ("10 pm", "midnight"), not the whole "10 pm –
  // midnight" string — the fallback should only fire when one such part can't fit.
  const longestTime = useMemo(() => allMuscles
    .flatMap(m => { const r = byId.get(m)!; const t = shown.readyNow.includes(m) ? formatFullBy(now, r.fullInHours) : readyGroupFor(now, rtGroupInput(r)).tileText; return nwParts(t); })
    .reduce((a, b) => (b.length > a.length ? b : a), ''), [allMuscles, byId, now, shown]);

  // QA-O3: a muscle name or time that would overflow its 2-column tile switches the whole card
  // to one column. Measured against a hidden 50%-width probe so it works in both directions
  // (narrowing AND widening) regardless of the card's current column mode.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const probe = () => {
      const nameEl = el.querySelector<HTMLElement>('.rt-probe-name');
      const timeEl = el.querySelector<HTMLElement>('.rt-probe-time');
      if (!nameEl || !timeEl) return;
      // QA7-2: a name may now wrap to 2 lines, so overflow can be either axis — a name still
      // too wide for its column (an unbreakable word), or too tall (would need a 3rd line).
      const nameOverflows = nameEl.scrollWidth > nameEl.clientWidth + 0.5 || nameEl.scrollHeight > nameEl.clientHeight + 1;
      // QA7-6: only a single unbreakable time part failing to fit its own line counts — the
      // combined "part – part" text is allowed (expected) to wrap onto 2 lines.
      const timeOverflows = timeEl.scrollWidth > timeEl.clientWidth + 0.5;
      setOneColumn(nameOverflows || timeOverflows);
    };
    probe();
    // rAF-deferred: measuring synchronously inside the callback can itself change layout
    // (setOneColumn re-renders), which trips the browser's "ResizeObserver loop" warning.
    const ro = new ResizeObserver(() => requestAnimationFrame(probe));
    ro.observe(el);
    return () => ro.disconnect();
  }, [longestName, longestTime]);

  const onTile = (muscle: MuscleId, col: number) => {
    const el = tileRefs.current.get(muscle);
    const before = el?.getBoundingClientRect().top;
    setOpenMuscle(cur => (cur === muscle ? null : muscle));
    setOpenCol(col);
    if (before == null) return;
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const after = tileRefs.current.get(muscle)?.getBoundingClientRect().top;
      if (after == null) return;
      const delta = after - before;
      if (Math.abs(delta) > 0.5) window.scrollBy(0, delta);
    }, durFor('base') + 30);
  };

  const renderLines = (muscles: MuscleId[], group: RtGroupKey | 'ready') => {
    const lines: MuscleId[][] = [];
    for (let i = 0; i < muscles.length; i += 2) lines.push(muscles.slice(i, i + 2));
    return lines.map((line, li) => {
      const lineHasOpen = renderedMuscle != null && line.includes(renderedMuscle);
      return (
        <div key={line.join('-')}>
          {li > 0 && <div class="rt-divider" />}
          <div class={`rt-line ${oneColumn ? 'one-col' : ''}`}>
            {line.map((m, ci) => (
              <RtTile key={m} r={byId.get(m)!} now={now} group={group} full={line.length === 1} expanded={openMuscle === m}
                onClick={() => onTile(m, ci)} tileRef={el => { if (el) tileRefs.current.set(m, el); else tileRefs.current.delete(m); }} />
            ))}
          </div>
          <div class={`rt-detail-wrap ${openMuscle != null && line.includes(openMuscle) ? 'open' : ''}`}>
            {lineHasOpen && <RtDetail r={byId.get(renderedMuscle!)!} now={now} col={openCol} full={line.length === 1} oneColumn={oneColumn} onOpen={() => setSelected(renderedMuscle!)} />}
          </div>
        </div>
      );
    });
  };

  return (
    <Card style={{ padding: '0 4px 4px' }}>
      <div ref={containerRef} class="rt-card-body">
        <div class="rt-probe" aria-hidden="true">
          <div class="rt-tile">
            <span class="rt-ring-spacer" />
            <span class="rt-tile-info">
              <span class="rt-tile-name rt-probe-name">{longestName}</span>
              <span class="rt-tile-time rt-probe-time"><span class="nw">{longestTime}</span></span>
            </span>
          </div>
        </div>
        <div data-palace="body.ready">
          <div class="rt-group-head"><span>Ready now</span><span class="muted">{shown.readyNow.length || 'None yet'}</span></div>
          {renderLines(shown.readyNow, 'ready')}
        </div>
        {shown.groups.map(g => (
          <div key={g.key}>
            <div class="rt-group-head"><span>{g.label}</span><span class="muted">{g.muscles.length}</span></div>
            {renderLines(g.muscles, g.key)}
          </div>
        ))}
      </div>
    </Card>
  );
}

type MuscleTab = 'logged' | 'trynext';

/** Best-ever hint for a Logged row: highest topKg (ties go to higher topReps), or best reps/duration when the exercise carries no load. */
function bestEverHint(h: ExerciseSessionSummary[], mode: ResistanceMode, u: LoadUnit): string {
  const loaded = h.filter(x => x.topKg > 0);
  if (loaded.length) {
    const best = loaded.reduce((a, b) => (b.topKg > a.topKg || (b.topKg === a.topKg && b.topReps > a.topReps) ? b : a));
    return `${modeLoadText({ kg: best.topKg }, mode, u)} × ${best.topReps}`;
  }
  const bestReps = Math.max(0, ...h.map(x => x.bestReps));
  const bestDur = Math.max(0, ...h.map(x => x.bestDurationSec));
  return `${bestReps || bestDur} ${bestDur ? 's' : 'reps'}`;
}

/** AUD-6 (UI-07): the muscle panel's "Full" column. Ready (90 %) is not full (97 %): a ready muscle still short of full shows its day. */
export function muscleFullText(now: number, r: Pick<MuscleRecovery, 'recovering' | 'fullInHours' | 'beyondCap'>): string {
  if (r.fullInHours != null && (r.recovering || r.fullInHours > 0)) return dayOrToday(now, r.fullInHours);
  if (!r.recovering) return 'Now';
  return r.beyondCap ? BEYOND_CAP_TEXT : 'When soreness eases';
}

/** One muscle, opened as the `muscle` panel (from the map, a list row, or Escobar). O2: a clear
 * recovery timeline (real dates, not "2d to 3d"), four facts, and Logged/Try next tabs. */
export function MuscleDetail({ muscle, onClose }: { muscle: MuscleId; onClose: () => void }) {
  const s = state.value;
  usePalaceFocus('body.muscle', { muscle });
  const u = unit.value;
  const now = minuteNow.value;
  const r = recovery.value.find(x => x.muscle === muscle);
  const info = MUSCLE_BY_ID[muscle];
  if (!info || !r) { queueMicrotask(onClose); return null; }
  const levels = trainingLevels(s.sessions, s.customExercises, { trainingSince: s.profile.trainingSince, today: today.value })[muscle];
  const direct = [...s.customExercises, ...LIBRARY].filter(e => e.primary.includes(muscle));
  const logged = direct.map(e => ({ e, h: exerciseHistory(s.sessions, e.id, s.customExercises) })).filter(x => x.h.length).sort((a, b) => b.h[b.h.length - 1]!.day.localeCompare(a.h[a.h.length - 1]!.day));
  const loggedIds = new Set(logged.map(x => x.e.id));
  const tryNext = direct.filter(e => !loggedIds.has(e.id)).slice(0, 10);
  const [tab, setTab] = useState<MuscleTab>(() => (logged.length ? 'logged' : 'trynext'));
  const markFresh = () => { update(x => ({ ...x, freshMarks: [...x.freshMarks, { muscle, at: new Date().toISOString() }].slice(-100) })); onClose(); };

  const soreBlocked = !!r.soreToday && !r.hoursLeft;
  const pillTone = !r.lastTrainedAt ? undefined : soreBlocked || r.recovering ? 'warning' : 'positive';
  const pillText = !r.lastTrainedAt ? 'Not trained yet' : soreBlocked ? 'Held back by soreness' : r.recovering ? 'Recovering' : 'Ready';
  const fillTone = r.recovering ? (r.pct < 40 ? 'negative' : 'warning') : 'positive';
  // BUG-17: past the 120 h window cap there is no clock time, but it is not soreness either.
  const readyText = !r.recovering ? 'Now' : r.readyInHours ? (readyDayWindow(now, r.readyInHours) ?? 'Now') : r.beyondCap ? BEYOND_CAP_TEXT : 'When soreness eases';
  const fullText = muscleFullText(now, r);
  const active = s.active;

  return (
    <Sheet title={info.label} onClose={onClose} palace="body.muscle">
      <div class="stack">
        <div class="mtl-head">
          <div class="mtl-pct-row"><span class="mtl-pct">{r.lastTrainedAt ? `${r.pct}%` : '—'}</span><span class="mtl-pct-label">recovered</span></div>
          <Chip tone={pillTone}>{pillText}</Chip>
        </div>

        {r.lastTrainedAt && (
          <div class="mtl-timeline">
            <div class="mtl-track"><i class="mtl-fill" style={{ width: `${r.pct}%`, background: `var(--${fillTone})` }} /><span class="mtl-tick" style={{ left: `${READY_PCT}%` }} /></div>
            <div class="mtl-tl-row">
              <div class="mtl-tl-col"><span class="mtl-tl-key">Trained</span><span class="mtl-tl-val">{formatDay(r.lastDay!, { weekday: 'short', day: 'numeric' })}</span></div>
              <div class="mtl-tl-col"><span class="mtl-tl-key">Ready</span><span class="mtl-tl-val">{readyText}</span></div>
              <div class="mtl-tl-col"><span class="mtl-tl-key">Full</span><span class="mtl-tl-val">{fullText}</span></div>
            </div>
          </div>
        )}

        <div class="list">
          {logged.length > 0 && (() => {
            const last = logged[0]!.h[logged[0]!.h.length - 1]!;
            return <Row trailing={<span class="small">{logged[0]!.e.name} · {last.sets.length} {last.sets.length === 1 ? 'set' : 'sets'}</span>}><span class="small muted">Last session</span></Row>;
          })()}
          <Row trailing={<span class="small">{levels.level}</span>}><span class="small muted">Level</span></Row>
          <Row trailing={<span class="small">{DATA_LABEL[r.confidence]}{r.personalized ? ' · fitted to you' : ''}</span>}><span class="small muted">Data</span></Row>
        </div>
        {r.drivers.length > 0 && <p class="hint">{r.drivers.map(d => d.text).join(' · ')}</p>}

        <div class="mtl-actions">
          {r.recovering && (
            <div class="stack-sm">
              <Button variant="quiet" size="sm" onClick={markFresh}>Mark as fresh</Button>
            </div>
          )}
          <AskAbout refTo={{ kind: 'muscle', id: muscle, label: info.label }} label="Ask Escobar" class="btn-sm" />
        </div>

        <div data-palace="body.muscle-tabs">
          <Segmented value={tab} onChange={setTab} options={[{ value: 'logged', label: `Logged · ${logged.length}` }, { value: 'trynext', label: `Try next · ${tryNext.length}` }]} />
        </div>

        {tab === 'logged' ? (
          !logged.length ? <p class="small muted">Nothing logged for this muscle yet.</p> : (
            <div class="list mtl-tab-list">{logged.slice(0, 6).map(({ e, h }) => {
              const last = h[h.length - 1]!;
              return (
                <Row key={e.id} trailing={<span class="hint">{formatDay(last.day, { weekday: 'short', day: 'numeric' })}</span>}>
                  <div class="small">{e.name}</div>
                  <div class="hint">Best {bestEverHint(h, e.mode, u)} · {h.length} {h.length === 1 ? 'session' : 'sessions'}</div>
                </Row>
              );
            })}</div>
          )
        ) : (
          !tryNext.length ? <p class="small muted">You already do every listed exercise for this muscle.</p> : (
            <div class="list mtl-tab-list">{tryNext.map(e => {
              const inWorkout = !!active?.entries.some(en => en.exerciseId === e.id);
              return (
                <Row key={e.id} trailing={active ? (inWorkout ? <span class="hint">In workout</span> : <Button size="sm" onClick={() => { addExerciseToSession(e); showToast(`Added ${e.name} to today's workout`); }}>Add</Button>) : undefined}>
                  <div class="small">{e.name}</div>
                  <div class="small muted">{e.equipment}</div>
                </Row>
              );
            })}</div>
          )
        )}
      </div>
    </Sheet>
  );
}

function BodyFat() {
  const s = state.value;
  const [open, setOpen] = useState(false);
  const [sex, setSex] = useState<'male' | 'female'>(s.profile.sex ?? 'male');
  // RG-09: tape measurements in cm or inches (inches by default for lb users); stored in cm.
  const [len, setLen] = useState<'cm' | 'in'>(s.preferences.weightUnit === 'lb' ? 'in' : 'cm');
  const toShown = (cm: number | undefined) => (cm == null ? '' : String(len === 'in' ? Math.round((cm / 2.54) * 10) / 10 : cm));
  const [height, setHeight] = useState(toShown(s.profile.heightCm));
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const cm = (v: string) => { const n = parseFloat(v.replace(',', '.')); return Number.isFinite(n) ? (len === 'in' ? n * 2.54 : n) : NaN; };
  const switchLen = (next: 'cm' | 'in') => {
    if (next === len) return;
    const conv = (v: string) => { const n = parseFloat(v.replace(',', '.')); return Number.isFinite(n) ? String(Math.round((next === 'in' ? n / 2.54 : n * 2.54) * 10) / 10) : v; };
    setHeight(conv(height)); setNeck(conv(neck)); setWaist(conv(waist)); setHip(conv(hip)); setLen(next);
  };
  const last = s.body[s.body.length - 1];
  const result = navyBodyFat({ sex, heightCm: cm(height), neckCm: cm(neck), waistCm: cm(waist), hipCm: cm(hip) || undefined });
  const save = () => {
    if (result == null) return;
    const r1 = (v: number) => Math.round(v * 10) / 10;
    update(x => ({ ...x, profile: { ...x.profile, sex, heightCm: Number.isFinite(cm(height)) ? r1(cm(height)) : x.profile.heightCm }, body: [...x.body, { day: today.value, neckCm: r1(cm(neck)), waistCm: r1(cm(waist)), hipCm: Number.isFinite(cm(hip)) ? r1(cm(hip)) : undefined, bodyFatPct: result, formula: 'navy-cm' }] }));
    setOpen(false);
  };
  return (
    <Section title="Body fat estimate" palace="body.bodyfat" aside={<Button variant="quiet" size="sm" onClick={() => setOpen(true)}>{last ? 'New reading' : 'Measure'}</Button>}>
      <Card>
        {last ? <div class="row-between"><Stat value={`${last.bodyFatPct}%`} label={`on ${formatDay(last.day)}`} />{s.body.length > 1 && <span class="small muted">{s.body.length} readings · first {s.body[0]!.bodyFatPct}%</span>}</div> : <p class="small muted">US Navy tape-measure estimate.</p>}
      </Card>
      {open && (
        <Sheet title="Body fat estimate" onClose={() => setOpen(false)}>
          <div class="stack">
            <Segmented value={sex} onChange={setSex} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
            <Segmented value={len} onChange={switchLen} options={[{ value: 'cm', label: 'cm' }, { value: 'in', label: 'in' }]} />
            <div class="grid-2">
              <Field label={`Height (${len})`}><input type="text" inputMode="decimal" value={height} onInput={e => setHeight((e.target as HTMLInputElement).value)} /></Field>
              <Field label={`Neck (${len})`}><input type="text" inputMode="decimal" value={neck} onInput={e => setNeck((e.target as HTMLInputElement).value)} /></Field>
              <Field label={`Waist (${len})`}><input type="text" inputMode="decimal" value={waist} onInput={e => setWaist((e.target as HTMLInputElement).value)} /></Field>
              {sex === 'female' && <Field label={`Hip (${len})`}><input type="text" inputMode="decimal" value={hip} onInput={e => setHip((e.target as HTMLInputElement).value)} /></Field>}
            </div>
            <Card class="card-quiet"><Stat value={result != null ? `${result}%` : '—'} label="estimated body fat" /></Card>
            <Button variant="primary" disabled={result == null} onClick={save}>Save reading</Button>
          </div>
        </Sheet>
      )}
    </Section>
  );
}
