// BUG-23: a muscle's declared `view` (src/data/muscles.ts) must match the SVG
// side that actually draws it (src/svg/bodyMuscles.ts), or the muscle map
// (src/ui/MuscleMap.tsx) and the form-guide overlays (src/formguide/check/overlays.ts)
// disagree about where it lives.
import { describe, it, expect } from 'vitest';
import { MUSCLES, type MuscleId } from '@/data/muscles';
import { FRONT_PARTS, BACK_PARTS } from '@/svg/bodyMuscles';

function drawnViews(id: MuscleId): Set<'front' | 'back'> {
  const views = new Set<'front' | 'back'>();
  if (FRONT_PARTS.some(p => p.muscle === id)) views.add('front');
  if (BACK_PARTS.some(p => p.muscle === id)) views.add('back');
  return views;
}

describe('BUG-23: Muscle.view matches the SVG side that draws it', () => {
  for (const m of MUSCLES) {
    const views = drawnViews(m.id);
    if (views.size === 0) continue; // no path of its own (e.g. aliased in MuscleMap)
    it(`${m.id} (view: ${m.view})`, () => {
      expect(views.has(m.view), `${m.id} is declared '${m.view}' but its SVG path(s) are drawn ${[...views].join(' & ')}`).toBe(true);
    });
  }
});
