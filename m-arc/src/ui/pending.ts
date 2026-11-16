/**
 * I19: a loading indicator that never flashes. `showAfter` only turns a spinner on once an
 * operation has actually taken a moment (`delay`), and once shown, keeps it up for at least
 * `min` more so it never blinks on for a single frame. An operation that settles before `delay`
 * never shows anything at all.
 */
export interface ShowAfterOptions {
  /** How long the operation must run before the indicator appears, in ms. */
  delay: number;
  /** Once shown, the minimum total time the indicator stays visible, in ms. */
  min: number;
}

/** Resolves once the indicator (if it ever showed) has been hidden again. */
export function showAfter(pending: Promise<unknown>, { delay, min }: ShowAfterOptions, setVisible: (visible: boolean) => void): Promise<void> {
  return new Promise(resolve => {
    let shownAt: number | null = null;
    const delayTimer = setTimeout(() => { shownAt = Date.now(); setVisible(true); }, delay);
    void pending.finally(() => {
      clearTimeout(delayTimer);
      if (shownAt == null) { resolve(); return; }
      const remaining = Math.max(0, min - (Date.now() - shownAt));
      setTimeout(() => { setVisible(false); resolve(); }, remaining);
    });
  });
}
