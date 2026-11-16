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
