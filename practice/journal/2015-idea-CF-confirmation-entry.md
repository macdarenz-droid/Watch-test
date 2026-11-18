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

## Hand-checks before the totals (`python bt/confirm_entry.py 2015-06-05 --check 2015-06-04`)
- Worked mechanics case, 06-04, X = 10: entered in the 08:00 candle, fill 1.12502, noon exit 1.13583, +2.63R. The pre-registration's figures exactly.
- Regression, X = 0 against engine A2: the stop days are identical (24 of 24), but the largest difference per day printed 0.074R, not zero. I found the
  reason before running any variant: the engine divides a result by a nominal 40 pips, my simulator by the real fill-to-stop distance (41.1 pips for a
  buy). Ratio of the two on non-stop days: buys 0.9748 (40 / 41.1 = 0.9732), sells 0.9991 (40 / 40.1 = 0.9975); sums +36.14R against +36.39R. Same
  trades, a 3% difference in the unit. So the baseline in the table below is MY OWN X = 0 run (same unit as the variants) - decided and written into
  the script after the regression print and before any variant total was seen.

## Results (run once; `python bt/confirm_entry.py 2015-06-05`; costs on; figures copied from the print)
A2 (X = 0): 108 days, net +36.14R, max DD 4.44R, 24 full stops; before 03-02 +19.47R, from 03-02 +16.66R; at stressed costs +27.60R.
| variant | net R (vs A2) | before 03-02 | lived days from 03-02 | entered / no entry | A2 on the no-entry days | full stops (new ones) | max DD | wins | at stressed costs vs A2 stressed |
|---|---|---|---|---|---|---|---|---|---|
| CF1 +5 pips | +36.94 (+0.80) | -2.99 | +3.79 | 91 / 17 | -12.36R (11 full stops, 2 winners) | 15 (2) | 3.49R | 52% | +2.42 |
| CF2 +10 pips | +33.26 (-2.88) | -6.12 | +3.25 | 79 / 29 | -18.92R (18 full stops, 5 winners) | 11 (5) | 3.41R | 48% | -0.62 |
| CF3 +15 pips | +26.36 (-9.78) | -8.70 | -1.08 | 72 / 36 | -18.90R (18 full stops, 8 winners) | 13 (7) | 4.01R | 40% | -8.37 |

## Kill lines for CF2
| line | worked expectation | result | verdict |
|---|---|---|---|
| K1 net at least +2.0R above A2 | crude +2.22R, "too kind by 2R to 4R" | -2.88R | FAIL |
| K2 not behind before 03-02 and +1.0R ahead on lived days | crude -2.62R before 03-02 | -6.12R before; +3.25R lived | FAIL |
| K3 at least 5 fewer full stops, drawdown not larger | 18 avoided minus new ones | 11 against 24; 3.41R against 4.44R | PASS |
| K4 neighbours not more than 1.0R behind A2 | CF3 expected behind | CF1 +0.80R; CF3 -9.78R | FAIL |
| K5 not behind at stressed costs | - | -0.62R | FAIL |
VERDICT: CF2 KILLED on four lines. No tag for any variant.

## Worked prediction against the run
Crude +2.22R with a stated bias of 2R to 4R -> expected about -1.8R to +0.2R; the run says -2.88R. The direction and the reason were right (the closer
stop makes new full stops: 5 of them at +10 pips), the size of the bias a little larger than I allowed. No pushed figure needed correcting.

## What I learned
- The idea does exactly what the log promised on the loss side: 18 of 24 full stops never trigger a +10 pip entry, and the days it skips made -18.92R
  for A2. Fewer stops, lower drawdown (3.41R against 4.44R).
- And it pays for that on every trade it takes: 10 pips worse on 79 entries is about 19R, more than it saved. The winners are where the money
  is, and a confirmation entry taxes every one of them.
- The split by period is the same picture as PH and LD: before March (few stops, clean trends) the tax is pure cost (-6.12R); on my lived days (30%
  full stops) it pays (+3.25R, and +3.79R for the 5 pip version). An entry that only helps when A2 is being stopped a lot is not an improvement of
  A2; it is a bet that the next months look like April-June and not like January-February. I cannot know that, and by my lines it is dead.
- I note for the record, without a tag or a count line (one thing at a time): the 5 pip version is ahead on lived days, at stressed costs, with a third
  fewer full stops, and behind only in the backtest months. If the coach ever wants ONE more paper line, this is the candidate I would name. I do
  not open it myself: its main variant failed four lines I wrote first.
Counts: ideas 75, variants 210 (CF1 CF2 CF3). Adopted trading ideas: 0. On paper: UN3, PH2, MB1. Numbers or rules corrected after a push in June: 0.
