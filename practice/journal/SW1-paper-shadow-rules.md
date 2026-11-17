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
