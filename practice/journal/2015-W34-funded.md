# Week 34 (Mon 2015-08-17 .. Fri 08-21), funded account. A2 ON PAPER (alarm 07-08; return rule 07-09, gate +0.60R). Account FLAT.
AUGUST GOAL: READ A TOOL'S OWN HEADER LINE BEFORE WRITING ANY NUMBER FROM IT, AND SEE "script reached its end" BEFORE EVERY COMMIT.
Routes B and C empty. SW1 shadow 6 of 20 (-5.36R), trade 7 open. EN2 forward count waiting. Next payout date Fri 08-28.
Pending this week: MPG's outcome run (pre-registered and counted 08-17 before the call; run after Monday is journaled).

## Funded trades
| # | time (London) | side | lots | entry | stop | exit | R | $ | tag | note |
|---|---|---|---|---|---|---|---|---|---|---|
| (paper) | Mon 08-17 08:00 | buy | NO LIVE TRADE (monitor -0.342R) | paper | paper | paper clock exit | (-0.32 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 29 |

## Mon 08-17
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-17`:
- 3-day gap +66.3 pips -> A2 side BUY. 5-day gap +143.2 -> UN3 agree. Night 00:00-07:00: 1.10821-1.11051, last 1.10962 (range 23.0, net -8.8).
- Friday's London day: 1.10978-1.11887, close 1.11079 (range 90.9; closed near its low).
- Monitor for today -0.342R (MO1), -0.147R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); routes B and C empty. NO ORDER.
- A2 paper plan: buy at the 08:00 open, stop 40 pips below, out 12:00.
- SW1 shadow trade 7: open (buy 1.11272, stop 1.10072, target 1.13672, clock 12:00 Thu 08-20). Nothing to do.
- How I feel: fine. Mistake to avoid: running MPG's outcomes before this day is booked.
  08:00 London (PAPER): pre-entry hour 1.10931-1.11122 = 19.1 pips (PH2 quiet: full unit on paper). A2 paper BUY near 1.10973 (engine fixes the fill), paper stop about 1.10573. SW1 shadow untouched. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper buy best +11.6, worst -34.9 (5 pips from the paper stop), last +6.8. Before advancing to noon: clock only.
  12:00 London (PAPER; 16 candles, 08:00-12:00): A2 paper buy closed by the clock about 11 pips against (best +21.2, worst -34.9, last -10.9).
  -> Mon result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.342R -> paper). VALID: no order placed. Checked: call committed before the bell;
     trade list still ends with #230 of 07-07; sim balance $24,926.03 unchanged. Trade mistakes 0; process mistakes 0.
     PAPER A2, day 29 (engine, `python bt/coin_control.py 2015-08-18 --check 2015-08-17`): buy, clock exit, -0.32R; the other side +0.26R.
     A2 paper running from 07-08: 29 days, -1.33R.
     SW1 SHADOW trade 7: still OPEN (buy 1.11272, stop 1.10072, target 1.13672, clock 12:00 Thu 08-20); last price 1.10777. Running -5.36R (6 of 20 done).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: a small paper loss. MPG's outcomes can run now that this is written.
     Paper lines: UN3 agreed, -0.32R (agree days -9.81R in 67; disagree +3.43R in 18; day 85). PH2 (day 77): quiet (19.1) -> full = -0.32R;
     47 lively days -8.43R, 21 full-stop mornings; 30 quiet +0.51R; PH2 about -3.70R against A2's -7.94R.
     MO PAPER RULE (day 35 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -0.32R (running -4.13R).
     For Tuesday (tool): MO1 -0.300R -> paper; MO3 -0.186R -> paper.

## Forward tally

## 08-17 test: idea MPG, the moving-average pullback with a count grid (journal/2015-idea-MPG-moving-average-pullback-counted.md)
Pre-registered and counted before the call; outcome run after the day was journaled. MPG1 145 trades +0.011R, stressed -0.092R: killed.
Dose line (steep trends, 41 trades) +0.399R: a hint, not promoted. Ideas 137, variants 367.

## 08-17 evening: replay of week 17 + idea NC (journal/2015-08-17-replay-week-17-and-idea-NC.md)
Worst week: 5 valid trades, -3.07R; the full stops followed a pre-bell hour that had already run A2's way. NC1 (skip those days, X 15) PASSES
all four lines (gap +0.306R, p 0.068) - provisional and fragile: without the inspiring week gap +0.259R, p 0.11; dose the wrong way.
Forward count only with the coach's word. Ideas 138, variants 370.
