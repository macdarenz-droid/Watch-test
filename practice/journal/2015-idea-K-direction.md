# Weakest part of plan v2 + ONE hypothesis (written before any run)
Clock Fri 2015-02-27 22:00 UTC, unchanged. No new candles.

## The weakest part, by my own numbers: the DIRECTION signal
Plan v2 needs about +0.27R per trade (5.3R a month at 0.75% risk). The out-of-sample month gave +0.23R per trade, 4.64R.
Everything in A2 except direction has now been tested and left alone: entry time (A1 vs A2), stop (E1), exit (A3, T1, T2), entry location filters (C1, D1, H1-3, F1, G1).
What has never been tested is the thing that decides buy or sell - "last close vs the close three days earlier":
- It pointed the right way on 79% of January mornings (+34 pips average 08-12 drift) but only 55% of February mornings (+11 pips). 55% is a coin.
- In February it flipped 4 times, and 9 of 20 signals were a gap under 35 pips. I traded them all, and the month's profit hangs on one of those coin flips (#26, +2.14R).
- Both of my worst days (01-19, 02-20) were trades where the signal said one thing and the morning had already shown the other.
So the weakest part of the plan is that in a box month I am paying costs to trade a coin flip for direction.

## ONE hypothesis: idea K "let London pick the side" (ideas -> 10)
Hypothesis: the side on which price leaves the Asia range (00:00-07:00 UTC) in the London morning is a better direction signal for the 08-12 window than my 3-day close rule,
in a box month, without giving up the trend month.
Rule (replaces only the direction/entry trigger; one trade a day, SL 40 pips, close 12:00 UTC, $125, costs on - all as A2):
- K1 (variant 18): watch from 07:00. The first 5-minute candle that CLOSES beyond the Asia high -> buy at the next candle's open; beyond the Asia low -> sell. No break before 12:00 -> no trade.
- K2 (variant 19): the same but watching only from 08:00 (if price is already closed outside the range at 08:00, enter that side at 08:00). Reason: idea G showed a first-hour break
  was a fake 5 times out of 6 in January, so K1 may be trading fakes.
Two variants, no others. The 3-day trend is not used at all. (Idea B = the same break but only WITH the 3-day trend; K asks whether the trend filter was helping or hurting.)

Build - January only, judged with 01-19 removed (I already know K would have won that day). A variant survives only if ALL:
net R >= A2's net R on the same month; avg R >= A2's avg R; max drawdown <= A2's + 0.5R.
If both survive take the higher net R. If none: dead; the one with the higher net R goes to February once, for information only.

Check - February, one run of that one variant, judged with 02-20 removed (the other day I know). Pass only if ALL:
avg R >= A2's + 0.15R; net R >= A2's net R; max drawdown <= A2's.

Contamination label, in advance: February is NOT clean. I know 02-20; I have seen M15 charts of all my February losers with the Asia range visible; and idea G told me on which six
February days the first hour broke against my A2 side. What is new: K's own trades have never been computed. A pass would be weaker than an unseen month; a fail is a real fail.
My expectation, written now: K loses to A2 in January (the trend signal was right 79% of the time there) and so dies on the build. I run it because I do not actually know.
Nothing above has been run.

# RESULTS of idea K (run after commit f271d66). K1 = variant 18, K2 = variant 19; ideas 10. Costs on, $125 risk. One month per run (bt/ab_rule.py).

## Build - January (both variants)
| Rule | Trades | Win rate | Avg R | Net R | Max DD | Same, without 01-19 |
|---|---|---|---|---|---|---|
| A2 before | 19 | 74% | +0.78 | +14.79 | 1.33R | 18 / 78% / +0.88 / +15.79 / 1.00R |
| K1 first break from 07:00 | 18 | 56% | +0.12 | +2.22 | 2.28R | 17 / 53% / +0.11 / +1.92 / 2.57R |
| K2 first break from 08:00 | 18 | 56% | +0.20 | +3.52 | 1.92R | 17 / 53% / +0.19 / +3.23 / 1.92R |
Both fail every line of the build rule (net R, avg R, drawdown). DEAD on the build. In the trend month the first break out of the Asia range was against the trend on 9 of 18 days,
and those were mostly full stops (01-07, 01-14, 01-16, 01-30 as buys in a falling market).
As pre-registered, the one with the higher net R (K2) goes to February once, for information only. K1 was not run on February.

## Check - February (CONTAMINATED, information only; K2 only, one run)
| Rule | Trades | Win rate | Avg R | Net R | Max DD | Same, without 02-20 |
|---|---|---|---|---|---|---|
| A2 before | 20 | 55% | +0.23 | +4.64 | 1.86R | 19 / 58% / +0.30 / +5.66 / 0.83R |
| K2 after | 19 | 53% | +0.08 | +1.57 | 1.82R | 18 / 50% / +0.04 / +0.75 / 1.82R |
FAILS: -0.26R per trade against A2 where +0.15R was needed; net R lower.

## Verdict: KILLED in both months. Not adopted. A2 stays.
- The opposite of what I suspected: my "coin flip" direction rule beat the market's own first break in BOTH months (+0.78 vs +0.20, +0.23 vs +0.08; without the two days I already knew, +0.88 vs +0.19 and +0.30 vs +0.04).
  The 3-day trend filter is doing real work even in the box month. The direction signal is not the weakest part after all - or at least this obvious replacement is much worse.
- It also explains idea B: the break only pays when it is WITH the 3-day trend (B: +0.23 to +0.34R in Feb); the break alone is worth about nothing after costs.
- So plan v2 keeps its direction rule with more confidence than before. That is a result, even though it is not an improvement.
- Counts: ideas 10 (A B C D E H F G T K), variants 19. Attempts to beat frozen A2 since the out-of-sample check: 13 variants, none holds on a month it was not built on.
