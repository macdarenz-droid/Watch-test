// HT4-A3 C15 bad fixture: reviews.json holds entries, but none matches this content's current hash.
import type { ReviewsFile } from '../../checks/c15';

export const reviews: ReviewsFile = {
  schema: 1,
  entries: [{ scope: 'lib_machine_chest_press', hash: '0'.repeat(64), coach: 'j.doe', date: '2026-01-01' }],
};
