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

# Idea W "no Friday trade" - RUN on Jan-Feb at the coach's request (Tue 2015-03-03 sim time). W1 = variant 23; ideas 12. Costs on, $125 risk. March not used.
The kill test is applied EXACTLY as pre-registered in section 5: it is forward-only (8 unseen Fridays). The Jan-Feb table below is the honest record of what the rule does on
months I already know; as I wrote before running, it cannot adopt or validate anything.

| Month | Rule | Trades | Win rate | Avg R | Net R | Max DD |
|---|---|---|---|---|---|---|
| Jan (in-sample) | A2 before | 19 | 74% | +0.78 | +14.79 | 1.33R |
| Jan (in-sample) | W1 Mon-Thu only | 15 | 80% | +0.66 | +9.88 | 1.33R |
| Jan (in-sample) | the Fridays W1 skips | 4 | 50% | +1.23 | +4.92 | - |
| Feb (CONTAMINATED - the pattern was found here) | A2 before | 20 | 55% | +0.23 | +4.64 | 1.86R |
| Feb (CONTAMINATED) | W1 Mon-Thu only | 16 | 69% | +0.40 | +6.42 | 0.83R |
| Feb (CONTAMINATED) | the Fridays W1 skips | 4 | 0% | -0.44 | -1.78 | - |
| Both | A2 before | 39 | 64% | +0.50 | +19.43 | 1.86R |
| Both | W1 Mon-Thu only | 31 | 74% | +0.53 | +16.30 | 1.33R |
Fridays: 01-09 -0.43, 01-16 +1.10, 01-23 +4.27, 01-30 -0.02, 02-06 -0.19, 02-13 -0.34, 02-20 -1.02, 02-27 -0.23 (8 Fridays: 2 wins, 6 losses, +3.14R, of which +4.27R is one day).

Reading, exactly as predicted before the run: skipping Fridays costs 4.92R in January and saves 1.78R in February. On a January build it fails (avg R +0.66 vs +0.78, net R down a third);
February looks good (+0.40 vs +0.23R, drawdown halved) only because February is where I found the pattern. Jan+Feb together: 3.1R less profit for a slightly better average. No evidence.
Without the single 01-23 shock day, the eight Fridays net -1.13R - which is why the forward test has the "remove the single worst/best day" line.

## Kill test status (as written, forward only)
| Condition (all four needed to adopt) | Needed | So far |
|---|---|---|
| Unseen Fridays traded and tagged | 8 | 0 (first one is Fri 03-06) |
| Friday trades net R | <= 0R | - |
| Friday losers | >= 5 of 8 | - |
| Mon-Thu trades of the same period, avg R | > 0R | +0.06R (2 trades) |
| Friday total without the single worst Friday | still <= 0R | - |
VERDICT: PENDING - neither adopted nor killed. A2 keeps trading Fridays for real. Nothing I saw on Jan-Feb is allowed to change that.
I am not calling this a finished test: the Jan-Feb half is done and tabled, the deciding half needs eight Fridays I have not lived yet.
