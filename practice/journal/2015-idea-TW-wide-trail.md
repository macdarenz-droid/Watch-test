# Idea TW (idea 64): one exit rule on A2 - a WIDE trailing stop for the big mornings - PRE-REGISTRATION (pushed before any run)
Sim clock Fri 2015-05-22 01:00 London. END 2015-05-22.
Coach 05-21: "your noon exit gave back 55 pips last win - next test: one exit rule on A2 (target, trail, or time), kill lines first."
## Which one of the three, and why (decided before any result)
- TIME: the exit hour is known by month (10:00 / 11:00 / 13:00 all worse than noon in Jan, Feb and clean March), and an earlier clock does nothing for
  05-19, whose best price came at 08:45.
- TARGET: a target caps exactly the trades that carry my average. 01-23 was +4.30R, 03-23 +2.58R; a +60 pip target was worse than A2 in January (X3).
- TRAIL: keeps the tail open and only acts after a big run. The trails I tested (TR, January only) were TIGHT: 20 or 30 pips from +20 / +30 / +40. They
  cut ordinary winners. A WIDE trail that wakes up only on a big morning has never been run. That is the one rule.
## Looked first: the sample, counted without any result (python over the A2 list to 2015-05-22)
98 A2 trades. Best open profit reached 60+ pips on 23 trades (13 since 03-02), 80+ on 10 (7), 100+ on 6 (4), 120+ on 5 (3).
Said plainly: 30 changed trades cannot be reached. Big mornings are rare by nature, and a rule for them lives on about 20 trades at most. Whatever
comes out is thin; the most a pass could earn is a forward paper tag, and "no evidence" is a possible honest verdict.
The live case behind it: 05-19, best +142.6 pips at 08:45, closed +87.5 at noon. Beside it, from my LK work: the hour 11:00-12:00 ADDS +0.18R per trade
that is in profit (20 of 34 better at noon), and LK1-LK3 (lock or bank at 10:00 / 11:00) lost 1.6R to 6.2R against A2 on all history.
## The rule and its settings (3; engine parameter trail = (activate, distance), unchanged code of idea TR; stop moves only in my favour, from the next bar)
- TW1: once the trade has been 60 pips in profit, the stop trails 40 pips behind the best price.
- TW2: once 60 pips in profit, trail 30 pips behind.
- TW3: once 80 pips in profit, trail 40 pips behind.
Everything else is A2: 08:00 entry, 40 pip stop until the trail wakes, noon exit.
## Data and contamination
All A2 days before 2015-05-22. Inspiring day 05-19 DROPPED for the decision (reported beside). Known: TR on January (worse), LK on all history (worse).
## Kill lines (the same-trade exit lines printed by bt/ab_lock.py; decision set; one failure kills)
- K1: at least +1.0R above A2.
- K2: ahead of A2 in both periods (before 03-02; from 03-02).
- K3: improved days >= worsened days, and no single day more than half the gain.
- K4: max drawdown and worst 10 in a row not worse than A2's.
- K5 (sample): at least 10 changed days. Under 10 the verdict is "too thin", not adopted, whatever the total says.
Hand-check before totals: one changed day, the trail's stop price and exit worked from the M5 bars by hand against the engine.
My guess, written now (I have guessed too kindly all month, so I lean the other way): TW1 about 3R behind A2, TW2 about 4R behind, TW3 about 1R behind
with fewer than 10 changed days. All killed. 05-19 itself would have been better with any of them.

## Mechanics hand-check (on the inspiring day only, which is not in the decision)
05-19, sell from 1.13038. The lowest bid of the morning was 1.11602 in the 08:50 M5 candle; the engine trails on the ask (bid + 1.0 pip spread) = 1.11612;
40 pips behind = 1.12012. The engine's TW1 exit: 1.12013 at 10:05, +2.56R against A2's +2.18R at noon. By hand and by engine the same price.

## Results (run once; `python bt/ab_lock.py TW1,TW2,TW3 2015-05-22 2015-05-19`; figures copied from the print)
DECISION SET (97 days, 05-19 dropped): A2 +32.52R (backtest +19.56R, live +12.96R). (Its max DD reads 4.93R here only because the +2.17R day is taken out.)
| setting | net R (vs A2) | backtest (vs A2) | live (vs A2) | changed days | better / worse | the changed days, A2 -> variant |
|---|---|---|---|---|---|---|
| TW1 60 / 40 | +32.96 (+0.44) | +20.20 (+0.64) | +12.77 (-0.20) | 4 | 3 (+1.10R) / 1 (-0.66R) | 01-15 +2.08 -> +2.72; 03-11 +1.97 -> +2.01; 04-15 +1.49 -> +0.83; 04-30 +1.88 -> +2.30 |
| TW2 60 / 30 | +29.71 (-2.81) | +17.50 (-2.05) | +12.21 (-0.75) | 10 | 4 (+1.88R) / 6 (-4.68R) | incl. 01-23 +4.30 -> +1.41 (my biggest day cut by 2.88R) |
| TW3 80 / 40 | +33.63 (+1.10) | +20.20 (+0.64) | +13.43 (+0.46) | 3 | 3 (+1.10R) / 0 | 01-15 +2.08 -> +2.72; 03-11 +1.97 -> +2.01; 04-30 +1.88 -> +2.30 |
The inspiring day, not counted: 05-19 +2.18 -> +2.56 (TW1, TW3), +2.81 (TW2).

## Kill lines (decision set)
| line | TW1 | TW2 | TW3 |
|---|---|---|---|
| K1 at least +1.0R above A2 | FAIL (+0.44) | FAIL (-2.81) | PASS (+1.10) |
| K2 ahead in both periods | FAIL (live -0.20) | FAIL | PASS |
| K3 improved >= worsened, no day > half the gain | FAIL (one day is the whole gain) | FAIL | FAIL (01-15 is +0.64 of +1.10) |
| K4 max DD and worst 10 not worse | PASS | PASS | PASS |
| K5 at least 10 changed days | FAIL (4) | PASS (10) | FAIL (3) |
VERDICT: TW1 and TW2 KILLED. TW3 fails K3 and K5: TOO THIN - three trades in five months. Not adopted, no paper tag. The exit stays "40 pip stop, out 12:00 London".

## My guess against what happened
"TW1 about 3R behind": +0.44R ahead. "TW2 about 4R behind": 2.81R behind. "TW3 about 1R behind, under 10 changed days": +1.10R ahead, 3 changed days.
After a month of guessing too kindly I leaned the other way and was wrong in that direction instead. The lesson is not "guess lower" or "guess higher":
I cannot guess these, and the guess line stays in the pre-registration only to keep showing me that.

## What I learned
- The give-back on 05-19 is a real thing and a rare one: a trail that waits for +80 pips touched 4 trades in 98 (01-15, 03-11, 04-30, 05-19), was better on
  all four, and adds up to about +1.5R in five months. That is what the 55 pips were worth as a rule: a third of an R a month, known from four cases.
- Make the trail a little tighter and it stops being free at once: 30 pips behind (TW2) cut my best day of the year from +4.30R to +1.41R. The fat right
  tail is where my average comes from; an exit rule that reaches into it is dangerous, and the difference between "free" and "costly" is 10 pips of setting.
  Choosing 40 over 30 after seeing this would be fitting three trades.
- So the honest verdict on the coach's question is "no evidence", not "killed dead": TW3 has no losing case yet. It has three.
- I will not paper-tag it (a tag needs a first-look number I could reach; at 4 cases in 98 trades, 20 cases is two years away). Instead ONE counts-only
  line from today: every live trade that reaches +80 pips open, with what noon paid and what an 80 / 40 trail would have paid. Look at 15 cases. No rule.
- Exit side now: 33 definitions + stop distance on all history + the wide trail. The one corner left with any life in it is too rare to test.
Counts: ideas 64, variants 179 (TW1 TW2 TW3). Adopted trading ideas: 0. On paper: UN3, PH2, MB1. Counts-only lines: night-against, 10-day trend, +80 pip trades.
