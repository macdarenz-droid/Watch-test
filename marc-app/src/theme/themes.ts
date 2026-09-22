/**
 * Theme catalogue.
 *
 * Every theme fills the same token contract so any screen, chart or the
 * muscle map can be re-skinned by swapping `data-theme` on <html>.
 * Colours are plain hex/rgba so they work in every WebView we ship to.
 */
export type ThemeId = 'silent-black' | 'paper' | 'ember' | 'emerald' | 'midnight';

export interface ThemeTokens {
  /** Page background. */
  bg: string;
  /** Raised surfaces, from flattest to most elevated. */
  surface1: string;
  surface2: string;
  surface3: string;
  /** Hairlines. */
  borderSubtle: string;
  border: string;
  borderStrong: string;
  /** Text scale. */
  text: string;
  text2: string;
  text3: string;
  /** Brand accent and text that sits on it. */
  accent: string;
  accentSoft: string;
  onAccent: string;
  /** Semantic. */
  positive: string;
  warning: string;
  negative: string;
  info: string;
  /** Shadows and glass. */
  shadow: string;
  /** Muscle map body fill and outline. */
  mapBody: string;
  mapLine: string;
  /** Meta theme-color for the browser / Android status bar. */
  chrome: string;
  colorScheme: 'dark' | 'light';
}

export interface Theme {
  id: ThemeId;
  name: string;
  /** Plain-words description shown in the theme picker. */
  blurb: string;
  /** The premium product the look is borrowed from. */
  inspiredBy: string;
  radius: { sm: string; md: string; lg: string; xl: string };
  font: string;
  tokens: ThemeTokens;
}

const inter = 'Inter, "SF Pro Text", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export const THEMES: Record<ThemeId, Theme> = {
  'silent-black': {
    id: 'silent-black',
    name: 'Silent Black',
    blurb: 'Near-black, hairline borders, one quiet lavender accent. The default.',
    inspiredBy: 'Linear and Vercel',
    radius: { sm: '8px', md: '12px', lg: '16px', xl: '22px' },
    font: inter,
    tokens: {
      bg: '#08090a',
      surface1: '#0f1011',
      surface2: '#141516',
      surface3: '#1b1c1f',
      borderSubtle: 'rgba(255,255,255,0.06)',
      border: 'rgba(255,255,255,0.10)',
      borderStrong: 'rgba(255,255,255,0.18)',
      text: '#f7f8f8',
      text2: '#8a8f98',
      text3: '#62666d',
      accent: '#5e6ad2',
      accentSoft: 'rgba(94,106,210,0.16)',
      onAccent: '#ffffff',
      positive: '#4cc38a',
      warning: '#f2b544',
      negative: '#eb5757',
      info: '#6ea8fe',
      shadow: '0 16px 40px rgba(0,0,0,0.45)',
      mapBody: '#1b1c1f',
      mapLine: 'rgba(255,255,255,0.10)',
      chrome: '#08090a',
      colorScheme: 'dark',
    },
  },
  paper: {
    id: 'paper',
    name: 'Paper',
    blurb: 'Warm white, ink text, soft grey surfaces. Calm in daylight.',
    inspiredBy: 'Notion',
    radius: { sm: '6px', md: '10px', lg: '14px', xl: '18px' },
    font: inter,
    tokens: {
      bg: '#ffffff',
      surface1: '#f7f6f3',
      surface2: '#efeeea',
      surface3: '#e6e4df',
      borderSubtle: 'rgba(55,53,47,0.08)',
      border: 'rgba(55,53,47,0.14)',
      borderStrong: 'rgba(55,53,47,0.26)',
      text: '#37352f',
      text2: '#6b6a66',
      text3: '#9b9a97',
      accent: '#2383e2',
      accentSoft: 'rgba(35,131,226,0.12)',
      onAccent: '#ffffff',
      positive: '#0f7b4f',
      warning: '#b7791f',
      negative: '#c0392b',
      info: '#2383e2',
      shadow: '0 8px 24px rgba(15,15,15,0.08)',
      mapBody: '#e6e4df',
      mapLine: 'rgba(55,53,47,0.18)',
      chrome: '#ffffff',
      colorScheme: 'light',
    },
  },
  ember: {
    id: 'ember',
    name: 'Ember',
    blurb: 'Cold near-black with a single warm coral. Pressed, tactile surfaces.',
    inspiredBy: 'Raycast',
    radius: { sm: '8px', md: '12px', lg: '16px', xl: '20px' },
    font: inter,
    tokens: {
      bg: '#07080a',
      surface1: '#0e1013',
      surface2: '#14171b',
      surface3: '#1c2026',
      borderSubtle: 'rgba(255,255,255,0.05)',
      border: 'rgba(255,255,255,0.09)',
      borderStrong: 'rgba(255,255,255,0.16)',
      text: '#ffffff',
      text2: '#9aa0a6',
      text3: '#5f666d',
      accent: '#ff6363',
      accentSoft: 'rgba(255,99,99,0.16)',
      onAccent: '#1a0b0b',
      positive: '#59d499',
      warning: '#ffb454',
      negative: '#ff6363',
      info: '#7aa7ff',
      shadow: '0 18px 44px rgba(0,0,0,0.5)',
      mapBody: '#1c2026',
      mapLine: 'rgba(255,255,255,0.10)',
      chrome: '#07080a',
      colorScheme: 'dark',
    },
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    blurb: 'Editor-dark neutrals with a restrained green signal.',
    inspiredBy: 'Supabase',
    radius: { sm: '6px', md: '8px', lg: '12px', xl: '16px' },
    font: inter,
    tokens: {
      bg: '#0f0f0f',
      surface1: '#171717',
      surface2: '#1c1c1c',
      surface3: '#242424',
      borderSubtle: '#242424',
      border: '#2e2e2e',
      borderStrong: '#393939',
      text: '#ededed',
      text2: '#a0a0a0',
      text3: '#707070',
      accent: '#3ecf8e',
      accentSoft: 'rgba(62,207,142,0.14)',
      onAccent: '#062d1c',
      positive: '#3ecf8e',
      warning: '#f5a623',
      negative: '#f04438',
      info: '#5fa8ff',
      shadow: '0 14px 36px rgba(0,0,0,0.45)',
      mapBody: '#242424',
      mapLine: '#393939',
      chrome: '#0f0f0f',
      colorScheme: 'dark',
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    blurb: 'Deep navy with an electric violet accent and cool off-white text.',
    inspiredBy: 'Stripe',
    radius: { sm: '8px', md: '12px', lg: '16px', xl: '22px' },
    font: inter,
    tokens: {
      bg: '#0a2540',
      surface1: '#0f2d4d',
      surface2: '#143559',
      surface3: '#1a3f68',
      borderSubtle: 'rgba(246,249,252,0.07)',
      border: 'rgba(246,249,252,0.12)',
      borderStrong: 'rgba(246,249,252,0.22)',
      text: '#f6f9fc',
      text2: '#a3b6cc',
      text3: '#6c839c',
      accent: '#635bff',
      accentSoft: 'rgba(99,91,255,0.18)',
      onAccent: '#ffffff',
      positive: '#3ecf8e',
      warning: '#ffbb00',
      negative: '#ff5c5c',
      info: '#00d4ff',
      shadow: '0 18px 44px rgba(3,20,40,0.55)',
      mapBody: '#1a3f68',
      mapLine: 'rgba(246,249,252,0.14)',
      chrome: '#0a2540',
      colorScheme: 'dark',
    },
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
export const DEFAULT_THEME: ThemeId = 'silent-black';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && value in THEMES;
}

/** Turn a theme into the CSS custom properties the stylesheet consumes. */
export function themeToCss(theme: Theme): string {
  const t = theme.tokens;
  const lines = [
    `color-scheme:${t.colorScheme}`,
    `--bg:${t.bg}`,
    `--surface-1:${t.surface1}`,
    `--surface-2:${t.surface2}`,
    `--surface-3:${t.surface3}`,
    `--border-subtle:${t.borderSubtle}`,
    `--border:${t.border}`,
    `--border-strong:${t.borderStrong}`,
    `--text:${t.text}`,
    `--text-2:${t.text2}`,
    `--text-3:${t.text3}`,
    `--accent:${t.accent}`,
    `--accent-soft:${t.accentSoft}`,
    `--on-accent:${t.onAccent}`,
    `--positive:${t.positive}`,
    `--warning:${t.warning}`,
    `--negative:${t.negative}`,
    `--info:${t.info}`,
    `--shadow:${t.shadow}`,
    `--map-body:${t.mapBody}`,
    `--map-line:${t.mapLine}`,
    `--radius-sm:${theme.radius.sm}`,
    `--radius-md:${theme.radius.md}`,
    `--radius-lg:${theme.radius.lg}`,
    `--radius-xl:${theme.radius.xl}`,
    `--font:${theme.font}`,
  ];
  return `[data-theme="${theme.id}"]{${lines.join(';')}}`;
}

export function allThemesCss(): string {
  return THEME_IDS.map(id => themeToCss(THEMES[id])).join('\n');
}
