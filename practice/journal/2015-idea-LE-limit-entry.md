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

# RESULTS of idea LE (run after commit 21caf99). LE5/LE10/LE10x = variants 63/64/65; ideas 26. Costs on, $125 risk, London time (bt/limit_entry.py).

## Build - January (19 signal days)
| Entry | Trades taken | Win rate | Avg R per trade | Avg R per signal day | Net R | Max DD | Full stops |
|---|---|---|---|---|---|---|---|
| A2: market order at 08:00 (before) | 19 | 74% | +0.78 | +0.784 | +14.89 | 1.34R | 2 |
| LE5: limit 5 pips better, else market at 08:30 | 19 | 79% | +0.71 | +0.712 | +13.52 | 1.31R | 2 |
| LE10: limit 10 pips better, else market at 08:30 | 19 | 79% | +0.73 | +0.727 | +13.81 | 1.26R | 2 |
| LE10x: limit 10 pips better, else no trade | 12 | 67% | +0.70 | +0.444 | +8.44 | 1.26R | 2 |

## Kill lines, applied
- B1 (avg R per signal day at least +0.05R above A2): LE5 -0.07, LE10 -0.06, LE10x -0.34 -> all fail.
- B2 (net R at least A2's): 13.52, 13.81, 8.44 against 14.89 -> all fail.
=> NO SURVIVOR. The three variants are closed. As written beforehand, March was NOT run for this idea (clean-month uses stay at 2).

## What it says
- The better price is real on the days it fills, and it costs more than it gives: the days when price never comes back are the big ones, and on those the limit versions either
  enter half an hour later at a worse price (LE5, LE10) or miss the day entirely (LE10x: seven of nineteen days missed, including winners worth 6.5R).
- Both stop-outs stay stop-outs with any entry: a few pips of better price do not save a trade that goes 40+ against.
- The win rate goes UP (74% -> 79%) while the profit goes DOWN. A nice illustration of why I do not judge a rule by win rate.
- Same conclusion as the exit tests from the other end: paying the spread at 08:00 London sharp is part of the edge. Entry stays a market order.
- Counts: ideas 26, variants 65.
