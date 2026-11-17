# Idea SW: a slower A2 on the daily scale (idea 107; coach 07-17: timeframes; route B hunt)
Written Fri 2015-07-17 22:00 London (weekend), before any code.

## Hypothesis
A2's core: the price keeps going the way it has gone over the last days. On four hours that stopped paying after 04-07 because moves
are taken back inside the morning (MC facts). If the direction is still there on a slower scale, a trade held for days with a stop
wider than a day's noise should still be paid.

## Rule (London time; one position at a time)
- Signal at the 22:00 close: direction = that close against the close N trading days earlier.
- Entry: market at 08:00 the next trading day if flat. Stop S pips from the entry price, target 2 x S, both fixed; else close at 12:00
  on the 5th trading day after the entry day. After an exit the next entry can come the next morning from the then-latest 22:00 signal.
- SW1 (judged): N = 10 days, stop 120 pips (about one median day range, 124), target 240.
- SW2: N = 3 days (A2's own signal, only held longer), stop 120, target 240.
- SW3: N = 10 days, stop 80, target 160, time exit at 12:00 on the 2nd trading day (the H4-scale version).
Three variants, no more. Costs on (1.0 + 0.1 pips); stressed 2.0 + 0.5. $125 = 1R, so about 0.10 lots at a 120-pip stop.
NOT in my engine: overnight financing (swap). A real account charges or pays it on positions held past rollover; I do not know the
firm's figures, so every result here is before swap. Weekend gaps ARE in the price data and hit the stop at the gap price as the engine does it.

## Cases before outcomes
The number of trades depends on the exits, so I count it with a mode that prints only how many trades each variant makes, in each part.
History is 135 days: at up to 5 days a trade I expect 30-45 trades. Under 30 trades in all or under 12 from 04-07 -> NOT JUDGEABLE:
the variant can be killed but cannot pass.

## Kill lines for SW1 (all must pass)
K1 average >= +0.15R after costs. K2 net above zero before 04-07 AND from 04-07 (by entry day). K3 net above zero without its best two trades.
K4 better than the mirror (same days, opposite side, same stops): mean difference above zero, sign-flip p < 0.05.
K5 stressed average above zero. K6 max drawdown <= 6R.
Pass = route B step B1 candidate only; then 40 forward paper trades (months, at this pace). Fail = killed, no fourth variant.
Idea 107 on the same six months; EURUSD fell 1.20 -> 1.05 in Jan-Mar, so any "follow" rule looks good before April. K2 is the line that matters.
My guess: positive before 04-07, negative after, K2 fails.

## Counts and worked case (tool, before outcomes)
Tool: `python bt/slow_a2.py 2015-07-18 count` / `first` (trade counts and the first entry only; no results).
- SW1 39 finished trades (16 before 04-07, 23 from), 1 still open at the end of data (not counted). SW2 39 (16 / 23), 1 open. SW3 69 (29 / 40).
  Judgeable by my line (>= 30, >= 12 late). First possible entry 01-19 (10-day warm-up).
- Worked case, first trade Mon 01-19: 10-day gap -439.1 pips -> SELL at the 08:00 open 1.15590; stop 1.16790 (120 pips), target 1.13190
  (240 pips), else out 12:00 on Mon 01-26.

## Result (one run)
