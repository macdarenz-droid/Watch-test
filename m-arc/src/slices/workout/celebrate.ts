/**
 * F9: the PR haptic celebration fires once per exercise per session, even if the card remounts
 * (a tab switch away and back). Module-level, so it survives across every EntryCard's own effect.
 */
const seen = new Set<string>();

/** True the first time this key is seen; false on every call after. */
export function celebrateOnce(key: string): boolean {
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}
