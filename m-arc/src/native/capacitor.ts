/** Small helpers around the Capacitor bridge, with safe web fallbacks. */
export function isNative(): boolean {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  try { return !!cap?.isNativePlatform?.(); } catch { return false; }
}
