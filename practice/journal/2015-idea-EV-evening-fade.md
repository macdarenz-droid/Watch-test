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
