# Idea EV: the late session, 17:00-21:00 London, against the day's move (idea 115; coach 07-29: something new from my own chart notes)
Written Wed 2015-07-29 22:00 London, before any code.

## Where it comes from
My notes of 06-22 list "B: late-day move 17:00-21:00 (no side in my notes)" as written and untested. This month I noted three times
that the big move came after my noon exit and partly came back by the evening (07-15, 07-21, tonight). My tested facts lean one way:
moves are given back (the night returns part of yesterday's move 63% of the time; the pre-bell hour is given back; after a stop the
move is spent). I have never tested the hours 17:00-21:00 in any way.

## Hypothesis
After London and New York's morning have pushed the price a long way in one direction, the late session gives part of it back.

## Rule (London time, one trade a day)
Day move = open of the 17:00 candle minus open of the 08:00 candle, in pips.
- EV1 (judged): |day move| >= 60 pips -> at 17:00 market order AGAINST it, stop 30 pips, out 21:00 (before the rollover hour).
- EV2 (dose): the same with |day move| >= 100 pips.
- EV0 (control): the FOLLOW trade on EV1's days (with the day move), same stop and exit.
Three variants, no more. Costs on (1.0 + 0.1); stressed 2.0 + 0.5. $125 = 1R.
Honest worry written first: the sim charges the same 1.0 pip at 18:00 as at 10:00. Real late-session spreads may be wider; I cannot
check that. So the stressed line counts for more here than usual.

## Cases before outcomes
Count EV1 and EV2 days before and from 04-07. Under 50 EV1 trades or under 20 from 04-07 -> not judgeable -> killed for sample.
Power: about 70 trades, spread about 1.0R -> error about 0.12R on the average; a no-edge rule clears +0.10R about one time in five.

## Kill lines for EV1 (all must pass)
K1 average >= +0.10R. K2 net above zero before 04-07 AND from 04-07. K3 net above zero without its best two trades.
K4 fade above follow on the same days (EV1 average > EV0 average; sign, with the sign-flip p reported, not required).
K5 stressed average >= +0.05R (stricter than "above zero" because of the spread worry). K6 max drawdown <= 6R. K7 dose: EV2 average >= EV1 average.
Pass = route B step B1 candidate, then 40 forward paper trades. Fail = killed.
My guess: a small positive average under +0.10R, like the night fade (NF): K1 fails.

## Counts and worked case (tool, before outcomes)
Tool: `python bt/evening_fade.py 2015-07-30 count` / `check DATE` (no outcomes).
- 146 days with 08:00, 17:00 and 21:00 candles (01-02..07-29); median |day move| 45 pips. EV1 (>= 60): 51 days (22 before 04-07,
  29 from; 24 up days, 27 down). EV2 (>= 100): 24 days (12 / 12). Judgeable by my line, only just (50).
- Worked case, no trade: today 07-29, 08:00 open 1.10466, 17:00 open 1.10237, move -22.9 pips -> under 60, nothing.
- Worked case with a trade: Tue 07-21, 08:00 open 1.08297, 17:00 open 1.09267, move +97.0 pips -> EV1 SELLS at 17:00, stop 30 pips
  above, out 21:00 (not an EV2 day: under 100). I remember the price near 1.0934 at 22:00 that day, so I expect a small loss here.

## Result (one run)
Tool: `python bt/evening_fade.py 2015-07-30 test`. Hand check 07-21: fade sold 1.09266 at 17:00, stopped 1.09568, -1.01R (I had expected
a small loss; it was a full stop); the follow bought 1.09278, out 21:00 at 1.09349, +0.24R.
| variant | trades | wins | avg R | net | full stops | before 04-07 | from 04-07 | without best 2 | stressed avg | max DD |
|---|---|---|---|---|---|---|---|---|---|---|
| EV1 fade, day move >= 60 (JUDGED) | 51 | 41% | -0.139 (+-0.25) | -7.08 | 19 | 22: -2.70 | 29: -4.37 | -11.21 | -0.193 | 11.60R |
| EV2 fade, day move >= 100 | 24 | 42% | -0.138 (+-0.36) | -3.32 | 8 | 12: -2.37 | 12: -0.95 | -7.00 | -0.193 | 6.06R |
| EV0 follow on EV1's days (control) | 51 | 55% | +0.099 (+-0.26) | +5.07 | 11 | 22: +2.11 | 29: +2.97 | +0.72 | +0.025 | 3.29R |
Fade minus follow -0.238R (sign-flip p 0.34). EV1: K1-K6 FAIL, K7 pass (meaningless). **EV IS KILLED.**
What I learned: 1. Wrong direction again, the second day running (SR yesterday). The late session does not give the day's move back;
if anything it leans on with it. My "moves are given back" picture is true for the night and for the pre-bell hour, and I stretched it
to a window where I had no count. 2. The control (follow) made +0.099R, positive on both sides of 04-07, small drawdown. I note it and
do NOT promote it: it was the control, not the hypothesis; it is under my +0.10R line; its stressed average is +0.025R and this is the
session where I trust the sim's 1.0-pip spread least; and testing the mirror on the same data is what my coach told me not to do (07-09).
It can be a pre-registered idea of its own one day, on days after today. 3. Two wrong-way guesses in two days: my feel for direction
is worth nothing, which is the point of writing the guess down before the run.
Counts: idea 115; variants 317-319; second setups tried 20, none alive.
