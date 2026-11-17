# Idea SR: what happens after A2's stop is hit? (idea 114; coach 07-28: an untouched idea, exits/management). Written Tue 2015-07-28 22:00 London, before any code.
Already tested on the exit side, so not again: break-even (X1, BE, PM3), partials and scale-out (SO, PM twice), targets (X3, GB2), trails and
locks (GB, LK), runner (X2), one-hour checks (T), time-decay stops (TD), candle-close stops (CS), stops of 25/30/35/50/60/80 pips (E, S),
earlier or later exits (RC, AF), later entries (LD, ET). Never asked: once the stop is hit, does the rest of the morning carry information?

## Hypothesis
A full stop means the morning is going against my signal with force (in my replays the stopped trades "were never in doubt"). So after
the stop the move carries on to noon: taking the OTHER side at that moment earns.

## Rule (London time). Trigger: the engine's A2 trade is stopped before 11:00.
- SR1 (judged): at the open of the next M5 candle after the stop, market order AGAINST A2's side, stop 40 pips, out 12:00.
- SR2: the same, held to 16:00.
- SR3 (control, the trade my plan forbids): re-enter on A2's SAME side at that moment, stop 40, out 12:00. It measures what "never
  re-enter" saves or costs.
Three variants, no more. Costs on (1.0 + 0.1); stressed 2.0 + 0.5. $125 = 1R.

## Cases before outcomes
Count A2 stops before 11:00 in all, and in each half of them by date. Under 30 cases -> not judgeable -> killed for sample.
Power, written first: about 40 cases, spread about 1.1R -> error about 0.17R on the average; a rule with no edge clears +0.10R about
one time in four. Stops are rare before April (10% of days) and common after (37%), so most cases are from the bad regime: whatever
this shows is mostly a fact about April-July.

## Kill lines for SR1 (all must pass)
K1 average >= +0.10R. K2 net above zero in each half of the cases by date. K3 net above zero without its best two trades.
K4 SR1's average above SR3's (reversing beats re-entering; sign only, the sample cannot carry a p-value). K5 stressed average above zero.
K6 max drawdown <= 6R.
Pass = route B step B1 candidate (its trigger is A2's paper stop), then 40 forward paper trades. Fail = killed.
Whatever SR3 shows, rule "never re-enter" does not change off one test; I report it.
My guess: SR1 about zero (K1 fails); SR3 negative.

## Counts and worked case (tool, before outcomes)
