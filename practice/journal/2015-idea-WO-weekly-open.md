# Idea WO: the weekly open as the week's dividing line (idea 108; coach 07-20: something not studied yet; route B hunt)
Written Mon 2015-07-20 22:00 London, before any code. Not studied before: I tested the weekend GAP (WG), never the weekly open as a level.

## Hypothesis
The first price of the week is a line the week takes a side on. Once the price is clearly on one side of it, Tuesday-Friday days tend to
go further that way.

## Rule (London time; Tue-Fri only, one trade a day)
Weekly open = the open of the week's first M5 candle (Sunday evening).
- WO1 (judged): at 08:00, if the 08:00 open is 30+ pips from the weekly open -> market order away from it (above -> buy, below -> sell),
  stop 40 pips, out 20:00.
- WO2: the same, out 12:00.
- WO3: side fixed for the week by Monday's 22:00 close against the weekly open (30+ pips), traded Tue-Fri at 08:00, stop 40, out 20:00.
Three variants, no more. Costs on (1.0 + 0.1); stressed 2.0 + 0.5. $125 = 1R.

## Cases before outcomes
Count trades per variant, before and from 04-07, and on how many of them the side equals A2's side. Under 60 trades in all or under
25 from 04-07 -> not judgeable, killed for sample.
Power check written BEFORE the run (lesson of SW): with about 100 trades and results spread about 1.1R, "my side minus the opposite side"
has an error of about 0.2R, so K4 can only pass if the true edge is around +0.2R a trade or more. I accept that: a smaller edge is not
worth a funded account's risk anyway.

## Kill lines for WO1 (all must pass)
K1 average >= +0.10R after costs. K2 net above zero before 04-07 AND from 04-07. K3 net above zero without its best two trades.
K4 same days, opposite side, same stop and exit: mean difference above zero, sign-flip p < 0.05 (stand-alone trades, as written).
K5 stressed average above zero. K6 max drawdown <= 6R.
K7 not A2 in disguise: reported, and if 80%+ of trades are on A2's side, a pass would only be a pass of A2's old edge -> treated as a fail.
Pass = route B step B1 candidate, then 40 forward paper trades. Fail = killed. My guess: positive before 04-07, negative after (K2 fails),
like every follow rule on the morning scale.

## Counts and worked case (tool, before outcomes)
Tool: `python bt/weekly_open.py 2015-07-21 count` / `check 2015-07-14` (no outcomes).
- 112 Tue-Fri days with a weekly open (01-06..07-17). WO1 and WO2: 94 trades (39 before 04-07, 55 from). WO3: 80 (32 / 48). Judgeable.
- Same side as A2: WO1 73 of 94 = 78% (just under my 80% line: it is mostly A2's direction; written before the outcomes). WO3 47 of 80 = 59%.
- Worked case Tue 07-14: weekly open 1.10922 (Sunday evening, after a gap down from Friday's 1.11519), 08:00 open 1.09786 -> 113.6 pips
  below -> WO1 SELL at 08:00, stop 40, out 20:00. Monday's close was 91.6 pips below -> WO3 SELL too.

## Result (one run)
Tool: `python bt/weekly_open.py 2015-07-21 test`. Mechanics check (`hand 2015-07-14`): my sell 08:00-12:00 = the engine's A2 trade, -1.0034R both.
| variant | trades | avg R | net | wins | before 04-07 | from 04-07 | without best 2 | vs opposite side (p) | stressed avg | max DD | on A2's side |
|---|---|---|---|---|---|---|---|---|---|---|---|
| WO1 away from the weekly open, out 20:00 | 94 | +0.205 | +19.28 | 39% | 39: +24.18 | 55: -4.91 | +9.50 | +0.429 (0.098) | +0.156 | 16.72R | 78% |
| WO2 the same, out 12:00 | 94 | +0.135 | +12.67 | 47% | 39: +17.42 | 55: -4.75 | +5.42 | +0.245 (0.20) | +0.092 | 9.28R | 78% |
| WO3 Monday's side, out 20:00 | 80 | +0.112 | +8.98 | 40% | 32: +11.95 | 48: -2.98 | -0.50 | +0.247 (0.38) | +0.063 | 12.33R | 59% |
WO1: K1 PASS | **K2 FAIL** (-4.91R from 04-07) | K3 PASS | **K4 FAIL** (p 0.098) | K5 PASS | **K6 FAIL** (16.72R) | K7 PASS (78%, just).
**WO IS KILLED.** My guess was right: all of it is before 04-07.
What I learned: 1. The weekly open is not a level with its own information: "which side of the weekly open" is 78% the same thing as
A2's 3-day direction, and it died on the same date. 2. Sixth follow rule with the same shape (profit before 04-07, loss after):
RG, WM, DF, DH, BK, WO. Only the slow SW1 did not show the break, and it could not be told from a coin. 3. The power check written
first was honest: +0.43R against the opposite side still gave p 0.098 on 94 trades, because one side's -1R is often the other's +2R.
Counts: idea 108; variants 301-303; second setups tried 18, none alive.
