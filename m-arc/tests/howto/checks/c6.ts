// HT-4 (HT4-A3): C6, coverage. Every exercises.json id is approved, or pending with an archetype (appendix B stub).
import type { CoverageEntry } from '../../../src/howto/coverage';

export function checkC6(exerciseIds: readonly string[], coverage: Readonly<Record<string, CoverageEntry>>): string[] {
  const bad: string[] = [];
  for (const id of exerciseIds) {
    const entry = coverage[id];
    if (!entry) { bad.push(`C6: "${id}" has no HowTo and no archetype stub`); continue; }
    if (entry.status === 'pending' && !entry.archetype) bad.push(`C6: "${id}" is pending with no archetype`);
  }
  return bad;
}
