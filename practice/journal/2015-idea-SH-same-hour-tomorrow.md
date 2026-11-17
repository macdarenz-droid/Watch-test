# Idea SH: does each London hour repeat yesterday's same hour? (idea 146; coach 08-26: next backtest). Written Wed 2015-08-26 22:00 London, before any count.
Searched ("same hour", "hour of the day", "seasonal", "time of day"): nothing. WM (07-07) compared 4-hour windows by A2's side; MH studied
big hours; none asked whether an hour's direction repeats the next day at the same clock time.
Background, no source I can cite: some flows (fixes, scheduled hedging) recur at the same clock time.

## Frequency check, on paper first
Several trades a day (up to nine hours, 08:00-17:00), so the 120 line applies; the count decides.

## Hypothesis
The move of the London hour H yesterday predicts the same hour H today, in the same direction.

## Rule (London time; hours starting 08:00, 09:00, ..., 16:00; each hour is its own trade, they do not overlap)
Yesterday's move in hour H = open of H+1 minus open of H, yesterday. If |move| >= X pips: at today's H open, market order in that direction,
stop 20, out at H+1 (one hour).
## Order of work: step 1 counts only for X = 5, 10, 15. Step 2: X = the LARGEST grid value with 120+ trades and 50+ from 04-07; none ->
killed for sample. Step 3 one run.
THE THREE VARIANTS (named now): SH1 (judged) the chosen X; SH2 (dose) the next larger X (or 20 if the chosen is 15); SH0 (control) SH1's
signals traded the other way.
## KILL LINES (four, all must pass, for SH1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 SH1's average R >= +0.10R.
K2 SH1's net R above zero BOTH before 04-07 AND from 04-07.
K3 SH1's average R at stressed costs above zero.
K4 SH1 minus SH0, trade by trade, above zero with sign-flip p < 0.05.
My guess: a coin minus costs (-0.06R).
