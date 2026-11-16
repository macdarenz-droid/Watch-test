# Challenge arithmetic and TRADING PLAN v2 (written Sat 2015-02-28 sim time; clock stopped at Fri 02-27 22:00 UTC; no new candles, no new backtest)
Numbers come from bt/pass_math.py, which reads only my own live results (sim/trades.csv). No strategy variant was run: counts stay at 9 ideas / 17 variants.

## 1. Assumptions
- Account $25,000. Phase 1 target +8% = $2,000. Max loss 10% = $2,500 (equity $22,500). Daily loss 5% of start-of-day balance. Min 5 trading days. The challenge itself has no time limit; "1-2 months" is my goal.
- My stated risk: $125 = 0.5% = 1R (0.31 lots x 40 pip stop). So +8% = 16R; the 10% breach = 20R; the daily limit = 10R.
- One trade per weekday, about 20 trades a month. So my worst possible day is -1R (-0.5%): the daily limit cannot be hit by plan. Only the 20R total matters.
- Costs are inside every R below (1.0 pip spread + 0.1 slippage; my R's are sim fills).
- Win rate needed is computed at MY payoff: average winner +0.99R, average loser -0.46R (34 live trades). Expectancy = win% x 0.99 - (1 - win%) x 0.46.
- Bootstrap = 100,000 random re-orderings/re-draws of my own trade results. It assumes future trades look like past ones and are independent. Both are optimistic assumptions;
  a weekend gap or shock can also lose more than 1R. Treat every probability as "at best".

## 2. What is needed vs what I have
| To reach +8% | Trades | Avg R needed | Win rate needed (at my payoff) | Full stops in a row to breach |
|---|---|---|---|---|
| in 1 month at 0.50% risk | 20 | +0.80R | 87% | 20 |
| in 2 months at 0.50% risk | 40 | +0.40R | 60% | 20 |
| in 1 month at 0.75% risk | 20 | +0.53R | 69% | 13 |
| in 2 months at 0.75% risk | 40 | +0.27R | 50% | 13 |
| in 1 month at 1.00% risk | 20 | +0.40R | 60% | 10 |
| in 2 months at 1.00% risk | 40 | +0.20R | 46% | 10 |

| My numbers (rule A2, costs on) | Trades | Win rate | Avg R |
|---|---|---|---|
| Live, both months | 34 | 62% | +0.43R |
| January (trend month, the month the rule came from) | 14 | 71% | +0.72R |
| February (box month, out-of-sample) | 20 | 55% | +0.23R |

Gap at my current 0.5% risk:
- 1 month: need +0.80R / 87%. Best I have ever done is +0.72R / 71% in a once-in-a-while trend month. Gap +0.08R even then; +0.57R against February. NOT achievable by plan.
- 2 months: need +0.40R / 60%. Live average +0.43R / 62% just clears it, but only because January is in it. Against the out-of-sample month: short by 0.17R per trade and 5 points of win rate.

Chance of passing phase 1 / chance of breaching, from the bootstrap:
| If my real edge is... | Risk | 1 month | 2 months | 4 months |
|---|---|---|---|---|
| like all 34 live trades (+0.43R) | 0.50% | pass 7% / breach 0% | 60% / 0% | 99% / 0% |
| | 0.75% | 34% / 0% | 87% / 0% | 100% / 0% |
| | 1.00% | 57% / 0% | 95% / 0% | 100% / 0% |
| like February, out-of-sample (+0.23R) | 0.50% | 0% / 0% | 9% / 0% | 69% / 0% |
| | 0.75% | 4% / 0% | 42% / 0% | 91% / 0% |
| | 1.00% | 18% / 0% | 66% / 0% | 97% / 0% |
| ZERO (February results shifted to average 0) | 0.50% | 0% / 0% | 0% / 0% | 2% / 0.1% |
| | 0.75% | 0% / 0% | 2% / 0.2% | 10% / 3.3% |
| | 1.00% | 2% / 0% | 8% / 2.0% | 20% / 11.0% |
(My actual path fits this: 34 trades, +7.35%, not yet passed.)

## 3. What the gap says
1. One month is a trend-month outcome, not a plan. I stop treating it as the target.
2. At 0.5% risk a February-sized edge needs about four months per phase. The goal "both phases in 1-2 months" cannot be met at 0.5% unless the edge is January-sized.
3. I have three levers: a better edge (seven honest attempts, none held), more trades (no second tested setup), or more risk per trade.
   Only risk is in my control today - and risk does not make a rule better, it only makes the same result arrive sooner, in both directions.
4. Breach is not my danger at these sizes (0-2% over two months even with zero edge at 1%). My danger is the opposite: grinding for months on an edge that may be zero.

## 4. TRADING PLAN v2
### Unchanged (no tested improvement exists, so nothing in the rule changes)
- Rule A2 exactly as frozen: 07:00 UTC written call; trend = last 22:00 close vs the close three trading days earlier; 08:00 market order with the trend; 40 pip stop; close 12:00 UTC;
  one trade per weekday; flat by noon and over weekends. No discretionary skips (my one skip cost +1.1R; my "feel" has no measured value).

### Changed
1. Risk per trade: 0.5% -> 0.75% ($187.50 = 0.47 lots x 40 pips), starting with PHASE 2. Phase 1 is $164 from its target; I finish it at 0.5% and change nothing mid-phase.
   Why 0.75% and not 1%: at 0.75% the 2-month requirement (+0.27R, 50% wins) is about what the out-of-sample month delivered (+0.23R, 55%), so the plan no longer needs January to repeat;
   a zero-edge rule still has only ~0.2% breach chance over two months (2% at 1.00%); worst day is -0.75%, worst run of 13 straight full stops has not come close (my worst: 4 losses, -2.17R).
   What it does NOT do: it does not improve the strategy. If the edge is zero, 0.75% just loses 50% faster than 0.5%.
2. Brakes (new, fixed in advance):
   - Account 4% below the phase start (-5.3R at 0.75%): risk back to 0.5% until a new equity high for the phase.
   - Account 6% below the phase start: stop trading for money, full review; restart only with coach approval. This keeps 4% between me and the breach line.
   - Never more than one position, never more than one trade a day, so the daily limit stays unreachable (-0.75% worst case vs -5%).
3. Honest timeline (new): expected 2-4 months for phase 1-type targets on a February-sized edge; phase 2 (+5% = 6.7R at 0.75%) needs +0.33R/trade for one month or +0.17R for two.
4. A kill test for the RULE ITSELF (new; until now only my ideas had kill tests): on the next 40 trades on unseen candles, if A2 averages below +0.10R, I stop trading it for money
   and go back to study with paper trades only. If its max drawdown passes 8R at any point, same.
5. Research rules I now hold myself to (learned from ideas C to T):
   - Hypothesis and kill test committed to git before the first run. Max 3 variants, every one counted in STATE.md.
   - Build on one month, check on the other, one month per command (bt/ab.py, bt/ab_exit.py); never run "all variants on everything".
   - Any idea that comes from replaying particular days is judged with those days removed.
   - February is spent for every idea so far; only unseen months can validate. An improvement is "real" only if it holds on a month it was not built on.
   - Paper tags on live trades (currently F1) cost nothing and build clean evidence; they are not adopted until their own kill test passes.

### Still open (not solved by this plan)
- The idea "tell trend from box before 08:00" is open; variants C1, D1, E1, DE, H1-3, F1, G1, T1-2 are closed.
- More trades per month would close the gap without more risk per trade, but my only other tested setup (B, Asia-range break) trades the same direction in the same hours as A2 -
  it is the same bet twice, not a second edge. Combining them has not been tested and would count as a new variant.
