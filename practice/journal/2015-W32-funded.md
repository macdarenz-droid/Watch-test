# Week 32 (Mon 2015-08-03 .. Fri 08-07), funded account. A2 ON PAPER (alarm 07-08; return rule 07-09, gate +0.60R). Account FLAT.
AUGUST GOAL: READ A TOOL'S OWN HEADER LINE BEFORE WRITING ANY NUMBER FROM IT, AND SEE "script reached its end" BEFORE EVERY COMMIT.
SW1 paper shadow: 3 of 20 done (-3.08R), trade 4 open. Day-20 A2 verdict due Tue 08-04. Next payout date Fri 08-14.

## Funded trades
| # | time (London) | side | lots | entry | stop | exit | R | $ | tag | note |
|---|---|---|---|---|---|---|---|---|---|---|
| (paper) | Mon 08-03 08:00 | sell | NO LIVE TRADE (monitor -0.406R) | paper | paper | paper clock exit | (+0.73 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 19; SW1 shadow trade 4 open |

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

## Forward tally

## 08-03 test: idea PS, a probation size (journal/2015-idea-PS-probation-size.md)
40 trades of a mildly losing setup (-0.10R) from today's balance: $62.50 a trade reaches my stop-trading line in 11% of runs; $31.25 breaks
$435 in 11%; $15.63 (0.04 lots) never breaks $435; worst realistic cost about $220. Probation size $15.63. Idea 118, variants 328.
