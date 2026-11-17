# Idea ND: the day after a narrow day breaks out (idea 144; coach 08-25: next backtest). Written Tue 2015-08-25 22:00 London, before any count or outcome.
Searched ("narrow", "nr4", "inside day", "small day", "quiet day"): BS used "nr4" as one FEATURE of A2's best days (killed); QW tested weeks
(quiet week -> next week, killed); BK traded the night-box break the day after a BIG day. Never: the break of a NARROW day's own range the next day.

## Hypothesis
A narrow London day is a pause; the next day's first break of that day's high or low starts a move that carries on.
Against it: MB2 (afternoon break of the morning range) and BK (night box after a big day) both lost: breaks did not carry past the stop.
And my findings say entering after a move loses; here the entry is at the break of a level, not after a long run, so it is a fair new question.

## Rule (London time, one trade a day)
Narrow = yesterday's London-day range (22:00 -> 22:00) <= Q x the median of the 10 London-day ranges before it.
Today, 08:00-16:00: the first M5 candle that CLOSES beyond yesterday's high (low) -> market order at the next M5 open in that direction,
stop 30, out 20:00.
## Order of work: step 1 counts only for Q = 0.7, 0.8, 0.9. Step 2: Q = the SMALLEST (narrowest) grid value with 80+ trades and 35+ from
04-07 (once-a-day line); none -> killed for sample. Step 3 one run.
THE THREE VARIANTS (named now): ND1 (judged) the chosen Q; ND2 (dose) the next smaller Q (or 0.6 if the chosen is 0.7); ND0 (control) ND1's
signals faded.
Power (once-a-day): about +-0.2R at 80-120 trades; a no-edge rule clears +0.10R about one time in four. ANY PASS IS PROVISIONAL.
## KILL LINES (four, all must pass, for ND1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 ND1's average R >= +0.10R.
K2 ND1's net R above zero BOTH before 04-07 AND from 04-07.
K3 ND1's average R at stressed costs above zero.
K4 ND1 minus ND0, trade by trade, above zero with sign-flip p < 0.10.
My guess: positive before 04-07, negative after (K2 fails), like MB2.
