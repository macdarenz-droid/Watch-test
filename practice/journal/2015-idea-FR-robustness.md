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
