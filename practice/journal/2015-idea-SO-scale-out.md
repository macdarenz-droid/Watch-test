# Scale-out: bank half at a target, let the rest run to noon? HYPOTHESIS AND KILL TEST WRITTEN FIRST (nothing has been run)
Clock Fri 2015-04-03 22:00 London (weekend; end of released data). January only for the build (explicit end date 2015-02-01); costs on; London time.

## Where it comes from
A funded account wants a steady curve more than a big one. I have tested every all-or-nothing exit (target, break-even, trail, runner, clock). The one management rule I have
never tested is the one beginners are told first: take HALF off when the trade has paid 1R, and let the other half run. It is not from a best/worst review; the feature it
relies on (trades reaching +1R before noon) exists on every trade: about a third of all my trades finish at +1R or more.

## Hypothesis
Banking half the position at a fixed profit lowers the variance of each trade's result, so the equity curve has a shallower drawdown per unit of profit, without giving up
more than a little of the total. Counter-case (what X3 and TR showed for all-or-nothing versions): the profit lives in the days that run 60-170 pips; halving them costs more
than the smoothing is worth, and drawdowns are made of trades that never reach the target at all, so nothing gets shallower.

## Variants (78, 79, 80; ideas -> 31), no others afterwards. Entry, direction, 40 pip stop, $125 total risk and the 12:00 London exit exactly A2; the position is two equal halves.
- SO40: first half takes profit at +40 pips (+1R); second half runs to noon.
- SO20: first half takes profit at +20 pips (+0.5R); second half runs to noon.
- SO40BE: as SO40, and when the first half is banked the stop of the second half moves to the entry price.
Results are counted per DAY (both halves together), in R of the $125.

## KILL TEST (explicit). Same-trade comparison; judged on drawdown as well as R (score = net R / max drawdown), like my other exit tests.
Build (January, 19 trade days) - a variant survives only if BOTH:
  B1. score >= 1.25 x A2's score;
  B2. net R >= 95% of A2's net R.
No survivor -> closed. A survivor is NOT adopted and NOT checked on February or March (both already seen): by my sample-size rule it earns only a forward paper tag, judged after
100 forward trades (average at least +0.10R per trade better, or the same R with a drawdown at most 70% of A2's, at two standard errors).
My guess: all three keep roughly 75-90% of January's net R with the same drawdown (1.34R), so B2 fails and nothing survives.
