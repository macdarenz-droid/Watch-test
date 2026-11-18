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

## Worked cases from the tool (pasted by this command; before the run)
    2015-09-01 side -1 | engine A2 R -1.00
    base A2 (stop 40 from 08:00) (-1.0033920000000336, 'sl', 1.12829, 1.1323100000000001, '08:45')
    GS1 grace to 09:00, disaster 80 (-1.0008960000000173, 'sl', 1.12829, 1.1323, '09:00')
    GS2 grace to 10:00, disaster 80 (0.26207999999999887, 'close', 1.12829, 1.12724, '12:00')
    GS3 grace to 09:00, disaster 60 (-1.0008960000000173, 'sl', 1.12829, 1.1323, '09:00')
    2015-07-08 side -1 | engine A2 R -1.00
    base A2 (stop 40 from 08:00) (-1.0033920000000336, 'sl', 1.10144, 1.10546, '08:55')
    GS1 grace to 09:00, disaster 80 (-1.0008960000000173, 'sl', 1.10144, 1.10545, '10:10')
    GS2 grace to 10:00, disaster 80 (-1.0008960000000173, 'sl', 1.10144, 1.10545, '10:10')
    GS3 grace to 09:00, disaster 60 (-1.0008960000000173, 'sl', 1.10144, 1.10545, '10:10')
    2015-08-21 side +1 | engine A2 R -1.03
    base A2 (stop 40 from 08:00) (-1.0283520000000308, 'sl', 1.12825, 1.1241299999999999, '09:05')
    GS1 grace to 09:00, disaster 80 (-1.0008960000000173, 'sl', 1.12825, 1.12424, '09:00')
    GS2 grace to 10:00, disaster 80 (0.26207999999999887, 'close', 1.12825, 1.1293, '12:00')
    GS3 grace to 09:00, disaster 60 (-1.0008960000000173, 'sl', 1.12825, 1.12424, '09:00')
    2015-08-28 side -1 | engine A2 R -1.00
    base A2 (stop 40 from 08:00) (-1.0033920000000336, 'sl', 1.12638, 1.1304, '08:55')
    GS1 grace to 09:00, disaster 80 (-1.0008960000000173, 'sl', 1.12638, 1.13039, '09:00')
    GS2 grace to 10:00, disaster 80 (-0.42681600000002506, 'close', 1.12638, 1.12809, '12:00')
    GS3 grace to 09:00, disaster 60 (-1.0008960000000173, 'sl', 1.12638, 1.13039, '09:00')
MY WORKED CASE WAS WRONG: on 09-01 price was still 40+ pips against at 09:00 London, so GS1 closes it at 09:00 (-1.00R), not +0.2R.
I misread my own M15 chart. On the four [C] days GS1 saves NONE (all still beyond 40 at 09:00, or stopped later: 07-08 at 10:10);
GS2 (grace to 10:00) saves 09-01 and 08-21 (+0.26R each) and cuts 08-28 to -0.43R. The judged rule stays GS1 as registered.
One run next: `python bt/grace_stop.py 2015-09-05 run` (history to 09-04; the base line must match the engine's A2 list).

## Result (one run; ALL R AFTER COSTS spread 1.0 + slippage 0.1; stressed 2.0 + 0.5; tool output pasted by this command)
    A2 days 174 (2015-01-06..2015-09-04); before 2015-04-07: 65, from: 109
    base A2 (stop 40 from 08:00): avg +0.151R | net +26.25 | before 2015-04-07: +31.96 | from: -5.71 | stressed avg +0.104 | max DD 12.45R | worst trade -1.03R | mechanics: engine A2 net +26.25, largest day difference 0.000R
    GS1 grace to 09:00, disaster 80: avg +0.134R | net +23.35 | before 2015-04-07: +29.64 | from: -6.29 | stressed avg +0.092 | max DD 13.46R | worst trade -2.03R | minus base -0.017R (before -2.32, from -0.58), p 0.2171, days changed 46 | K1 FAIL K2 FAIL K3 FAIL K4 FAIL K5 FAIL
    GS2 grace to 10:00, disaster 80: avg +0.144R | net +25.05 | before 2015-04-07: +30.58 | from: -5.52 | stressed avg +0.099 | max DD 14.38R | worst trade -2.03R | minus base -0.007R (before -1.39, from +0.19), p 0.7426, days changed 45 | K1 FAIL K2 FAIL K3 FAIL K4 FAIL K5 FAIL
    GS3 grace to 09:00, disaster 60: avg +0.141R | net +24.48 | before 2015-04-07: +29.96 | from: -5.48 | stressed avg +0.096 | max DD 12.65R | worst trade -1.53R | minus base -0.010R (before -2.00, from +0.23), p 0.3475, days changed 46 | K1 FAIL K2 FAIL K3 FAIL K4 FAIL K5 FAIL
    (all R after costs 1.0 + 0.1; stressed 2.0 + 0.5; 1R = $125 = 40 pips) script reached its end
Kill lines, each value against its threshold (GS1), read from the lines above:
K1 GS1 average at least +0.05R above base: -0.017R -> FAIL.
K2 GS1 minus base above zero before AND from 04-07: -2.32 / -0.58 -> FAIL.
K3 stressed average at least base's: +0.092 vs +0.104 -> FAIL.
K4 paired p < 0.10 with a positive difference: -0.017R, p 0.217 -> FAIL.
K5 max drawdown no deeper than base: 13.46R vs 12.45R -> FAIL.
VERDICT: KILLED on all five (idea 157; variants GS1 GS2 GS3 counted). GS2 and GS3 are also below base and deeper in drawdown.
The base line matches the engine's A2 list exactly (net +26.25R, largest day difference 0.000R).
Reading: the 'stopped then came back' days are real, but a wide early stop pays for them with -2R days on the mornings that keep going
(worst trade -2.03R). It is the S80 result again, now limited to the first hour: the 40-pip stop at 08:00 is not where A2 leaks.
