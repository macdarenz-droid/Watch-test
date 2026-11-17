# SW1 PAPER SHADOW: rules written Mon 2015-07-20 07:00 London, before its first entry (coach 07-20: allowed as a shadow, rules first)

WHAT IT IS: a count, on paper, of SW1 exactly as tested and killed on 07-17 (journal/2015-idea-SW-slow-A2.md). SW1 FAILED its test (K4).
THIS SHADOW IS NOT A PASS, CANNOT BECOME ONE, AND DOES NOT TOUCH THE RETURN-TO-LIVE RULE. Route B step B1 needs a passed pre-registered
test; a shadow is not that. No order is ever placed for it. It never changes a live or paper A2 decision.

RULE (unchanged, London time): at the 22:00 close, direction = that close against the close 10 trading days earlier. If flat: paper market
order at 08:00 the next trading day, stop 120 pips, target 240 pips, both fixed; else out at 12:00 on the 5th trading day after the entry
day. One position at a time. Starts FLAT on Mon 07-20. Costs: 1.0 pip spread + 0.1 slippage (engine). 1R = a 120-pip stop.

OVERNIGHT FINANCING, INCLUDED AS AN ASSUMPTION: I do not know the firm's swap figures and I may not look anything up. I charge 1.0 pip
(= 0.0083R) for every calendar night held past 22:00 London (Friday to Monday = 3 nights), whatever the side. I believe that is on the
unkind side for both directions, but it is MY ASSUMPTION, not a fact. Coach: if you know the firm's real figures, I will use them instead
from the next trade on (never backwards).

FIXED SAMPLE: 20 finished trades. No look for a verdict before 20, no extension after 20.
KILL LINES (written now):
 E1 early close: running drawdown above 6R at any time -> closed, dead.
 At 20 trades: J1 average after costs and financing >= +0.10R; J2 net above zero without its best two trades; J3 max drawdown <= 6R.
 Any fail -> closed, dead, never reopened. All pass -> the only thing it earns is the right to write a NEW pre-registered test on data
 neither the 07-17 test nor this shadow has used. Nothing else.
BOOKKEEPING: tool `python bt/sw1_shadow.py END` (and `... signal` before an entry). One row per finished trade below, appended with read-back.
I note the entry in the week file before the 08:00 bar, and do not manage the position: stop, target and clock only.

| # | entry day | side | entry | exit (why, when) | R | nights | financing | net R | running | max DD so far |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Mon 2015-07-20 | sell | 1.08414 | 1.09615 (stop, Tue 07-21 17:55) | -1.00 | 1 | -0.008 | -1.01 | -1.01 | 1.01R |
| 2 | Wed 2015-07-22 | sell | 1.09560 | 1.10761 (stop, Mon 07-27 08:20) | -1.00 | 5 | -0.042 | -1.04 | -2.05 | 2.05R |
| 3 | Tue 2015-07-28 | buy | 1.10562 | 1.09361 (stop, Thu 07-30 13:30) | -1.01 | 2 | -0.017 | -1.03 | -3.08 | 3.08R |
| 4 | Fri 2015-07-31 | buy | 1.09535 | 1.09280 (clock, Fri 08-07 12:00) | -0.22 | 7 | -0.058 | -0.28 | -3.35 | 3.35R |
| 5 | Mon 2015-08-10 | sell | 1.09629 | 1.10830 (stop, Tue 08-11 14:20) | -1.00 | 1 | -0.008 | -1.01 | -4.36 | 4.36R |
| 6 | Wed 2015-08-12 | sell | 1.10745 | 1.11946 (stop, Wed 08-12 15:45) | -1.00 | 0 | 0.000 | -1.00 | -5.36 | 5.36R |
| 7 | Thu 2015-08-13 | buy | 1.11272 | 1.11765 (clock, Thu 08-20 12:00) | +0.40 | 7 | -0.058 | +0.34 | -5.02 | 5.36R |
| 8 | Fri 2015-08-21 | buy | 1.12814 | 1.15214 (target, Mon 08-24 12:40) | +1.99 | 3 | -0.025 | +1.96 | -3.06 | 5.36R |
| 9 | Tue 2015-08-25 | buy | 1.15680 | 1.14479 (stop, Tue 08-25 15:15) | -1.01 | 0 | 0.000 | -1.01 | -4.07 | 5.36R |
| 10 | Wed 2015-08-26 | buy | 1.14968 | 1.13767 (stop, Wed 08-26 13:30) | -1.01 | 0 | 0.000 | -1.01 | -5.07 | 5.36R |
| 11 | Thu 2015-08-27 | buy | 1.13297 | 1.12096 (stop, Thu 08-27 15:55) | -1.01 | 0 | 0.000 | -1.01 | -6.08 | 6.08R |
CLOSED FOR GOOD Thu 2015-08-27 by E1 (running drawdown 6.08R, line 6R) after 11 of 20 trades: 2 winners, 9 losers, -6.08R incl. -0.22R assumed financing (rows sum to -0.216R; first written as -0.18R, corrected the same evening). Never reopened.
