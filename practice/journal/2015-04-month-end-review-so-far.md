# Funded month-end review, APRIL SO FAR (04-01 .. 04-23, 17 trading days) - written Fri 2015-04-24 01:00 London, before the next live day
Numbers from my own trade log (sim/trades.csv) and the tracker; R = result / amount risked. The final April review is written on the first live day of May.

## Result
| | April so far | Funded total (from 03-27) |
|---|---|---|
| Trades | 17 | 20 |
| Wins / valid losses | 8 / 9 | 10 / 10 |
| Net R | +1.56R (+1.57 in the daily-rounded tracker) | +2.54R |
| Account P&L | +$186.62 | +$310.93 (of which $68.82 paid out) |
| Average win / average loss | +0.94R / -0.66R | |
| Full stops | 5 of 17 (29%): 04-07, 04-08, 04-16, 04-20, 04-23 | |
| Best day / worst day | +$243.04 (04-13) / -$130.82 (04-23) | |
| Longest losing run | 4 trades (04-20 .. 04-23: -1.00, -0.04, -0.02, -1.00) | |
| Sells / buys | 10 sells +2.57R / 7 buys -1.01R | |
By week: W14 (3 days) -0.08R | W15 +0.21R | W16 +3.50R | W17 (4 days so far) -2.07R.
Sequence: +0.09 -0.25 +0.07 | +0.27 -1.00 -1.00 +0.33 +1.62 | +1.94 -0.62 +1.48 -1.00 +1.70 | -1.00 -0.04 -0.02 -1.00.

## Drawdown
High-water $25,508.71 (04-17). Balance now $25,242.11 = -1.05%, the deepest of the funded account so far (earlier low: -1.00% on 04-08).
First brake (-3%) $24,743.45, stop (-5%) $24,233.27, account line $22,500. Never within 1.9% of the first brake. Worst single day -0.52% against the firm's 5% daily line.
In R: live maximum drawdown 2.07R (backtest Jan-Feb 1.87R). Nothing here is outside what the risk-size test said to expect at 0.50%.

## Payouts
- 04-10: $68.82 requested (half of the profit above $25,000), $55.06 mine. High-water reset then.
- Next date Fri 04-24 (the coming live day). Plan unchanged: after the day's trade, on the tracker balance: below $25,000 -> nothing; between $25,000 and $26,000 ->
  half of what is above $25,000; no request if a brake is on (none is). If Friday is flat that is $121.06; after a full stop $55.6; after +1R $183.6.
- Honest size of it: about $55 to me in the first month. At the planning edge the plan expects roughly $370 a month to me; April so far is running at about a third of
  that, inside the "one month in five is negative" spread. Still unknown: whether the firm has a minimum payout amount.

## Mistakes
- TRADE mistakes in April: 0 of 17. Every loss tagged "valid setup, market disagreed" (9), every call committed before the entry bar, no skip, no second trade, no moved stop,
  size 0.31 lots every day - including the two mornings (04-22, 04-23) when my own paper filter said skip.
- PROCESS mistakes in April: 2. P2 (04-03): a research script touched data it should not have. P3 (04-08, found 04-17): a journal note gave a noon price read in the
  wrong time zone and turned a plain loss into a "robbed by 2 pips" story. Fixes in place: explicit end dates in every research script; on a stop day the result line
  gives the price at 12:00 London from the engine.
- Small things that are not mistakes but that I watch: (1) the stop is set 40 pips from the bid I read, the fill comes a minute later - on 04-23 that made the risk
  $130.50 instead of about $127; (2) research: three notes this month contained a number written from memory that I had to correct the same day.

## What went well
The live walk (a note before every advance) since 04-17: five of the seven mornings the chart "said" the opposite of the rule at 08:00, and the order went in anyway.
Losses are being tagged before stories. The live-vs-backtest table exists and is updated daily.

## Weaknesses - listed honestly, then ONE chosen
1. The month is one week. W16 made +3.50R; the other twelve days made -1.94R. Without 04-10, 04-13, 04-15 and 04-17 April is -5.2R.
2. Buys lost: 7 buys, -1.01R (the two-sided test said buys are the weaker side; seven trades say nothing new).
3. Full stops are 29% of April's trades (backtest 8%, live overall 23%).
4. The last four days: the market went sideways inside 1.066-1.085, the 3-day signal shrank and flipped (+151, +54, -25, -80 pips) and I lost 2.07R trading each
   small signal at full size.
5. Income so far is small against the time it takes.
Which one is worth a test?
- (1) is what a trend rule looks like; regime detectors R1-R3 and F1 could not tell the weeks apart beforehand. (2) is tested (SD). (3): exits and stops are tested
  23 ways; the stop-rate difference is under two standard errors. (5) is size, tested on 04-10.
- (4) is the one where my own record is thin: "is a SMALL signal worth trading?" was tested once (idea GAP, 04-02) on JANUARY ONLY, where it had three to five small-gap
  days - and January was the month with the fewest of them. On all history there are 21 days with a gap under 50 pips and 29 with a gap under half the average daily range
  (counted today, occurrences only; 3 / 7 / 3 ... see the test file). February, the range month, has the most. That is the weakness worth one honest test on the full
  history, with January excluded as evidence because its answer is known.
Chosen: weakness 4. Test: journal/2015-idea-SG-small-signal.md (hypothesis and kill test there, written before any run).
