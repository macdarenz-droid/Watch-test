# Backtest test: idea R "can I tell trend from box with what I know at 07:00?" - 3 detectors (written before any run)
Clock Fri 2015-03-06 00:00 UTC (end of released data). Jan-Feb only (END <= 2015-03-01 in every command); March is not used.

## The question
Every test so far ended the same way: what helps in the trend month hurts in the box month. That only matters if I can know, on the morning, which one I am in.
F1 tried one measure (5-day efficiency): it recognised the MONTH (67% of Jan days "straight", 85% of Feb days "crooked") but was useless by the DAY
(A2 made +0.72R on straight days vs +0.81R on crooked ones in Jan). So "recognises the month" is not enough; the label has to line up with the days A2 actually pays.

## What "telling" means here (two levels, both needed)
- Level 1, recognition: the detector says TREND on at least 60% of January's trade days and at most 40% of February's.
- Level 2, usefulness: A2 earns clearly more on days labelled TREND than on days labelled BOX.
Truth is not my opinion of the month; it is A2's own result on that day (mechanical A2, costs on, $125).

## Three detectors (variants 27, 28, 29; ideas -> 14). Each uses only daily data finished before 07:00 of the trade day. One fixed definition each, no tuning.
- R1 "new ground": TREND if yesterday's 22:00 close is the highest or the lowest of the last 5 daily closes. (A trend keeps closing at new extremes; a box does not.)
- R2 "big days": TREND if yesterday's high-low range was at least the average range of the 5 days before it. (Trend months had bigger days: Jan 140 pips vs Feb 115.)
- R3 "is the rule working": TREND if A2's last 5 trades (mechanical) net above 0R. (If the rule only pays in trends, its own recent results are a trend gauge.)
Lookback 5 everywhere, chosen so January has enough labelled days; I will not try 3 or 10 afterwards.

## Kill tests (fixed now)
Build - January. A detector survives only if ALL:
  (a) both labels have at least 4 trade days;
  (b) A2 avg R on TREND days minus A2 avg R on BOX days >= +0.30R;
  (c) the same gap is still >= +0.15R when the single biggest day (01-23, +4.27R) is removed.
Check - February (CONTAMINATED), all three shown, only January survivors can be claimed. A survivor passes only if: both labels have at least 4 days AND the TREND-minus-BOX gap is >= +0.15R.
Level 1 (recognition) is reported for all three; a detector that passes Level 2 but not Level 1 is still interesting, one that passes Level 1 only is another F1.
What a pass would earn: NOT a rule change. Only the right to paper-tag it forward on unseen days, where it would have to show the same gap before it touches the plan.

## Labels and guesses, in advance
- February is contaminated, and badly for R1: I know the February closes and results well enough to half-predict it from memory (several "new 5-day extreme" days were followed by losers).
- R3 looks doubtful already: my live table showed A2 did better the day after a loss (+0.66R) than after a win (+0.26R), the opposite of "results come in streaks".
- My guess: none of the three passes Level 2 in both months. If so, I should stop assuming regime can be read off simple daily numbers and say so.
Nothing above has been run.
