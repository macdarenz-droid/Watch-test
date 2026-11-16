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
