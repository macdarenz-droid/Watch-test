# All 39 A2 trades by eye at the entry + ONE observation turned into a test (written before any run)
Clock Fri 2015-03-06 22:00 UTC (end of released data; phase 2 starts Monday). Jan-Feb only (END <= 2015-03-01); March is not used.
Charts: bt/entry_charts.py - M15 of every mechanical A2 trade, previous day 07:00 up to the candle BEFORE the 08:00 entry (nothing after the decision is drawn). Three sheets: best 5 + worst 5, and the other 29.

## Best 5 at entry
| Trade | What the chart showed before 08:00 |
|---|---|
| Fri 01-23 sell +4.27R | huge down day before; the night made a wide (59 pip) shelf with a late new low and a small pop into 08:00 |
| Tue 02-17 buy +2.14R | sharp fall the day before, then a lively night: 45 pip recovery in swings, small dip into 08:00 |
| Thu 01-15 sell +2.06R | spike-and-fade day before; night drifting down in a 30 pip band, small pop into 08:00 |
| Wed 01-07 sell +1.63R | down day before; night flat-ish, then the 07-08 hour popped UP through the Asia high - I sold the pop |
| Tue 01-13 sell +1.39R | whippy day before; night swinging 40 pips, a 30 pip rally into 08:00 - I sold the rally |
## Worst 5 at entry
| Trade | What the chart showed before 08:00 |
|---|---|
| Fri 02-20 buy -1.02R | slow all-day slide before; night a dead 17 pip pancake; 07-08 slipped under it |
| Tue 01-27 sell -1.00R | strong up day before; night a quiet shelf held near the highs |
| Mon 01-19 sell -1.00R | V-bounce the day before; night a dead 22 pip pancake; 07-08 poked above it |
| Wed 01-21 sell -0.51R | down day before; night rallied 45 pips the wrong way, then dropped 20 in the last half hour - I sold the bottom of that drop |
| Wed 02-18 buy -0.47R | up day before; night a dead 20 pip pancake drifting down into 08:00 |

## What they share
- Best five: the night before had LIFE - swings of 30-60 pips, price visibly travelling - and in four of five the last hour moved a little AGAINST my side, so I got a slightly better price.
- Worst five: three of five came out of a pancake-flat night (17-22 pips) where nothing had happened for seven hours; the other two had the night moving against my side.
- Across the other 29 the same thing shows, less sharply: the February scratches and small losers (02-06, 02-13, 02-27, 02-19) are mostly entries out of a dead-flat line;
  the January winners mostly come after a night that moved.
- Things I looked for and did NOT see: no consistent difference in where the entry sits in yesterday's range (tested: H), in first-hour direction (tested: G, and my h7 table),
  or in yesterday's direction (tested: D).
- This contradicts something I wrote in the winners review ("all five biggest winners started from a quiet Asia shelf"). Measured, those shelves were 26-59 pips; the losers' were 17-22.
  I was calling 40 pips "quiet". Eyes need a ruler.

## The one observation -> the test: idea Q "a dead night makes a dead morning" (ideas -> 15)
Hypothesis: when the Asia session (00:00-07:00 UTC) was unusually narrow, the London morning does not travel far enough for A2 to pay (costs and a 40 pip stop stay the same), so those days
have lower expectancy; skipping them raises avg R without lowering net R.
Rule change (single): A2 exactly as frozen, plus: no trade if the Asia range is "dead". Three definitions = variants 30, 31, 32:
- Q1: dead = Asia range under 20 pips.
- Q2: dead = Asia range under 25 pips.
- Q3: dead = Asia range under 0.8 x the average Asia range of the previous 5 trading days (relative, so it adapts to quiet and wild months).
No other numbers afterwards.

Build - January, judged with the month's biggest day (01-23) removed as well. A variant survives only if ALL: kept avg R >= A2's + 0.05R; skipped avg R < kept avg R;
it skips at least 3 trades; it keeps at least 60% of A2's trades. Highest kept avg R among survivors = the candidate. No survivor -> closed, nothing can be claimed.
Check - February (CONTAMINATED), all three shown, only the candidate can be claimed: kept avg R >= A2's + 0.15R; skipped avg R <= 0; max drawdown <= A2's; keeps >= 60%.

## Honesty notes, in advance
- BOTH months are contaminated for this idea, more than usual: while reading the charts I added up my LIVE trades by Asia range from the feature table I already had
  (range of 22 pips or less: 11 trades, about 0R in total; wider: 23 trades, about +0.64R each). So I have effectively peeked at a 22 pip cut on both months before writing this.
  That is why the variants are 20, 25 and a relative one rather than 22, and why a pass here would earn only a forward paper tag, never a rule change.
- Expected problem: January nights were rarely that narrow, so Q1/Q2 may skip fewer than 3 January trades and fail the build on that line alone. If so, the honest reading is
  "cannot be built on January", not "works".
- Dead nights were common in February and rare in January, so this may just be idea R (regime) again under another name.
Nothing above has been run.
