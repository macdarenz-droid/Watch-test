import { useState } from 'preact/hooks';
import { state } from '@/core/store';
import { watchContext } from '@/app/selectors';
import { go } from '@/app/router';
import { heartRateContext } from '@/brain/heart-rate';
import { Button, Card, Chip, Section } from '@/ui/primitives';
import { formatDay } from '@/core/dates';
import { SessionHeartRate } from './SessionHeartRate';

/** The same evidence appears in Coach, Today, and History; no screen has its own rules. */
export function WatchInsights({ compact = false }: { compact?: boolean }) {
  const current = watchContext.value;
  const [selected, setSelected] = useState<string | null>(null);
  const session = selected ? state.value.sessions.find(s => s.id === selected) : current.latest;
  const context = session && selected
    ? heartRateContext(state.value.sessions.filter(s => Date.parse(s.endedAt) <= Date.parse(session.endedAt)), Date.parse(session.endedAt) + 1)
    : current;
  const comparison = context.baselineMedianBpm != null && context.deltaBpm != null;
  if (compact && !current.recordedCount) return null;
  return (
    <Section title="Watch insights" aside={compact
      ? <Button variant="quiet" size="sm" onClick={() => go('coach')}>Explore</Button>
      : <Chip tone={context.state === 'ready' ? 'info' : undefined}>{context.state === 'ready' ? 'Comparison ready' : context.state === 'limited' ? 'Limited signal' : 'Building context'}</Chip>}>
      <Card class="watch-insights" data-testid="watch-insights" data-state={context.state}>
        <div class="eyebrow">{context.latest ? context.latest.splitName : 'Heart rate + your workout log'}</div>
        <h3 style={{ margin: '6px 0' }}>{context.observation || context.reason}</h3>
        <p class="small muted">{context.advice}</p>
        {comparison && (
          <div class="watch-comparison" aria-label="Similar workout comparison">
            <div><b class="num">{context.latestEvidence?.averageBpm}</b><span>latest average BPM</span></div>
            <div><b class="num">{context.baselineMedianBpm}</b><span>usual · {context.baselineCount} matches</span></div>
            <div><b class="num">{context.deltaBpm! > 0 ? '+' : ''}{context.deltaBpm}</b><span>BPM difference</span></div>
          </div>
        )}
        {comparison && <p class="hint" style={{ marginTop: 8 }}>Logged effort: {context.effort.direction === 'unknown' ? 'more ratings needed for comparison' : context.effort.direction}.</p>}
        {!compact && <>
          <p class="hint" style={{ marginTop: 12 }}>{context.reason}</p>
          {current.recent.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div class="eyebrow">Recent sessions · average BPM</div>
              <p class="hint">Select a session to inspect its evidence. Outlined points have limited data.</p>
              <RecentPulseChart points={current.recent} selected={session?.id} onSelect={setSelected} />
              <div class="watch-session-picker" aria-label="Choose watch session">
                {current.recent.map(point => <button type="button" key={point.sessionId} aria-pressed={session?.id === point.sessionId}
                  aria-label={`Inspect ${point.splitName} on ${point.day}`} onClick={() => setSelected(point.sessionId)}>
                  <span>{formatDay(point.day, { month: 'short', day: 'numeric' })}</span>
                  <b>{point.averageBpm ?? '—'} <small>BPM</small></b>
                </button>)}
              </div>
            </div>
          )}
          {session && <SessionHeartRate key={session.id} session={session} showAdvice={false} />}
          <details class="watch-method">
            <summary>How watch insights work</summary>
            <p>Coach compares the same exercises and loads with similar volume and duration, using at least three earlier recordings from the past six weeks. It checks signal coverage before comparing.</p>
            <p>Heart rate adds context to your effort ratings. Differences can reflect rests, movement, conditions, or the sensor. A lower pulse alone does not prove better fitness, and a higher pulse does not prove poor recovery.</p>
            <p>Capture coverage is the share of elapsed workout time represented by usable readings, allowing at most five seconds per reading. Comparisons need 70% coverage and three captured minutes. These are data-quality rules, not health thresholds. Pauses remain part of the recording.</p>
            <p>Load progression and muscle recovery still use your logged performance and effort. Watch readings do not automatically change weights, rest timers, calories, or training zones.</p>
          </details>
        </>}
      </Card>
    </Section>
  );
}

type Point = ReturnType<typeof heartRateContext>['recent'][number];
function RecentPulseChart({ points, selected, onSelect }: { points: Point[]; selected?: string; onSelect: (id: string) => void }) {
  const values = points.flatMap(p => p.averageBpm == null ? [] : [p.averageBpm]);
  if (!values.length) return null;
  const low = Math.floor((Math.min(...values) - 10) / 10) * 10;
  const high = Math.ceil((Math.max(...values) + 10) / 10) * 10;
  const x = (i: number) => 40 + i / Math.max(1, points.length - 1) * 268;
  const y = (v: number) => 116 - (v - low) / Math.max(20, high - low) * 88;
  return (
    <svg class="watch-history-chart" viewBox="0 0 336 154" role="img" aria-label="Average heart rate by recent workout; use the session buttons below for details">
      {[low, Math.round((low + high) / 2), high].map(v => <g key={v}>
        <line x1="36" x2="318" y1={y(v)} y2={y(v)} class="chart-grid" />
        <text x="30" y={y(v) + 4} text-anchor="end">{v}</text>
      </g>)}
      {points.map((p, i) => p.averageBpm == null ? null : <g key={p.sessionId} onClick={() => onSelect(p.sessionId)}>
        <circle cx={x(i)} cy={y(p.averageBpm)} r={selected === p.sessionId ? 6 : 4}
          fill={p.eligible ? 'var(--accent)' : 'var(--surface-1)'} stroke="var(--accent)" stroke-width="2" />
        <title>{p.day}: {p.averageBpm} BPM; {p.coveragePct ?? 'unknown'}% coverage. {p.reason}</title>
      </g>)}
      <text x="38" y="144">{points[0]?.day.slice(5)}</text>
      <text x="316" y="144" text-anchor="end">{points.at(-1)?.day.slice(5)}</text>
    </svg>
  );
}
