/** The share sheet is its own chunk, fetched the first time a Share button is tapped (F12), like Escobar's sheet. */
import type { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { showToast } from '@/app/toast';
import type { ShareSheetProps } from './ShareSheet';

/** QA4-13: a chunk that failed once keeps failing until the app reloads, so the toast offers exactly that. */
export function shareLoadFailed(onClose: () => void): void {
  onClose();
  showToast('Could not load sharing.', 'Reload', () => location.reload());
}

export function ShareSheet(props: ShareSheetProps) {
  const [Comp, setComp] = useState<FunctionComponent<ShareSheetProps> | null>(null);
  useEffect(() => {
    let live = true;
    void import('./ShareSheet').then(m => { if (live) setComp(() => m.ShareSheet); }).catch(() => { if (live) shareLoadFailed(props.onClose); });
    return () => { live = false; };
  }, []);
  return Comp ? <Comp {...props} /> : null;
}
