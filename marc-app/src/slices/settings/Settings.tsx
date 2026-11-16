import { useState } from 'preact/hooks';
import { bootSource, flushSave, replaceState, state, update } from '@/core/store';
import { freshState, type AppState } from '@/core/models';
import { Button, Card, Field, Row, Section, Sheet, Toggle } from '@/ui/primitives';
import { THEMES, THEME_IDS } from '@/theme/themes';
import { setTheme, themeId } from '@/theme/engine';
import { haptic, hapticSupport, setHapticsEnabled } from '@/native/haptics';
import { exportText, pickFile } from '@/native/share';
import { showToast } from '@/app/toast';
import { reminderHealth, resyncReminders } from './reminders';
import { healthAvailable, readHealth } from '@/native/health';
import { asLegacyRoot, convertLegacy } from '@/core/migrate';
import { Logo } from '@/ui/Logo';
import { beginHeartRateSession, exportAllHeartRate, importAllHeartRate, refreshHeartRateSummaries, resetAllHeartRate } from '@/heart-rate/store';
import { prepareHeartRateRestore } from '@/heart-rate/backup';
import type { HeartRateTrace } from '@/heart-rate/types';

export const APP_VERSION = '39.0.0';

export function Settings({ onClose }: { onClose: () => void }) {
  const s = state.value;
  const p = s.preferences;
  const [confirmReset, setConfirmReset] = useState(false);
  const setPref = (patch: Partial<AppState['preferences']>) => update(x => ({ ...x, preferences: { ...x.preferences, ...patch } }));

  const backup = async () => {
    flushSave();
    const name = `marc-backup-${new Date().toISOString().slice(0, 10)}.json`;
    try {
      const heartRate = await exportAllHeartRate();
      showToast(await exportText(name, JSON.stringify({ app: 'M/ARC', version: APP_VERSION, exportedAt: new Date().toISOString(), state: s, heartRate }, null, 1)));
    } catch { showToast('Export failed'); }
  };
  const restore = async () => {
    const text = await pickFile();
    if (!text) return;
    try {
      const parsed = JSON.parse(text) as ({ state?: AppState; heartRate?: { version: 1; traces: HeartRateTrace[] } } | AppState);
      const legacy = asLegacyRoot(parsed);
      if (legacy) {
        // A backup from the previous version of the app: convert it on the way in.
        const converted = convertLegacy(legacy);
        await importAllHeartRate({ version: 1, traces: [], replace: true });
        replaceState(converted);
        showToast(`Imported ${converted.sessions.length} sessions from the old backup`);
        return;
      }
      const next = 'state' in parsed && parsed.state ? parsed.state : (parsed as AppState);
      if (next.version !== 1 || !Array.isArray(next.sessions)) throw new Error('bad');
      const restored = prepareHeartRateRestore(next.sessions, 'heartRate' in parsed && parsed.heartRate ? parsed.heartRate : undefined, next.active);
      await importAllHeartRate(restored.payload);
      replaceState({ ...next, sessions: restored.sessions, health: { connected: false } });
      if (state.value.active) await beginHeartRateSession(state.value.active.id, state.value.active.startedAt).catch(() => undefined);
      await refreshHeartRateSummaries();
      showToast(`Restored ${next.sessions.length} sessions`);
    } catch { showToast('Restore failed. Check the backup and try again.'); }
  };

  return (
    <Sheet title="Settings" onClose={onClose}>
      <div class="stack">
        <Section title="Theme">
          <div class="theme-grid">
            {THEME_IDS.map(id => { const t = THEMES[id]; const k = t.tokens; return (
              <button type="button" key={id} class="theme-card" aria-pressed={themeId.value === id} onClick={() => { setTheme(id); void haptic.light(); }}>
                <div class="theme-preview" style={{ background: k.bg }}><i style={{ top: 8, width: '55%', background: k.text, opacity: .9 }} /><i style={{ top: 22, background: k.surface3 }} /><i style={{ top: 36, width: 40, background: k.accent }} /></div>
                <div><b class="small">{t.name}</b><div class="hint">After {t.inspiredBy}</div></div>
              </button>
            ); })}
          </div>
        </Section>

        <Section title="Training">
          <Card>
            <Row trailing={<div class="seg" style={{ width: 120 }}><button type="button" aria-pressed={p.weightUnit === 'kg'} onClick={() => setPref({ weightUnit: 'kg' })}>kg</button><button type="button" aria-pressed={p.weightUnit === 'lb'} onClick={() => setPref({ weightUnit: 'lb' })}>lb</button></div>}><span class="small">Weight unit</span></Row>
            <Row trailing={<Toggle checked={p.autoRest} onChange={v => setPref({ autoRest: v })} label="Automatic rest timer" />}><span class="small">Start rest after each set</span></Row>
            <Row trailing={<div class="row"><Button variant="quiet" size="sm" onClick={() => setPref({ restDefaultSec: Math.max(15, p.restDefaultSec - 15) })}>−15</Button><b class="num small">{p.restDefaultSec}s</b><Button variant="quiet" size="sm" onClick={() => setPref({ restDefaultSec: Math.min(600, p.restDefaultSec + 15) })}>+15</Button></div>}><span class="small">Rest length</span></Row>
            <Row trailing={<Toggle checked={p.showSpark} onChange={v => setPref({ showSpark: v })} label="Daily quote" />}><span class="small">Daily quote on Today</span></Row>
          </Card>
        </Section>

        <Section title="Reminders">
          <Card>
            <Row trailing={<Toggle checked={p.reminders.enabled} onChange={v => { setPref({ reminders: { ...p.reminders, enabled: v } }); void resyncReminders(); }} label="Training day reminders" />}><span class="small">Training day reminder</span><div class="hint">{reminderHealth.value.status}</div></Row>
            <Row trailing={<input type="time" style={{ width: 120 }} value={p.reminders.time} onChange={e => { setPref({ reminders: { ...p.reminders, time: (e.target as HTMLInputElement).value } }); void resyncReminders(); }} />}><span class="small">Time</span></Row>
            <Row trailing={<select style={{ width: 120 }} value={p.reminders.style} onChange={e => { setPref({ reminders: { ...p.reminders, style: (e.target as HTMLSelectElement).value as never } }); void resyncReminders(); }}><option value="silent">Silent</option><option value="vibrate">Vibrate</option><option value="alert">Alert</option></select>}><span class="small">Style</span></Row>
            <p class="hint">Your choice stays on even if Android drops the queue. The app re-checks and repairs it when you come back.</p>
          </Card>
        </Section>

        <Section title="Feedback">
          <Card>
            <Row trailing={<Toggle checked={p.haptics} onChange={v => { setPref({ haptics: v }); setHapticsEnabled(v); }} label="Haptic feedback" />}><span class="small">Haptic feedback</span><div class="hint">{hapticSupport() === 'native' ? 'Android haptics' : hapticSupport() === 'web' ? 'Browser vibration' : 'No vibration on this device'}</div></Row>
            <Button size="sm" onClick={() => { void haptic.warning(); showToast('Sent a test buzz'); }}>Test haptic</Button>
          </Card>
        </Section>

        <Section title="Profile">
          <Card class="stack-sm">
            <Field label="Name"><input value={s.profile.name} maxLength={30} onInput={e => update(x => ({ ...x, profile: { ...x.profile, name: (e.target as HTMLInputElement).value } }))} /></Field>
            <div class="grid-2">
              <Field label="Body weight (kg)"><input type="number" value={s.profile.bodyWeightKg ?? ''} onInput={e => update(x => ({ ...x, profile: { ...x.profile, bodyWeightKg: parseFloat((e.target as HTMLInputElement).value) || undefined } }))} /></Field>
              <Field label="Height (cm)"><input type="number" value={s.profile.heightCm ?? ''} onInput={e => update(x => ({ ...x, profile: { ...x.profile, heightCm: parseFloat((e.target as HTMLInputElement).value) || undefined } }))} /></Field>
            </div>
          </Card>
        </Section>

        <Section title="Health">
          <Card>
            <Row trailing={healthAvailable() ? <Button size="sm" onClick={async () => { const h = await readHealth(); update(x => ({ ...x, health: h })); showToast(h.connected ? 'Health data updated' : 'Could not read Health Connect'); }}>Sync</Button> : undefined}><span class="small">Android Health Connect</span><div class="hint">{healthAvailable() ? (s.health.connected ? `Last sync ${s.health.lastSync?.slice(0, 16).replace('T', ' ')}` : 'Not connected') : 'Available in the Android app'}</div></Row>
          </Card>
        </Section>

        <Section title="Your data">
          <Card class="stack-sm">
            <div class="grid-2"><Button onClick={backup}>Export backup</Button><Button onClick={restore}>Restore backup</Button></div>
            <p class="hint">Everything stays on this device. {s.legacyImportedAt ? 'Your history from the previous version was imported automatically.' : ''} Loaded from: {bootSource.value}.</p>
            {!confirmReset ? <Button variant="danger" onClick={() => setConfirmReset(true)}>Reset workout data</Button> : (
              <Card class="card-quiet"><p class="small">Delete all sessions, heart-rate samples, splits and settings on this device? Export a backup first if unsure.</p><div class="row" style={{ marginTop: 10 }}><Button variant="quiet" onClick={() => setConfirmReset(false)}>Keep</Button><Button variant="danger" onClick={() => { void resetAllHeartRate().then(() => { replaceState(freshState()); setConfirmReset(false); showToast('Workout and heart-rate data reset'); void haptic.warning(); }).catch(() => showToast('Reset failed. Your workout history was kept.')); }}>Reset everything</Button></div></Card>
            )}
          </Card>
        </Section>
        <div class="stack-sm" style={{ justifyItems: 'center', paddingTop: 8 }}><Logo height={30} /><span class="hint">Version {APP_VERSION}</span></div>
      </div>
    </Sheet>
  );
}
