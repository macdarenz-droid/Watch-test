/**
 * The rescue file (ST-02, RG-01): every M/ARC key in local storage as one JSON object, so a
 * person can keep their data when the app cannot start. index.html carries an inline copy of
 * this because it must work before the bundle loads; keep the two in step.
 */
type Readable = Pick<Storage, 'length' | 'key' | 'getItem'>;

export function buildRescueJson(storage: Readable = localStorage): string {
  const out: Record<string, string | null> = {};
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k && (k.startsWith('marc.') || k === 'dailyTrackerPremium')) out[k] = storage.getItem(k);
  }
  return JSON.stringify({ app: 'M/ARC', kind: 'rescue', savedAt: new Date().toISOString(), keys: out });
}

/** Downloads the rescue file; falls back to the clipboard where downloads do not work. */
export async function saveRescueFile(text: string = buildRescueJson(), name = 'marc-rescue.json'): Promise<'download' | 'clipboard' | 'failed'> {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return 'download';
  } catch {
    try { await navigator.clipboard.writeText(text); return 'clipboard'; } catch { return 'failed'; }
  }
}
