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
