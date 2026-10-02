import { useEffect, useState } from 'preact/hooks';
import { reduced as isReducedMotion } from '@/ui/motion';

/**
 * An empty chat bar types a suggested question, holds it, deletes it, then types the next
 * (owner request). Under reduced motion the whole suggestion swaps every few seconds instead.
 */
export function useTypewriter(lines: string[], fallback: string, active = true): string {
  const [shown, setShown] = useState(fallback);
  const key = lines.join('|');
  useEffect(() => {
    if (!active || !lines.length) { setShown(fallback); return; }
    const reduced = isReducedMotion();
    let line = 0, len = 0, phase: 'type' | 'hold' | 'delete' | 'rest' = 'rest';
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const full = lines[line % lines.length]!;
      if (reduced) { setShown(full); line++; timer = setTimeout(tick, 3200); return; }
      if (phase === 'rest') { phase = 'type'; len = 0; }
      if (phase === 'type') {
        len++; setShown(full.slice(0, len));
        if (len >= full.length) { phase = 'hold'; timer = setTimeout(tick, 1500); return; }
        timer = setTimeout(tick, 45); return;
      }
      if (phase === 'hold') { phase = 'delete'; }
      len--; setShown(full.slice(0, Math.max(0, len)) || '\u200b');
      if (len <= 0) { phase = 'rest'; line++; timer = setTimeout(tick, 350); return; }
      timer = setTimeout(tick, 22);
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [key, active, fallback]);
  return shown;
}
