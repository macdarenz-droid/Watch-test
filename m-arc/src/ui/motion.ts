// Motion tokens (mirrors the CSS custom properties in src/ui/styles.css, tokens:start..tokens:end)
// and the reduced-motion state machine. Guarded for node: tests import this module without a DOM.

export const DUR = {
  press: 100, fast: 150, base: 200, enter: 240, exit: 160,
  sheet: 320, sheetExit: 200, spring: 310, bounce: 460,
  stagger: 40, delayContent: 60,
} as const;

export const REDUCED_DUR = {
  ...DUR,
  enter: 150, sheet: 150, exit: 100, sheetExit: 100,
  spring: 150, bounce: 150, stagger: 0, delayContent: 0,
} as const;

export type DurKey = keyof typeof DUR;

export const EASE = {
  standard: 'cubic-bezier(.2,0,0,1)',
  enter: 'cubic-bezier(.05,.7,.1,1)',
  exit: 'cubic-bezier(.3,0,.8,.15)',
  drawer: 'cubic-bezier(.32,.72,0,1)',
  linear: 'linear',
} as const;

const hasDom = () => typeof document !== 'undefined' && typeof matchMedia === 'function';

export function reduced(): boolean {
  if (!hasDom()) return false;
  return document.documentElement.dataset.motion === 'reduce';
}

export function durFor(key: DurKey): number {
  return (reduced() ? REDUCED_DUR : DUR)[key];
}

export function springEase(): string {
  if (!hasDom()) return EASE.enter;
  const v = getComputedStyle(document.documentElement).getPropertyValue('--ease-spring').trim();
  return v || EASE.enter;
}

const MOTION_PREF_KEY = 'marc.motion';

function readPref(): 'reduce' | null {
  if (!hasDom()) return null;
  try { return localStorage.getItem(MOTION_PREF_KEY) === 'reduce' ? 'reduce' : null; } catch { return null; }
}

function writePref(p: 'reduce' | null): void {
  if (!hasDom()) return;
  try {
    if (p === 'reduce') localStorage.setItem(MOTION_PREF_KEY, 'reduce');
    else localStorage.removeItem(MOTION_PREF_KEY);
  } catch { /* storage unavailable (private mode, quota) */ }
}

const mq = hasDom() ? matchMedia('(prefers-reduced-motion: reduce)') : null;
const reducedListeners = new Set<(r: boolean) => void>();

function apply(): void {
  if (!hasDom()) return;
  const on = !!mq?.matches || readPref() === 'reduce';
  if (on) document.documentElement.dataset.motion = 'reduce';
  else delete document.documentElement.dataset.motion;
  for (const cb of reducedListeners) cb(on);
}

mq?.addEventListener('change', apply);
apply();

/** In-app override on top of the OS setting (Settings › Feedback › Reduce motion). */
export function setMotionPref(p: 'reduce' | null): void {
  writePref(p);
  apply();
}

/** Whether the in-app override is set, independent of the OS setting (for the Settings toggle). */
export function motionPrefIsReduce(): boolean {
  return readPref() === 'reduce';
}

/** Whether the OS itself requests reduced motion (the Settings toggle is disabled and forced on when true). */
export function osReducedMotion(): boolean {
  return !!mq?.matches;
}

export function onReducedChange(cb: (r: boolean) => void): () => void {
  reducedListeners.add(cb);
  return () => reducedListeners.delete(cb);
}
