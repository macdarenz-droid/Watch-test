import { useState } from 'preact/hooks';
import { state } from '@/core/store';
import { findExercise } from '@/core/exercises';
import type { EquipmentProfile } from '@/core/models';
import { Button, Card, Chip, Row, Sheet } from '@/ui/primitives';
import { kgToDisplay } from '@/core/units';
import { deleteGym, resetProfile, setActiveGym, setGymDefaultUnit } from '@/slices/workout/units';

function describe(p: EquipmentProfile): string {
  const parts: string[] = [p.unit];
  if (p.ladder?.length) parts.push(`${p.ladder[0]}–${p.ladder[p.ladder.length - 1]}`);
  if (p.step) parts.push(`${p.step} ${p.unit} steps`);
  if (p.addOns?.length) parts.push(`add-on ${p.addOns.join(', ')}`);
  if (p.barKg) parts.push(`bar ${kgToDisplay(p.barKg, p.unit)} ${p.unit}`);
  if (p.plates?.length) parts.push(`plates ${p.plates.join(', ')}`);
  return parts.join(' · ');
}

const SOURCE: Record<EquipmentProfile['source'], string> = { user: 'set by you', suspect_fix: 'from a unit fix', escobar_scan: 'read from a photo', escobar_chat: 'from Escobar', default: 'default' };

/** Settings → Gyms and equipment (§25.5): each gym's saved units, editable and resettable. */
export function GymsSheet({ onClose }: { onClose: () => void }) {
  const s = state.value;
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <Sheet title="Gyms and equipment" onClose={onClose}>
      <div class="stack" data-palace="settings.gyms-sheet">
        {s.units.gyms.map(g => {
          const ex = Object.entries(s.units.byExercise[g.id] ?? {});
          const eq = Object.entries(s.units.byEquipment[g.id] ?? {}).filter((e): e is [string, EquipmentProfile] => !!e[1]);
          return (
            <Card key={g.id} class="stack-sm">
              <div class="row-between">
                <div class="row"><b>{g.name}</b>{g.id === s.units.activeGymId ? <Chip tone="accent">Active</Chip> : <Button size="sm" variant="quiet" onClick={() => setActiveGym(g.id)}>Make active</Button>}</div>
                <div class="seg" style={{ width: 96 }}>
                  <button type="button" aria-pressed={g.defaultUnit === 'kg'} onClick={() => setGymDefaultUnit(g.id, 'kg')}>kg</button>
                  <button type="button" aria-pressed={g.defaultUnit === 'lb'} onClick={() => setGymDefaultUnit(g.id, 'lb')}>lb</button>
                </div>
              </div>
              {!ex.length && !eq.length && <p class="hint">Nothing saved yet.</p>}
              <div class="list">
                {eq.map(([group, p]) => <Row key={group} trailing={<Button size="sm" variant="quiet" onClick={() => resetProfile('equipment', group, g.id)}>Reset</Button>}><span class="small">All {group}</span><div class="hint">{describe(p)} · {SOURCE[p.source]}</div></Row>)}
                {ex.map(([id, p]) => <Row key={id} trailing={<Button size="sm" variant="quiet" onClick={() => resetProfile('exercise', id, g.id)}>Reset</Button>}><span class="small">{findExercise(id, s.customExercises)?.name ?? id}</span><div class="hint">{describe(p)} · {SOURCE[p.source]}</div></Row>)}
              </div>
              {s.units.gyms.length > 1 && (confirm === g.id
                ? <div class="row"><Button size="sm" variant="quiet" onClick={() => setConfirm(null)}>Keep</Button><Button size="sm" variant="danger" onClick={() => { deleteGym(g.id); setConfirm(null); }}>Delete {g.name}</Button></div>
                : <Button size="sm" variant="quiet" onClick={() => setConfirm(g.id)}>Delete gym</Button>)}
            </Card>
          );
        })}
      </div>
    </Sheet>
  );
}
