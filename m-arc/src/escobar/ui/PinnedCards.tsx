/** Cards Escobar pinned to Today (ES-22), drawn from the phone's own data through ShowComponent. */
import { state, update } from '@/core/store';
import { todayKey } from '@/core/dates';
import { ShowComponent } from './components';
import { stripCitationTags } from './present';

export function PinnedCards() {
  const today = todayKey();
  const pins = state.value.escobar.pins.filter(p => !p.until || p.until >= today);
  if (!pins.length) return null;
  const unpin = (id: string) => update(s => ({ ...s, escobar: { ...s.escobar, pins: s.escobar.pins.filter(p => p.id !== id) } }));
  return (
    <div class="stack-sm" data-palace="today.pins">
      {pins.map(p => (
        <ShowComponent key={p.id} component={p.component} params={p.params} caption={p.title}
          action={<button type="button" class="btn btn-quiet btn-sm" aria-label={`Unpin ${stripCitationTags(p.title)}`} onClick={() => unpin(p.id)}>Unpin</button>} />
      ))}
    </div>
  );
}
