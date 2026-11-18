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

## RESULTS (lines and cut points pushed first in commit 292e0e8; one run: `python bt/vol_level.py 2015-06-20 test 125.4 145.2 106.6 151.4 132.2 147.7`; costs on)
A2 to 06-19: 119 days, +35.54R, +0.299R a day, 28 full stops (24%). Figures copied from the print.
| feature | group | days | avg R | net | win | full stops | avg win / avg loss | best days (>= +1.6R) |
|---|---|---|---|---|---|---|---|---|
| V1 5-day mean | LOW (< 125.4) | 39 | +0.336 | +13.09 | 62% | 18% | +0.95 / -0.65 | 5 |
| | MID | 38 | +0.114 | +4.31 | 47% | 34% | +1.10 / -0.77 | 5 |
| | HIGH (>= 145.2) | 39 | +0.362 | +14.12 | 64% | 21% | +0.96 / -0.70 | 4 |
| V2 yesterday | LOW (< 106.6) | 40 | +0.149 | +5.97 | 52% | 25% | +0.92 / -0.71 | 2 |
| | MID | 39 | +0.399 | +15.56 | 64% | 18% | +0.98 / -0.64 | 7 |
| | HIGH (>= 151.4) | 40 | +0.350 | +14.02 | 60% | 28% | +1.11 / -0.79 | 6 |
| V3 10-day mean | LOW (< 132.2) | 37 | +0.246 | +9.10 | 57% | 24% | +1.00 / -0.75 | 6 |
| | MID | 37 | +0.277 | +10.25 | 51% | 32% | +1.26 / -0.76 | 6 |
| | HIGH (>= 147.7) | 37 | +0.180 | +6.65 | 62% | 19% | +0.67 / -0.63 | 1 |
| feature | HIGH minus LOW | 2 standard errors | before 03-02 | lived | K1 size | K2 both periods | K3 order | K4 noise |
|---|---|---|---|---|---|---|---|---|
| V1 | +0.027R | 0.488 | +0.229 | +0.013 | FAIL | PASS | FAIL | FAIL |
| V2 | +0.201R | 0.497 | +0.126 | +0.352 | FAIL | PASS | FAIL | FAIL |
| V3 | -0.066R | 0.444 | -0.052 | -0.110 | FAIL | PASS | FAIL | FAIL |
Every one of the nine groups is positive.
VERDICT: KILLED, all three, on size, order and noise. The claim "A2's results change with the size of the prior days' ranges" is NOT SHOWN.

## Expectation against the run
V2 "leans HIGH better by 0.2-0.4R and fails K4": +0.201R, fails K4 (and K1 by a hair). V1 and V3 "under 0.3R": +0.03R and -0.07R. "Sign unstable
between the periods": WRONG - the sign held in both periods for all three; the differences are simply small. "More full stops after high-range days,
paid for by bigger winners": NOT in the data (V1 18% low / 21% high; V3 24% / 19%); only V2 leans that way (25% / 28%, average win +0.92 / +1.11).

## The answer to the coach's question
- No - not that I can show. Over 5 or 10 days the level of the market's range makes no visible difference to A2: +0.34R in the quietest third against
  +0.36R in the wildest (V1). The rule earned in a 100-pip market and in a 170-pip market, and the fixed 40 pip stop was not hit more often in the wild one.
- After a small yesterday the rule earns less (+0.15R against +0.35-0.40R; 2 best days against 6-7). That is idea GA and the BS look again, in pips
  instead of a ratio: best days follow days that moved. It is 0.2R on 40 days with an error band of 0.5R, so it is a leaning, and the LOW group is
  still positive: nothing to skip.
- The middle groups are the odd ones (V1's MID is the worst, V2's MID the best). A real effect of volatility would be ordered; this is what noise looks like.
- What the test could not see, as written before the run: an effect smaller than about 0.5R between thirds. 119 days are 119 days.
- For the plan: nothing changes. The fixed stop and the fixed size stay (idea V said so on 35 days; this says so on 119). The practical meaning:
  a quiet week is not a reason to expect less and a wild week is not a reason to cut size - which I have wanted to do on both kinds of mornings.
Counts: ideas 86, variants 241 (V1, V2, V3). Adopted trading ideas: 0. Numbers or rules corrected after a push in June: 3 (none today; one definition
slip caught by its worked case before the push - the June goal doing its job).
