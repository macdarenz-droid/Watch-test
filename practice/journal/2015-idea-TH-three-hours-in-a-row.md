# Idea TH: three hourly candles in a row the same way (idea 140; coach 08-19: next backtest). Written Wed 2015-08-19 22:00 London, before any count or outcome.
Searched ("in a row", "consecutive", "three hours"): only losing-streak statistics, never a run of same-direction hours as a setup.
Not EN/IB/PN (single-candle shapes) and not SF (one sharp 15-minute candle): TH is a steady run over three hours.

## Hypothesis
Three hourly candles closing the same way with a clear total move show steady pressure, not a burst; the next two hours carry on.
Against it: since April moves come back (MC, AR), and every follow rule lost after 04-07.

## Rule (London time; H1 candles; the third candle ends between 08:00 and 16:00; one position at a time)
Run = three consecutive H1 candles all closing up (or all down), and the move from the first one's open to the third one's close >= M pips.
Entry at the next H1 open WITH the run, stop 20, out 2 hours after entry.
## Order of work: step 1 counts only for M = 15, 25, 35. Step 2: M = the LARGEST grid value with 120+ trades and 50+ from 04-07
(several-a-week line); none -> killed for sample. Step 3 one run.
THE THREE VARIANTS (named now): TH1 (judged) the chosen M; TH2 (dose) the next larger M (or 45 if the chosen is 35); TH0 (control) TH1's
signals faded.
## KILL LINES (four, all must pass, for TH1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 TH1's average R >= +0.10R.
K2 TH1's net R above zero BOTH before 04-07 AND from 04-07.
K3 TH1's average R at stressed costs above zero.
K4 TH1 minus TH0, trade by trade, above zero with sign-flip p < 0.05.
My guess: positive before 04-07, negative after (K2 fails).
