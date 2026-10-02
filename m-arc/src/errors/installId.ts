/** 7.5: a random id, local to this device, not tied to any account. Reset by "delete everything". */
const KEY = 'marc.errors.installId';

function randomUuidV4(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

export function getInstallId(storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage): string {
  try {
    const existing = storage.getItem(KEY);
    if (existing) return existing;
    const id = randomUuidV4();
    storage.setItem(KEY, id);
    return id;
  } catch {
    return randomUuidV4();
  }
}

export function resetInstallId(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  try { storage.removeItem(KEY); } catch { /* storage unavailable */ }
}
