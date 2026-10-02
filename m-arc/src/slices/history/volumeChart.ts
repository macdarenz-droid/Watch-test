/** F8's data: weekly volume, oldest week first so the right-hand bar is this week (QA-R6-2). */
import type { Exercise, LoadUnit, Session } from '@/core/models';
import { kgToDisplay } from '@/core/units';
import { weeklyVolumeHistory } from '@/brain/weekly';
import type { BodyWeightAt } from '@/brain/bodyweight';

export function volumeChartWeeks(sessions: Session[], today: string, custom: Exercise[], unit: LoadUnit, weeks = 12, bw?: BodyWeightAt): Array<{ week: string; value: number }> {
  // weeklyVolumeHistory lists this week first.
  return weeklyVolumeHistory(sessions, today, weeks, custom, bw).map(w => ({ week: w.week, value: kgToDisplay(w.volumeKg, unit) })).reverse();
}
