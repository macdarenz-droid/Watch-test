# Idea CO: why do so many of my trades go to a full stop? The coin as a control. HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY CODE
(File name says FS2 because "FS" is taken by the fresh-signal idea; the idea is called CO, coin control.)
Clock Fri 2015-06-26 01:00 London (end of released data). After funded day 65. Coach 06-25: "that was a live review, not a backtest, so no new day
yet. earn 06-26 with one honest backtest on your history: hypothesis about why so many trades go to full stop, kill test written first, max 3
variants, costs on, results table to your journal. don't change live rules until the test says so."
June goal: every number and every test rule gets one worked case before it is pushed.

## What is known (so this is not a repeat)
- The fact: full stops were 10.3% of A2's trades before funding (58 days) and 36.9% on the funded account (65 trades).
- 04-28 streak check: the morning's RANGE did not change (65 against 66 pips); mornings going 40+ pips against my entry did.
- 04-29 idea XS: the stretched signal explains about a fifth of the rise; "cause unknown".
- Since then: stop distance (SA), stop on a close (CS), entry time, confirmation entry, pre-entry hour, volatility level (VL), price zone (PZ): none
  separates the stop days. Every one of these asked "what is different about the days I am stopped on?".
Never asked: what would a trader with NO signal have got on the same mornings?

## HYPOTHESIS
My stop rate has not risen because the mornings became more dangerous for a 40 pip stop. It has risen because the 3-day signal used to put me on the
side that does NOT get stopped, and since about April it no longer does: my stop rate has gone from far below a coin's to about a coin's.
The control: on every A2 day, BOTH sides are traded from the 08:00 open with the same stop and the same noon exit, costs on. "The coin's stop rate"
= the average of the two sides' stop rates = what a trader choosing the side by a coin would get. A2's own side is one of the two each day.
Periods: BEFORE = 01-06 .. 03-26 (pre-funding); FUNDED = 03-27 .. 06-25.
Variants (3) = the stop distance of the control: CO1 40 pips (my stop; the kill lines are judged on this one); CO2 30 pips; CO3 50 pips (to see that the
answer does not hang on the number 40).
Worked cases (from my walk prints of this week): Tue 06-23: my buy from 1.12638 was stopped; a sell from the same open saw at worst the morning high
1.12805, about 17 pips against: not stopped -> the day gives the coin 1 stop in 2 sides. Wed 06-24: my sell at worst -38.0 (not stopped); a buy at worst
the low 1.11794, about 19 pips: not stopped -> 0 in 2. Thu 06-25: my sell at worst -35.9: no; a buy from 1.11927 at worst the low 1.11537, 39 pips plus
the spread on the entry: about 40 - on the edge; the tool decides.

## Kill test (judged on CO1; one failure kills the hypothesis)
- K1 "the mornings did not become more dangerous": the coin's stop rate in the FUNDED period is within 8 percentage points of the coin's rate BEFORE.
  (If the coin's rate itself rose by more than 8 points, the mornings changed and my hypothesis is wrong.)
- K2 "the signal used to keep me off the stopped side": BEFORE, A2's stop rate is at least 10 points BELOW the coin's.
- K3 "and no longer does": in the FUNDED period A2's stop rate is within 8 points of the coin's (either side of it).
- K4 the same picture in the other two stop sizes: in CO2 and CO3, A2 is below the coin BEFORE and not below it by more than 8 points in the FUNDED period.
Worked case for the lines: coin 28% before and 31% funded (K1 pass, 3 points); A2 10% before (18 under the coin: K2 pass); A2 37% funded (6 over the
coin: K3 pass). If instead the coin went from 20% to 35%, K1 fails and the mornings are the story.
MECHANICS CHECK before reading results: the control's A2-side trades must reproduce the engine's A2 (largest difference per day printed).
WHAT EACH OUTCOME WOULD MEAN - written now, and no live rule changes from either:
- Hypothesis SURVIVES: the stops are not a stop problem and not an entry-price problem. They are the visible half of "the direction call is right
  less often". No stop, filter or entry tweak can fix that (which is what 90 ideas have found one by one). The worry line W3 should then be
  redrawn as "A2's stop rate against the coin's on the same days", and I propose that to the coach - not do it.
- Hypothesis KILLED on K1: the mornings did change; then stop size against volatility is back on the table as a question for the coach.
- KILLED on K2 or K3: the picture is something else and I say what the table shows.
Worked expectation, written now: the coin's rate about 25-30% in both periods (the morning range did not change): K1 pass. A2 before about 10%: K2 pass.
A2 funded about 37% against a coin near 30%: about 7 points ABOVE the coin - K3 passes narrowly or fails narrowly. I expect the hypothesis to survive,
with the uncomfortable detail that since funding my side has been stopped slightly MORE often than the other side.
Counts when run: idea 91, variants 253-255.
