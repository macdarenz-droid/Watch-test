/**
 * The M/ARC mark: one continuous line that draws an M and spikes like a
 * heartbeat, with the accent dot at the low point. Pure SVG strings so the
 * app, the icon renderer and the splash share one drawing. Colours are CSS
 * values, so theme tokens work.
 */
export interface LogoColors { ink: string; accent: string; bg: string }

const PULSE = 'M8 40H16L22 22L30 50L36 30L40 40H56';
const DOT = { cx: 30, cy: 50, r: 4.5 };

function pulse(c: LogoColors): string {
  return `<path d="${PULSE}" fill="none" stroke="${c.ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${c.accent}"/>`;
}

/** The mark alone in a 64×64 box. `rounded` adds the icon background. */
export function markSvg(c: LogoColors, opts: { rounded?: boolean; size?: number; padding?: number } = {}): string {
  const size = opts.size ?? 64;
  const pad = opts.padding ?? 0;
  const inner = 64 - pad * 2;
  const bg = opts.rounded ? `<rect width="64" height="64" rx="14" fill="${c.bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="M/ARC">
${bg}
<g transform="translate(${pad} ${pad}) scale(${inner / 64})">
${pulse(c)}
</g>
</svg>`;
}

/** Mark plus wordmark, for headers and splash. Height in px, width auto. */
export function lockupSvg(c: LogoColors, height = 40): string {
  const w = 216, h = 64;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" height="${height}" width="${Math.round((height * w) / h)}" role="img" aria-label="M/ARC">
${pulse(c)}
<text x="68" y="47" font-family="Inter, 'SF Pro Display', system-ui, sans-serif" font-size="38" font-weight="700" letter-spacing="-1.5" fill="${c.ink}">M<tspan fill="${c.accent}">/</tspan>ARC</text>
</svg>`;
}
