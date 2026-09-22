import { useMemo, useState } from 'preact/hooks';
import { state, update } from '@/core/store';
import { today, unit } from '@/app/selectors';
import { Button, Card, Chip, Empty, Row, Section, Segmented, Sheet, Stat } from '@/ui/primitives';
import { IconBack, IconCalendar, IconChevron, IconTrash, IconTrophy } from '@/ui/icons';
import { addDays, formatClock, formatDay, parseDay, dayKey } from '@/core/dates';
import { formatLoad } from '@/core/units';
import type { LoggedSet, Session } from '@/core/models';
import { allRecords, PR_LABEL } from '@/brain/prs';
import { exerciseHistory } from '@/brain/history';
import { trend } from '@/brain/trend';
import { weekSummary } from '@/brain/weekly';
import { muscleLabel } from '@/data/muscles';
import { findExercise } from '@/core/exercises';
import { showToast } from '@/app/toast';
import { SessionHeartRate } from '@/heart-rate/SessionHeartRate';
import { WatchInsights } from '@/heart-rate/WatchInsights';
import { deleteHeartRateSession, getHeartRateTrace, importAllHeartRate } from '@/heart-rate/store';

export function History() {
  const [seg, setSeg] = useState<'log' | 'stats'>('log');
  return (
    <div class="view">
      <div class="topbar"><div><div class="eyebrow">History</div><h1>{seg === 'log' ? 'Sessions' : 'Stats'}</h1></div></div>
      <Segmented value={seg} onChange={setSeg} options={[{ value: 'log', label: 'Log' }, { value: 'stats', label: 'Stats' }]} />
      {seg === 'log' ? <Log /> : <Stats />}
    </div>
  );
}

function Log() {
  const s = state.value;
  const [month, setMonth] = useState(() => today.value.slice(0, 7));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [editing, setEditing] = useState<Session | null>(null);
  const trained = useMemo(() => new Set(s.sessions.map(x => x.day)), [s.sessions]);
  const first = parseDay(`${month}-01`);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: Array<{ key: string; other: boolean }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ key: addDays(`${month}-01`, i - startOffset), other: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ key: `${month}-${String(d).padStart(2, '0')}`, other: false });
  const shift = (n: number) => { const d = parseDay(`${month}-01`); d.setMonth(d.getMonth() + n); setMonth(dayKey(d).slice(0, 7)); };
  const recent = [...s.sessions].reverse().slice(0, 30);
  const daySessions = selectedDay ? s.sessions.filter(x => x.day === selectedDay) : [];

  return (
    <div class="stack" style={{ marginTop: 14 }}>
      <Card>
        <div class="row-between" style={{ marginBottom: 8 }}>
          <Button variant="quiet" class="btn-icon" aria-label="Previous month" onClick={() => shift(-1)}><IconBack /></Button>
          <b>{first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b>
          <Button variant="quiet" class="btn-icon" aria-label="Next month" onClick={() => shift(1)}><IconChevron /></Button>
        </div>
        <div class="cal">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} class="dow">{d}</div>)}
          {cells.map(c => <button type="button" key={c.key} class={`day ${c.other ? 'other' : ''} ${trained.has(c.key) ? 'trained' : ''} ${c.key === today.value ? 'today' : ''} ${c.key === selectedDay ? 'selected' : ''}`} onClick={() => setSelectedDay(c.key === selectedDay ? null : c.key)}>{parseInt(c.key.slice(8))}</button>)}
        </div>
      </Card>

      {selectedDay && (
        <Section title={formatDay(selectedDay, { weekday: 'long', day: 'numeric', month: 'long' })}>
          {daySessions.length ? daySessions.map(x => <SessionCard key={x.id} session={x} onEdit={() => setEditing(x)} />) : <Card class="card-quiet"><p class="small muted">No session this day.</p></Card>}
        </Section>
      )}

      <Section title="Recent">
        {!recent.length && <Card><Empty icon={<IconCalendar size={30} />} title="No sessions yet">Finished workouts show up here.</Empty></Card>}
        <div class="stack-sm">{recent.map(x => <SessionCard key={x.id} session={x} onEdit={() => setEditing(x)} />)}</div>
      </Section>
      {editing && <SessionEditor session={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function SessionCard({ session, onEdit }: { session: Session; onEdit: () => void }) {
  const u = unit.value;
  const sets = session.exercises.reduce((a, e) => a + e.sets.length, 0);
  const [open, setOpen] = useState(false);
  return (
    <Card class="card-press" onClick={() => setOpen(o => !o)}>
      <div class="row-between">
        <div class="grow"><b>{session.splitName}</b><div class="hint">{formatDay(session.day)} · {session.exercises.length} exercises · {sets} sets{session.durationSec ? ` · ${formatClock(session.durationSec)}` : ''}</div></div>
        <Button variant="quiet" size="sm" onClick={e => { e.stopPropagation(); onEdit(); }}>Edit</Button>
      </div>
      {open && (
        <>
          <div class="list" style={{ marginTop: 8 }}>
            {session.exercises.map((e, i) => (
              <Row key={i}>
                <div class="small">{e.name}</div>
                <div class="hint">{e.sets.map(st => setLabel(st, u)).join(' · ')}</div>
              </Row>
            ))}
          </div>
          <SessionHeartRate session={session} />
        </>
      )}
    </Card>
  );
}

function setLabel(st: LoggedSet, u: 'kg' | 'lb'): string {
  if (st.durationSec) return `${st.durationSec}s`;
  if (st.distanceM) return `${st.distanceM} m${st.kg ? ` @ ${formatLoad(st.kg, u)}` : ''}`;
  const load = st.kg ? formatLoad(st.kg, u) : 'bw';
  return `${load} × ${st.reps ?? 0}${st.effort ? ` ${st.effort[0]!.toUpperCase()}` : ''}`;
}

function SessionEditor({ session, onClose }: { session: Session; onClose: () => void }) {
  const u = unit.value;
  const [draft, setDraft] = useState<Session>(() => JSON.parse(JSON.stringify(session)));
  const [confirm, setConfirm] = useState(false);
  const setField = (ei: number, si: number, patch: Partial<LoggedSet>) => setDraft(d => ({ ...d, exercises: d.exercises.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.map((s, j) => (j !== si ? s : { ...s, ...patch })) })) }));
  const save = () => {
    const cleaned = { ...draft, exercises: draft.exercises.map(e => ({ ...e, sets: e.sets.filter(s => (s.reps ?? 0) > 0 || (s.durationSec ?? 0) > 0 || (s.distanceM ?? 0) > 0) })).filter(e => e.sets.length) };
    update(s => ({ ...s, sessions: s.sessions.map(x => (x.id === session.id ? cleaned : x)) }));
    showToast('Session updated'); onClose();
  };
  const remove = async () => {
    const removed = session;
    let trace;
    try {
      trace = await getHeartRateTrace(session.id);
      await deleteHeartRateSession(session.id);
    } catch { showToast('Delete failed. Your session was kept.'); return; }
    update(s => ({ ...s, sessions: s.sessions.filter(x => x.id !== session.id) }));
    showToast('Session deleted', 'Undo', () => {
      void (async () => {
        try {
          if (trace) await importAllHeartRate({ version: 1, traces: [trace] });
          update(s => ({ ...s, sessions: [...s.sessions.filter(x => x.id !== removed.id), removed].sort((a, b) => a.startedAt.localeCompare(b.startedAt)) }));
        } catch { showToast('Could not undo. Try restoring your backup.'); }
      })();
    });
    onClose();
  };
  return (
    <Sheet title={`${session.splitName} · ${formatDay(session.day)}`} onClose={onClose}>
      <div class="stack">
        {draft.exercises.map((e, ei) => (
          <Card key={ei} class="card-quiet">
            <b class="small">{e.name}</b>
            <div class="stack-sm" style={{ marginTop: 8 }}>
              {e.sets.map((st, si) => (
                <div key={si} class="set-grid">
                  <span class="set-index">{si + 1}</span>
                  {st.durationSec != null ? <input type="number" value={st.durationSec} onInput={ev => setField(ei, si, { durationSec: parseInt((ev.target as HTMLInputElement).value) || 0 })} /> : <input type="number" step="0.5" value={st.kg ?? ''} placeholder="kg" onInput={ev => setField(ei, si, { kg: parseFloat((ev.target as HTMLInputElement).value) || undefined })} />}
                  {st.durationSec != null ? <span class="hint">seconds</span> : <input type="number" value={st.reps ?? ''} placeholder="reps" onInput={ev => setField(ei, si, { reps: parseInt((ev.target as HTMLInputElement).value) || 0 })} />}
                  <select value={st.effort ?? ''} onChange={ev => setField(ei, si, { effort: ((ev.target as HTMLSelectElement).value || undefined) as LoggedSet['effort'] })}><option value="">—</option><option value="easy">Easy</option><option value="ideal">Ideal</option><option value="max">Max</option></select>
                </div>
              ))}
            </div>
          </Card>
        ))}
        <p class="hint">Sets with 0 reps are removed on save. Loads are in kg here.{u === 'lb' ? ' Your display unit is lb elsewhere.' : ''}</p>
        <Button variant="primary" onClick={save}>Save changes</Button>
        {!confirm ? <Button variant="danger" onClick={() => setConfirm(true)}><IconTrash size={16} /> Delete session</Button> : <div class="row"><Button variant="quiet" onClick={() => setConfirm(false)}>Keep</Button><Button variant="danger" class="grow" onClick={() => { void remove(); }}>Yes, delete</Button></div>}
      </div>
    </Sheet>
  );
}

/* ---------- Stats ---------- */

function Stats() {
  const s = state.value;
  const u = unit.value;
  const w = weekSummary(s.sessions, today.value, s.customExercises);
  const records = useMemo(() => allRecords(s.sessions, s.customExercises).slice(0, 12), [s.sessions]);
  const exerciseIds = useMemo(() => { const m = new Map<string, string>(); for (const x of [...s.sessions].reverse()) for (const e of x.exercises) if (!m.has(e.exerciseId)) m.set(e.exerciseId, e.name); return [...m]; }, [s.sessions]);
  const [exercise, setExercise] = useState<string>(exerciseIds[0]?.[0] ?? '');
  const hist = exercise ? exerciseHistory(s.sessions, exercise, s.customExercises) : [];
  const t = trend(hist.map(h => ({ day: h.day, value: h.bestE1rm || h.volume })));
  const muscleRows = (Object.entries(w.muscleSets) as Array<[string, number]>).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxSets = muscleRows[0]?.[1] ?? 1;

  return (
    <div class="stack" style={{ marginTop: 14 }}>
      <Card>
        <div class="eyebrow">This week</div>
        <div class="grid-3" style={{ marginTop: 8 }}><Stat value={w.workouts} label="workouts" /><Stat value={w.sets} label="sets" /><Stat value={`${Math.round(w.volumeKg / 1000 * 10) / 10}t`} label="volume" /></div>
        {muscleRows.length > 0 && (
          <div class="stack-sm" style={{ marginTop: 14 }}>
            {muscleRows.map(([m, v]) => { const prev = (w.previousMuscleSets as Record<string, number>)[m] ?? 0; return (
              <div key={m}><div class="row-between small"><span>{muscleLabel(m)}</span><span class="muted num">{v} sets{prev ? <span class={v >= prev ? 'positive-text' : 'warning-text'}> {v >= prev ? '+' : ''}{Math.round((v - prev) * 10) / 10}</span> : null}</span></div><div class="bar"><i style={{ width: `${(v / maxSets) * 100}%` }} /></div></div>
            ); })}
            <p class="hint">Effective sets: a direct set counts 1, a set where the muscle only helps counts ½.</p>
          </div>
        )}
      </Card>

      <WatchInsights />
      <Section title="Exercise progress">
        {!exerciseIds.length ? <Card class="card-quiet"><p class="small muted">Log two sessions of an exercise to see its trend.</p></Card> : (
          <Card>
            <select value={exercise} onChange={e => setExercise((e.target as HTMLSelectElement).value)}>{exerciseIds.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
            {hist.length >= 2 ? (
              <div class="stack-sm" style={{ marginTop: 12 }}>
                <Sparkline points={hist.slice(-12).map(h => h.bestE1rm || h.topKg || h.bestReps)} />
                <div class="grid-3">
                  <Stat value={formatLoad(hist[hist.length - 1]!.topKg, u)} label="last top load" />
                  <Stat value={`${hist[hist.length - 1]!.topReps}`} label="reps at top" />
                  <Stat value={t.direction === 'up' ? 'Improving' : t.direction === 'down' ? 'Slipping' : t.direction === 'flat' ? 'Steady' : 'Early'} label={`trend · ${t.confidence}`} tone={t.direction === 'up' ? 'positive' : t.direction === 'down' ? 'warning' : undefined} />
                </div>
                <div class="list">{[...hist].reverse().slice(0, 5).map(h => <Row key={h.sessionId} trailing={<span class="hint num">{h.sets.map(st => setLabel(st, u)).join(' · ')}</span>}><span class="small">{formatDay(h.day)}</span></Row>)}</div>
                <p class="hint">Trend uses an estimated one-rep strength score from sets of 10 reps or fewer. It is a guide, not a test.</p>
              </div>
            ) : <p class="small muted" style={{ marginTop: 10 }}>One session so far. The trend line appears after the second.</p>}
          </Card>
        )}
      </Section>

      <Section title="Records" aside={<Chip tone="warning"><IconTrophy size={12} /> {records.length}</Chip>}>
        <Card>
          {!records.length ? <p class="small muted">Records appear from your second session of an exercise onward.</p> : (
            <div class="list">{records.map((r, i) => <Row key={i} trailing={<span class="hint">{formatDay(r.day)}</span>}><div class="small">{r.exerciseName}</div><div class="hint">{PR_LABEL[r.kind]} · {r.detail}</div></Row>)}</div>
          )}
        </Card>
      </Section>
    </div>
  );
}

export function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points), max = Math.max(...points);
  const w = 300, h = 56, pad = 4;
  const x = (i: number) => pad + (i / (points.length - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - ((v - min) / Math.max(1e-6, max - min)) * (h - pad * 2);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(' ');
  return <svg class="sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true"><path d={d} fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" /><circle cx={x(points.length - 1)} cy={y(points[points.length - 1]!)} r="3" fill="var(--accent)" /></svg>;
}
