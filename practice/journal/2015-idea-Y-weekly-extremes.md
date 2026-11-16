# New concept: where in the week the weekly high and low form (Jan-Feb) + ONE test (written before any run)
Clock Wed 2015-03-18 00:00 UTC (end of released data). Jan-Feb only; March not used. Eight full weeks - a very small history; everything below is "8 cases", not a law.
"Mon" includes Sunday evening (the week's first hours).

## The study (H1, weeks of 01-05 to 02-23)
| Week of | Week went | Range | Weekly HIGH: day, hour UTC, session | Weekly LOW: day, hour UTC, session | Mon+Tue range |
|---|---|---|---|---|---|
| 01-05 | down -109 | 222 | Mon 08:00 London | Thu 12:00 NY | 108 |
| 01-12 | down -283 | 411 | Mon 06:00 Asia | Fri 15:00 NY | 118 |
| 01-19 | down -349 | 565 | Wed 14:00 NY | Fri 12:00 NY | 98 |
| 01-26 | up +133 | 325 | Tue 15:00 NY | Mon (Sun 23:00) | 325 |
| 02-02 | up +2 | 242 | Tue 18:00 late | Mon 06:00 Asia | 242 |
| 02-09 | up +92 | 172 | Fri 08:00 London | Mon 12:00 NY | 89 |
| 02-16 | down -22 | 171 | Thu 09:00 London | Fri 13:00 NY | 130 |
| 02-23 | down -194 | 220 | Mon (Sun 22:00) | Fri 14:00 NY | 108 |

What it shows:
1. The end the week STARTS from (the high of a down week, the low of an up week) was made on Monday in 6 of 8 weeks. The other end (where the week finishes up) was made on Friday in 5 of 8.
   A week mostly travels away from Monday.
2. The weekly LOW was made in the New York session 6 times of 8 - after 12:00 UTC, when I am flat. The weekly high is spread over all sessions.
3. Monday and Tuesday together cover 59% of the week's range on average, but that is two kinds of week: three weeks did everything early (100%, 100%, 76%), five did most of it later (17-52%).
What it means for a London-morning trader (my reading):
- On Monday morning I am trading while one end of the week is being built, on a direction signal made entirely from LAST week's closes.
- From Tuesday on, "which side of the week's opening price are we on?" is information my 3-day rule does not use. Price relative to the week's open is a common-sense bias I have never tested.
- I will never catch the weekly low in a down week from 08:00-12:00: it comes in New York. That fits the exit tests (holding past noon helped only in the trend month) - nothing new to test there.

## The test: idea Y "which side of the week's open?" (ideas -> 20)
Hypothesis: the side of the week's opening price that London trades on at 08:00 tells the direction of the morning at least as well as my 3-day rule, and when the two disagree the
A2 trade is weak.
Variants (45, 46, 47), no others afterwards. Everything else exactly A2 (08:00 market, SL 40, out 12:00, $125, costs on):
- Y1 (replace the direction): buy if the 08:00 price is above the week's first price (Sunday open), sell if below. All five days.
- Y2 (Monday's range): Tuesday-Friday only; sell if the 08:00 price is below Monday's low, buy if above Monday's high; inside Monday's range no trade.
- Y3 (agreement filter): the A2 trade, taken only when A2's side agrees with Y1's side; otherwise no trade.

Kill tests (fixed now):
Build - January. Y1 and Y2 are rules with their own direction: survive only if net R >= A2's, avg R >= A2's, max drawdown <= A2's + 0.5R (same bar as idea K).
  Y3 is a filter: survives only if kept avg R >= A2's + 0.05R, skipped avg R < kept avg R, it skips at least 3 trades and keeps at least 60%.
  If more than one survives, the candidate is Y3 if it survived (it changes least), else the higher net R.
Check - February (CONTAMINATED), all three shown, only the candidate claimed. Y1/Y2: avg R >= A2's + 0.15R, net R >= A2's, max drawdown <= A2's.
  Y3: kept avg R >= A2's + 0.15R, skipped avg R <= 0, max drawdown <= A2's, keeps >= 60%.
What a pass earns: a forward paper tag. Nothing else.

## Labels and guesses, in advance
- Both months are contaminated more than usual: the study above looked at all eight weeks, and I cannot remove "the inspiring days" because every week inspired it.
- January: both signals say "sell" almost every day, so Y1 should be close to A2 and Y3 should skip very little (and fail the "skips at least 3" line).
- February: a box around an unchanged weekly open; I expect Y1 to flip sides daily and do badly, like idea K's raw break.
Nothing above has been run.
