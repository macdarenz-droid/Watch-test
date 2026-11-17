# Week 30 (Mon 2015-07-20 .. Fri 07-24), funded account. A2 ON PAPER (rule alarm 07-08; return-to-live rule 07-09). Account FLAT.
JULY GOAL: A WORKED CASE BEFORE EVERY PUSHED NUMBER OR TEST RULE, AND EVERY FILE WRITE READ BACK IN THE SAME COMMAND.
SW1 paper shadow from Mon 07-20 (journal/SW1-paper-shadow-rules.md): a count only, never an order. Next payout date Fri 07-31.

## Funded trades
| # | time (London) | side | lots | entry | stop | exit | R | $ | tag | note |
|---|---|---|---|---|---|---|---|---|---|---|
| (paper) | Mon 07-20 08:00 | sell | NO LIVE TRADE (monitor -0.260R) | paper | paper | paper clock exit | (+0.04 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 9: flat morning; SW1 shadow opened (sell 1.08414) |

## Mon 07-20
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-07-20`:
- 3-day gap -180.4 pips -> A2 side SELL. 5-day gap -324.0 -> UN3 agree. Night 00:00-07:00: 1.08204-1.08390, last 1.08291 (range 18.6, net -9.9).
- Friday's London day: 1.08279-1.09069, closed on its low 1.08279 (range 79.0).
- Monitor for today -0.260R (MO1), -0.119R (MO3) -> BOTH PAPER. Route A closed until 09-21; route B: no tested setup. NO ORDER.
- A2 paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00.
- SW1 SHADOW, first entry (tool `bt/sw1_shadow.py 2015-07-21 signal`): Fri close 1.08279 vs 07-03 close 1.11092 = -281.3 pips -> paper SELL at
  the 08:00 open, stop 120 pips above, target 240 below, else out 12:00 Mon 07-27. Rules file written before this entry.
- How I feel: two paper sells after a 280-pip fall feels late. That feeling is not in either rule.
  08:00 London (PAPER): pre-entry hour 1.08247-1.08482 = 23.5 pips (PH2 quiet: full unit on paper). A2 paper SELL near 1.08415 (engine fixes the fill), paper stop about 1.08815. SW1 shadow SELL at the same open, stop about 1.09615, target about 1.06015. No order in the account.
  10:00 London (PAPER): A2 paper sell best +20.1, worst -24.1, last -8.8. Both ways inside two hours. Before advancing to noon: the clock decides.
  12:00 London (PAPER): A2 paper sell closed by the clock about flat (walk: best +20.1, worst -24.1, last +2.1).
  -> Mon result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.260R -> paper). Checked: call and shadow rules committed before the bell; no order;
     trade list still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 9 (engine, `python bt/coin_control.py 2015-07-21 --check 2015-07-20`): sell, clock exit, +0.04R; the other side -0.10R.
     A2 paper running from 07-08: 9 days, -1.94R.
     SW1 SHADOW (tool `bt/sw1_shadow.py 2015-07-21`): OPEN, sell 1.08414, stop 1.09614, target 1.06014, clock exit 12:00 Mon 07-27. Day's last price 1.08250. Not managed.
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: quiet. Two flat paper mornings in a row.
     Paper lines: UN3 agreed, +0.04R (agree days -9.87R in 51; disagree +2.88R in 14; day 65). PH2 (day 57): quiet (23.5) -> full = +0.04R;
     40 lively days -6.23R, 19 full-stop mornings; 17 quiet -2.30R; PH2 about -5.40R against A2's -8.55R.
     MO PAPER RULE (day 15 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +0.04R (running -4.74R).
     For Tuesday (tool): MO1 -0.299R -> paper; MO3 -0.112R -> paper.

## Tue 07-21
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-07-21`:
- 3-day gap -123.5 pips -> A2 side SELL. 5-day gap -175.6 -> UN3 agree. Night 00:00-07:00: 1.08116-1.08347, last 1.08224 (range 23.1, net -6.8).
- Monday's London day: 1.08086-1.08702, close 1.08250 (range 61.6, the smallest in weeks).
- Monitor for today -0.299R (MO1), -0.112R (MO3) -> BOTH PAPER. Route A closed until 09-21; route B: no tested setup. NO ORDER.
- A2 paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00.
- SW1 shadow: open from Mon (sell 1.08414, stop 1.09614, target 1.06014, clock 12:00 Mon 07-27). Nothing to do.
- How I feel: calm. Mistake to avoid: watching the shadow as if it were a position.

## Forward tally

## 07-20 test: idea WO, the weekly open (journal/2015-idea-WO-weekly-open.md)
WO1 (Tue-Fri 08:00 away from the weekly open, stop 40, out 20:00): 94 trades +0.205R, but +24.18R before 04-07 and -4.91R after; DD 16.72R;
78% on A2's side. KILLED (K2, K4, K6). Idea 108, variants 303.
