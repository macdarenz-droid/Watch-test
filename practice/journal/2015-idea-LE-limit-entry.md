# Entry tactic test: a better price instead of the market order? KILL LINES WRITTEN FIRST (nothing has been run)
Clock Wed 2015-04-01 01:00 London (end of released data). A new RULE test (not a reshuffle): it changes how the same daily trade is entered.

## Where the idea comes from (measured long ago on all trades, not picked from extremes)
My forward-vs-backtest table: across all trades the average worst point is about 16-18 pips against me, and even my winners dip 12 pips on average before they go.
So on most days price trades at a better level than my 08:00 market fill at some point in the first minutes. A2 has always paid the 08:00 price plus the spread.
I have tested entry TIME (07:00, 09:00), never entry PRICE. If the dip is common, a resting order a few pips better would improve the entry on most trades and each pip saved
is 1/40 of R with the same stop distance. The cost: the days that go straight away from 08:00 without a dip are my best days (01-15, 03-06 and 03-31 never went 2 pips against me).
Method rule check: this is not a "best N vs worst N" idea; the feature (worst point) was measured on every trade.

## The rule change (single; direction, day, stop distance, size and noon exit exactly A2)
At 08:00 London, instead of a market order, place a LIMIT order X pips better than the 08:00 price (below it for a buy, above it for a sell).
If it fills, the stop is 40 pips from the fill. Variants (63, 64, 65; ideas -> 26), no others afterwards:
- LE5: X = 5 pips; if not filled by 08:30, enter at market at 08:30 (never miss the day).
- LE10: X = 10 pips; if not filled by 08:30, enter at market at 08:30.
- LE10x: X = 10 pips; if not filled by 09:00, NO trade that day.
Fills in the test: a buy limit fills when the ask touches it, a sell limit when the bid touches it, on M5 candles; the stop is checked on the whole fill candle (pessimistic);
costs on as always (spread inside the ask; slippage on market fills and stops).

## Data
January = build. Check = March lived days 03-02..03-31 (22 trades), clean of builds - use #3 of the clean month. February shown, labelled contaminated.
What I know that could bias me: the average worst-point figures above (all months), and that my biggest winners had almost no dip. I have never simulated a limit entry.

## KILL LINES (explicit)
Build (January) - a variant survives only if ALL:
  B1. avg R per A2 signal day (a missed day counts as 0R) >= A2's avg R + 0.05R;
  B2. net R >= A2's net R;
  B3. max drawdown <= A2's + 0.25R.
  The survivor with the highest net R is THE candidate. No survivor -> closed, nothing claimed from March, and March is not run.
Check (March lived days) - the candidate passes only if ALL:
  C1. net R >= A2's net R on those days;
  C2. avg R per signal day >= A2's;
  C3. max drawdown <= A2's.
A pass earns a FORWARD PAPER TAG only; the funded entry stays a market order at 08:00 London.
My guess: LE5 gains a little on the dip days and loses a little on the runaway days - about a wash; LE10x misses the best days and fails B2 badly; LE10 in between. No survivor.
