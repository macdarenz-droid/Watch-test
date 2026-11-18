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

# RESULTS (kill test above pushed in commit bbd953d before any code; one run: `python bt/split_entry.py 2015-05-09`; figures copied from its output)
89 A2 days 01-06..05-08, engine costs, per-day R of all parts together.

## Mechanics check before the totals
- My own "08:00 part" reproduces the engine's A2 on every day (largest difference 0.000R).
- 05-08, a morning I walked by hand: the 08:00 part buys 1.11949 and closes at noon +0.47R; the 08:30 part buys 1.12178 (-0.10R); the 09:00 part buys 1.12172 (-0.08R).
  SI1 and SI2 +0.19R, SI3 +0.10R, against A2's +0.47R. Later parts paid 22-23 pips more for the same exit.

## Totals
| | net R (of A2) | max DD | score net/DD (vs A2) | worst 10 days | worst day | backtest months: net, DD | live months: net, DD |
|---|---|---|---|---|---|---|---|
| A2: whole position at 08:00 | +37.45 | 3.28R | 11.4 | -1.70R | -1.03R | +19.56, 1.87R | +17.89, 3.28R |
| single entry 08:30 (reported only) | +30.33 (81%) | 4.70R | 6.5 (0.57x) | -2.66R | -1.03R | +17.29, 1.90R | +13.04, 4.70R |
| single entry 09:00 (reported only) | +22.78 (61%) | 4.21R | 5.4 (0.47x) | -3.72R | -1.03R | +16.29, 2.31R | +6.49, 4.21R |
| SI1: half 08:00 + half 09:00 | +30.12 (80%) | 3.62R | 8.3 (0.73x) | -2.54R | -1.03R | +17.92 (92%), 2.09R | +12.19 (68%), 3.62R |
| SI2: half 08:00 + half 08:30 | +33.89 (90%) | 3.99R | 8.5 (0.74x) | -2.18R | -1.03R | +18.42 (94%), 1.89R | +15.47 (86%), 3.99R |
| SI3: thirds 08:00 / 08:30 / 09:00 | +30.19 (81%) | 3.98R | 7.6 (0.67x) | -2.45R | -1.03R | +17.71 (91%), 2.03R | +12.48 (70%), 3.98R |

## Kill lines applied
| line | SI1 | SI2 | SI3 |
|---|---|---|---|
| K1 net at least 95% of A2 | FAIL (80%) | FAIL (90%) | FAIL (81%) |
| K2 score at least 1.15x | FAIL (0.73x) | FAIL (0.74x) | FAIL (0.67x) |
| K3 both periods: net >= 90% and DD not above A2's | FAIL | FAIL | FAIL |
| K4 worst 10 days not worse | FAIL (-2.54) | FAIL (-2.18) | FAIL (-2.45) |
| K5 worst day | PASS | PASS | PASS |
VERDICT: NO SURVIVOR. Idea closed. The entry stays one order at 08:00 London.

## My guess against what happened
"Net about 90%, drawdown about the same": net 80-90% - right for SI2, too kind for the others - and the drawdown is not the same, it is DEEPER (3.6-4.0R against 3.3R).
I expected to give up profit for smoothness. The split gives up profit AND smoothness.

## What I learned
- The later the entry, the worse - on every measure, and much more so live: a single entry at 09:00 keeps 83% of A2's profit in the backtest months and 36% in the
  live months; at 08:30, 88% and 73%. The first thirty to sixty minutes after 08:00 carry a large part of what the rule earns, especially lately.
- Why the drawdown gets deeper instead of shallower: on a losing morning a later part usually loses too (its own stop is 40 pips from a different price), and on a
  winning morning it wins less - so the losses stay and the cushion between them shrinks. Splitting does not diversify anything; it is the same bet, later.
- It fits the other findings of the last weeks: the edge is 08:00-12:00 London (night and afternoon tests), the last hour adds for trades in profit (late lock),
  and now the first hour is where much of it is made. Every part of that window that I give up costs.
- Management side now: exits 32 definitions, entry timing and splitting 3 more ways, size rule tested. All of them say: one order at 08:00, 40 pip stop, out at noon.
Counts: ideas 55, variants 150.
