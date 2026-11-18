# The check I promised on 04-17: does A2 work when the two-week trend is UP? HYPOTHESIS AND KILL LINES WRITTEN BEFORE ANY RESULT
Clock Wed 2015-05-06 01:00 London (end of released data). All lived history 01-06 .. 05-05 (explicit end 2015-05-06); costs on.

## Why now
In the two-sided test (04-17) I wrote: "this rules out the disaster case; it does not prove independence from the big trend. Only a period in which the euro RISES can
show that... I will know more when the 10-day trend has been up for 40 or so trades." Since 04-13 the euro has gone from 1.052 to 1.12 [D1 bars of this morning's look:
04-13 low region and 05-05 close 1.11848 on the H1 print; the exact low is read by the script]. Counted today, occurrences only: the 10-day trend (last 22:00 close above
the close 10 trading days earlier) was UP on 30 signal days (19 buy signals, 11 sell signals; February 12, March 6, April 8, May 4) and DOWN on 48; 9 early days undefined.
Thirty is the sample my coach asked for as a minimum, and it is the first time I have it. It is not the 40 I named; I say that plainly and run it at 30.

## What I already know (contamination)
- 04-17: trades WITH the 10-day trend +0.405R (39), AGAINST it +0.345R (26) - that split is by agreement of my side with the trend, not by the trend's direction.
- February (12 of the 30 up days) was my weak month: +0.23R per trade, buys +0.07R. So I expect the up-trend days to be clearly below the down-trend days.
- I have not computed anything by the DIRECTION of the 10-day trend.

## Hypothesis
A2's edge does not need a falling euro: on days when the 10-day trend is up, the rule earns a real positive expectancy, on its with-trend side (buys) as well.

## KILL LINES (explicit). "Killed" = the edge so far depends on the falling market. No trade variants: this is a health check of my one rule (idea 52, one split = variant 141).
The hypothesis survives only if ALL:
  U1. average R on up-trend days at least +0.10R (my rule-alarm floor);
  U2. at least one third of the average on down-trend days;
  U3. net R positive in BOTH halves of the up-trend days taken in date order (first 15, last 15) - it must not rest on one stretch;
  U4. on up-trend days the BUY signals (the with-trend side) are net positive.
Consequences, written now: survives -> one sentence in the plan, with the sample size. Killed -> no rule change (30 days cannot carry one); the plan gets a RISK line
"no evidence yet that the rule earns in a rising two-week trend", the weekly journal tracks R by 10-day-trend direction, and I tell my coach.
My guess: up-trend days about +0.25R against about +0.5R on down-trend days; U1 and U2 pass; U3 is the doubtful one (February's half may be about zero); U4 passes narrowly.

# RESULTS (kill lines above pushed in commit 5a3ac85 before any result; label checked on 05-05: previous close 1.11454 above the close of 04-20, 1.07374 -> trend up;
one run: `python bt/trend_dir.py 2015-05-06`; every figure below is copied from its output)
86 A2 trades 01-06..05-05, engine, full costs. 9 early days have no 10-day trend yet. (My count above said 30 up-trend signal days; one of them is not a trade day: 29.)

| | trades | win rate | avg R | net R | buy signals | sell signals |
|---|---|---|---|---|---|---|
| 10-day trend UP | 29 | 69% | +0.375 | +10.87 | 19 trades, 58% wins, +0.301R, +5.72R | 10 trades, 90% wins, +0.515R, +5.15R |
| 10-day trend DOWN | 48 | 54% | +0.307 | +14.75 | 18 trades, 50% wins, +0.152R, +2.74R | 30 trades, 57% wins, +0.401R, +12.02R |
Difference down minus up: -0.067R (two standard errors +-0.46R): none.
Up-trend days in date order: first 14 (02-06 .. 03-25): +0.500R, +7.00R | last 15 (03-26 .. 05-05): +0.258R, +3.87R.
By month: February 12 trades +0.447R | March 6 trades +0.351R | April 8 trades +0.388R | May 3 trades +0.097R.

## Kill lines applied
- U1 (up-trend average at least +0.10R): +0.375 -> PASS.
- U2 (at least a third of the down-trend average, +0.102): PASS.
- U3 (both halves of the up-trend days positive): +7.00R and +3.87R -> PASS.
- U4 (buy signals on up-trend days net positive): +5.72R on 19 trades -> PASS.
THE HYPOTHESIS SURVIVES all four lines: on my history the rule has earned as much in a rising two-week trend as in a falling one.

## My guess against what happened
I guessed up-trend days at about +0.25R against +0.5R for down-trend days. They are +0.375R against +0.307R. Wrong on both numbers and on the order. Two reasons, read
from the table: February's up-trend days were good (+0.447R) - my "weak February" was its down-trend days; and the best January trades fall in the 9 days that have no
10-day trend yet, so they are in neither group.

## What I learned, and what I must not over-read
- The fear behind the two-sided test - "this is just a short-euro bet" - gets a second, better answer: 29 trades in a rising two-week trend, +0.375R, positive in
  every month that has them, on both sides (in a rising trend even the SELL signals, the pullback trades, won 9 of 10).
- Not over-read: 29 trades, known to about +-0.4R; the smaller cells have 10 to 19 trades. This rules out "it only works going down" on my history. It is not a
  forecast for a long rising market: the longest up stretch here is three weeks.
- Buy signals are the weaker side in both regimes (+0.30R and +0.15R against +0.52R and +0.40R for sells). That is consistent with the 04-17 finding and still inside
  the noise; I keep the running count by side.
- Per the consequences written beforehand: nothing changes; one sentence goes into the plan.
Counts: ideas 52, variants 141.
