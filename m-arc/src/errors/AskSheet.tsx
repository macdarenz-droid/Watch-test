/**
 * 7.5: the one-time ask, shown by App.tsx when errorReportsAskTrigger is true. A plain in-flow
 * banner, not a modal — it must never block a tap on anything else on the page (nav, other
 * banners), unlike a Sheet's backdrop would.
 */
import { update } from '@/core/store';
import { haptic } from '@/native/haptics';

function answer(yes: boolean): void {
  update(s => ({ ...s, preferences: { ...s.preferences, errorReports: yes, errorReportsAsked: true } }));
  void haptic.confirm();
}

export function ErrorReportsAskSheet() {
  return (
    <div class="banner" role="status" data-palace="errors.ask" style={{ marginBottom: 12 }}>
      <p class="small">Send anonymous error reports if something breaks?</p>
      <div class="grid-2" style={{ marginTop: 8 }}>
        <button type="button" class="btn btn-quiet btn-sm" onClick={() => answer(false)}>No thanks</button>
        <button type="button" class="btn btn-primary btn-sm" onClick={() => answer(true)}>Yes, send reports</button>
      </div>
    </div>
  );
}
