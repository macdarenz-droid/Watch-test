/**
 * The live heart pulse (owner's pick "F, edge only"): no trace, just the top edge of the screen
 * brightening in time with the heart, and `HeartBpm` (heart + number) beating with it. Both read
 * one beat clock through the `--pulse-beat` CSS variable. Colours come from the theme's
 * `--accent`, so all five themes follow. Under reduced motion nothing beats.
 */
import { useEffect, useRef } from 'preact/hooks';
import { onReducedChange, reduced } from '@/ui/motion';

const g = (x: number, m: number, s: number) => Math.exp(-((x - m) ** 2) / (2 * s * s));
/** Glow envelope: rises into the R wave, decays after it. */
export const beatEnvelope = (t: number): number => (t < 0.33 ? g(t, 0.33, 0.02) : Math.exp(-(t - 0.33) / 0.16));

export function PulseLine({ bpm }: { bpm: number }) {
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    // I3: writing --pulse-beat on <html> every frame forces the browser to re-check style on
    // anything under it that reads the property; scoping the write to this element (the .pulse-edge
    // child inherits it) and to the discrete heart-bpm-icon elements avoids that whole-page cost.
    let icons: NodeListOf<HTMLElement> = document.querySelectorAll('.heart-bpm-icon');
    let lastIconScan = 0;
    let raf = 0;
    const frame = (now: number) => {
      if (now - lastIconScan > 1000) { icons = document.querySelectorAll('.heart-bpm-icon'); lastIconScan = now; }
      const beats = now / 1000 / (60 / Math.max(30, bpmRef.current));
      const v = Math.min(1, beatEnvelope(beats % 1)).toFixed(3);
      root.style.setProperty('--pulse-beat', v);
      for (const el of icons) el.style.setProperty('--pulse-beat', v);
      raf = requestAnimationFrame(frame);
    };
    const clear = () => { root.style.setProperty('--pulse-beat', '0'); for (const el of icons) el.style.setProperty('--pulse-beat', '0'); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } clear(); };
    const start = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(frame); };
    // F3: follows the OS setting and the in-app toggle live, not just at mount.
    const apply = () => { if (reduced()) stop(); else start(); };
    apply();
    const off = onReducedChange(apply);
    // Battery: no point animating a hidden tab/app.
    const onVisibility = () => { if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else if (!reduced()) start(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { off(); document.removeEventListener('visibilitychange', onVisibility); if (raf) cancelAnimationFrame(raf); root.style.removeProperty('--pulse-beat'); for (const el of icons) el.style.removeProperty('--pulse-beat'); };
  }, []);
  return <div ref={rootRef} class="pulse-line" aria-hidden="true"><div class="pulse-edge" /></div>;
}

/** The heart-rate number with a heart that beats in time with the edge. */
export function HeartBpm({ bpm }: { bpm: number }) {
  return (
    <span class="heart-bpm" role="img" aria-label={`Heart rate ${bpm} beats a minute`}>
      <svg class="heart-bpm-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></svg>
      <span class="heart-bpm-n">{bpm}</span>
    </span>
  );
}
