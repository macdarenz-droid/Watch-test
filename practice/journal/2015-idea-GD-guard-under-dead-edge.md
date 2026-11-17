# Idea GD (idea 72): the money guard when the edge is gone or small - PRE-REGISTRATION with worked cases (pushed before the script is written or run)
Sim clock Wed 2015-06-03 01:00 London. END 2015-06-03. June goal: each kill line carries a worked prediction from a python line run before this push.
## Why this test
- Coach 06-02: "don't decide from the alarm alone; keep A2 at the planned size, use the drawdown/breach guard as the real safety rule, and judge the edge
  after a few hundred lived trades over 2-3 years." So everything now rests on the guard: half size from 3% under the high-water, stop trading at 7% under.
- I tested that guard (TS, WS) only at my planning edge. In WS I wrote: "NOT tested: the case where my edge is gone (zero edge). There a wider stop simply
  loses 2% more." That untested case is exactly the one the guard is for. This test closes the gap; it proposes no change to the guard.
## What is simulated (bt/guard_dead_edge.py; the machinery of WS: engine A2 list, real-fill extras on full stops, payout rule, corrected high-water)
Start from my REAL state today: balance -0.080% and high-water +1.397% of $25,000 (tracker $24,979.93 and $25,349.14): 1.477% under the high-water, full size.
2,000 runs, plain and 5-trade-block reshuffles, 500 trading days (two years), true edge of the list shifted to:
- G0: 0.00R (edge gone). Gm: -0.10R. Gs: +0.10R (a small real edge). And +0.18R beside as the bridge to WS (reported).
## Hand-check BEFORE the run (regression): from a fresh start (balance 0, high-water 0), edge +0.18R, END 2015-05-16, the script must print WS1's
figures under real fills: own stop 1.6% plain / 0.2% block. Anything else = a bug; stop.
## WORKED PREDICTIONS (python, a fixed-barrier formula; said plainly: it ignores that the high-water can rise and that size is full again above the 3%
line, so for positive edges it UNDERSTATES the stop odds - WS's 1.6% against the formula's 0% shows by how much)
Distance to the stop from today: 1.52% to the half-size line at full size (2.9 daily sds) + 4.00% at half size (15.2 sds) = 18.1 sd units.
| true edge | horizon | worked: own stop reached |
|---|---|---|
| 0.00R | 500 days | about 42% |
| -0.10R | 500 days | about 96% |
| +0.10R | 300 days | about 3% |
| +0.18R | 500 days | about 0% (formula); WS from a fresh start 1.6% |
## Kill lines for the claim "the guard is a real safety rule and a fair one" (worse of plain and block)
- K1 SAFETY: at 0.00R and at -0.10R the account line (-10%) is breached in at most 1.0% of runs and no run ends below -9%.
  [worked: the floor of WS is -7.77% from a high-water at zero; my high-water is +1.397%, so the lowest reachable is higher still -> expect PASS]
- K2 IT ACTS ON A DEAD RULE: at -0.10R the guard stops me within 500 days in at least 90% of runs.   [worked: about 96% -> expect PASS]
- K3 IT IS FAIR TO A LIVE ONE: at +0.10R I am still trading after 300 days in at least 85% of runs.   [worked: stopped about 3%, an understatement -> expect PASS, less comfortably]
- K4 reported, NOT a kill line (I do not know what the right number is): at exactly 0.00R, how often the guard stops me in two years [worked: about 42%],
  the median day it happens, the share of days at half size, and what the account has lost by then.
## Consequences, written now
- If K1 fails: the guard is not safe; I tell the coach the same hour and propose the old 5% line back.
- If K2 or K3 fails: the guard stays (it is the coach's rule and my 20-day hold runs to funded day 55); the numbers go to the review after day 55.
- No trading rule or size changes by this test.
My guess = the worked table, with the stated lean that positive-edge stop odds will come out higher than the formula.
