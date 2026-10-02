// HT4-A3 C6 bad fixture: an exercises.json id with no coverage entry at all.
import type { CoverageEntry } from '../../../../src/howto/coverage';

export function mutate(good: Readonly<Record<string, CoverageEntry>>): Record<string, CoverageEntry> {
  const { lib_pallof_press: _dropped, ...rest } = good;
  return rest;
}
