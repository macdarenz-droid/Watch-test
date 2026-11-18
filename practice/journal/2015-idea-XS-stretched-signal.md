# WHY did full-stop mornings go from 8% to 26%? One hypothesis: I am entering on STRETCHED signals. HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY RESULT IS LOOKED AT
Clock Wed 2015-04-29 01:00 London (end of released data; no new day - this test has to earn it). All lived history 01-06 .. 04-28 (explicit end 2015-04-29); costs on.
Coach, 04-29: "your loss side changed (full-stop mornings 8% to 26%). Write a hypothesis for why, a kill test, max 3 variants, costs on, then run it on your history."

## Step 0: a cause has to have changed itself. What changed between the backtest months and the live months - FEATURES ONLY, no trade results (counted today)
| measured at 07:00-08:00 London | backtest Jan-Feb | live Mar-Apr | changed? |
|---|---|---|---|
| Two-week trendiness (10-day efficiency ratio under 0.25 = "choppy") | 15 of 30 days | 15 of 43 days | NO - choppy days are, if anything, rarer live |
| 5-day average daily range (median) | 119 pips | 135 pips | a little |
| Yesterday's New York session range (median) | 85 pips | 100 pips | a little |
| Asia range 00:00-07:00 (median) | 30 pips | 39 pips | yes |
| Range of the hour before entry, 07:00-08:00 (median; share of days with 30+ pips) | 23 pips; 17% | 31 pips; 57% | YES |
| Size of my 3-day signal (median gap) | 63 pips | 147 pips | YES |
| Gap at least one full average day's range (gap >= 1.0 x ADR5) | 11 of 39 days (28%) | 24 of 43 days (56%) | YES, doubled |
My first idea was "the market got choppier at the two-week scale, so a 3-day signal reverses hard". The first row kills it before any test: the supposed cause did not
increase. I do not run it and do not count it as a variant.
Two things did change strongly: the signal is far more STRETCHED when I act on it, and the hour before my entry is livelier. I take ONE: the stretched signal, because it
has a mechanism (a move that has already travelled a full day's range in three days is late, and late entries get reversed) and because it is the rule's own input.
The lively pre-entry hour stays on the parked list, untouched.

## What I already know (contamination, plainly)
- Small-signal test (04-24): gap under 50 pips = +0.62R, the rest +0.36R, same sign in all three periods; the relative split at half a day showed no difference.
  So I know that large-gap days earn less ON AVERAGE. I wrote then that I would not test "skip large gaps" as a mirror of a failed test chosen after seeing it.
  I am now doing something close to that, because the coach asked for the cause of the loss-side change and this is the one candidate cause that actually moved.
  The honest consequence: the average-R lines below are partly known in advance and prove little. The lines that are NOT known to me are the ones about full-stop mornings.
- I know the 3-day gaps on my 12 engine stop days (210, 371, 15, 142, 332, 334, 70, 159, 65, 81, 151, 80 pips) but not their ratios to the daily range. Six or seven of
  the twelve look "stretched" - with 43% of all days stretched that is a weak enrichment. So I expect the explanation to FAIL its first line. Written before the run.

## Hypothesis
Mornings that go 40+ pips against my entry come mostly from stretched signals (3-day gap at least one average day's range). They were rare in January-February because
stretched signals were rare; they are common live because stretched signals are common. The loss side changed because the MIX of signals changed, not because the rule broke.

## Part 1 - does it EXPLAIN the change? (the explanation survives only if E1, E2 and E3 all hold)
"Full-stop morning" = between 08:00 and 12:00 London price travels 40 pips or more against the A2 entry (the measure of the streak check: 3 of 39, then 11 of 42).
  E1. Over all history, stretched signals (gap >= 1.0 x ADR5; 35 days) have a full-stop-morning rate at least TWICE that of the others (47 days).
  E2. The same direction inside the backtest months AND inside the live months, each with a ratio of at least 1.5 (a cause must work within each period, not only across them).
  E3. Accounting: applying the backtest months' two rates to the live months' mix must reproduce at least HALF of the rise (8% -> 26%). If the mix explains less than
      half, the rule's behaviour changed inside the groups and the hypothesis has not explained it.

## Part 2 - variants (126, 127, 128; ideas -> 47), no others afterwards. Everything else exactly A2; derived from A2's own daily results.
- XS1: no trade when the gap is at least 1.25 x ADR5 (25 days; 70% left alone).
- XS2: half size on those days.
- XS3: no trade when the gap is at least 1.0 x ADR5 (35 days = 43%: leaves under 60% alone, so it FAILS K4 before it is run; the large-sample reading only).
Filter kill lines (build can only kill; survivor = forward paper tag, no adoption question before 200 forward trades):
  K1. avg R per signal day at least A2's + 0.05R;  K2. changed days worse than the others by at least 0.3R;
  K3. that gap at least +0.3R in the backtest months AND in the live months separately;  K4. at least 10 days changed and at least 60% left alone.
Sample, plainly: 35 / 47 days for the split, 25 for XS1; within one period the stretched group is 11 (backtest) or 24 (live) days - E2 inside the backtest months rests
on 11 days and at most 3 events. If E2 cannot be read for lack of events I will say "not readable", which counts as not passed.
My guess, written now: E1 fails (ratio about 1.5); E3 explains a quarter of the rise at most; XS1-XS3 fail K1 and K3. The rise stays mostly unexplained, and the next
honest sentence is "eleven events in 42 trades against three in 39 is about 2.3 standard errors - partly luck".

# RESULTS (hypothesis and kill lines above pushed in commit 516733b before any result; labels checked on three days; one run: `python bt/stretched.py 2015-04-29`)
81 A2 trades 01-06..04-28, engine, full costs. Full-stop morning = 40+ pips against the entry between 08:00 and 12:00 London: 14 of 81 (3 of 39 before 03-02, 11 of 42 live).

## Part 1 - does a stretched signal explain the rise?
| | stretched (gap >= 1.0 x ADR5) | others | ratio | share of days stretched |
|---|---|---|---|---|
| All history | 7 of 34 = 20.6% | 7 of 47 = 14.9% | 1.38 | 42% |
| Backtest months | 2 of 11 = 18.2% | 1 of 28 = 3.6% | 5.09 | 28% |
| Live months | 5 of 23 = 21.7% | 6 of 19 = 31.6% | 0.69 | 55% |
Accounting: the backtest months' two rates applied to the live mix predict 11.6% full-stop mornings. Actual live: 26.2%. The change of mix explains 21% of the rise.
- E1 (stretched at least twice the others, all history): 1.38 -> FAIL.
- E2 (ratio at least 1.5 inside both periods): 5.09 in the backtest months (on 2 and 1 events - not worth the paper), 0.69 live - the WRONG WAY ROUND -> FAIL.
- E3 (mix explains at least half of the rise): 21% -> FAIL.
THE EXPLANATION IS DEAD. Stretched signals did become twice as common, and they did not cause the full-stop mornings.

## Part 2 - variants
| | changes | avg R / signal day (A2 +0.417) | net R (A2 +33.77) | max DD (A2 3.28) | gap all | backtest | live | full-stop mornings removed | K1 | K2 | K3 | K4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| XS1 skip when gap >= 1.25 x ADR5 | 24 days | +0.232 | +18.77 | 5.02 | -0.30 | +0.13 | -0.64 | 5 of 14 | FAIL | FAIL | FAIL | PASS |
| XS2 half size on those days | 24 days | +0.324 | +26.27 | 3.45 | -0.30 | +0.13 | -0.64 | - | FAIL | FAIL | FAIL | PASS |
| XS3 skip when gap >= 1.0 x ADR5 | 34 days | +0.231 | +18.74 | 3.47 | -0.04 | +0.17 | -0.30 | 7 of 14 | FAIL | FAIL | FAIL | FAIL |
NO SURVIVOR. The most stretched signals (gap >= 1.25 days) are my BEST trades: 24 trades, +0.625R each, +15.01R of the +33.77R. Skipping them would have cost 15R and
raised the drawdown from 3.3R to 5.0R.

## My guess against what happened
"E1 fails with a ratio of about 1.5": 1.38. "The mix explains a quarter at most": 21%. "XS1-XS3 fail K1 and K3": yes. What I did not guess: live, the full-stop
mornings sit MORE in the ordinary signals than in the stretched ones.

## What I learned
- Where the rise actually is: in the ORDINARY signals. Mornings with a gap under one day's range went a full stop against me 1 time in 28 in January-February and
  6 times in 19 live (3.6% -> 31.6%). In the stretched signals the rate did not move (18% -> 22%). So "I am entering late on extended moves" is exactly wrong:
  the extended entries behave as they always did, and it is the quiet-signal mornings that turned violent.
- This also corrects the picture I drew on 04-24 ("a small gap is a strong signal: 81% winners"). Averaged over all history that is true; live, the non-stretched
  group has both the scratches-that-win and most of the new full stops. Two readings of the same days; I trust neither as a rule.
- Two causes are now ruled out with numbers - a choppier two-week market (did not increase) and stretched signals (do not carry the stops) - and one is still
  untouched on the parked list: the hour before my entry is twice as lively live (30+ pips on 57% of days against 17%). I have NOT looked at any result by that
  measure, apart from one three-case note on 04-09. If my coach wants the "why" pursued, that is the next and last candidate I have, and it gets its own
  pre-registration; I am not running it today as a fourth variant.
- And the plain statistical reading, which I owe after two failed explanations: 3 events in 39 trades against 11 in 42 is a difference of 18.5 points with a standard
  error of about 8 - roughly 2.3 standard errors. Unlikely to be all luck, far from certain to be a change. With 14 events in total I cannot tell a cause from noise,
  and every split I make leaves 1 to 7 events per cell. The honest position: the loss side IS worse live, my expectations and sizing already use the worse numbers,
  and I do not know why.
Counts: ideas 47, variants 128 (the "choppier market" idea was dropped at the feature stage and is not counted as a variant).
