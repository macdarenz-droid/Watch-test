import { useEffect, useState } from 'preact/hooks';
import { signal } from '@preact/signals';
import { state } from '@/core/store';
import { nowMs, setTicking, today, unit } from '@/app/selectors';
import { Button, Card, Chip, Empty, Field, Row, Section, Sheet } from '@/ui/primitives';
import { IconCheck, IconChevronDown, IconDumbbell, IconEdit, IconMinus, IconMore, IconPause, IconPlay, IconPlus, IconTrash, IconTrophy } from '@/ui/icons';
import { formatClock } from '@/core/dates';
import { formatLoad, kgToDisplay, displayToKg } from '@/core/units';
import { findExercise } from '@/core/exercises';
import { MUSCLES, muscleLabel } from '@/data/muscles';
import type { Exercise, Split } from '@/core/models';
import { suggestNext, previousSet } from '@/brain/progression';
import { isLiveRecord } from '@/brain/prs';
import { sessionEmphasis } from '@/brain/exposure';
import { addExerciseToSession, addSet, active, adjustRest, stopRest, commitSet, discardSession, elapsedSec, finishSession, markDone, pauseSession, removeEntry, removeSet, resumeSession, setSet, skipEntry, startSession, type FinishSummary } from './session';
import { addExerciseToSplit, addTemplates, createSplit, deleteSplit, moveExercise, removeExerciseFromSplit, renameSplit, setFocus, setSplitSets, MAX_SPLITS } from './splits';
import { ExercisePicker } from './ExercisePicker';
import { showToast } from '@/app/toast';
import { MuscleMap } from '@/ui/MuscleMap';
import { GOALS } from '@/data/goals';
import { HeartRateCard } from '@/heart-rate/HeartRateCard';

const EFFORTS: Array<{ v: 'easy' | 'ideal' | 'max'; l: string; title: string }> = [
  { v: 'easy', l: 'E', title: 'Easy: 3 or more reps left' },
  { v: 'ideal', l: 'I', title: 'Ideal: 1 to 3 reps left' },
  { v: 'max', l: 'M', title: 'Max: nothing left' },
];

/** Shown once after a session is saved, then dismissed. */
const lastFinish = signal<FinishSummary | null>(null);

export function Train() {
  const s = state.value;
  const live = s.active;
  if (lastFinish.value) return <FinishScreen summary={lastFinish.value} onClose={() => { lastFinish.value = null; }} />;
  return live ? <LiveSession /> : <Splits />;
}

/* ---------- Split list and editor ---------- */

function Splits() {
  const s = state.value;
  const [selected, setSelected] = useState<string | null>(s.splits[0]?.id ?? null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const split = s.splits.find(x => x.id === selected) ?? s.splits[0];
  useEffect(() => { if (!split && s.splits[0]) setSelected(s.splits[0].id); }, [s.splits.length]);
  const u = unit.value;

  return (
    <div class="view">
      <div class="topbar">
        <div><div class="eyebrow">Train</div><h1>Workouts</h1></div>
        <Button variant="quiet" size="sm" onClick={() => setCreating(true)} disabled={s.splits.length >= MAX_SPLITS}><IconPlus size={16} /> Split</Button>
      </div>

      {!s.splits.length && (
        <Card>
          <Empty icon={<IconDumbbell size={32} />} title="No workouts yet" action={<div class="row"><Button variant="primary" onClick={() => { addTemplates(); }}>Use Push / Pull / Legs</Button><Button onClick={() => setCreating(true)}>Build my own</Button></div>}>
            Start from a simple template or build your own split.
          </Empty>
        </Card>
      )}

      {s.splits.length > 0 && (
        <div class="tabs-strip" role="tablist">
          {s.splits.map(sp => <button type="button" key={sp.id} role="tab" class="tab" aria-pressed={sp.id === split?.id} style={{ '--dot': sp.color }} onClick={() => setSelected(sp.id)}><i />{sp.name}</button>)}
        </div>
      )}

      {split && (
        <>
          <Card>
            <div class="row-between">
              <div>
                <h2>{split.name}</h2>
                <span class="hint">{split.exercises.length} exercises · {split.exercises.reduce((a, e) => a + e.sets, 0)} sets{split.focus.length ? ` · focus: ${split.focus.map(muscleLabel).join(', ')}` : ''}</span>
              </div>
              <Button variant="quiet" class="btn-icon" aria-label="Edit split" onClick={() => setEditing(true)}><IconEdit /></Button>
            </div>
            <div class="list" style={{ marginTop: 6 }}>
              {split.exercises.map(se => {
                const ex = findExercise(se.exerciseId, s.customExercises);
                const next = suggestNext(s.sessions, se.exerciseId, s.goal, today.value, se.sets, s.customExercises);
                return (
                  <Row key={se.exerciseId} trailing={<span class="hint num">{se.sets} sets</span>}>
                    <div class="ellipsis">{ex?.name ?? se.exerciseId}</div>
                    <div class="hint ellipsis">{next.kg != null && u === 'lb' ? next.target.replace(`${next.kg} kg`, formatLoad(next.kg, u)) : next.target} · {next.reason}</div>
                  </Row>
                );
              })}
              {!split.exercises.length && <p class="muted small" style={{ padding: '10px 0' }}>Empty split. Tap edit to add exercises.</p>}
            </div>
            <Button variant="primary" block style={{ marginTop: 12 }} disabled={!split.exercises.length} onClick={() => startSession(split)}><IconPlay /> Start {split.name}</Button>
          </Card>
          <p class="hint" style={{ marginTop: 10 }}>Targets come from your last sessions and your goal ({GOALS.find(g => g.id === s.goal)?.name}). Change the goal in Coach.</p>
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
    <Sheet title="Edit split" onClose={onClose}>
      <div class="stack">
        <Field label="Name"><input value={name} maxLength={28} onInput={e => setName((e.target as HTMLInputElement).value)} onBlur={() => renameSplit(split.id, name)} /></Field>
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
                  <Button variant="quiet" class="btn-icon" aria-label="Remove" onClick={() => removeExerciseFromSplit(split.id, se.exerciseId)}><IconTrash size={16} /></Button>
                </div>
              </div>
            );
          })}
        </div>
        <Button onClick={() => setPicking(true)}><IconPlus size={16} /> Add exercise</Button>
        <Field label="Focus muscles (optional, up to two)" hint="Tells the coach which muscles you want to bring up. It does not add exercises.">
          <div class="wrap">{MUSCLES.map(m => <Chip key={m.id} pressed={fresh.focus.includes(m.id)} onClick={() => setFocus(split.id, fresh.focus.includes(m.id) ? fresh.focus.filter(x => x !== m.id) : [...fresh.focus, m.id].slice(-2))}>{m.label}</Chip>)}</div>
        </Field>
        {!confirm ? <Button variant="danger" onClick={() => setConfirm(true)}>Delete split</Button>
          : <Card class="card-quiet"><p class="small">Delete {fresh.name}? Your history stays. Only the template goes.</p><div class="row" style={{ marginTop: 10 }}><Button variant="quiet" onClick={() => setConfirm(false)}>Keep</Button><Button variant="danger" onClick={() => { deleteSplit(split.id); onDeleted(); }}>Delete</Button></div></Card>}
      </div>
      {picking && <ExercisePicker exclude={fresh.exercises.map(e => e.exerciseId)} onClose={() => setPicking(false)} onPick={ex => { if (!addExerciseToSplit(split.id, ex)) showToast('Already in this split'); setPicking(false); }} />}
    </Sheet>
  );
}

/* ---------- Live session ---------- */

function LiveSession() {
  const s = state.value;
  const a = active()!;
  const split = s.splits.find(x => x.id === a.splitId);
  const [open, setOpen] = useState<number>(a.entries.findIndex(e => !e.done && !e.skipped));
  const [picking, setPicking] = useState(false);
  const [finishing, setFinishing] = useState(false);
  useEffect(() => { setTicking(true); return () => setTicking(false); }, []);
  const elapsed = elapsedSec(a, nowMs.value);
  const remaining = a.entries.filter(e => !e.done && !e.skipped);
  const done = a.entries.filter(e => e.done).length;

  return (
    <div class="view">
      <div class="topbar">
        <div><div class="eyebrow">{a.pausedAt ? 'Paused' : 'Live'}</div><h1 class="num">{formatClock(elapsed)}</h1><span class="hint">{split?.name ?? 'Workout'} · {done}/{a.entries.length} done</span></div>
        <div class="row">
          <Button variant="quiet" class="btn-icon" aria-label={a.pausedAt ? 'Resume' : 'Pause'} onClick={() => (a.pausedAt ? resumeSession() : pauseSession())}>{a.pausedAt ? <IconPlay /> : <IconPause />}</Button>
          <Button variant="solid" size="sm" onClick={() => setFinishing(true)}>Finish</Button>
        </div>
      </div>

      <HeartRateCard />

      <div class="stack">
        {a.entries.map((entry, i) => <EntryCard key={`${entry.exerciseId}-${i}`} index={i} entry={entry} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} onDone={() => { markDone(i); const next = a.entries.findIndex((e, j) => j !== i && !e.done && !e.skipped); setOpen(next); }} />)}
        <Button onClick={() => setPicking(true)}><IconPlus size={16} /> Add exercise to this session</Button>
      </div>

      {picking && <ExercisePicker exclude={a.entries.map(e => e.exerciseId)} onClose={() => setPicking(false)} onPick={ex => { addExerciseToSession(ex); setPicking(false); }} />}
      {finishing && (
        <Sheet title={remaining.length ? 'Exercises remaining' : 'Finish session?'} onClose={() => setFinishing(false)}>
          <div class="stack">
            {remaining.length > 0 && <p class="small muted">{remaining.length} exercise{remaining.length > 1 ? 's' : ''} not marked done. Anything with logged sets is still saved. Skipping does not remove them from your split.</p>}
            <div class="grid-3">
              <div class="stat"><b class="num">{formatClock(elapsed)}</b><span>duration</span></div>
              <div class="stat"><b>{a.entries.filter(e => e.sets.some(x => (x.reps ?? 0) > 0 || (x.durationSec ?? 0) > 0)).length}</b><span>exercises</span></div>
              <div class="stat"><b>{a.entries.reduce((n, e) => n + e.sets.filter(x => (x.reps ?? 0) > 0 || (x.durationSec ?? 0) > 0).length, 0)}</b><span>sets</span></div>
            </div>
            <FinishChoice onFinish={saveTemplate => { const r = finishSession(saveTemplate); setFinishing(false); if (r) lastFinish.value = r; }} changed={!!split && split.exercises.map(e => e.exerciseId).join('|') !== a.entries.filter(e => !e.skipped).map(e => e.exerciseId).join('|')} />
            <Button variant="quiet" onClick={() => setFinishing(false)}>Keep going</Button>
            <Button variant="danger" size="sm" onClick={() => { if (confirm('Discard this session? Nothing will be saved.')) { discardSession(); setFinishing(false); } }}>Discard session</Button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function FinishChoice({ changed, onFinish }: { changed: boolean; onFinish: (saveTemplate: boolean) => void }) {
  if (!changed) return <Button variant="primary" onClick={() => onFinish(false)}><IconCheck /> Finish and save</Button>;
  return (
    <div class="stack-sm">
      <p class="small">You changed the exercises today. Keep the change for future sessions?</p>
      <div class="grid-2"><Button onClick={() => onFinish(false)}>Just today</Button><Button variant="primary" onClick={() => onFinish(true)}>Save for future</Button></div>
    </div>
  );
}

function EntryCard({ index, entry, open, onToggle, onDone }: { index: number; entry: NonNullable<ReturnType<typeof active>>['entries'][number]; open: boolean; onToggle: () => void; onDone: () => void }) {
  const s = state.value;
  const u = unit.value;
  const ex: Exercise | undefined = findExercise(entry.exerciseId, s.customExercises);
  const mode = ex?.mode ?? 'weighted';
  const next = suggestNext(s.sessions, entry.exerciseId, s.goal, today.value, entry.sets.length, s.customExercises);
  const [menu, setMenu] = useState(false);
  const logged = entry.sets.filter(x => (x.reps ?? 0) > 0 || (x.durationSec ?? 0) > 0).length;
  const isTimed = mode === 'duration';

  return (
    <Card class={`exercise ${entry.skipped ? 'card-quiet' : ''}`} style={{ opacity: entry.skipped ? .55 : 1 }}>
      <div class="row-between" onClick={onToggle} role="button" aria-expanded={open}>
        <div class="grow">
          <div class="row"><b class="ellipsis">{entry.name}</b>{entry.done && <Chip tone="positive"><IconCheck size={12} /> Done</Chip>}{entry.skipped && <Chip>Skipped</Chip>}</div>
          <div class="hint ellipsis">{next.kg != null && u === 'lb' ? next.target.replace(`${next.kg} kg`, formatLoad(next.kg, u)) : next.target} · {logged}/{entry.sets.length} sets</div>
        </div>
        <Button variant="quiet" class="btn-icon" aria-label="Options" onClick={e => { e.stopPropagation(); setMenu(true); }}><IconMore /></Button>
        <IconChevronDown style={{ transform: open ? 'rotate(180deg)' : 'none', color: 'var(--text-3)' }} />
      </div>
      {open && (
        <div class="stack-sm" style={{ marginTop: 12 }}>
          <p class="hint">{next.reason}</p>
          <div class={`set-grid ${isTimed ? 'duration' : ''}`}><span class="set-index">Set</span>{isTimed ? <span class="hint">seconds</span> : <><span class="hint">{u}</span><span class="hint">reps</span></>}<span class="hint">effort</span></div>
          {entry.sets.map((set, j) => {
            const prev = previousSet(s.sessions, entry.exerciseId, j, s.customExercises);
            const target = next.sets[Math.min(j, next.sets.length - 1)];
            const pr = !isTimed && isLiveRecord(s.sessions, entry.exerciseId, set, s.customExercises);
            return (
              <div key={j}>
                <div class={`set-grid ${isTimed ? 'duration' : ''}`}>
                  <span class="set-index">{j + 1}</span>
                  {isTimed ? (
                    <input type="number" inputMode="numeric" placeholder={String(target?.durationSec ?? prev?.durationSec ?? '')} value={set.durationSec ?? ''} onInput={e => setSet(index, j, { durationSec: parseInt((e.target as HTMLInputElement).value) || undefined })} onBlur={() => commitSet(index, j)} />
                  ) : (
                    <>
                      <input type="number" inputMode="decimal" step="0.5" placeholder={target?.kg != null ? String(kgToDisplay(target.kg, u)) : prev?.kg != null ? String(kgToDisplay(prev.kg, u)) : mode === 'bodyweight' ? 'bw' : ''} value={set.kg != null ? kgToDisplay(set.kg, u) : ''} onInput={e => { const v = parseFloat((e.target as HTMLInputElement).value); setSet(index, j, { kg: Number.isFinite(v) ? displayToKg(v, u) : undefined }); }} />
                      <input type="number" inputMode="numeric" placeholder={String(target?.reps ?? prev?.reps ?? '')} value={set.reps ?? ''} onInput={e => setSet(index, j, { reps: parseInt((e.target as HTMLInputElement).value) || undefined })} onBlur={() => commitSet(index, j)} />
                    </>
                  )}
                  <div class="effort">{EFFORTS.map(ef => <button type="button" key={ef.v} class={ef.v} title={ef.title} aria-label={ef.title} aria-pressed={set.effort === ef.v} onClick={() => { setSet(index, j, { effort: set.effort === ef.v ? undefined : ef.v }); }}>{ef.l}</button>)}</div>
                </div>
                <div class="row-between" style={{ marginTop: 2 }}>
                  <span class="hint">{prev ? `Last: ${isTimed ? `${prev.durationSec ?? 0}s` : `${formatLoad(prev.kg, u)} × ${prev.reps ?? 0}`}${prev.effort ? ` · ${prev.effort}` : ''}` : target?.note ?? ''}</span>
                  {pr && <span class="pr-badge"><IconTrophy size={12} /> Record</span>}
                </div>
              </div>
            );
          })}
          <div class="row">
            <Button variant="quiet" size="sm" onClick={() => addSet(index)}><IconPlus size={14} /> Set</Button>
            <Button variant="quiet" size="sm" onClick={() => removeSet(index, entry.sets.length - 1)} disabled={entry.sets.length <= 1}><IconMinus size={14} /> Set</Button>
            <span class="grow" />
            <Button variant={entry.done ? 'default' : 'solid'} size="sm" onClick={entry.done ? () => markDone(index, false) : onDone}>{entry.done ? 'Undo done' : 'Done with exercise'}</Button>
          </div>
        </div>
      )}
      {menu && (
        <Sheet title={entry.name} onClose={() => setMenu(false)}>
          <div class="stack-sm">
            <Button onClick={() => { skipEntry(index, !entry.skipped); setMenu(false); }}>{entry.skipped ? 'Put back in today' : 'Skip today'}</Button>
            <Button variant="danger" onClick={() => { removeEntry(index); setMenu(false); }}>Remove from this session</Button>
            {ex && <p class="hint">{ex.equipment} · main: {ex.primary.map(muscleLabel).join(', ')}{ex.secondary.length ? ` · helps: ${ex.secondary.map(muscleLabel).join(', ')}` : ''}</p>}
          </div>
        </Sheet>
      )}
    </Card>
  );
}

function FinishScreen({ summary, onClose }: { summary: FinishSummary; onClose: () => void }) {
  const { session } = summary;
  const emphasis = sessionEmphasis(session.exercises, state.value.customExercises).percents;
  const top = (Object.entries(emphasis) as Array<[string, number]>).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const sets = session.exercises.reduce((a, e) => a + e.sets.length, 0);
  return (
    <div class="view">
      <div class="topbar"><div><div class="eyebrow">Session saved</div><h1>{session.splitName} done</h1></div></div>
      <Card class="card-accent">
        <div class="grid-3"><div class="stat"><b class="num">{formatClock(session.durationSec)}</b><span>duration</span></div><div class="stat"><b>{session.exercises.length}</b><span>exercises</span></div><div class="stat"><b>{sets}</b><span>sets</span></div></div>
      </Card>
      <Section title="Muscles worked today">
        <Card>
          <MuscleMap values={emphasis as never} mode="emphasis" />
          <div class="wrap" style={{ marginTop: 12 }}>{top.map(([m, v]) => <Chip key={m} tone="accent">{muscleLabel(m)} {v}%</Chip>)}</div>
          {sets === 0 && <p class="small muted" style={{ marginTop: 10 }}>No sets were logged, so nothing was added to history.</p>}
        </Card>
      </Section>
      <div class="stack-sm" style={{ marginTop: 16 }}><Button variant="primary" onClick={onClose}>Done</Button></div>
    </div>
  );
}

export function RestBanner() {
  const a = state.value.active;
  useEffect(() => { if (a?.rest) setTicking(true); }, [a?.rest?.endsAt]);
  if (!a?.rest) return null;
  const now = nowMs.value;
  const remaining = a.pausedAt && a.rest.pausedRemainingSec != null ? a.rest.pausedRemainingSec : Math.max(0, Math.round((a.rest.endsAt - now) / 1000));
  const done = remaining <= 0;
  const pct = a.rest.totalSec ? Math.min(100, 100 - (remaining / a.rest.totalSec) * 100) : 100;
  return (
    <div class={`rest ${done ? 'done' : ''}`} role="status">
      <div>
        <div class="clock">{done ? 'Go' : formatClock(remaining)}</div>
        <div class="hint">{done ? 'Rest done. Next set.' : `Rest · ${formatClock(a.rest.totalSec)}`}</div>
      </div>
      <div class="grow"><div class="bar"><i style={{ width: `${pct}%`, background: done ? 'var(--positive)' : undefined }} /></div></div>
      {!done && <Button variant="quiet" size="sm" aria-label="Less rest" onClick={() => adjustRest(-15)}>-15</Button>}
      {!done && <Button variant="quiet" size="sm" aria-label="More rest" onClick={() => adjustRest(15)}>+15</Button>}
      <Button size="sm" onClick={() => stopRest()}>{done ? 'OK' : 'Skip'}</Button>
    </div>
  );
}

