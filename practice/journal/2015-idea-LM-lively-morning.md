# After a lively hour before entry: does the HOUR'S OWN direction tell me anything? HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY CODE OR RESULT
Clock Thu 2015-05-07 01:00 London (end of released data). All lived history 01-06 .. 05-06 (explicit end 2015-05-07); costs on; London time.

## Where it comes from
The PH test (04-30) left one finding standing: on mornings whose pre-entry hour (07:00-08:00 London) ranged 30+ pips, my 3-day signal earns little (+0.146R on 30
trades, against +0.572R after a quiet hour). PH2 is on paper for that. What I have NOT asked: if the 3-day direction is weak on those mornings, is there a better
direction? London has just moved 30-80 pips in one hour. Either that move carries on to noon (momentum) or it is given back (a false start). Both are stories;
I have a count for neither.
This is not an A2 filter: it is a separate trade on lively mornings only, with its own direction. It would matter in two ways: as a possible second setup, and as an
explanation of WHY A2 is weak there (if the hour's direction beats the 3-day direction on those days, A2 is simply facing the wrong way after London has spoken).

## Sample and contamination, plainly
- Lively mornings so far: 30 in the PH test to 04-29, plus the live days since - the script prints the exact count. About 34. That is the whole sample; each variant uses all of it.
- I have walked the last eleven live mornings bar by bar and remember several lively ones going both ways after 08:00 (04-24 and 05-06: the hour's move was given back;
  04-30 and 05-04: it carried on). From memory it looks like a coin. I expect nothing, and say so.
- The night-fade test taught me that a trade and its mirror can BOTH lose once each has a stop. So "follow" failing does not make "fade" work; both are run and both
  must pass on their own.

## Hypothesis
On lively mornings the direction of the pre-entry hour (its close against its open) carries information for 08:00-12:00 that the 3-day signal lacks: following it has
a positive expectancy of its own.

## Variants (142, 143, 144; ideas -> 53), no others afterwards. All: only on mornings with a pre-entry hour range of 30+ pips; market order at 08:00 London, stop 40 pips,
no target, close at 12:00 London, $125 risk, costs on. (Same hours as A2, so this could never be traded ON TOP of A2 at my size without a separate risk decision; that
question only arises for a survivor.)
- LM1: trade WITH the pre-entry hour's direction (07:00 open to 08:00).
- LM2: trade AGAINST it.
- LM3: trade with it only when the hour moved at least 20 pips net (a decided hour, not a round trip); otherwise no trade.

## KILL TEST (explicit). The build can only kill; a survivor gets a forward PAPER tag (100 forward trades at +0.15R, two standard errors).
A variant survives only if ALL:
  K1. average R per trade at least +0.15R;
  K2. net R positive in the backtest months (to 02-27) AND in the live months (from 03-02) - reported with their counts, since the backtest months have few lively days;
  K3. net R still positive without its three best trades;
  K4. maximum drawdown at most 5R;
  K5. it beats A2 ON THE SAME MORNINGS by at least 0.15R per trade (otherwise the 3-day direction is no worse there than the hour's own);
  K6. at least 20 trades.
My guess, written now: LM1 and LM2 both land between -0.15R and +0.10R; neither beats A2's +0.15R on those mornings; LM3 has under 20 trades or fails K1. No survivor:
on lively mornings there is no direction I can name at 08:00, and A2's weakness there is noise or volatility, not a wrong-way signal.

# RESULTS (kill test above pushed in commit 4e11353 before any code; mechanics checked on 05-06, a morning I walked by hand; one run: `python bt/lively_morning.py 2015-05-07`;
every figure below is copied from the tool's output)
87 A2 mornings 01-06..05-06; 35 have a pre-entry hour range of 30+ pips (6 in the backtest months, 29 live); 22 of those have a net hour move of 20+ pips.
A2 on the same 35 mornings: +0.205R each, +7.18R.

## Mechanics check (05-06): hour range 43.5 pips, net +25.9 (up). LM1 and LM3 buy 1.12575, stop 1.12164, stopped at 10:00: -1.02R. LM2 sells 1.12563 - my live trade -
closes 12:00 at 1.12308: +0.63R. Engine = my walk.

## Totals
| | trades | win rate | avg R (+- 2 SE) | net R | full stops | max DD | backtest months | live months | without best 3 | vs A2 on the same mornings |
|---|---|---|---|---|---|---|---|---|---|---|
| LM1 with the hour's direction | 35 | 34% | -0.223 (+-0.29) | -7.79 | 14 | 9.39R | -1.93 (6) | -5.87 (29) | -12.40 | -0.428 |
| LM2 against it | 35 | 51% | +0.203 (+-0.34) | +7.11 | 10 | 3.11R | +1.47 (6) | +5.64 (29) | +1.11 | -0.002 |
| LM3 with it, only if 20+ pips net | 22 | 45% | -0.034 (+-0.37) | -0.75 | 6 | 2.18R | -0.14 (4) | -0.61 (18) | -5.23 | -0.151 |

## Kill lines applied
| line | LM1 | LM2 | LM3 |
|---|---|---|---|
| K1 avg >= +0.15R | FAIL | PASS (+0.203) | FAIL |
| K2 positive in both periods | FAIL | PASS (+1.47 on 6, +5.64 on 29) | FAIL |
| K3 positive without best 3 | FAIL | PASS (+1.11) | FAIL |
| K4 max DD <= 5R | FAIL (9.39) | PASS (3.11) | PASS |
| K5 beats A2 on the same mornings by 0.15R | FAIL | FAIL (-0.002: identical) | FAIL |
| K6 at least 20 trades | PASS | PASS | PASS |
VERDICT: NO SURVIVOR. LM1 and LM3 fail nearly everything. LM2 passes five lines and fails K5: fading the lively hour earns +0.203R, and my own rule earns +0.205R on
exactly those mornings. It adds nothing to what I already trade. Idea closed, no tag. A2 unchanged.

## My guess against what happened
"LM1 and LM2 both between -0.15R and +0.10R": LM1 is worse (-0.22R), LM2 better (+0.20R) than I guessed. "Neither beats A2 there": right. "No direction I can name at
08:00": half wrong - FOLLOWING the lively hour is a clear loser on 35 mornings (34% winners, 14 full stops).

## What I learned
- After a lively hour before the London open proper, the hour's move tends to be given back by noon; chasing it lost 0.22R a trade. That is a fact about my market
  I did not have.
- One description, computed AFTER the test and labelled as such (not a variant, not a rule): on the 35 lively mornings my A2 trade is the SAME as the fade on 21 of
  them (the hour had moved against my 3-day signal) and the OPPOSITE on 14 (the hour had moved with my signal - I was chasing it). A2 made +0.338R per trade on the 21
  and +0.005R on the 14.
  So A2's weakness on lively mornings (the PH finding) seems to sit in the mornings where a lively hour has already run MY way before I enter. That is the old
  "no-chase" picture (idea H, killed on all days; the F1 family, closed yesterday for parameter luck), now seen only on lively mornings: 14 trades.
  I am not testing it: it would be a fourth variant, chosen after seeing the result, on 14 cases. It goes on the parked list with its count, and PH2 (already on paper,
  frozen) covers all lively mornings without this refinement. If the pattern is real, PH2's forward tally will be dragged by exactly those mornings and I will see it.
- Second-setup count: eight tried, none alive. The fade of a lively hour is the only one that made money on its own - by being my existing trade most of the time.
Counts: ideas 53, variants 144.
