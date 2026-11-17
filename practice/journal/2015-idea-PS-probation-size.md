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
