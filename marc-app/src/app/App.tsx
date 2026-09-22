import { Today } from '@/slices/today/Today';
import { RestBanner, Train } from '@/slices/workout/Train';
import { History } from '@/slices/history/History';
import { Body } from '@/slices/body/Body';
import { Coach } from '@/slices/coach/Coach';
import { Settings } from '@/slices/settings/Settings';
import { go, settingsOpen, tab, TABS, type Tab } from './router';
import { toast } from './toast';
import { Toast } from '@/ui/primitives';
import { IconBody, IconDumbbell, IconCalendar, IconSpark, IconSun } from '@/ui/icons';
import { saveError, state } from '@/core/store';
import { haptic } from '@/native/haptics';

const ICON: Record<Tab, (p: { size?: number }) => preact.JSX.Element> = { today: IconSun, train: IconDumbbell, history: IconCalendar, body: IconBody, coach: IconSpark };

export function App() {
  const t = tab.value;
  const live = !!state.value.active;
  return (
    <div class="app">
      {saveError.value && <div class="banner warn" role="alert" style={{ marginBottom: 12 }}>{saveError.value}</div>}
      {t === 'today' && <Today />}
      {t === 'train' && <Train />}
      {t === 'history' && <History />}
      {t === 'body' && <Body />}
      {t === 'coach' && <Coach />}
      <RestBanner />
      <nav class="nav" aria-label="Main">
        <div class="nav-inner">
          {TABS.map(x => { const Icon = ICON[x.id]; return (
            <button type="button" key={x.id} aria-current={t === x.id ? 'page' : undefined} class={x.id === 'train' && live ? 'nav-live' : ''} onClick={() => { go(x.id); void haptic.light(); }}>
              <Icon size={22} /><span>{x.id === 'train' && live ? 'Live' : x.label}</span>
            </button>
          ); })}
        </div>
      </nav>
      {settingsOpen.value && <Settings onClose={() => { settingsOpen.value = false; }} />}
      {toast.value && <Toast message={toast.value.message} action={toast.value.action} onAction={toast.value.onAction} onDismiss={() => { toast.value = null; }} />}
    </div>
  );
}
