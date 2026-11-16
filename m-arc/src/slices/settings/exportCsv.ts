/** RG-17: sessions as CSV (RFC 4180), loads exactly as typed when typed in the chosen unit. */
import type { LoadUnit, Session } from '@/core/models';
import { setLoadIn } from '@/core/units';
import { hasEntry } from '@/brain/exposure';

export const CSV_HEADER = 'date,split,exercise,set,load,unit,reps,effort,kind,duration_s,distance_m,note';

/** Quotes a field only when it needs it: a comma, a quote or a line break. */
export function csvField(v: string | number | undefined | null): string {
  if (v == null) return '';
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** One row per filled-in set, oldest session first; `from`/`to` are inclusive day keys. */
export function sessionsToCsv(sessions: Session[], unit: LoadUnit, from?: string, to?: string): string {
  const rows = [CSV_HEADER];
  const list = sessions.filter(s => (!from || s.day >= from) && (!to || s.day <= to)).sort((a, b) => a.day.localeCompare(b.day) || a.startedAt.localeCompare(b.startedAt));
  for (const s of list) {
    for (const e of s.exercises) {
      let n = 0;
      for (const set of e.sets) {
        if (!hasEntry(set)) continue;
        n++;
        const load = setLoadIn(set, unit);
        // The exercise note rides on its first set; the session note gets a row of its own.
        const note = n === 1 ? e.note : undefined;
        rows.push([s.day, s.splitName, e.name, n, load, load != null ? unit : '', set.reps, set.effort, set.kind, set.durationSec, set.distanceM, note].map(csvField).join(','));
      }
    }
    if (s.note) rows.push([s.day, s.splitName, '', '', '', '', '', '', '', '', '', s.note].map(csvField).join(','));
  }
  return rows.join('\r\n') + '\r\n';
}
