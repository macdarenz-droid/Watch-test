# Idea GS: a grace period for A2's stop (idea 157; coach 09-07: A2's exits on the 4 'stopped then came back by noon' days, ONE exit rule).
Written Mon 2015-09-07 22:00 London, before any code or outcome.
SOURCE: journal/2015-09-04-replay-11-worst-paper-days.md, lesson [C]: 07-08 (stop ~09:30, back near entry by noon), 08-21 (stop before
10:00, back above entry by 13:00), 08-28 (stop ~08:45, back below entry by 11:00), 09-01 (stop ~08:45, back below entry by 10:00).
(Today 09-07 looked the same - stopped, back to about -12 pips by noon - but it came after the list; noted, not used as a source.)
By eye three of the four stops came in the first hour. Tested before and killed: wider stops all day (S50/S60/S80, SA: the pokes are real
but smaller than the price), stop on a candle close (CS), a TIGHTER stop later (TD). Never: a wide stop ONLY in the first hour.

## Hypothesis
The first hour of London sweeps stops around the 08:00 price; a stop that only becomes A2's normal 40 pips after the sweep keeps the
trades that come back, and the wide disaster stop limits the ones that do not. Against it: S80 lost 14-53% of net R; the trades a wider
stop saves are paid for by bigger losses on the ones that keep going.

## THE ONE RULE (GS1, judged) and its two checks, named now
GS1: A2 entry unchanged (08:00 market, size for 40 pips = $125 = 1R). From 08:00 to 09:00 the stop is 80 pips (disaster, -2R).
     At the 09:00 candle the stop moves to A2's normal 40 pips; if price is already beyond it, the trade is closed at that candle's open
     (the engine fills a stop at min/max(open, stop)). Out 12:00 as always.
GS2 (dose): the same with the grace to 10:00.   GS3 (depth): grace to 09:00 with a 60-pip disaster stop.
Base = A2 exactly as traded (stop 40 from the start). R = pnl / $125 in every version (so a disaster stop costs about -2R in GS1).
## KILL LINES (all five must pass, for GS1, paired day by day against base A2). All R after costs: spread 1.0 + slippage 0.1 pips
## (engine default); stressed 2.0 + 0.5.
K1 GS1's average R at least +0.05R above base's.
K2 GS1 minus base, summed, above zero before 04-07 AND from 04-07.
K3 GS1's average at stressed costs at least base's stressed average.
K4 GS1 minus base, paired, sign-flip p < 0.10.
K5 GS1's max drawdown (R) no deeper than base's.
Worked case (written before the run from my M15 chart of 09-01): sell ~1.1283, base stop 1.1323 hit ~08:45; GS1's disaster stop 1.1363
not reached (high about 1.1332); at 09:00 price about 1.1300-1.1310, inside 40 -> stop moves to 1.1323 and is not hit again; noon about
1.1275 -> GS1 about +0.2R where base lost -1.0R. To be checked with the tool before the run.
My guess: GS1 saves the [C] days and loses more on the days that keep going; K5 fails.
