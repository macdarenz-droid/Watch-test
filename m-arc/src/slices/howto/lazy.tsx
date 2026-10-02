/** The How-to sheet is its own chunk, fetched the first time the How-to entry is tapped (HT-3), like the share sheet. */
import type { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { showToast } from '@/app/toast';
import type { HowToSheetProps } from './HowToSheet';

/** A chunk that failed once keeps failing until the app reloads, so the toast offers exactly that (QA4-13). */
export function howToLoadFailed(onClose: () => void): void {
  onClose();
  showToast('Could not load the guide.', 'Reload', () => location.reload());
}

export function HowToSheet(props: HowToSheetProps) {
  const [Comp, setComp] = useState<FunctionComponent<HowToSheetProps> | null>(null);
  useEffect(() => {
    let live = true;
    void import('./HowToSheet').then(m => { if (live) setComp(() => m.HowToSheet); }).catch(() => { if (live) howToLoadFailed(props.onClose); });
    return () => { live = false; };
  }, []);
  return Comp ? <Comp {...props} /> : null;
}
