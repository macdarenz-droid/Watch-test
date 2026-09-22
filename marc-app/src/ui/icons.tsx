/** Line icons, 24×24, stroke-based so they inherit the text colour. */
import type { JSX } from 'preact';

type P = { size?: number } & JSX.SVGAttributes<SVGSVGElement>;
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round' as const, 'stroke-linejoin': 'round' as const });

export const IconSun = ({ size = 22, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
export const IconDumbbell = ({ size = 22, ...p }: P) => <svg {...base(size)} {...p}><path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12" /></svg>;
export const IconBody = ({ size = 22, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="4.5" r="2.5" /><path d="M8 9h8l1 6h-2l-1 6h-4l-1-6H7z" /></svg>;
export const IconSpark = ({ size = 22, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" /></svg>;
export const IconClock = ({ size = 22, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
export const IconGear = ({ size = 22, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>;
export const IconX = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IconPlus = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const IconMinus = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M5 12h14" /></svg>;
export const IconChevron = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><path d="M9 6l6 6-6 6" /></svg>;
export const IconChevronDown = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><path d="M6 9l6 6 6-6" /></svg>;
export const IconCheck = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><path d="M5 12l4 4L19 7" /></svg>;
export const IconPlay = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><path d="M7 5l12 7-12 7z" fill="currentColor" stroke="none" /></svg>;
export const IconPause = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><path d="M8 5v14M16 5v14" /></svg>;
export const IconTrash = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>;
export const IconEdit = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><path d="M4 20h4l10-10-4-4L4 16zM13 7l4 4" /></svg>;
export const IconTrophy = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6" /></svg>;
export const IconFlame = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s1 2 2 2c0-3 2-8 2-8z" /></svg>;
export const IconMoon = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>;
export const IconHeart = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></svg>;
export const IconCalendar = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M8 3v4M16 3v4" /></svg>;
export const IconBack = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M15 6l-6 6 6 6" /></svg>;
export const IconInfo = ({ size = 18, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>;
export const IconMore = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><circle cx="5" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="19" cy="12" r="1.5" fill="currentColor" /></svg>;
