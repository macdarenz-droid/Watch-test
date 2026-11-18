# Idea LR: is A2's current run inside normal? (idea 105; coach 07-15; a risk test, not a setup)
Written Wed 2015-07-15 22:00 London, before any code.

## Question
How often does a healthy A2 lose 5 in a row and 10 in a row, what is its normal worst drawdown, and is what A2 has done since 04-07
(lived + paper, engine list, to 07-15) inside that?

## Method (fixed now)
- "Healthy A2" = the engine's A2 trades 01-05..04-06, the rule as I adopted it. Loss = R below zero.
- 20,000 resamples (with replacement, each trade independent) of as many trades as the window 04-07..07-15 holds.
- For each: longest losing run, number of separate runs of 5+, any run of 10+, max drawdown in R.
- Second reference, for honesty: the same with ALL trades 01-05..07-15 as the pool (it contains the bad stretch, so it is the soft test).
Two variants, no more. Limits written now: resampling single trades ignores that losses may come in clumps, so the real odds of long
runs are somewhat higher than the table says; and "healthy A2" is only about 65 trades.

## Kill line (what "warning" means), before the numbers
Observed = longest losing run and max drawdown of the real window 04-07..07-15.
- If under healthy A2 fewer than 5% of resamples reach the observed drawdown OR fewer than 5% reach the observed longest run:
  WARNING SIGN: the run is not healthy A2 having bad luck. Then A2 stays on paper exactly as the return rule says; no softening.
- If both are 5% or more: INSIDE NORMAL. Even then nothing changes before 09-21: the return rule is written and I do not edit rules off one test.
My guess: the drawdown is outside (well under 5%), the longest run (7) is borderline.
Worked case to check first: my journal says 7 losses in a row to 06-30; the tool's longest run in the window must show 7 or more.

## Facts and worked case (tool `python bt/losing_runs.py 2015-07-16 facts`, before the resampling)
Healthy pool 65 trades (01-06..04-06). Window 72 trades (04-07..07-15). Losing runs in the window, in order: 2 1 1 6 1 2 2 3 1 2 1 5 7 1 4 4.
The 7 is there (06-19..06-29), as my journal says. Current run at the end: 4 losses (07-10, 07-13, 07-14, 07-15).

## Result (one run)
Tool: `python bt/losing_runs.py 2015-07-16 test` (20,000 resamples each).
OBSERVED, window 04-07..07-15, 72 engine trades (lived + paper): avg -0.081R, 60% losses, longest run 7, three runs of 5+, max drawdown 11.34R.
(11.34R is the engine list incl. the 6 paper days, measured from the window's peak; the alarm's 8.08R was the lived list on 07-07.)
| reference pool | run of 5+ per 100 trades | run of 10+ per 100 | normal max drawdown per 100 (median / 95% under) | window: run >= 7 | window: 3 runs of 5+ | window: drawdown >= 11.34R |
|---|---|---|---|---|---|---|
| healthy A2 (65 trades, +0.492R, 32% losses) | 20.4% | 0.10% | 2.58R / 4.53R | 1.54% | 0.03% | 0.00% (none in 20,000) |
| all trades (137, +0.191R, 47% losses) - soft test | 71.1% | 2.19% | 5.93R / 11.29R | 15.96% | 3.89% | 2.92% |

**VERDICT BY THE LINE WRITTEN FIRST: WARNING SIGN.** Under healthy A2 the drawdown never appears and a 7-run appears in 1.5% of cases.
Even the soft pool, which contains the bad stretch itself, gives this drawdown under 3% of the time.
What it means: 1. This is not healthy A2 having bad luck; it is a different A2 (60% losses against 32%). Same answer as RG, by another road.
2. For a healthy A2 a 5-loss run is ordinary (1 in 5 per 100 trades), a 10-loss run is not (1 in 1,000): the 8R alarm was the right size.
3. Nothing changes: A2 stays on paper, route A stays as written (not before 09-21, monitor >= +0.30R). The current paper run of 4 is
itself ordinary; the warning is the whole window, not these four days.
Limit: resamples treat trades as independent; clumping would make long runs a little more likely. It cannot turn 0 in 20,000 into normal.
Counts: idea 105; variants 293-294.
