import { signal, effect } from '@preact/signals';
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
    doc.documentElement.setAttribute('data-theme', id);
    doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.tokens.chrome);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* The session still follows the chosen theme. */
    }
  });
}
