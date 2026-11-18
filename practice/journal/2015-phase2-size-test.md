# Phase 2 size test: reshuffle my own trade results at 0.75% - decision rule written BEFORE the run
Clock Tue 2015-03-10 00:00 UTC (end of released data). No price data and no strategy variant involved (counts stay 15 ideas / 32 variants): input is only my own live results in sim/trades.csv.

## What will be computed (bt/phase2_sim.py, 20,000 reshuffles per cell, fixed seed)
- A reshuffle = draw one trade result per day, with replacement, from a set of my own R results (R = result / amount risked, costs inside).
- Phase 2 rules: start $25,000, pass at +5% (when at least 5 trading days are logged), breach at -10% total. Daily limit cannot be hit (one trade a day, worst day = one stop).
- My own plan rules are modelled too: brake to 0.5% risk at -4% until a new phase high; stop trading at -6% ("stopped by my brake" - a failure for me even though it is not a breach).
- Sizes: 0.50%, 0.75% (current), 1.00%. Horizons: 20, 40, 60 trading days (1, 2, 3 months). Outputs: pass %, stopped-by-brake %, breach %, median trading days to pass.
- Four pictures of my edge, because I do not know which is true:
  A. all 40 live trades (Jan-Mar, +0.41R avg) - optimistic: it contains January;
  B. February only (20 trades, +0.23R) - my out-of-sample month;
  C. February shifted to ZERO average - "the rule has no edge";
  D. February shifted to -0.10R - "slightly negative", which my data cannot rule out.
- Also from where I actually stand today: phase 2 balance -0.75% after one loss.

## Decision rule - what would make me change the size (fixed now)
KEEP 0.75% unless one of these fires:
1. CUT to 0.50% if, at 0.75%, picture B (February edge) shows more than 5% chance of being stopped by my brake or breaching within 60 days;
   or picture C (zero edge) shows more than 1% chance of a true 10% breach within 60 days.
2. RAISE to 1.00% only if ALL of: (a) picture B pass chance within 40 days is at least 70% at 1.00% and at least 15 points above 0.75%; (b) picture C breach chance at 1.00% within
   60 days is at most 1% with the brakes on; (c) the A2 forward test is complete and passed (40 unseen trades averaging >= +0.10R). Today (c) is 6 of 40, so a raise is impossible now
   whatever the numbers say - I write (a) and (b) down so I know what I would need later.
3. If neither fires: no change. A long median time to pass is NOT a reason to raise size; it is a fact to plan around.
Not allowed as reasons: today's loss, the feeling that $188 stings, or wanting to be done sooner.
Nothing above has been run.

# RESULTS (run after commit 0e02bb6). 20,000 reshuffles per cell, one trade a day, brakes on (-4% -> 0.5% risk, -6% -> I stop). Costs inside every R.
Each cell: pass +5% / stopped by my -6% brake / true -10% breach, in % of reshuffles.

| Picture of my edge | Risk | within 20 days | within 40 days | within 60 days | Median days to pass |
|---|---|---|---|---|---|
| A. all 40 live trades (+0.43R) | 0.50% | 40 / 0 / 0 | 89 / 0 / 0 | 99 / 0 / 0 | 23 |
| | 0.75% | 69 / 0 / 0 | 97 / 0 / 0 | 100 / 0 / 0 | 15 |
| | 1.00% | 82 / 0 / 0 | 98 / 0 / 0 | 100 / 0 / 0 | 12 |
| B. February only (+0.23R) | 0.50% | 6 / 0 / 0 | 48 / 0 / 0 | 80 / 0 / 0 | 37 |
| | 0.75% | 30 / 0 / 0 | 77 / 0 / 0 | 93 / 0 / 0 | 26 |
| | 1.00% | 51 / 0 / 0 | 87 / 0 / 0 | 97 / 0 / 0 | 20 |
| C. February at ZERO edge | 0.50% | 0 / 0 / 0 | 3 / 0.4 / 0 | 7 / 2.5 / 0 | 45 |
| | 0.75% | 4 / 0.1 / 0 | 13 / 3.2 / 0 | 21 / 9.0 / 0 | 35 |
| | 1.00% | 11 / 0.9 / 0 | 24 / 7.7 / 0 | 32 / 15.1 / 0 | 28 |
| D. February at -0.10R | 0.50% | 0 / 0 / 0 | 1 / 5.1 / 0 | 1 / 19.2 / 0 | 39 |
| | 0.75% | 1 / 1.2 / 0 | 3 / 17.6 / 0 | 4 / 37.8 / 0 | 31 |
| | 1.00% | 4 / 4.8 / 0 | 8 / 29.2 / 0 | 10 / 50.1 / 0 | 24 |

From where I actually stand (phase 2 at -0.75% after Monday's loss), at 0.75%:
| Picture | within 20 days | within 40 days | within 60 days | Median days to pass |
|---|---|---|---|---|
| A (+0.43R) | 61 / 0 / 0 | 95 / 0 / 0 | 99 / 0 / 0 | 18 |
| B (+0.23R) | 20 / 0 / 0 | 69 / 0 / 0 | 90 / 0 / 0 | 30 |
| C (zero) | 2 / 0.5 / 0 | 9 / 5.8 / 0 | 15 / 12.7 / 0 | 38 |
| D (-0.10R) | 1 / 3.0 / 0 | 2 / 24.8 / 0 | 3 / 46.2 / 0 | 32 |

Same reshuffles WITHOUT my brakes, true 10% breach within 60 days: zero edge 0.01% / 1.20% / 6.28% at 0.50 / 0.75 / 1.00%; -0.10R edge 0.61% / 12.88% / 31.60%.

## The decision rule, applied line by line
1. CUT to 0.50%? Picture B at 0.75%: stopped-or-breached within 60 days = 0.0% (limit 5%) -> no. Picture C true breach within 60 days = 0.00% with the brakes (limit 1%) -> no.
   Honest footnote: without the brakes that second number is 1.20%, just over my line. The size is only acceptable BECAUSE of the brakes; they are not optional decoration.
2. RAISE to 1.00%? (a) picture B pass within 40 days at 1.00% = 87% (needs 70%: yes) but only +10 points over 0.75%'s 77% (needs +15: NO). (b) zero-edge breach with brakes 0.00% (yes).
   (c) forward test 6 of 40 (NO). -> no raise.
3. Neither fires -> KEEP 0.75%.

## What the numbers say beyond the rule
- Size mostly buys time, not safety or success: on a February-sized edge, 0.75% turns a median 37 days into 26; 1.00% only saves 6 more days and 10 points of pass chance.
- What decides phase 2 is whether the edge exists, not the size: with a real edge I pass at any of the three sizes within 60 days (80-100%); with zero edge I mostly do not at any size
  (7-32%), and bigger size just reaches my -6% brake more often (2.5% / 9% / 15%).
- If the edge is slightly negative, 0.75% hits my brake 38 times in 100 within 60 days. That is what the brake is for: it ends the attempt at -6% with the account alive
  instead of drifting to a breach (13% without it).
- Expectation I now hold: phase 2 takes about 18-30 trading days from here if the rule is what February or better says it is. Being at -0.75% after day 1 costs about 4 days and 8 points.
- Limits of this: reshuffling assumes each day is an independent draw from 20-40 past results. Real losing days cluster (my worst run was three in a row), and a result set this small
  cannot contain a day worse than I have already seen. Every figure above is therefore on the optimistic side.

## Decision
Size stays 0.75% ($187.50, 0.47 lots x 40 pips) with the brakes exactly as written. Nothing else changes.
Re-run this test, same rule, when the forward test reaches 20 and 40 unseen trades - with the forward results as a fifth picture.
