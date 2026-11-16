# Exit / management on A2: protect open profit in the LAST HOUR before noon. HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY CODE OR RUN
Clock Fri 2015-05-01 01:00 London (end of released data). All lived history 01-06 .. 04-30 (explicit end 2015-05-01); costs on; London time.
Coach, 04-30: "you're at 47+ ideas: next test, pick your single best idea (A2) and work on its exits/management, not a new entry filter. Hypothesis + kill test first."

## What I looked at first, and what I dropped for lack of sample (states only, counted before choosing; no outcomes)
- My first thought was the LOSS side (live average loss -0.69R): cut a trade that is deep under water late in the morning. Count: of 83 A2 trades, 74 are still open at
  10:00 and 73 at 11:00; under water by 20+ pips at 10:00: SEVEN; at 11:00: NINE (by 10+ pips: 15 and 19). Seven to nine cases cannot carry a test - the close-stop test
  (7 cases) already taught me that. Dropped, said plainly.
- The WINNER side has the sample: in profit by 20+ pips at 10:00: 32 trades; at 11:00: 36 trades.

## What is already tested on the winner side (so this is not a re-run)
Fixed target (+60), break-even at +20 and at +1R, trailing stops 20/30/40 pips from the best price, partial at +1R and +0.5R, runner past noon, exit at 10:00 / 11:00 / 13:00
for ALL trades, add at +1R. All lost to "whole position, out at noon", mostly because they cut the mornings that keep running.
Never tested: a rule that does nothing for the first three hours and only acts at a fixed late TIME, only on trades that are in profit then.
The reasoning: a trailing stop from 08:00 strangles the run; but by 11:00 the run is three-quarters done, and what is left is one hour in which I can still give back half.

## Where it comes from (and the day I must remove)
Thursday 04-30: +132 pips open at 09:15, +53 at 11:00, closed +75. My note at 11:00: "it hurts to watch +3R become +1.3R". That day is the inspiration and is REMOVED
from every number. Earlier journal notes cut both ways: 04-17 "the last hour made the high of the morning"; 04-10 "closed on the low"; the 20-trade review: "real winners
were still extending after 10:30". So my own notes do not agree with today's feeling. Written before the run.

## Hypothesis
For trades that are in profit at 11:00 London, the last hour gives back more than it adds often enough that protecting half of the open profit with a stop, or simply
banking at 11:00, raises net R - without costing the mornings that are still running.

## Variants (132, 133, 134; ideas -> 49), no others afterwards. Entry, size, initial 40 pip stop and the 12:00 exit exactly A2. Nothing happens before the check time.
- LK1: at 11:00, if the trade is 20+ pips in profit, the stop is moved to entry + HALF of the open profit; then noon as usual.
- LK2: the same check at 10:00 instead (earlier, more of the morning protected, more room to be stopped out of a runner).
- LK3: at 11:00, if the trade is 20+ pips in profit, close it at market (bank; a conditional 11:00 exit).

## KILL TEST (explicit). Same-trade comparison per day, engine, full costs; 04-30 removed. The build can only kill; a survivor gets a forward PAPER tag (100 forward
trades; at least +0.10R per trade better than A2 at two standard errors) - never a live change from a backtest.
A variant survives only if ALL:
  K1. net R over all history is HIGHER than A2's by at least 1.0R (a protection rule that does not add at least one R in 82 trades is not worth a rule);
  K2. it is ahead of A2 in the backtest months (01-06..02-27) AND in the live months (03-02..04-29), each separately;
  K3. on the days where it changes the result, at least as many days are improved as worsened, and no single day makes more than half of the total gain;
  K4. maximum drawdown and the worst 10 trades in a row are not worse than A2's.
Sample, plainly: 36 trades are eligible at 11:00 and 32 at 10:00; the result only differs on the days the new stop is actually hit (LK1, LK2) - I expect 8 to 15 such days.
LK3 changes all 36.
My guess, written now: the last hour is about a coin for trades in profit. LK1 changes about ten days, gains and losses of 0.2-0.5R each, net within +-1R of A2: fails K1.
LK2 is clearly worse (it would have stopped 04-28 and several January runs early). LK3 loses a little (ET11 lost on all trades). No survivor - and if so, the exit
side is closed for good unless the live record changes character.

# RESULTS (kill test above pushed in commit fe204c0 before any code; one run: `python bt/ab_lock.py LK1,LK2,LK3 2015-05-01 2015-04-30`)
82 A2 days 01-06..04-29 (04-30 removed), engine, full costs, per day.

## Mechanics checked by hand on two days BEFORE the totals (neither is the inspiring day)
- 04-09, sell 1.07771: at 11:00 the open is 1.07435 = +32.6 pips -> LK1 stop to entry minus half = 1.07608; the worst price for me from 11:00 to noon is +7.3 pips, so the
  stop is hit at 11:40: +0.40R (A2 at noon +0.33R; LK3 banks at 11:00: +0.81R). Engine = candles.
- 04-17, buy 1.07502: at 11:00 +72.5 pips -> stop to 1.07865 (+36.3); the worst price in the last hour is +64.3: not hit, noon as A2, +1.73R. Engine = candles.

## Totals
| | net R | vs A2 | backtest months | live months | max DD | worst 10 | days changed | better / worse |
|---|---|---|---|---|---|---|---|---|
| A2: nothing until noon | +34.10 | - | +19.56 | +14.54 | 3.28R | -1.70R | - | - |
| LK1: at 11:00, 20+ pips up -> stop to half the open profit | +32.51 | -1.59 | -0.87 | -0.72 | 3.28R | -1.70R | 6 | 3 (+0.36R) / 3 (-1.95R) |
| LK2: the same at 10:00 | +32.31 | -1.79 | -2.73 | +0.95 | 3.28R | -2.40R | 9 | 5 (+1.78R) / 4 (-3.56R) |
| LK3: at 11:00, 20+ pips up -> close | +27.91 | -6.19 | -3.12 | -3.07 | 3.28R | -2.11R | 34 | 14 (+4.04R) / 20 (-10.23R) |
The inspiring day, not counted: 04-30 A2 +1.88R; LK1 +1.88R (the lock at +26 pips was never touched), LK2 +1.15R, LK3 +1.31R. The rule I built because of that day
would not have changed that day.

## Kill lines applied
| line | LK1 | LK2 | LK3 |
|---|---|---|---|
| K1 at least +1.0R above A2 | FAIL (-1.59) | FAIL (-1.79) | FAIL (-6.19) |
| K2 ahead in both periods | FAIL (behind in both) | FAIL (behind in the backtest months) | FAIL (behind in both) |
| K3 improved >= worsened, no day > half the gain | FAIL (no gain) | FAIL (no gain) | FAIL |
| K4 max DD and worst 10 not worse | PASS | FAIL | FAIL |
VERDICT: NO SURVIVOR. Idea closed, no tag. The exit stays "40 pip stop, whole position, out 12:00 London".

## My guess against what happened
"LK1 changes about ten days, net within +-1R": it changes SIX days and is 1.59R behind - the lock is almost never hit, and when it is, it takes out a runner
(01-15: +2.08R became +1.12R; 03-20: +1.07R became +0.26R). "LK2 clearly worse": 1.79R behind, deeper worst stretch. "LK3 loses a little": it loses 6.19R - a lot.

## What I learned
- The last hour before noon is not a give-back hour. For the 34 trades that were 20+ pips in profit at 11:00, the hour from 11:00 to 12:00 ADDED 6.19R in total
  (+0.18R per trade): 20 of the 34 were better at noon than at 11:00. Thursday's 80 pip give-back happened between 09:15 and 11:00 - before any of these rules look -
  and in its last hour the trade actually gained 22 pips.
- So the feeling "protect it late" was aimed at the wrong hour, and the rule built from it would not even have touched the day that produced the feeling.
- A stop at half the open profit an hour before the exit is hit on 6 days in 82: three small gains, three losses of half a runner. It is not protection; it is a
  small tax on the best mornings.
- Exit and management side, final count: 29 definitions tested on this rule (stops tighter / wider / structural / on a close; break-even three ways; trailing; target;
  wall; runner; scale-out and partial; add; exit hours 10 / 11 / 13 / 16; 09:00 and first-hour checks; late lock). None beats the plain noon exit on all history.
  Unless the live record changes character, I have nothing left to test here, and I would rather say that than invent a 30th.
- What the coach's direction did show me again: the edge of this rule is "be in from 08:00 and stay until 12:00". Every hour I take out of that window costs.
Counts: ideas 49, variants 134.
