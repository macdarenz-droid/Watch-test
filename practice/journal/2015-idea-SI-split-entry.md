# Trade management on A2: split the ENTRY in time instead of one order at 08:00. HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY CODE OR RESULT
Clock Fri 2015-05-08 22:00 London (weekend, end of released data). All lived history 01-06 .. 05-08 (explicit end 2015-05-09); costs on; London time.

## Why this one
Exits are closed at 32 definitions; the size rule was tested on 05-05. What I looked at and dropped first, plainly:
- My payout rule (it was payout day): "is the $1,000 buffer worth keeping?" In a simulation the answer is a tautology - with a stop that trails the high-water mark,
  the trading path is identical under every payout policy and the buffer only delays money - so there is nothing to test, only a judgement about gaps and about
  myself not obeying the stop. Left as it is.
- What I have never tested in any form is HOW I get in. Every entry test so far changed the time or the price of ONE order (07:00, 09:00, +-1 hour, a limit).
  A management alternative: put the position on in parts, at fixed times, each part with its own 40 pip stop. The reasons it might help: my worst mornings are decided
  in the first hour (full-stop mornings; lively pre-entry hours); a part entered at 08:30 or 09:00 either gets a better price on a morning that first goes against me,
  or is entered after the first whipsaw. The reason it might not: my best mornings run from the first minute (January; 04-30), and every later part enters at a worse price.

## What I already know (contamination)
- The clock-shift test (03-31, January and clean March): entering one hour later, or at 09:00, earned less than 08:00. A split is an average of 08:00 and later
  entries, so its NET R will sit between them - below A2. I know that before running. What I do not know is what it does to the DRAWDOWN and the worst stretch,
  on all history including the live months, and that is what the lines below are about.
- No day inspired this; nothing to remove.

## Hypothesis
Splitting the entry between 08:00 and a later time gives up a little net R and buys a clearly smoother curve: lower maximum drawdown and a better ratio of net R
to drawdown, in the backtest months and in the live months.

## Variants (148, 149, 150; ideas -> 55), no others afterwards. Direction, 40 pip stop per part (from that part's own entry), 12:00 exit and total risk $125 as A2.
A later part is entered at its time whether or not an earlier part has been stopped (it is a rule about time, not a re-entry signal).
- SI1: half at 08:00, half at 09:00.
- SI2: half at 08:00, half at 08:30.
- SI3: thirds at 08:00, 08:30 and 09:00.

## KILL TEST (explicit). Same days as A2, per-day R of all parts together, engine costs. The build can only kill; a survivor gets a forward PAPER tag (100 forward
trades) - never a live change from a backtest.
A variant survives only if ALL:
  K1. net R at least 95% of A2's over all history;
  K2. score (net R / maximum drawdown) at least 1.15 x A2's;
  K3. in the backtest months AND in the live months, each separately: net R at least 90% of A2's and maximum drawdown not above A2's;
  K4. worst 10 days in a row not worse than A2's;
  K5. the worst single day not worse than A2's worst day by more than 0.05R (parts with their own stops must not create a bigger loss than one stop).
My guess, written now: net R about 90% of A2's (later parts miss the first-hour run on the good days), drawdown about the same; K1 or K2 fails for all three.
SI2 (the closest to A2) keeps the most profit and changes the least. No survivor.
