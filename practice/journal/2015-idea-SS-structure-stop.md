# Structure stop: behind the night's extreme instead of a fixed 40 pips? KILL LINES WRITTEN FIRST (nothing has been run)
Clock Fri 2015-04-03 22:00 London (weekend). January only for the build (end date 2015-02-01 given explicitly); costs on; London time. Sample-size rule: journal/2015-sample-size-rule.md.

## Where it comes from
Support and resistance was on my beginner's list in week 1. I have tested stops that are tighter (30), wider (50-80), volatility-scaled, break-even and trailing - every one a
number of pips. I have never tested the stop a chart-reader would use: just beyond the level that would prove the idea wrong - the low of the night for a buy, the high for a sell.
Method-rule check: not a "best N vs worst N" idea; the levels exist on every day.

## Hypothesis
A stop placed just beyond the night's extreme sits where the market has already refused to go, so it is hit less often than a fixed 40 pip stop at the same dollar risk,
giving more net R per unit of drawdown without giving up profit. Counter-case: on most days that level is either so close that noise takes it or so far that the position is small
and every winner is paid in fewer R - which is what the fixed-width tests (S, E, V) already hinted.

## Variants (75, 76, 77; ideas -> 30), no others afterwards. Entry, direction, noon exit and the $125 at the stop exactly A2 (size = $125 / stop distance).
- SS-asia: stop 5 pips beyond the Asia-session extreme (00:00-07:00 London) on the losing side, distance limited to 20-60 pips.
- SS-h7: stop 5 pips beyond the extreme of the 07:00-08:00 hour on the losing side, limited to 15-60 pips.
- SS-night: stop 5 pips beyond the extreme of the whole night (00:00-08:00), limited to 20-60 pips.

## KILL LINES (explicit). Same-trade comparison, judged on drawdown as well as R (score = net R / max drawdown), as for my other stop tests.
Build (January, 19 trades) - a variant survives only if BOTH:
  B1. score >= 1.25 x A2's score;
  B2. net R >= 95% of A2's net R.
  No survivor -> closed. A survivor is NOT trusted and NOT checked on February or March (both seen): under my sample-size rule it earns only a forward paper tag, to be judged after
  100 forward trades (average improvement at least +0.10R per trade and two standard errors).
My guess: no survivor. The night's extreme is usually 15-35 pips away, so these behave like the tighter stop on most days.

# RESULTS of idea SS (run after commit 241accd). SSA/SSH/SSN = variants 75/76/77; ideas 30. January only, costs on, $125 at the stop (bt/ab_score.py, explicit end date).

| Stop | Trades | Win rate | Avg R | Net R (vs A2) | Max DD | Net R / max DD (vs A2) | Full stops | Worst trade |
|---|---|---|---|---|---|---|---|---|
| A2: fixed 40 pips (before) | 19 | 74% | +0.78 | +14.89 | 1.34R | 11.1 | 2 | -1.00R |
| SS-asia: 5 pips beyond the Asia extreme (20-60) | 19 | 63% | +1.18 | +22.39 (150%) | 2.58R | 8.7 (0.78x) | 6 | -1.06R |
| SS-h7: 5 pips beyond the 07-08 hour's extreme (15-60) | 19 | 53% | +1.74 | +33.09 (222%) | 5.24R | 6.3 (0.57x) | 8 | -1.08R |
| SS-night: 5 pips beyond the whole night's extreme (20-60) | 19 | 63% | +1.17 | +22.23 (149%) | 2.58R | 8.6 (0.77x) | 6 | -1.06R |

## Kill lines, applied
- B2 (net R at least 95% of A2's): all three pass - by a lot.
- B1 (net R / max drawdown at least 1.25 x A2's): 0.78x, 0.57x, 0.77x -> all three FAIL. More profit, but much more drawdown per unit of it.
=> NO SURVIVOR. Closed. Nothing was run on February or March.

## Reading it honestly - this is the most tempting "failure" I have had, so slowly
- The headline is seductive: +22R to +33R in January instead of +15R. It is not a better rule. These stops are simply TIGHTER on most days (the night's extreme is usually
  15-30 pips away), so the same $125 buys a bigger position. In a month where the rule's direction was right 79% of mornings, a bigger position makes more. That is leverage.
- And it is the expensive kind of leverage: full stops go from 2 to 6-8 of 19, the win rate falls from 74% to 53-63%, and the drawdown doubles to quadruples (5.24R for SS-h7
  is 2.6% of the account at my funded size, in the BEST month I have). Per unit of drawdown it earns less than the plain rule (0.57x-0.78x).
- If I wanted more return and accepted more drawdown, raising the risk per trade on the plain rule would buy it at a better exchange rate - and I have already decided, with
  reasons, not to do that in a funded account. A tighter stop is the same decision in disguise, and it does not pass my line.
- It also explains E1 (the 30 pip stop) in the sample-size note: its +0.12R per trade over 64 trades is the same leverage effect, with a bigger drawdown in both months I tested
  it on. So my question to my coach about carrying E1 as a paper tag now has my own answer attached: it would be tagging leverage, not edge. I would not adopt it for a funded
  account even if 100 forward trades confirmed the +0.12R, unless its drawdown per unit of return also beat A2's.
- January is the friendliest month I own. In a box month tighter stops lost (E1 and V in February). I did not run February or March here and will not.
- Counts: ideas 30, variants 77.
