/**
 * A render error inside the app shows this card instead of a blank screen (ST-02, RG-01).
 * The data stays on the device; the card offers a reload and a rescue copy. QA-R1-8: a state that
 * crashes on every render would make Reload loop, so the card also offers the start-up screen's
 * reset (after a confirm), the only other way out.
 */
import { Component, type ComponentChildren } from 'preact';
import { buildRescueJson, saveRescueFile } from '@/core/rescue';
import { exportText } from '@/native/share';
import { stopSaving } from '@/core/store';
import { HOLD_CONFIRM_MS } from '@/ui/gesture';
import { reportCaught } from '@/errors';

export async function saveRescueCopy(): Promise<void> {
  const text = buildRescueJson();
  try { await exportText('marc-rescue.json', text); } catch { await saveRescueFile(text); }
}

/**
 * The same wipe as the start-up crash screen in index.html: every stored key and the photo database.
 * Saving stops first, so the save on unload cannot write the crashing state back (QA2-FB-1).
 */
export function resetAppData(storage: Pick<Storage, 'clear'> = localStorage, idb: Pick<IDBFactory, 'databases' | 'deleteDatabase'> | undefined = globalThis.indexedDB): void {
  stopSaving();
  try { storage.clear(); } catch { /* storage unavailable */ }
  try { void idb?.databases?.().then(dbs => dbs.forEach(d => { if (d.name) idb.deleteDatabase(d.name); })).catch(() => {}); } catch { /* no IndexedDB */ }
}

/**
 * F10: this card renders after a crash, outside preact's normal hook-managed tree (QA-R1-8's own
 * test drives it via a bare `.render()`, not a mount), so the hold-to-confirm control is written
 * as class instance state instead of reusing the hooks-based HoldButton in src/ui/primitives.tsx.
 */
export class ErrorBoundary extends Component<{ children?: ComponentChildren }, { error: unknown; holding: boolean; armed: boolean }> {
  override state = { error: null as unknown, holding: false, armed: false };
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private holdCompleted = false;
  private armedTimer: ReturnType<typeof setTimeout> | null = null;

  override componentDidCatch(error: unknown): void {
    console.error('render failed', error);
    reportCaught('boundary', error);
    this.setState({ error });
  }

  override componentWillUnmount(): void {
    if (this.holdTimer) clearTimeout(this.holdTimer);
    if (this.armedTimer) clearTimeout(this.armedTimer);
  }

  private confirmReset = (): void => {
    resetAppData();
    location.reload();
  };

  private startHold = (): void => {
    if (this.holdTimer) return;
    this.holdCompleted = false;
    this.setState({ holding: true });
    this.holdTimer = setTimeout(() => { this.holdTimer = null; this.holdCompleted = true; this.setState({ holding: false }); this.confirmReset(); }, HOLD_CONFIRM_MS);
  };

  private cancelHold = (): void => {
    if (this.holdTimer) { clearTimeout(this.holdTimer); this.holdTimer = null; }
    this.setState({ holding: false });
  };

  /** Twin for TalkBack/keyboard-without-hold: a tap arms "Tap again to confirm" for 3s. */
  private armTap = (): void => {
    if (this.armedTimer) { clearTimeout(this.armedTimer); this.armedTimer = null; }
    if (this.state.armed) { this.setState({ armed: false }); this.confirmReset(); return; }
    this.setState({ armed: true });
    this.armedTimer = setTimeout(() => { this.armedTimer = null; this.setState({ armed: false }); }, 3000);
  };

  /** A synthesized activation (TalkBack) carries no pointer, so detail is 0. A real keyboard tap
   * is handled by onKeyUp instead (preventDefault in onKeyDown stops its own click). */
  private onHoldClick = (e: MouseEvent): void => {
    if (e.detail !== 0) return;
    this.armTap();
  };

  private onHoldKeyUp = (e: KeyboardEvent): void => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    if (this.holdCompleted) { this.holdCompleted = false; return; }
    this.cancelHold();
    this.armTap();
  };

  render() {
    if (this.state.error == null) return this.props.children;
    const { holding, armed } = this.state;
    return (
      <div class="app">
        <div class="card stack-sm" role="alert" style={{ margin: 16 }}>
          <b>Screen error</b>
          <p class="small">Your data is still on this device.</p>
          <div class="grid-2">
            <button type="button" class="btn btn-primary" onClick={() => location.reload()}>Reload</button>
            <button type="button" class="btn" onClick={() => void saveRescueCopy()}>Save a copy of my data</button>
          </div>
          {/* QA10-4: the hold button alone doesn't say what it deletes, unlike the confirm() it replaced. */}
          <p class="hint">Deletes every workout on this device.</p>
          <button
            type="button"
            class={`btn btn-danger hold ${holding ? 'holding' : ''}`}
            style={{ '--hold-ms': `${HOLD_CONFIRM_MS}ms` }}
            aria-label={armed ? 'Tap again to confirm' : 'Hold to delete everything, press and hold'}
            onPointerDown={this.startHold}
            onPointerUp={this.cancelHold}
            onPointerLeave={this.cancelHold}
            onPointerCancel={this.cancelHold}
            onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); this.startHold(); } }}
            onKeyUp={this.onHoldKeyUp}
            onClick={this.onHoldClick}
          >{armed ? 'Tap again to confirm' : 'Hold to delete everything'}</button>
        </div>
      </div>
    );
  }
}
