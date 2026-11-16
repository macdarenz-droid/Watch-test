/**
 * Android back (R5.3, required with targetSdk 36's predictive back): the Escobar chat, then the
 * top sheet, then the open panel, then Today; on Today the app goes to the background.
 */
import { escobarUi, requestEscobarClose } from '@/escobar/state';
import { closePanel, go, openPanel, tab } from '@/app/router';
import { closeTopSheet } from '@/ui/sheetStack';
import { isNative } from './capacitor';

export type BackAction = 'escobar' | 'sheet' | 'panel' | 'today' | 'minimize';

/** Does one step of Back and says which. `minimize` is left to the caller. */
export function handleBack(): BackAction {
  if (escobarUi.value.open) { requestEscobarClose(); return 'escobar'; }
  if (closeTopSheet()) return 'sheet';
  if (openPanel.value) { closePanel(); return 'panel'; }
  if (tab.value !== 'today') { go('today'); return 'today'; }
  return 'minimize';
}

/** Call once, from main.tsx. No-op on the web, where the browser's Back reaches sheetStack. */
export async function installBackButton(): Promise<void> {
  if (!isNative()) return;
  try {
    const { App } = await import('@capacitor/app');
    await App.addListener('backButton', () => { if (handleBack() === 'minimize') void App.minimizeApp(); });
  } catch { /* plugin missing from this build: Android's default back stays */ }
}
