# Week 32 (Mon 2015-08-03 .. Fri 08-07), funded account. A2 ON PAPER (alarm 07-08; return rule 07-09, gate +0.60R). Account FLAT.
AUGUST GOAL: READ A TOOL'S OWN HEADER LINE BEFORE WRITING ANY NUMBER FROM IT, AND SEE "script reached its end" BEFORE EVERY COMMIT.
SW1 paper shadow: 3 of 20 done (-3.08R), trade 4 open. Day-20 A2 verdict due Tue 08-04. Next payout date Fri 08-14.

## Funded trades
| # | time (London) | side | lots | entry | stop | exit | R | $ | tag | note |
|---|---|---|---|---|---|---|---|---|---|---|
| (paper) | Mon 08-03 08:00 | sell | NO LIVE TRADE (monitor -0.406R) | paper | paper | paper clock exit | (+0.73 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 19; SW1 shadow trade 4 open |
| (paper) | Tue 08-04 08:00 | sell | NO LIVE TRADE (monitor -0.338R) | paper | paper | paper clock exit | (-0.53 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 20: verdict written, A2 stays on paper; route C proposed |
| (paper) | Wed 08-05 08:00 | sell | NO LIVE TRADE (monitor -0.319R) | paper | paper | paper clock exit | (+0.11 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 21; LM2 closed for good (coach) |
| (paper) | Thu 08-06 08:00 | sell | NO LIVE TRADE (monitor -0.333R) | paper | paper | paper clock exit | (+0.07 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 22 |

## Mon 08-03
Coach 08-03, straight talk: "careful is good, frozen isn't." At the day-20 verdict (tomorrow) I also write what it would take to get
back to live trading safely: rule, sizing, the evidence I need. Today's test is aimed at the sizing part of that.
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-03`:
- 3-day gap -76.6 pips -> A2 side SELL. 5-day gap +1.8 -> UN3 DISAGREE (disagree day 17 of 30). Night 00:00-07:00: 1.09652-1.09886, last 1.09815 (range 23.4, net +6.2).
- Friday's London day: 1.09211-1.11140, close 1.09830 (range 192.9); it made the 3-day high and gave most of it back.
- Monitor for today -0.406R (MO1), -0.347R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); route B: no tested setup. NO ORDER.
- A2 paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00.
- SW1 shadow trade 4: open (buy 1.09535, stop 1.08335, target 1.11935, clock 12:00 Fri 08-07). Nothing to do.
- How I feel: the coach's "frozen" stung, and it is fair to ask. My answer has to be a written path, not an order placed to feel busy.
  08:00 London (PAPER): pre-entry hour 1.09663-1.09957 = 29.4 pips (PH2 quiet by 0.6 pips: full unit on paper), upward. A2 paper SELL near 1.09937 (engine fixes the fill), paper stop about 1.10337. SW1 shadow untouched. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper sell best +35.5, worst -2.9, last +22.2. Before advancing to noon: clock only.
  12:00 London (PAPER; 16 candles, 08:00-12:00): A2 paper sell closed by the clock about 29 pips ahead (best +40.1, worst -2.9, last +29.2).
  -> Mon result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.406R -> paper). Checked: call committed before the bell; no order; trade list
     still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 19 (engine, `python bt/coin_control.py 2015-08-04 --check 2015-08-03`): sell, clock exit, +0.73R; the other side -1.03R (stopped).
     A2 paper running from 07-08: 19 days, -2.77R.
     SW1 SHADOW trade 4: still OPEN (buy 1.09535, stop 1.08335, target 1.11935, clock 12:00 Fri 08-07); last price 1.09491. Running -3.08R (3 of 20 done).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: a paper winner on the day I was told I look frozen. It does not change tomorrow's verdict by itself, and I will not let it.
     Paper lines: UN3 DISAGREED (day 75): disagree days +4.23R in 17; agree days -12.05R in 58. PH2 (day 67): quiet (29.4) -> full = +0.73R;
     45 lively days -8.13R, 21 full-stop mornings; 22 quiet -1.23R; PH2 about -5.29R against A2's -9.38R.
     MO PAPER RULE (day 25 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +0.73R (running -5.57R).
     For Tuesday (tool): MO1 -0.338R -> paper; MO3 -0.285R -> paper.

## Tue 08-04 (A2 paper day 20)
BEFORE THE BELL: the yardstick for tonight's day-20 verdict is written and committed (journal/2015-08-04-A2-day-20-verdict-and-route-back.md, Part 0).
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-04`:
- 3-day gap -32.7 pips -> A2 side SELL. 5-day gap -138.0 -> UN3 agree. Night 00:00-07:00: 1.09324-1.09632, last 1.09576 (range 30.8, net +4.6).
- Monday's London day: 1.09413-1.09957, close 1.09491 (range 54.4, the smallest since January by my eye; not checked, not used).
- Monitor for today -0.338R (MO1), -0.285R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); route B: no tested setup. NO ORDER.
- A2 paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00.
- SW1 shadow trade 4: open (buy 1.09535, stop 1.08335, target 1.11935, clock 12:00 Fri 08-07). Nothing to do.
- How I feel: clear. The verdict is decided by arithmetic before the day; the day is still walked properly.
  08:00 London (PAPER): pre-entry hour 1.09532-1.09663 = 13.1 pips (PH2 quiet: full unit on paper). A2 paper SELL near 1.09564 (engine fixes the fill), paper stop about 1.09964. SW1 shadow untouched. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper sell best +4.2, worst -23.2, last -15.2. Before advancing to noon: clock only.
  12:00 London (PAPER; 16 candles, 08:00-12:00): A2 paper sell closed by the clock about 21 pips against (best +4.2, worst -26.2, last -21.2). The afternoon then fell about 75 pips: after the exit.
  -> Tue result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.338R -> paper). Checked: yardstick and call committed before the bell; no order;
     trade list still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 20 (engine, `python bt/coin_control.py 2015-08-05 --check 2015-08-04`): sell, clock exit, -0.53R; the other side +0.47R.
     A2 paper from 07-08: 20 days, -3.30R, average -0.165R, 8 wins, 6 full stops, deepest drawdown 4.09R.
     DAY-20 VERDICT written (journal/2015-08-04-A2-day-20-verdict-and-route-back.md): below L1's +0.10R, monitor -0.319R against the +0.60R gate;
     A2 STAYS ON PAPER. ROUTE BACK proposed to my coach as ROUTE C (probation at $15.63 a trade, 40 trades, kill lines); nothing adopted by me.
     SW1 SHADOW trade 4: still OPEN (buy 1.09535, stop 1.08335, target 1.11935, clock 12:00 Fri 08-07); last price 1.08806, 47 pips above its stop. Running -3.08R (3 of 20 done).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: lighter for having written the route down. Wary of how much I want Q2 answered yes.
     Paper lines: UN3 agreed, -0.53R (agree days -12.58R in 59; disagree +4.23R in 17; day 76). PH2 (day 68): quiet (13.1) -> full = -0.53R;
     45 lively days -8.13R, 21 full-stop mornings; 23 quiet -1.76R; PH2 about -5.82R against A2's -9.91R.
     MO PAPER RULE (day 26 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -0.53R (running -6.10R).
     For Wednesday (tool): MO1 -0.319R -> paper; MO3 -0.257R -> paper.

## Wed 08-05
Coach 08-05: "if no forward test of 40 mornings or fewer can tell it from a coin, LM2 is closed for good, no shadow. route C stays empty
until something earns it." Recorded: LM2 CLOSED FOR GOOD. No shadow, no tally, no re-test. Next test: a fresh idea with enough trades to judge.
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-05`:
- 3-day gap -50.4 pips -> A2 side SELL. 5-day gap -179.0 -> UN3 agree. Night 00:00-07:00: 1.08482-1.08938, last 1.08723 (range 45.6, net -17.0).
- Tuesday's London day: 1.08789-1.09875, closed on its low 1.08806 (range 108.6); it made the 3-day low.
- Monitor for today -0.319R (MO1), -0.257R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); routes B and C empty. NO ORDER.
- A2 paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00.
- SW1 shadow trade 4: open (buy 1.09535, stop 1.08335); the night's low 1.08482 came within 15 pips of its stop. Nothing to do.
- How I feel: fine with the ruling. LM2 was the one I wanted; that is the reason it needed someone else's no.
  08:00 London (PAPER): pre-entry hour 1.08518-1.08771 = 25.3 pips (PH2 quiet: full unit on paper). A2 paper SELL near 1.08726 (engine fixes the fill), paper stop about 1.09126. SW1 shadow untouched. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper sell best +19.7, worst -4.4, last +13.6. Before advancing to noon: clock only.
  12:00 London (PAPER; 16 candles, 08:00-12:00): A2 paper sell closed by the clock about 4 pips ahead (best +23.5, worst -4.4, last +4.5).
  -> Wed result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.319R -> paper). Checked: call committed before the bell; no order; trade list
     still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 21 (engine, `python bt/coin_control.py 2015-08-06 --check 2015-08-05`): sell, clock exit, +0.11R; the other side -0.17R.
     A2 paper running from 07-08: 21 days, -3.19R.
     SW1 SHADOW trade 4: still OPEN (buy 1.09535, stop 1.08335, target 1.11935, clock 12:00 Fri 08-07); last price 1.09056. Running -3.08R (3 of 20 done).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: plain. A small paper winner given back to a few pips.
     Paper lines: UN3 agreed, +0.11R (agree days -12.47R in 60; disagree +4.23R in 17; day 77). PH2 (day 69): quiet (25.3) -> full = +0.11R;
     45 lively days -8.13R, 21 full-stop mornings; 24 quiet -1.65R; PH2 about -5.71R against A2's -9.80R.
     MO PAPER RULE (day 27 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +0.11R (running -5.99R).
     For Thursday (tool): MO1 -0.333R -> paper; MO3 -0.280R -> paper.

## Thu 08-06
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-06`:
- 3-day gap -77.4 pips -> A2 side SELL. 5-day gap -76.2 -> UN3 agree. Night 00:00-07:00: 1.09007-1.09338, last 1.09255 (range 33.1, net +23.4, against the sell).
- Wednesday's London day: 1.08481-1.09342, close 1.09056 (range 86.1).
- Monitor for today -0.333R (MO1), -0.280R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); routes B and C empty. NO ORDER.
- A2 paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00.
- SW1 shadow trade 4: open (buy 1.09535, stop 1.08335, target 1.11935, clock 12:00 Fri 08-07). Nothing to do.
- How I feel: steady.
  08:00 London (PAPER): pre-entry hour 1.09080-1.09439 = 35.9 pips (PH2 lively: half on paper), up then back down. A2 paper SELL near 1.09104 (engine fixes the fill), paper stop about 1.09504. SW1 shadow untouched. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper sell best +23.4, worst -7.0, last +22.7. Before advancing to noon: clock only.
  12:00 London (PAPER; 16 candles, 08:00-12:00): A2 paper sell closed by the clock about 3 pips ahead (best +25.1, worst -7.0, last +3.4).
  -> Thu result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.333R -> paper). Checked: call committed before the bell; no order; trade list
     still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 22 (engine, `python bt/coin_control.py 2015-08-07 --check 2015-08-06`): sell, clock exit, +0.07R; the other side -0.13R.
     A2 paper running from 07-08: 22 days, -3.12R.
     SW1 SHADOW trade 4: still OPEN (buy 1.09535, stop 1.08335, target 1.11935, clock 12:00 Fri 08-07); last price 1.09240. Running -3.08R (3 of 20 done).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: the third morning running that reached +20 and came back to nothing by noon. Noted, not counted: MF tested that and killed it.
     Paper lines: UN3 agreed, +0.07R (agree days -12.40R in 61; disagree +4.23R in 17; day 78). PH2 (day 70): lively (35.9) -> half = +0.04R;
     46 lively days -8.06R, 21 full-stop mornings; 24 quiet -1.65R; PH2 about -5.67R against A2's -9.73R.
     MO PAPER RULE (day 28 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +0.07R (running -5.92R).
     For Friday (tool): MO1 -0.283R -> paper; MO3 -0.295R -> paper.

## Forward tally

## 08-03 test: idea PS, a probation size (journal/2015-idea-PS-probation-size.md)
40 trades of a mildly losing setup (-0.10R) from today's balance: $62.50 a trade reaches my stop-trading line in 11% of runs; $31.25 breaks
$435 in 11%; $15.63 (0.04 lots) never breaks $435; worst realistic cost about $220. Probation size $15.63. Idea 118, variants 328.

## 08-04 evening (no new day): Amendment 2 + idea FD (journal/2015-idea-FD-forward-design-for-LM2.md)
Coach: route C yes in principle, live only for a setup that passed its own kill line on lived days; not A2. Written as Amendment 2; route C empty.
FD: can a forward re-test let LM2 earn the slot? 40 mornings pass the real pool 54.7% and a coin 16.1%: no usable design by my line (15% / 50%).
Three options put to the coach; nothing started. Idea 119, variants 331.

## 08-05 test: idea SF, fade a sharp 15-minute spike (journal/2015-idea-SF-spike-fade.md)
409 trades: fade -0.048R, follow -0.039R, difference p 0.93; negative in both periods. Killed on all seven lines.
A sample that could judge, and a clean no: a coin minus costs. Idea 120, variants 334.

## 08-06 test: idea RT, the first touch of a round number (journal/2015-idea-RT-round-number-touch.md)
228 first touches: the bounce lost -0.159R a trade (00 levels -0.279R); the break control +0.034R. Killed on all seven lines.
Round numbers are information in my calls, not walls. Idea 121, variants 337.
