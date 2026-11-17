# Idea EF: the late session follows the day's move, judged only on days EV never used (idea 122; coach 08-06)
Written Thu 2015-08-06 evening (clock Thu 08-06 22:00 London), before any code. Replaces FB (retracted, a re-cut of PD3).

## Why this one, by the same criterion
EV (07-29) tested the FADE of the 08:00->17:00 move in 17:00-21:00 on 51 days with a move of 60+ pips; its CONTROL, the follow,
made +0.099R (positive before and after 04-07, stressed +0.025R). My coach forbade testing a mirror on the same data (07-09), so the
follow was not promoted. But EV never traded the days with a SMALLER move, and EV's data ended 07-29. Those days are data EV never
used. Market reason, from my own record: the late session leaned with the day in EV; the night gives part of it back (63%, NF), which
fits a market that carries the day's direction into the New York afternoon and unwinds it overnight. Not a mirror on the same data.

## Rule (London time, unchanged from EV's control except the days)
Day move = open of the 17:00 candle minus open of the 08:00 candle. At 17:00 market order WITH the move, stop 30 pips, out 21:00.
JUDGED DAYS = the days EV never traded: 25 <= |move| < 60 pips (all history), plus |move| >= 60 on days after 07-29.
The 25-pip floor is set now, from the median |move| (45 pips, printed by EV's count on 07-29), so as not to trade flat days.
- EF1 (judged): all judged days. EF2 (dose): judged days with 40 <= |move| < 60. EF0 (control): the fade on EF1's days.
Three variants, no more. Costs on; stressed 2.0 + 0.5. $125 = 1R.

## Cases before outcomes
Count EF1 days before and from 04-07. Under 50 -> not judgeable -> killed for sample.
Power, honest: about 60 trades, spread about 1R -> error about +-0.26R on the average; a no-edge rule clears +0.10R about one time
in four. A pass here is weak evidence (the FD lesson); it would only make the follow worth a forward count, never route C on its own.

## Kill lines for EF1 (all must pass)
K1 average >= +0.10R. K2 net above zero before 04-07 AND from 04-07. K3 net above zero without its best 3 trades.
K4 follow above fade on the same days (sign). K5 stressed average >= +0.05R (the evening spread worry from EV). K6 max drawdown <= 6R.
K7 dose: EF2 >= EF1 (if the day's move carries, a bigger move should carry at least as well).
My guess: small and positive, under +0.10R (K1 fails); the follow was +0.099R on the biggest days.

## Counts and worked case (tool, before outcomes)
Tool: `python bt/evening_follow.py 2015-08-07 count` / `check DATE` (no outcomes). The script loads bt/evening_fade.py's definitions byte
for byte (first attempt failed on my own import slice; no outcome printed).
- 152 days with the three candles (01-02..08-06). EF1 judged 56 days (21 before 04-07, 35 from; one of them is a 60+ day after 07-29:
  07-31). EF2 32. EV's 51 days excluded: 51. Judgeable by my line (50), just.
- Worked case Thu 07-30: 08:00 open 1.09650, 17:00 open 1.09144, move -50.6 pips -> EF1 SELLS at 17:00, stop 30 above, out 21:00
  (also an EF2 day). Thursday's London close was 1.09310, so the evening rose from 1.0914 to about 1.0931: I expect a small loss here.
- Second case Fri 07-31 (unseen by EV, after its end): move +74.1 -> BUY at 1.10276. Friday closed at 1.09830: I expect a loss of about 1.5R... no:
  the stop is 30 pips, so a full stop (-1R) if 1.09976 was hit before 21:00, which a close at 1.0983 makes likely.

## Result (one run)
