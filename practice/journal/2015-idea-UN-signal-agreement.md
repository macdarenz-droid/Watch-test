# When my direction signal's neighbours disagree with it: is the trade weaker? HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY RUN
Clock Tue 2015-04-21 01:00 London (end of released data). All lived history 01-06 .. 04-20 (explicit end date 2015-04-21); costs on; London time.

## Why this one, and what I counted before choosing it
The coach asked for a test with enough trades to mean something (30+), or a plain statement of why not. A2's direction comes from ONE number: the last 22:00 close
against the close 3 trading days earlier. In January I checked that lookbacks 2 and 5 also make money (idea L) - the "3" is not a lucky number. What I never asked is
what happens on the days when those neighbours point the OTHER way. A better trader would call such a morning "no clear direction".
Counted first (occurrences only, no results looked at):
- A majority vote of the 2-, 3- and 5-day signals differs from my 3-day signal on 3 days out of 76. THREE cases: that version cannot be tested, and I say so plainly
  rather than run it. (The 3-day signal is the middle one; it can only be outvoted when 2 and 5 agree against it.)
- The three signals are NOT unanimous on 25 of 76 days (6 in January, 9 in February, 10 in March-to-now); unanimous on 51. That split uses every trade and the smaller
  group is 25 - under 30, so the average of the smaller group is known to about +-0.41R (two standard errors at 1.03R per trade) and the difference between the groups
  to about +-0.50R. It can show a large effect and cannot show a small one. It is the largest sample this question can have on my history.

## What I already know (contamination, honestly)
- Flip days (the first day after the 3-day signal changes) earned about the same as other days (FL test) - many disagreement days are days around a flip.
- Trades against the 10-day trend earned +0.35R (SD test). Lookback 10 by itself was bad; 2 and 5 were positive but lower than 3 in January.
- All of that says: disagreement among lookbacks has not looked like a warning so far. So my prior is that this fails. I run it because it is the one question about the
  signal itself that I have not asked, and because it has the sample.

## Hypothesis
On mornings when the 2-, 3- and 5-day signals do not all agree, A2's direction is unreliable: those trades have clearly lower expectancy than unanimous days, in every
part of my history.

## Variants (111, 112, 113; ideas -> 42), no others afterwards. Everything else exactly A2. Derived from A2's own daily results (a skipped day = 0R, a half-size day = half its R).
- UN1: no trade unless the 2-, 3- and 5-day signals all agree.
- UN2: half size on the days they do not all agree.
- UN3: no trade when the 3-day and the 5-day signal disagree (the 2-day one ignored as too jumpy).

## KILL TEST (explicit; the same lines as for every filter). The build can only kill; a survivor gets a forward paper tag (no adoption question before 200 forward trades).
A variant survives only if ALL:
  K1. avg R per A2 signal day at least A2's + 0.05R;
  K2. the days it changes are WORSE under A2 than the days it leaves alone, by at least 0.3R on average;
  K3. that is true in at least 2 of the 3 periods (January, February, March-to-now), and in no period are the changed days better than the others by more than 0.3R;
  K4. it changes at least 10 days and leaves at least 60% of the days alone.
My guess, written now: disagreement days earn about +0.3R against about +0.5R for unanimous days; the gap is under 0.3R and flips sign in at least one period; all three fail K1 and K2.

# RESULTS (kill test above pushed in commit 648443f before the script existed; labels checked on three days; one run: `python bt/signal_agree.py 2015-04-21`)
75 A2 trades 01-06..04-20, engine, full costs. (My count above said 25 of 76 signal days; one of those is not a trade day: 24 of 75.)

## All three signals (2, 3, 5 days) agree, or not
| | trades | win rate | avg R | net R | Jan | Feb | Mar-now |
|---|---|---|---|---|---|---|---|
| Unanimous | 51 | 65% | +0.496 | +25.31 | 13, +0.78 | 11, +0.26 | 27, +0.45 |
| Not unanimous | 24 | 67% | +0.378 | +9.07 | 6, +0.79 | 9, +0.20 | 9, +0.28 |
Difference +0.12R, two standard errors +-0.50R: nothing.

## The 3-day and the 5-day signal agree, or not
| | trades | win rate | avg R | net R | Jan | Feb | Mar-now |
|---|---|---|---|---|---|---|---|
| Agree | 60 | 68% | +0.580 | +34.81 | 15, +0.86 | 15, +0.35 | 30, +0.55 |
| Disagree | 15 | 53% | -0.029 | -0.43 | 4, +0.49 | 5, -0.12 | 6, -0.30 |
Difference +0.61R, two standard errors +-0.47R: outside the noise band, and the same sign in all three periods.
The 15 days: 01-22 +1.19, 01-28 +0.28, 01-29 +0.53, 01-30 -0.02, 02-02 -0.34, 02-09 +0.78, 02-12 +0.34, 02-13 -0.34, 02-20 -1.03, 03-17 +0.04, 03-27 -1.00, 03-30 +0.85,
04-08 -1.00, 04-09 +0.33, 04-16 -1.03. Four of my eleven full stops are among these 15 days (15 days = 20% of trades, 36% of stops).

## Variants and kill lines
| | changes | avg R / signal day (A2 +0.458) | net R (A2 +34.38) | max DD (A2 2.03) | gap others - changed | by period | K1 | K2 | K3 | K4 |
|---|---|---|---|---|---|---|---|---|---|---|
| UN1 skip unless all three agree | 24 days | +0.337 | +25.31 | 1.34 | +0.12 | -0.01 / +0.06 / +0.17 | FAIL | FAIL | FAIL | PASS |
| UN2 half size unless all three agree | 24 days | +0.398 | +29.84 | 1.53 | +0.12 | same | FAIL | FAIL | FAIL | PASS |
| UN3 skip when 3-day and 5-day disagree | 15 days | +0.464 | +34.81 | 1.34 | +0.61 | +0.37 / +0.47 / +0.86 | FAIL (+0.006, needs +0.05) | PASS | PASS | PASS |
VERDICT BY THE KILL TEST AS WRITTEN: NO SURVIVOR. UN1 and UN2 fail three lines. UN3 passes K2, K3, K4 and FAILS K1. A variant survives only if ALL lines hold. A2 unchanged, no paper tag awarded.

## My guess against what happened
For "all three agree" I guessed +0.3R against +0.5R: it is +0.38 against +0.50. Right. For UN3 I guessed the same and was WRONG: the disagreement days made nothing (-0.03R).

## UN3, said carefully - it is the first of my filters where the bad group is actually bad, and I do not want to oversell or bury it
For it:
- The gap (0.61R) is outside its noise band and has the same sign in January, February and March-to-now. No earlier filter of mine did that (H, G, NM, GAP, RN, FL, FH, RV all
  had the sign flip or the "bad" days turn out better).
- It is not a chart reading. It is the rule's own signal checked against its neighbour: "the last three days say up, the last five say down".
- Skipping these 15 days would have left the net R unchanged (+34.81 vs +34.38) and cut the maximum drawdown from 2.03R to 1.34R.
Against it:
- It FAILS the line I wrote beforehand. K1 asks for +0.05R per signal day more than A2; removing 15 trades worth about zero adds +0.006R. I set that line for every filter,
  and I do not get to drop it for the one that looks nice. (It is the same pattern as the dead-Asia filter Q in March: "removes trades worth about zero, same total,
  smaller drawdown" - which also failed the profit line and only got a paper tag after the coach let me re-score it for the drawdown goal.)
- 15 days. Without the two worst of them the group averages +0.12R; without 04-16 alone +0.04R. The whole effect is four stop-outs landing in a small group.
- Three variants, and this was the third, added as an afterthought ("ignore the jumpy 2-day one"). One good-looking result in three tries is not rare.
- Contamination: my label check before the run printed 04-16 (a loser I knew) as a disagreement day. I knew one of the 15 before running.
- 9 of the 15 are from before I traded live; the 6 live ones made -1.81R. That is in the right direction and is six trades.
What I am NOT doing: adopting it, tagging it, or re-scoring it myself.
QUESTION FOR MY COACH: may UN3 run as a forward PAPER tag under the drawdown goal, as Q3 / Q1 do (one more line in the daily tally, no effect on any trade)? It would
get about one case a week; a first honest look after 30 forward cases is roughly seven months away. If the answer is no, it stays a parked observation.
Counts: ideas 42, variants 113.
