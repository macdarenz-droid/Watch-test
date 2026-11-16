import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { AskAbout } from '@/escobar/ui/AskAbout';
import { state, update } from '@/core/store';
import { today, unit, bodyWeightAt, scheduledSplit } from '@/app/selectors';
import { Button, Card, Chip, Empty, Row, Section, Segmented, Sheet, Stat, WeightInput } from '@/ui/primitives';
import { IconBack, IconCalendar, IconChevron, IconPlay, IconShare, IconTrash, IconTrophy } from '@/ui/icons';
import { requestStart } from '@/slices/workout/Train';
import { ShareSheet } from '@/slices/share/lazy';
import { hasWorkingSets } from '@/brain/exposure';
import { formatClock, formatDay, monthCells, parseDay, dayKey } from '@/core/dates';
import { formatLoad, kgToDisplay } from '@/core/units';
import type { AppState, LoggedSet, ResistanceMode, Session } from '@/core/models';
import { rebuildRecoveryModel, sortByStart } from '@/slices/workout/session';
import { parseDurationSec, parseReps } from '@/core/parse';
import { hasEntry } from '@/brain/exposure';
import { allRecords, PR_LABEL } from '@/brain/prs';
import { exerciseHistory, modeOf } from '@/brain/history';
import { plannedThisWeek, weekSummary } from '@/brain/weekly';
import { volumeChartWeeks } from './volumeChart';
import { findExercise } from '@/core/exercises';
import { modeLoadText, lastTopStats, loadColumnLabel, loadAriaLabel, bodyweightShare, effectiveLoadKg, statHasReps, statLoadLabel, statReadout } from '@/brain/bodyweight';
import { EffortBars, effortSplit, effortUsesSets } from '@/ui/EffortBars';
import { progressHint, progressTrend, progressValue } from './progressTrend';
import { DATA_LABEL } from '@/brain/trend';
import { muscleLabel } from '@/data/muscles';
import { showToast } from '@/app/toast';
import { Sparkline } from '@/ui/Sparkline';
import { closePanel, go, historySeg, openPanel, showPanel } from '@/app/router';
import { deleteSeries, getSeries, storeSeries } from '@/core/heartStore';
import { usePalaceFocus } from '@/escobar/palace/focus';
import { haptic } from '@/native/haptics';
import { durFor, EASE, reduced, springEase } from '@/ui/motion';
import { EDGE_IGNORE_PX, FLING_PX_PER_MS, rubber, SWIPE_COMMIT_FRACTION, SWIPE_FLING_MIN_PX, SCRUB_HOLD_MS, track } from '@/ui/gesture';

/** Every session delete (a swipe or the editor's own Delete) goes through this, so both get the
 * same Undo (restores the exact session, its heart series included). */
function withSessions(s: AppState, sessions: Session[]): AppState {
  return { ...s, sessions, recoveryModel: rebuildRecoveryModel({ ...s, sessions }) };
}
function deleteSessionWithUndo(session: Session): void {
  const series = getSeries(session.id);
  update(s => withSessions(s, s.sessions.filter(x => x.id !== session.id)));
  deleteSeries(session.id);
  showToast('Session deleted', 'Undo', () => {
    update(s => withSessions(s, sortByStart([...s.sessions, session])));
    if (series.length) storeSeries(session.id, series);
  });
}

export function History() {
  const panel = openPanel.value;
  const seg = panel?.id === 'exercise-stats' ? 'stats' : historySeg.value;
  const setSeg = (v: 'log' | 'stats') => { historySeg.value = v; if (panel?.id === 'exercise-stats') closePanel('exercise-stats'); };
  const [sharing, setSharing] = useState(false);
  return (
    <div class="view">
      <div class="topbar">
        <div><div class="eyebrow">History</div><h1>{seg === 'log' ? 'Sessions' : 'Stats'}</h1></div>
        {seg === 'stats' && state.value.sessions.some(hasWorkingSets) && <Button variant="quiet" class="btn-icon" aria-label="Share your stats" data-palace="history.share" onClick={() => setSharing(true)}><IconShare size={20} /></Button>}
      </div>
      {sharing && <ShareSheet initial="week" onClose={() => setSharing(false)} />}
      <Segmented value={seg} onChange={setSeg} options={[{ value: 'log', label: 'Log' }, { value: 'stats', label: 'Stats' }]} />
      {seg === 'log' ? <Log /> : <Stats />}
    </div>
  );
}

function Log() {
  const s = state.value;
  const split = scheduledSplit.value;
  const [month, setMonth] = useState(() => today.value.slice(0, 7));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const setEditing = (x: Session) => showPanel('session', { sessionId: x.id });
  usePalaceFocus('history.calendar', selectedDay ? { day: selectedDay } : undefined);
  const trained = useMemo(() => new Set(s.sessions.map(x => x.day)), [s.sessions]);
  // BUG-10: a fixed 42 cells (6 rows) so the calendar's height never changes paging between a
  // 4/5/6-row month, which used to shove "Recent" up and down.
  const cells = useMemo(() => monthCells(month), [month]);
  const first = parseDay(`${month}-01`);
  const shift = (n: number) => { const d = parseDay(`${month}-01`); d.setMonth(d.getMonth() + n); setMonth(dayKey(d).slice(0, 7)); };
  const recent = [...s.sessions].reverse().slice(0, 30);
  const daySessions = selectedDay ? s.sessions.filter(x => x.day === selectedDay) : [];

  // A5: swipe the calendar grid sideways to page months, the same axis lock and edge-ignore as
  // every other horizontal gesture. Swiping forward past the current month only rubber-bands —
  // there is nothing to see there — the prev/next buttons are unaffected either way.
  const calRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = calRef.current;
    if (!el) return undefined;
    let width = el.getBoundingClientRect().width || 1;
    const atLatest = month >= today.value.slice(0, 7);
    const springBack = () => {
      if (reduced() || !el.animate) { el.style.transform = ''; return; }
      const anim = el.animate([{ transform: el.style.transform || 'none' }, { transform: 'none' }], { duration: durFor('spring'), easing: springEase() });
      anim.finished.then(() => { el.style.transform = ''; }).catch(() => { el.style.transform = ''; });
    };
    const untrack = track(el, {
      axis: 'x',
      canStart: e => e.clientX > EDGE_IGNORE_PX && e.clientX < window.innerWidth - EDGE_IGNORE_PX,
      onStart: () => { width = el.getBoundingClientRect().width || 1; },
      onMove: d => {
        if (reduced()) return;
        if (d < 0 && atLatest) { el.style.transform = `translateX(${-rubber(-d)}px)`; return; }
        el.style.transform = `translateX(${Math.sign(d) * Math.min(Math.abs(d), width)}px)`;
      },
      onEnd: (d, v) => {
        const blocked = d < 0 && atLatest;
        const commit = !blocked && (Math.abs(d) >= 0.3 * width || Math.abs(v) >= FLING_PX_PER_MS);
        if (!commit) { springBack(); return; }
        const dir = d < 0 ? 1 : -1;
        void haptic.tick();
        if (reduced() || !el.animate) { el.style.transform = ''; shift(dir); return; }
        const out = el.animate([{ transform: el.style.transform || 'none', opacity: 1 }, { transform: `translateX(${-dir * width}px)`, opacity: 0 }], { duration: durFor('sheetExit'), easing: EASE.exit, fill: 'forwards' });
        const afterOut = () => {
          // BUG-9: `out` fills forwards, so it must be cancelled or it keeps the grid invisible and
          // one width off to the side after the next month's enter animation ends.
          out.cancel();
          shift(dir);
          el.style.transform = `translateX(${dir * width * 0.3}px)`;
          el.style.opacity = '0';
          requestAnimationFrame(() => {
            const inAnim = el.animate([{ transform: `translateX(${dir * width * 0.3}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: durFor('enter'), easing: EASE.enter });
            inAnim.finished.then(() => { el.style.transform = ''; el.style.opacity = ''; }).catch(() => { el.style.transform = ''; el.style.opacity = ''; });
          });
        };
        out.finished.then(afterOut).catch(afterOut);
      },
      onCancel: springBack,
    });
    return untrack;
  }, [month]);

  return (
    <div class="stack" style={{ marginTop: 14 }}>
      <Card class="cal-card" data-palace="history.calendar">
        <div class="row-between" style={{ marginBottom: 8 }}>
          <Button variant="quiet" class="btn-icon" aria-label="Previous month" onClick={() => shift(-1)}><IconBack /></Button>
          <b>{first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b>
          <Button variant="quiet" class="btn-icon" aria-label="Next month" onClick={() => shift(1)}><IconChevron /></Button>
        </div>
        <div class="cal" ref={calRef}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} class="dow">{d}</div>)}
          {cells.map(c => <button type="button" key={c.key} class={`day ${c.other ? 'other' : ''} ${trained.has(c.key) ? 'trained' : ''} ${c.key === today.value ? 'today' : ''} ${c.key === selectedDay ? 'selected' : ''}`} onClick={() => setSelectedDay(c.key === selectedDay ? null : c.key)}>{parseInt(c.key.slice(8))}</button>)}
        </div>
      </Card>

      {selectedDay && (
        <Section title={formatDay(selectedDay, { weekday: 'long', day: 'numeric', month: 'long' })}>
          {daySessions.length ? daySessions.map(x => <SessionCard key={x.id} session={x} onEdit={() => setEditing(x)} />) : <Card class="card-quiet"><p class="small muted">No session this day.</p></Card>}
        </Section>
      )}

      <Section title="Recent" palace="history.recent">
        {!recent.length && (
          <Empty
            align="start"
            icon={<IconCalendar size={24} />}
            title="No sessions"
            action={split
              ? <Button variant="primary" onClick={() => { requestStart(split); go('train'); }}><IconPlay /> Start {split.name}</Button>
              : <Button variant="primary" onClick={() => go('train')}>Go to Train</Button>}
          />
        )}
        <div class="stack-sm">{recent.map(x => <SessionCard key={x.id} session={x} onEdit={() => setEditing(x)} />)}</div>
      </Section>
    </div>
  );
}

function SessionCard({ session, onEdit }: { session: Session; onEdit: () => void }) {
  const u = unit.value;
  const sets = session.exercises.reduce((a, e) => a + e.sets.length, 0);
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  // UI-02: the gesture effect below only re-runs on [session.id], so a swipe commit must read the
  // latest edited session through this ref, not the `session` prop it closed over when it mounted.
  const sessionRef = useRef(session);
  sessionRef.current = session;
  // A5: swipe the row left to reveal a delete zone; past halfway (or a fast flick) it commits with
  // the same Undo as the editor's own Delete. Reuses gesture.ts's shared `track()` (A3).
  useEffect(() => {
    const el = rowRef.current;
    const card = el?.querySelector<HTMLElement>('.card') ?? null;
    const icon = el?.querySelector<HTMLElement>('.swipe-bg svg') ?? null;
    if (!el || !card) return undefined;
    let width = el.getBoundingClientRect().width || 1;
    let armed = false;
    const setArmed = (on: boolean) => {
      if (armed === on) return;
      armed = on;
      void haptic.threshold(on);
      el.classList.toggle('armed', on);
      if (on && icon) { icon.style.opacity = ''; icon.style.scale = ''; }
    };
    const springBack = () => {
      setArmed(false);
      if (reduced() || !card.animate) { card.style.transform = ''; return; }
      const anim = card.animate([{ transform: card.style.transform || 'none' }, { transform: 'none' }], { duration: durFor('spring'), easing: springEase() });
      anim.finished.then(() => { card.style.transform = ''; }).catch(() => { card.style.transform = ''; });
    };
    const untrack = track(el, {
      axis: 'x',
      canStart: e => e.clientX > EDGE_IGNORE_PX && e.clientX < window.innerWidth - EDGE_IGNORE_PX,
      onStart: () => { width = el.getBoundingClientRect().width || 1; draggedRef.current = false; },
      onMove: d => {
        draggedRef.current = true;
        const armedNow = d < 0 && Math.abs(d) >= SWIPE_COMMIT_FRACTION * width;
        if (!reduced()) {
          const x = d < 0 ? Math.max(d, -width) : rubber(d);
          card.style.transform = `translateX(${x}px)`;
          if (!armedNow && icon) {
            const reveal = Math.min(1, Math.max(0, -d) / 72);
            icon.style.opacity = String(reveal);
            icon.style.scale = String(0.6 + 0.4 * reveal);
          }
        }
        setArmed(armedNow);
      },
      onEnd: (d, v) => {
        const armedNow = d < 0 && Math.abs(d) >= SWIPE_COMMIT_FRACTION * width;
        const flung = !reduced() && d < 0 && v <= -FLING_PX_PER_MS && Math.abs(d) >= SWIPE_FLING_MIN_PX;
        if (!(armedNow || flung)) { springBack(); return; }
        setArmed(false);
        if (reduced() || !card.animate) { deleteSessionWithUndo(sessionRef.current); return; }
        const anim = card.animate([{ transform: card.style.transform || 'none', opacity: 1 }, { transform: `translateX(-${width}px)`, opacity: 0 }], { duration: durFor('sheetExit'), easing: EASE.exit, fill: 'forwards' });
        anim.finished.then(() => deleteSessionWithUndo(sessionRef.current)).catch(() => deleteSessionWithUndo(sessionRef.current));
      },
      onCancel: springBack,
    });
    return untrack;
  }, [session.id]);
  return (
    <div class="swipe-row" ref={rowRef}>
      <div class="swipe-bg" aria-hidden="true"><IconTrash size={20} /></div>
      <Card class="card-press" onClick={() => { if (draggedRef.current) { draggedRef.current = false; return; } setOpen(o => !o); }}>
        <div class="row-between">
          <div class="grow">
            <b>{session.splitName}</b>
            <div class="hint">{formatDay(session.day)} · {session.exercises.length} exercise{session.exercises.length === 1 ? '' : 's'} · {sets} set{sets === 1 ? '' : 's'}{session.durationSec ? ` · ${formatClock(session.durationSec)}` : ''}</div>
            {session.heart && <div class="hint">avg {session.heart.avgBpm} bpm · max {session.heart.maxBpm}{session.heart.energy ? ` · ~${session.heart.energy.activeKcal} kcal` : ''}</div>}
          </div>
          {hasWorkingSets(session) && <Button variant="quiet" size="sm" class="btn-icon" aria-label={`Share ${session.splitName}`} data-palace="history.session-share" onClick={e => { e.stopPropagation(); setSharing(true); }}><IconShare size={20} /></Button>}
          <Button variant="quiet" size="sm" onClick={e => { e.stopPropagation(); onEdit(); }}>Edit</Button>
        </div>
        {open && (
          <div class="list" style={{ marginTop: 8 }}>
            {session.note && <p class="small" data-palace="history.session-note">{session.note}</p>}
            {session.exercises.map((e, i) => (
              <Row key={i}>
                <div class="small">{e.name}</div>
                <div class="hint">{e.sets.map((st, i) => <span key={i}>{i ? ' · ' : ''}{st.kind ? <span class="muted">{KIND_TAG[st.kind]} </span> : null}{setLabel(st, u, modeOf(e.exerciseId, state.value.customExercises))}<UnitTag st={st} u={u} /></span>)}</div>
                {e.note && <div class="hint">Note: {e.note}</div>}
                {state.value.exerciseNotes[e.exerciseId] && <div class="hint muted">Setup: {state.value.exerciseNotes[e.exerciseId]}</div>}
              </Row>
            ))}
          </div>
        )}
      </Card>
      {/* Outside the card, so taps inside the sheet don't open or close it. */}
      {sharing && <ShareSheet initial="workout" session={session} onClose={() => setSharing(false)} />}
    </div>
  );
}

/** UI-04: a carry/sled set shows distance, time and load together (any missing part left out), not just its time. */
export function setLabel(st: LoggedSet, u: 'kg' | 'lb', mode: ResistanceMode): string {
  if (mode === 'conditioning' && (st.distanceM || st.durationSec)) {
    const parts = [st.distanceM ? `${st.distanceM} m` : null, st.durationSec ? `${st.durationSec}s` : null].filter(Boolean);
    return st.kg ? `${parts.join(' · ')} @ ${formatLoad(st.kg, u)}` : parts.join(' · ');
  }
  if (st.durationSec) return `${st.durationSec}s`;
  const load = mode === 'bodyweight' || mode === 'assisted' ? modeLoadText({ kg: st.kg }, mode, u) : st.kg ? formatLoad(st.kg, u) : 'bw';
  return `${load} × ${st.reps ?? 0}${st.effort ? ` ${st.effort[0]!.toUpperCase()}` : ''}`;
}

/** A tiny tag on sets typed in the other unit (§25.2 point 2). */
export function UnitTag({ st, u }: { st: LoggedSet; u: 'kg' | 'lb' }) {
  return st.entered && st.entered.unit !== u ? <span class="unit-tag" title={`Logged as ${st.entered.value} ${st.entered.unit}`}>{st.entered.unit}</span> : null;
}

/** One session, editable; opened as the `session` panel. */
export function SessionEditor({ session, onClose }: { session: Session; onClose: () => void }) {
  const u = unit.value;
  usePalaceFocus('history.session', { sessionId: session.id });
  const [draft, setDraft] = useState<Session>(() => JSON.parse(JSON.stringify(session)));
  const [confirm, setConfirm] = useState(false);
  const setField = (ei: number, si: number, patch: Partial<LoggedSet>) => setDraft(d => ({ ...d, exercises: d.exercises.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.map((s, j) => (j !== si ? s : { ...s, ...patch })) })) }));
  // UI-04: a carry/sled set has no "zero it out" field that implies delete (distance and time can
  // stand alone with reps at 0), so it gets the same explicit removal the rest of the editor uses.
  const removeDraftSet = (ei: number, si: number) => setDraft(d => ({ ...d, exercises: d.exercises.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.filter((_, j) => j !== si) })) }));
  const save = () => {
    const cleaned = { ...draft, exercises: draft.exercises.map(e => ({ ...e, sets: e.sets.filter(hasEntry) })).filter(e => e.sets.length) };
    // An edit that leaves no sets is a delete, with its Undo (UI-24).
    if (!cleaned.exercises.length) { remove(); return; }
    // Every history edit relearns the recovery model from what is left (UI-12).
    update(s => withSessions(s, s.sessions.map(x => (x.id === session.id ? cleaned : x))));
    showToast('Session updated'); onClose();
  };
  function remove() {
    deleteSessionWithUndo(session);
    onClose();
  }
  return (
    <Sheet title={`${session.splitName} · ${formatDay(session.day)}`} onClose={onClose} palace="history.session">
      <div class="stack">
        {draft.exercises.map((e, ei) => {
          const mode = modeOf(e.exerciseId, state.value.customExercises);
          const isHold = mode === 'duration';
          return (
            <Card key={ei} class="card-quiet">
              <b class="small">{e.name}</b>
              <div class="stack-sm" style={{ marginTop: 8 }}>
                {e.sets.map((st, si) => (
                  <div key={si}>
                    <div class="set-grid">
                      <span class="set-index">{si + 1}</span>
                      {isHold ? <input type="number" aria-label="Seconds" value={st.durationSec ?? ''} onInput={ev => setField(ei, si, { durationSec: parseDurationSec((ev.target as HTMLInputElement).value) ?? 0 })} /> : <WeightInput kg={st.kg} entered={st.entered} entryUnit={st.entered?.unit ?? u} displayUnit={u} placeholder={loadColumnLabel(mode, st.entered?.unit ?? u)} ariaLabel={loadAriaLabel(mode, st.entered?.unit ?? u)} onChange={v => setField(ei, si, v ? { kg: v.kg, entered: v.entered } : { kg: undefined, entered: undefined })} onUnitFlip={() => setField(ei, si, st.kg != null ? { entered: { value: kgToDisplay(st.kg, (st.entered?.unit ?? u) === 'kg' ? 'lb' : 'kg'), unit: (st.entered?.unit ?? u) === 'kg' ? 'lb' : 'kg' } } : {})} />}
                      {isHold ? <span class="hint">seconds</span> : <input type="number" aria-label="Reps" value={st.reps ?? ''} placeholder="reps" onInput={ev => setField(ei, si, { reps: parseReps((ev.target as HTMLInputElement).value) ?? 0 })} />}
                      <select aria-label="Effort" value={st.effort ?? ''} onChange={ev => setField(ei, si, { effort: ((ev.target as HTMLSelectElement).value || undefined) as LoggedSet['effort'] })}><option value="">—</option><option value="easy">Easy</option><option value="ideal">Ideal</option><option value="max">Max</option></select>
                    </div>
                    {mode === 'conditioning' && (
                      // UI-04: a carry/sled set edits its distance and time next to its load, matching Train's live entry (UI-20).
                      <div class="row conditioning-extra" style={{ gap: 8, marginTop: 4 }}>
                        <input type="number" aria-label="Distance in metres" placeholder="m" value={st.distanceM ?? ''} onInput={ev => { const v = Number((ev.target as HTMLInputElement).value); setField(ei, si, { distanceM: v >= 1 && v <= 1000 ? Math.round(v) : undefined }); }} />
                        <input type="number" aria-label="Seconds" placeholder="s" value={st.durationSec ?? ''} onInput={ev => setField(ei, si, { durationSec: parseDurationSec((ev.target as HTMLInputElement).value) })} />
                        <Button variant="quiet" size="sm" class="btn-icon" aria-label={`Delete set ${si + 1}`} onClick={() => removeDraftSet(ei, si)}><IconTrash size={16} /></Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
        <p class="hint">Sets with 0 reps are removed on save.</p>
        <Button variant="primary" onClick={save}>Save changes</Button>
        {!confirm ? <Button variant="danger" onClick={() => setConfirm(true)}><IconTrash size={16} /> Delete session</Button> : <div class="row"><Button variant="quiet" onClick={() => setConfirm(false)}>Keep</Button><Button variant="danger" class="grow" onClick={remove}>Yes, delete</Button></div>}
      </div>
    </Sheet>
  );
}

/* ---------- Stats ---------- */

const KIND_TAG = { warmup: 'W', drop: 'D', failure: 'F' } as const;

/**
 * QA14-1: the readout above a scrubbed chart crossfades from the scrubbed value back to the
 * latest one on release, instead of snapping in one frame. Two spans (old fading out, current
 * fading in) toggle their opacity a frame after mount (the QA5-17 double-rAF idiom, so the browser
 * paints the starting opacity before the transition-triggering class lands). `reduced()` collapses
 * the fade to 0ms via an inline duration, so the swap is instant without a second code path.
 */
function ChartReadout({ text }: { text: string }) {
  const [old, setOld] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const curRef = useRef(text);
  useEffect(() => {
    if (curRef.current === text) return undefined;
    const prev = curRef.current;
    curRef.current = text;
    setOld(prev);
    setLeaving(false);
    const ms = reduced() ? 0 : durFor('fast');
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setLeaving(true)));
    const t = setTimeout(() => { setOld(null); setLeaving(false); }, ms);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [text]);
  const ms = reduced() ? 0 : durFor('fast');
  return (
    <div class="chart-readout">
      {old != null && <span class={`num readout-old${leaving ? ' leaving' : ''}`} style={{ transitionDuration: `${ms}ms` }} aria-hidden="true">{old}</span>}
      <span class={`num readout-cur${old != null && !leaving ? ' entering' : ''}`} style={{ transitionDuration: `${ms}ms` }}>{text}</span>
    </div>
  );
}

/** F8: 12 weeks of training volume as bars, in the display unit. */
function WeeklyVolumeChart({ u }: { u: 'kg' | 'lb' }) {
  const s = state.value;
  const bw = bodyWeightAt.value;
  const weeks = useMemo(() => volumeChartWeeks(s.sessions, today.value, s.customExercises, u, 12, bw), [s.sessions, s.customExercises, today.value, u, bw]);
  const values = weeks.map(w => w.value);
  const max = Math.max(1, ...values);
  const [volScrub, setVolScrub] = useState<number | null>(null);
  const idxRef = useRef<number | null>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const updateVolIndex = (i: number | null) => {
    if (i === idxRef.current) return;
    idxRef.current = i;
    setVolScrub(i);
    if (i !== null) haptic.tick();
  };
  // A6: nearest bar column by x (accounts for the row's own gaps), same drag/hold start rule as the sparkline.
  useEffect(() => {
    const el = barsRef.current;
    if (!el || weeks.length < 2) return undefined;
    const nearestIndex = (clientX: number): number => {
      const cols = [...el.querySelectorAll<HTMLElement>('.volume-bar-col')];
      let best = 0, bestDist = Infinity;
      cols.forEach((c, i) => { const r = c.getBoundingClientRect(); const dist = Math.abs(r.left + r.width / 2 - clientX); if (dist < bestDist) { bestDist = dist; best = i; } });
      return best;
    };
    let startX = 0;
    let holdTimer: number | null = null;
    let dragging = false;
    const clearHold = () => { if (holdTimer != null) { window.clearTimeout(holdTimer); holdTimer = null; } };
    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      clearHold();
      holdTimer = window.setTimeout(() => { dragging = true; updateVolIndex(nearestIndex(startX)); }, SCRUB_HOLD_MS);
    };
    const end = () => { clearHold(); if (dragging) { dragging = false; updateVolIndex(null); } };
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    const untrack = track(el, {
      axis: 'x', capture: 'afterSlop',
      onMove: d => { clearHold(); dragging = true; updateVolIndex(nearestIndex(startX + d)); },
      onEnd: end,
      onCancel: end,
    });
    return () => {
      clearHold();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointercancel', end);
      untrack();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeks.length]);
  if (!values.some(v => v > 0)) return null;
  const fmt = (v: number) => (v >= 10_000 ? `${Math.round(v / 100) / 10}k` : String(Math.round(v)));
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const volIdx = volScrub ?? weeks.length - 1;
  const readout = `${fmt(values[volIdx]!)} ${u} · wk of ${formatDay(weeks[volIdx]!.week, { day: 'numeric', month: 'short' })}`;
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); updateVolIndex(Math.max(0, volIdx - 1)); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); updateVolIndex(Math.min(weeks.length - 1, volIdx + 1)); }
    else if (e.key === 'Escape') updateVolIndex(null);
  };
  return (
    <Card data-palace="history.weekly-volume">
      <div class="row-between"><div class="eyebrow">Weekly volume</div><span class="hint">{fmt(values[values.length - 1] ?? 0)} {u} this week</span></div>
      {/* A6: the readout tracks a finger-drag or keyboard scrub; at rest it shows the latest week. */}
      <ChartReadout text={readout} />
      {/* I12: no title attrs (touch never shows a tooltip); the current week is accent with its value above it. */}
      <div class="volume-bars" ref={barsRef} tabIndex={0} role="slider" aria-valuemin={0} aria-valuemax={weeks.length - 1} aria-valuenow={volIdx} aria-valuetext={readout} onKeyDown={onKeyDown}>
        <div class="volume-avg" style={{ bottom: `calc((100% - var(--volume-label-room, 0px)) * ${Math.min(1, avg / max)})` }}><span class="num">avg {fmt(avg)}</span></div>
        {weeks.map((w, i) => {
          const isCurrent = i === weeks.length - 1;
          return (
            <div key={w.week} class="volume-bar-col">
              {/* QA13-3: the label sits inside the bar (absolutely, above it) so it never eats into the bar's own height. */}
              <i class={isCurrent ? 'current' : ''} style={{ height: `${Math.max(2, (values[i]! / max) * 100)}%`, opacity: volScrub != null && i !== volScrub ? .45 : undefined }}>
                {isCurrent && <span class="volume-bar-value num">{fmt(values[i]!)}</span>}
              </i>
            </div>
          );
        })}
      </div>
      <div class="row-between hint"><span>{formatDay(weeks[0]!.week, { day: 'numeric', month: 'short' })}</span><span>{formatDay(weeks[weeks.length - 1]!.week, { day: 'numeric', month: 'short' })}</span></div>
    </Card>
  );
}

function Stats() {
  const s = state.value;
  const u = unit.value;
  const w = weekSummary(s.sessions, today.value, s.customExercises, plannedThisWeek(s.schedule, s.daysOff, today.value), bodyWeightAt.value);
  const records = useMemo(() => allRecords(s.sessions, s.customExercises, u).slice(0, 12), [s.sessions, u]);
  const exerciseIds = useMemo(() => { const m = new Map<string, string>(); for (const x of [...s.sessions].reverse()) for (const e of x.exercises) if (!m.has(e.exerciseId)) m.set(e.exerciseId, e.name); return [...m]; }, [s.sessions]);
  const panel = openPanel.value;
  const fromPanel = panel?.id === 'exercise-stats' ? panel.params?.exerciseId : undefined;
  const [picked, setExercise] = useState<string>(exerciseIds[0]?.[0] ?? '');
  const exercise = fromPanel && exerciseIds.some(([id]) => id === fromPanel) ? fromPanel : picked;
  usePalaceFocus(exercise ? 'history.exercise-stats' : 'history.week', exercise ? { exerciseId: exercise } : undefined);
  const hist = exercise ? exerciseHistory(s.sessions, exercise, s.customExercises) : [];
  const mode = modeOf(exercise, s.customExercises);
  const t = progressTrend(hist, mode);
  const lastTop = hist.length ? lastTopStats(hist[hist.length - 1]!, findExercise(exercise, s.customExercises), bodyWeightAt.value, u) : null;
  const muscleRows = (Object.entries(w.muscleSets) as Array<[string, number]>).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxSets = muscleRows[0]?.[1] ?? 1;
  // O4: the same last 12 sessions as the trend line, split into easy/right/max/unrated work.
  const hist12 = hist.slice(-12);
  const bwAt = (day: string, addedKg: number): number | null => {
    const bw = bodyWeightAt.value;
    return bw ? effectiveLoadKg(addedKg, mode, bodyweightShare(findExercise(exercise, s.customExercises)), bw(day)) : null;
  };
  const effortKg = effortSplit(hist12, mode, bwAt);
  const effortInSets = effortUsesSets(hist12, mode);
  const effortPoints = effortInSets ? effortKg : effortKg.map(p => ({ day: p.day, easy: kgToDisplay(p.easy, u), ideal: kgToDisplay(p.ideal, u), max: kgToDisplay(p.max, u), unrated: kgToDisplay(p.unrated, u) }));
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [sparkScrub, setSparkScrub] = useState<number | null>(null);
  useEffect(() => { setSelectedBar(null); setSparkScrub(null); }, [exercise]);
  // A6: the sparkline's readout shows the scrubbed session's actual top set, not just its plotted value.
  const sparkIdx = sparkScrub ?? hist12.length - 1;
  const sparkSession = hist12[sparkIdx];
  const sparkStats = sparkSession ? lastTopStats(sparkSession, findExercise(exercise, s.customExercises), bodyWeightAt.value, u) : null;
  const sparkReadout = sparkSession && sparkStats
    ? `${statReadout(sparkStats, mode, sparkSession.bestDistanceM, sparkSession.bestDurationSec, sparkSession.bestReps)} · ${formatDay(sparkSession.day, { day: 'numeric', month: 'short' })}`
    : '';

  return (
    <div class="stack" style={{ marginTop: 14 }}>
      <Card data-palace="history.week">
        <div class="eyebrow">Current week</div>
        <div class="grid-3" style={{ marginTop: 8 }}><Stat value={w.workouts} label="workouts" /><Stat value={w.sets} label="sets" /><Stat value={u === 'lb' ? `${Math.round(kgToDisplay(w.volumeKg, 'lb') / 100) / 10}k lb` : `${Math.round(w.volumeKg / 1000 * 10) / 10}t`} label="volume" /></div>
        {muscleRows.length > 0 && (
          <div class="stack-sm" style={{ marginTop: 14 }}>
            {muscleRows.map(([m, v]) => { const prev = (w.previousMuscleSets as Record<string, number>)[m] ?? 0; return (
              <div key={m}><div class="row-between small"><span>{muscleLabel(m)}</span><span class="muted num">{v} sets{prev ? <span class={v >= prev ? 'positive-text' : 'warning-text'}> {v >= prev ? '+' : ''}{Math.round((v - prev) * 10) / 10}</span> : null}</span></div><div class="bar"><i style={{ width: `${(v / maxSets) * 100}%` }} /></div></div>
            ); })}
          </div>
        )}
      </Card>

      <WeeklyVolumeChart u={u} />

      <Section title="Exercise progress" palace="history.exercise-stats" aside={exercise ? <AskAbout refTo={{ kind: 'exercise', id: exercise, label: `${exerciseIds.find(([id]) => id === exercise)?.[1] ?? 'Exercise'} trend` }} /> : undefined}>
        {!exerciseIds.length ? <Card class="card-quiet"><p class="small muted">No trends yet.</p></Card> : (
          <Card>
            <select value={exercise} onChange={e => { setExercise((e.target as HTMLSelectElement).value); if (fromPanel) closePanel('exercise-stats'); }}>{exerciseIds.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
            {hist.length >= 2 ? (
              <div class="stack-sm" style={{ marginTop: 12 }}>
                <ChartReadout text={sparkReadout} />
                <Sparkline points={hist12.map(h => progressValue(h, mode))} dates={hist12.map(h => h.day)} height={96} labels scrub onScrubIndex={setSparkScrub} />
                {(() => {
                  const lastHist = hist[hist.length - 1];
                  const lastDistance = lastHist?.bestDistanceM ?? 0, lastDuration = lastHist?.bestDurationSec ?? 0, lastReps = lastHist?.bestReps ?? 0;
                  const hasReps = statHasReps(mode, lastDistance, lastDuration, lastReps);
                  return (
                    <div class={hasReps ? 'grid-3' : 'grid-2'}>
                      <Stat value={lastTop!.load} label={statLoadLabel(mode, lastDistance, lastDuration, lastReps)} />
                      {hasReps && <Stat value={`${lastTop!.reps}`} label="reps at top" />}
                      <Stat value={t.direction === 'up' ? 'Improving' : t.direction === 'down' ? 'Slipping' : t.direction === 'flat' ? 'Steady' : 'Early'} label={`trend · ${DATA_LABEL[t.confidence].toLowerCase()}`} tone={t.direction === 'up' ? 'positive' : t.direction === 'down' ? 'warning' : undefined} />
                    </div>
                  );
                })()}
                <EffortBars points={effortPoints} unit={effortInSets ? 'sets' : u} selected={selectedBar} onSelect={i => setSelectedBar(sel => (sel === i ? null : i))} />
                {selectedBar != null && hist12[selectedBar] && (
                  <p class="hint">{formatDay(hist12[selectedBar]!.day)} · {hist12[selectedBar]!.sets.map((st, i) => <span key={i}>{i ? ' · ' : ''}{setLabel(st, u, mode)}<UnitTag st={st} u={u} /></span>)}</p>
                )}
                <div class="list">{[...hist].reverse().slice(0, 5).map(h => <Row key={h.sessionId} class="stat-hist-row" trailing={<span class="hint num">{h.sets.map((st, i) => <span key={i}>{i ? ' · ' : ''}<span style={{ whiteSpace: 'nowrap' }}>{setLabel(st, u, mode)}<UnitTag st={st} u={u} /></span></span>)}</span>}><span class="small">{formatDay(h.day)}</span></Row>)}</div>
                <p class="hint">{progressHint(mode)}</p>
              </div>
            ) : <p class="small muted" style={{ marginTop: 10 }}>One session so far.</p>}
          </Card>
        )}
      </Section>

      <Section title="Records" palace="history.records" aside={<Chip tone="positive"><IconTrophy size={16} /> {records.length}</Chip>}>
        <Card>
          {!records.length ? <p class="small muted">No records yet.</p> : (
            <div class="list">{records.map((r, i) => <Row key={i} trailing={<span class="hint">{formatDay(r.day)}</span>}><div class="small">{r.exerciseName}</div><div class="hint">{PR_LABEL[r.kind]} · {r.detail}</div></Row>)}</div>
          )}
        </Card>
      </Section>
    </div>
  );
}
