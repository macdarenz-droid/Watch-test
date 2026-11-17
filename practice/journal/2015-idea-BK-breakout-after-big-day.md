# Idea BK: night-box breakout on the day after a big-range day (idea 104; coach 07-14; route B hunt)
Written Tue 2015-07-14 22:00 London, before any code. From the study: big days follow big days (65% vs 38%); size, not direction.

## Hypothesis
After a big day the next day is more likely to travel far, so leaving the night's box in London should carry on; after a normal day it should not.

## Rule (London time; one trade a day at most)
- BIG DAY flag (same as in the study): yesterday's London-day range (22:00->22:00) is above the median of the last 10 London-day ranges (yesterday included).
- Box = high and low of 00:00-08:00. From 08:00 to 12:00: the first M5 candle that CLOSES outside the box -> market order at the next
  candle's open in that direction, stop 40 pips, close 20:00. No close outside by 12:00 -> no trade.
- BK1 (judged): only after a BIG day. BK0 (control): the same trade after NOT-big days. BK2 (dose): yesterday's range above 1.3 x that median.
Three variants, no more. Costs on (1.0 + 0.1 pips); stressed 2.0 + 0.5. $125 = 1R.

## Cases before outcomes
Count flag days and breakout days (a close outside the box is a fact, not a result) for each variant, before and from 04-07.
BK1 under 40 trades in all or under 15 from 04-07 -> not judgeable, killed for sample.
No clean held-out part exists (the clustering fact was read on all of Jan-Jun; breakout results were never looked at). So both regimes must pass.

## Kill lines for BK1 (all must pass)
K1 average >= +0.10R after costs. K2 net above zero before 04-07 AND from 04-07. K3 net above zero without its best two trades.
K4 BK1's average at least 0.15R above BK0's (else the big-day flag adds nothing). K5 stressed average above zero. K6 max drawdown <= 6R.
K7 dose: BK2's average >= BK1's.
Pass = route B step B1 candidate, then 40 forward paper trades. Fail = killed, no fourth variant. Idea 104 on the same six months: a lone pass could be luck.

## Counts and worked case (tool, before the outcome run)
Tool: `python bt/breakout_big.py 2015-07-15 count` / `check 2015-06-03` (facts only).
- 128 days with a flag (01-16..07-14): big 61, big x1.3 33; a close outside the box in 08:00-12:00 on 109 days.
- Trades: BK1 50 (24 before 04-07, 26 from), BK0 59 (23 / 36), BK2 30 (14 / 16). Judgeable by my line.
- Worked case 06-03: yesterday's range 278.3 > median 101.4 -> big. Box 1.11341-1.11896. The 08:10 candle closed under the box -> SELL at the 08:15 open, stop 40 pips, out 20:00.

## Result (one run)
Tool: `python bt/breakout_big.py 2015-07-15 test`. Hand check 06-03: sell 1.11336, stopped 1.11738, -1.00R (the price fell first, then the afternoon rally took the stop).
| variant | trades | avg R | net | wins | full stops | before 04-07 | from 04-07 | without best 2 | stressed avg | max DD |
|---|---|---|---|---|---|---|---|---|---|---|
| BK1 after a big day | 50 | +0.141 | +7.07 | 40% | 48% | 24: +10.74 | 26: -3.67 | +0.16 | +0.091 | 9.66R |
| BK0 after other days | 59 | +0.144 | +8.50 | 42% | 49% | 23: +8.61 | 36: -0.11 | -1.86 | +0.106 | 7.77R |
| BK2 big x1.3 | 30 | +0.094 | +2.83 | 40% | 50% | 14: +8.60 | 16: -5.77 | -3.97 | +0.053 | 9.50R |
BK1: K1 PASS | K2 FAIL (-3.67R from 04-07) | K3 PASS (by +0.16R) | K4 FAIL (the control is as good: +0.144R) | K5 PASS | K6 FAIL (9.66R) | K7 FAIL (bigger day, worse).
**BK IS KILLED.**
What I learned: 1. The big-day flag adds nothing to a breakout: after normal days the same trade did the same. Clustering of size is
real and I found no way to earn from it. 2. The breakout of the night box made its whole profit before 04-07 (+19.35R in 47 trades) and
lost after (-3.78R in 62): the same break in the market as RG, WM, DF, DH. That is now five rules that follow a move and die on the same
date. 3. The all-history average (+0.14R) would have passed K1 alone; the two-regime line did its job.
Counts: idea 104; variants 290-292; second setups tried 16, none alive.
