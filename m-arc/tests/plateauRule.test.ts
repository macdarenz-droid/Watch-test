/**
 * BUG-14: one plateau rule (BR-04) for the stalled note, the plateau lever, the weekly review,
 * the lighter-week trigger and the target's plateau mode (PROGRESSION-F2, VOLUME-F1/F2,
 * COACHRULES-F1/F23, D-A1 point 6).
 */
import { describe, it, expect } from 'vitest';
import { plateauStatus, trend, PLATEAU_MIN_SPAN_DAYS as TREND_SPAN } from '@/brain/trend';
import { exerciseHistory } from '@/brain/history';
import { deloadTrigger } from '@/brain/deload';
import { suggestNext } from '@/brain/progression';
import { coachInsights, deloadOffer, PLATEAU_MIN_SPAN_DAYS as LEVER_SPAN } from '@/brain/coach/rules';
import { weeklyReviewInsights } from '@/brain/coach/weeklyReview';
import { addDays } from '@/core/dates';
import { emptySchedule, type LoggedSet, type Profile, type Session } from '@/core/models';
import { baseCoachExtras, session, sets } from './helpers';

const bench = 'lib_barbell_bench_press';
const squat = 'lib_barbell_back_squat';
const today = '2026-09-26';
const now = new Date('2026-09-26T12:00:00Z').getTime();
const reds = ['red', 'green', 'red', 'amber', 'red'] as const;

/** Twice a week (Mon/Thu) for `weeks` weeks ending just before today, load from `kg(week)`. */
function twiceWeekly(weeks: number, kg: (week: number) => number, id = bench, reps = 5): Session[] {
  const start = addDays(today, -weeks * 7);
  return Array.from({ length: weeks * 2 }, (_, i) => {
    const w = Math.floor(i / 2);
    return session(addDays(start, w * 7 + (i % 2 ? 3 : 0)), [{ id, sets: sets(kg(w), reps, 'ideal', 3) }]);
  });
}
const both = (a: Session[], b: Session[]) => [...a, ...b].sort((x, y) => x.startedAt.localeCompare(y.startedAt));
const ctx = (sessions: Session[], profile: Profile = { name: 'T', trainingSince: '2020-01' }) =>
  ({ sessions, splits: [], schedule: emptySchedule(), custom: [], today, now, ...baseCoachExtras, profile });
const review = (sessions: Session[]) => weeklyReviewInsights({
  sessions, today, custom: [], schedule: emptySchedule(), goal: 'lean', profile: { name: 'T' },
  weightLog: [], trainingAgeMonths: 24, exerciseIds: [{ id: bench, name: 'Bench' }],
}, 50).filter(i => i.id.startsWith('weekly:e1rm'));

describe('A1: +2.5 kg every 3 weeks (about 0.8% a week) is progress, not a plateau', () => {
  const slow = (id: string, base: number) => twiceWeekly(9, w => base + 2.5 * Math.floor(w / 3), id);
  const s = both(slow(bench, 100), slow(squat, 140));
  it('plateauStatus says progressing', () => {
    expect(plateauStatus(exerciseHistory(s, bench), 'weighted', today).status).toBe('progressing');
  });
  it('no lighter-week offer for two such lifts', () => {
    expect(deloadTrigger(s, today, [], [], 24).suggest).toBe(false);
    expect(deloadOffer(ctx(s)).suggest).toBe(false);
  });
  it('no stalled note or plateau lever', () => {
    const out = coachInsights(ctx(s), 50);
    expect(out.some(i => i.id === `plateau:${bench}` || i.id === `plateau-lever:${bench}`)).toBe(false);
  });
  it('the weekly review says rising, not flat', () => {
    expect(review(s)[0]?.title).toMatch(/rising/);
  });
  it('the target is not plateau mode', () => {
    expect(suggestNext(s, bench, 'lean', today).mode).not.toBe('plateau');
  });
});

describe('A2: 8 sessions in 17 days at one load are not a plateau (span under 42 days)', () => {
  const days = Array.from({ length: 8 }, (_, i) => addDays(today, -18 + Math.round(i * 17 / 7)));
  const s = days.map(d => session(d, [{ id: bench, sets: sets(100, 5, 'ideal', 3) }, { id: squat, sets: sets(140, 5, 'ideal', 3) }]));
  it('plateauStatus is not plateaued', () => {
    expect(plateauStatus(exerciseHistory(s, bench), 'weighted', today).status).not.toBe('plateaued');
    expect(plateauStatus(exerciseHistory(s, bench)).status).not.toBe('plateaued');
  });
  it('no stalled note, no lighter-week offer, no plateau target', () => {
    expect(coachInsights(ctx(s), 50).some(i => i.id === `plateau:${bench}`)).toBe(false);
    expect(deloadTrigger(s, today, [], [], 24).suggest).toBe(false);
    expect(suggestNext(s, bench, 'lean', today).mode).not.toBe('plateau');
  });
});

describe('A3: flat within 1.5% over 8 weeks with a 42+ day span is a plateau', () => {
  const flat = (id: string, kg: number) => twiceWeekly(8, () => kg, id);
  const s = both(flat(bench, 100), flat(squat, 140));
  it('plateauStatus says plateaued, not at low confidence', () => {
    const p = plateauStatus(exerciseHistory(s, bench), 'weighted', today);
    expect(p.status).toBe('plateaued');
    expect(p.confidence).not.toBe('low');
  });
  it('a +1% change over the window is still flat; +2% is not', () => {
    expect(plateauStatus(exerciseHistory(twiceWeekly(8, w => 100 + w * (1 / 7)), bench), 'weighted', today).status).toBe('plateaued');
    expect(plateauStatus(exerciseHistory(twiceWeekly(8, w => 100 + w * (2.5 / 7)), bench), 'weighted', today).status).toBe('progressing');
  });
  it('the stalled note or lever, the weekly review, the target and the lighter week all agree', () => {
    const notes = coachInsights(ctx(s), 50).filter(i => i.exerciseId === bench && i.category === 'progress');
    expect(notes.some(i => i.id === `plateau:${bench}` || i.id === `plateau-lever:${bench}`)).toBe(true);
    expect(review(s)[0]?.title).toMatch(/flat/);
    expect(suggestNext(s, bench, 'lean', today).mode).toBe('plateau');
    expect(deloadTrigger(s, today, [], [], 24).suggest).toBe(true);
  });
});

describe('A4: timed holds and fixed-rep conditioning never count toward the lighter week', () => {
  const hold = (sec: number): LoggedSet[] => [{ kg: 0, reps: 0, durationSec: sec, effort: 'ideal' }];
  const flatBench = twiceWeekly(8, () => 100);
  const extra = twiceWeekly(8, () => 0).map((x, i) => session(x.day, [
    { id: 'lib_wall_sit', sets: hold(30 + i * 5) },
    { id: 'lib_box_jump', sets: [{ kg: 0, reps: 10, effort: 'ideal' }] },
    { id: 'lib_jump_squat', sets: [{ kg: 0, reps: 10, effort: 'ideal' }] },
  ]));
  const s = both(flatBench, extra);
  it('conditioning is unknown and an improving hold is progressing', () => {
    expect(plateauStatus(exerciseHistory(s, 'lib_box_jump'), 'conditioning', today).status).toBe('unknown');
    expect(plateauStatus(exerciseHistory(s, 'lib_wall_sit'), 'duration', today).status).toBe('progressing');
  });
  it('one flat bench plus holds and jumps gives no offer', () => {
    expect(deloadTrigger(s, today, [], [], 24).suggest).toBe(false);
  });
  it('no stalled note on the jumps', () => {
    const out = coachInsights(ctx(s), 50);
    expect(out.some(i => i.id === 'plateau:lib_box_jump' || i.id === 'plateau:lib_jump_squat')).toBe(false);
  });
});

describe('A5: one rule, one span constant', () => {
  it('the lever span is the trend span', () => {
    expect(TREND_SPAN).toBe(42);
    expect(LEVER_SPAN).toBe(TREND_SPAN);
  });
});

describe('A6: history minimum and beginners (D-A1 point 6, COACHRULES-F23)', () => {
  const falling = (id: string, base: number, weeks: number) => twiceWeekly(weeks, w => base - w * 2.5, id);
  it('under 4 weeks of history: no offer, even with red readiness', () => {
    const s = both(falling(bench, 100, 3), falling(squat, 140, 3));
    expect(deloadTrigger(s, today, [], [...reds], 24).suggest).toBe(false);
  });
  it('a beginner (under 3 months) with two stalled lifts gets no offer', () => {
    const s = both(falling(bench, 100, 8), falling(squat, 140, 8));
    expect(deloadTrigger(s, today, [], []).suggest).toBe(false);
    expect(deloadTrigger(s, today, [], [], 2).suggest).toBe(false);
    expect(deloadOffer(ctx(s, { name: 'T' })).suggest).toBe(false);
  });
  it('a beginner still gets the offer on 3 red readiness days of 5', () => {
    const s = both(falling(bench, 100, 5), falling(squat, 140, 5));
    const r = deloadTrigger(s, today, [], [...reds]);
    expect(r.suggest).toBe(true);
    expect(r.reason).toMatch(/red on three or more/);
  });
  it('an experienced lifter with two stalled lifts gets it', () => {
    const s = both(falling(bench, 100, 8), falling(squat, 140, 8));
    expect(deloadTrigger(s, today, [], [], 24).suggest).toBe(true);
    expect(deloadOffer(ctx(s)).suggest).toBe(true);
  });
});

describe('PR #47 review: e1RM only, never mixed with top load or volume (A3, BR-04)', () => {
  /** Twice a week for 8 weeks; `pick(i)` gives session i's sets. */
  const weekly = (id: string, pick: (i: number) => LoggedSet[]) => twiceWeekly(8, () => 0, id).map((x, i) => session(x.day, [{ id, sets: pick(i) }]));
  const heavyLight = (id: string, kg: number, heavyFirst: boolean) =>
    weekly(id, i => ((i % 2 === 0) === heavyFirst ? sets(kg, 5, 'ideal', 3) : sets(kg * 0.7, 12, 'ideal', 3)));
  for (const heavyFirst of [true, false]) {
    it(`a flat heavy 5-rep day plus a 12-rep light day (heavy ${heavyFirst ? 'first' : 'second'}) reads plateaued`, () => {
      const s = both(heavyLight(bench, 100, heavyFirst), heavyLight(squat, 140, heavyFirst));
      expect(plateauStatus(exerciseHistory(s, bench), 'weighted', today).status).toBe('plateaued');
      // The target follows the last session's reps first (a 12-rep top-of-range light day asks
      // to confirm), so here only the plateau input is checked: never the "slipped" variant.
      const next = suggestNext(s, bench, 'lean', today);
      expect(next.reason).not.toMatch(/slipped/);
      if (!heavyFirst) expect(next.mode).toBe('plateau');
      const notes = coachInsights(ctx(s), 50).filter(i => i.exerciseId === bench && i.category === 'progress');
      expect(notes.some(i => i.id === `plateau:${bench}` || i.id === `plateau-lever:${bench}`)).toBe(true);
      expect(notes.some(i => /declin|slipp/i.test(`${i.id} ${i.title}`))).toBe(false);
    });
  }
  it('a flat e1RM with sets rising from 3 to 5 is still plateaued', () => {
    const s = weekly(bench, i => sets(100, 5, 'ideal', 3 + Math.floor(i / 6)));
    expect(plateauStatus(exerciseHistory(s, bench), 'weighted', today).status).toBe('plateaued');
    expect(suggestNext(s, bench, 'lean', today).mode).toBe('plateau');
    expect(review(s)[0]?.title).toMatch(/flat/);
  });
  it('with no e1RM (12 reps), top load with the volume tie-break still reads rising volume as progress', () => {
    const s = weekly(bench, i => sets(40, 12, 'ideal', 3 + Math.floor(i / 6)));
    expect(plateauStatus(exerciseHistory(s, bench), 'weighted', today).status).toBe('progressing');
  });
});

describe('PR #47 review: a flat timed hold never counts toward the lighter week (A4)', () => {
  it('a flat 60 s wall sit plus one flat bench, experienced lifter: no offer', () => {
    const hold: LoggedSet[] = [{ kg: 0, reps: 0, durationSec: 60, effort: 'ideal' }];
    const holds = twiceWeekly(8, () => 0).map(x => session(x.day, [{ id: 'lib_wall_sit', sets: hold }]));
    const s = both(twiceWeekly(8, () => 100), holds);
    expect(plateauStatus(exerciseHistory(s, 'lib_wall_sit'), 'duration', today).status).toBe('plateaued');
    expect(deloadTrigger(s, today, [], [], 24).suggest).toBe(false);
  });
});

describe('PR #47 second review: BR-04 counts only the judged series (A3)', () => {
  // 12 sessions at 12 reps (no e1RM) over 6 weeks, then 4 flat 100x5 sessions in the last 10 days.
  const mixed = (id: string, kg: number) => [
    ...Array.from({ length: 12 }, (_, i) => session(addDays(today, -56 + Math.round(i * 42 / 11)), [{ id, sets: sets(kg * 0.6, 12, 'ideal', 3) }])),
    ...[-10, -7, -4, -1].map(d => session(addDays(today, d), [{ id, sets: sets(kg, 5, 'ideal', 3) }])),
  ];
  const s = both(mixed(bench, 100), mixed(squat, 140));
  it('4 flat e1RM sessions in 10 days are not a plateau: unknown, no offer, target hold', () => {
    expect(exerciseHistory(s, bench).filter(h => h.bestE1rm > 0)).toHaveLength(4);
    expect(plateauStatus(exerciseHistory(s, bench), 'weighted', today).status).toBe('unknown');
    expect(deloadTrigger(s, today, [], [], 24).suggest).toBe(false);
    expect(deloadOffer(ctx(s)).suggest).toBe(false);
    expect(suggestNext(s, bench, 'lean', today).mode).toBe('hold');
  });
});

describe('PR #47 second review: the weekly note rate comes from the judged window', () => {
  it('20 weeks rising 1 kg a week, then about -3% over 8 weeks: falling at about 0.4% a week', () => {
    const s = twiceWeekly(28, w => (w < 20 ? 100 + w : 119 - (w - 19) * (3.6 / 8)));
    const note = review(s)[0];
    expect(note?.title).toMatch(/falling/);
    const pct = Number(/about ([\d.]+)% a week/.exec(note?.noticed ?? '')?.[1]);
    // The last 8 weeks fall about 0.38% a week; the all-history slope is about +0.54% a week.
    expect(pct).toBe(0.4);
  });
});

describe('PR #47 third review: the weekly note rate comes from the rows plateauStatus judged, on either path', () => {
  it('bench every 12 days, 10 sessions (short path): no rising note with a falling rate', () => {
    const kgs = [60, 70, 80, 90, 100, 110, 109.5, 109, 108.5, 108];
    const s = kgs.map((kg, i) => session(addDays(today, -2 - (kgs.length - 1 - i) * 12), [{ id: bench, sets: sets(kg, 5, 'ideal', 3) }]));
    const hist = exerciseHistory(s, bench, []);
    expect(plateauStatus(hist, 'weighted', today).status).toBe('progressing');
    const note = review(s)[0];
    expect(note?.title).toMatch(/rising/);
    // The 56-day window alone falls about 0.27% a week; the short path judged the last 8 sessions.
    expect(note?.noticed).not.toMatch(/0\.3% a week/);
    const m = /about ([\d.]+)% a week/.exec(note?.noticed ?? '');
    if (m) {
      const last8 = hist.slice(-8).map(h => h.bestE1rm);
      const t = trend(last8.map((v, i) => ({ day: hist.slice(-8)[i]!.day, value: v })));
      expect(t.slopePerWeek).toBeGreaterThan(0);
      expect(Number(m[1])).toBe(Math.round(t.slopePerWeek * 1000) / 10);
    }
  });
});
