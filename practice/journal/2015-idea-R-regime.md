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

# RESULTS of idea R (run after commit 86bf623). R1/R2/R3 = variants 27/28/29; ideas 14. A2 mechanical, costs on, $125. Jan-Feb only, one month per run (bt/regime.py); March not used.

| Month | Detector | Days labelled | Says TREND | A2 on TREND days (n / win / avg R) | A2 on BOX days (n / win / avg R) | Gap | Gap without the month's biggest day |
|---|---|---|---|---|---|---|---|
| Jan (build) | R1 new 5-day closing extreme | 16 | 44% | 7 / 57% / +0.69 | 9 / 78% / +0.66 | +0.03R | -0.56R |
| Jan (build) | R2 yesterday's range >= 5-day average | 15 | 47% | 7 / 71% / +0.98 | 8 / 75% / +0.55 | +0.44R | -0.11R |
| Jan (build) | R3 A2's last 5 trades net > 0 | 14 | 100% | 14 / 71% / +0.71 | 0 | - | - |
| Feb (CONTAMINATED) | R1 | 20 | 30% | 6 / 33% / -0.05 | 14 / 64% / +0.35 | -0.41R | -0.27R |
| Feb (CONTAMINATED) | R2 | 20 | 45% | 9 / 44% / +0.40 | 11 / 64% / +0.09 | +0.31R | +0.09R |
| Feb (CONTAMINATED) | R3 | 20 | 85% | 17 / 47% / +0.16 | 3 / 100% / +0.65 | -0.50R | -0.62R |
(A2 all days: Jan 19 trades +0.78R; Feb 20 trades +0.23R. Biggest days: 01-23 +4.27R, 02-17 +2.14R.)

## Level 1 - recognition (needed: TREND >= 60% of January days and <= 40% of February days): ALL THREE FAIL
R1 44% / 30%, R2 47% / 45%, R3 100% / 85%. None of them even sees the two months as different. (F1's efficiency measure did: 67% / 15%.)

## Level 2 - usefulness, January build: NO SURVIVOR
- R1: gap +0.03R (needed +0.30R); without 01-23 it is -0.56R. Days after a new 5-day closing extreme were not better for A2.
- R2: gap +0.44R looks like a pass, but it is one day: without 01-23 the gap is -0.11R. Fails line (c), which exists for exactly this.
- R3: never said BOX in January (the rule was always "working"), so there is nothing to compare. Fails line (a).
February, for the record only: R1 has the WRONG sign (-0.41R: after a new closing extreme A2 lost; in a box a new extreme is where the move ends), R2 +0.31R but +0.09R without 02-17,
R3 wrong sign (-0.50R: A2 did best right after its own bad runs).

## Verdict
- I cannot tell which regime I am in from these daily numbers at 07:00. Three detectors, plus F1's efficiency before them: one recognised the month and none separates A2's good days from its bad ones.
- What the tables keep showing instead: A2 was positive on BOTH labels of every detector in January, and its bad February days are spread across both labels too.
  "Trend month vs box month" describes the month's total after the fact; it does not seem to live in any single morning's daily numbers.
- So I stop planning around "first identify the regime". Plan v2 already assumes this: one rule, every day, sized so a box-month edge is survivable, with a forward kill test on the rule itself.
- R3 adds one practical note for my own head: A2 did not do better after its good runs (wrong sign in Feb, no information in Jan). Feeling "the rule is hot/cold" is not a signal.
- Variants R1, R2, R3 closed; nothing is paper-tagged forward from this test. The idea (regime) stays open, but I will not spend another variant on a daily-bar detector without a new reason.
- Counts: ideas 14, variants 29.
