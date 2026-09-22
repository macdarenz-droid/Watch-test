import { useEffect, useMemo, useState } from 'preact/hooks';
import { Button, Card, Chip, Row, Sheet } from '@/ui/primitives';
import { IconHeart } from '@/ui/icons';
import { connectHeartRateDevice, disconnectHeartRate, heartRateDevices, heartRateNativeAvailable, heartRateStatus, latestHeartRate, recentHeartRate, requestHeartRatePermissions, scanHeartRateDevices } from './store';
import type { HeartRateSample } from './types';
import { freshness } from './metrics';
import { tracePoints } from './chart';

const LABEL = { unavailable: 'Unavailable', connecting: 'Connecting', live: 'Live', delayed: 'Delayed', lost: 'Signal lost' } as const;

export function HeartRateCard({ compact = false }: { compact?: boolean }) {
  const [setup, setSetup] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 1_000); return () => clearInterval(timer); }, []);
  const status = heartRateStatus.value;
  const latest = latestHeartRate.value;
  const fresh = status.state === 'unavailable' || status.state === 'connecting' || status.state === 'lost' ? status.state : freshness(latest, clock);
  const tone = fresh === 'live' ? 'positive' : fresh === 'delayed' ? 'warning' : fresh === 'lost' ? 'negative' : 'info';

  return (
    <>
      <Card class={`heart-rate-card ${compact ? 'compact' : ''}`}>
        <div class="row-between">
          <div class="heart-rate-value">
            <div class="eyebrow"><IconHeart size={14} /> Heart rate</div>
            <div><b class="num">{latest && fresh !== 'lost' ? latest.bpm : '—'}</b> <span class="hint">BPM</span></div>
            <span class="hint">{fresh === 'live' ? status.deviceName || 'Live sensor' : status.detail}</span>
          </div>
          <div class="stack-sm" style={{ justifyItems: 'end' }}>
            <Chip tone={tone}><i class="hr-status-dot" /> {LABEL[fresh]}</Chip>
            <Button variant="quiet" size="sm" onClick={() => setSetup(true)}>{status.state === 'live' ? 'Sensor' : 'Set up'}</Button>
          </div>
        </div>
        {!compact && <HeartRateTrend samples={recentHeartRate.value} />}
        {!compact && <p class="hint" style={{ marginTop: 8 }}>{fresh === 'live' ? 'Log how each set felt. Coach reviews your pulse alongside comparable workouts after saving.' : fresh === 'lost' ? 'Check watch fit and broadcast if you want to keep recording. Your workout log still saves.' : 'Record throughout the workout to give Coach more context.'}</p>}
      </Card>
      {setup && <HeartRateSetup onClose={() => setSetup(false)} />}
    </>
  );
}

function HeartRateTrend({ samples }: { samples: HeartRateSample[] }) {
  const path = useMemo(() => {
    if (samples.length < 2) return '';
    const now = samples[samples.length - 1]!.receivedAtEpochMs;
    const points = tracePoints(samples, now - 120_000, now + 1);
    const min = points.reduce((v, p) => Math.min(v, p.bpm), 260);
    const max = points.reduce((v, p) => Math.max(v, p.bpm), 20);
    return points.map(sample => {
      const command = sample.startsSegment ? 'M' : 'L';
      const x = Math.max(0, Math.min(300, 300 - (now - sample.receivedAtEpochMs) / 120_000 * 300));
      const y = 52 - (sample.bpm - min) / Math.max(1, max - min) * 44;
      return `${command}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }, [samples]);
  if (!path) return <div class="hr-chart-empty">The two-minute trend appears after two readings.</div>;
  return <svg class="hr-chart" viewBox="0 0 300 60" preserveAspectRatio="none" role="img" aria-label="Heart rate over the last two minutes"><path d={path} /></svg>;
}

function HeartRateSetup({ onClose }: { onClose: () => void }) {
  const status = heartRateStatus.value;
  const devices = heartRateDevices.value;
  const [busy, setBusy] = useState(false);
  const run = async (task: () => Promise<unknown>) => { setBusy(true); try { await task(); } finally { setBusy(false); } };
  return (
    <Sheet title="Heart-rate sensor" onClose={onClose}>
      <div class="stack">
        <Card class="card-quiet">
          <div class="eyebrow">{status.title}</div>
          <p class="small muted" style={{ marginTop: 6 }}>{status.detail}</p>
          {status.deviceName && <p class="hint" style={{ marginTop: 4 }}>{status.deviceName}{status.batteryPct != null ? ` · ${status.batteryPct}% battery` : ''}</p>}
        </Card>
        {!heartRateNativeAvailable() ? <p class="small muted">Live Bluetooth heart rate is available in the integrated Android app. Workouts remain fully usable here.</p> : (
          <>
            <div class="grid-2">
              <Button disabled={busy} onClick={() => run(requestHeartRatePermissions)}>Allow Bluetooth</Button>
              <Button variant="primary" disabled={busy || status.scanning} onClick={() => run(scanHeartRateDevices)}>{status.scanning ? 'Scanning…' : 'Scan for sensors'}</Button>
            </div>
            <div class="list">
              {devices.map(device => <Row key={device.id} trailing={<Button size="sm" disabled={busy} onClick={() => run(() => connectHeartRateDevice(device.id))}>Connect</Button>}><b class="small">{device.name}</b><div class="hint">{device.heartRateAdvertised ? 'Heart-rate broadcast' : device.bonded ? 'Paired device' : 'Bluetooth device'}</div></Row>)}
              {!devices.length && <p class="small muted">Enable HR Data Broadcasts on the watch, then scan. M/ARC cannot switch the watch broadcast on remotely.</p>}
            </div>
            {(status.state === 'live' || status.state === 'connecting' || status.deviceName) && <Button variant="danger" onClick={() => run(disconnectHeartRate)}>Disconnect sensor</Button>}
          </>
        )}
      </div>
    </Sheet>
  );
}
