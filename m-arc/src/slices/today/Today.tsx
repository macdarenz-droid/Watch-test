import { useEffect, useState } from 'preact/hooks';
import { AskAbout } from '@/escobar/ui/AskAbout';
import { state } from '@/core/store';
import { go } from '@/app/router';
import { insights, recovery, scheduledSplit, sessionsToday, streak, today, todayReadiness, week } from '@/app/selectors';
import { Button, Card, Chip, Section, Stat } from '@/ui/primitives';
import { IconChevron, IconFlame, IconGear, IconPlay } from '@/ui/icons';
import { settingsOpen } from '@/app/router';
import { usePalaceFocus } from '@/escobar/palace/focus';
import { daysBetween, formatDay, formatHoursLeft } from '@/core/dates';
import { muscleLabel } from '@/data/muscles';
import { SPARKS } from '@/data/sparks';
import { mindsetForDay, sparkIndexForDay } from '@/brain/coach/cues';
import { CATEGORY_LABEL } from '@/brain/coach/rules';
import { requestStart } from '../workout/Train';
import { setDayOff } from './dayOff';
import { INSIGHT_COLOR } from '../coach/Coach';
import { MuscleMap } from '@/ui/MuscleMap';
import { LogoMark } from '@/ui/Logo';

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function Today() {
  const s = state.value;
  const split = scheduledSplit.value;
  const done = sessionsToday.value;
  const live = s.active;
  const rec = recovery.value;
  const recovering = rec.filter(r => r.recovering).sort((a, b) => a.pct - b.pct);
  const ready = rec.filter(r => !r.recovering && r.lastTrainedAt).length;
  const w = week.value;
  const top = insights.value[0];
  // ST-17: on odd days of the year a mindset note takes the quote slot.
  const dayOfYear = daysBetween(`${today.value.slice(0, 4)}-01-01`, today.value) + 1;
  const mindset = mindsetForDay(dayOfYear);
  const spark = SPARKS[sparkIndexForDay(dayOfYear, Number(today.value.slice(0, 4)), SPARKS.length)]!;
  const values = Object.fromEntries(rec.filter(r => r.lastTrainedAt).map(r => [r.muscle, r.pct]));

  // RG-19 (D4): a scheduled day taken off reads as its own state and counts as unscheduled.
  const off = s.daysOff.includes(today.value);
  const status = live ? 'live' : done.length ? 'done' : split ? (off ? 'off' : 'ready') : 'rest';
  usePalaceFocus('today.header', { status });

  return (
    <div class="view">
      <div class="topbar" data-palace="today.header">
        <div>
          <div class="row" style={{ gap: 8, marginBottom: 6 }}><LogoMark size={22} /><span class="eyebrow">{formatDay(today.value, { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
          <h1>{greeting()}{s.profile.name ? `, ${s.profile.name}` : ''}</h1>
        </div>
        <div class="row">
          {streak.value > 0 && <Chip><IconFlame size={16} /> {streak.value}</Chip>}
          <Button variant="quiet" class="btn-icon" aria-label="Settings" data-palace="today.settings" onClick={() => { settingsOpen.value = true; }}><IconGear /></Button>
        </div>
      </div>

      <Card class="card-accent" data-palace="today.session-card">
        {status === 'live' && (
          <div class="stack-sm">
            <div class="eyebrow">Session in progress</div>
            <h2>{s.splits.find(x => x.id === live!.splitId)?.name ?? 'Workout'}</h2>
            <p class="muted small">{live!.entries.filter(e => e.done).length} of {live!.entries.length} exercises done.</p>
            <Button variant="primary" onClick={() => go('train')}><IconPlay /> Continue session</Button>
          </div>
        )}
        {status === 'done' && (
          <div class="stack-sm">
            <div class="eyebrow">Today</div>
            <h2>{done.map(d => d.splitName).join(' + ')} done</h2>
            <p class="muted small">{done.reduce((a, d) => a + d.exercises.reduce((x, e) => x + e.sets.length, 0), 0)} sets logged.</p>
            <div class="row"><Button onClick={() => go('body')}>View recovery</Button><Button variant="quiet" onClick={() => go('history')}>History</Button></div>
          </div>
        )}
        {status === 'ready' && split && (
          <div class="stack-sm">
            <div class="eyebrow">Scheduled today</div>
            <h2>{split.name}</h2>
            <p class="muted small">{split.exercises.length} exercises planned.</p>
            <div class="row">
              <Button variant="primary" class="grow" onClick={() => { requestStart(split); go('train'); }}><IconPlay /> Start {split.name}</Button>
              <Button variant="quiet" data-palace="today.day-off" onClick={() => setDayOff(today.value, true)}>Take today off</Button>
            </div>
          </div>
        )}
        {status === 'off' && split && (
          <div class="stack-sm" data-palace="today.day-off">
            <div class="eyebrow">Day off</div>
            <h2>{split.name}</h2>
            <div class="row"><Button onClick={() => { setDayOff(today.value, false); requestStart(split); go('train'); }}><IconPlay /> Train anyway</Button><Button variant="quiet" onClick={() => setDayOff(today.value, false)}>Undo day off</Button></div>
          </div>
        )}
        {status === 'rest' && (
          <div class="stack-sm">
            <div class="eyebrow">Rest day</div>
            <h2>{s.splits.length ? 'Nothing scheduled' : 'First workout'}</h2>
            <Button onClick={() => go('train')}>{s.splits.length ? 'Choose a workout' : 'Open Train'}</Button>
          </div>
        )}
      </Card>

      <ReadinessCard />

      <Pins />

      <Section title="Current week" palace="today.week" aside={<span class="small muted">{w.grade.title}</span>}>
        <Card>
          <div class="grid-3">
            <Stat value={w.workouts} label="workouts" />
            <Stat value={w.sets} label="sets" />
            <Stat value={w.records.length} label="records" tone={w.records.length ? 'positive' : undefined} />
          </div>
          <p class="small muted" style={{ marginTop: 10 }}>{w.grade.note}</p>
        </Card>
      </Section>

      <Section title="Recovery" palace="today.recovery" aside={<button type="button" class="btn btn-quiet btn-sm" onClick={() => go('body')}>Body <IconChevron size={16} /></button>}>
        <Card>
          <div class="row" style={{ alignItems: 'flex-start' }}>
            <div style={{ width: 120, flex: 'none' }}><MuscleMap values={values} mode="recovery" compact /></div>
            <div class="grow stack-sm">
              {recovering.length === 0 && <p class="small">{ready ? 'Every muscle you have trained is fully recovered.' : 'No sessions yet.'}</p>}
              {recovering.slice(0, 4).map(r => (
                <div key={r.muscle} class="row-between small">
                  <span>{muscleLabel(r.muscle)}</span>
                  <span class="muted num">{r.pct}% · {r.soreToday && !r.readyInHours && !r.hoursLeft ? 'sore today' : formatHoursLeft(r)}</span>
                </div>
              ))}
              {recovering.length > 4 && <span class="hint">+{recovering.length - 4} more recovering</span>}
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Coach" palace="today.coach" aside={<button type="button" class="btn btn-quiet btn-sm" onClick={() => go('coach')}>All <IconChevron size={16} /></button>}>
        {top ? (
          <Card class="insight" style={{ '--insight': INSIGHT_COLOR[top.category] }}>
            <div class="insight-cat">{CATEGORY_LABEL[top.category]}</div>
            <h3 style={{ margin: '4px 0 6px' }}>{top.title}</h3>
            <p class="small muted">{top.action}</p>
          </Card>
        ) : <Card class="card-quiet"><p class="small muted">No strong signals right now.</p></Card>}
      </Section>

      {s.preferences.showSpark && (
        <Section title="Daily spark" palace="today.spark">
          <Card class="card-quiet">
            {mindset ? (
              <><div class="eyebrow">Mindset</div><p style={{ margin: '8px 0 6px', fontSize: 16 }}>{mindset.title}</p><span class="hint">{mindset.text}</span></>
            ) : (
              <><div class="eyebrow">{spark.topic}</div><p style={{ margin: '8px 0 6px', fontSize: 16 }}>{spark.text}</p><span class="hint">{spark.by}</span></>
            )}
          </Card>
        </Section>
      )}
    </div>
  );
}

/** Escobar's pinned cards, loaded only when there are some so Today's bundle stays small. */
function Pins() {
  const has = state.value.escobar.pins.length > 0;
  const [Comp, setComp] = useState<null | (() => preact.JSX.Element | null)>(null);
  useEffect(() => {
    if (has && !Comp) void import('@/escobar/ui/PinnedCards').then(m => setComp(() => m.PinnedCards)).catch(() => { /* offline chunk: skip */ });
  }, [has]);
  return has && Comp ? <Comp /> : null;
}

const BAND_LABEL = { green: 'Green', amber: 'Amber', red: 'Red' } as const;
const ADVICE_COPY = { normal: null, no_increase: 'Keep loads steady today — skip any increases.', reduce: 'Keep the load, but consider one fewer set.' } as const;

/** F2.1: a tier with reasons above "Current week", or a quiet connect/check-in prompt when there is nothing to show yet. */
function ReadinessCard() {
  const r = todayReadiness.value;
  if (!r) {
    return (
      <Section title="Readiness" palace="today.readiness">
        <Card class="card-quiet"><p class="small muted">No readiness yet.</p></Card>
      </Section>
    );
  }
  // QA8-2: once today's session is done, ADVICE_COPY's pre-workout wording no longer applies.
  const advice = r.postSessionAdvice ?? ADVICE_COPY[r.loadAdvice];
  return (
    <Section title="Readiness" palace="today.readiness">
      <Card class={r.band === 'red' ? 'card-accent' : ''}>
        <div class="row-between">
          <h2 style={{ margin: 0 }}>{BAND_LABEL[r.band]}{r.calibrating ? ' · calibrating' : ''}</h2>
          <span class="row" style={{ gap: 6 }}><span class="num small muted">{r.score}</span><AskAbout refTo={{ kind: 'readiness', id: 'today', label: 'Today’s readiness' }} /></span>
        </div>
        {r.drivers.length > 0 && <p class="small muted" style={{ marginTop: 6 }}>{r.drivers.join('. ')}.</p>}
        {advice && <p class="small" style={{ marginTop: 6 }}>{advice}</p>}
      </Card>
    </Section>
  );
}
