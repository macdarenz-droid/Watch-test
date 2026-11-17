# Idea FH: does the 07:00-08:00 London hour carry on the night's move? (idea 143; coach 08-24: next backtest)
Written Mon 2015-08-24 22:00 London, before any count or outcome.
Searched ("07:00-08:00", "frankfurt", "earlier entry"): the hour was used as A2's EARLIER ENTRY (ET, A2's 3-day direction, killed), as a
feature (PH2 range, LM direction for the 08:00-12:00 trade, NC). Never traded on its own with the NIGHT's direction. Not GC/GC2 (those faded
the night through 08:00-12:00 and were killed for sample, outcomes unseen; FH trades only the hour 07:00-08:00, with the night).
Background, no source I can cite: continental European dealers start about an hour before London's 08:00.

## Hypothesis
A clear night move (00:00-07:00) carries on in the 07:00-08:00 hour as Europe arrives.
Against it: entering after a move has happened lost at every scale I tested (TH, RS0, FX0, LM1); and costs are heavy on a one-hour trade.

## Rule (London time, one trade a day)
Night move = open of the 07:00 candle minus open of the 00:00 candle. If |move| >= N pips: at 07:00 market order WITH it, stop 20, out 08:00.
## Order of work: step 1 counts only for N = 10, 20, 30 (and the share on A2's side). Step 2: N = the LARGEST grid value with 80+ trades and
35+ from 04-07 (once-a-day line); none -> killed for sample. 70%+ on A2's side or opposite -> killed as A2 in disguise. Step 3 one run.
THE THREE VARIANTS (named now): FH1 (judged) the chosen N; FH2 (dose) the next larger N (or 40 if the chosen is 30); FH0 (control) FH1's days faded.
Power (once-a-day): about +-0.2R on the average at 80-120 trades; a no-edge rule clears +0.10R about one time in four. ANY PASS IS PROVISIONAL.
## KILL LINES (four, all must pass, for FH1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 FH1's average R >= +0.10R.
K2 FH1's net R above zero BOTH before 04-07 AND from 04-07.
K3 FH1's average R at stressed costs above zero.
K4 FH1 minus FH0, trade by trade, above zero with sign-flip p < 0.10.
My guess: negative, like every follow-after-a-move rule.
