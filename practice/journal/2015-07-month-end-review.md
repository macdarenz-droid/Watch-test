# JULY 2015 - month review, funded account (one page). Written Fri 2015-07-31 22:00 London after the month's last close (coach 07-31).
Figures from sim/trades.csv, `python bt/daily_numbers.py 567.04 25256.94`, the engine's A2 list, `bt/sw1_shadow.py`, `bt/gate_check.py`.

## The month in numbers
| | July | (June) |
|---|---|---|
| live trades | 5 (07-01, 02, 03 at 0.31 lots; 07-06, 07 at 0.16 lots) | 22 |
| live result | -3.28R, -$288.80 (1 win, 3 full stops) | -1.34R, -$174.53 |
| tracker balance | $24,647.79 -> $24,358.99 (-1.16% of $25,000) | |
| drawdown under the high-water ($25,256.94) | -2.41% -> -3.56% (deepest of the account; unchanged since 07-07) | -2.65% deepest |
| distance to my stop-trading line ($23,488.95) / the firm's line ($22,500) | $870.04 / $1,858.99 | |
| days flat by rule | 18 (07-08..07-31) | 0 |
| A2 on paper, those 18 days (engine) | -3.50R, 7 wins, 6 full stops | |
| A2 engine, whole month | 23 days, -6.81R, 8 wins, 9 full stops | 22 days, -1.40R |
| payouts | 3 dates (07-03, 07-17, 07-31): $0 each; totals $567.04 requested, $453.63 mine | $23.50 + $92.20 requested |
| tags | 5 live trades: 5 VALID, 0 mistakes. 18 flat days: NO LIVE TRADE - BY RULE | 22 valid |
| process mistakes | 1 (P12: walk-note window, ten days of paper notes; no result affected) | 2 |
A2 by month, engine R: Jan +14.89, Feb +4.67, Mar +12.21, Apr +4.21, May -2.03, Jun -1.40, Jul -6.81. Three losing months in a row, each worse.

## What happened, in order
- 07-03 close: the old ladder's half-size step came on. 07-06/07: two more stops at 0.16 lots. 07-07: size rule v3 written (0.16 lots flat).
- 07-07 close: A2's drawdown passed 8R, the alarm I wrote in March. From 07-08 A2 is on paper and the account is flat.
- 07-09: return-to-live rule. 07-23: its gate raised from +0.30R to +0.60R after my own test showed a no-edge rule passed +0.30R on 1 morning in 6.
- 07-20: SW1 shadow started: 3 trades, 3 stops, -3.08R; trade 4 open.

## Was sitting out right? (said without hindsight comfort)
The 18 paper days lost 3.50R, about $219 at 0.16 lots. So the alarm saved money in July. That is one month; it would have cost money
in a good month, and I would have had to sit just the same. What I can say: the rule did what it was written to do, on the day it said.

## The lines, read at month-end
- Route A: 40-day monitor -0.406R (gate +0.60R; not before 09-21; MO day 24 of 60, both of its monitors off the whole time, so MO has
  saved exactly what A2 lost on paper since 06-30: MO1 0.00R against A2 -6.30R).
- Gate re-check, as promised on 07-24 (new seed 731, pool now 84 no-edge days): +0.60R lets a no-edge rule through on 2.0% of single
  mornings (line 5%). THE GATE STANDS.
- Worry lines W1-W6: frozen with the live count at 73 trades since 07-08; nothing new to read. W4 (drawdown) is the alarm that fired.
- Route B: 21 second setups tried, none alive. Closest: LM2 (replicated, failed two lines, dead), BX2 (dead), SW1 (shadow, 0 for 3).
- Paper tags: UN3 day 74 (16 of 30 disagree days), PH2 day 66 (45 of 60 lively mornings): gates not reached.

## July's tests (counts in STATE.md: 116 ideas, 322 variants in all; July's are listed in the week files 27-31)
Every setup and filter killed. Four findings I keep: the regime is "moves no longer hold" (MC facts); a no-edge rule could open my
return gate (RA, fixed); after a stop the move is spent (SR); my near misses are small averages with wide bars that only forward time
can settle (07-21 step back, BX2, LM2).

## July process goal: "a worked case before every pushed number or test rule, and every file write read back in the same command"
- Worked case before every test: kept on every test this month.
- Numbers corrected after a push: 2 (07-03: a unit, 12.3 half-size R written as full-size; 07-13..07-27: P12, the walk window).
- File errors found late: 0. One script stopped halfway on 07-27; the missing read-back lines showed it within the same turn.
- Verdict: the goal caught the script failure and did NOT catch P12, because P12 was a number read from a tool I had not understood.
AUGUST PROCESS GOAL: READ A TOOL'S OWN HEADER LINE (WHAT IT MEASURES, OVER WHICH WINDOW) BEFORE WRITING ANY NUMBER FROM IT, AND SEE
"script reached its end" BEFORE EVERY COMMIT. Report at the August month-end review: numbers corrected after a push; scripts that stopped halfway.

## August, stated plainly
No route is open, so August is flat by rule unless route B produces a pass, which nothing so far suggests. The work: the daily paper
call, the SW1 shadow to 20 trades, the day-20 A2 verdict on 08-04 against the existing lines, one honest test per day.
Open question to my coach, asked several times since 07-09, still unanswered: does the firm have an inactivity rule? Seven weeks flat lie ahead.
