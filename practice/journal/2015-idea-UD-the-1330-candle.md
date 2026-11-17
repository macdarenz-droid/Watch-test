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

## Step 1, counts only (tool `python bt/candle_1330.py 2015-08-19 count`)
162 days; median |13:30 candle move| 9.1 pips. X = 5: 123 days (51 before 04-07, 72 from). X = 10: 76 (30 / 46). X = 15: 50 (18 / 32).
## Step 2: largest X with 80+ and 35+ from 04-07 = **X = 5** (123 / 72). UD1 = 5, UD2 = 10, UD0 = fade at 5.
Worked cases read from their own windows (R after costs 1.0 + 0.1):
- Tue 08-18: candle -29.1 -> UD1 SELLS at 13:45 (bid 1.10324), stop 25 above (about 1.10574 on the ask). The window's high 1.10467 (+1 pip
  spread) stays under it; out at the 15:45 open 1.10446 + spread: about -13 pips = about -0.53R.
- Mon 08-17: candle +16.8 -> UD1 BUYS at 13:45 (ask about 1.11171), stop about 1.10921. The window's low 1.10770 is below it: a full stop, about -1.0R.

## Step 3, result (one run: `test 5 10`)
Tool: `python bt/candle_1330.py 2015-08-19 test 5 10`. Hand checks: 08-18 follow -0.54R (worked: about -0.53R); 08-17 follow stopped -1.05R (worked: full stop). Both as written.
| variant (R after costs: spread 1.0 + slippage 0.1 pips; stressed 2.0 + 0.5) | trades | wins | avg R | net | stops | before 04-07 | from 04-07 | stressed avg |
|---|---|---|---|---|---|---|---|---|
| UD1 follow the 13:30 candle, |move| >= 5 (JUDGED) | 123 | 41% | -0.130 (+-0.21) | -15.95 | 59 | -0.28 | -15.68 | -0.204 |
| UD2 follow, |move| >= 10 | 76 | 43% | -0.041 (+-0.29) | -3.15 | 36 | +8.62 | -11.77 | -0.105 |
| UD0 fade, |move| >= 5 (control) | 123 | 38% | -0.083 (+-0.23) | -10.21 | 59 | +2.78 | -13.00 | -0.150 |
UD1 minus UD0 -0.047R (sign-flip p 0.80). UD1: all four kill lines FAIL. **UD IS KILLED.**
What I learned: after the 13:30 candle, neither following nor fading pays; both lose, almost all of it after 04-07. The afternoon after the
US-figures minute is a coin with a 25-pip stop that costs the spread. The June note "D" can be crossed off.
Counts: idea 139; variants 371-373; second setups tried 34, none alive.
