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
