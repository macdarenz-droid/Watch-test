/** Settings → Health diagnostic (UI-16, RG-18): why the last Health Connect sync gave nothing. */
import { Button, Row, Sheet } from '@/ui/primitives';
import { lastHealthError, openHealthPermissions } from '@/native/health';

const TYPE_LABEL: Record<string, string> = { READ_STEPS: 'Steps', READ_SLEEP: 'Sleep', READ_HEART_RATE: 'Heart rate', READ_ACTIVE_CALORIES_BURNED: 'Active calories', READ_RESTING_HEART_RATE: 'Resting heart rate' };

export function HealthDiagnosticSheet({ onClose }: { onClose: () => void }) {
  const e = lastHealthError;
  const r = e?.raw;
  const values: Array<[string, string]> = r ? [
    ['Steps', r.steps ? String(r.steps) : '—'],
    ['Sleep', r.sleepMinutes ? `${r.sleepMinutes} min` : '—'],
    ['Resting heart rate', r.restingHR ? `${r.restingHR} bpm` : '—'],
    ['Latest heart rate', r.workoutHR ? `${r.workoutHR} bpm` : '—'],
    ['Active calories', r.activeCalories ? `${r.activeCalories} kcal` : '—'],
  ] : [];
  return (
    <Sheet title="Health diagnostic" onClose={onClose} palace="settings.health-diagnostic">
      <div class="stack-sm">
        <p class="small">{e?.message ?? 'The last sync worked.'}</p>
        <Row><span class="small">Permission</span><div class="hint">{e?.needsPermission ? 'Not granted' : e && e.missing.length ? 'Partly granted' : 'Granted'}</div></Row>
        {!!e?.missing.length && <Row><span class="small">Not allowed</span><div class="hint">{e.missing.map(m => TYPE_LABEL[m] ?? m).join(', ')}</div></Row>}
        {!!e?.failed.length && <Row><span class="small">Failed to read</span><div class="hint">{e.failed.join(', ')}</div></Row>}
        {values.map(([k, v]) => <Row key={k}><span class="small">{k}</span><div class="hint">{v}</div></Row>)}
        <Button onClick={() => void openHealthPermissions()}>Open Health Connect permissions</Button>
      </div>
    </Sheet>
  );
}
