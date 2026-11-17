# Idea UD: follow the 13:30 London candle (idea 139; coach 08-18: next backtest). Written Tue 2015-08-18 22:00 London, before any count or outcome.
Searched "13:30": AF (13:30 in the 3-DAY direction, killed) and "D: follow a 40+ pip 13:30 candle (12 days)", written down in June and never
tested (too few). UD is D with the threshold chosen from counts, so it can be judged. Not AF (direction from the candle, not from 3 days).
Background, no source I can cite: US economic figures are commonly published at 13:30 London time in summer, so the 13:30 candle often
carries news. The test does not depend on that being true.

## Hypothesis
A clear move in the 13:30-13:45 London M15 candle carries on for the next two hours (news is digested in its own direction).
Against it: every short-burst chase I have tested lost about 0.2R (LM1, FX0, SF0 about zero).

## Rule (London time, one trade a day)
Candle move = close minus open of the 13:30 M15 candle (built from M5). If |move| >= X pips: at 13:45 market order WITH it, stop 25 pips,
out 15:45.
## Order of work: step 1 counts only for X = 5, 10, 15. Step 2: X = the LARGEST grid value with 80+ trades and 35+ from 04-07 (once-a-day
line); none -> killed for sample. Step 3 one run.
THE THREE VARIANTS (named now): UD1 (judged) the chosen X; UD2 (dose) the next larger X (or 20 if the chosen is 15); UD0 (control) UD1's days faded.
Power, stated up front (once-a-day, plan section 9): at 80-120 trades about +-0.18R to +-0.22R on the average; a no-edge rule clears +0.10R
about one time in four. ANY PASS IS PROVISIONAL.
## Kill lines (four, all must pass, for UD1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 average >= +0.10R. K2 net above zero before 04-07 AND from 04-07. K3 stressed average above zero. K4 UD1 minus UD0 above zero, sign-flip p < 0.10.
Worked case read from its own window's candles. My guess: the chase loses, like every burst; K1 fails.
