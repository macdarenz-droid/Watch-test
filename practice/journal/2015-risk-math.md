# Risk math: what size gets +8% in ~2 months without endangering the 5% daily / 10% max limits
Clock Fri 2015-02-27 22:00 UTC, unchanged. No new candles, no strategy variant (counts stay 10 ideas / 19 variants). Source: bt/risk_math.py on my own 34 live trades.

## Assumptions
- Edge = February, my only out-of-sample month: +0.23R per trade, 55% wins, 20 trades. Its uncertainty: standard error 0.17R, so the honest range is about -0.10R to +0.56R. Zero is inside it.
- One trade per weekday (~20 a month, 40 in two months). Fixed dollar risk (no compounding). Costs are inside every R (sim fills: 1.0 pip spread + 0.1 slippage).
- In this sim a stop fills at its price, so the worst possible day is one full stop = -1.02R. A "stress day" (stop jumped, -3R) cannot happen here but can in real life; I size for it anyway.
- Floating losses count for the limits, so drawdown below includes the worst point inside each trade (from M5 history), not only closed results.

## 1. Replay of my real Jan-Feb trade sequence at four sizes (% of $25k)
| Risk per trade | Final (34 trades) | Feb only (20) | Worst day | Max drawdown incl. floating | Lowest equity vs start | +8% reached at trade |
|---|---|---|---|---|---|---|
| 0.50% (traded) | +7.35% | +2.32% | -0.51% | 1.02% | -0.01% | not yet |
| 0.75% | +11.02% | +3.48% | -0.77% | 1.53% | -0.02% | #18 |
| 1.00% | +14.69% | +4.64% | -1.02% | 2.04% | -0.03% | #9 |
| 1.50% | +22.04% | +6.96% | -1.54% | 3.05% | -0.04% | #4 |
None of the four sizes comes near either limit on the path I actually lived (worst day 1.54% vs 5%; worst drawdown 3.05% vs 10%).
But this path starts with January's trend; February alone reaches +8% at none of them.

## 2. Two months at a February-sized edge (bootstrap of my 20 February results, 40 trades, 200,000 paths)
| Risk | Avg R needed for +8% in 40 trades | Trades needed at +0.23R | Pass +8% in 2 months | Median result | Bad-luck result (5th pct) | Drawdown, 1-in-100 case |
|---|---|---|---|---|---|---|
| 0.50% | +0.40R | ~69 (3.5 months) | 9% | +4.6% | +0.9% | 2.6% |
| 0.75% | +0.27R | ~46 (2.3 months) | 42% | +6.9% | +1.4% | 4.0% |
| 1.00% | +0.20R | ~35 (1.7 months) | 66% | +9.2% | +1.8% | 5.3% |
| 1.50% | +0.13R | ~23 (1.2 months) | 86% | +13.8% | +2.6% | 7.9% |

## 3. The same two months if I am wrong about the edge
| Risk | Edge is ZERO: breach 10% | Edge is ZERO: drawdown 1-in-100 | Edge is -0.10R: breach 10% | Edge is -0.10R: bad-luck result (5th pct) |
|---|---|---|---|---|
| 0.50% | 0.0% | 5.8% | 0.0% | -5.8% |
| 0.75% | 0.2% | 8.7% | 2.4% | -8.6% |
| 1.00% | 2.0% | 11.6% | 12.7% | -11.5% |
| 1.50% | 12.1% | 17.3% | 38.4% | -17.2% |

## 4. The limits themselves
| Risk | Worst sim day (1 full stop) | Stress day (-3R) | Share of the 5% daily limit used by a stress day | Full stops in a row to breach 10% |
|---|---|---|---|---|
| 0.50% | -0.51% | -1.50% | 30% | 20 |
| 0.75% | -0.77% | -2.25% | 45% | 14 |
| 1.00% | -1.02% | -3.00% | 60% | 10 |
| 1.50% | -1.54% | -4.50% | 90% | 7 |
My longest losing run so far: 3 trades, -1.86R.

## 5. The size I pick: 0.75% ($187.50, 0.47 lots x 40 pips), with the plan v2 brakes
- What the arithmetic says: +0.23R x 40 trades = 9.2R, so +8% in two months needs at least 8 / 9.2 = 0.87% per trade. Of the four sizes, 1.00% is the smallest that gets there on expectation.
- Why I still pick 0.75%: the choice between 0.75% and 1.00% is not about the limits when the edge is real (both are safe then). It is about what happens if the edge is not real,
  and my evidence for +0.23R is 20 trades with zero inside the error range.
  - If the edge is real: 0.75% passes in about 2.3 months instead of 1.7. I lose about three weeks.
  - If the edge is zero: breach risk 0.2% instead of 2.0%.
  - If the edge is slightly negative (-0.10R, which my data cannot rule out): breach risk 2.4% instead of 12.7% - five times safer.
  - A stress day costs 2.25%, under half the daily limit; at 1.00% it is 3% and at 1.50% it is 4.5%, one slip from a daily breach.
  Three weeks of time against a five-fold cut in breach risk on an unproven edge: I take the cushion.
- 1.50% is out: it only looks good if February is exactly right; a zero edge breaches 1 time in 8.
- 0.50% is out for the goal: 3.5 months per phase even if the edge is real.
- Honest answer to "what gets +8% in ~2 months": at +0.23R, nothing with cushion does it in exactly two. 0.75% is ~2.3 months with cushion; 1.00% is ~1.7 months without it.
  I would move to 1.00% only after the rule passes its own forward test (plan v2: 40 unseen trades averaging at least +0.10R), i.e. after the edge has more than 20 trades behind it.
- Brakes unchanged from plan v2: 4% below the phase start -> back to 0.5%; 6% below -> stop and review. Phase 1 (1.3R from target) is finished at 0.5%.

## Correction to my own records
While checking drawdown I found I had overstated my worst losing run: I wrote "-2.17R, four losses in a row" in the W08/W09 journals, STATE.md and plan v2.
The four losers of that week were not consecutive (the +2.14R win sat between them). The real worst run is 3 losses, -1.86R (02-18 to 02-20), which is also what the backtest shows. Fixed in all four places.
