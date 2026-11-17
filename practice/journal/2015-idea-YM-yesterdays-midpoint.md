# Idea YM: the 08:00 price against yesterday's midpoint as the morning's direction (idea 147; coach 08-27: next backtest)
Written Thu 2015-08-27 22:00 London, before any count or outcome.
FREQUENCY CHECK FIRST (plan rule): the 08:00 price is above or below yesterday's midpoint on every day, so YM1 trades about 100% of days
(~160 on this history). The variant with a distance filter must still reach 80.
Searched ("midpoint", "yesterday's mid", "half of yesterday"): C1 (February) used a midpoint FILTER on A2 (failed); H (January) skipped A2 in
the far part of yesterday's range ("no chase", killed). Never: the midpoint as a direction of its own, with no 3-day signal.
Disguise risk is high (above yesterday's middle often means up over the last days, like A2): counted before any outcome; 70%+ either way -> killed.

## Hypothesis
Above yesterday's midpoint at the bell, buyers hold the balance and the morning rises (below: falls). Background, no source I can cite.
Against it: following has lost after 04-07 in almost every form I tested.

## Rule (London time, one trade a day)
Mid = (yesterday's London-day high + low) / 2. At 08:00: open above mid -> BUY, below -> SELL. Stop 40, out 12:00 (A2's frame).
THE THREE VARIANTS (named now): YM1 (judged) every day; YM2 (dose) only when |08:00 open - mid| >= 25% of yesterday's range (it must keep 80+
trades, else reported as too small); YM0 (control) YM1's days traded the other way.
Power (once-a-day): about +-0.17R on ~160 trades; a no-edge rule clears +0.10R about one time in eight. ANY PASS IS PROVISIONAL.
## KILL LINES (four, all must pass, for YM1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 YM1's average R >= +0.10R.
K2 YM1's net R above zero BOTH before 04-07 AND from 04-07.
K3 YM1's average R at stressed costs above zero.
K4 YM1 minus YM0, trade by trade, above zero with sign-flip p < 0.10.
My guess: mostly A2's direction (killed as disguise), or the usual split.

## Counts (before outcomes; `python bt/yesterday_mid.py 2015-08-28 count`, history 2015-01-05..2015-08-27)
YM1: 169 trades (66 before 04-07, 103 from) | buys 84 sells 85 | same side as A2 110 of 168 = 65% -> under the 70% disguise line, goes on.
YM2 (dist >= 0.25): 84 trades (29 / 55) -> clears 80 | same side as A2 56 of 83 = 67%.
Worked case 08-26 (from the tool's check line, no outcome): open 08:00 sits 0.056 of 08-25's range BELOW the mid -> YM1 SELL; YM2 skips (0.056 < 0.25); A2 was a buy that day.
One run next: `python bt/yesterday_mid.py 2015-08-28 run 0.0 0.25`.

## Result (one run; `python bt/yesterday_mid.py 2015-08-28 run 0.0 0.25`; ALL R AFTER COSTS spread 1.0 + slippage 0.1; stressed 2.0 + 0.5)
| variant | trades | wins | avg R | net R | before 04-07 | from 04-07 | stressed avg | on A2's side |
|---|---|---|---|---|---|---|---|---|
| YM1 every day | 169 | 51% | +0.113 (+-0.16) | +19.03 | +7.78 | +11.25 | +0.063 | 65% |
| YM2 dist >= 0.25 | 84 | 55% | +0.161 (+-0.24) | +13.55 | +6.64 | +6.90 | +0.115 | 67% |
| YM0 control (against) | 169 | 40% | -0.105 (+-0.14) | -17.67 | -4.92 | -12.75 | -0.146 | 34% |
Kill lines, each value against its threshold (YM1):
K1 average R >= +0.10R: +0.113R -> PASS (by 0.013R, well inside the +-0.16 noise).
K2 net R above zero before AND from 04-07: +7.78R and +11.25R -> PASS.
K3 stressed average above zero: +0.063R -> PASS.
K4 YM1 minus YM0 above zero with sign-flip p < 0.10: +0.217R, p 0.1229 -> FAIL.
VERDICT: KILLED by K4 (idea 147; variants YM1 YM2 YM0 counted).
Notes, not promoted: positive in both periods, the first follow rule I have seen hold across 04-07, but 65% of its days are A2's side
(where A2 itself lives), so part of this is A2 seen again. YM2 is a dose hint (+0.161R on 84); by the 08-13 rule a hint is not a result.
The script prints 'void at 80%+' for disguise; my prereg line was 70% - 65% is under both, so no conflict in this result.

