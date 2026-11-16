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
