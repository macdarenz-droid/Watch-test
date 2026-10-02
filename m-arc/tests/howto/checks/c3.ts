// HT-4 (HT4-A3): C3, a hand zoom is present whenever handling requires one.
import type { HowToContent } from '../../../src/howto/content-types';

/** exercises.json `equipment` substrings that mean the library lists a handled piece of equipment (6.1). */
const HANDLED_EQUIPMENT = ['Machine', 'Cable', 'Dumbbell', 'Barbell', 'EZ Bar', 'Kettlebell', 'T-Bar', 'Landmine', 'Smith'];

export function listsHandledEquipment(equipment: string): boolean {
  return HANDLED_EQUIPMENT.some(e => equipment.toLowerCase().includes(e.toLowerCase()));
}

export function checkC3(content: HowToContent, equipment: string): string[] {
  const bad: string[] = [];
  const hasHandZoom = content.zooms.some(z => z.kind === 'hand');

  if (content.handling.archetype !== 'none') {
    if (!hasHandZoom && content.extends === undefined) bad.push('C3: handling.archetype is not none, and no hand zoom exists (own or inherited)');
  } else if (listsHandledEquipment(equipment) && !content.handling.why) {
    bad.push(`C3: the library lists handled equipment ("${equipment}") but handling is none without why`);
  }

  return bad;
}
