import { signal } from '@preact/signals';

/** QA12-1: true once the index.html launch overlay (#launch) has left, or never existed. Gates
 * any auto-opening sheet, starting with OnboardingSheet in App.tsx — a modal <dialog> always
 * paints in the browser's top layer, above any z-index including #launch's, so an early sheet
 * would swallow the tap meant to skip the launch animation. */
export const launchOverlayGone = signal<boolean>(
  typeof document === 'undefined' || !document.getElementById('launch'),
);

if (typeof window !== 'undefined') {
  window.addEventListener('marclaunchgone', () => { launchOverlayGone.value = true; }, { once: true });
}
