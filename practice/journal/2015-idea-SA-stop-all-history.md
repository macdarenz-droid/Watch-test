# Idea SA (idea 63): the 40 pip stop, re-tested on ALL history - looked first, then PRE-REGISTRATION (pushed before any run)
Sim clock Thu 2015-05-21 01:00 London. END 2015-05-21. Coach 05-20: "for the next one, look at the exit side of A2 rather than the entry."
## Why this corner of the exit side
- 33 exit and management definitions are closed. But the stop DISTANCE itself (idea S: 50 / 60 / 80 pips at the same $ risk) was judged on the January
  build only: 19 trades, 3 stops. Since then full stops went from 8% of trades to 28% of live trades, and the daily range from about 100 to about 157 pips.
  The test that set my stop never saw the market I am stopped in.
## Looked first: my own stop-day notes (the trade tables of the funded journals, written on the day; no new count)
12 funded full stops since 04-07. By the note of each day:
- REAL (price far beyond the stop at noon, or never came back): 04-07, 04-20, 04-23, 04-24, 05-04, 05-11, 05-12, 05-15 = 8.
- POKES (stop passed by a few pips, price back inside by noon): 04-08 (passed by 2.3 pips at the morning high, then the price fell 110 pips my way),
  04-16 (passed by 1.4 pips at the low of the day, then +105 pips by noon), 05-18 (10.3 pips, back at entry by noon), 05-20 (4.8 pips, inside by noon) = 4.
- So a third of my live stops were pokes of 10 pips or less, and two of the four became the day's big move in my direction after throwing me out.
- Beside it, the other side (my method rule): the same stop saved 0.76R and 0.39R on 05-12 and 05-15 against the noon price, and a wider stop at the same
  $ risk makes every winner smaller in R (50 pips: all wins x 0.8). January said that price is too high: 77% / 62% / 47% of A2's net.
## Hypothesis
With the wider ranges since March, a 50 or 60 pip stop at the same $ risk earns at least as much as 40 pips, because it survives the pokes.
## Variants (3: the January definitions, unchanged, in bt/ideas.py: S50, S60, S80 = stop 50 / 60 / 80 pips, size cut so the risk stays $125, everything else A2)
## Data and contamination
All A2 days before 2015-05-21. The four poke days (04-08, 04-16, 05-18, 05-20) are the inspiring days and are DROPPED for the decision, as my rule says.
That takes out the very days the idea is built on: if wider stops only help on the four days I already looked at, that is a story about four days.
The numbers with all days in are reported beside and decide nothing. Known: the January result above.
## Kill lines (the same-trade exit lines of LK and TD, printed by bt/ab_lock.py S50,S60,S80 END DROP; one failure kills)
- K1: at least +1.0R above A2.
- K2: ahead of A2 in both periods (before 03-02; from 03-02).
- K3: improved days >= worsened days, and no single day more than half the gain.
- K4: max drawdown and worst 10 in a row not worse than A2's.
- K5: the average losing day at least 0.05R smaller than A2's.
Hand-check before totals: the script is the one used for LK and TD (its A2 line must show the engine's A2); one changed day read against my journal.
A survivor gets a forward paper tag only; the live stop stays 40 pips whatever comes out.
My guess, written now (and I have underestimated every tail this month): on the decision set S50 about 3R behind A2, S60 about 6R, S80 about 10R; with all
days in S50 about level with A2. Killed on K1 and K2.

## Mechanics hand-check
The script's A2 line with all days: 97 days, net +35.71R, backtest +19.56R, live +16.15R - the engine figures of my live-vs-backtest table. One changed day
against my journal: 05-18 at 50 pips is still stopped (-1.03R -> -1.02R); my walk print that morning showed a worst of -51.2 pips from the fill. 05-20 at 50
pips: -0.22R (my noon note: about -0.23R without a stop). The engine and my notes agree.

## Results (run once per set; `python bt/ab_lock.py S50,S60,S80 2015-05-21 2015-04-08,2015-04-16,2015-05-18,2015-05-20` and the same with `none`; figures from the prints)
DECISION SET (93 days, the four poke days dropped): A2 +39.77R (backtest +19.56R, live +20.22R), max DD 3.28R, worst 10 in a row -0.87R.
| variant | net R (vs A2) | backtest (vs A2) | live (vs A2) | days better / worse | max DD | worst 10 | average losing day (A2 -0.662R) | stop exits (A2 19 on all days) |
|---|---|---|---|---|---|---|---|---|
| S50 | +30.18 (-9.60) | +15.07 (-4.49) | +15.10 (-5.11) | 17 (+2.32R) / 53 (-11.89R) | 3.23R | -1.24 | -0.569R | 14 |
| S60 | +23.78 (-15.99) | +12.47 (-7.09) | +11.32 (-8.90) | 20 (+3.99R) / 56 (-20.03R) | 3.19R | -1.53 | -0.487R | 10 |
| S80 | +18.25 (-21.52) | +9.47 (-10.09) | +8.78 (-11.43) | 27 (+8.52R) / 58 (-30.09R) | 2.39R | -1.22 | -0.354R | 3 |
Reported only, ALL 97 days (the four poke days back in): A2 +35.71R; S50 +29.28R (-6.43), live half -1.95R; S60 +23.88R (-11.83); S80 +18.32R (-17.39).
The four poke days themselves: 04-08 -1.00 -> -0.57 / -0.47 / -0.35R; 04-16 -1.03 -> +0.91 / +0.76 / +0.57R; 05-18 -1.03 -> -1.02 / -0.01 / -0.01R;
05-20 -1.00 -> -0.22 / -0.18 / -0.14R (S50 / S60 / S80). Together they give S50 back 3.17R - and it is still 6.43R behind.

## Kill lines (decision set)
| line | S50 | S60 | S80 |
|---|---|---|---|
| K1 at least +1.0R above A2 | FAIL (-9.60) | FAIL (-15.99) | FAIL (-21.52) |
| K2 ahead in both periods | FAIL (behind in both) | FAIL | FAIL |
| K3 improved >= worsened | FAIL (17 / 53) | FAIL (20 / 56) | FAIL (27 / 58) |
| K4 max DD and worst 10 not worse | FAIL (worst 10 -1.24 vs -0.87) | FAIL | FAIL |
| K5 average losing day 0.05R smaller | PASS (-0.569R) | PASS (-0.487R) | PASS (-0.354R) |
VERDICT: all three KILLED. The stop stays 40 pips.

## My guess against what happened
"S50 about 3R behind on the decision set, about level with all days in": 9.60R and 6.43R behind. "S60 about 6R, S80 about 10R": 16R and 21.5R.
Wrong by a factor of two to three, again on the side of hope.

## What I learned
- K5 passes and everything else fails: a wider stop DOES make the losing day smaller (-0.66R -> -0.57R -> -0.49R -> -0.35R) and DOES remove pokes (19 stop
  exits -> 14 -> 10 -> 3). And it loses a quarter to a half of the profit, in both periods, because at the same $ risk every winner is cut by a fifth, a
  third or a half. 53 to 58 days get worse so that 17 to 27 get better.
- What a poke costs is visible and hurts (two this week); what the wider stop costs is spread thinly over every winning morning and I never see it.
  That is exactly the kind of trade-off my eye judges wrongly - and the reason this had to be run on all history instead of believed from four days.
- With all days in, the live half is only 1.95R behind at 50 pips: the pokes are real, about 3.2R of them. They are simply smaller than the price.
- January's answer (77% / 62% / 47% of A2's net) holds on all history: 82% / 67% / 51% with all days in. The market got wider; the answer did not move.
- Exit and management side: 33 definitions + the stop distance now on all history. Closed. The only way to keep a wider stop without paying for it would
  be to risk more dollars, and that is a risk-plan question I am not opening.
Counts: ideas 63, variants 176 (S50 S60 S80 re-run on all history, counted again). Adopted trading ideas: 0. On paper: UN3, PH2, MB1. Process mistakes: 8.
