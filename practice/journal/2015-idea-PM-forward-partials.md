# Idea PM again, forward (idea 79): partial at +1R and / or break-even - the April definitions judged on the days since - PRE-REGISTRATION with worked cases
(pushed before any run)
Sim clock Thu 2015-06-11 01:00 London. END 2015-06-11. Coach 06-09: ONE thing about managing A2 once I am in (his list: stop after a poke - done
yesterday -, partials, time exit); max 3 variants, costs on. Coach 06-10: re-testing only on forward days "is the honest way".
## Why this, today
Yesterday's trade was +86 pips and closed -0.14R. A partial at +1R is the textbook answer to exactly that day. I tested it on all history to 04-14
(idea PM, journal/2015-idea-PM-partial-breakeven.md): PM1 kept 83% of A2's net, PM2 85%, PM3 95%; all killed. The three definitions have been frozen
in bt/ideas.py since 04-15. The 41 trading days since are forward days for them. Said plainly, as with CS: the definitions are old, my reason for
looking again today is one painful trade - which is why the lines are the same hard ones.
## Definitions (unchanged since April)
- PM1: half off at +40 pips (+1R) and the other half's stop to break-even.
- PM2: half off at +40 pips, the other half keeps the original stop.
- PM3: no partial; once the trade has been +40 pips the whole position's stop goes to break-even.
## Decision set
Forward days only: every A2 day from 2015-04-15 to END. All days since January reported beside, deciding nothing.
## WORKED CASES (June goal; python line from my own trade tables, before this push)
- 06-10 (reached +86.3 pips, A2 -0.14R): PM1 = +0.5R for the half closed at +40 pips, runner stopped at the entry on the way back = about +0.48R.
  PM3 = whole position out at the entry = about -0.03R.
- 06-04 (A2 +2.87R, never back to the entry after +40): PM1 = 0.5 + 2.87 / 2 = +1.94R. PM3 = unchanged.
  The script's check of 06-10 and 06-04 must show these (to the few hundredths that fills cost).
- Rough expectation for PM1 on the forward days, from my trade tables: it gives up half of everything above 1R on six big winners (04-17, 04-28, 04-30,
  05-19, 06-02, 06-04): about -2.90R; it gains on four days that reached +40 pips and closed under 1R (05-13, 05-25, 05-27, 06-10): about +1.03R.
  Net about -1.9R. PM2 a little worse than PM1 (no break-even on 06-10); PM3 within a few tenths of A2 either way.
## Kill lines (each variant against A2 on the forward days, costs on; one failure kills it) - the same as CS forward
- K1: net R at least 1.0R above A2.                         [worked: PM1 about -1.9R -> expect FAIL]
- K2: improved days >= worsened days, and still ahead of A2 without its single best day.
- K3: max drawdown on the forward days not larger than A2's.
- K4: at stressed costs (2.0 pip spread, 0.5 slippage) not behind A2 at the same costs.
- K5 sample: at least 10 changed days.
A survivor: at most a forward paper tag. The live exit stays "whole position, 40 pip stop, 12:00" whatever comes out.
My guess = the worked expectation: all three killed on K1; PM3 the closest.

## Mechanics check against the worked cases (engine day totals, python print)
06-10: A2 -0.14R; PM1 +0.48R (half closed at +40 pips: +0.49R; runner stopped at the entry: 0.00R); PM2 +0.41R (runner held to noon: -0.07R); PM3 0.00R.
06-04: A2 +2.95R on the engine (+2.87R as traded: the R-unit difference found in CF); PM1 and PM2 +1.96R (0.49 + 2.95 / 2); PM3 +2.95R, unchanged.
The worked cases, in the engine's unit. (The script's one-line check prints only the first leg of a two-leg day; the day totals above are the check.)

## Results (run once; `NAMES=PM1,PM2,PM3 FWD0=2015-04-15 python bt/cs_forward.py 2015-06-11`; costs on; figures copied from the print)
A2 on the FORWARD days (41 days from 04-15): net +0.35R, max DD 4.54R, 17 full stops; at stressed costs -1.32R.
| variant | forward net (vs A2) | changed days | better / worse | without its best day | max DD | stressed vs A2 stressed | all days since January vs A2 (before 04-15) |
|---|---|---|---|---|---|---|---|
| PM1 half at +1R, runner to break-even | -1.06 (-1.40) | 15 | 8 (+1.90R) / 7 (-3.29R) | -2.03 | 5.26R | -1.22 | -7.09 (-5.69) |
| PM2 half at +1R only | -1.09 (-1.44) | 15 | 8 (+1.87R) / 7 (-3.29R) | -2.00 | 5.26R | -1.29 | -6.53 (-5.09) |
| PM3 whole position to break-even after +1R | +0.41 (+0.07) | 2 | 1 (+0.14R) / 1 (-0.07R) | -0.07 | 4.54R | +0.14 | -1.49 (-1.56) |
PM1's changed forward days (A2 -> PM1): 04-15 +1.49 -> +1.25 | 04-17 +1.73 -> +1.35 | 04-28 +1.65 -> +1.31 | 04-30 +1.88 -> +1.43 | 05-05 +0.87 -> +0.92 |
05-06 +0.64 -> +0.82 | 05-07 +0.07 -> +0.48 | 05-08 +0.47 -> +0.72 | 05-13 +0.64 -> +0.82 | 05-19 +2.18 -> +1.59 | 05-25 +0.69 -> +0.84 | 05-27 +0.91 -> +0.95 |
06-02 +1.55 -> +1.26 | 06-04 +2.95 -> +1.96 | 06-10 -0.14 -> +0.48.

## Kill lines (forward days)
| line | PM1 | PM2 | PM3 |
|---|---|---|---|
| K1 at least +1.0R above A2 | FAIL (-1.40) | FAIL (-1.44) | FAIL (+0.07) |
| K2 improved >= worsened, ahead without its best day | FAIL (8 / 7, but -2.03 without 06-10) | FAIL | FAIL (-0.07 without 06-10) |
| K3 max drawdown not larger | FAIL (5.26R against 4.54R) | FAIL | PASS |
| K4 not behind at stressed costs | FAIL | FAIL | PASS |
| K5 at least 10 changed days | PASS (15) | PASS (15) | FAIL (2) |
VERDICT: all three KILLED a second time, on forward days. No tag. The exit stays: whole position, 40 pip stop, 12:00.

## Worked expectation against the run
PM1: expected about -1.9R (cost -2.90R on six big winners, gain +1.03R on four days); the run says -1.40R (cost -3.29R on seven days, gain +1.90R on
eight). I had missed four small gains (05-05 to 05-08 each reached +40 pips) and one cost (04-15). Right sign, right size to half an R. PM3 "within a
few tenths": +0.07R on two days. No pushed figure of record needed correcting.

## What I learned
- The partial did exactly what it promises on the day that hurt: 06-10 becomes +0.48R instead of -0.14R. And it gave that back three times over on the
  winners it cut in half: 06-04 alone costs it 0.99R, 05-19 0.59R. Eight small gains of +0.24R each against seven costs of -0.47R each.
- It even DEEPENS the drawdown (5.26R against 4.54R): when the big winners that end a losing run are halved, the hole stays open longer.
- A break-even stop after +1R touches almost nothing: 2 days in 41. A trade that has been +40 pips very rarely comes all the way back; when it does
  (yesterday), the saving is 0.14R.
- April said PM1 keeps 83% of A2's net; the forward days say the same thing more harshly. Twice now, on separate data. My exit side is: 33 definitions,
  stop distance, wide trail (too thin, counting), close-stop twice, partials twice. The answer has not moved once.
- About yesterday: the pain of +86 -> -0.14 was real and the fix for it costs 1.40R per 41 days. I would rather keep the pain.
Counts: ideas 79, variants 222 (PM1 PM2 PM3 re-run forward, counted again). Adopted trading ideas: 0. On paper: UN3, PH2, MB1.
Numbers or rules corrected after a push in June: 0.
