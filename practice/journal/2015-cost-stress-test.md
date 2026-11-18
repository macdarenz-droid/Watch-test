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

# RESULTS (run after commit b39ec91). A2 as frozen, $125 risk, 3 scenario runs (no new rule definition; variant count stays 41). Jan-Feb only, one month per block (bt/cost_stress.py).

| Costs (spread + slippage, pips) | Jan trades / win / avg R / net R / max DD | Feb trades / win / avg R / net R / max DD | Feb full stops |
|---|---|---|---|
| Sim baseline 1.0 + 0.1 | 19 / 74% / +0.78 / +14.79 / 1.33R | 20 / 55% / +0.23 / +4.64 / 1.86R | 1 |
| C1 1.5 + 0.3 | 19 / 74% / +0.76 / +14.39 / 1.38R | 20 / 50% / +0.18 / +3.55 / 1.92R | 2 |
| C2 2.0 + 0.5 | 19 / 74% / +0.74 / +13.99 / 1.44R | 20 / 50% / +0.16 / +3.12 / 1.99R | 2 |
| C3 3.0 + 1.0 (stress) | 19 / 74% / +0.69 / +13.10 / 1.56R | 20 / 50% / +0.11 / +2.15 / 2.14R | 2 |

## Against my prediction
- January: as predicted (about -0.02R per extra 0.7 pip of cost).
- February: WORSE than predicted. I expected +0.19R under C2; it is +0.156R. Two things my arithmetic missed: one more trade is stopped out when the spread is wider
  (a sell whose stop sat a fraction of a pip above the high), and one scratch winner (+0.01R) becomes a loser, so the win rate drops from 55% to 50%.
  Costs do not only shave every trade; they flip the marginal ones.

## Decision rule, applied
- February under C2 = +0.156R, the line was +0.15R -> PLAN STANDS. By six thousandths of an R: a pass, not a comfortable one.
- February under C3 = +0.11R, above 0 -> no cut.
- Nothing here raises size or changes the rule.

## What I take from it
- The edge is not a cost artifact: even at three times the sim's spread plus a pip of slippage on every fill, both months stay positive.
  A 40 pip stop and a four-hour hold make A2 a slow trade; it does not live on a pip.
- But the box-month number is soft: +0.23R at sim costs, +0.18R at mediocre costs, +0.16R on a bad morning, on 20 trades. For planning I now carry +0.18R, not +0.23R, as "February at
  realistic costs". At 0.75% that stretches the median phase 2 time by roughly a quarter; it does not change the size decision (the size test's zero-edge and negative-edge rows are still the ones that matter).
- The sim will keep paying me at 1.0 + 0.1. I should not mistake that for the number a real account would see.
