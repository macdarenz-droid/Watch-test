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

# RESULTS of idea Q (run after commit 497148b). Q1/Q2/Q3 = variants 30/31/32; ideas 15. Costs on, $125 risk. Jan-Feb only, one month per run (bt/ab.py); March not used.
Handling decided when I saw it (not pre-registered, so stated): Q3 needs five earlier Asia sessions and cannot label 01-06..01-12. Those five days are left out for BOTH rules in Q3's rows
(same treatment as F1), otherwise they would count as "skipped" for a reason that has nothing to do with a dead night.

## Build - January
| Rule | Trades | Win rate | Avg R | Net R | Max DD | Skipped (n / avg R) | Without 01-23: kept avg vs A2 avg | Build |
|---|---|---|---|---|---|---|---|---|
| A2 before (all days) | 19 | 74% | +0.78 | +14.79 | 1.33R | - | - | - |
| Q1 Asia < 20 pips | 19 | 74% | +0.78 | +14.79 | 1.33R | 0 | same | FAIL: skips nothing in January |
| Q2 Asia < 25 pips | 17 | 82% | +0.95 | +16.22 | 1.00R | 2 / -0.71 (01-09, 01-19) | +0.75 vs +0.58 | FAIL: skips only 2 (needed 3) |
| A2 before (days Q3 can label, from 01-13) | 14 | 71% | +0.71 | +9.88 | 1.33R | - | - | - |
| Q3 Asia < 0.8 x 5-day average | 10 | 90% | +1.14 | +11.38 | 0.51R | 4 / -0.38 (01-19, 01-27, 01-29, 01-30) | +0.79 vs +0.43 | SURVIVES: +0.43R better, skipped worse than kept, 4 skipped, keeps 71% |
Candidate: Q3. (As predicted, the fixed-pip versions cannot be built on January: its nights were almost never that narrow.)

## Check - February (CONTAMINATED)
| Rule | Trades | Win rate | Avg R | Net R | Max DD | Skipped (n / avg R) | Keeps |
|---|---|---|---|---|---|---|---|
| A2 before | 20 | 55% | +0.23 | +4.64 | 1.86R | - | - |
| Q3 (the candidate) | 9 | 56% | +0.46 | +4.10 | 0.65R | 11 / +0.05 | 45% |
| Q1 (not a candidate, shown only) | 11 | 55% | +0.44 | +4.89 | 0.65R | 9 / -0.03 | 55% |
| Q2 (not a candidate, shown only) | 10 | 50% | +0.36 | +3.63 | 0.65R | 10 / +0.10 | 50% |
Q3 against its February test: kept avg R +0.46 >= +0.38 YES; max drawdown 0.65R <= 1.86R YES; skipped trades avg <= 0R NO (+0.05R); keeps >= 60% NO (45%). FAILS on two lines.
Extra look, not in the test: without February's biggest day (02-17) Q3 is +0.24R vs A2 +0.13R.

## Verdict: Q3 KILLED by its February check. Not adopted, no forward paper tag (that was reserved for a pass). A2 stays.
- What it does is consistent and real-looking but not what I hypothesised: in February it drops 11 trades that together made about nothing (+0.54R) and keeps the same profit in 9 trades.
  Avg R doubles and drawdown falls from 1.86R to 0.65R, but net R does not rise (4.10 vs 4.64), and the trades it removes are not losers - they are zeros.
  "A dead night makes a dead morning" is roughly true; "a dead morning loses money" is not. Skipping zeros does not get me to +5% any sooner; it only makes the ride smoother.
- That is the third filter with exactly this shape (F1, W in February, now Q): fewer trades, same total, smaller drawdown. Worth knowing as a PATTERN: if I ever need less drawdown
  rather than more profit (for example to carry a bigger size), this family is where to look - but that would be its own pre-registered question, with drawdown as the stated goal.
- January's pass rests on 4 skipped trades; both months were peeked at before I wrote the test. Weak evidence either way; the kill stands.
- Variants Q1, Q2, Q3 closed. Counts: ideas 15, variants 32.
