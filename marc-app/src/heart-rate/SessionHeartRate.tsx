import { useEffect, useMemo, useState } from 'preact/hooks';
import { Card, Stat } from '@/ui/primitives';
import type { Session } from '@/core/models';
import { state } from '@/core/store';
import { heartRateContext, heartRateSessionEvidence } from '@/brain/heart-rate';
import { getHeartRateTrace } from './store';
import type { HeartRateTrace } from './types';
import { summarize } from './metrics';
import { TraceChart } from './TraceChart';

export function SessionHeartRate({ session, showAdvice = true }: { session: Session; showAdvice?: boolean }) {
  const [trace, setTrace] = useState<HeartRateTrace | null>(null);
  useEffect(() => { let live = true; setTrace(null); void getHeartRateTrace(session.id).then(value => { if (live) setTrace(value); }).catch(() => undefined); return () => { live = false; }; }, [session.id, session.heartRate]);
  const summary = useMemo(() => trace?.samples.length
    ? summarize(trace.samples, Date.parse(session.startedAt), Date.parse(session.endedAt))
    : session.heartRate, [trace, session]);
  const recorded = { ...session, heartRate: summary };
  const evidence = heartRateSessionEvidence(recorded, Date.parse(session.endedAt) + 1);
  const context = heartRateContext([...state.value.sessions.filter(s => s.id !== session.id && Date.parse(s.endedAt) <= Date.parse(session.endedAt)), recorded], Date.parse(session.endedAt) + 1);
  if (!summary?.sampleCount && !trace?.samples.length) return null;
  return (
    <Card class="card-quiet hr-session-summary">
      <div class="eyebrow">Recorded heart rate · {evidence.quality === 'eligible' ? 'usable for comparison' : 'limited context'}</div>
      <div class="grid-3" style={{ marginTop: 8 }}>
        <Stat value={evidence.averageBpm ?? '—'} label="average bpm" />
        <Stat value={evidence.peakBpm ?? '—'} label="recorded peak" />
        <Stat value={evidence.coveragePct != null ? `${evidence.coveragePct}%` : '—'} label="capture coverage" />
      </div>
      {evidence.coveragePct != null && <div class="watch-capture" aria-label={`${evidence.coveragePct}% of elapsed workout time captured`}><i style={{ width: `${evidence.coveragePct}%` }} /></div>}
      <p class="hint">{evidence.reason}</p>
      {!!summary?.gapCount && <p class="hint" style={{ marginTop: 8 }}>{summary.gapCount} signal gap{summary.gapCount === 1 ? '' : 's'} over 15 seconds.</p>}
      {!!trace?.samples.length && <TraceChart samples={trace.samples} session={session} />}
      {showAdvice && context.observation && <p class="small" style={{ marginTop: 12 }}>{context.observation}</p>}
      {showAdvice && context.state === 'ready' && <p class="hint" style={{ marginTop: 6 }}>{context.advice}</p>}
    </Card>
  );
}
