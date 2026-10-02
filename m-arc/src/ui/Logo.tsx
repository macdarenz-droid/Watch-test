import { lockupSvg, markSvg } from '@/svg/logo';

const themed = { ink: 'var(--text)', accent: 'var(--accent)', bg: 'var(--bg)' };

/** The monogram, inheriting the active theme. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return <span class="logo" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: markSvg(themed, { size }) }} />;
}

/** Mark plus wordmark. */
export function Logo({ height = 28 }: { height?: number }) {
  return <span class="logo" dangerouslySetInnerHTML={{ __html: lockupSvg(themed, height) }} />;
}
