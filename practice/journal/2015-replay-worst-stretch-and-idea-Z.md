# Replay of my worst losing stretch, bar by bar on M15 + ONE lesson turned into a test (written before any run)
Clock Tue 2015-03-17 00:00 UTC (end of released data). Jan-Feb only; March not used.
The stretch: Wed 02-18, Thu 02-19, Fri 02-20 - three A2 buys, -0.47R, -0.36R, -1.02R = -1.86R, my deepest run. Replayed candle by candle from 06:00 to 12:00 (bt printout of M15 bars).

## Wed 02-18 - BUY 08:00 @1.1389, closed 12:00 @1.1370 (-0.47R)
| Time | What the candles showed | What I did | What a better trader would have done |
|---|---|---|---|
| 07:00 | Night slid 25 pips in lower highs (1.1416 -> 1.1391). Signal "up" by 8 pips of closes. Tuesday had failed at 1.1449 (3rd time) | wrote "pure coin flip", planned the buy | written the level down as the day's ceiling: 1.1445-50, 55 pips above |
| 08:00 | Entry on the night's low | bought | same entry is fine by the rule |
| 08:45-09:00 | One candle +23 pips to 1.1407-12 = back to the Asia high. Trade +18. Then three candles of lower highs | held | nothing yet: +18 pips is noise; no level was reached |
| 11:15 | 22 pip drop through the morning low | held to noon | nothing: the stop and the clock are the plan |
Verdict: no decision point where a rule-following trader does better. A valid loser.

## Thu 02-19 - BUY 08:00 @1.1410, closed 12:00 @1.1372 (-0.36R)
| Time | What the candles showed | What I did | What a better trader would have done |
|---|---|---|---|
| 07:00 | Signal "up" by 9 pips. Wednesday's dip had been bought back. Ceiling 1.1445-50 tested three times in four days, 35-40 pips above my entry | wrote "35 pips above = little room" and bought anyway, with no plan for the level | PLANNED THE LEVEL: "if it gets to 1.1445-50 I am out" - the trade's whole upside was a known number, smaller than my stop |
| 08:15-08:30 | Two strong candles straight to 1.1450 - the level, to the pip. Trade +33 pips (+0.83R) | watched | sold into the level: +0.8R banked |
| 08:45-09:15 | Three candles stalling at 1.1441-50, fourth failure | held | already out |
| 09:30-10:00 | 60 pip slide from the level to 1.1385. Trade -22 | held | flat |
| 12:00 | Another leg down | closed -0.36R | flat |
Verdict: THE decision point of the stretch. I had written the level in my own journal at 07:00 and had no rule that used it. Swing between what I did and the better trade: 1.2R.

## Fri 02-20 - BUY 08:00 @1.1357, stopped 09:07 (-1.02R)
| Time | What the candles showed | What I did | What a better trader would have done |
|---|---|---|---|
| 07:00 | Thursday fell 95 pips from the ceiling; signal "up" by 15 pips; 07:00 candle broke under the night's range | planned the buy | (idea G: don't fight the first break - tested, killed: fakes 5 times in 6 in January) |
| 08:00 | First candle -31 pips at once | in, under water from the first minute | nothing a tested rule offers |
| 09:00 | Through the stop | stopped | - |
Verdict: a valid loser; the lesson people would draw here I have already tested and buried.

## The one clearest lesson
A2 knows direction and time, and nothing about PLACE. On 02-19 the price reached a level that had turned the market three times that week - a level I had written down myself -
and the rule had nothing to say. Support and resistance was on my beginner's list in week 1 and it is the one basic I have never tested.
(The other things this stretch suggests - coin-flip signals, first-hour breaks, giving back open profit - are ideas D/G/X/T, already tested.)

## The test: idea Z "bank at the wall" (ideas -> 19)
Definition of a wall, fixed before running: the highest high (for a buy) or lowest low (for a sell) of the last N full trading days, PROVIDED that extreme was set at least 2 trading days ago.
An extreme set yesterday is a trend making new ground, not a wall; one that is days old and still standing has held.
Rule change (single): A2 exactly as frozen, plus a take-profit 2 pips in front of the wall, only when the wall is at least 10 pips beyond my entry. No wall -> plain A2.
Hypothesis: in a sideways market the morning move tends to die at a standing wall, so banking there beats the noon clock; in a trend there is usually no standing wall in
front of the trade (the extremes are fresh), so the rule stays out of the way - which is exactly where every earlier exit idea failed.
Variants (42, 43, 44), no others afterwards:
- Z1: N = 5 days, wall must be >= 2 days old.
- Z2: N = 10 days, wall must be >= 2 days old.
- Z3: N = 10 days, any age (control: does the "standing" condition matter, or is any recent extreme a wall?).

Kill tests (fixed now; same bars as my other exit tests):
Build - January: a variant survives only if avg R >= A2's + 0.05R and max drawdown <= A2's + 0.25R. Highest January avg R among survivors = the candidate.
Check - February (CONTAMINATED), judged with 02-19 REMOVED (the day the idea comes from); all three shown, only the candidate can be claimed:
  avg R >= A2's + 0.15R; net R >= A2's; max drawdown <= A2's.
Also reported: how many trades each variant touched, and whether it helped or hurt each.

My guess, written now: January has few standing walls in front of sells, so Z1/Z2 barely touch it and miss the +0.05R bar (cannot be built on a trend month);
Z3 caps January's winners and fails like X3 did. If that is right, the wall idea is not dead - it simply cannot be judged on a trend month plus a contaminated one, and would need forward days.
Nothing above has been run.

# RESULTS of idea Z (run after commit 3dc7fb8). Z1/Z2/Z3 = variants 42/43/44; ideas 19. Costs on, $125 risk, same entries as A2. Jan-Feb only, one month per run (bt/ab_exit.py); March not used.

| Month | Rule | Trades | Win rate | Avg R | Net R | Max DD | Trades it changed |
|---|---|---|---|---|---|---|---|
| Jan (build) | A2 (before) | 19 | 74% | +0.78 | +14.79 | 1.33R | - |
| Jan (build) | Z1: 5-day wall, >= 2 days old | 19 | 74% | +0.78 | +14.79 | 1.33R | none |
| Jan (build) | Z2: 10-day wall, >= 2 days old | 19 | 74% | +0.78 | +14.79 | 1.33R | none |
| Jan (build) | Z3: 10-day extreme, any age (control) | 19 | 74% | +0.59 | +11.22 | 1.33R | 1: 01-23 +4.27 -> +0.69R |
| Feb (CONTAMINATED) | A2 (before) | 20 | 55% | +0.23 | +4.64 | 1.86R | - |
| Feb (CONTAMINATED) | Z1 | 20 | 60% | +0.30 | +5.95 | 1.02R | 2: 02-17 +2.14 -> +2.18R; 02-19 -0.36 -> +0.91R |
| Feb (CONTAMINATED) | Z2 | 20 | 55% | +0.23 | +4.64 | 1.86R | none |
| Feb (CONTAMINATED) | Z3 | 20 | 55% | +0.23 | +4.64 | 1.86R | none |
February Z1 with the inspiring day 02-19 removed: one trade changed, +0.04R. That is the whole effect.

## Build (January): NO SURVIVOR - and nothing to build on
- Z1 and Z2 never fired in January: no standing wall sat within reach in front of a trade. +0.00R against a +0.05R bar. They cannot be built on a trend month, as I guessed.
- Z3 (the control) fired once and destroyed my best day (01-23: +4.27R cut to +0.69R). So the "standing" condition is not decoration: a fresh extreme in a trend is NOT a wall.
## Check (February): nothing to claim
Z1 fixes exactly the day it was drawn from (02-19, +1.27R better) and touches one other trade by +0.04R. Take 02-19 out and the rule did nothing for a month.

## Verdict: closed, not adopted. A2 stays.
- The honest finding is about frequency, not direction: a wall that has held for days AND sits within a London morning's reach in front of my trade happened about twice in 39 trades.
  A rule that fires twice in two months cannot be tested on two months, and cannot move a challenge either way.
- The replay lesson stays true for that one morning - I wrote the level at 07:00 and had no plan for it - and it stays an anecdote. Same shape as idea G: the rule built from my
  worst day fixes my worst day.
- What I keep as a habit, not a rule: the 07:00 call already lists levels. From now it also says, in words, whether a level that has held for days sits inside the stop distance
  in front of the trade. Not to act on - to collect cases forward, so that in a few months "bank at the wall" can be judged on more than one Thursday.
- Counts: ideas 19, variants 44.
