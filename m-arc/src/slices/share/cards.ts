/**
 * F12: the three share cards as standalone SVG, from the design study (Poster, Sticker, Receipt).
 * One drawing serves the sheet's preview and the PNG export, so what you see is what you share.
 * Laid out on a 360-wide grid (360×640 story, 360×360 square) and exported at 3×: 1080×1920 or
 * 1080×1080. Colours come from the active theme's tokens; nothing here reads the DOM.
 */
import type { Theme } from '@/theme/themes';
import type { MuscleId } from '@/data/muscles';
import { BACK_PARTS, BACK_VIEWBOX, FRONT_PARTS, FRONT_VIEWBOX, type BodyPart } from '@/svg/bodyMuscles';
import { markSvg } from '@/svg/logo';
import { groupInt, timeText, volumeHero, volumeShort, type ShareCardData } from './cardData';

export type CardStyle = 'poster' | 'sticker' | 'receipt';
export type CardFormat = 'story' | 'square';
export const CARD_STYLES: Array<{ id: CardStyle; name: string }> = [
  { id: 'poster', name: 'Poster' },
  { id: 'sticker', name: 'Sticker' },
  { id: 'receipt', name: 'Receipt' },
];
/** Export size in pixels. */
export const CARD_PX: Record<CardFormat, { w: number; h: number }> = { story: { w: 1080, h: 1920 }, square: { w: 1080, h: 1080 } };
/**
 * The saved PNG's name. Local time to the second, plus the session on a workout card, so a second
 * Save never overwrites the first (QA4-4): two sessions on one day, or the same card with a new photo.
 */
export function cardFileName(o: { period: string; style: CardStyle; format: CardFormat; to: string; now: Date; sessionId?: string | null }): string {
  const p2 = (n: number) => String(n).padStart(2, '0');
  const time = `${p2(o.now.getHours())}${p2(o.now.getMinutes())}${p2(o.now.getSeconds())}`;
  const sid = o.sessionId ? `-${o.sessionId.replace(/[^A-Za-z0-9_-]/g, '')}` : '';
  return `marc-${o.period}-${o.style}-${o.format === 'story' ? '9x16' : '1x1'}-${o.to}-${time}${sid}.png`;
}
const W = 360;
const H: Record<CardFormat, number> = { story: 640, square: 360 };

export interface CardPalette { bg: string; ink: string; accent: string; mapBody: string; font: string }

export function paletteFor(theme: Theme): CardPalette {
  const t = theme.tokens;
  return { bg: t.bg, ink: t.text, accent: t.accent, mapBody: t.mapBody, font: theme.font };
}

export interface CardOptions {
  /** A background photo as a data URL; the text turns white over a dark scrim. */
  photo?: string | null;
  /** Escobar's mark (a PNG data URL), drawn in the accent colour near the bottom. */
  mark?: string | null;
}

/* ---------- small SVG helpers ---------- */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fam = (f: string) => esc(f.replace(/"/g, "'"));
const DISP = `'Barlow Condensed','Roboto Condensed',sans-serif-condensed,'Arial Narrow',Impact,sans-serif`;
const MONO = `'JetBrains Mono','Roboto Mono','Droid Sans Mono',ui-monospace,Menlo,monospace`;

interface TextOpts { size: number; weight?: number; fill: string; anchor?: 'start' | 'middle' | 'end'; family: string; ls?: number; opacity?: number }
function text(x: number, y: number, s: string, o: TextOpts): string {
  return `<text x="${r(x)}" y="${r(y)}" font-family="${fam(o.family)}" font-size="${o.size}" font-weight="${o.weight ?? 400}" fill="${o.fill}"${o.anchor && o.anchor !== 'start' ? ` text-anchor="${o.anchor}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.opacity != null && o.opacity < 1 ? ` fill-opacity="${o.opacity}"` : ''}>${esc(s)}</text>`;
}
const r = (n: number) => Math.round(n * 100) / 100;
/** Cuts text that would run past `max` characters. */
const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, Math.max(1, max - 1)).trimEnd()}…` : s);
/** Rough width of a run of text: fine for pills and centring, never for fitting a line. */
const approxWidth = (s: string, size: number, ls = 0, k = 0.62) => s.length * (size * k + ls);

function hex(c: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return null;
  const h = m[1]!.length === 3 ? [...m[1]!].map(x => x + x).join('') : m[1]!;
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** `pct`% of colour a over b, like CSS color-mix in sRGB. */
export function mix(a: string, b: string, pct: number): string {
  const x = hex(a), y = hex(b);
  if (!x || !y) return a;
  const p = Math.max(0, Math.min(100, pct)) / 100;
  return `#${x.map((v, i) => Math.round(v * p + y[i]! * (1 - p)).toString(16).padStart(2, '0')).join('')}`;
}
/** A colour with alpha, from a hex token. */
export function alpha(c: string, a: number): string {
  const x = hex(c);
  return x ? `rgba(${x[0]},${x[1]},${x[2]},${a})` : c;
}

/* ---------- shared parts ---------- */

interface Ctx { d: ShareCardData; f: CardFormat; h: number; pal: CardPalette; ink: string; photo: boolean }

function brand(x: number, y: number, c: Ctx, suffix = '', anchor: 'start' | 'middle' = 'start'): string {
  const label = `M/ARC${suffix}`;
  const w = 22 + 6 + approxWidth(label, 11, 1.54, 0.64);
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  const mark = markSvg({ ink: c.ink, accent: c.pal.accent, bg: 'none' }, { size: 22 }).replace('<svg ', '<svg x="0" y="0" ');
  return `<g transform="translate(${r(x0)} ${r(y - 11)})">${mark}</g>${text(x0 + 28, y + 4, label, { size: 11, weight: 700, fill: c.ink, family: c.pal.font, ls: 1.54 })}`;
}

function pill(xRight: number, y: number, s: string, c: Ctx): string {
  const label = s.toUpperCase();
  const w = approxWidth(label, 10.5, 1.05, 0.66) + 20;
  return `<rect x="${r(xRight - w)}" y="${r(y - 11)}" width="${r(w)}" height="22" rx="11" fill="${c.ink}" fill-opacity="0.12"/>${text(xRight - w / 2, y + 3.8, label, { size: 10.5, weight: 700, fill: c.ink, family: c.pal.font, ls: 1.05, anchor: 'middle' })}`;
}

function kpis(x: number, yBottom: number, width: number, c: Ctx): string {
  const cells = c.d.period === 'workout'
    ? [[timeText(c.d), 'Time'], [groupInt(c.d.sets), 'Sets'], [String(c.d.records.length), 'PRs']]
    : [[groupInt(c.d.sessions), 'Sessions'], [timeText(c.d), 'Time'], [String(c.d.records.length), 'PRs']];
  // Time ("13 h 40 m", "1:02:05") is the longest value, so its column is wider; anything still too wide shrinks.
  const timeCol = c.d.period === 'workout' ? 0 : 1;
  const share = cells.map((_, i) => (i === timeCol ? 0.44 : 0.28));
  let cx = x;
  return cells.map(([v, l], i) => {
    const col = (width - 20) * share[i]!;
    const size = Math.min(26, col / (v!.length * 0.56));
    const out = text(cx, yBottom - 15, v!, { size: r(size), weight: 700, fill: i === 2 ? c.pal.accent : c.ink, family: DISP })
      + text(cx, yBottom, l!.toUpperCase(), { size: 9.5, weight: 600, fill: c.ink, family: c.pal.font, ls: 1.14, opacity: 0.72 });
    cx += col + 10;
    return out;
  }).join('');
}

function photoLayer(c: Ctx, photo: string): string {
  return `<image href="${esc(photo)}" x="0" y="0" width="${W}" height="${c.h}" preserveAspectRatio="xMidYMid slice"/>`
    + `<defs><linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.35"/><stop offset="0.3" stop-color="#000" stop-opacity="0"/><stop offset="0.5" stop-color="#000" stop-opacity="0.05"/><stop offset="1" stop-color="#000" stop-opacity="0.78"/></linearGradient></defs>`
    + `<rect width="${W}" height="${c.h}" fill="url(#scrim)"/>`;
}

function glow(c: Ctx, strong: number, soft: number): string {
  return `<rect width="${W}" height="${c.h}" fill="${c.pal.bg}"/>`
    + `<defs><radialGradient id="g1" cx="${W * 0.8}" cy="0" r="${c.h * 0.75}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.pal.accent}" stop-opacity="${strong}"/><stop offset="1" stop-color="${c.pal.accent}" stop-opacity="0"/></radialGradient>`
    + `<radialGradient id="g2" cx="0" cy="${c.h}" r="${c.h * 0.6}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.pal.accent}" stop-opacity="${soft}"/><stop offset="1" stop-color="${c.pal.accent}" stop-opacity="0"/></radialGradient></defs>`
    + `<rect width="${W}" height="${c.h}" fill="url(#g1)"/><rect width="${W}" height="${c.h}" fill="url(#g2)"/>`;
}

function coachMark(c: Ctx, mark: string): string {
  const s = c.f === 'story' ? 24 : 18;
  const y = c.f === 'story' ? c.h - 124 - s : c.h - 10 - s;
  const x = W / 2 - s / 2;
  return `<defs><mask id="em" maskUnits="userSpaceOnUse" x="${r(x)}" y="${r(y)}" width="${s}" height="${s}" style="mask-type:alpha"><image href="${esc(mark)}" x="${r(x)}" y="${r(y)}" width="${s}" height="${s}"/></mask></defs>`
    + `<rect x="${r(x)}" y="${r(y)}" width="${s}" height="${s}" fill="${c.pal.accent}" fill-opacity="0.9" mask="url(#em)"/>`;
}

/** The headline number: weight lifted, or working sets when nothing was loaded (QA4-9: never "0 kg lifted"). */
function heroOf(d: ShareCardData): { big: string; unit: string } {
  return d.volume > 0 ? volumeHero(d.volume, d.unit) : { big: groupInt(d.sets), unit: 'sets done' };
}

/* ---------- A. Poster ---------- */

function poster(c: Ctx): string {
  const sq = c.f === 'square';
  const pad = sq ? 24 : 26, top = sq ? 22 : 96, bottom = c.h - (sq ? 34 : 160);
  const hero = heroOf(c.d);
  const big = sq ? 78 : 104;
  const title = clip([c.d.title, c.d.sub].filter(Boolean).join(' · '), sq ? 38 : 36);
  const fun = c.d.compare?.text ?? '';
  // Rule, title, big number, unit, comparison: stacked and centred between the top row and the numbers.
  // The comma of "2,780" drops below the baseline, so the unit sits a quarter of the size lower.
  const heroH = 3 + 6 + 16 + 6 + big * 0.8 + big * 0.24 + 14 + (fun ? 6 + 14 : 0);
  const topRow = top + 11, kpiTop = bottom - 42;
  let y = topRow + 11 + (kpiTop - (topRow + 11) - heroH) / 2;
  let out = brand(pad, topRow, c) + pill(W - pad, topRow, c.d.label, c);
  out += `<rect x="${pad}" y="${r(y)}" width="48" height="3" rx="1.5" fill="${c.pal.accent}"/>`; y += 3 + 6 + 13;
  out += text(pad, y, title, { size: 15, weight: 600, fill: c.ink, family: c.pal.font, opacity: 0.9 }); y += 3 + 6 + big * 0.8;
  // Without a condensed font a long number could run off the card: squeeze it to fit.
  const room = W - pad * 2 + 4, guess = approxWidth(hero.big, big, 0, 0.6);
  out += text(pad - 2, y, hero.big, { size: big, weight: 800, fill: c.ink, family: DISP }).replace('<text ', guess > room ? `<text textLength="${r(room)}" lengthAdjust="spacingAndGlyphs" ` : '<text ');
  y += big * 0.24 + 14;
  out += text(pad, y, hero.unit.toUpperCase(), { size: 13, weight: 700, fill: c.ink, family: c.pal.font, ls: 2.08 });
  if (fun) { y += 6 + 14; out += text(pad, y, fun, { size: 13, weight: 500, fill: c.ink, family: c.pal.font, opacity: 0.8 }); }
  return out + kpis(pad, bottom, W - pad * 2, c);
}

/* ---------- B. Sticker ---------- */

/** Front and back figures lit by effective sets, drawn from the app's body map. */
function figures(x: number, y: number, height: number, c: Ctx): string {
  const sets = c.d.muscleSets;
  // Muscles with no region of their own light their neighbour, as on the app's map.
  const val = (m: MuscleId): number => (sets[m] ?? 0) + (m === 'biceps' ? sets.brachialis ?? 0 : m === 'rear_delts' ? sets.rotator_cuff ?? 0 : 0);
  const max = Math.max(0, ...(Object.keys(sets) as MuscleId[]).map(val));
  const idle = alpha(c.ink, 0.13);
  const fill = (p: BodyPart) => {
    const v = p.muscle ? val(p.muscle) : 0;
    return !v || !max ? idle : mix(c.pal.accent, c.pal.mapBody, 25 + 75 * Math.min(1, v / max));
  };
  const w = height * (35 / 93);
  const fig = (parts: BodyPart[], vb: string, fx: number) => `<svg x="${r(fx)}" y="${r(y)}" width="${r(w)}" height="${height}" viewBox="${vb}">${parts.map(p => `<path d="${p.d}" fill="${fill(p)}"/>`).join('')}</svg>`;
  return fig(FRONT_PARTS, FRONT_VIEWBOX, x - w - 2) + fig(BACK_PARTS, BACK_VIEWBOX, x + 2);
}

function sticker(c: Ctx): string {
  const sq = c.f === 'square';
  const cx = W / 2, gap = sq ? 8 : 14, val = sq ? 30 : 40, figH = sq ? 0 : 92;
  const hero = heroOf(c.d);
  const rows: Array<[string, string, boolean]> = [
    c.d.period === 'workout' ? [clip(c.d.title, 30), timeText(c.d), false] : ['Sessions', groupInt(c.d.sessions), false],
    [hero.unit.replace(/^k lb/, 'thousand lb'), hero.big, false],
    ['Personal records', String(c.d.records.length), true],
  ];
  const rowH = 12 + 2 + val * 0.9;
  const total = 22 + rows.length * (gap + rowH) + (figH ? gap + figH : 0);
  let y = (c.h - total) / 2;
  let out = brand(cx, y + 11, c, ` · ${clip(c.d.label.toUpperCase(), 22)}`, 'middle');
  y += 22;
  for (const [label, v, accent] of rows) {
    y += gap + 10;
    out += text(cx, y, label.toUpperCase(), { size: 10, weight: 600, fill: c.ink, family: c.pal.font, ls: 1.6, anchor: 'middle', opacity: 0.9 });
    y += 4 + val * 0.9;
    out += text(cx, y, v, { size: val, weight: 700, fill: accent ? c.pal.accent : c.ink, family: DISP, anchor: 'middle' });
  }
  if (figH) out += figures(cx, y + gap + 4, figH, c);
  // A soft shadow keeps white text readable on any photo it is pasted onto.
  return `<defs><filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="5" flood-color="#000" flood-opacity="0.45"/></filter></defs><g filter="url(#sh)">${out}</g>`;
}

/* ---------- C. Receipt ---------- */

const PAPER = '#f4f1ea', PAPER_INK = '#1d1c1a', LEADER = '#a7a295', DASH = '#8d887c';

function star(x: number, yBase: number, size: number, fill: string): string {
  const cx = x + size * 0.3, cy = yBase - size * 0.36, R = size * 0.36, ri = R * 0.45;
  const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rad = i % 2 ? ri : R; return `${r(cx + rad * Math.cos(a))},${r(cy + rad * Math.sin(a))}`; }).join(' ');
  return `<polygon points="${pts}" fill="${fill}"/>`;
}

function receipt(c: Ctx): string {
  const sq = c.f === 'square';
  const fs = sq ? 9.5 : 11, lh = fs * 1.5, cw = fs * 0.6;
  const pw = sq ? 280 : 300, padX = sq ? 14 : 16, padT = sq ? 12 : 18, padB = sq ? 10 : 14;
  const inner = pw - padX * 2, cols = Math.floor(inner / cw);
  const items = c.d.lines.slice(0, sq ? 4 : 6);
  const sub = c.d.sub.toUpperCase();
  const summary: Array<[string, string, boolean]> = [
    c.d.period === 'workout' ? ['SETS', groupInt(c.d.sets), false] : ['SESSIONS', groupInt(c.d.sessions), false],
    ...(sq ? [] : [['TIME', timeText(c.d).toUpperCase(), false] as [string, string, boolean]]),
    ['PERSONAL RECORDS', String(c.d.records.length), true],
  ];
  const barH = sq ? 20 : 34;
  const hostTop = sq ? 14 : 88, hostBottom = c.h - (sq ? 34 : 150);
  const px = (W - pw) / 2;
  let y = padT + (fs + 3);
  const L = padX, R = pw - padX;
  let body = text(pw / 2, y, 'M/ARC GYM', { size: fs + 3, weight: 700, fill: PAPER_INK, family: MONO, ls: 1.7, anchor: 'middle' });
  y += lh;
  body += text(pw / 2, y, clip(c.d.title.toUpperCase(), cols), { size: fs, weight: 500, fill: PAPER_INK, family: MONO, anchor: 'middle' });
  if (sub) { y += lh; body += text(pw / 2, y, clip(sub, cols), { size: fs, weight: 500, fill: PAPER_INK, family: MONO, anchor: 'middle' }); }
  const dash = () => { y += 8; const s = `<line x1="${L}" x2="${R}" y1="${r(y)}" y2="${r(y)}" stroke="${DASH}" stroke-dasharray="3 2" stroke-width="1"/>`; y += 8; return s; };
  /** Name, dotted leader and a right-aligned value on one monospaced line. */
  const line = (name: string, value: string, o: { detail?: string; pr?: boolean; starValue?: boolean; bold?: boolean; size?: number; valueFill?: string } = {}) => {
    y += lh;
    const size = o.size ?? fs, w = size * 0.6, n = Math.floor(inner / w);
    const lead = o.pr ? 2 : 0, tail = o.starValue ? 2 : 0;
    const room = n - lead - tail - value.length - 1;
    // The exercise name gives way first, so the sets and load always show.
    const nm = o.detail ? `${clip(name, Math.max(3, room - 3 - o.detail.length - 1))} ${o.detail}` : clip(name, Math.max(3, room - 3));
    const dots = Math.max(0, room - nm.length - 1);
    const weight = o.bold ? 700 : 500;
    return (o.pr ? star(L, y, size, c.pal.accent) : '')
      + `<text x="${r(L + lead * w)}" y="${r(y)}" font-family="${fam(MONO)}" font-size="${size}" font-weight="${weight}" fill="${PAPER_INK}">${esc(nm)}<tspan fill="${LEADER}">${dots ? ` ${'.'.repeat(dots)}` : ''}</tspan></text>`
      + (o.starValue ? star(R - (value.length + 2) * w, y, size, c.pal.accent) : '')
      + text(R, y, value, { size, weight, fill: o.valueFill ?? PAPER_INK, family: MONO, anchor: 'end' });
  };
  body += dash();
  y -= lh * 0.35;
  for (const it of items) body += line(it.name.toUpperCase(), it.value.toUpperCase(), { detail: it.detail.toUpperCase(), pr: it.pr });
  body += dash();
  y -= lh * 0.35;
  for (const [n, v, acc] of summary) body += acc ? line(n, v, { starValue: true, valueFill: c.pal.accent }) : line(n, v);
  body += dash();
  y -= lh * 0.35;
  if (c.d.volume > 0) body += line('TOTAL LIFTED', volumeShort(c.d.volume, c.d.unit).toUpperCase(), { bold: true, size: fs + 2 });
  y += 8;
  let bx = 0; const bars: string[] = [];
  for (let i = 0; i < 44; i++) { const bw = ((i * 7) % 3) + 1; bars.push(`<rect x="${r(bx)}" y="0" width="${bw}" height="${barH}" fill="${PAPER_INK}"/>`); bx += bw + 1.5; }
  body += `<g transform="translate(${r((pw - bx + 1.5) / 2)} ${r(y)})">${bars.join('')}</g>`;
  y += barH + 2 + lh * 0.8;
  body += text(pw / 2, y, 'THANK YOU FOR LIFTING', { size: fs, weight: 500, fill: PAPER_INK, family: MONO, anchor: 'middle' });
  const h = y + padB;
  // Torn edges: half-circle bites every 12 px along the top and bottom.
  const bites = Array.from({ length: Math.ceil(pw / 12) + 1 }, (_, i) => `<circle cx="${i * 12 + 6}" cy="0" r="5"/><circle cx="${i * 12 + 6}" cy="${r(h)}" r="5"/>`).join('');
  const paper = `<defs><mask id="torn" maskUnits="userSpaceOnUse" x="0" y="0" width="${pw}" height="${r(h)}"><rect width="${pw}" height="${r(h)}" fill="#fff"/><g fill="#000">${bites}</g></mask>`
    + `<filter id="rs" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#000" flood-opacity="0.5"/></filter></defs>`;
  const yTop = hostTop + Math.max(0, (hostBottom - hostTop - h) / 2);
  return `${paper}<g filter="url(#rs)"><g transform="translate(${r(px)} ${r(yTop)}) rotate(-1.4 ${pw / 2} ${r(h / 2)})"><g mask="url(#torn)"><rect width="${pw}" height="${r(h)}" fill="${PAPER}"/>${body}</g></g></g>`;
}

function receiptBackdrop(c: Ctx): string {
  return `<defs><linearGradient id="rb" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="${mix(c.pal.ink, c.pal.bg, 12)}"/><stop offset="1" stop-color="${c.pal.bg}"/></linearGradient></defs><rect width="${W}" height="${c.h}" fill="url(#rb)"/>`;
}

/* ---------- the card ---------- */

/** One card as a standalone SVG document at export size. */
export function cardSvg(d: ShareCardData, style: CardStyle, f: CardFormat, pal: CardPalette, opts: CardOptions = {}): string {
  const h = H[f];
  const photo = !!opts.photo;
  // Over a photo, and on the see-through sticker, text is white: it sits on pictures, not on the theme.
  const ink = photo || style === 'sticker' ? '#ffffff' : pal.ink;
  const c: Ctx = { d, f, h, pal, ink, photo };
  const bg = photo ? photoLayer(c, opts.photo!) : style === 'poster' ? glow(c, 0.55, 0.3) : style === 'receipt' ? receiptBackdrop(c) : '';
  const body = style === 'poster' ? poster(c) : style === 'sticker' ? sticker(c) : receipt(c);
  const px = CARD_PX[f];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px.w}" height="${px.h}" viewBox="0 0 ${W} ${h}">${bg}${body}${opts.mark ? coachMark(c, opts.mark) : ''}</svg>`;
}
