// HT-4 (HT4-A3): C15, review stamp. The stub (docs/research/howto/reviews.json, empty today) computes the content
// hash so the machinery is provable; the check turns strict once reviews.json holds entries (O1). While the file is
// empty it never fails, matching the card's "stub" scope.
import { createHash } from 'node:crypto';
import type { HowToContent } from '../../../src/howto/content-types';

export interface ReviewEntry {
  readonly scope: string;
  readonly hash: string;
  readonly coach?: string;
  readonly physio?: string;
  readonly date: string;
}
export interface ReviewsFile {
  readonly schema: 1;
  readonly entries: readonly ReviewEntry[];
}

/** Every user-visible string and drawing parameter, over `plate` too (passed in separately, since HowToContent has
 *  none): a stable hash of the content that changes whenever anything shown to the user changes. */
export function contentHash(content: HowToContent, plate: unknown): string {
  return createHash('sha256').update(JSON.stringify({ content, plate })).digest('hex');
}

export function checkC15(content: HowToContent, plate: unknown, reviews: ReviewsFile): string[] {
  if (reviews.entries.length === 0) return [];
  const hash = contentHash(content, plate);
  const scope = content.extends ?? content.id;
  const matches = reviews.entries.some(e => e.scope === scope && e.hash === hash);
  return matches ? [] : [`C15: no reviews.json entry matches ${scope}'s current content hash ${hash.slice(0, 12)}…`];
}
