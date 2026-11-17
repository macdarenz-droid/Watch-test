# Idea QB: after a QUIET pre-bell hour, follow the first break of that hour's box (idea 149; coach 08-28: next backtest from my notes)
Written Fri 2015-08-28 22:00 London, before any count or outcome.
FROM MY NOTES: today (08-28) the 07:00-08:00 hour was quiet (18.2 pips) and price left it fast (40+ pips up inside 45 minutes). My PH2 line
splits every day into lively (30+) and quiet hours; I have only ever asked what LIVELY hours do (PH, LM, BH, LD). Lesson from XD written
yesterday: take the next idea from something A2 does not read - this reads only time of day and size, not the 3-day direction.
Searched ("box", "pre-entry hour", "07:00-08:00", "Asia range", "quiet"): B (January) broke the 00:00-07:00 Asia range WITH the trend;
MB/MB1/BX use the 12:00-13:25 box; MB2 the 07:00-11:00 box in the afternoon; BK the night box after a big day; BS looked at a pre-hour
break-out start on best days only. Never: the 07:00-08:00 box, quiet days only, no trend, traded 08:00-10:00.

EXPECTED SAMPLE FIRST (once-a-day rule: 80+ trades, 35+ from 04-07): PH2's tally has 35 quiet of 86 days since its start (~40%);
on the whole history I guess ~45-55% of days are quiet at 30 pips, and most quiet boxes break by 10:00 -> ~70-85 trades at Q = 30.
It may well FAIL the sample line. Rule for Q written now: counts at Q = 20 / 25 / 30 pips; Q = the SMALLEST that gives 80+ trades with
35+ from 04-07; if none does, killed for sample with no outcome run.

## Hypothesis
A quiet hour before the bell means orders are waiting; the first break out of that hour's box at the London open starts the morning's move.
Background, no source I can cite. Against it: B and MB2 were follow-the-break rules and died; follow rules split at 04-07.

## Rule (London time; one trade a day)
Box = high and low (bid M5) of 07:00-08:00. Quiet = box range <= Q pips. Break = the first M5 candle from 08:00 to 10:00 that CLOSES above
the box high (BUY) or below the box low (SELL); entry at the next M5 open; stop 20 pips; out 12:00. No break by 10:00 -> no trade.
THE THREE VARIANTS (named now): QB1 (judged) box <= Q; QB2 (dose) box <= 2/3 of Q; QB0 (control) QB1's trades the other way.
Power (once-a-day): about +-0.20R on ~80 trades; a no-edge rule clears +0.10R roughly one time in five. ANY PASS IS PROVISIONAL.
## KILL LINES (four, all must pass, for QB1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 QB1's average R >= +0.10R.
K2 QB1's net R above zero BOTH before 04-07 AND from 04-07.
K3 QB1's average R at stressed costs above zero.
K4 QB1 minus QB0, trade by trade, above zero with sign-flip p < 0.10.
Plus the sample line (above) and the disguise line (QB1 on A2's side 70%+ -> killed), both on counts before the run.
My guess: a coin minus costs (a 20-pip stop pays 1.1 pips of costs = 0.055R a trade before anything else).

## Counts (before outcomes; `python bt/quiet_box.py 2015-08-29 count`, history 2015-01-02..2015-08-28)
171 days; quiet (box <= 30): 89; of those, broke by 10:00: 84.
Q = 20: 38 trades (23 / 15) | Q = 25: 63 (36 / 27) | Q = 30: 84 (46 / 38).
BY THE RULE WRITTEN FIRST: Q = 30 (smallest with 80+ and 35+ from 04-07). QB2 = 2/3 x 30 = 20 -> 38 trades (dose only).
DISGUISE: QB1 on A2's side 39 of 82 = 48% -> passes (under 70%). Not A2.
Worked case 08-28 (tool's check line; my hand reading of the hour was 1.12519-1.12701 = 18.2 pips, the same): box 18.2 -> quiet;
first M5 close above the box -> BUY, entry at the 08:20 London open; A2 sold that day. Note: 08-28 is the day that gave me the idea and it
is inside this history (1 trade of 84); I do not drop it, and I name it here.
One run next: `python bt/quiet_box.py 2015-08-29 run 30 20`.

## Result (one run; `python bt/quiet_box.py 2015-08-29 run 30 20`; ALL R AFTER COSTS spread 1.0 + slippage 0.1; stressed 2.0 + 0.5)
| variant | trades | wins | avg R | net R | stops | before 04-07 | from 04-07 | stressed avg | on A2's side |
|---|---|---|---|---|---|---|---|---|---|
| QB1 follow, box <= 30 | 84 | 42% | +0.035 (+-0.29) | +2.92 | 40 | +0.75 | +2.16 | -0.052 | 46% |
| QB2 box <= 20 (dose) | 38 | 47% | +0.103 (+-0.43) | +3.93 | 16 | +5.73 | -1.80 | +0.028 | 45% |
| QB0 fade (control) | 84 | 35% | -0.041 (+-0.36) | -3.44 | 47 | +1.26 | -4.70 | -0.121 | 51% |
Kill lines, each value against its threshold (QB1):
K1 average R >= +0.10R: +0.035R -> FAIL.
K2 net R above zero before AND from 04-07: +0.75R and +2.16R -> PASS.
K3 stressed average above zero: -0.052R -> FAIL.
K4 QB1 minus QB0 above zero with p < 0.10: +0.076R, p 0.790 -> FAIL.
VERDICT: KILLED (K1 K3 K4). Idea 149; variants QB1 QB2 QB0 counted.
Reading: a quiet hour's break is a coin; the 20-pip stop's costs (1.1 pips = 0.055R) eat what little there is. QB2's dose is all before
04-07 and negative after: the usual follow shape, not promoted. The day that gave me the idea (08-28) was one trade of 84.
