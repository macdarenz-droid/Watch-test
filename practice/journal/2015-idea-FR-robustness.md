# The most promising idea in my journal is F1 - is its lead real or a knife-edge? KILL LINES WRITTEN FIRST (nothing has been run)
Clock Wed 2015-04-01 01:00 London (end of released data). History before the clock only; costs on; London time.

## Why F1
Of everything I have tested, one thing is ahead of the frozen rule on days it was not built on: the F1 paper tag (if the last five daily closes moved in a fairly straight line,
efficiency >= 0.5, trade A2 every day; otherwise skip the trade when the entry sits in the far 40% of yesterday's range in my direction, "no-chase 0.6").
Forward since 03-02: F1 18 trades +12.42R, max drawdown 1.01R; A2 22 trades +12.10R, max drawdown 1.50R. It skipped four trades: two losers avoided, two winners missed.
Its own gate 2 (40 forward signal days) is at 22 and cannot be finished today.
What CAN be tested today, and should be before I let that lead impress me: F1 has two numbers in it (0.5 and 0.6), both picked by me as round values. On 03-23 - the +2.52R trade
that finished my challenge - F1 traded only because the entry sat at 0.598 of yesterday's range against a limit of 0.600. A rule whose best day hangs on 0.002 may be luck.
So: do F1's neighbours behave like F1, or does the lead vanish when the numbers move a little? (Same question I asked of A2's "3" in idea L.)

## Variants (66, 67, 68; ideas -> 27), no others afterwards. Everything else exactly F1 / A2.
- FR1: efficiency threshold 0.5, no-chase limit 0.5 (stricter filter).
- FR2: efficiency threshold 0.5, no-chase limit 0.7 (looser filter).
- FR3: efficiency threshold 0.6, no-chase limit 0.6 (more days count as "crooked").
Compared on the days the efficiency measure exists (from 01-12). January = the month F1 was built on. March lived days (03-02..03-31) = F1's own forward period; for the three
neighbours those days have never been computed. February shown, labelled contaminated.

## KILL LINES (explicit). F1 is called ROBUST only if ALL hold:
  R1. each of the three neighbours keeps at least 90% of A2's net R on the March lived days (none of them throws the month's profit away);
  R2. each neighbour's max drawdown on the March lived days is no larger than A2's;
  R3. at least two of the three neighbours have a kept-trade avg R at or above A2's avg R in January (same days).
If ROBUST: F1 keeps its forward tag as it is; nothing else changes (it still needs its 40 days).
If NOT robust: I record that F1's forward lead depends on its exact numbers, and its gate 2 gets one more condition, fixed now: at the 40-day mark F1 must beat A2 AND the neighbour
that failed here must not be more than 1R behind A2 over the same forward days - otherwise F1 is closed as parameter luck.
Nothing in this test can adopt anything or touch the funded rule.

## My guess, with what I already know said out loud
I know one result in advance: FR1 (limit 0.5) skips 03-23 and with it +2.52R, so it will fail R1 unless it also avoids a lot of losers. So I expect NOT ROBUST, through FR1.
I do not know what FR2 and FR3 do in any month, nor what any of the three does in January.

# RESULTS (run after the pre-registration commit). FR1/FR2/FR3 = variants 66/67/68; ideas 27. Costs on, $125 risk, London time (bt/ab_drop.py), same days as F1 (from 01-12).

| Month | Rule | Trades kept | Win rate | Avg R | Net R | Max DD | Kept | Skipped: n / avg R / net R |
|---|---|---|---|---|---|---|---|---|
| January (F1's build month) | A2 | 15 | 73% | +0.75 | +11.30 | 1.34R | - | - |
| | F1 (0.5 / 0.6) | 13 | 77% | +0.85 | +11.04 | 1.34R | 87% | 2 / +0.13 / +0.26 |
| | FR1 (0.5 / 0.5) | 12 | 75% | +0.75 | +8.96 | 1.34R | 80% | 3 / +0.78 / +2.34 |
| | FR2 (0.5 / 0.7) | 14 | 79% | +0.81 | +11.32 | 1.34R | 93% | 1 / -0.02 / -0.02 |
| | FR3 (0.6 / 0.6) | 11 | 73% | +0.51 | +5.63 | 1.34R | 73% | 4 / +1.42 / +5.67 |
| MARCH lived days (F1's forward period) | A2 | 22 | 73% | +0.56 | +12.21 | 1.51R | - | - |
| | F1 | 18 | 78% | +0.70 | +12.54 | 1.03R | 82% | 4 / -0.08 / -0.33 |
| | FR1 | 16 | 75% | +0.57 | +9.11 | 1.03R | 73% | 6 / +0.52 / +3.10 |
| | FR2 | 18 | 78% | +0.70 | +12.54 | 1.03R | 82% | 4 / -0.08 / -0.33 |
| | FR3 | 17 | 76% | +0.69 | +11.81 | 1.03R | 77% | 5 / +0.08 / +0.40 |
| February (contaminated, reference) | A2 | 20 | 55% | +0.23 | +4.67 | 1.87R | - | - |
| | F1 / FR1 / FR2 / FR3 | 12 / 9 / 15 / 12 | 58 / 67 / 60 / 58% | +0.37 / +0.57 / +0.32 / +0.37 | +4.49 / +5.16 / +4.77 / +4.49 | 1.51 / 1.03 / 1.51 / 1.51R | - | - |

## Kill lines, applied
- R1 (each neighbour keeps at least 90% of A2's March net R = 10.99R): FR1 9.11R (75%) -> FAILS. FR2 12.54R and FR3 11.81R pass.
- R2 (each neighbour's March drawdown no larger than A2's 1.51R): all three 1.03R -> passes.
- R3 (at least two of three neighbours at or above A2's January avg R, +0.753): FR2 +0.81 yes; FR1 +0.747 no (by 0.006); FR3 +0.51 no -> only one of three -> FAILS.
=> F1 is NOT ROBUST. Its forward lead depends on its exact numbers.

## What the table shows
- One step stricter on the no-chase limit (0.6 -> 0.5) and the March lead of +0.33R becomes a deficit of 3.10R: FR1 skips 03-23 (+2.52R, entered at 0.598 of yesterday's range)
  and one more winner. One step on the efficiency threshold (0.5 -> 0.6) and January loses half its profit (5.63R vs 11.30R): it starts calling January's trend days "crooked"
  and filtering them.
- Only the LOOSER filter (FR2) behaves like F1 - because it filters almost nothing (it is nearly A2).
- The one thing all four share in every month is a drawdown at or below A2's (1.03R vs 1.51R in March, 1.03-1.51R vs 1.87R in February). The smoother ride looks more
  robust than the extra profit. That matches what the drawdown-goal test found for this family: fewer trades, about the same total, shallower dips.
- So the honest status of my "most promising idea": it has not beaten A2 in profit in a way that survives moving its numbers. Its forward lead is +0.33R on 22 days, and a
  different round number would have made it -3.1R.

## Consequence, as written beforehand
F1 stays a paper tag, with one more condition on its gate 2: at the 40-day mark F1 must beat A2 AND FR1 must not be more than 1R behind A2 over the same forward days.
FR1 is 3.10R behind after 22 days. Unless that closes, F1 will be closed as parameter luck at day 40. FR1 is now tracked next to F1 in the forward tally for that purpose only.
Nothing changes in the funded account. Counts: ideas 27, variants 68.
