# Am I living the same edge? Forward trades vs the Jan-Feb backtest + ONE test from it (written before any run)
Clock Fri 2015-03-20 21:00 UTC (weekend; end of released data). Source: bt/edge_compare.py - mechanical A2, costs on, MAE/MFE from M5 candles during the hold.
(The coach said "last 14"; with today's trade there are 15 forward days, 03-02..03-20, and I use all of them.)

## Side by side
| | Jan (in-sample) | Feb (contaminated) | Jan+Feb | MARCH FORWARD (lived) |
|---|---|---|---|---|
| Trades | 19 | 20 | 39 | 15 |
| Win rate | 74% | 55% | 64% | 73% |
| Avg R | +0.78 | +0.23 | +0.50 | +0.50 |
| Median R | +1.11 | +0.08 | +0.31 | +0.30 |
| Avg winner / avg loser | +1.28 / -0.59 | +0.75 / -0.39 | +1.04 / -0.46 | +0.97 / -0.79 |
| Avg best point (MFE), pips | 56 | 31 | 43 | 40 |
| Avg worst point (MAE), pips | 16 | 21 | 18 | 16 |
| Winners: MFE / MAE | 72 / 11 | 45 / 13 | 60 / 12 | 50 / 12 |
| Losers: MFE / MAE | 11 / 30 | 15 / 30 | 13 / 30 | 15 / 28 |
| Full stops | 2 (11%) | 1 (5%) | 3 (8%) | 3 (20%) |
| Trades of +1R or more | 10 | 4 | 14 (36%) | 7 (47%) |
| Scratches (within 0.25R of zero) | 2 | 6 | 8 (21%) | 4 (27%) |
| Share of the best point actually banked | 56% | 30% | 46% | 50% |
| London-morning range, pips | 77 | 53 | 65 | 64 |
| Buys | 4 | 11 | 15 | 3 |
Where March sits: its +0.50R is at the 52nd percentile of 15-trade samples drawn from Jan+Feb, and at the 92nd percentile of samples drawn from February alone.

## The answer: the same edge, in the same shape - with one difference in the losers
- SAME: avg R (+0.50 vs +0.50), median (+0.30 vs +0.31), the winners' profile (worst point 12 pips in both - winners still barely go against me), the losers' profile
  (best point 13-15 pips, they still never really work), the morning's size (64 vs 65 pips), and the share of the move I bank (50% vs 46%). I am not living a different rule.
- March is a blend of my two months, as its weeks were: ten days of January-type trend (sells, big winners) and five days of February-type box (flips, scratches).
  Its result equals the two-month average, not January's. That is the most reassuring line here - and also a warning: it is NOT better than Jan-Feb, and against February alone it
  would be a top-decile month. My planning number stays at the February level (+0.18R at realistic costs).
- DIFFERENT: the losers are bigger. Avg loser -0.79R vs -0.46R, because 3 of 15 trades hit the full stop (20%) against 3 of 39 (8%). Three is a small number; it is also the one
  place where forward is visibly worse than backtest.
- What all six full stops in my history share (01-19, 01-27, 02-20, 03-02, 03-09, 03-19): the trade was never more than 8 pips in profit, and the stop was hit within about two hours.
  Two of the March three were gone by a whisker or would have been fine by noon: 03-09 (stop missed the high by 2.4 pips, positive at 12:00), 03-19 (-12 pips at noon instead of -40).
  And 03-17 survived by 0.9 pip. Four trades in three weeks decided by a pip or two around a 40 pip line.

## The one test from it: idea S "is 40 pips too tight?" (ideas -> 23)
I have tested a TIGHTER stop (E1: 30 pips - worse in February) and volatility-scaled stops (V - worse). I have never tested a WIDER fixed stop.
Hypothesis: a wider stop, at the same dollar risk (so a smaller position), turns some full stops into small noon exits and gives a better ride - more net R per unit of drawdown -
without giving up the profit, because my winners need almost no room (worst point 12 pips) while my stop-outs cluster just beyond 40.
The counter-argument, which I think is the stronger one: at the same dollar risk every pip is worth less, so every winner shrinks by a quarter to a half, and I only have 6 stops in 54 trades to save.
Variants (54, 55, 56), no others afterwards. Entries and noon exit exactly A2; $125 risk at the stop:
- S50: stop 50 pips.   - S60: stop 60 pips.   - S80: stop 80 pips.

Kill tests (fixed now; same bars as the volatility test, judged on drawdown as well as R). Score = net R / max drawdown.
Build - January: a variant survives only if score >= 1.25 x A2's AND net R >= 95% of A2's. Highest score among survivors = the candidate.
Check: there is NO clean month for this idea, and I say so before running: the observation came from the March forward trades themselves, so March is spent for it, and
February is contaminated as always. Both are shown; the candidate must match or beat A2's score with at least 95% of its net R in BOTH to earn a forward paper tag from Mon 03-23.
A paper tag is the most this test can produce. It cannot change my stop in phase 2.

My guess: none survives January - the winners' shrinkage costs more R than the two January stops can give back. If so the answer to "is 40 too tight?" is "no: the pip-or-two
stop-outs are the price of a stop that keeps the winners big", and I stop looking at 03-09 and 03-19 as near misses.
Nothing above has been run.
