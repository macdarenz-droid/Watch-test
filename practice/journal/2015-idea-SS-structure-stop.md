# Structure stop: behind the night's extreme instead of a fixed 40 pips? KILL LINES WRITTEN FIRST (nothing has been run)
Clock Fri 2015-04-03 22:00 London (weekend). January only for the build (end date 2015-02-01 given explicitly); costs on; London time. Sample-size rule: journal/2015-sample-size-rule.md.

## Where it comes from
Support and resistance was on my beginner's list in week 1. I have tested stops that are tighter (30), wider (50-80), volatility-scaled, break-even and trailing - every one a
number of pips. I have never tested the stop a chart-reader would use: just beyond the level that would prove the idea wrong - the low of the night for a buy, the high for a sell.
Method-rule check: not a "best N vs worst N" idea; the levels exist on every day.

## Hypothesis
A stop placed just beyond the night's extreme sits where the market has already refused to go, so it is hit less often than a fixed 40 pip stop at the same dollar risk,
giving more net R per unit of drawdown without giving up profit. Counter-case: on most days that level is either so close that noise takes it or so far that the position is small
and every winner is paid in fewer R - which is what the fixed-width tests (S, E, V) already hinted.

## Variants (75, 76, 77; ideas -> 30), no others afterwards. Entry, direction, noon exit and the $125 at the stop exactly A2 (size = $125 / stop distance).
- SS-asia: stop 5 pips beyond the Asia-session extreme (00:00-07:00 London) on the losing side, distance limited to 20-60 pips.
- SS-h7: stop 5 pips beyond the extreme of the 07:00-08:00 hour on the losing side, limited to 15-60 pips.
- SS-night: stop 5 pips beyond the extreme of the whole night (00:00-08:00), limited to 20-60 pips.

## KILL LINES (explicit). Same-trade comparison, judged on drawdown as well as R (score = net R / max drawdown), as for my other stop tests.
Build (January, 19 trades) - a variant survives only if BOTH:
  B1. score >= 1.25 x A2's score;
  B2. net R >= 95% of A2's net R.
  No survivor -> closed. A survivor is NOT trusted and NOT checked on February or March (both seen): under my sample-size rule it earns only a forward paper tag, to be judged after
  100 forward trades (average improvement at least +0.10R per trade and two standard errors).
My guess: no survivor. The night's extreme is usually 15-35 pips away, so these behave like the tighter stop on most days.
