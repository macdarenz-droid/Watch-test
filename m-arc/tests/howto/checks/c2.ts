// HT-4 (HT4-A3): C2, muscle ids and drawn regions.
//
// D-HT4-C2 (review fix, supervisor ruling on PR #116, 2026-09-30): a NO_REGION id is allowed as text-only in
// feel.secondary/feel.watch (golden B marks brachialis this way on lat_pulldown/seated_cable_row - "text only (no
// drawn region)" - and CARD-V2 lists brachialis and rotator_cuff as text-only muscles). It still fails in
// feel.primary (the headline claim needs a real drawn region) and in any feel.rows[].at.muscles highlight (a
// feel-map shimmer needs a region to shimmer; HT-8's shimmer must skip NO_REGION ids the same way golden B's own
// feelmap.mjs does). core's misleading-region rule is unchanged.
import { isMuscleId } from '../../../src/data/muscles';
import { FRONT_PARTS, BACK_PARTS } from '../../../src/svg/bodyMuscles';
import type { HowToContent } from '../../../src/howto/content-types';

/** Ids with no fair drawn region (text-only in secondary/watch), or a misleading one (4.4 Level 1 note; the map's own limits). */
export const NO_REGION = new Set(['brachialis', 'rotator_cuff']);
const MISLEADING_REGION = new Set(['core']);

const PART_IDS = new Set([...FRONT_PARTS, ...BACK_PARTS].map(p => p.id));

export function checkC2(content: HowToContent): string[] {
  const bad: string[] = [];
  const { primary, secondary, watch } = content.feel;

  for (const [role, list] of [['primary', primary], ['secondary', secondary], ['watch', watch]] as const) {
    for (const m of list) {
      if (!isMuscleId(m.muscleId)) { bad.push(`C2: feel.${role} muscleId "${m.muscleId}" is not isMuscleId`); continue; }
      if (NO_REGION.has(m.muscleId) && role === 'primary') bad.push(`C2: feel.primary muscleId "${m.muscleId}" has no drawn region`);
      if (MISLEADING_REGION.has(m.muscleId)) bad.push(`C2: feel.${role} muscleId "${m.muscleId}" has a misleading drawn region`);
    }
  }

  const primaryIds = new Set(primary.map(m => m.muscleId));
  for (const m of watch) if (primaryIds.has(m.muscleId)) bad.push(`C2: muscleId "${m.muscleId}" is both primary and watch`);

  content.feel.rows.forEach((r, i) => {
    for (const p of r.at.parts ?? []) if (!PART_IDS.has(p)) bad.push(`C2: feel.rows[${i}] (${r.key}) part id "${p}" is not in bodyMuscles.ts`);
    for (const m of r.at.muscles ?? []) {
      if (!isMuscleId(m)) { bad.push(`C2: feel.rows[${i}] (${r.key}) muscle id "${m}" is not isMuscleId`); continue; }
      if (NO_REGION.has(m)) bad.push(`C2: feel.rows[${i}] (${r.key}) muscle id "${m}" has no drawn region to highlight`);
    }
  });

  return bad;
}
