import { goTo, spotlight } from './navigate';
import { PALACE } from './registry';
import { currentFocus } from './focus';
import { escobarUi, loopView } from '../state';
import { openEscobar, openAndSend } from '../ui/open';
import { latestMeasurement, watchStatus, watchSupported } from '@/native/watch';

/** Test hooks for the gate, only when `localStorage['marc.dev'] === '1'` (§23 EV1). */
export function installPalaceDevHooks(): void {
  try {
    if (typeof window === 'undefined' || localStorage.getItem('marc.dev') !== '1') return;
    (window as unknown as { __palace: unknown }).__palace = {
      goTo, spotlight, ids: PALACE.map(p => p.id), anchors: Object.fromEntries(PALACE.map(p => [p.id, p.target.anchor ?? p.id])),
      focus: () => currentFocus.value,
    };
    // Fake a live watch reading so the heart line can be screenshotted.
    (window as unknown as { __pulse: unknown }).__pulse = (bpm: number) => {
      watchSupported.value = true;
      watchStatus.value = { state: 'connected', freshness: 'LIVE', deviceName: 'Gate watch', message: 'Live' } as typeof watchStatus.value;
      latestMeasurement.value = { bpm, contact: true, rrMs: [], energyKj: null, receivedAtEpochMs: Date.now(), receivedAtElapsedMs: 0 };
    };
    (window as unknown as { __escobar: unknown }).__escobar = { open: openEscobar, send: openAndSend, ui: () => escobarUi.value, status: () => loopView.value.status };
  } catch { /* storage blocked: no hooks */ }
}
