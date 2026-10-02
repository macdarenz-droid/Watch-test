import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// BUG-34: the launch overlay's line and dot run on CSS animations, which start on first paint.
// SMIL only starts at the load event (after the bundle), so it froze a broken first frame.
const html = readFileSync('index.html', 'utf8');
const launch = /<div id="launch"[\s\S]*?<\/div>/.exec(html)?.[0] ?? '';

describe('launch overlay (BUG-34)', () => {
  it('has no SMIL animation left in #launch, and no script starts one', () => {
    expect(launch).toContain('id="launch-path"');
    expect(launch).not.toMatch(/<animate|<set\b|begin="indefinite"/);
    expect(html).not.toContain('beginElement');
  });

  it('keeps the O1 timings and curves: 1.22 s line in two splines, 0.72 s dot to 54.07%', () => {
    expect(html).toContain('#launch-path { animation: launch-draw 1220ms both; }');
    expect(html).toContain('@keyframes launch-draw { 0% { stroke-dashoffset: 100; animation-timing-function: cubic-bezier(.45,0,.25,1); } 59.0164% { stroke-dashoffset: 45.93; animation-timing-function: cubic-bezier(.35,0,.2,1); } 100% { stroke-dashoffset: 0; } }');
    expect(html).toContain("offset-path: path('M8 40H16L22 22L30 50L36 30L40 40H56'); offset-rotate: 0deg; animation: launch-glide 720ms cubic-bezier(.45,0,.25,1) both;");
    expect(html).toContain('@keyframes launch-glide { from { offset-distance: 0%; } to { offset-distance: 54.07%; } }');
    // The dot's motion path is the drawn path itself.
    expect(launch).toContain('d="M8 40H16L22 22L30 50L36 30L40 40H56"');
    // 0.72 s of the 1.22 s line is 59.0164 %.
    expect(+(0.72 / 1.22 * 100).toFixed(4)).toBe(59.0164);
  });

  it('stops both animations and drops the motion path under reduce, so cx=30 cy=50 is where the dot sits', () => {
    expect(html).toContain('#launch.reduce #launch-path { animation: none;');
    expect(html).toContain('#launch.reduce #launch-dot { animation: none; offset-path: none; }');
  });

  it('keeps a zero-length dash off the line end while dashoffset is 100 (gap 101, not 100)', () => {
    expect(launch).toContain('stroke-dasharray="100 101" stroke-dashoffset="100"');
  });
});
