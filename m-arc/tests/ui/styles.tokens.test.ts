import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DUR, REDUCED_DUR } from '@/ui/motion';

const cssPath = fileURLToPath(new URL('../../src/ui/styles.css', import.meta.url));
const css = readFileSync(cssPath, 'utf8');

// Animation names allowed to keep a literal, infinite-running duration: the handful of
// decorative loops the plan keeps outside the token system. I3 (batch b2b) deleted the
// exercise-breathe/exercise-shimmer loops, so they are gone from this list too.
// UI-1 brings back exercise-shimmer only: a finite run on open, infinite only while logging.
const ALLOW = ['esc-rot', 'esc-blink', 'esc-pulse', 'esc-lift', 'palace-glow', 'esc-spin', 'exercise-shimmer'];

const TOKENS_START = '/* tokens:start */';
const TOKENS_END = '/* tokens:end */';

function stripTokenBlock(source: string): string {
  const start = source.indexOf(TOKENS_START);
  const end = source.indexOf(TOKENS_END);
  if (start === -1 || end === -1) throw new Error('tokens:start/tokens:end markers not found');
  return source.slice(0, start) + source.slice(end + TOKENS_END.length);
}

function extractBlock(source: string, selector: string): string {
  const at = source.indexOf(selector);
  if (at === -1) throw new Error(`selector not found: ${selector}`);
  const open = source.indexOf('{', at);
  const close = source.indexOf('}', open);
  return source.slice(open + 1, close);
}

/** Like extractBlock, but tracks brace depth — needed for a rule whose body itself contains braces
 * (a @keyframes block's `from { ... }`/`to { ... }`), where extractBlock's first-`}` shortcut would
 * stop at the inner rule's closing brace instead of the outer one's. */
function extractBalanced(source: string, marker: string): string {
  const at = source.indexOf(marker);
  if (at === -1) throw new Error(`marker not found: ${marker}`);
  const open = source.indexOf('{', at);
  let depth = 0;
  let i = open;
  for (; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') { depth--; if (depth === 0) break; }
  }
  return source.slice(open + 1, i);
}

function parseVars(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /--([\w-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    const [, name, value] = m;
    if (name && value) out[name] = value.trim();
  }
  return out;
}

const TIME_RE = /\b\d*\.?\d+m?s\b/;
// Every ::view-transition-* pseudo-element takes a (name) argument (::view-transition-old(root),
// -group(name), ...); the bare `-name` form (no parens) never matches a real one.
const VT_RE = /::view-transition(?:-[\w-]+)?(?:\([^)]*\))?\s*\{([^}]*)\}/g;
const DECL_PROPS = ['transition', 'transition-duration', 'transition-delay', 'animation', 'animation-duration', 'animation-delay'];

interface Decl { prop: string; value: string; }

function findDeclarations(source: string): Decl[] {
  const decls: Decl[] = [];
  // QA5-10: terminate on `;` OR `}` (a block's last declaration often omits the semicolon), and
  // anchor on a real delimiter before the property name instead of a bare \b (so e.g. a selector
  // ending in a class named `...-transition` can't be mistaken for the property).
  const re = new RegExp(`(?:^|[{;\\s])(${DECL_PROPS.join('|')})\\s*:\\s*([^;}]+)`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const [, prop, value] = m;
    if (prop && value) decls.push({ prop, value: value.trim() });
  }
  return decls;
}

function animationNameOf(value: string): string {
  return value.split(/\s+/)[0] ?? '';
}

const withoutTokens = stripTokenBlock(css);

describe('styles.css motion token lint (F1)', () => {
  it('has no bare time literal in transition/animation outside the token block, unless allow-listed', () => {
    const offenders = findDeclarations(withoutTokens).filter(d => {
      if (!TIME_RE.test(d.value)) return false;
      if (d.prop.startsWith('animation') && ALLOW.includes(animationNameOf(d.value))) return false;
      return true;
    });
    expect(offenders).toEqual([]);
  });

  it('has no bare time literal inside a ::view-transition-* rule', () => {
    // QA5-10b: check the whole body against TIME_RE directly, not just declarations findDeclarations
    // recognizes (DECL_PROPS) — the spec says "any declaration", and a custom property such as
    // `--vt-d: 200ms` used by animation-duration:var(--vt-d) was invisible to the DECL_PROPS scan.
    const offenders: string[] = [];
    const re = new RegExp(VT_RE);
    let m: RegExpExecArray | null;
    while ((m = re.exec(withoutTokens))) {
      if (TIME_RE.test(m[1] ?? '')) offenders.push((m[1] ?? '').trim());
    }
    expect(offenders).toEqual([]);
  });

  it('has no cubic-bezier( outside the token block', () => {
    expect(withoutTokens.includes('cubic-bezier(')).toBe(false);
  });

  it('has no `transition: all`', () => {
    expect(/transition\s*:\s*all\b/.test(withoutTokens)).toBe(false);
  });

  it('has no `infinite` animation outside the allow list', () => {
    const offenders = findDeclarations(withoutTokens).filter(d => {
      if (!d.prop.startsWith('animation') || !/\binfinite\b/.test(d.value)) return false;
      return !ALLOW.includes(animationNameOf(d.value));
    });
    expect(offenders).toEqual([]);
  });

  // QA5-10: the check above only reads DECL_PROPS (transition*/animation*), so the longhand
  // animation-iteration-count: infinite (not in DECL_PROPS) slipped past it entirely, ALLOW or not.
  it('has no `animation-iteration-count: infinite` (the longhand form) anywhere', () => {
    expect(/animation-iteration-count\s*:\s*infinite/.test(withoutTokens)).toBe(false);
  });

  describe('the lint itself catches what QA5-10 found', () => {
    it('a semicolon-less last declaration', () => {
      const offenders = findDeclarations('.x { color: red; transition: opacity 200ms }').filter(d => TIME_RE.test(d.value));
      expect(offenders).toEqual([{ prop: 'transition', value: 'opacity 200ms' }]);
    });
    it('the ::view-transition-old(name) form', () => {
      const m = new RegExp(VT_RE).exec('::view-transition-old(root){animation-duration:200ms}');
      expect(m?.[1]).toBe('animation-duration:200ms');
      expect(TIME_RE.test(m![1]!)).toBe(true);
    });
    it('animation-iteration-count: infinite as a standalone longhand', () => {
      expect(/animation-iteration-count\s*:\s*infinite/.test('.x{animation: esc-fade var(--dur-base); animation-iteration-count: infinite;}')).toBe(true);
    });
    it('QA5-10b: a custom property with a time literal inside a view-transition body', () => {
      // e.g. ::view-transition-group(root){animation-name:x; --vt-d: 200ms} — DECL_PROPS never
      // sees a custom property, so only a whole-body TIME_RE scan catches this.
      expect(TIME_RE.test('animation-name:x; --vt-d: 200ms')).toBe(true);
    });
  });

  it('git grep for cubic-bezier( on the CSS file only matches inside the token range', () => {
    const start = css.indexOf(TOKENS_START);
    const end = css.indexOf(TOKENS_END);
    const re = /cubic-bezier\(/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(css))) {
      expect(m.index).toBeGreaterThan(start);
      expect(m.index).toBeLessThan(end);
    }
  });

  it('motion.ts DUR/REDUCED_DUR mirror the CSS duration tokens exactly', () => {
    const rootBlock = extractBlock(css, ':root {');
    const reduceBlock = extractBlock(css, 'html[data-motion="reduce"] {');
    const rootVars = parseVars(rootBlock);
    const reduceVars = parseVars(reduceBlock);

    const keyMap: Record<keyof typeof DUR, string> = {
      press: 'dur-press', fast: 'dur-fast', base: 'dur-base', enter: 'dur-enter', exit: 'dur-exit',
      sheet: 'dur-sheet', sheetExit: 'dur-sheet-exit', spring: 'dur-spring', bounce: 'dur-bounce',
      stagger: 'stagger', delayContent: 'delay-content',
    };

    for (const [key, cssVar] of Object.entries(keyMap) as [keyof typeof DUR, string][]) {
      const rootValue = rootVars[cssVar];
      if (!rootValue) throw new Error(`--${cssVar} missing from :root`);
      const rootMs = Number(rootValue.replace('ms', ''));
      expect(DUR[key], `DUR.${key} vs --${cssVar}`).toBe(rootMs);
      const reducedRaw = reduceVars[cssVar] ?? rootValue;
      const reducedMs = Number(reducedRaw.replace('ms', ''));
      expect(REDUCED_DUR[key], `REDUCED_DUR.${key} vs --${cssVar} under reduce`).toBe(reducedMs);
    }
  });
});

// I14: 15 ad-hoc font sizes (10, 10.5, 12.5, 15.5px, ...) collapsed to the §2 type ladder. Every
// font-size outside the token block must be a --fs-* var, except the 16px floor on form controls
// (iOS/Android zoom the page on focus below 16px).
describe('I14: font-size lint', () => {
  it('every font-size declaration is var(--fs-*), or 16px on input/select/textarea', () => {
    const re = /(^|[{;\s])font-size\s*:\s*([^;}]+)/g;
    const offenders: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(withoutTokens))) {
      const value = (m[2] ?? '').trim();
      if (/^var\(--fs-[\w-]+\)$/.test(value)) continue;
      if (value === '16px') continue;
      offenders.push(value);
    }
    expect(offenders).toEqual([]);
  });
});

// I17: 18 spacing values (mostly an off-grid 10px) and fixed radii collapsed onto one grid. Every
// border-radius outside the token block must be built from var(--radius-*), 0, 50% or inherit —
// a multi-value shorthand (each space-separated outside any calc()/max()) or a calc()/max() that
// wraps a var(--radius-*) are both allowed.
describe('I17: border-radius lint', () => {
  /** Splits a CSS value on top-level whitespace only — a calc()/max() argument list keeps its
   * own internal spaces (e.g. "max(var(--radius-xs), calc(var(--radius-lg) - 10px))"). */
  function splitTopLevel(value: string): string[] {
    const tokens: string[] = [];
    let depth = 0, cur = '';
    for (const ch of value) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ' ' && depth === 0) { if (cur) tokens.push(cur); cur = ''; }
      else cur += ch;
    }
    if (cur) tokens.push(cur);
    return tokens;
  }

  const TOKEN_RE = /^(0|50%|inherit|var\(--radius-[\w-]+\)|(?:calc|max)\(.*var\(--radius-[\w-]+\).*\))$/;

  it('every border-radius declaration is built from var(--radius-*), 0, 50% or inherit', () => {
    const re = /(^|[{;\s])border-radius\s*:\s*([^;}]+)/g;
    const offenders: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(withoutTokens))) {
      const value = (m[2] ?? '').trim();
      if (!splitTopLevel(value).every(t => TOKEN_RE.test(t))) offenders.push(value);
    }
    expect(offenders).toEqual([]);
  });

  it('the lint accepts a multi-value shorthand and a calc()/max() wrapping var(--radius-*)', () => {
    expect(splitTopLevel('var(--radius-lg) var(--radius-lg) var(--radius-xs) var(--radius-lg)').every(t => TOKEN_RE.test(t))).toBe(true);
    expect(splitTopLevel('max(var(--radius-xs), calc(var(--radius-lg) - 10px))').every(t => TOKEN_RE.test(t))).toBe(true);
  });

  it('the lint rejects a literal pixel radius', () => {
    expect(TOKEN_RE.test('8px')).toBe(false);
  });
});

// I9: switching tabs is a quick crossfade (opacity only) — the 6px translateY it used to carry is
// gone, since App.tsx's nav now does its own scrollTo per tab (a competing transform would fight it).
describe('I9: .view is a crossfade, not a slide', () => {
  it('the view-in keyframes contain only opacity', () => {
    const body = extractBalanced(css, '@keyframes view-in');
    expect(body).toMatch(/opacity/);
    expect(body).not.toMatch(/transform/);
  });
});
