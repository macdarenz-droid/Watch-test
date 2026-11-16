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
