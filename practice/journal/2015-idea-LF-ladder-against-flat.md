# Idea LF: my half-size / full-size ladder against flat sizing - drawdown, recovery time, and what each costs. PRE-REGISTERED BEFORE ANY CODE
Clock Tue 2015-07-07 01:00 London (end of released data). After funded day 72 (half size day 1). Coach 07-06: "position sizing math. test on your history
how your half-size/full-size ladder affects drawdown and recovery time vs flat sizing, pre-registered, max 3 variants."
July goal: a worked case before every pushed number or rule; every file write read back.

## What is already known (so this adds, not repeats)
- SZ (05-05): restoring full size earlier, or dropping the half step, fails: the step cut my own-stop odds from 49% to 15% at the planning edge (then with a 5% stop).
- WS / GD / SG / ST: the 7% stop; the guard caps a dead edge at about -5%; 0.50% beats 0.75% and 1.00%; no breach from today's state.
NOT measured before: RECOVERY - how long the ladder keeps me under water compared with flat sizing, from a fresh start and from where I stand
today (half size on, $832 under the high-water), and what the ladder costs in payouts.

## The three policies (variants; everything else identical: A2's trade list, real-fill extras, the 7% stop, the payout rule, the firm's lines)
- LF1 THE LADDER (live rule): 0.50%; half size (0.25%) from a close 3% under the high-water until a new high-water.
- LF2 FLAT FULL: 0.50% always (no half step).
- LF3 FLAT HALF: 0.25% always.
Method: the machinery of bt/sizing_growth.py with the half step as a switch. 2,000 runs x 500 trading days, plain and 5-day-block draws, true edges
+0.18R (planning), +0.10R, 0.00R. Two starting states: FRESH (balance 0%, high-water 0%) and NOW (balance -2.302% = $24,424.59, high-water +1.028% = $25,256.94).
Measured: my own 7% stop reached (%); breach (%); median maximum drawdown (% of $25,000, from the high-water); median longest stretch under water
(days); my median payout; and from NOW: the share of runs that make a NEW HIGH-WATER within 60 / 120 / 250 days and the median day of it.

## Worked cases (arithmetic, before any run)
From NOW the high-water is $832.35 away and my stop line $935.64 away.
- LADDER / FLAT HALF: $62.50 a trade -> 13.3R up to the high-water, 15.0R down to the stop. At +0.18R a trade the drift alone needs about 74 trades.
- FLAT FULL: $125 a trade -> 6.7R up, 7.5R down. Drift alone: about 37 trades. Twice as fast up - and twice as fast down.
So I expect: recovery within 250 days at +0.18R: flat full clearly more often than the ladder in the EARLY months (60 and 120 days), and the stop
reached about twice as often. With a standard deviation of about 1.05R a trade, 13R of net progress in 250 trades (drift 45R +- 17R) is very likely
if the edge is +0.18R; 6.7R in 60 trades (drift 11R +- 8R) is only likely for flat full.

## Lines the LADDER (the live rule) must pass to stay justified - one failure and I put the question to the coach (no live change by me)
- K1 protection: at 0.00R and at +0.10R, from both states, the ladder reaches my own stop at least 5 percentage points LESS often than flat full.
- K2 depth: the ladder's median maximum drawdown is smaller than flat full's at every edge (FRESH state).
- K3 price: at +0.18R from FRESH, my median payout under the ladder is at least 80% of flat full's.
- K4 recovery: from NOW at +0.18R, the ladder makes a new high-water within 250 days in at least 60% as many runs as flat full does.
- K5 against flat half: at +0.18R from FRESH the ladder pays at least 25% more than flat half (otherwise permanent half size would be the simpler rule),
  and at 0.00R it does not reach the stop more than 10 points more often than flat half.
MECHANICS REGRESSION: with the half step ON at 0.50% the new script must reproduce `python bt/sizing_growth.py 2015-07-07 0.090 1.122 0.50 0.18`
(own stop, breach, lowest balance, payout) exactly.
Worked expectation: K1 pass (flat full reaches the stop far more often when the edge is small). K2 pass. K3: pass, near 85-90%. K4: pass (ladder
about 75-85% of flat full's 250-day recovery). K5: pass. The ladder stays. The numbers I do not know and want: the recovery clock from NOW.
Counts when run: idea 98, variants 274-276.

## Mechanics regression (lines pushed first in commit 947734f)
`python bt/sizing_growth.py 2015-07-07 0.090 1.122 0.50 0.18`: own stop 2.2% / 2.1%, breached 0.00%, lowest -6.32% / -6.41%, my payout $5,997 / $6,099.
`python bt/ladder_vs_flat.py 2015-07-07 --regress 0.090 1.122`: the same figures exactly.

## RESULTS (one run: `python bt/ladder_vs_flat.py 2015-07-07`; 130 trades in the list; 2,000 runs x 500 days; plain draw shown, block in brackets where it differs in meaning; breach 0.00% everywhere)
FROM A FRESH START
| true edge | policy | my own 7% stop reached | median max drawdown | median longest stretch under water | MY median payout in 2 years |
|---|---|---|---|---|---|
| +0.18R | LF1 ladder | 2.2% (2.1%) | 4.37% | 121 days | $6,006 ($6,110) |
| +0.18R | LF2 flat full | 24.7% (21.6%) | 5.68% | 70 days | $7,510 ($7,693) |
| +0.18R | LF3 flat half | 0.6% (0.2%) | 2.84% | 80 days | $3,959 ($4,001) |
| +0.10R | LF1 ladder | 18.2% (17.2%) | 5.47% | 184 days | $2,485 |
| +0.10R | LF2 flat full | 64.9% (61.1%) | 7.08% | 84 days | $3,011 |
| +0.10R | LF3 flat half | 7.6% (5.8%) | 4.00% | 143 days | $2,104 |
| 0.00R | LF1 ladder | 76.4% (73.8%) | 7.07% | 192 days | $304 |
| 0.00R | LF2 flat full | 97.5% (96.8%) | 7.21% | 68 days | $406 |
| 0.00R | LF3 flat half | 60.3% (57.6%) | 7.03% | 209 days | $388 |
FROM WHERE I STAND (balance $24,424.59, high-water $25,256.94, half size on) - the recovery clock
| true edge | policy | own stop | NEW HIGH-WATER within 60 / 120 / 250 days | median day of the new high-water | MY median payout |
|---|---|---|---|---|---|
| +0.18R | ladder (= flat half until the high-water) | 3.0% | 40% / 79% / 96% | day 70 | $5,116 |
| +0.18R | flat full | 29.3% | 76% / 89% / 91% | day 28 | $6,911 |
| +0.10R | ladder | 22.0% | 22% / 51% / 79% | day 103 | $1,765 |
| +0.10R | flat full | 70.2% | 58% / 72% / 75% | day 33 | $2,031 |
| 0.00R | ladder | 80.0% | 9% / 19% / 31% | day 122 | $0 |
| 0.00R | flat full | 98.2% | 32% / 42% / 45% | day 33 | $0 |
| line for the ladder | result |
|---|---|
| K1 protection: stop reached at least 5 points less often than flat full at 0.00R and +0.10R | PASS (18% against 65%; 76% against 98%; from now 22% against 70%) |
| K2 depth: smaller median max drawdown than flat full | PASS (4.37% / 5.68%; 5.47% / 7.08%; 7.07% / 7.21%) |
| K3 price: at least 80% of flat full's payout at +0.18R | FAIL: 79% (80.0% plain, 79.4% block - under the line by 0.6 of a point in one draw) |
| K4 recovery from now: at least 60% of flat full's 250-day rate | PASS: 106% (96% against 91%) |
| K5 against flat half: pays at least 25% more at +0.18R AND reaches the stop not more than 10 points more often at 0.00R | FAIL on the second half: payout x1.52, but stop +16.1 points (76.4% against 60.3%) |
BY THE LINES AS WRITTEN: the ladder passes three and FAILS TWO. As written before the run, that goes to the coach as a question. I change nothing live.

## Expectation against the run
K1, K2, K4 pass: yes. K3 "pass, near 85-90%": it is 79-80%: I over-guessed the ladder's income, as I under-guessed the stop odds in SG and GD -
the same error a third time: a trailing rule costs more than my intuition says. K5 "pass": the payout half yes, the stop half no.
Recovery from now: I worked "74 trades by drift alone" at +0.18R; the median is day 70.

## What the table says about drawdown and recovery (the coach's question)
- DEPTH: the ladder cuts the median worst drawdown from 5.7% to 4.4% at the planning edge and, far more important, the odds of ending at my own stop
  from about 23% to 2% (at +0.10R from 63% to 18%). Flat full is not a serious alternative at any edge I might have. That part of the rule is doing
  what it was written for.
- RECOVERY TIME: the price is time under water: a median longest stretch of 121 days against 70 (184 against 84 at +0.10R). From where I stand,
  half size means a new high-water within 60 days in 40% of runs at the planning edge where full size would give 76% - but by day 250 the ladder has
  recovered in MORE runs (96% against 91%), because full size loses three runs in ten to the stop on the way. Slower and surer.
- THE CLOCK I WANTED, for my own patience: if the edge is +0.18R, the median way back to full size is about 70 trading days (mid-October); if it is
  +0.10R, about 100 days with one run in five ending at my stop first; if it is zero, four runs in five end at the stop and one in three ever sees
  a new high. I should expect months at 0.16 lots, not weeks, and I should not read anything into them.
- PAYOUT: none while half size is on (plan); the table's payouts already include that.

## The two failed lines, read strictly, and the question for the coach
- K3 (79% against a line of 80%): the ladder gives up a fifth of flat full's income to cut the stop odds by a factor of ten. I wrote 80% and it
  is 79.4% in one draw: FAILED, and I would be embarrassed to argue 0.6 of a point either way. My reading: the trade is plainly worth it; the line
  was drawn too close to the truth. I do not propose changing anything for K3.
- K5 is the real one. PERMANENT HALF SIZE (0.25% always) is the safer rule when the edge is small or gone: stop reached in 60% of runs against
  76% at zero edge, 8% against 18% at +0.10R - and it costs a third of the income at the planning edge ($3,959 against $6,006) but only 15% at
  +0.10R. Idea SG left "sizes under 0.50%" as a question for the coach; this is its answer in numbers. And idea RG says the edge has been about
  zero for two months.
- What is NOT needed: a decision today. I am at half size by the rule until a new high-water, and until then the ladder and flat half are the
  SAME policy (the table shows identical rows). The question only becomes real on the day the balance passes $25,256.94: go back to 0.31 lots
  (the rule as written), or stay at 0.16? That day is at best two to three months away, with 50 to 70 more lived trades to judge the edge by.
- So the question I put to the coach, with no change made: should the plan get a PRE-WRITTEN line for that day - for example "full size returns at
  a new high-water only if the lived average over the last 60 trades is above +0.10R; otherwise half size stays as the base size" - to be written
  and tested now, while it does not matter, rather than decided on the day?
Counts: ideas 98, variants 276 (LF1, LF2, LF3). Adopted trading ideas: 0. July: numbers corrected after a push: 1; file errors found late: 0.
