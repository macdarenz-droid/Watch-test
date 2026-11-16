# Which data is still clean; what the last 3.6R needs; ONE exit test on my one setup (all written before any run)
Clock Fri 2015-03-20 00:00 UTC (end of released data).

## 1. Process note: what each piece of my history can still be used for
| Data | Trades (A2) | Status | What it may be used for |
|---|---|---|---|
| January 2015 | 19 | IN-SAMPLE. The rule was born here and every one of 50 variants was built or scored on it | building (choosing) only |
| February 2015 | 20 | CONTAMINATED. Clean once (the frozen A/B check); since then used as "check" ~15 times, and several ideas were found by staring at it | shown for reference, labelled; no verdict rests on it any more |
| March 02-19, lived forward | 14 | CLEAN OF BUILDS: no rule, threshold or variant was ever chosen on these days; each was traded once, by the frozen rule, before I saw it | the out-of-sample check from now on |
Honest limits of "clean": (a) I have SEEN each March day's hourly candles once, in the journal printout after trading it, so my eyes are not blind to it - I must write hypotheses
from Jan-Feb notes, not from March memories; (b) every time I use March as a check for an idea, it is spent for THAT idea - I will count the uses here; (c) 14 trades, 12 of them one
straight fall: it can reject, it cannot confirm. Uses of March as a check so far: 0 (this test will be use #1). Days traded from now on join the clean set as they are lived.

## 2. The last stretch of phase 2, in numbers (my own results; costs inside)
Balance $25,569.17. Target $26,250: $681 = 3.63R at $187.50. Distance to my first brake ($24,000): 8.4R of losses; second brake 11.0R; the 10% breach line 16.4R.
My record, all 48 live trades: 65% wins, avg +0.44R, average winner +0.98R, average loser -0.54R. February alone +0.23R; March forward +0.46R (71% wins).
| To finish in... | Avg R needed | Win rate needed at my payoff |
|---|---|---|
| 5 trades | +0.73R | 83% |
| 10 trades | +0.36R | 59% |
| 20 trades | +0.18R | 47% |
| 30 trades | +0.12R | 43% |
| 40 trades | +0.09R | 41% |
Reshuffling my own results from today's balance (20,000 paths, brakes on, 0.75%):
| If the edge is like... | Pass within 10 / 20 / 40 days | Stopped by my -6% brake within 60 days | Median days |
|---|---|---|---|
| all 48 live trades (+0.44R) | 63% / 91% / 99% | 0.0% | 8 |
| February (+0.23R) | 33% / 69% / 94% | 0.0% | 14 |
| March forward (+0.46R) | 68% / 93% / 100% | 0.0% | 8 |
| zero | 10% / 22% / 38% | 2.0% | 22 |
| slightly negative (-0.10R) | 5% / 11% / 16% | 17.6% | 18 |
Reading: I do not need a better rule to finish; I need the one I have to keep being about what it has been (a 47% win rate over 20 trades is enough) and I need not to breach, which
at this distance (16R) only a broken rule followed for months could do - and the brakes end that at -6%. What could cost me the phase is impatience, not arithmetic.
My best setup, and my only one with forward evidence, is A2. That is the setup the exit test below is about.

## 3. ONE exit question on A2: is 12:00 the right time to leave? (idea E-time; ideas -> 22)
Why this one: the exit HOUR is the only number in A2 I have never tested (I chose "out at noon" on 01-09 after one week). Every other exit idea - stop size, break-even, runner,
target, one-hour check, wall, volatility stop - has been tested and failed. And the US clock change means US news now lands 30 minutes after my exit instead of 90.
Hypothesis: the London-morning edge is earned in the first hours after 08:00; leaving earlier keeps most of the profit with less give-back and less exposure, so an earlier exit
gives at least the same avg R with a smaller drawdown. (And the mirror question: does one more hour add anything?)
Variants (51, 52, 53), no others afterwards. Entries, stop and size exactly A2:
- T10: close at 10:00 UTC.   - T11: close at 11:00 UTC.   - T13: close at 13:00 UTC.

Kill tests (fixed now):
Build - January: a variant survives only if avg R >= A2's + 0.05R AND max drawdown <= A2's + 0.25R (my standard exit bar). Highest avg R among survivors = the candidate.
Check - MARCH LIVED DAYS (03-02..03-19, 14 trades; clean of builds; use #1). The candidate passes only if avg R >= A2's on those days AND max drawdown <= A2's.
  With 14 trades this can only say "not worse out of sample"; a pass earns a forward paper tag, not a change to the exit.
February is shown for all three, labelled contaminated; it decides nothing.
Robustness reading (like idea L): if T11 and T13 are both positive and within 0.15R of A2 in January AND March, the noon exit is not a lucky hour.
Extra limits, because my money is in this rule right now: no exit change in phase 2 on the strength of 14 trades, whatever the table says.

My guess, written first: 11:00 gives up a little R and saves little; 10:00 gives up a lot (the leg is not finished); 13:00 is worse in March because of the 12:30 US data. Noon stays.
What I know from memory that could bias me: I have seen March's hourly candles once; I recall days that kept running after noon (03-04, 03-06, 03-10) and Monday 03-16's jump at 12:00-13:00.
I have not looked at any table of exit hours for any month.
Nothing above has been run.
