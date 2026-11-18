# Idea PS: a probation size for an unproven setup (idea 118; coach 08-03: "careful is good, frozen isn't"; aimed at the day-20 write-up)
Written Mon 2015-08-03 22:00 London, before any code.

## The question
My return rule asks for proof before the first dollar. Proof on this history takes months (07-21 step back). The other safe lever is
SIZE: is there a risk per trade so small that even a setup with NO edge, or a slightly losing one, cannot hurt the account over a
fixed probation, so that live trades could be the evidence instead of waiting for it?

## Facts fixed now
Tracker $24,358.99. My stop-trading line $23,488.95: room $870.04. The firm's line $22,500 is $1,858.99 away.
Probation = 40 live trades (the same number route B's paper stage asks for).
Trade shape: one 40-pip-stop morning trade a day. Pool for resampling: the engine's A2 trades from 04-07 (the months when it had no
edge), shifted to the mean I want: 0.00R (a coin) and -0.10R (a mild loser). 20,000 runs of 40 trades each.

## Three sizes, no more
PS1 $62.50 a trade (0.25%, today's rule v3). PS2 $31.25 (0.125%, 0.08 lots). PS3 $15.63 (0.0625%, 0.04 lots).

## Kill line for a size (written first)
A size is SAFE FOR PROBATION only if, with a true edge of -0.10R, BOTH hold over 40 trades:
- the chance that the running drawdown from today's balance exceeds $435 (half my room to the stop-trading line) is under 5%;
- the chance that it exceeds $870 (the whole room) is under 0.5%.
The largest size that passes is the probation size I will name in tomorrow's write-up. If none passes, there is no safe probation
size and I say so.
What this test does NOT decide: whether to trade. Any probation route changes the return rule and needs my coach's agreement and a
written rule first. It also says nothing about which setup: today I have none that passed a test.
My guess: $62.50 fails the first line (about 7R of room), $31.25 passes.
Worked case first: the pool's size and its mean before shifting must match what LR printed for the window (04-07..07-15: 72 trades,
-0.081R) plus the days since.

## Facts and worked case (tool `python bt/probation_size.py 2015-08-04 facts`, before the runs)
Pool: 85 trades (04-07..08-03), mean -0.065R, spread 1.02R. The part to 07-15 is 72 trades at -0.081R: the same as LR printed on 07-15.

## Result (one run)
Tool: `python bt/probation_size.py 2015-08-04 test` (20,000 runs of 40 trades; pool 85 trades shifted to the stated edge).
In R: with a true edge of -0.10R the 40-trade drawdown is 8.3R at the median, under 16.0R in 95% of runs, under 20.6R in 99.5%.
| size | edge 0.00R: DD > $435 / > $870 | edge -0.10R: DD > $435 / > $870 | 5% worst 40-trade result at -0.10R | median result at -0.10R | lines |
|---|---|---|---|---|---|
| PS1 $62.50 (0.25%, 0.16 lots, today's rule v3) | 41.1% / 2.6% | 64.0% / 11.1% | -$889 | -$258 | FAIL / FAIL |
| PS2 $31.25 (0.125%, 0.08 lots) | 2.6% / 0.0% | 11.1% / 0.0% | -$445 | -$129 | FAIL / pass |
| PS3 $15.63 (0.0625%, 0.04 lots) | 0.0% / 0.0% | 0.0% / 0.0% | -$222 | -$65 | PASS / PASS |
**BY THE LINES WRITTEN FIRST THE PROBATION SIZE IS $15.63 A TRADE (0.04 lots at a 40-pip stop).** My guess ($31.25) was wrong: it
breaks the $435 line in 11% of runs for a mild loser.
What I learned: 1. There IS a size at which 40 live trades of a setup with no edge, or a mildly losing one, cannot reach half my room:
worst realistic cost about $220, typical cost $65. That is the price of 40 live data points. 2. A warning about my CURRENT rule: with
only $870 of room left, the v3 size ($62.50) would take a mildly losing setup to my stop-trading line in 11% of 40-trade runs. Size v3
was written for an account 3% under its high-water with A2 expected near zero; it is too big for a first return with an unproven
rule. That goes into tomorrow's write-up as a fact, not as a rule change made tonight. 3. What probation size does NOT buy: evidence
faster. 40 live trades at any size tell me exactly what 40 paper trades tell me about the edge. What it buys is real fills, real
discipline under money, and an account that is not idle. Whether that is worth $65-$220 is my coach's call with me, not a test's.
Limits: trades resampled as independent; pool spread 1.02R; a setup with fatter losses than A2's would need more room.
Counts: idea 118; variants 326-328.
