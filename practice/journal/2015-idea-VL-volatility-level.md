# Idea VL: do my A2 results change with the SIZE of the prior days' ranges? HYPOTHESIS, COUNTS WITHOUT OUTCOMES, WORKED CASES AND KILL LINES BEFORE THE TEST
Clock Fri 2015-06-19 22:00 London (end of released data). After funded day 61 and the payout. Coach 06-19: "study volatility. do your A2 results change
with the size of the prior days' ranges? write it as one test, kill line first."
June goal: every number and every test rule gets one worked case before it is pushed.

## What is already known (so that I do not re-test it under a new name)
- Idea V (03-xx, 35 days): the morning range was unrelated to the 5-day average range; a volatility-scaled stop or size did not beat fixed. 35 days.
- Idea GA (06-03): yesterday's range as a RATIO to the five days before: the morning after a relatively wide day is A2's best group (ratio >= 1.3: 24 trades at +0.600R).
- Idea XS (04-29): the most stretched SIGNALS (3-day gap / ADR) are my best trades.
- NOT tested on all history: the plain LEVEL of the prior days' ranges in pips - is A2 a different rule in a 100-pip market and in a 170-pip market?
  My stop is a fixed 40 pips, so the level matters in principle: the same stop is a third of a quiet day and a quarter of a wild one.
Disclosed: V2 below (yesterday's range in pips) is close to GA's ratio, whose result I know; I expect it to lean the same way. V1 and V3 are new.

## HYPOTHESIS: A2's average R per trade is different after high-range days than after low-range days
Features, all known at 08:00, in pips; London-day range = high minus low from 22:00 the evening before to 22:00 (the daily call's definition):
- V1: mean range of the previous 5 London days (the "ADR5" of my daily call).   V2: yesterday's range.   V3: mean range of the previous 10 London days.
Each splits the days into three groups by cut points fixed NOW from the feature values alone (`python bt/vol_level.py 2015-06-20 counts`; no outcomes printed):
| feature | days with a value | min / median / max | LOW below | HIGH from |
|---|---|---|---|---|
| V1 5-day mean | 116 of 119 | 82 / 135 / 266 pips | 125.4 | 145.2 |
| V2 yesterday | 119 of 119 | 50 / 126 / 455 pips | 106.6 | 151.4 |
| V3 10-day mean | 111 of 119 | 96 / 139 / 219 pips | 132.2 | 147.7 |
Worked cases of the features (`check DATE`, against the figures printed in my daily calls): 06-19: 5-day mean 126.6 (call: ADR5 126.6), yesterday 106.2
(call: range 106.2), 10-day 149.4 -> V1 MID, V2 LOW, V3 HIGH. 06-17: 130.3 and 125.0, as in the call. 06-16: 131.6 and 105.3, as in the call.
(Caught by this worked case BEFORE the push: my first version measured the day from 00:00 instead of from 22:00 and gave 98.1 for 06-18; corrected to the call's definition.)

## Kill lines (each feature; one failure kills the claim "results change with it")
- K1 size: HIGH group average minus LOW group average is at least 0.30R in either direction.
- K2 both periods: that difference has the same sign before 03-02 and on the lived days from 03-02, and the same sign as the whole.
- K3 order: the MID group's average lies between the LOW and the HIGH averages.
- K4 noise: the difference is at least 2 standard errors.
Worked case for the lines: LOW 39 days at +0.10R, HIGH 39 days at +0.50R, standard deviation about 1.1R a trade -> difference +0.40R (K1 pass);
2 standard errors = 2 x 1.1 x sqrt(2 / 39) = about 0.50R -> K4 FAIL. With about 39 days a group, a real difference has to be about 0.5R to pass K4.
I write that down now: this test can only see a LARGE effect. A kill means "not shown", not "no effect".
What a survivor would be: a line in "what I expect" (and a paper count), never a skip or a size change - A2 has no skips, and BD says a skipped day
costs 2.2R on average. If every group is positive, there is nothing to skip anyway; that is printed too.
Worked expectation, written now: V2 leans HIGH better by 0.2-0.4R (GA's finding in another unit) and fails K4. V1 and V3: differences under 0.3R, sign
unstable between the periods: fail K1 and K2. Full-stop share higher after high-range days (same 40 pips in a bigger market), paid for by bigger winners.
Counts when run: idea 86, variants 239-241.
