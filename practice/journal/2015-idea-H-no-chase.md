# Idea H "no chase" - one rule change to A2. Written BEFORE any run (committed first as proof).

## The lesson it comes from
Loser review: 10 of 13 losers were entered in the far half of yesterday's range in my trade direction (bought near yesterday's high / sold near yesterday's low).

## The single rule change
A2 exactly as frozen, plus: at 08:00 measure where price sits in YESTERDAY's high-low range, in my trade direction
(pos = 0 at the end I'm trading away from, 1 at the end I'm trading toward; yesterday = last full trading day, Sunday evening counts as Monday).
If pos >= T: no trade that day. Nothing else changes (08:00 market, SL 40, out 12:00, $125).

## Hypothesis
"Chasing" entries (pos high) earn less per trade than the rest, so skipping them raises avg R per trade without raising drawdown.

## Variants (3, all counted; ideas -> 6, variants -> 13)
H1: T = 0.6   H2: T = 0.7   H3: T = 0.8. One parameter, nothing else.

## Process
1. BUILD on January only (trades entered before 02-01). Pick ONE variant by the build rule below.
2. CHECK that one variant on February, once. The other two are not run on February.

## Build rule (January)
A variant survives the build only if, on January: (a) kept-trade avg R > A2's January avg R, (b) skipped trades avg R < kept trades avg R, (c) it keeps >= 60% of A2's trades.
If several survive: take the one with the highest kept avg R. If NONE survives: the hypothesis is already dead on the build month; I still send the least-bad one
(highest kept avg R) to February once, for information only - it cannot be adopted.

## Kill test (February, fixed now)
Adopt only if ALL hold on February: kept avg R >= A2 February avg R + 0.15R; skipped trades avg R <= 0; max drawdown <= A2's; kept trades >= 10. Anything else = killed, A2 stays.

## Honesty notes written in advance
- February is NOT truly untouched for this lesson: the lesson was found on Jan+Feb losers together, and a related filter (D1, pullback day) already ran on Feb.
  So a February "pass" here is weaker evidence than a real unseen month. A February fail is still a real fail.
- I already suspect the build fails: January was a trend, and in a trend the chasing entries won (my #9, +4.27R, was a pos 0.91 sell). I'm running it anyway because that is the test.
- 19-20 trades a month: differences under ~0.3R per trade are noise either way.

# RESULTS (run after the text above was committed, commit 168b28d). Costs on, $125 risk.

## Build - January only
| Rule | Trades | Win rate | Avg R | Net R | Max DD | Skipped trades: n / avg R | Build rule |
|---|---|---|---|---|---|---|---|
| A2 (before) | 19 | 74% | +0.78 | +14.79 | 1.33R | - | - |
| H1 T=0.6 | 12 | 75% | +0.58 | +6.90 | 1.00R | 7 / +1.13 | FAIL (a), (b) |
| H2 T=0.7 | 13 | 77% | +0.55 | +7.18 | 1.00R | 6 / +1.27 | FAIL (a), (b) |
| H3 T=0.8 | 16 | 69% | +0.48 | +7.76 | 1.33R | 3 / +2.35 | FAIL (a), (b) |
No variant survives. In January the "chasing" entries were the BEST trades (01-07 +1.63, 01-08 +1.14, 01-16 +1.10, 01-23 +4.27): in a trend, selling near yesterday's low is just selling the trend.
The hypothesis is dead on the build month. As pre-registered, the least-bad variant (H1, highest kept avg R) goes to February once, for information only.

## Check - February, H1 only, one run (H2 and H3 were not run on February)
| Rule | Trades | Win rate | Avg R | Net R | Max DD |
|---|---|---|---|---|---|
| A2 (before) | 20 | 55% | +0.23 | +4.64 | 1.86R |
| H1 (after) | 10 | 70% | +0.50 | +5.01 | 1.50R |
| trades H1 skipped | 10 | 40% | -0.04 | -0.37 | - |
February kill test on its own: kept avg R +0.50 >= +0.38 yes; skipped avg <= 0 yes (-0.04); drawdown lower yes; kept >= 10 yes (exactly 10). All four pass.

## Both months together
| Rule | Trades | Win rate | Avg R | Net R | Max DD |
|---|---|---|---|---|---|
| A2 (before) | 39 | 64% | +0.50 | +19.43 | 1.86R |
| H1 (after) | 22 | 73% | +0.54 | +11.91 | 1.50R |

## Verdict: KILLED - not adopted. A2 stays.
- It failed the build rule I wrote first, so the February pass does not count for adoption. And February was not truly unseen for this lesson (the lesson came partly from February's losers),
  so its pass is exactly what I should expect from data I had already looked at.
- What the two months do say, clearly and in opposite directions: in the trend month the no-chase filter threw away the best trades (-7.9R); in the box month it removed ten trades worth nothing (-0.4R).
  The lesson "don't chase" is a BOX lesson, not a general one. My loser review was dominated by February (20 of 34 trades, 9 of 13 losers), which is why it looked general.
- So the same wall again: the right entry depends on trend vs box, and I have no tested way to know which I am in at 08:00.
- Counts now: ideas 6 (A B C D E H), variants 13.
