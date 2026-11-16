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
