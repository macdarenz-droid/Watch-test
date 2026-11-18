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
Tool: `python bt/asia_reversion.py 2015-08-11 count` / `check DATE` (no outcomes).
- AR1 (D = 15): 117 nights (48 before 04-07, 69 from; 58 departures up, 59 down). AR2 (D = 20): 85 nights (33 / 52). Judgeable (80 / 35).
- Worked case, no trade: Mon 08-10's night (range 23.9, net +8.0 by my call) never closed 15 pips from midnight: no signal. (My first
  check command asked for that night and failed on the empty list; no outcome was printed.)
- Worked case with a trade: Wed 08-05, midnight 1.08893; the 01:40 candle closed 15+ pips below -> AR1 BUYS at the 01:45 open, target
  1.08893, stop 15 below. My 07:00 call that day had the night's low at 1.08482 and its last price at 1.08723: the price went on down
  about 25 pips after 01:45 before coming back, so I expect a full stop here unless the target came first.

## Result (one run)
Tool: `python bt/asia_reversion.py 2015-08-11 test`. Hand check 08-05: AR1 bought 1.08751 at 01:45 and was stopped at 1.08589, -1.08R; AR0 sold
1.08739 and hit its target 1.08590, +0.99R. As I wrote first.
| variant | trades | wins | avg R | net | targets / stops / time | before 04-07 | from 04-07 | stressed (2.5 + 0.5) avg |
|---|---|---|---|---|---|---|---|---|
| AR1 back to midnight, 15 / 15 (JUDGED) | 117 | 50% | -0.024 (+-0.16) | -2.75 | 32 / 36 / 49 | -7.96 | +5.21 | -0.170 |
| AR2 back to midnight, 20 / 20 | 85 | 55% | +0.093 (+-0.17) | +7.87 | 18 / 16 / 51 | -2.48 | +10.35 | -0.040 |
| AR0 follow AR1's signals (control) | 117 | 43% | -0.157 (+-0.16) | -18.35 | 32 / 45 / 40 | -2.45 | -15.89 | -0.304 |
AR1 minus AR0 +0.133R (sign-flip p 0.39). AR1: all four kill lines FAIL. **AR IS KILLED.**
What I learned: 1. The night has no reversion I can trade at a believable spread: AR1 is a coin, AR2's small plus disappears at a 2.5-pip
spread (-0.040R), and the stressed line was the one I said in advance would matter. 2. The same split as everywhere: reversion did
NOT pay before 04-07 and did after (AR1 -7.96R / +5.21R; AR2 -2.48R / +10.35R). Following lost after 04-07 (-15.89R). The market
changed from "moves carry" to "moves come back" around 04-07, and it changed at night too. That is a fact about the regime, now seen in
A2, MC, the burst chases and here. It is not a rule: a rule built on "after 04-07" is a calendar, and the date it changes back will not
be announced (my MC and EF tests could not find a market measure that announces it).
Counts: idea 124; variants 344-346 (three, named up front); second setups tried 26, none alive.
