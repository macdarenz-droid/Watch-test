# Idea YM: the 08:00 price against yesterday's midpoint as the morning's direction (idea 147; coach 08-27: next backtest)
Written Thu 2015-08-27 22:00 London, before any count or outcome.
FREQUENCY CHECK FIRST (plan rule): the 08:00 price is above or below yesterday's midpoint on every day, so YM1 trades about 100% of days
(~160 on this history). The variant with a distance filter must still reach 80.
Searched ("midpoint", "yesterday's mid", "half of yesterday"): C1 (February) used a midpoint FILTER on A2 (failed); H (January) skipped A2 in
the far part of yesterday's range ("no chase", killed). Never: the midpoint as a direction of its own, with no 3-day signal.
Disguise risk is high (above yesterday's middle often means up over the last days, like A2): counted before any outcome; 70%+ either way -> killed.

## Hypothesis
Above yesterday's midpoint at the bell, buyers hold the balance and the morning rises (below: falls). Background, no source I can cite.
Against it: following has lost after 04-07 in almost every form I tested.

## Rule (London time, one trade a day)
Mid = (yesterday's London-day high + low) / 2. At 08:00: open above mid -> BUY, below -> SELL. Stop 40, out 12:00 (A2's frame).
THE THREE VARIANTS (named now): YM1 (judged) every day; YM2 (dose) only when |08:00 open - mid| >= 25% of yesterday's range (it must keep 80+
trades, else reported as too small); YM0 (control) YM1's days traded the other way.
Power (once-a-day): about +-0.17R on ~160 trades; a no-edge rule clears +0.10R about one time in eight. ANY PASS IS PROVISIONAL.
## KILL LINES (four, all must pass, for YM1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 YM1's average R >= +0.10R.
K2 YM1's net R above zero BOTH before 04-07 AND from 04-07.
K3 YM1's average R at stressed costs above zero.
K4 YM1 minus YM0, trade by trade, above zero with sign-flip p < 0.10.
My guess: mostly A2's direction (killed as disguise), or the usual split.
