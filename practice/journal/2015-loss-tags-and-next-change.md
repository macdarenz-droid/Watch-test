# Every Jan-Feb loss tagged, counted; what that allows me to change; the ONE change I would test next (written, NOT run)
Clock Fri 2015-02-27 22:00 UTC, unchanged. No new candles, no backtest run for this note: counts stay 10 ideas / 19 variants. Costs are inside every R (sim fills).

## 1. Definitions (fixed before tagging)
- "My mistake" = I broke something written: wrong side vs the trend rule, wrong time, wrong size, wrong stop distance, stop moved, early/late exit, a second trade, a skipped or added trade.
- "Valid setup, market disagreed" = taken exactly as the rules say, and it lost.
- Hindsight is not a mistake. "I was chasing" (H), "the first hour had broken against me" (G), "it wasn't working after an hour" (T) were each turned into a rule and each failed its test,
  so they cannot be used to call a trade a mistake.
- Check used: sim/trades.csv by script - entry 08:00, 0.31 lots, stop 39.5-41.5 pips, exit 12:00 or by stop, one trade per day; side vs the mechanical A2 backtest (identical in February,
  identical in January on the days I traded).

## 2. The 13 losses
| # | Date | Day | Side | R | Exit | Rules followed? | Tag |
|---|---|---|---|---|---|---|---|
| 6 | 01-19 | Mon | sell | -1.00 | stop 09:23 | yes | valid setup, market disagreed |
| 8 | 01-21 | Wed | sell | -0.51 | noon | yes | valid setup, market disagreed |
| 11 | 01-27 | Tue | sell | -0.99 | stop 08:14 | yes | valid setup, market disagreed |
| 14 | 01-30 | Fri | buy | -0.02 | noon | yes | valid setup, market disagreed |
| 15 | 02-02 | Mon | sell | -0.34 | noon | yes | valid setup, market disagreed |
| 17 | 02-04 | Wed | buy | -0.24 | noon | yes | valid setup, market disagreed |
| 19 | 02-06 | Fri | buy | -0.19 | noon | yes | valid setup, market disagreed |
| 24 | 02-13 | Fri | buy | -0.34 | noon | yes | valid setup, market disagreed |
| 25 | 02-16 | Mon | buy | -0.32 | noon | yes | valid setup, market disagreed |
| 27 | 02-18 | Wed | buy | -0.47 | noon | yes | valid setup, market disagreed |
| 28 | 02-19 | Thu | buy | -0.36 | noon | yes | valid setup, market disagreed |
| 29 | 02-20 | Fri | buy | -1.02 | stop 09:07 | yes | valid setup, market disagreed |
| 34 | 02-27 | Fri | sell | -0.23 | noon | yes | valid setup, market disagreed |

## 3. Count
| Tag | Losses | R |
|---|---|---|
| Valid setup, market disagreed | 13 | -6.03R |
| My mistake | 0 | 0 |
Mistakes that were NOT losses (for completeness): 1 - the discretionary skip on Thu 01-22 (missed about +1.1R). Already removed from the plan (no skips).
Record-keeping mistakes found in reviews (not trades): invented backtest numbers in STATE once (fixed same turn), H2/H3 run on February against my pre-registration, worst losing run overstated as -2.17R (real -1.86R).

## 4. What I am allowed to change
Rule from my coach: change rules only for mistakes, or for a pattern that keeps losing.
- Mistakes: none among the losses. Nothing to change on that ground.
- Patterns: I grouped the 34 live trades ten ways (5 weekdays, buy/sell, first day after a signal flip, day after a loss, day after a win). Ten looks at 34 trades - something will always stand out.
| Group | Trades | Wins | Losses | Avg R | Jan net R | Feb net R |
|---|---|---|---|---|---|---|
| Mon | 7 | 4 | 3 | +0.26 | +0.65 | +1.20 |
| Tue | 7 | 6 | 1 | +0.62 | +0.58 | +3.74 |
| Wed | 7 | 4 | 3 | +0.19 | +0.89 | +0.42 |
| Thu | 6 | 5 | 1 | +0.61 | +2.58 | +1.07 |
| Fri | 7 | 2 | 5 | +0.51 | +5.35 | -1.78 |
| Sells | 20 | 15 | 5 | +0.66 | +9.27 | +3.88 |
| Buys | 14 | 6 | 8 | +0.11 | +0.78 | +0.77 |
| First day after a flip | 6 | 5 | 1 | +0.38 | +0.28 | +2.01 |
| Day after a loss | 12 | 8 | 4 | +0.66 | +4.73 | +3.19 |
| Day after a win | 21 | 12 | 9 | +0.26 | +3.98 | +1.46 |
  - Only one group has lost repeatedly: FRIDAYS. The last five Fridays in a row were losers (01-30, 02-06, 02-13, 02-20, 02-27: -1.80R), all four February Fridays.
  - But the two Fridays before that were my best days (01-16 +1.10R, 01-23 +4.27R), so Friday as a whole is still +0.51R per trade. It "keeps losing" in February and "keeps winning" in January.
  - Buys look weak (+0.11R) but are positive in both months; that is the market (EURUSD fell), not a losing pattern.
- Verdict: no pattern has kept losing across BOTH months. By the coach's rule, nothing qualifies for a rule change today. Plan v2 stands as written.

## 5. The ONE change I would test next: "no Friday trade" (would be idea W, variant 20 - NOT run, not counted yet)
Why this one: it is the only repeat-loss pattern in the table, and there is a plausible reason I wrote down live before knowing the results - on Fridays the morning waits for
13:30 US news or squares the week (journal 01-09, 01-30, 02-06: "dull pre-news morning", "month-end Friday, odd flows"). Why I distrust it: 7 Fridays, found by looking ten ways.
Rule change: A2 exactly as frozen, Monday to Thursday only.

Why I will NOT run it on Jan-Feb: there is nothing left to learn there. Its result is already readable from my own trade list - it would remove +5.35R from January (so it fails any January
build before I start) and -1.78R from February (the month the pattern was found in, so that is not evidence). A backtest now would only dress up numbers I already have.

Kill test (forward only, on candles I have not seen; fixed now, no rescue):
- Tag every unseen Friday A2 trade as it is traded; A2 keeps trading Fridays for real meanwhile (plan v2 is unchanged until the test ends).
- Judge only after 8 unseen Fridays (about two months). Adopt "no Friday" only if ALL hold:
  1. the 8 Friday trades net <= 0R in total;
  2. at least 5 of the 8 are losers;
  3. the Monday-Thursday trades of the same period average above 0R (otherwise the problem is the rule, not the day);
  4. removing the single worst Friday still leaves the Friday total <= 0R (so one bad day is not the whole result).
- Any other outcome: killed, and I do not come back with "first Fridays only" or "month-end Fridays only".
- It can only be judged on a month it was not built on, which is exactly what unseen Fridays are.
Nothing in section 5 has been run.
