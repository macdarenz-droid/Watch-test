# One lesson from the 20-trade review -> one test: the first day after the signal flips. HYPOTHESIS AND KILL TEST WRITTEN FIRST (nothing has been run)
Clock Thu 2015-04-09 01:00 London (end of released data). Build = ALL lived history 01-06 .. 04-08 (explicit end date = the clock), shown by period; costs on; London time.

## The lesson
In my last 20 trades, three of the four full stops came on the first day after the 3-day trend signal changed side (03-19, 03-27, 04-08). On those mornings the rule has just
switched from selling to buying or back - usually because one big day (a spike, a squeeze) dragged the close across the level it is compared with - and the market has not
yet shown that it means it.

## What I already know (method rule: count the feature on ALL history before testing anything from a review)
From my own live results, counted by hand before writing this: there have been 12 flip days so far. The six in January-February made +2.29R (five winners);
the six in March-April made -2.62R (three full stops). Together about -0.03R per flip day, against about +0.45R per trade overall.
So the feature does NOT agree with itself across the two halves of my history. By my own method rule that is a warning that the review showed me a recent streak, not a trait.
I test it anyway, once, properly, because it is the cleanest observation in the review (defined by the rule's own signal, no threshold) - and I say now that I expect it to fail
the consistency line.

## Hypothesis
A fresh flip of the 3-day signal is unreliable on its first day; the A2 trade on that day has clearly lower expectancy than on other days, in every part of my history.
Skipping it (or waiting for the signal to hold a second day) raises avg R without lowering net R.

## Variants (87, 88, 89; ideas -> 34), no others afterwards. Everything else exactly A2.
- FL1: no trade on the first day after the signal changes side.
- FL2: no trade on the first TWO days after it changes side.
- FL3: on the first day after a change, trade the OLD side (the signal must hold for two days before I follow it).

## KILL TEST (explicit). The build can only kill; a survivor gets a forward paper tag (a filter: no adoption question before 200 forward trades).
A variant survives only if ALL:
  K1. on all history its avg R per A2 signal day (a skipped day counts 0R) is at least A2's + 0.05R;
  K2. the days it changes (skips, or trades the other way) are WORSE under A2 than the days it leaves alone, by at least 0.3R on average;
  K3. consistency: that is true in at least 2 of the 3 periods (January, February, March-to-now), and in no period are the changed days better than the others by more than 0.3R;
  K4. it changes at least 10 days and leaves at least 60% of the days alone.
My guess: K3 fails for FL1 and FL2 (January-February flip days were winners); FL3 fails K1 (trading the old side after a real turn is how 01-27 and 03-17 would go wrong).

## RESULTS (run once after the lines above were pushed: `python bt/ab_period.py FL1,FL2,FL3 2015-04-09`; all history 01-06..04-08, costs on)
A day a variant skips counts 0R for it. "Gap" = A2's avg R on the days left alone minus A2's avg R on the days the variant changes (positive = the changed days are the bad ones).

| | days changed | avg R / signal day | net R | max DD | gap all | gap Jan | gap Feb | gap Mar-now |
|---|---|---|---|---|---|---|---|---|
| A2 (67 days) | - | +0.447 | +29.93 | 2.03 | - | - | - | - |
| FL1 skip 1st flip day | 14 (79% left) | +0.370 | +24.77 | 2.17 | +0.10 | -1.35 | -0.23 | +1.03 |
| FL2 skip first two | 23 (66% left) | +0.312 | +20.87 | 2.36 | +0.08 | -0.73 | -0.16 | +0.62 |
| FL3 trade the old side | 14 (79% left) | +0.320 | +21.46 | 4.62 | +0.10 | -1.35 | -0.23 | +1.03 |

A2 on the 14 flip days: 01-22 +1.19, 01-23 +4.30, 01-28 +0.28, 02-02 -0.34, 02-03 +0.15, 02-09 +0.78, 02-12 +0.34, 02-23 +1.09, 03-17 +0.04, 03-18 +0.30, 03-19 -1.03, 03-27 -1.00, 04-03 +0.07, 04-08 -1.00
= +5.17R in 14 days, +0.37R each (the other 53 days: +0.47R each).

## Kill lines applied
- K1 (avg >= A2 + 0.05R): FL1 -0.08, FL2 -0.14, FL3 -0.13 -> all FAIL.
- K2 (changed days worse by >= 0.3R): +0.10, +0.08, +0.10 -> all FAIL.
- K3 (true in >= 2 of 3 periods; never better by > 0.3R): true only in March-to-now; in January the flip days were BETTER by 1.35R (0.73R for FL2) -> all FAIL.
- K4 (>= 10 days changed, >= 60% left alone): all pass (irrelevant).
VERDICT: NO SURVIVOR. Idea closed, no forward tag. A2 unchanged. Both guesses were right (K3 for FL1/FL2, K1 for FL3 - and FL3 more than doubles the drawdown).

## What I learned
- The flip day is not a weak day for the rule. Over all my history it earns about what any other day earns (+0.37R vs +0.47R; with 14 days the difference is far inside noise),
  and the single best day I have ever had (01-23, +4.30R) was a flip day. The three stops in my last 20 trades were a streak that my eye turned into a pattern.
- This is the same lesson as GAP and RN: a feature that explains the latest losers usually also describes earlier winners. Counting on all history first is what catches it.
- Correction of my own hand count: I wrote "12 flip days; six in January-February made +2.29R". The engine finds 14, eight of them in January-February making +7.79R.
  The March-April six match exactly (-2.62R). I have not traced which two days my hand count missed; the engine's list above is the one to trust, and it makes the case against
  the idea stronger, not weaker.
- Honest limits: 14 days is a tiny sample; the test can say "no evidence the flip day is bad", not "the flip day is good".
Counts: ideas 34, variants 89.
