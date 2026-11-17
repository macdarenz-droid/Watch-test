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

## Hand-check before the run: regression (`python bt/guard_dead_edge.py 2015-05-16 0 0 0.18`)
From a fresh start at +0.18R: own stop 1.6% plain / 0.2% block, lowest balance -6.94% / -6.38%, median payout 32.8% / 34.2% - exactly WS1's figures under
real fills. The new script is the old machinery.

## Results (run once; `python bt/guard_dead_edge.py 2015-06-03 -0.080 1.397`; 2,000 runs x 500 days; plain / block; figures copied from the print)
Start: balance -0.080%, high-water +1.397% of $25,000 (my real state), 106-trade engine list with real fills.
| true edge | account line breached | own 7% stop reached in two years | median day of the stop | still trading after 300 days | lowest balance of any run | result incl. payouts when stopped (median, from today) | median result after 500 days incl. payouts | days at half size (share of all run-days) |
|---|---|---|---|---|---|---|---|---|
| 0.00R (edge gone) | 0.0% / 0.0% | 72.8% / 67.5% | 224 / 235 | 50.8% / 56.6% | -6.88% / -6.69% | -4.85% / -5.06% | -3.38% / -3.07% | 51% / 55% |
| -0.10R | 0.0% / 0.0% | 99.5% / 99.2% | 122 / 125 | 7.6% / 6.7% | -6.85% / -6.77% | -5.58% / -5.58% | -5.58% / -5.58% | 25% / 26% (runs end early) |
| +0.10R (small real edge) | 0.0% / 0.0% | 15.1% / 10.8% | 253 / 263 | 91.0% / 93.7% | -6.65% / -6.49% | -1.47% / -0.89% | +13.01% / +13.30% | 58% / 58% |
| +0.18R (planning edge, bridge to WS) | 0.0% / 0.0% | 1.8% / 0.8% | 252 / 255 | 98.9% / 99.6% | -5.99% / -6.26% | +4.81% / +3.82% | +32.67% / +33.32% | 39% / 35% |
(The half-size share was computed in the run but not printed; I added the print and re-ran with the same seeds: every other figure identical.)

## Kill lines
| line | worked prediction | result | verdict |
|---|---|---|---|
| K1 safety at 0.00R and -0.10R: breached <= 1.0%, no run below -9% | floor above -7.77% | 0.0% breached; lowest -6.88% | PASS |
| K2 a -0.10R rule is stopped within 500 days in >= 90% | about 96% | 99.2% | PASS |
| K3 at +0.10R still trading after 300 days in >= 85% | stopped about 3% (understated) | 91.0% still trading (plain) | PASS |
| K4 (reported): at exactly 0.00R | stopped about 42% | stopped 67.5% to 72.8%, median day about 230, half size on about half of all days | - |
VERDICT: the claim "the guard is a real safety rule and a fair one" SURVIVES its three lines. Nothing changes; no tag.

## Worked table against the run (more than 5 points apart -> reason before the verdict)
- -0.10R: 96% worked, 99% run. +0.10R at 300 days: 3% stopped worked, 6% to 9% run. Close, and on the side I said the formula errs.
- 0.00R: 42% worked, 68-73% run: 26 to 31 points apart. Reason, found before the verdict: my formula used a FIXED barrier 7% under today's high-water.
  The real stop TRAILS: every new high in a run lifts it. With no drift a path wanders up as easily as down, and each wander up drags the stop
  after it, so the stop is met far more often. (Real fills also take 0.015R a trade off a zero edge.) I flagged the formula's weakness for positive edges
  only; it is largest at zero. A prediction that missed with its reason found - not a figure corrected after a push. June count stays 0.

## What it means, said plainly (in money, python: 1% of $25,000 = $250)
- If the edge is GONE: the guard never lets the account near the firm's line (lowest -6.9% of $25,000 in 8,000 runs). In about 7 runs of 10 it stops me
  within two years, typically after about 230 trading days, with the account about 5% ($1,200 to $1,300) lower than today, payouts counted. In the
  other 3 runs I am still trading a dead rule after two years, about 3% down, half the time at half size. Slow, cheap, and safe.
- If the rule is clearly BAD (-0.10R): it is stopped in 99% of runs, half of them within six months (day 122), at a cost of about 5.6% (about $1,400).
- If the edge is SMALL BUT REAL (+0.10R): 9 runs in 10 are still trading after 300 days - enough lived trades to judge, which is what the coach asked
  of the guard - and the median two-year result is about +13% with payouts. One run in seven to nine is stopped wrongly.
- If the edge is the planning edge: stopped wrongly in 1-2% of runs.
- So the guard does what the alarm could not: it does not need to KNOW whether the edge is there. It caps what a dead edge can cost at about 5-6% of the
  account and lets a live one run. The price is time: a dead edge takes most of a year to be stopped. That is the trade-off I am living in, with numbers on it.
- One honest caveat: 500 days of reshuffled trades are not two real years; real bad stretches cluster more than 5-trade blocks.
## What I do
Nothing changes: 0.50%, half size at 3% under the high-water, stop at 7% under (hold to funded day 55, then the review, which gets this table).
Counts: ideas 72, variants 201 (G0 Gm Gs; the +0.18R line is the regression). Adopted trading ideas: 0. On paper: UN3, PH2, MB1. June corrections after a push: 0.
