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

# RESULTS of the exit-time test (run after commit b555138). ET10/ET11/ET13 = variants 51/52/53; ideas 22. Costs on, same entries, stop and size as A2 (bt/ab_score.py).

| Data | Exit | Trades | Win rate | Avg R | Net R | Max DD | Net R / max DD |
|---|---|---|---|---|---|---|---|
| January (BUILD, in-sample) | 12:00 (A2) | 19 | 74% | +0.78 | +14.89 | 1.34R | 11.1 |
| January | 10:00 | 19 | 63% | +0.42 | +7.90 | 1.75R | 4.5 |
| January | 11:00 | 19 | 74% | +0.62 | +11.86 | 1.80R | 6.6 |
| January | 13:00 | 19 | 63% | +0.56 | +10.63 | 1.86R | 5.7 |
| MARCH lived days (CLEAN check, use #1) | 12:00 (A2) | 14 | 71% | +0.46 | +6.45 | 1.03R | 6.3 |
| March | 10:00 | 14 | 64% | +0.33 | +4.66 | 1.31R | 3.6 |
| March | 11:00 | 14 | 57% | +0.34 | +4.77 | 1.35R | 3.5 |
| March | 13:00 | 14 | 57% | +0.27 | +3.73 | 1.18R | 3.1 |
| February (CONTAMINATED, reference only) | 12:00 (A2) | 20 | 55% | +0.23 | +4.67 | 1.87R | 2.5 |
| February | 10:00 | 20 | 55% | +0.01 | +0.13 | 1.49R | 0.1 |
| February | 11:00 | 20 | 50% | +0.15 | +3.07 | 1.38R | 2.2 |
| February | 13:00 | 20 | 55% | +0.23 | +4.62 | 2.19R | 2.1 |

## Build (January): NO SURVIVOR - no exit hour beats noon
All three have lower avg R AND a bigger drawdown than the 12:00 exit. My hypothesis (earlier = same R, smaller drawdown) is wrong: leaving early gives back profit and does not smooth anything.
No candidate, so nothing is claimed from March. The March rows are read only for the robustness question.

## What the clean month says (this is the part worth having)
- Noon was the best of the four exit hours in March too - a month that played no part in choosing it. First time one of A2's parts has support from data it was not built on.
- Every exit hour was positive in January and March (and 11:00-13:00 in February): the edge is not a knife-edge on one clock time.
- But my robustness line ("11:00 and 13:00 within 0.15R of noon in January AND March") is NOT met: 11:00 is 0.16R lower in January and 0.12R lower in March; 13:00 is 0.22R and 0.19R lower.
  So noon is a real peak, and part of January's +0.78R belongs to having picked the best hour. A fair expectation for the morning edge is nearer the neighbours' level than the peak's.
- 13:00 was the worst hour in March, as guessed: with the US clock change it now straddles the 12:30 data. Staying flat at 12:00 is worth more since 03-08, not less.
- 10:00 is clearly too early everywhere: half the leg is still to come.

## Verdict
Exit stays at 12:00 UTC. Variants ET10, ET11, ET13 closed. March has now been used once as a check (for exit time); it is spent for that question.
Counts: ideas 22, variants 53.
