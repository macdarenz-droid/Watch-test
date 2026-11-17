# Idea AR: in the quiet Asia hours, a move away from midnight's price comes back (idea 124; coach 08-10: next backtest, max 3 variants named up front)
Written Mon 2015-08-10 22:00 London, before any code.

## Why
The night is where my own counts found the most "giving back" (NF, 04-22: the night returns part of yesterday's move 63% of the time,
but fading YESTERDAY's direction did not pay after costs). I never tested reversion around the night's OWN starting point. Belief I
cannot source: the Asian session is thin for EURUSD, so moves there carry less weight. The test does not rely on it.

## Rule (London time; one trade a night; weekdays: the night that starts at 00:00 Tue..Fri, and Mon after the weekend open)
Midnight price = open of the 00:00 M5 candle. Departure = the first M5 candle between 00:00 and 05:00 that CLOSES at least D pips away.
At the next candle's open: market order back toward midnight's price, stop S pips, target = midnight's price, else out at 06:00.
THE THREE VARIANTS, named now and no others:
- AR1 (judged): D = 15, S = 15.
- AR2 (dose): D = 20, S = 20.
- AR0 (control): AR1's signals traded the other way (follow the departure), S = 15, target the same distance beyond, out 06:00.
Costs on (1.0 + 0.1). Night spreads in a real account are likely wider than the sim's 1.0 pip; I cannot check, so the stress line
below uses 2.5 + 0.5 and must pass. $125 = 1R.

## Cases before outcomes
Count AR1 / AR2 nights before and from 04-07. Under 80 AR1 trades or under 35 from 04-07 -> not judgeable -> killed.

## Kill lines (four, all must pass, for AR1)
K1 average >= +0.10R. K2 net above zero before 04-07 AND from 04-07. K3 average at stressed costs (2.5 + 0.5) above zero.
K4 AR1 minus AR0 above zero with sign-flip p < 0.05.
Pass = eligible for route C after my coach's word (probation $15.63 a trade = 0.10 lots at a 15-pip stop). Fail = killed.
My guess: a high win rate, a small average that the stressed spread wipes out: K3 fails.

## Counts and worked case (tool, before outcomes)
