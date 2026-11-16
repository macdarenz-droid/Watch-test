/**
 * The thinking line (owner request): a small gym icon that lifts while a playful line rotates.
 * "Thinking…" always comes first (the first-feedback check waits for it). Under reduced motion
 * the icon is still and the lines change slower.
 */
import { useEffect, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { IconDumbbell, iconBase } from '@/ui/icons';
import { reduced } from '@/ui/motion';

type I = (p: { size?: number }) => JSX.Element;
// I18: reuses icons.tsx's own optical stroke-weight formula instead of a second, hardcoded 1.8.
const svg = (size = 20) => iconBase(size);
const Plate: I = ({ size }) => <svg {...svg(size)}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2" /></svg>;
const Kettlebell: I = ({ size }) => <svg {...svg(size)}><path d="M9 8a3 3 0 0 1 6 0" /><path d="M8.5 8h7l1.5 2.5a6 6 0 1 1-10 0z" /></svg>;
const Barbell: I = ({ size }) => <svg {...svg(size)}><path d="M2 12h20M5 8v8M8 6.5v11M16 6.5v11M19 8v8" /></svg>;
const Dumbbell: I = ({ size }) => <IconDumbbell size={size} />;

export const THINKING_LINES = [
  'Thinking…',
  'Racking up the plates…',
  'Chalking up…',
  'Doing push-ups…',
  'Loading the bar…',
  'Counting the reps…',
  'Spotting the numbers…',
  'Stretching the hamstrings…',
  'Re-racking the dumbbells…',
  'Checking the form…',
];
const ICONS: I[] = [Dumbbell, Plate, Kettlebell, Barbell];

export function ThinkingLine({ label }: { label?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (label) return;
    const t = setInterval(() => setI(n => n + 1), reduced() ? 3200 : 1700);
    return () => clearInterval(t);
  }, [label]);
  const Icon = ICONS[i % ICONS.length]!;
  const text = label ?? (i === 0 ? THINKING_LINES[0]! : THINKING_LINES[1 + ((i - 1) % (THINKING_LINES.length - 1))]!);
  return (
    <div class="esc-activity esc-thinking" role="status">
      <span class="esc-lift" key={i % ICONS.length}><Icon size={20} /></span>
      <span class="esc-thinking-text" key={text}>{text}</span>
    </div>
  );
}
