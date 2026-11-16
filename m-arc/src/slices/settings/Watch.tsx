import { useEffect, useState } from 'preact/hooks';
import { state, update } from '@/core/store';
import { Button, Card, Row, Sheet, Toggle } from '@/ui/primitives';
import { watchStatus, scannedDevices, scanForWatch, stopWatchScan, connectWatch, disconnectWatch, watchPermissionHint, watchPermissionState, requestWatchPermissions, watchDiagnostics } from '@/native/watch';
import { showToast } from '@/app/toast';

/** Connect, forget, and auto-connect (6.5): reused from Train's live pill and Settings. */
export function WatchSheet({ onClose }: { onClose: () => void }) {
  const s = state.value;
  const w = s.preferences.watch;
  const status = watchStatus.value;
  // UI-07: the plugin's own state is the truth; the local flag only covers the tap → first status gap.
  const [localScanning, setLocalScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [denied, setDenied] = useState(false);
  const [needsLocation, setNeedsLocation] = useState(false);
  const scanning = status.state === 'scanning' || localScanning;
  const devices = scannedDevices.value;

  useEffect(() => () => { if (watchStatus.peek().state === 'scanning') void stopWatchScan(); }, []);
  useEffect(() => { void watchPermissionState().then(p => { if (p) setNeedsLocation(p.needsLocation); }); }, []);

  const startScan = async () => {
    setDenied(false);
    const perm = await watchPermissionState();
    if (perm) setNeedsLocation(perm.needsLocation);
    if (perm && !perm.granted) {
      const granted = await requestWatchPermissions();
      if (!granted) { setDenied(true); return; }
    }
    setLocalScanning(true);
    setScanned(true);
    try { await scanForWatch(); } finally { setLocalScanning(false); }
  };

  const pick = async (address: string, name: string) => {
    await stopWatchScan();
    update(x => ({ ...x, preferences: { ...x.preferences, watch: { ...x.preferences.watch, deviceAddress: address, deviceName: name } } }));
    await connectWatch(address);
  };

  const forget = async () => {
    await disconnectWatch();
    update(x => ({ ...x, preferences: { ...x.preferences, watch: { autoConnectOnSession: x.preferences.watch.autoConnectOnSession } } }));
  };

  const copyDiagnostics = async () => {
    const text = await watchDiagnostics();
    if (!text) { showToast('No watch diagnostics on this device'); return; }
    try { await navigator.clipboard.writeText(text); showToast('Watch diagnostics copied'); } catch { showToast('Could not copy'); }
  };

  return (
    <Sheet title="Watch" onClose={onClose} palace="panel.watch">
      <div class="stack">
        <p class="small muted">{status.message}</p>
        {status.state === 'connected' ? (
          <Row trailing={<Button size="sm" variant="danger" onClick={() => void disconnectWatch()}>Disconnect</Button>}><span class="small">{status.deviceName ?? w.deviceName ?? 'Connected'}</span></Row>
        ) : (
          <Button variant="primary" block onClick={startScan} disabled={scanning}>{scanning ? 'Scanning…' : 'Scan for a watch'}</Button>
        )}
        {(denied || status.state === 'permission') && <p class="hint">{watchPermissionHint(needsLocation)}</p>}
        {(scanning || devices.length > 0) && (
          <div class="stack-sm">
            {devices.map(d => (
              <Card key={d.address} class="card-press" onClick={() => pick(d.address, d.name)}>
                <b class="small">{d.name}</b>
                <div class="hint">{d.advertisesHeartRate ? 'Heart-rate broadcast' : d.paired ? 'Paired · not yet checked' : 'Nearby · not yet checked'}</div>
              </Card>
            ))}
          </div>
        )}
        {scanned && !scanning && devices.length === 0 && !denied && <p class="small muted">No watch found. Turn on heart-rate broadcast on the watch, then scan again.</p>}
        {w.deviceAddress && <Row trailing={<Button size="sm" variant="quiet" onClick={forget}>Forget watch</Button>}><span class="small">{w.deviceName ?? 'Saved watch'}</span></Row>}
        <Row trailing={<Toggle checked={w.autoConnectOnSession} onChange={v => update(x => ({ ...x, preferences: { ...x.preferences, watch: { ...x.preferences.watch, autoConnectOnSession: v } } }))} label="Auto-connect when a session starts" />}><span class="small">Auto-connect when a session starts</span></Row>
        <Button variant="quiet" size="sm" onClick={copyDiagnostics}>Copy watch diagnostics</Button>
        <p class="hint">Watch readings stay on this phone. Session heart rate goes to Escobar only if Share health data is on.</p>
      </div>
    </Sheet>
  );
}
