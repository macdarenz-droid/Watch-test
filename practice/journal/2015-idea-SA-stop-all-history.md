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
