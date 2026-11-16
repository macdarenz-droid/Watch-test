import { useMemo, useState } from 'preact/hooks';
import { state, update } from '@/core/store';
import { insights, hiddenInsights, today, week, activeDeload, deloadSuggestion, scheduledSplit, todayReadiness, recovery as recoverySelector } from '@/app/selectors';
import { Button, Card, Chip, Row, Section, Sheet } from '@/ui/primitives';
import { IconChevron } from '@/ui/icons';
import { CATEGORY_LABEL, type Category, type Insight } from '@/brain/coach/rules';
import { pickCue, type Cue } from '@/brain/coach/cues';
import { reviewWeek, weeklyReviewInsights } from '@/brain/coach/weeklyReview';
import { trainingAgeMonths } from '@/brain/recovery';
import { missingProfileSummary, profileCompleteness } from '@/brain/onboarding';
import { GOAL_BY_ID, GOALS, type GoalId } from '@/data/goals';
import { WEEKDAYS, type AppState, type Weekday } from '@/core/models';
import { WEEKDAY_LABEL, weekStart, daysBetween, formatLocalStamp } from '@/core/dates';
import { findExercise } from '@/core/exercises';
import { suggestNext, type Suggestion } from '@/brain/progression';
import { lighterWeekDay } from '@/brain/deload';
import { activeGymId, profileFor } from '@/slices/workout/units';
import { todaySplit } from '@/slices/workout/session';
import { loadMenu, loggedLoads } from '@/brain/units';
import { recoveryPctFor } from '@/brain/recovery';
import { exerciseHistory } from '@/brain/history';
import { modeLoadText } from '@/brain/bodyweight';
import { resyncReminders } from '../settings/reminders';
import { addGoalTemplates, applyGoalRest, changeGoal } from '../profile/profile';
import { acceptDeload, feedbackTap, restoreInsight } from './coach';
import { closePanel, showPanel } from '@/app/router';
import { usePalaceFocus } from '@/escobar/palace/focus';
import { Hall } from '@/escobar/ui/Hall';
import { AskAbout } from '@/escobar/ui/AskAbout';
import { isWorkingSet } from '@/brain/exposure';

export const INSIGHT_COLOR: Record<Category, string> = {
  recovery: 'var(--positive)', progress: 'var(--warning)', readiness: 'var(--info)', balance: 'var(--accent)', focus: 'var(--accent)', consistency: 'var(--warning)', data: 'var(--text-3)',
};

export function Coach() {
  const s = state.value;
  const list = insights.value;
  const [openInsight, setOpenInsight] = useState<Insight | null>(null);
  const w = week.value;
  usePalaceFocus('coach.header');
  const goal = GOALS.find(g => g.id === s.goal)!;
  const lastExercise = useMemo(() => { const last = s.sessions[s.sessions.length - 1]; return last?.exercises[0] ? findExercise(last.exercises[0].exerciseId, s.customExercises) : undefined; }, [s.sessions]);
  const [cueSeed, setCueSeed] = useState(0);
  const cue: Cue | null = lastExercise ? pickCue(lastExercise, cueSeed % 2 ? 'learn' : 'coach', `${today.value}|${cueSeed}`) : null;

  return (
    <div class="view">
      <div class="topbar" data-palace="coach.header"><div><div class="eyebrow">Escobar</div><h1>Next steps</h1></div></div>

      <Hall />

      <WeeklyReviewCard />
      <DeloadCard />

      <Card class="card-accent" data-palace="coach.week-line">
        <div class="eyebrow">Week summary</div>
        <p style={{ marginTop: 6 }}>{w.workouts} workout{w.workouts === 1 ? '' : 's'}, {w.sets} sets{w.records.length ? `, ${w.records.length} record${w.records.length > 1 ? 's' : ''}` : ''}. {w.grade.note}</p>
      </Card>

      <Section title="Escobar’s notes" palace="coach.insights">
        <div class="stack-sm">
          {list.map(i => (
            <Card key={i.id} class="insight card-press" style={{ '--insight': INSIGHT_COLOR[i.category] }} onClick={() => setOpenInsight(i)}>
              <div class="row-between"><span class="insight-cat">{CATEGORY_LABEL[i.category]}</span><span class="row" style={{ gap: 4 }}><AskAbout refTo={{ kind: 'insight', id: i.id, label: i.title }} /><button type="button" class="insight-open" aria-label={`Open ${i.title}`} onClick={e => { e.stopPropagation(); setOpenInsight(i); }}><IconChevron size={16} style={{ color: 'var(--text-3)' }} /></button></span></div>
              <h3 style={{ margin: '4px 0 6px' }}>{i.title}</h3>
              <p class="small muted">{i.action}</p>
              <div class="row" style={{ marginTop: 8, gap: 8 }} onClick={e => e.stopPropagation()}>
                <Button variant="quiet" size="sm" onClick={() => feedbackTap(i.id, 'helpful')}>Helpful</Button>
                <Button variant="quiet" size="sm" onClick={() => feedbackTap(i.id, 'snoozed')}>Not now</Button>
              </div>
            </Card>
          ))}
          {!list.length && <Card class="card-quiet"><p class="small muted">No strong signals right now.</p></Card>}
          <HiddenNotes />
        </div>
      </Section>

      <Section title="Training goal" palace="coach.goal" aside={<Button variant="quiet" size="sm" onClick={() => showPanel('goal')}>Change</Button>}>
        <Card class="card-press" onClick={() => showPanel('goal')}>
          <b>{goal.name}</b><div class="hint">{goal.tagline} · {goal.mainReps[0]}–{goal.mainReps[1]} reps (accessories {goal.accessoryReps[0]}–{goal.accessoryReps[1]})</div>
        </Card>
      </Section>

      <Schedule />

      {cue && (
        <Section title={cue.kind === 'learn' ? 'Coach fact' : 'Coach tip'} palace="coach.tip" aside={<Button variant="quiet" size="sm" onClick={() => setCueSeed(n => n + 1)}>Another</Button>}>
          <Card class="card-quiet"><b class="small">{cue.title}</b><p class="small muted" style={{ marginTop: 4 }}>{cue.text}</p>{lastExercise && <span class="hint">About {lastExercise.name}</span>}</Card>
        </Section>
      )}

      <WhatCoachCanSee />

      {openInsight && <InsightSheet insight={openInsight} onClose={() => setOpenInsight(null)} />}
    </div>
  );
}

/** Shared by the Coach tab and the profile dashboard: pick a goal, then offer its rest suggestion and templates. */
export function GoalSheet({ onClose }: { onClose: () => void }) {
  const s = state.value;
  const [changedTo, setChangedTo] = useState<GoalId | null>(null);
  const picked = changedTo ? GOAL_BY_ID[changedTo] : null;

  return (
    <Sheet title="Training goal" onClose={onClose} palace="panel.goal">
      {!picked ? (
        <div class="stack-sm">
          {GOALS.map(g => (
            <Card key={g.id} class="card-press" style={{ borderColor: g.id === s.goal ? 'var(--accent)' : undefined }} onClick={() => { changeGoal(g.id); setChangedTo(g.id); }}>
              <b>{g.name}</b><div class="hint">{g.tagline} · {g.mainReps[0]}–{g.mainReps[1]} reps · {g.bestFor}</div>
            </Card>
          ))}
        </div>
      ) : (
        <div class="stack-sm">
          <Card class="card-accent">
            <b>{picked.name}</b>
            <div class="hint">Main lifts {picked.mainReps[0]}–{picked.mainReps[1]} reps, accessories {picked.accessoryReps[0]}–{picked.accessoryReps[1]}.</div>
          </Card>
          <Button onClick={() => applyGoalRest(picked.id)}>Apply {picked.restDefaultSec}s rest</Button>
          <Button variant="quiet" onClick={() => addGoalTemplates(picked.id)}>Add starter templates for this goal</Button>
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      )}
    </Sheet>
  );
}

/**
 * AUD-8 (UI-12): an insight's target for today, from the inputs the live workout's target uses
 * (Train.tsx EntryCard): today's readiness, the muscle's recovery, the lighter week, the gym's
 * load menu, and the set count, load factor and swap of today's entry or plan.
 */
export function insightTarget(s: AppState, exerciseId: string): Suggestion {
  const ex = findExercise(exerciseId, s.customExercises);
  const gymId = s.active?.gymId ?? activeGymId();
  const entry = s.active?.entries.find(e => e.exerciseId === exerciseId);
  const split = scheduledSplit.value;
  const planned = split ? todaySplit(split, s.escobar.todayOverride, today.value).exercises.find(x => x.exerciseId === exerciseId) : undefined;
  const sets = entry ? entry.sets.filter(x => x.kind !== 'warmup').length || 1 : planned?.sets ?? 3;
  const loadFactor = entry ? entry.loadFactor : planned?.loadFactor;
  const menu = loadMenu(exerciseId, gymId, s.units, ex, loggedLoads(s.sessions, exerciseId, s.customExercises));
  return suggestNext(s.sessions, exerciseId, s.goal, today.value, sets, s.customExercises, {
    readiness: todayReadiness.value, recoveryPct: recoveryPctFor(exerciseId, s.customExercises, recoverySelector.value),
    deload: activeDeload.value, lastDeload: s.deload, equipment: profileFor(exerciseId, gymId), menu,
    ...(loadFactor != null ? { loadFactor } : {}),
    ...(entry?.plannedId && entry.plannedId !== exerciseId ? { replacedExerciseId: entry.plannedId } : {}),
  });
}

function InsightSheet({ insight, onClose }: { insight: Insight; onClose: () => void }) {
  const s = state.value;
  const ex = insight.exerciseId ? findExercise(insight.exerciseId, s.customExercises) : undefined;
  const next = ex ? insightTarget(s, ex.id) : null;
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
        {next && <Card class="card-quiet"><div class="eyebrow">Next session</div><b>{next.target}</b><p class="small muted" style={{ marginTop: 4 }}>{next.reason}</p></Card>}
        {hist.length > 0 && <div><div class="eyebrow" style={{ marginBottom: 4 }}>Recent sessions</div><div class="list">{hist.map(h => <Row key={h.sessionId} trailing={<span class="hint num">{h.topKg ? `${modeLoadText({ kg: h.topKg }, ex?.mode ?? 'weighted', s.preferences.weightUnit)} × ${h.topReps}` : `${h.bestReps} reps`}</span>}><span class="small">{h.day}</span></Row>)}</div></div>}
      </div>
    </Sheet>
  );
}

function Schedule() {
  const s = state.value;
  const active = WEEKDAYS.filter(d => s.schedule[d]);
  return (
    <Section title="Weekly schedule" palace="coach.schedule" aside={<Button variant="quiet" size="sm" onClick={() => showPanel('schedule')}>Edit</Button>}>
      <Card class="card-press" onClick={() => showPanel('schedule')}>
        <div class="row" style={{ justifyContent: 'space-between' }}>
          {WEEKDAYS.map(d => { const sp = s.splits.find(x => x.id === s.schedule[d]); return <div key={d} style={{ textAlign: 'center' }}><div class="hint">{WEEKDAY_LABEL[d][0]}</div><div style={{ width: 10, height: 10, borderRadius: '50%', margin: '4px auto 0', background: sp?.color ?? 'var(--surface-3)' }} /></div>; })}
        </div>
        <p class="hint" style={{ marginTop: 8 }}>{active.length ? `${active.length} training days a week.` : 'No schedule.'}</p>
      </Card>
    </Section>
  );
}

/** Weekly schedule editor, opened as the `schedule` panel. */
export function ScheduleSheet({ onClose }: { onClose: () => void }) {
  const s = state.value;
  usePalaceFocus('panel.schedule');
  const set = (d: Weekday, id: string | null) => { update(x => ({ ...x, schedule: { ...x.schedule, [d]: id } })); void resyncReminders(); };
  const autoArrange = (n: number) => {
    const slots: Record<number, Weekday[]> = { 1: ['mon'], 2: ['mon', 'thu'], 3: ['mon', 'wed', 'fri'], 4: ['mon', 'tue', 'thu', 'sat'], 5: ['mon', 'tue', 'wed', 'fri', 'sat'], 6: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'], 7: [...WEEKDAYS] };
    const days = slots[n] ?? slots[3]!;
    const sched = Object.fromEntries(WEEKDAYS.map(d => [d, null])) as Record<Weekday, string | null>;
    days.forEach((d, i) => { sched[d] = s.splits[i % s.splits.length]?.id ?? null; });
    update(x => ({ ...x, schedule: sched })); void resyncReminders();
  };
  return (
    <Sheet title="Weekly schedule" onClose={onClose} palace="panel.schedule">
      <div class="stack">
        {!s.splits.length && <p class="small muted">No splits yet.</p>}
        {WEEKDAYS.map(d => (
          <div key={d} class="row"><span style={{ width: 44 }} class="small">{WEEKDAY_LABEL[d]}</span>
            <select class="grow" aria-label={WEEKDAY_LABEL[d]} value={s.schedule[d] ?? ''} onChange={e => set(d, (e.target as HTMLSelectElement).value || null)}><option value="">Rest</option>{s.splits.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}</select>
          </div>
        ))}
        {s.splits.length > 0 && <div><div class="eyebrow" style={{ marginBottom: 6 }}>Quick arrange</div><div class="wrap">{[2, 3, 4, 5, 6].map(n => <Chip key={n} onClick={() => autoArrange(n)}>{n} days</Chip>)}</div></div>}
      </div>
    </Sheet>
  );
}

/**
 * ADAPT-4: the weekly-review card's line, or null when there is no review yet. It shows once this week
 * or the week just ended reached the planned sessions (schedule, else Profile.plannedDays, else 3; at least 2).
 */
export function weeklyReviewCardLine(s: Pick<AppState, 'sessions' | 'schedule' | 'daysOff' | 'profile'>, day: string, count: number): string | null {
  const start = reviewWeek(s.sessions, day, { schedule: s.schedule, daysOff: s.daysOff, plannedDays: s.profile.plannedDays });
  if (start == null) return null;
  const week = start === weekStart(day) ? 'this week' : 'last week';
  return count ? `${count} thing${count > 1 ? 's' : ''} worth knowing about ${week}.` : `Steady ${week} — nothing stands out either way.`;
}

/** Pinned at the top of Coach on the first open of a new week once the review has a week to cover, until dismissed. */
function WeeklyReviewCard() {
  const s = state.value;
  const thisWeek = weekStart(today.value);
  const dismissed = s.weeklyReviewDismissedWeek === thisWeek;
  // UI-30: hooks run on every render, before any early return.
  const items = useWeeklyReviewItems();
  const line = weeklyReviewCardLine(s, today.value, items.length);
  if (dismissed || !line) return null;
  return (
    <Card class="card-accent card-press" onClick={() => showPanel('weekly-review')}>
      <div class="row-between"><span class="eyebrow">Weekly review</span><IconChevron size={16} style={{ color: 'var(--text-3)' }} /></div>
      <p style={{ marginTop: 6 }}>{line}</p>
    </Card>
  );
}

function useWeeklyReviewItems() {
  const s = state.value;
  const exerciseIds = useMemo(() => {
    const names = new Map<string, string>();
    for (const sess of [...s.sessions].reverse()) for (const e of sess.exercises) if (!names.has(e.exerciseId)) names.set(e.exerciseId, e.name);
    return [...names].map(([id, name]) => ({ id, name }));
  }, [s.sessions]);
  const items = weeklyReviewInsights({
    sessions: s.sessions, today: today.value, custom: s.customExercises, schedule: s.schedule, goal: s.goal,
    profile: s.profile, weightLog: s.weightLog, trainingAgeMonths: trainingAgeMonths(s.profile, s.sessions, Date.now()), exerciseIds, daysOff: s.daysOff, unit: s.preferences.weightUnit, deload: s.deload,
  }, 6);
  return items;
}

/** The weekly review, opened as the `weekly-review` panel (from its card or by Escobar). */
export function WeeklyReviewSheet({ onClose }: { onClose: () => void }) {
  const items = useWeeklyReviewItems();
  usePalaceFocus('panel.weekly-review');
  const dismiss = () => { const wk = weekStart(today.value); update(x => ({ ...x, weeklyReviewDismissedWeek: wk })); };
  const setOpen = (_: boolean) => { closePanel('weekly-review'); onClose(); };
  return (
        <Sheet title="Weekly review" onClose={onClose} palace="panel.weekly-review">
          <div class="stack">
            {items.map(i => (
              <Card key={i.id} class="card-quiet">
                <b class="small">{i.title}</b>
                <p class="small muted" style={{ marginTop: 4 }}>{i.means}</p>
                <p class="hint" style={{ marginTop: 4 }}>{i.action}</p>
              </Card>
            ))}
            {!items.length && <p class="small muted">Nothing stood out this week.</p>}
            <Button variant="quiet" onClick={() => { dismiss(); setOpen(false); }}>Dismiss until next week</Button>
          </div>
        </Sheet>
  );
}

/** F3.3: the active lighter week, or the coach's offer of one. Never shows both at once. */
function DeloadCard() {
  const active = activeDeload.value;
  const suggestion = deloadSuggestion.value;
  if (!active && !suggestion.suggest) return null;
  return (
    <Card class="card-accent">
      {active ? (
        <>
          <div class="eyebrow">Lighter week</div>
          <p style={{ marginTop: 6 }}>Day {lighterWeekDay(active, today.value)} of 7. {active.reason}</p>
          <p class="hint" style={{ marginTop: 4 }}>Through {active.endDay}.</p>
        </>
      ) : (
        <>
          <div class="eyebrow">Coach suggestion</div>
          <p style={{ marginTop: 6 }}>{suggestion.reason}</p>
          <Button style={{ marginTop: 8 }} onClick={() => acceptDeload(suggestion.reason)}>Take a lighter week</Button>
        </>
      )}
    </Card>
  );
}

/** COACH-FB: one quiet row when notes are hidden; it opens to their current titles, each with Show again. Replaces the F3.6 "Earlier this month" log. */
function HiddenNotes() {
  const hidden = hiddenInsights.value;
  const [open, setOpen] = useState(false);
  if (!hidden.length) return null;
  return (
    <div class="list notes-hidden">
      <Row trailing={<Button variant="quiet" size="sm" aria-expanded={open} onClick={() => setOpen(o => !o)}>{open ? 'Hide' : 'Show'}</Button>}>
        <span class="small muted">{hidden.length} note{hidden.length === 1 ? '' : 's'} hidden</span>
      </Row>
      {open && hidden.map(h => (
        <Row key={h.insight.id} trailing={<Button variant="quiet" size="sm" onClick={() => restoreInsight(h.insight.id)}>Show again</Button>}>
          <span class="small">{h.insight.title}</span>
          <div class="hint">{h.verdict === 'helpful' ? 'Helpful · back tomorrow' : backIn(h.day)}</div>
        </Row>
      ))}
    </div>
  );
}

/** COACH-FB: "Not now · back in N days" for a snooze made on `day` (it lasts 7 days). */
function backIn(day: string): string {
  const n = Math.min(7, Math.max(1, 7 - daysBetween(day, today.value)));
  return `Not now · back in ${n} day${n === 1 ? '' : 's'}`;
}

/** 6.12.6: what the coach is actually working from right now (COPY-1: data rows only, no unlock hints). */
function WhatCoachCanSee() {
  const s = state.value;
  const recentSets = s.sessions.slice(-3).flatMap(x => x.exercises.flatMap(e => e.sets)).filter(isWorkingSet);
  const ratedShare = recentSets.length ? recentSets.filter(x => x.effort).length / recentSets.length : null;
  const liveShare = recentSets.length ? recentSets.filter(x => x.fidelity === 'live').length / recentSets.length : null;
  const completeness = profileCompleteness(s.profile);
  const todayCheckIn = s.checkIns.find(c => c.day === today.value);
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Sets logged', value: `${s.sessions.reduce((a, x) => a + x.exercises.reduce((b, e) => b + e.sets.length, 0), 0)} total` },
    { label: 'Effort ratings', value: ratedShare != null ? `${Math.round(ratedShare * 100)}% of recent sets` : 'none yet' },
    { label: 'Set timing', value: liveShare != null ? `${Math.round(liveShare * 100)}% logged live` : 'none yet' },
    { label: 'Health Connect', value: s.health.connected ? `synced ${s.health.lastSync ? formatLocalStamp(s.health.lastSync) : ''}` : 'not connected' },
    { label: "Today's check-in", value: todayCheckIn ? 'added' : 'not added' },
    { label: 'Profile', value: missingProfileSummary(completeness) },
    { label: 'Weigh-ins', value: `${s.weightLog.length} logged` },
  ];
  return (
    <Section title="Coach data" palace="coach.sees">
      <Card class="card-quiet">
        <div class="list">
          {rows.map(r => (
            <Row key={r.label} trailing={<span class="hint num">{r.value}</span>}>
              <span class="small">{r.label}</span>
            </Row>
          ))}
        </div>
      </Card>
    </Section>
  );
}
