# Idea WO: the weekly open as the week's dividing line (idea 108; coach 07-20: something not studied yet; route B hunt)
Written Mon 2015-07-20 22:00 London, before any code. Not studied before: I tested the weekend GAP (WG), never the weekly open as a level.

## Hypothesis
The first price of the week is a line the week takes a side on. Once the price is clearly on one side of it, Tuesday-Friday days tend to
go further that way.

## Rule (London time; Tue-Fri only, one trade a day)
Weekly open = the open of the week's first M5 candle (Sunday evening).
- WO1 (judged): at 08:00, if the 08:00 open is 30+ pips from the weekly open -> market order away from it (above -> buy, below -> sell),
  stop 40 pips, out 20:00.
- WO2: the same, out 12:00.
- WO3: side fixed for the week by Monday's 22:00 close against the weekly open (30+ pips), traded Tue-Fri at 08:00, stop 40, out 20:00.
Three variants, no more. Costs on (1.0 + 0.1); stressed 2.0 + 0.5. $125 = 1R.

## Cases before outcomes
Count trades per variant, before and from 04-07, and on how many of them the side equals A2's side. Under 60 trades in all or under
25 from 04-07 -> not judgeable, killed for sample.
Power check written BEFORE the run (lesson of SW): with about 100 trades and results spread about 1.1R, "my side minus the opposite side"
has an error of about 0.2R, so K4 can only pass if the true edge is around +0.2R a trade or more. I accept that: a smaller edge is not
worth a funded account's risk anyway.

## Kill lines for WO1 (all must pass)
K1 average >= +0.10R after costs. K2 net above zero before 04-07 AND from 04-07. K3 net above zero without its best two trades.
K4 same days, opposite side, same stop and exit: mean difference above zero, sign-flip p < 0.05 (stand-alone trades, as written).
K5 stressed average above zero. K6 max drawdown <= 6R.
K7 not A2 in disguise: reported, and if 80%+ of trades are on A2's side, a pass would only be a pass of A2's old edge -> treated as a fail.
Pass = route B step B1 candidate, then 40 forward paper trades. Fail = killed. My guess: positive before 04-07, negative after (K2 fails),
like every follow rule on the morning scale.

## Counts and worked case (tool, before outcomes)
