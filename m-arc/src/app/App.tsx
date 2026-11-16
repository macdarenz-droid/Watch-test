import { Today } from '@/slices/today/Today';
import { RestBanner, Train } from '@/slices/workout/Train';
import { History } from '@/slices/history/History';
import { Body } from '@/slices/body/Body';
import { Coach } from '@/slices/coach/Coach';
import { Settings } from '@/slices/settings/Settings';
import { Profile } from '@/slices/profile/Profile';
import { OnboardingSheet } from '@/slices/profile/Onboarding';
import { closePanel, navTap, openPanel, tab, TABS, type Tab } from './router';
import { WatchSheet } from '@/slices/settings/Watch';
import { GoalSheet, ScheduleSheet, WeeklyReviewSheet } from '@/slices/coach/Coach';
import { CheckInSheet } from '@/slices/workout/Train';
import { MuscleDetail } from '@/slices/body/Body';
import { SessionEditor } from '@/slices/history/History';
import { MemoryScreen } from '@/escobar/ui/MemoryScreen';
import { palaceAnnouncement } from '@/escobar/palace/navigate';
import { installPalaceDevHooks } from '@/escobar/palace/dev';
import { Dock } from '@/escobar/ui/Dock';
import { escobarUi, escobarLoading } from '@/escobar/state';
import { useEffect, useState } from 'preact/hooks';
import { signal } from '@preact/signals';
import type { FunctionComponent } from 'preact';
import type { MuscleId } from '@/data/muscles';
import { showToast, toast } from './toast';
import { onboardingTrigger } from './selectors';
import { Toast } from '@/ui/primitives';
import { IconBody, IconDumbbell, IconCalendar, IconEscobar, IconSun } from '@/ui/icons';
import { bootRecovered, saveError, state } from '@/core/store';
import { keepAwake, keepAwakePref } from '@/native/keepAwake';
import { launchOverlayGone } from './launch';
import { errorReportsAskTrigger } from '@/errors';
import { ErrorReportsAskSheet } from '@/errors/AskSheet';

/** The recovery banner shows once per launch; the rescue row stays in Settings until deleted. */
const recoveredSeen = signal(false);

const ICON: Record<Tab, (p: { size?: number }) => preact.JSX.Element> = { today: IconSun, train: IconDumbbell, history: IconCalendar, body: IconBody, coach: IconEscobar };

installPalaceDevHooks();

/** The chat sheet is its own chunk, fetched the first time Escobar opens (§4.2, §21). */
function EscobarMount() {
  const open = escobarUi.value.open;
  const [Comp, setComp] = useState<FunctionComponent | null>(null);
  useEffect(() => {
    if (open && !Comp) {
      escobarLoading.value = true;
      void import('@/escobar/ui/EscobarSheet').then(m => { escobarLoading.value = false; setComp(() => m.EscobarSheet); }).catch(() => {
        escobarLoading.value = false;
        escobarUi.value = { ...escobarUi.value, open: false, contextRef: null };
        showToast('Could not load Escobar. Check your connection.');
      });
    }
  }, [open, Comp]);
  return open && Comp ? <Comp /> : null;
}

/** Every sheet a palace target can open by id (§7.2), rendered here so it works from any tab. */
function Panels() {
  const p = openPanel.value;
  if (!p) return null;
  const close = () => closePanel(p.id);
  switch (p.id) {
    case 'settings': return <Settings onClose={close} />;
    case 'profile': return <Profile onClose={close} />;
    case 'watch': return <WatchSheet onClose={close} />;
    case 'goal': return <GoalSheet onClose={close} />;
    case 'schedule': return <ScheduleSheet onClose={close} />;
    case 'weekly-review': return <WeeklyReviewSheet onClose={close} />;
    case 'checkin': return <CheckInSheet onClose={close} onDone={close} />;
    case 'memory': return <MemoryScreen onClose={close} />;
    case 'muscle': return p.params?.muscle ? <MuscleDetail key={p.params.muscle} muscle={p.params.muscle as MuscleId} onClose={close} /> : null;
    case 'session': {
      const sess = state.value.sessions.find(x => x.id === p.params?.sessionId);
      return sess ? <SessionEditor key={sess.id} session={sess} onClose={close} /> : null;
    }
    default: return null; // exercise-stats is a History view, not a sheet
  }
}

export function App() {
  const t = tab.value;
  const live = !!state.value.active;
  const panel = openPanel.value?.id;
  const wantAwake = keepAwakePref.value;
  useEffect(() => { void keepAwake(live && wantAwake); return () => { void keepAwake(false); }; }, [live, wantAwake]);
  return (
    <div class="app">
      {/* BUG-27: a fixed backdrop over the status bar, so scrolled content never shows through it. */}
      <div class="status-bar-backdrop" aria-hidden="true" />
      {saveError.value && <div class="banner warn" role="alert" style={{ marginBottom: 12 }}>{saveError.value}</div>}
      {bootRecovered.value && !recoveredSeen.value && (
        <div class="banner warn" role="alert" style={{ marginBottom: 12 }}>
          We couldn't read your latest saved data. A copy was kept. Settings → Your data → Save rescue file.
          <button type="button" class="btn btn-quiet btn-sm" style={{ marginLeft: 8 }} onClick={() => { recoveredSeen.value = true; }}>OK</button>
        </div>
      )}
      {launchOverlayGone.value && panel !== 'settings' && panel !== 'profile' && !onboardingTrigger.value && errorReportsAskTrigger.value && <ErrorReportsAskSheet />}
      {t === 'today' && <Today />}
      {t === 'train' && <Train />}
      {t === 'history' && <History />}
      {t === 'body' && <Body />}
      {t === 'coach' && <Coach />}
      <RestBanner />
      <nav class="nav" aria-label="Main">
        <div class="nav-inner">
          {TABS.map(x => { const Icon = ICON[x.id]; return (
            <button type="button" key={x.id} aria-current={t === x.id ? 'page' : undefined} class={x.id === 'train' && live ? 'nav-live' : ''} onClick={() => { navTap(x.id); }}>
              <Icon size={20} /><span>{x.id === 'train' && live ? 'Live' : x.label}</span>
            </button>
          ); })}
        </div>
      </nav>
      <Panels />
      <Dock />
      <EscobarMount />
      <div class="sr-only" aria-live="polite">{palaceAnnouncement.value}</div>
      {launchOverlayGone.value && panel !== 'settings' && panel !== 'profile' && onboardingTrigger.value && <OnboardingSheet trigger={onboardingTrigger.value} onClose={() => {}} />}
      {toast.value && <Toast key={toast.value.id} message={toast.value.message} action={toast.value.action} onAction={toast.value.onAction} onDismiss={() => { toast.value = null; }} />}
    </div>
  );
}
