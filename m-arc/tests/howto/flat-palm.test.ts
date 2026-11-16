// LIB-26: the flat-palm hand option (spec `hand: 'flat'`, body.mjs flatPalm). The L1 rebuild of both goldens is the
// gate's HT-2 block; these tests pin the palm's join to the forearm, its flat underside and its Mistake outline.
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const GOLDEN_URL = new URL('../../tools/plates/golden.mjs', import.meta.url).href;
type Pt = [number, number];
type Shape = { key: string; group: string; d: string; poly: Pt[] };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let body: any, plate: any, spec: any, mirror: string;
const PXM = 100;
const cam = { view: 'side', near: 'r', pxm: PXM, P: (w: number[]) => [w[2]! * PXM, -w[1]! * PXM] as Pt };

beforeAll(async () => {
  const g = await import(/* @vite-ignore */ GOLDEN_URL);
  mirror = g.makeMirror();
  body = await import(/* @vite-ignore */ `${mirror}/engine/body.mjs`);
  plate = await import(/* @vite-ignore */ `${mirror}/engine/plate.mjs`);
  spec = (await import(/* @vite-ignore */ `${mirror}/exercises/_test_flat.mjs`)).default;
});
afterAll(() => rmSync(mirror, { recursive: true, force: true }));

const shapesOf = (pose: object, opts: object = {}) => {
  const b = { height: 1.75 }, sk = body.fk(body.resolve(body.normPose(pose, b), b).q, b);
  return { sk, shapes: body.bodyShapes(sk, cam, opts) as Shape[] };
};
const inside = (p: Pt, poly: Pt[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!, [xj, yj] = poly[j]!;
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
/** The join check: the palm outline covers the wrist and the forearm's distal end, so the arm's union has no gap. */
function joinProblems(shapes: Shape[], sk: { W: Record<string, number[]> }) {
  const bad: string[] = [];
  for (const palm of shapes.filter(s => s.key.startsWith('palm.'))) {
    const sd = palm.key.split('.')[1]!, W = cam.P(sk.W[sd]!), fore = shapes.find(s => s.key === `fore.${sd}`)!;
    const r0 = body.RADII.fore[2] * 1.75 * PXM;
    if (!inside(W, palm.poly)) bad.push(`${palm.key}: the wrist is outside the palm`);
    if (!inside(W, fore.poly)) bad.push(`${palm.key}: the wrist is outside the forearm`);
    const across = palm.poly.filter(p => Math.abs(Math.hypot(p[0] - W[0], p[1] - W[1]) - r0) < 1e-6);
    if (across.length < 2) bad.push(`${palm.key}: the palm does not start on the forearm's distal circle`);
  }
  return bad;
}

describe('LIB-26 flat palm', () => {
  it('the default hand is still the fist; hand: \'flat\' swaps both, { r: \'flat\' } only the right', () => {
    const pose = spec.poses.start;
    const keys = (o: object) => shapesOf(pose, o).shapes.map(s => s.key).filter(k => /^(fist|palm)\./.test(k));
    expect(keys({})).toEqual(['fist.l', 'fist.r']);
    expect(keys({ hand: 'flat' })).toEqual(['palm.l', 'palm.r']);
    expect(keys({ hand: { r: 'flat' } })).toEqual(['fist.l', 'palm.r']);
    const fist = shapesOf(pose).shapes.find(s => s.key === 'fist.r')!, again = shapesOf(pose, { hand: { l: 'flat' } }).shapes.find(s => s.key === 'fist.r')!;
    expect(again).toEqual(fist);
  });

  it('the palm joins the forearm with no gap (join check), in the arm group', () => {
    const { sk, shapes } = shapesOf(spec.poses.start, { hand: 'flat' });
    expect(joinProblems(shapes, sk)).toEqual([]);
    expect(shapes.find(s => s.key === 'palm.r')!.group).toBe(shapes.find(s => s.key === 'fore.r')!.group);
  });

  it('mutation: a palm offset 2 cm from the wrist fails the join check', () => {
    const { sk, shapes } = shapesOf(spec.poses.start, { hand: 'flat' });
    const off = 0.02 * PXM;
    const moved = shapes.map(s => (s.key === 'palm.r' ? { ...s, poly: s.poly.map(([x, y]) => [x + off, y] as Pt) } : s));
    expect(joinProblems(moved, sk)).toEqual(['palm.r: the wrist is outside the palm', 'palm.r: the palm does not start on the forearm\'s distal circle']);
  });

  it('_test_flat: the palm underside lies flat on the floor from the wrist to the knuckles', () => {
    for (const pose of [spec.poses.start, spec.poses.end]) {
      const palm = shapesOf(pose, { hand: 'flat' }).shapes.find(s => s.key === 'palm.r')!;
      expect(Math.max(...palm.poly.map(p => p[1]))).toBeCloseTo(0, 6);                   // nothing below the floor
      expect(palm.poly.filter(p => Math.abs(p[1]) < 1e-6).length).toBeGreaterThanOrEqual(3);   // the flat run on it
    }
  });

  it('_test_flat renders with a clean engine report, and the moving palm is outlined in the Mistake view', () => {
    for (const mistake of [false, true]) expect(plate.renderPlate(spec, { id: 'f', mistake }).report.issues).toEqual([]);
    const m = plate.renderPlate(spec, { id: 'f', mistake: true }).svg as string;
    expect(m).toMatch(/<path id="f-m-palm\.r" d="M[^"]+Z"\/>/);
    expect(m).toMatch(/<g class="m-pose" mask="url\(#f-mmask\)"><g class="u-stroke">.*<use href="#f-m-palm\.r"\/>/);
  });

  it('the palm belongs to its arm\'s part: a Mistake filtered to arm.r outlines the right palm, arm.l does not', () => {
    // plate.mjs partOf maps palm.<side> to arm.<side>; spec part filters (mistake.parts, ghost parts) select by it
    const only = (parts: string[]) => plate.renderPlate({ ...spec, mistake: { ...spec.mistake, parts } }, { id: 'f', mistake: true }).svg as string;
    expect(only(['arm.r'])).toMatch(/<path id="f-m-palm\.r" d="M[^"]+Z"\/>/);
    expect(only(['arm.r'])).toMatch(/<path id="f-m-fore\.r" d="M[^"]+Z"\/>/);
    expect(only(['arm.l'])).not.toMatch(/id="f-m-palm\.r"/);
  });

  it('a hand pointing at the camera draws the forearm\'s end-on circle', () => {
    const px = (r: number) => r * 1.75 * PXM;
    const c = body.flatPalm([10, 10], [10.5, 10], px);
    expect(c.d).toMatch(/a[\d.]+ [\d.]+ 0 1 0/);
    expect(c.poly).toHaveLength(16);
  });
});
