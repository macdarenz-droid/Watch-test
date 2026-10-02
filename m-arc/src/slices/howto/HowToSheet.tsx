// The How-to sheet (HT-3, plan 2.4): the app's Sheet with the eyebrow HOWTO_LABEL and the exercise name, then the
// golden block (PlateView), then the section registry. Every open starts at S0 and nothing is stored.
import { useEffect, useState } from 'preact/hooks';
import { Sheet } from '@/ui/primitives';
import { HOWTO_LABEL, hasHowTo } from '@/howto/ids';
import type { BuiltHowTo } from '@/howto/types';
import { howToLoadFailed } from './lazy';
import { PlateApiContext, PlateView } from './PlateView';
import type { PlateApi } from './usePlateState';
import { SECTIONS } from './sections';
import './css/plate.css';
import './css/sheet.css';

export interface HowToSheetProps {
  readonly exerciseId: string;
  readonly name: string;
  readonly onClose: () => void;
}

export function HowToSheet({ exerciseId, name, onClose }: HowToSheetProps) {
  const [howTo, setHowTo] = useState<BuiltHowTo | null>(null);
  const [api, setApi] = useState<PlateApi | null>(null);
  useEffect(() => {
    let live = true;
    // generated/** is reached only through import() (D-HT1 A4); the data is in before the sheet slides in
    if (!hasHowTo(exerciseId)) { howToLoadFailed(onClose); return; }
    void import('@/howto/generated').then(m => m.LOADERS[exerciseId]()).then(m => { if (live) setHowTo(m.default); }).catch(() => { if (live) howToLoadFailed(onClose); });
    return () => { live = false; };
  }, []);
  if (!howTo) return null;
  return (
    <Sheet class="ht" eyebrow={HOWTO_LABEL} title={name} onClose={onClose}>
      <PlateView howTo={howTo} onApi={setApi} />
      <PlateApiContext.Provider value={api}>
        {SECTIONS.map(s => <section key={s.id} data-section={s.id}><s.Component howTo={howTo} /></section>)}
      </PlateApiContext.Provider>
    </Sheet>
  );
}
