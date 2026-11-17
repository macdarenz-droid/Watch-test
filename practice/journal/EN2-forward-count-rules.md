# EN2 FORWARD COUNT - its own idea, judged only on lived days (idea 133; coach 08-13: "EN2 is a hint not a result: if you want it, prereg
# it as its own idea and let lived days judge it"). Written Thu 2015-08-13 22:00 London, before any day it will be judged on.

WHAT IS FROZEN (exactly EN2 of 08-12, bt/engulfing.py signals(strong=True), not one character changed):
H1 candles, London time; signal candle 07:00-16:00 on a weekday; bullish engulfing = previous H1 closed down, this one closed up, its body
covers the previous body; bearish the mirror; AND this candle's range >= 1.5 x the previous candle's range. Entry at the next H1 open in the
engulfing's direction, stop 20 pips, out 2 hours after entry, one position at a time. Costs 1.0 + 0.1 pips. $125 = 1R. Paper only, no order.

WHAT I KNOW AND WHAT I DO NOT: EN2 made +0.182R on 116 trades 01-05..08-12 (+13.27R before 04-07, +7.84R after), but it was the DOSE line of
a killed idea, picked by me before the run and seen after. Those 116 trades judge nothing here. ONLY signals from Fri 2015-08-14 on count.

WHEN IT STARTS: my coach's rule is one paper line at a time, and SW1's shadow is open (6 of 20, -5.36R, 0.64R from its close line). So the
EN2 count starts on the first weekday after SW1's shadow closes (by its 6R line or at 20 trades), UNLESS my coach says both may run now.
Either way the signals are computed by the tool from history after the start date: no hand picking, no walk needed.
TOOL: `python bt/en2_forward.py START END` (bt/engulfing.py's own signal and trade code, limited to signals on or after START).

SAMPLE AND LINES (several trades a week -> the 120 rule):
- 120 forward trades, fixed (about 8 months at EN2's past rate of about 0.73 a weekday). No verdict look before 120.
- EARLY CLOSE, for good: running drawdown above 8R at any time.
- AT 120, all must pass: F1 average >= +0.10R; F2 net above zero without its best 3 trades; F3 stressed average (2.0 + 0.5) above zero;
  F4 EN2 minus the same signals traded the other way above zero with sign-flip p < 0.05.
- A pass is a lived-days pass by my coach's line: it would make EN2 ELIGIBLE for route C (probation $15.63 a trade = 0.08 lots at 20 pips),
  and only with my coach's word. A fail closes it for good.
