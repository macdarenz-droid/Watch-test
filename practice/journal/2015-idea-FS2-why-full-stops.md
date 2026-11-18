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

## Mechanics check (hypothesis and kill test pushed first in commit 50d045f)
The control's A2 side against the engine's A2 at 40 pips: largest difference per day 0.000R, stop days identical, 123 days.
06-23: my buy stopped (-1.03R), the sell not (+1.08R): 1 of 2, as worked. 06-25: neither side stopped (the buy +0.09R): the edge case fell on "not stopped".

## RESULTS (one run: `python bt/coin_control.py 2015-06-26`; both sides from the 08:00 open, noon exit, costs on; figures copied from the print)
| stop | period | days | COIN's stop rate | A2's side | the other side | avg R: A2's side / other side / coin |
|---|---|---|---|---|---|---|
| CO1 40 pips | BEFORE funding | 58 | 29.3% | 10.3% (6) | 48.3% (28) | +0.531 / -0.467 / +0.032 |
| CO1 40 pips | FUNDED | 65 | 37.7% | 36.9% (24) | 38.5% (25) | +0.037 / -0.055 / -0.009 |
| CO2 30 pips | BEFORE | 58 | 38.8% | 20.7% (12) | 56.9% (33) | +0.663 / -0.495 / +0.084 |
| CO2 30 pips | FUNDED | 65 | 47.7% | 49.2% (32) | 46.2% (30) | +0.054 / -0.007 / +0.024 |
| CO3 50 pips | BEFORE | 58 | 24.1% | 8.6% (5) | 39.7% (23) | +0.423 / -0.414 / +0.004 |
| CO3 50 pips | FUNDED | 65 | 26.2% | 24.6% (16) | 27.7% (18) | +0.042 / -0.070 / -0.014 |
By month at 40 pips, A2's stop rate / the coin's: Jan 11% / 32% | Feb 5% / 18% | Mar 18% / 41% | Apr 27% / 34% | May 43% / 40% | Jun 42% / 37%.
| kill line (CO1) | figures | result |
|---|---|---|
| K1 the coin's rate changed by 8 points or less | 29.3% -> 37.7%: +8.4 points | FAIL, by 0.4 |
| K2 before funding A2 at least 10 points under the coin | 10.3% against 29.3%: -19.0 | PASS |
| K3 funded: A2 within 8 points of the coin | 36.9% against 37.7%: -0.8 | PASS |
| K4 the same picture at 30 and 50 pips | 20.7 / 38.8 -> 49.2 / 47.7; 8.6 / 24.1 -> 24.6 / 26.2 | PASS |
VERDICT, by the test as written: the hypothesis is KILLED on K1. I wrote "the mornings did NOT become more dangerous" and the coin's own stop rate
rose by 8.4 points, 0.4 more than the line allowed. I do not round that away. The hypothesis as a whole - "it is ONLY the signal" - is wrong.

## What the table says, both halves
My stop rate rose by 26.6 points (10.3% -> 36.9%). The control splits that rise in two:
- 8.4 points: the mornings. A trader with no signal at all is stopped more often since 03-27 at a 40 pip stop (and at 30: +8.9; at 50 only +2.1).
- 18.2 points: the signal. Before funding my side was stopped 10% of the time and the OTHER side 48%: the 3-day direction kept me off the stopped side
  on almost every dangerous morning. On the funded account: mine 36.9%, the other side 38.5%. The difference is gone. In average R: my side +0.037,
  the other side -0.055 - nine hundredths apart, of which costs are a part.
- By month it is not a step on 03-27 but a slide: 11% / 32% in January, 27% / 34% in April, and in May and June my side is stopped slightly MORE
  often than a coin's (43% / 40%, 42% / 37%).
My expectation was wrong twice: I said the coin's rate would be the same in both periods (it rose), and that my side would sit about 7 points above
the coin since funding (it sits 0.8 under). I was right only about the size of the old advantage.

## What this means, and what I do NOT do with it
- "Why so many full stops?" has an answer now, in two unequal parts: one third is harder mornings, two thirds is that the signal has stopped
  choosing the safe side. Neither part is about where my stop is or how I enter: at 30, 40 and 50 pips the picture is the same. That is why SA, CS, CF,
  ET, the filters and the price zone all found nothing - they were looking for a bad stop or a bad entry, and the stop days are simply the days the
  direction was wrong, of which there are now as many as a coin has.
- This is the most serious result I have written about A2. In May and June - 40 trades - the rule's side has been no safer than the other side.
  It is the same fact as LX's "not told apart from zero", seen from the stop side, and it is two months, 40 trades: 43% against 40% is noise around
  "equal", and equal is the finding.
- What I do not do: change a live rule. The coach said not until a test says so, and this test does not say what to change - it says what is
  NOT the cause. The plan already has the instrument for "the edge may be gone": the worry lines (W1: lived average under -0.019R at 100 trades,
  under +0.015R at 150) and behind them the size rule, which caps a dead edge at about 5-6% of the account (idea GD). Trading continues at 0.50%.
- As written before the run for a kill on K1: stop size against the morning's volatility is a question I put to the coach rather than answer myself.
  My own reading is that it is the small part: at 50 pips the coin's rate hardly moved (+2.1) and my side's rise was the same story (8.6% -> 24.6%).
- W3 (yesterday's question): this table gives the better line. "A2's stop rate within 5 points of the coin's, or above it, over the last 60 trades"
  measures the thing that actually changed. It would have been crossed since May. I propose it to the coach; I do not adopt it on my own.
- For the month-end review next week: the monthly row "A2's stop rate / the coin's" goes into it, every month from now on.
Counts: ideas 91, variants 255 (CO1, CO2, CO3). Adopted trading ideas: 0. Numbers or rules corrected after a push in June: 3 (none today).
