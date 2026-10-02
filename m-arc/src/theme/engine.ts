import { signal, effect } from '@preact/signals';
import { isNative } from '@/native/capacitor';
import { DEFAULT_THEME, THEMES, allThemesCss, isThemeId, type ThemeId } from './themes';

const STORAGE_KEY = 'marc.theme';
const STYLE_ID = 'marc-theme-tokens';

function readSaved(): ThemeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isThemeId(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** True for a dark background (relative luminance under 0.4); `SystemBarsStyle.Dark` means light icons. */
export function isDarkBg(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return true;
  const n = parseInt(m[1]!, 16);
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L < 0.4;
}

/** The active theme id. Change it with `setTheme`. */
export const themeId = signal<ThemeId>(readSaved());

export function setTheme(id: ThemeId): void {
  themeId.value = id;
}

/** Inject token CSS once and keep <html> and the status bar in sync. */
export function installThemeEngine(doc: Document = document): void {
  if (!doc.getElementById(STYLE_ID)) {
    const style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = allThemesCss();
    doc.head.appendChild(style);
  }
  effect(() => {
    const id = themeId.value;
    const theme = THEMES[id];
    // QA5-17: without this, every transitioning element (theme cards, .card-press, .esc-dock)
    // fades to the new theme over its own ~150ms instead of switching on the same frame as
    // everything else, showing a grey flash mid-transition.
    doc.documentElement.classList.add('theme-switching');
    requestAnimationFrame(() => requestAnimationFrame(() => doc.documentElement.classList.remove('theme-switching')));
    doc.documentElement.setAttribute('data-theme', id);
    doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.tokens.chrome);
    // R5.4: edge-to-edge on Android 15+: the status and nav bar icons follow the theme.
    if (isNative()) void import('@capacitor/core').then(({ SystemBars, SystemBarsStyle }) => SystemBars.setStyle({ style: isDarkBg(theme.tokens.bg) ? SystemBarsStyle.Dark : SystemBarsStyle.Light })).catch(() => undefined);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* The session still follows the chosen theme. */
    }
  });
}
