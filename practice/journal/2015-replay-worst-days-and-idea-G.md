# Replay of my 2 worst losing days + ONE new hypothesis (written before any run)
Clock Fri 2015-02-27 22:00 UTC, unchanged. Charts drawn with chart.py's plot on history windows (H1: 6 days of context; M15: the night before + the day). No new candles.
Worst two by R: #29 Fri 02-20 buy -1.02R, #6 Mon 01-19 sell -1.00R. (#11 Tue 01-27, -0.99R, was already replayed in 2015-W05-replay.md.)

## #6 - Mon 2015-01-19, SELL 08:00 @1.15589, stopped 09:23 (-1.00R)
What the chart shows before 08:00:
- H1: Friday's fall ended in a long-tailed candle to 1.1460 and a 110 pip V-bounce into the close. Monday's Asia did not give any of it back: flat 1.1552-1.1574 for seven hours.
- M15: at 06:45-07:15 price pushed UP out of that flat Asia range (above 1.1574, to 1.1582). 07:30-08:00 it dipped back to 1.1552-60. I sold that dip at 08:00.
  From 08:15 it went straight up through the Asia high to 1.1628 in 75 minutes.
What a better trader would have done:
- Read the first London hour as information: the market's first decision of the day was to break the Asia HIGH. A seller needs the opposite - a break of the Asia low (1.1552). It never came.
- So: no sell at 08:00. Either stand aside, or leave a sell-stop under 1.1552 that never fills. Cost of being wrong about this: zero.
- Not "buy the breakout": the D1 trend was down and I have no tested rule for that.

## #29 - Fri 2015-02-20, BUY 08:00 @1.13566, stopped 09:07 (-1.02R)
What the chart shows before 08:00:
- H1: Thursday rejected 1.1450 for the fourth time and fell 95 pips; every hour since made a lower high. My "trend up" was a 15 pip difference between two closes inside a box.
- M15: Asia sagged in a 17 pip range (1.1355-1.1372). At 06:15-07:15 price broke DOWN out of it to 1.1340; 07:30-08:00 it bounced back to 1.136. I bought that bounce at 08:00.
  It rolled over at once: 1.1325 by 08:15, 1.1304 by 09:00 (low of day 1.1279 at 13:00, then a 150 pip rip up in NY - too late for me).
What a better trader would have done:
- Same reading, mirrored: London's first move broke the Asia LOW. A buyer needs a break of the Asia high (1.1372). Stand aside until then; it never came before noon.
- And would have noticed four failures at one ceiling the day before: buying under it needed more than a coin-flip signal.

## What the two days share (one thing, not five)
In both, BEFORE my 08:00 entry, price had already broken out of the Asia range on the side AGAINST my trade, and I entered on the small pullback from that break.
I traded my 3-day opinion against what the session itself had just shown.
Caution written now: A2 was born from the opposite observation ("the first London hour is often a fake", e.g. Wed 01-07, where an up-spike through the Asia high preceded a 95 pip fall).
So I honestly do not know which is more common. That is why it is a test and not a rule.

## ONE hypothesis: idea G "don't fight the first break" (variant G1 = variant 15; ideas -> 8)
Rule change (single, no parameter to tune): A2 exactly as frozen, plus: Asia range = high/low of 00:00-07:00 UTC of the trade day. If during 07:00-08:00 price traded beyond the Asia
extreme AGAINST my direction (above the Asia high when I am to sell / below the Asia low when I am to buy), no trade that day. Everything else unchanged (08:00 market, SL 40, out 12:00, $125).
Hypothesis: those days have lower expectancy than the rest, so skipping them raises avg R AND does not lower net R.
One variant only. No thresholds, no second definition of the range, no rescue.

Build - January only. G1 survives only if ALL: kept avg R > A2 avg R; skipped avg R < kept avg R; it skips at least 3 trades (else it is a one-day rule); it keeps >= 60% of A2's trades;
and all of that still holds with 01-19 (the day that inspired it) removed from the month. If it fails: dead; February is run once for information only and it cannot be adopted.

Check - February, one run. Judged with 02-20 (the other inspiring day) REMOVED. Pass only if ALL: kept avg R >= A2 avg R + 0.15R; skipped trades avg R <= 0 (so net R does not fall);
max drawdown <= A2's; kept >= 60% of A2's trades.

Contamination label, written in advance: February is NOT clean for this idea. One of the two days it comes from is a February day, and I have looked at M15 charts of every loser
and 8 winners with the 07:00 line drawn. What IS new: I have never measured "first-hour break against me" on any day. Removing the two inspiring days from the judging is my attempt
to keep the test honest; a pass would still be weaker than an unseen month, a fail is a real fail.
Nothing above has been run.
