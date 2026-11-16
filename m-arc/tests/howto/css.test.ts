// HT2-A6: css.mjs rewrites the golden CSS mechanically (one test per rule), and the generated How-to CSS passes
// the app's style lints: scoped under .ht, token-only var(), times/beziers/font-size/radius literals only in
// ht-tokens, no infinite loop, no exercise-* keyframes, the inline custom properties on the enumerated allow list,
// and none of the 13 still-banned FG-1 tokens.
import { readFileSync, readdirSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { THEMES, themeToCss } from '@/theme/themes';
import { HOWTO_IDS } from '@/howto/ids';

/* eslint-disable @typescript-eslint/no-explicit-any */
let c: any, g: any;
beforeAll(async () => {
  c = await import(/* @vite-ignore */ new URL('../../tools/plates/css.mjs', import.meta.url).href);
  g = await import(/* @vite-ignore */ new URL('../../tools/plates/golden.mjs', import.meta.url).href);
});
const DIR = 'src/slices/howto/css';
const cssFiles = () => readdirSync(DIR).filter(f => f.endsWith('.css')).map(f => `${DIR}/${f}`);
const rows = JSON.parse(readFileSync('tools/plates/plates.json', 'utf8')) as Record<string, { slug: string }>;

/** The 13 FG-1 tokens that stay banned (D-HT1). */
export const BANNED = ['target', 'help', 'quiet', 'pants', 'pants-hi', 'pants-sh', 'ink', 'iron', 'iron-hi', 'iron-sh', 'eye', 'floor', 'guide'];
/** Custom properties generated markup may set inline (the golden's and golden B's own; critic fix 21). */
export const INLINE_ALLOW = ['--o', '--i', '--gd', '--feel-from', '--feel-to', '--feel-delay'];

const TIME = /(^|[\s:(,*])(\d*\.?\d+m?s)(?=[\s;,)]|$)/;
/** The lints, as one function so each failure path can be shown on a bad input. Returns the problems. */
export function lint(css: string): string[] {
  const bad: string[] = [];
  const a = css.indexOf('/* ht-tokens:start */'), b = css.indexOf('/* ht-tokens:end */');
  if (a < 0 || b < a) return ['no ht-tokens block'];
  const tokensBlock = css.slice(a, b), rest = css.slice(0, a) + css.slice(b);
  const htDefined = new Set([...tokensBlock.matchAll(/(--ht-[\w-]+)\s*:/g)].map(m => m[1]));
  const theme = new Set([...themeToCss(THEMES.paper).matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
  const app = new Set([...readFileSync('src/ui/styles.css', 'utf8').matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
  const body = rest.replace(/\/\*[\s\S]*?\*\//g, '');
  let heads = 0;
  for (const [, head] of body.replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '').matchAll(/([^{}]+)\{/g)) {
    const sel = head!.trim();
    if (sel.startsWith('@')) continue;
    heads++;
    for (const s of sel.split(',').map(x => x.trim())) if (!/^(html(?:[:[]\S*)?\s+)?\.ht( |$)/.test(s)) bad.push(`selector not under .ht: ${s}`);
  }
  if (!heads) bad.push('no rules');
  for (const [, v] of body.matchAll(/var\((--[\w-]+)/g)) if (!theme.has(v!) && !app.has(v!) && !htDefined.has(v!) && !INLINE_ALLOW.includes(v!)) bad.push(`var(${v}) is not a token`);
  for (const [, prop, val] of body.matchAll(/(?:^|[{;\s])([a-z-]+)\s*:\s*([^;}]+)/g)) {
    if (prop!.startsWith('--')) continue;
    if (TIME.test(val!) || /cubic-bezier\(/.test(val!)) bad.push(`literal time outside ht-tokens: ${prop}: ${val}`);
    if (prop === 'font-size' && !/^var\(--(fs|ht)-[\w-]+\)$/.test(val!.trim())) bad.push(`font-size literal: ${val}`);
    if (prop === 'border-radius' && !/^var\(--(radius|ht)-[\w-]+\)$/.test(val!.trim())) bad.push(`border-radius literal: ${val}`);
    if (/\binfinite\b/.test(val!)) bad.push(`infinite: ${prop}: ${val}`);
  }
  if (/@keyframes\s+exercise-/.test(body)) bad.push('exercise-* keyframes');
  for (const t of BANNED) if (new RegExp(`--${t}(?![\\w-])`).test(css)) bad.push(`banned FG-1 token --${t}`);
  if (/\[data-theme=/.test(css)) bad.push('a golden per-theme block was kept');
  return bad;
}
/** Inline custom properties set in markup: every --name in a style="" attribute. */
export const inlineVars = (html: string) => [...html.matchAll(/style="([^"]*)"/g)].flatMap(m => [...m[1]!.matchAll(/(--[\w-]+)\s*:/g)].map(v => v[1]!));

describe('HT2-A6 css.mjs rules (one test per rule)', () => {
  it('rule 1, class map: .plate -> .ht-plate and .plate-fit -> .ht-plate-fit, class tokens only', () => {
    expect(c.mapClasses('.plate .dot')).toBe('.ht-plate .dot');
    expect(c.mapClasses('.plate-fit .plate')).toBe('.ht-plate-fit .ht-plate');
    expect(c.mapClasses('.plate.tracing .trace')).toBe('.ht-plate.tracing .trace');
    for (const s of ['.plate-svg', '.plate-meta', '.plate-callout.m::before', '.plate-arc-label b', '.plate-controls', '[data-x="plate"]']) expect(c.mapClasses(s)).toBe(s);
  });
  it('rule 2, scope: every selector gets .ht; html:… stays in front; #sheets <x> becomes .ht <x>', () => {
    expect(c.rewriteCss('.a, .b .c { color: var(--text); }')).toContain('.ht .a, .ht .b .c { color: var(--text); }');
    expect(c.scope('html:not([data-motion="reduce"]) .ht-plate.tracing .trace')).toBe('html:not([data-motion="reduce"]) .ht .ht-plate.tracing .trace');
    expect(c.scope('#sheets .plate-callout:focus-visible')).toBe('.ht .plate-callout:focus-visible');
    expect(c.rewriteCss('@media (max-width: 349px) { .plate-fit { width: 1%; } }')).toContain('@media (max-width: 349px) {\n  .ht .ht-plate-fit { width: 1%; }\n}');
    expect(c.rewriteCss('@keyframes plate-fade { from { opacity: 0; } }')).toContain('@keyframes plate-fade { from { opacity: 0; } }');
  });
  it('rule 3, page-only rules are dropped; the part of a reset the app lacks (figure) is kept', () => {
    const out = c.rewriteCss(':root { --pg-bg: #fff; }\n.pg-head { x: 1; }\nbody { x: 1; }\n.eyebrow { x: 1; }\n#sheets { x: 1; }\n#sheets h3 { x: 1; }\n[data-theme="paper"]{--bg:#fff}\n.group-title { x: 1; }\n/* tokens:start */:root { --fs-cap: 11px; }/* tokens:end */\nh1, h2, h3, p, figure { margin: 0; }\n.tells { x: 1; }');
    expect(out.split('\n').slice(3)).toEqual(['.ht figure { margin: 0; }', '.ht .tells { x: 1; }', '']);
  });
  it('rule 4, banned literals move into ht-tokens with identical values; an unmapped literal throws', () => {
    const out = c.rewriteCss('.a { animation: plate-fade 160ms var(--ease-standard) 2.3s both; border-radius: 1px; transition-delay: calc(var(--i) * 80ms); }');
    expect(out).toContain('.ht { --ht-arrow-at: 2.3s; --ht-arrow-dur: 160ms; --ht-ghost-step: 80ms; --ht-radius-tick: 1px; }');
    expect(out).toContain('.ht .a { animation: plate-fade var(--ht-arrow-dur) var(--ease-standard) var(--ht-arrow-at) both; border-radius: var(--ht-radius-tick); transition-delay: calc(var(--i) * var(--ht-ghost-step)); }');
    expect(() => c.rewriteCss('.a { transition: opacity 170ms; }')).toThrow(/170ms/);
    expect(() => c.rewriteCss('.a { font-size: 12px; }')).toThrow(/font-size/);
  });
  it('the generated plate.css is exactly rewriteCss(the fixture\'s <style>)', () => {
    const text = readFileSync(`${DIR}/plate.css`, 'utf8');
    expect(text.slice(text.indexOf('\n') + 1)).toBe(c.rewriteCss(c.galleryCss(readFileSync(g.FIXTURE, 'utf8'))));
  });
  it('every rule on .plate-svg, .plate-callout, .plate-meta, .plate-arc-label, .tells and .tempo survives unchanged but for .ht and the ht tokens', () => {
    const golden = c.parse(c.galleryCss(readFileSync(g.FIXTURE, 'utf8'))).flatMap((n: any) => (n.sel != null ? [n] : Array.isArray(n.body) ? n.body.map((r: any) => ({ ...r, at: n.at })) : []));
    const out = readFileSync(`${DIR}/plate.css`, 'utf8'), tokens = Object.fromEntries(Object.entries(c.HT_TOKENS).map(([lit, t]) => [t, lit]));
    const plain = (s: string) => s.replace(/var\((--ht-[\w-]+)\)/g, (_, t) => tokens[t] as string);
    const touching = golden.filter((r: any) => /\.(plate-svg|plate-callout|plate-meta|plate-arc-label|tells|tempo)(?![\w])/.test(r.sel));
    expect(touching.length).toBeGreaterThan(25);
    for (const r of touching) {
      const sel = r.sel.split(',').map((s: string) => c.scope(c.mapClasses(s.trim()))).join(', ');
      const line = out.split('\n').find(l => l.trim().startsWith(`${sel} {`) && plain(l.trim()) === `${sel} { ${r.body} }`);
      expect(line, `${r.at ?? ''} ${r.sel}`).toBeDefined();
    }
  });
});

describe('HT2-A6 lints on src/slices/howto/css/*.css', () => {
  it('every generated CSS file passes', () => {
    expect(cssFiles().length).toBeGreaterThan(0);
    expect(lint('/* ht-tokens:start */ .ht { } /* ht-tokens:end */\n@media (x) {\n  .tells { color: var(--text); }\n}\n')).toEqual(['selector not under .ht: .tells']);
    for (const f of cssFiles()) expect(lint(readFileSync(f, 'utf8')), f).toEqual([]);
  });
  const ok = () => readFileSync(`${DIR}/plate.css`, 'utf8');
  it('a selector without .ht fails', () => expect(lint(`${ok()}.tempo { color: var(--text); }\n`)).toEqual(['selector not under .ht: .tempo']));
  it('transition: 160ms outside ht-tokens fails', () => expect(lint(`${ok()}.ht .x { transition: opacity 160ms; }\n`)).toEqual(['literal time outside ht-tokens: transition: opacity 160ms']));
  it('a literal font-size, a literal radius, infinite, exercise-* keyframes and a non-token var() fail', () => {
    expect(lint(`${ok()}.ht .x { font-size: 12px; border-radius: 3px; animation: spin var(--ht-trace) infinite; color: var(--nope); }\n@keyframes exercise-x { from { opacity: 0; } }\n`)).toEqual([
      'var(--nope) is not a token', 'font-size literal: 12px', 'border-radius literal: 3px', 'infinite: animation: spin var(--ht-trace) infinite', 'exercise-* keyframes']);
  });
  it('keeping one golden theme block fails (it defines the banned FG-1 tokens)', () => {
    const block = c.galleryCss(readFileSync(g.FIXTURE, 'utf8')).split('\n').find((l: string) => l.startsWith('[data-theme="ember"]'));
    expect(lint(`${ok()}${block}\n`)).toEqual(expect.arrayContaining(['banned FG-1 token --target', 'banned FG-1 token --guide', 'a golden per-theme block was kept']));
  });
  it('none of the 13 still-banned FG-1 tokens appears in any generated CSS', () => {
    for (const f of cssFiles()) for (const t of BANNED) expect(readFileSync(f, 'utf8'), `${f} --${t}`).not.toMatch(new RegExp(`--${t}(?![\\w-])`));
  });
});

describe('HT2-A6 inline custom properties in generated markup', () => {
  it('every style="" custom property in every generated string is on the allow list', async () => {
    let seen = 0;
    for (const id of HOWTO_IDS) {
      const m = (await import(/* @vite-ignore */ new URL(`../../src/howto/generated/ht-${rows[id]!.slug}.ts`, import.meta.url).href)).default;
      const strings = [m.plate.normal.svg, m.plate.normal.overlay, m.plate.mistake.svg, m.plate.mistake.overlay, m.plate.tells, m.plate.tempo];
      for (const v of strings.flatMap(inlineVars)) { seen++; expect(INLINE_ALLOW, `${id}: ${v}`).toContain(v); }
    }
    expect(seen).toBeGreaterThan(0);
  });
  it('an inline --x in a fragment fails', () => {
    expect(inlineVars('<g class="ghost" style="--o:.12;--x:1">').filter(v => !INLINE_ALLOW.includes(v))).toEqual(['--x']);
  });
});
