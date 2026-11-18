# Idea FM: fade the first 45 minutes of London (idea 152; coach 09-02). Written Wed 2015-09-02 22:00 London, before any count or outcome.
Source: journal/2015-09-02-three-hypotheses-from-two-months.md (H2), from my own walk notes of 08-28 and 09-01 and W33.
EXPECTED SAMPLE FIRST: the 08:00 -> 08:45 move is >= X pips on about 40-50% of days at X = 20 -> ~70-85 trades; may fail 80.
Rule for X (written now): counts at X = 15 / 20 / 25; X = the LARGEST giving 80+ trades with 35+ from 04-07; none -> killed for sample.
DISGUISE line: FM1 on A2's side 70%+ (or 30%- , i.e. always against A2) -> reported; 70%+ either way -> killed (it would just be A2 or anti-A2).

## Hypothesis
The first 45 minutes of London sweep the stops above/below the night; the sweep reverses toward the open by noon. Background, no source.
Against it: TH/RS/UD showed entering after a move loses only for FOLLOWERS (fades of short bursts were coins: SF, FX, MF).

## Rule (London time)
move = M5 close of the 08:40 candle minus the 08:00 open (bid). If |move| >= X: at the 08:45 open trade AGAINST it; stop 25 pips; out 12:00.
THE THREE VARIANTS (named now): FM1 (judged) X chosen; FM2 (dose) the next larger X (30 if the chosen is 25); FM0 (control) FM1's days WITH the move.
Power (once-a-day): about +-0.22R on ~80 trades; no-edge clears +0.10R about one time in four. ANY PASS IS PROVISIONAL.
## KILL LINES (four, all must pass, for FM1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 FM1's average R >= +0.10R.
K2 FM1's net R above zero BOTH before 04-07 AND from 04-07.
K3 FM1's average R at stressed costs above zero.
K4 FM1 minus FM0, trade by trade, above zero with sign-flip p < 0.10.
My guess: a coin, like SF/FX/MF; the two mornings that gave me the idea are 2 trades.

## Counts (before outcomes; tool output pasted by this same command)
    days 174 (2015-01-02..2015-09-02) | median |move| 13.3 pips
    X = 15: 83 trades | before 2015-04-07: 25 | from: 58 | buys 48 sells 35 | fade on A2's side: 42 of 83
    X = 20: 60 trades | before 2015-04-07: 17 | from: 43 | buys 36 sells 24 | fade on A2's side: 31 of 60
    X = 25: 42 trades | before 2015-04-07: 12 | from: 30 | buys 26 sells 16 | fade on A2's side: 19 of 42
    X = 30: 31 trades | before 2015-04-07: 10 | from: 21 | buys 17 sells 14 | fade on A2's side: 12 of 31
BY THE RULE WRITTEN FIRST: X = 15 (largest with 80+ and 35+ from 04-07; X = 20 has 60). FM1 = 15, FM2 = 20 (60 trades, dose only),
FM0 = with the move at 15. DISGUISE: the fade is on A2's side 42 of 83 (51%) -> passes.
My expected share was wrong: I guessed 40-50% of days at X = 20; the tool says 60 of 174 (34%). Noted, not acted on.
Before 04-07 FM1 has only 25 trades: K2's first half rests on them.
Worked case 09-01 (tool check line, matches my walk: 08:00 open about 1.1283, 08:30 London candle closes about 1.1318):
    day                    2015-09-01
    move                         35.1
    side                           -1
    t0      2015-09-01 08:45:00+00:00
    late                         True
    a2                             -1
-> the first 45 minutes ran +35.1 pips -> FM1 and FM2 SELL at the 08:45 open (A2 also sold that day).
One run next: `python bt/first45.py 2015-09-03 run 15 20`.

## Result (one run; ALL R AFTER COSTS spread 1.0 + slippage 0.1; stressed 2.0 + 0.5) - tool output pasted by this command
    FM1 fade, |move| >= 15.0: trades 83 | wins 43% | avg -0.053R (+-0.26) | net -4.44 | stops 39 | before 2015-04-07: -4.16 | from: -0.28 | stressed avg -0.140 | on A2's side 51%
    FM2 fade, |move| >= 20.0: trades 60 | wins 42% | avg -0.100R (+-0.29) | net -6.00 | stops 28 | before 2015-04-07: -2.75 | from: -3.25 | stressed avg -0.165 | on A2's side 52%
    FM0 with the move, >= 15.0 (control): trades 83 | wins 46% | avg +0.109R (+-0.29) | net +9.06 | stops 35 | before 2015-04-07: +7.88 | from: +1.18 | stressed avg +0.046 | on A2's side 49%
    (R after costs 1.0 + 0.1; stressed 2.0 + 0.5) FM1 minus FM0 -0.163R, sign-flip p 0.5154
    KILL LINES FM1: K1 FAIL | K2 FAIL | K3 FAIL | K4 FAIL
Kill lines, each value against its threshold (FM1), read from the lines above:
K1 average R >= +0.10R: FM1 avg -0.053R -> FAIL.
K2 net above zero before AND from 04-07: -4.16R / -0.28R -> FAIL.
K3 stressed average above zero: -0.140R -> FAIL.
K4 FM1 minus FM0 above zero with p < 0.10: -0.163R, p 0.515 -> FAIL.
VERDICT: KILLED on all four (idea 152; variants FM1 FM2 FM0 counted). The dose (FM2, bigger first moves) is worse, not better.
The control (FOLLOW the first 45 minutes) printed +0.109R, but +7.88R of its +9.06R is before 04-07 and it is the mirror of a killed idea
on the same data: NOT promoted, not tested further (coach: no mirror on the same data). My two mornings (08-28, 09-01) were the exception.
