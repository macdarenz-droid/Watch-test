# Idea RS: the hourly RSI at an extreme (idea 142; coach 08-21: next backtest). Written Fri 2015-08-21 22:00 London (weekend), before any count or outcome.
Searched ("rsi", "oscillator", "overbought", "oversold", "stochastic"): the only hits are the letters inside other words. First oscillator in 142 ideas.

## Definition, said exactly (no library; my own code)
RSI(14) on H1 closes, SIMPLE averages (the 14-hour mean of up-moves and of down-moves; this is the "simple" form, not Wilder's smoothed form):
RSI = 100 - 100 / (1 + mean gain / mean loss).

## Hypothesis
The beginner's reading: an hourly RSI under L (over 100 - L) means the price has fallen (risen) too far too fast and bounces.
Against it: TH showed the price "simply stops" after a 3-hour run (the fade broke even); bursts are not reversed for profit after costs.

## Rule (London time; signal candles 07:00-16:00; one position at a time)
Long when the RSI closes below L after being at or above L the hour before; short when it closes above 100 - L after being at or below it.
Entry at the next H1 open, stop 20, out 3 hours after entry.
## Order of work: step 1 counts only for L = 30, 25, 20. Step 2: L = the MOST EXTREME grid value (lowest L) with 120+ trades and 50+ from
04-07 (several-a-week line); none -> killed for sample. Step 3 one run.
THE THREE VARIANTS (named now): RS1 (judged) the chosen L; RS2 (dose) the next more extreme L on the grid (or 15 if the chosen is 20);
RS0 (control) RS1's signals traded the other way (with the move).
## KILL LINES (four, all must pass, for RS1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 RS1's average R >= +0.10R.
K2 RS1's net R above zero BOTH before 04-07 AND from 04-07.
K3 RS1's average R at stressed costs above zero.
K4 RS1 minus RS0, trade by trade, above zero with sign-flip p < 0.05.
My guess: about zero before costs, so negative after: K1 fails.
