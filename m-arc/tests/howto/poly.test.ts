// LIB-25: the additive `poly` equipment primitive (library plan 2.5). The L1 rebuild of both goldens is the gate's
// HT-2 block; these tests pin the primitive itself and its Mistake-view outline (PQ-H9, plate.mjs:213-215).
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const GOLDEN_URL = new URL('../../tools/plates/golden.mjs', import.meta.url).href;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let eq: any, plate: any, spec: any, mirror: string;
const cam = { view: 'side', facing: 'right', pxm: 100, P: (w: number[]) => [100 + w[2]! * 100, 300 - w[1]! * 100] };
const TRI = [[0, 1, 0], [0, 1, 1], [0, 2, 0.5]];

beforeAll(async () => {
  const g = await import(/* @vite-ignore */ GOLDEN_URL);
  mirror = g.makeMirror();
  eq = await import(/* @vite-ignore */ `${mirror}/engine/equipment.mjs`);
  plate = await import(/* @vite-ignore */ `${mirror}/engine/plate.mjs`);
  spec = (await import(/* @vite-ignore */ `${mirror}/exercises/_test_side.mjs`)).default;
});
afterAll(() => rmSync(mirror, { recursive: true, force: true }));

describe('LIB-25 poly primitive', () => {
  it('is a PRIMITIVES key, added after every golden-A primitive', () => {
    expect(Object.keys(eq.PRIMITIVES)).toEqual(['floor', 'dumbbell', 'pullupBar', 'stack', 'cableColumn', 'latBar', 'vHandle', 'rowFootplate', 'bench', 'seat', 'backPad', 'kneePad', 'legPress45', 'chestPress', 'barbell', 'rackUpright', 'cable', 'pulley', 'box', 'line', 'poly']);
    expect(eq.PRIMITIVES.poly).toBe(eq.poly);
  });

  it('draws a closed straight-edged path with the engine class, carrying its projected polygon', () => {
    expect(eq.poly({ pts: TRI }, cam)).toEqual([{ cls: 'eq', z: 'back', d: 'M100 200L200 200L150 100Z', poly: [[100, 200], [200, 200], [150, 100]] }]);
  });

  it('takes cls and z like the other primitives, and curve: true closes a smooth path through the same points', () => {
    const [it0] = eq.poly({ pts: TRI, curve: true, cls: 'eq-solid', z: 'front' }, cam);
    expect(it0).toMatchObject({ cls: 'eq-solid', z: 'front', poly: [[100, 200], [200, 200], [150, 100]] });
    expect(it0.d).toMatch(/^M100 200(C[-\d. ]+){3}Z$/);
  });

  it('throws on fewer than 3 points or no points', () => {
    expect(() => eq.poly({ pts: TRI.slice(0, 2) }, cam)).toThrow('poly: needs at least 3 points, got 2');
    expect(() => eq.poly({ pts: [] }, cam)).toThrow('got 0');
    expect(() => eq.poly({}, cam)).toThrow('got undefined');
  });

  it('throws on a point that is not 3 finite numbers, naming the point', () => {
    expect(() => eq.poly({ pts: [[0, 1, 0], [0, NaN, 1], [0, 2, 0.5]] }, cam)).toThrow('poly: point 1 is not 3 finite numbers: [0,null,1]');
    expect(() => eq.poly({ pts: [[0, 1, 0], [0, 1, 1], [0, 2, Infinity]] }, cam)).toThrow('poly: point 2 is not 3 finite numbers');
    expect(() => eq.poly({ pts: [[0, 1, 0], [0, 1], [0, 2, 0.5]] }, cam)).toThrow('poly: point 1 is not 3 finite numbers: [0,1]');
  });

  it('throws on points that enclose no area (identical or on one line), but draws an outline seen edge-on', () => {
    expect(() => eq.poly({ pts: [[0, 1, 0], [0, 1, 0], [0, 1, 0]] }, cam)).toThrow('poly: the points enclose no area (they coincide or lie on one line)');
    expect(() => eq.poly({ pts: [[0, 1, 0], [0, 1.5, 0.5], [0, 2, 1]] }, cam)).toThrow('enclose no area');
    const edgeOn = eq.poly({ pts: [[0, 1, 0], [0.3, 1, 0], [0.3, 1.2, 0]] }, cam)[0];   // in the x-y plane: a line in side view
    expect(edgeOn.poly).toHaveLength(3);
  });

  it('a moving poly part is outlined in the Mistake view; an open line in its place is not', () => {
    const around = (type: string) => ({ ...spec, equipment: [...spec.equipment, (lm: Record<string, number[]>) => {
      const [x, y, z] = lm.shoulders as [number, number, number];
      return { type, pts: [[x, y + 0.05, z - 0.05], [x, y + 0.05, z + 0.05], [x, y + 0.15, z]], z: 'front', part: 'marker' };
    }] });
    const polyM = plate.renderPlate(around('poly'), { id: 'q', mistake: true }).svg as string;
    const mDefs = [...polyM.matchAll(/<path id="q-m-eq\d+" d="([^"]+)"\/>/g)].map(m => m[1]);
    expect(mDefs).toHaveLength(1);
    expect(mDefs[0]).toMatch(/^M[-\d. ]+L[-\d. ]+L[-\d. ]+Z$/);
    expect(polyM).toMatch(/<g class="m-pose" mask="url\(#q-mmask\)"><g class="u-stroke">.*<use href="#q-m-eq0"\/>/);
    const lineM = plate.renderPlate(around('line'), { id: 'q', mistake: true }).svg as string;
    expect(lineM).not.toMatch(/id="q-m-eq\d+"/);
  });
});

describe('LIB-25 rope composer drawn with poly', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rope: any;
  beforeAll(async () => { rope = await import(/* @vite-ignore */ new URL('../../tools/plates/library/eq/rope.mjs', import.meta.url).href); });
  const grips = { l: [0.07, 1.0, 0.3], r: [-0.07, 1.0, 0.3] }, pulley = [0, 2.03, 0.5];

  it('returns the cable, two curved strands and the ferrule, all drawn by the vendored engine', () => {
    const items = rope.rope({ pulley, grips });
    expect(items.map((i: { type: string; curve?: boolean }) => `${i.type}${i.curve ? ':curve' : ''}`)).toEqual(['cable', 'poly:curve', 'poly:curve', 'poly']);
    expect(items.length).toBeLessThanOrEqual(rope.ROPE_ITEMS);
    for (const it of items) expect(eq.PRIMITIVES[it.type](it, cam).every((d: { d: string }) => d.d.startsWith('M'))).toBe(true);
    for (const it of items.slice(1)) expect(eq.PRIMITIVES.poly(it, cam)[0].poly.length).toBe(it.pts.length);
  });

  it('each strand is thicker at its clubbed stopper than along the rope, and sags below the straight line', () => {
    const [, s] = rope.rope({ pulley, grips });
    const n = s.pts.length, half = (n - 3) / 2;        // left side, 3 cap points, right side reversed
    const width = (k: number) => Math.hypot(...[0, 1, 2].map(i => s.pts[k][i] - s.pts[n - 1 - k][i]));
    expect(width(half - 1)).toBeGreaterThan(width(1) * 1.4);
    // sag: the strand centre line leaves the straight ferrule-to-hand line by about 6 mm, downward; none with sag: 0
    const off = (pts: number[][]) => {
      const g = rope.ropeGeometry({ pulley, grips }), F = g.ferrule, u = g.strands[0].dir;
      const m = [0, 1, 2].map(i => (pts[2]![i]! + pts[pts.length - 3]![i]!) / 2), k = [0, 1, 2].reduce((a, i) => a + (m[i]! - F[i]) * u[i], 0);
      const p = [0, 1, 2].map(i => F[i] + u[i] * k);
      return { d: Math.hypot(...[0, 1, 2].map(i => m[i]! - p[i]!)), down: m[1]! < p[1]! };
    };
    const sagged = off(s.pts);
    expect(sagged.d).toBeGreaterThan(0.004);
    expect(sagged.d).toBeLessThan(0.008);
    expect(sagged.down).toBe(true);
    expect(off(rope.rope({ pulley, grips, sag: 0 })[1].pts).d).toBeLessThan(1e-9);
  });

  it('adds the thin poly cable twin only in the Mistake pose', () => {
    expect(rope.rope({ pulley, grips, mistakeTwin: true, ctx: { pose: 'end' } })).toHaveLength(4);
    const m = rope.rope({ pulley, grips, mistakeTwin: true, ctx: { pose: 'mistake' } });
    expect(m).toHaveLength(5);
    expect(m[4]).toMatchObject({ type: 'poly', cls: 'eq', z: 'center' });
  });
});
