import { useEffect, useState } from 'preact/hooks';
import { Card, Stat } from '@/ui/primitives';
import type { Session } from '@/core/models';
import { getHeartRateTrace } from './store';
import type { HeartRateTrace } from './types';

export function SessionHeartRate({ session }: { session: Session }) {
  const [trace, setTrace] = useState<HeartRateTrace | null>(null);
  useEffect(() => { let live = true; void getHeartRateTrace(session.id).then(value => { if (live) setTrace(value); }).catch(() => undefined); return () => { live = false; }; }, [session.id]);
  const summary = trace?.summary ?? session.heartRate;
  if (!summary?.sampleCount) return null;
  return (
    <Card class="card-quiet hr-session-summary">
      <div class="eyebrow">Recorded heart rate</div>
      <div class="grid-3" style={{ marginTop: 8 }}>
        <Stat value={summary.averageBpm ?? '—'} label="average bpm" />
        <Stat value={summary.recordedPeakBpm ?? '—'} label="recorded peak" />
        <Stat value={summary.coveragePct != null ? `${summary.coveragePct}%` : '—'} label="coverage" />
      </div>
      {!!summary.gapCount && <p class="hint" style={{ marginTop: 8 }}>{summary.gapCount} signal gap{summary.gapCount === 1 ? '' : 's'} recorded.</p>}
    </Card>
  );
}
