# Backtest test to earn the next day: idea L "is my 3-day lookback special?" (written before any run)
Clock Tue 2015-03-03 00:00 UTC (end of released data). Backtest on Jan-Feb only; March is not used.

## Why this test
The one number in A2 I picked without any test is the "3" in "last close vs the close 3 trading days earlier" (chosen on 01-09 after one week of watching).
Idea K showed the 3-day direction beats the raw Asia break in both months, so direction from recent closes matters. Two things I do not know:
- Robustness: if only 3 works and its neighbours do not, A2's result is a lucky parameter, and my +0.23R out-of-sample is worth less than I think.
- Improvement: a longer lookback flips less often, which should help in a box (February flipped 4 times); a shorter one reacts faster after a breakout.

## Hypothesis
The edge comes from "trade the London morning with the recent direction of daily closes" in general, not from the number 3. So lookbacks 2 and 5 should both be positive after costs
in BOTH months; and the 5-day lookback should do better than 3 in the box month because it flips less.

## Variants (3, all counted: variants 20, 21, 22; ideas -> 11). Everything else exactly A2 (08:00 market, SL 40, out 12:00, $125, costs on).
L1: lookback 2 days.   L2: lookback 5 days.   L3: lookback 10 days.
No other lookbacks, no averages of several, no rescue.

## Kill tests (fixed now)
A. Improvement (build on January, check February): a variant survives the January build only if avg R >= A2's avg R AND max drawdown <= A2's + 0.5R, on the days both rules can trade.
   The survivor with the highest January avg R is THE candidate (none -> no candidate, improvement claim dead). The candidate passes February only if
   avg R >= A2's + 0.15R, net R >= A2's, max drawdown <= A2's.
B. Robustness of A2 (both months, all three variants): A2 is called ROBUST to its lookback only if L1 and L2 (the neighbours) are each above 0R per trade in January AND in February.
   If either neighbour is <= 0 in February, I record that A2's February result depends on the exact number 3 = fragile, and plan v2's rule-level kill test stays the only thing I trust.
Because test B needs them, all three variants are run on both months; only the January-selected candidate may be claimed as an improvement.

## Labels written in advance
- February is CONTAMINATED: I traded it, studied its losers, and know its daily closes by heart. A pass is weaker than an unseen month; a fail is a real fail.
- Days compared: the 10-day lookback cannot trade the first two weeks of January; each variant is compared with A2 on the days that variant can trade.
- My guess: neighbours positive in January (everything was), mixed in February. I do not know.
Nothing above has been run.

# RESULTS of idea L (run after commit 7353f6d). L1/L2/L3 = variants 20/21/22; ideas 11. Costs on, $125 risk. Jan-Feb only, one month per run (bt/ab_same.py); March not used.

| Month | Rule | Trades | Win rate | Avg R | Net R | Max DD | A2 on the same days (avg R / net R / max DD) |
|---|---|---|---|---|---|---|---|
| Jan (build) | A2, lookback 3 (before) | 19 | 74% | +0.78 | +14.79 | 1.33R | - |
| Jan (build) | L1, lookback 2 | 18 | 61% | +0.49 | +8.77 | 2.48R | +0.75 / +13.57 / 1.33R |
| Jan (build) | L2, lookback 5 | 15 | 53% | +0.49 | +7.30 | 2.32R | +0.75 / +11.23 / 1.33R |
| Jan (build) | L3, lookback 10 | 10 | 30% | +0.03 | +0.29 | 2.32R | +0.42 / +4.22 / 1.33R |
| Feb (CONTAMINATED) | A2, lookback 3 (before) | 20 | 55% | +0.23 | +4.64 | 1.86R | - |
| Feb (CONTAMINATED) | L1, lookback 2 | 20 | 50% | +0.14 | +2.72 | 2.60R | +0.23 / +4.64 / 1.86R |
| Feb (CONTAMINATED) | L2, lookback 5 | 20 | 60% | +0.26 | +5.20 | 1.21R | +0.23 / +4.64 / 1.86R |
| Feb (CONTAMINATED) | L3, lookback 10 | 20 | 30% | -0.14 | -2.85 | 3.59R | +0.23 / +4.64 / 1.86R |
Days where the side differed from A2: Jan 3 / 4 / 4, Feb 5 / 5 / 11 (L1 / L2 / L3).

## Test A - improvement: DEAD on the build
No lookback beats 3 in January (all three have lower avg R and a bigger drawdown than A2 on the same days), so there is no candidate and no improvement claim.
L2 is a touch better than A2 in February (+0.26 vs +0.23R, drawdown 1.21R vs 1.86R) but it failed January and February is contaminated: that is not an improvement, and I am not adopting it.

## Test B - robustness: PASS
Both neighbours are above zero after costs in both months (L1 +0.49 / +0.14R; L2 +0.49 / +0.26R). By the rule I wrote first, A2 is ROBUST to its lookback:
the result does not hinge on the number 3. The first good news about the rule that did not come from the rule's own numbers.
The 10-day lookback is the exception that teaches something: +0.03R and -0.14R, 30% wins in both months. So the thing that works is SHORT-term direction (2 to 5 days of closes);
the "big picture" direction over two weeks was useless for the London morning in both months - the opposite of what I assumed when I kept writing "D1 big picture down" in my calls.

## Verdict
- Rule unchanged (A2, lookback 3). Variants L1, L2, L3 closed. Counts: ideas 11, variants 22.
- What I know more firmly than yesterday: direction from the last few daily closes carries the edge (K: beats the raw break; L: 2, 3 and 5 all positive, 10 not).
- Honest size of that: 18-20 trades per cell; "positive" for the neighbours means +0.14 to +0.49R, none of it proven.
