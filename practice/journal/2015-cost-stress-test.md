# Backtest test: is A2's edge an artifact of cheap trading costs? (written before any run)
Clock Fri 2015-03-13 21:00 UTC (weekend; end of released data). Jan-Feb only (END <= 2015-03-01); March is not used.

## The question (new: not a rule change, not another filter)
Every number I own assumes the sim's costs: 1.0 pip spread + 0.1 pip slippage. A real account at the London open can be worse, and a stop can slip.
If the box-month edge (+0.23R) disappears with slightly worse costs, my planning number is fiction and my size is too big.

## What is run
A2 exactly as frozen, same trades, three cost scenarios. These are NOT rule variants (no new definition); I count them as 3 scenario runs and keep the variant count at 41.
- C1: spread 1.5 pips + 0.3 slippage (a mediocre broker).
- C2: spread 2.0 pips + 0.5 slippage (a bad morning).
- C3: spread 3.0 pips + 1.0 slippage (stress: wide spread AND slipped fills on every order, stops included).
Baseline for comparison: 1.0 + 0.1.

## My prediction, written first (so I can be wrong on paper)
Each extra pip of round-trip cost is 1/40 of R = 0.025R per trade with a 40 pip stop. So C1 should cost about 0.02R per trade, C2 about 0.04R, C3 about 0.08R,
plus a little more from stops being touched slightly more often on sells (the ask is higher). I expect February to stay near +0.19R (C2) and about +0.15R (C3).

## Decision rule (fixed now)
- Plan stands as it is if February (the box month) keeps avg R >= +0.15R under C2.
- If February under C2 is between +0.05R and +0.15R: plan stands but my planning edge drops to that number and I re-run the phase 2 size test with it.
- If February under C2 is below +0.05R, or under C3 is at or below 0R: the edge is too thin to carry 0.75% -> cut to 0.50% from the next trade and say so.
- Whatever happens, nothing here can RAISE size or change the rule.
February is "contaminated" in the usual sense, but this test fits nothing - it only makes every trade worse by a fixed amount.
Nothing above has been run.
