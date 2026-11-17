# Idea CF (idea 75): a confirmation entry for A2 - PRE-REGISTRATION with worked cases (pushed before the simulator is written or run)
Sim clock Fri 2015-06-05 01:00 London. END 2015-06-05. Coach 06-03 / 06-04: one idea to make A2 itself better, kill line first, variants counted; one test, one day.
## Where it comes from (my own MFE / MAE log, journal/mfe-mae-log.csv, 108 trades)
Three quarters of my full stops were never 8 pips in profit: they are wrong from the first minute. 80 of 108 trades were at some point 10+ pips in
profit - but only 6 of the 24 full stops were. So: do not buy at 08:00; put a buy-stop a few pips ABOVE the 08:00 price (sell-stop below for sells) and
let the market show the first few pips. Every entry test so far moved the TIME of a market order (ET, LD, SI) or asked for a better price (LE). None
asked the market to move my way first.
Known against it, stated: a confirmation entry pays X pips more on every trade it takes, and its stop (40 pips from the new entry) sits X pips closer
to where the price was at 08:00. Noon losers have a median worst point of -30 pips: some of them will become full stops.
## Rule (A2's signal, size, stop distance and clock unchanged; only HOW I get in)
At 08:00 London read the bid B. For a buy: enter when the bid first trades at B + X between 08:00 and 10:00; fill at B + X + spread + slippage
(or at the candle's open if it opens beyond the level). Stop 40 pips under the trigger level. Close 12:00. Not triggered by 10:00 -> no trade (0R). Sells mirrored.
Worst case inside one M5 candle: if a candle triggers the entry AND reaches the stop, it counts as a stop.
- CF1: X = 5 pips. CF2: X = 10 pips (the main variant). CF3: X = 15 pips.
## WORKED CASES (June goal; python before this push)
- Mechanics, 06-04 (my live buy), X = 10: B 1.12391 -> trigger 1.12491; the first M15 candle's high was 1.12498, so it triggers there; fill 1.12502, stop
  1.12091, noon exit 1.13583: +108.1 pips = +2.63R (A2 that day: +2.87R live). The simulator must print this.
- Regression: with X = 0 the simulator must reproduce engine A2 (largest difference per day about zero).
- Crude prediction from the log (entered = trades whose MFE reached X; entered full stops -41 pips; others their result minus X; skipped 0):
  | X | entered | full stops avoided | winners missed | crude total vs A2 (+36.44R) | lived days vs A2 (+16.85R) |
  |---|---|---|---|---|---|
  | 5 | 93 of 108 | 11 of 24 | 0 | +2.56R | +5.06R |
  | 10 | 80 | 18 | 3 | +2.22R | +4.85R |
  | 15 | 73 | 20 | 5 | -2.45R | +3.21R |
  This crude figure is TOO KIND and I say by how: it ignores every trade that goes on to hit the closer stop after triggering. I expect the real run
  to be 2R to 4R below it. On the crude numbers the backtest half is already behind A2 (X = 10: -2.62R before 03-02, +4.85R after).
## Kill lines (CF2 against A2, all A2 days before 2015-06-05, costs on; one failure kills)
- K1: net R at least 2.0R above A2.                                   [worked: crude +2.22R, too kind -> expect FAIL]
- K2: not behind A2 before 03-02, and at least +1.0R ahead on lived days (from 03-02).   [worked: crude -2.62R before 03-02 -> expect FAIL]
- K3: it does its job: at least 5 fewer full stops than A2 and max drawdown not larger.   [worked: 18 avoided, minus the new ones; drawdown not worked - needs the sequence]
- K4 neighbours: CF1 and CF3 each not more than 1.0R behind A2.         [worked: crude +2.56R and -2.45R -> expect FAIL on CF3]
- K5: at stressed costs (2.0 pip spread, 1.0 slippage on the stop-entry and exits) CF2 is still not behind A2 at the same costs.
A survivor gets the lived-days table first and then at most a forward paper tag.
My guess = the worked table minus 2R to 4R: killed on K1 and K2.
