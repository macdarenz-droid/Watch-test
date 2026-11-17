# Week 30 (Mon 2015-07-20 .. Fri 07-24), funded account. A2 ON PAPER (rule alarm 07-08; return-to-live rule 07-09). Account FLAT.
JULY GOAL: A WORKED CASE BEFORE EVERY PUSHED NUMBER OR TEST RULE, AND EVERY FILE WRITE READ BACK IN THE SAME COMMAND.
SW1 paper shadow from Mon 07-20 (journal/SW1-paper-shadow-rules.md): a count only, never an order. Next payout date Fri 07-31.

## Funded trades
| # | time (London) | side | lots | entry | stop | exit | R | $ | tag | note |
|---|---|---|---|---|---|---|---|---|---|---|
| (paper) | Mon 07-20 08:00 | sell | NO LIVE TRADE (monitor -0.260R) | paper | paper | paper clock exit | (+0.04 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 9: flat morning; SW1 shadow opened (sell 1.08414) |
| (paper) | Tue 07-21 08:00 | sell | NO LIVE TRADE (monitor -0.299R) | paper | paper | paper clock exit | (-0.74 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 10; SW1 shadow trade 1 stopped -1.01R net |
| (paper) | Wed 07-22 08:00 | buy | NO LIVE TRADE (monitor -0.313R) | paper | paper | paper stop | (-1.03 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 11: stopped; SW1 shadow trade 2 opened (sell 1.09560) |

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
  08:00 London (PAPER): pre-entry hour 1.08182-1.08318 = 13.6 pips (PH2 quiet: full unit on paper). A2 paper SELL near 1.08297 (engine fixes the fill), paper stop about 1.08697. SW1 shadow untouched. No order.
  10:00 London (PAPER): A2 paper sell best +17.1, worst -34.3 (5.7 pips from the paper stop), last -26.3. Before advancing to noon: nothing to manage.
  12:00 London (PAPER): A2 paper sell closed by the clock about 30 pips against, 1 pip from the stop at its worst (walk: best +17.1, worst -39.0, last -29.5).
  -> Tue result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.299R -> paper). Checked: call committed before the bell; no order; trade list
     still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 10 (engine, `python bt/coin_control.py 2015-07-22 --check 2015-07-21`): sell, clock exit, -0.74R; the other side +0.68R.
     A2 paper running from 07-08: 10 days, -2.68R.
     SW1 SHADOW trade 1 (tool `bt/sw1_shadow.py 2015-07-22`): sell 1.08414 (Mon) -> STOPPED 1.09615 at 17:55 Tue, -1.00R, 1 night, financing -0.008R,
     net -1.01R. Running -1.01R after 1 of 20. The afternoon rose about 110 pips to 1.09342. Next shadow entry: Wed 08:00 from Tuesday's close.
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: both paper lines lost on a day I had no money in. Glad of that, and wary of being glad: the shadow's first trade is one trade.
     Paper lines: UN3 agreed, -0.74R (agree days -10.61R in 52; disagree +2.88R in 14; day 66). PH2 (day 58): quiet (13.6) -> full = -0.74R;
     40 lively days -6.23R, 19 full-stop mornings; 18 quiet -3.04R; PH2 about -6.14R against A2's -9.29R.
     MO PAPER RULE (day 16 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -0.74R (running -5.48R).
     For Wednesday (tool): MO1 -0.313R -> paper; MO3 -0.180R -> paper.

## Wed 07-22
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-07-22`:
- 3-day gap +61.1 pips -> A2 side BUY. 5-day gap -74.1 -> UN3 DISAGREE (disagree day 15 of 30). Night 00:00-07:00: 1.09241-1.09604, last 1.09344 (range 36.3, net -1.7).
- Tuesday's London day: 1.08116-1.09685, close 1.09342 (range 156.9); it made the 3-day high.
- Monitor for today -0.313R (MO1), -0.180R (MO3) -> BOTH PAPER. Route A closed until 09-21; route B: no tested setup. NO ORDER.
- A2 paper plan: buy at the 08:00 open, stop 40 pips below, out 12:00.
- SW1 SHADOW trade 2 (tool `bt/sw1_shadow.py 2015-07-23 signal`): Tue close 1.09342 vs 07-07 close 1.10107 = -76.5 pips -> paper SELL at the 08:00
  open, stop 120 above, target 240 below, else out 12:00 Wed 07-29. The shadow sells while A2 buys: two rules, two clocks; neither is mine to prefer.
- How I feel: fine. Mistake to avoid: picking a favourite between the two paper lines.
  08:00 London (PAPER): pre-entry hour 1.09326-1.09666 = 34.0 pips (PH2 lively: half on paper). A2 paper BUY near 1.09561 (engine fixes the fill), paper stop about 1.09161. SW1 shadow SELL at the same open, stop about 1.10761, target about 1.07161. No order.
  10:00 London (PAPER): A2 paper buy best +10.5, worst -32.0 (8 pips from the paper stop), last -18.2. Before advancing to noon: nothing to manage.
  12:00 London (PAPER): the A2 paper buy was stopped just before noon (walk: best +10.5, worst -40.3).
  -> Wed result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.313R -> paper). Checked: call committed before the bell; no order; trade list
     still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 11 (engine, `python bt/coin_control.py 2015-07-23 --check 2015-07-22`): buy, stopped, -1.03R; the other side +0.76R.
     A2 paper running from 07-08: 11 days, -3.71R.
     SW1 SHADOW trade 2 (tool `bt/sw1_shadow.py 2015-07-23`): OPEN, sell 1.09560, stop 1.10760, target 1.07160, clock 12:00 Wed 07-29. Last price 1.09286. Running -1.01R (1 of 20 done).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: the paper record is ugly (-3.71R in 11 days) and it is exactly what the alarm was for.
     Paper lines: UN3 DISAGREED (day 67): disagree days +1.85R in 15; agree days -10.61R in 52. PH2 (day 59): lively (34.0) -> half = -0.52R;
     41 lively days -7.26R, 20 full-stop mornings; 18 quiet -3.04R; PH2 about -6.66R against A2's -10.32R.
     MO PAPER RULE (day 17 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -1.03R (running -6.51R).
     For Thursday (tool): MO1 -0.406R -> paper; MO3 -0.222R -> paper.

## Forward tally

## 07-20 test: idea WO, the weekly open (journal/2015-idea-WO-weekly-open.md)
WO1 (Tue-Fri 08:00 away from the weekly open, stop 40, out 20:00): 94 trades +0.205R, but +24.18R before 04-07 and -4.91R after; DD 16.72R;
78% on A2's side. KILLED (K2, K4, K6). Idea 108, variants 303.

## 07-21 step back: 5 closest misses + BX2 out of sample (journal/2015-07-21-closest-misses-and-BX-out-of-sample.md)
BX2, frozen since May, on unseen days 05-12..07-21: 43 trades +0.176R, both halves positive, independent of A2; but stressed +0.019R,
-3.24R without its best 3, DD 5.32R. Fails O2 O3 O4: dead for good. Idea 109, variant 304.

## 07-22: plan rewritten on one page + idea RA, route A's gate (journal/2015-idea-RA-is-route-A-gate-strong-enough.md)
Weakest assumption: +0.30R on the 40-day monitor means the edge is back. Test: a no-edge A2 reads that on 15.8% of mornings, 59.9% of
60-morning runs. Gate too weak. Proposal to the coach: +0.60R (2.2% / 16.0%; healthy A2 passes 92%). Rule not edited. Idea 110, variants 306.
