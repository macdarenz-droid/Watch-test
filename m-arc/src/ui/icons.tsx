/** Line icons, 24×24, stroke-based so they inherit the text colour. */
import type { JSX } from 'preact';

type P = { size?: number } & JSX.SVGAttributes<SVGSVGElement>;
// I18: one optical stroke weight (1.5px at the 24px viewBox) at every rendered size, instead of a
// fixed 1.8 that reads as a hairline at 16px and heavy at 40px. Decorative by default — a caller
// that needs the icon announced (rare: it carries meaning with no adjacent text) overrides aria-hidden.
export const iconBase = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': (1.5 * 24 / size).toFixed(2), 'stroke-linecap': 'round' as const, 'stroke-linejoin': 'round' as const, 'aria-hidden': 'true' as const });
const base = iconBase;

export const IconSun = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
export const IconDumbbell = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12" /></svg>;
export const IconBody = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="4.5" r="2.5" /><path d="M8 9h8l1 6h-2l-1 6h-4l-1-6H7z" /></svg>;
export const IconGear = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>;
export const IconX = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IconPlus = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const IconMinus = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M5 12h14" /></svg>;
export const IconChevron = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M9 6l6 6-6 6" /></svg>;
export const IconChevronDown = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M6 9l6 6 6-6" /></svg>;
export const IconCheck = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M5 12l4 4L19 7" /></svg>;
// I18: the triangle's visual centre of mass sits left of its bounding box; nudged +1 toward
// centre so it doesn't look off-centre inside a round button.
export const IconPlay = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M8 5l12 7-12 7z" fill="currentColor" stroke="none" /></svg>;
export const IconPause = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M8 5v14M16 5v14" /></svg>;
export const IconTrash = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>;
export const IconEdit = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M4 20h4l10-10-4-4L4 16zM13 7l4 4" /></svg>;
export const IconTrophy = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6" /></svg>;
export const IconFlame = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s1 2 2 2c0-3 2-8 2-8z" /></svg>;
export const IconCalendar = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M8 3v4M16 3v4" /></svg>;
export const IconBack = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M15 6l-6 6 6 6" /></svg>;
export const IconInfo = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>;
export const IconMore = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><circle cx="5" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="19" cy="12" r="1.5" fill="currentColor" /></svg>;
export const IconSend = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M21 3L3 10.5l7.5 3L14 21l7-18z" /><path d="M10.5 13.5L21 3" /></svg>;
export const IconCamera = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.5" /></svg>;
export const IconStop = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" stroke="none" /></svg>;
/**
 * Escobar's mark: the owner's knot-and-plates logo (2026-09-23), used as a mask so it takes
 * `currentColor` like every other icon and follows all five themes. While he's thinking the mark
 * breathes (`.escobar-mark.thinking`), static under reduced motion.
 */
export const IconEscobar = ({ size = 22, thinking = false, class: cls, style }: P & { thinking?: boolean }) => (
  <span class={`escobar-mark${thinking ? ' thinking' : ''} ${cls ?? ''}`} aria-hidden="true" style={{ width: `${size}px`, height: `${size}px`, ...(typeof style === 'object' ? style as Record<string, string> : {}) }} />
);
export const IconShare = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 15V4M7 9l5-5 5 5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" /></svg>;
export const IconDownload = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>;
