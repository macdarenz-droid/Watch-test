import { useMemo, useState } from 'preact/hooks';
import { state, update } from '@/core/store';
import { allInsights, today, week } from '@/app/selectors';
import { WatchInsights } from '@/heart-rate/WatchInsights';
import { SessionHeartRate } from '@/heart-rate/SessionHeartRate';
import { Button, Card, Chip, Row, Section, Sheet } from '@/ui/primitives';
import { IconChevron, IconInfo } from '@/ui/icons';
import { CATEGORY_LABEL, type Category, type Insight } from '@/brain/coach/rules';
import { pickCue, type Cue } from '@/brain/coach/cues';
import { GOALS, type GoalId } from '@/data/goals';
import { WEEKDAYS, type Weekday } from '@/core/models';
import { WEEKDAY_LABEL } from '@/core/dates';
import { findExercise } from '@/core/exercises';
import { suggestNext } from '@/brain/progression';
import { exerciseHistory } from '@/brain/history';
import { formatLoad } from '@/core/units';
import { resyncReminders } from '../settings/reminders';

export const INSIGHT_COLOR: Record<Category, string> = {
  recovery: 'var(--positive)', progress: 'var(--warning)', readiness: 'var(--info)', balance: 'var(--accent)', focus: 'var(--accent)', consistency: 'var(--warning)', data: 'var(--text-3)', 'heart-rate': 'var(--info)',
};

export function Coach() {
  const s = state.value;
  const list = allInsights.value;
  const [openInsight, setOpenInsight] = useState<Insight | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const w = week.value;
  const goal = GOALS.find(g => g.id === s.goal)!;
  const lastExercise = useMemo(() => { const last = s.sessions[s.sessions.length - 1]; return last?.exercises[0] ? findExercise(last.exercises[0].exerciseId, s.customExercises) : undefined; }, [s.sessions]);
  const [cueSeed, setCueSeed] = useState(0);
  const cue: Cue | null = lastExercise ? pickCue(lastExercise, cueSeed % 2 ? 'learn' : 'coach', `${today.value}|${cueSeed}`) : null;

  return (
    <div class="view">
      <div class="topbar"><div><div class="eyebrow">Coach</div><h1>What to do next</h1></div></div>

      <Card class="card-accent">
        <div class="eyebrow">This week in one line</div>
        <p style={{ marginTop: 6 }}>{w.workouts} workout{w.workouts === 1 ? '' : 's'}, {w.sets} sets{w.records.length ? `, ${w.records.length} record${w.records.length > 1 ? 's' : ''}` : ''}. {w.grade.note}</p>
      </Card>

      <Section title="Insights">
        <div class="stack-sm">
          {list.map(i => (
            <Card key={i.id} class="insight card-press" style={{ '--insight': INSIGHT_COLOR[i.category] }} onClick={() => setOpenInsight(i)}>
              <div class="row-between"><span class="insight-cat">{CATEGORY_LABEL[i.category]}</span><IconChevron size={16} style={{ color: 'var(--text-3)' }} /></div>
              <h3 style={{ margin: '4px 0 6px' }}>{i.title}</h3>
              <p class="small muted">{i.action}</p>
            </Card>
          ))}
          {!list.length && <Card class="card-quiet"><p class="small muted">No strong signals right now. Keep logging and rating effort.</p></Card>}
        </div>
      </Section>

      <WatchInsights />

      <Section title="Training goal" aside={<Button variant="quiet" size="sm" onClick={() => setGoalOpen(true)}>Change</Button>}>
        <Card class="card-press" onClick={() => setGoalOpen(true)}>
          <b>{goal.name}</b><div class="hint">{goal.tagline} · {goal.reps[0]}–{goal.reps[1]} reps{goal.accessoryReps ? ` (accessories ${goal.accessoryReps[0]}–${goal.accessoryReps[1]})` : ''}</div>
        </Card>
      </Section>

      <Schedule />

      {cue && (
        <Section title={cue.kind === 'learn' ? 'Worth knowing' : 'Coach tip'} aside={<Button variant="quiet" size="sm" onClick={() => setCueSeed(n => n + 1)}>Another</Button>}>
          <Card class="card-quiet"><b class="small">{cue.title}</b><p class="small muted" style={{ marginTop: 4 }}>{cue.text}</p>{lastExercise && <span class="hint">About {lastExercise.name}</span>}</Card>
        </Section>
      )}

      <Section title="How the coach thinks">
        <Card class="card-quiet">
          <div class="stack-sm small muted">
            <p><IconInfo size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Reps first, then load. You add a rep until you reach the top of your range, hit it twice without max effort, then take one small step up.</p>
            <p>Two sessions under the range at max effort means one step down. More than four weeks away means repeat your last load once.</p>
            <p>Recovery windows are 24, 48 or 72 hours depending on effort, and they only ever widen when your own history shows you need it.</p>
            <p>Missing effort ratings never count as easy or max. They lower confidence instead.</p>
            <p>Watch comparisons use usable recordings from similar workouts. Heart rate adds context alongside effort; it does not independently change your weights or recovery estimate.</p>
          </div>
        </Card>
      </Section>

      {openInsight && <InsightSheet insight={openInsight} onClose={() => setOpenInsight(null)} />}
      {goalOpen && (
        <Sheet title="Training goal" onClose={() => setGoalOpen(false)}>
          <div class="stack-sm">
            <p class="small muted">Your goal changes rep targets and the effort window. It does not change the exercises.</p>
            {GOALS.map(g => <Card key={g.id} class="card-press" style={{ borderColor: g.id === s.goal ? 'var(--accent)' : undefined }} onClick={() => { update(x => ({ ...x, goal: g.id as GoalId })); setGoalOpen(false); }}><b>{g.name}</b><div class="hint">{g.tagline} · {g.reps[0]}–{g.reps[1]} reps · {g.bestFor}</div></Card>)}
          </div>
        </Sheet>
      )}
    </div>
  );
}

function InsightSheet({ insight, onClose }: { insight: Insight; onClose: () => void }) {
  const s = state.value;
  const watchSession = s.sessions.find(session => session.id === insight.sessionId);
  const ex = insight.exerciseId ? findExercise(insight.exerciseId, s.customExercises) : undefined;
  const next = ex ? suggestNext(s.sessions, ex.id, s.goal, today.value, 3, s.customExercises) : null;
  const hist = ex ? exerciseHistory(s.sessions, ex.id, s.customExercises).slice(-5).reverse() : [];
  return (
    <Sheet title={insight.title} onClose={onClose}>
      <div class="stack">
        <Chip tone="accent">{CATEGORY_LABEL[insight.category]}</Chip>
        <div class="chain">
          <div><span>Noticed</span><span>{insight.noticed}</span></div>
          <div><span>Means</span><span>{insight.means}</span></div>
          <div><span>Do next</span><span>{insight.action}</span></div>
        </div>
        {watchSession && <SessionHeartRate session={watchSession} />}
        {next && <Card class="card-quiet"><div class="eyebrow">Next session</div><b>{next.target}</b><p class="small muted" style={{ marginTop: 4 }}>{next.reason}</p></Card>}
        {hist.length > 0 && <div><div class="eyebrow" style={{ marginBottom: 4 }}>Recent sessions</div><div class="list">{hist.map(h => <Row key={h.sessionId} trailing={<span class="hint num">{h.topKg ? `${formatLoad(h.topKg, s.preferences.weightUnit)} × ${h.topReps}` : `${h.bestReps} reps`}</span>}><span class="small">{h.day}</span></Row>)}</div></div>}
      </div>
    </Sheet>
  );
}

function Schedule() {
  const s = state.value;
  const [open, setOpen] = useState(false);
  const active = WEEKDAYS.filter(d => s.schedule[d]);
  const set = (d: Weekday, id: string | null) => { update(x => ({ ...x, schedule: { ...x.schedule, [d]: id } })); void resyncReminders(); };
  const autoArrange = (n: number) => {
    const slots: Record<number, Weekday[]> = { 1: ['mon'], 2: ['mon', 'thu'], 3: ['mon', 'wed', 'fri'], 4: ['mon', 'tue', 'thu', 'sat'], 5: ['mon', 'tue', 'wed', 'fri', 'sat'], 6: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'], 7: [...WEEKDAYS] };
    const days = slots[n] ?? slots[3]!;
    const sched = Object.fromEntries(WEEKDAYS.map(d => [d, null])) as Record<Weekday, string | null>;
    days.forEach((d, i) => { sched[d] = s.splits[i % s.splits.length]?.id ?? null; });
    update(x => ({ ...x, schedule: sched })); void resyncReminders();
  };
  return (
    <Section title="Weekly schedule" aside={<Button variant="quiet" size="sm" onClick={() => setOpen(true)}>Edit</Button>}>
      <Card class="card-press" onClick={() => setOpen(true)}>
        <div class="row" style={{ justifyContent: 'space-between' }}>
          {WEEKDAYS.map(d => { const sp = s.splits.find(x => x.id === s.schedule[d]); return <div key={d} style={{ textAlign: 'center' }}><div class="hint">{WEEKDAY_LABEL[d][0]}</div><div style={{ width: 10, height: 10, borderRadius: 5, margin: '4px auto 0', background: sp?.color ?? 'var(--surface-3)' }} /></div>; })}
        </div>
        <p class="hint" style={{ marginTop: 8 }}>{active.length ? `${active.length} training days a week. Reminders and streaks follow this.` : 'No schedule. Set one so reminders and streaks know your rest days.'}</p>
      </Card>
      {open && (
        <Sheet title="Weekly schedule" onClose={() => setOpen(false)}>
          <div class="stack">
            {!s.splits.length && <p class="small muted">Create a split first, then assign it to days.</p>}
            {WEEKDAYS.map(d => (
              <div key={d} class="row"><span style={{ width: 44 }} class="small">{WEEKDAY_LABEL[d]}</span>
                <select class="grow" value={s.schedule[d] ?? ''} onChange={e => set(d, (e.target as HTMLSelectElement).value || null)}><option value="">Rest</option>{s.splits.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}</select>
              </div>
            ))}
            {s.splits.length > 0 && <div><div class="eyebrow" style={{ marginBottom: 6 }}>Quick arrange</div><div class="wrap">{[2, 3, 4, 5, 6].map(n => <Chip key={n} onClick={() => autoArrange(n)}>{n} days</Chip>)}</div></div>}
          </div>
        </Sheet>
      )}
    </Section>
  );
}
