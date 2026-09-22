import { render } from 'preact';
import { App } from './app/App';
import { installThemeEngine } from './theme/engine';
import { bootSource, flushSave, initStore, state } from './core/store';
import { setHapticsEnabled } from './native/haptics';
import { showToast } from './app/toast';
import { resyncReminders } from './slices/settings/reminders';
import { onNotificationTap } from './native/notifications';
import { go } from './app/router';
import { beginHeartRateSession, initializeHeartRate } from './heart-rate/store';
import './ui/styles.css';

installThemeEngine();
initStore();
void initializeHeartRate().then(() => {
  const active = state.value.active;
  if (active) return beginHeartRateSession(active.id, active.startedAt);
}).catch(() => undefined);
setHapticsEnabled(state.value.preferences.haptics);

render(<App />, document.getElementById('app')!);

if (bootSource.value === 'legacy') {
  showToast(`Imported ${state.value.sessions.length} sessions from the previous version`);
}

// Keep unsaved work safe when the app goes to the background.
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });
window.addEventListener('pagehide', flushSave);
// Android may drop scheduled reminders; check and repair when we come back.
window.addEventListener('pageshow', () => { void resyncReminders(); });
void resyncReminders();

// Notification taps: rest done → Train, training day → Train.
onNotificationTap(() => go('train'));

if ('serviceWorker' in navigator && !(globalThis as { Capacitor?: unknown }).Capacitor) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => undefined); });
}
