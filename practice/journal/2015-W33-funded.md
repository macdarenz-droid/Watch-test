# Week 33 (Mon 2015-08-10 .. Fri 08-14), funded account. A2 ON PAPER (alarm 07-08; return rule 07-09, gate +0.60R). Account FLAT.
AUGUST GOAL: READ A TOOL'S OWN HEADER LINE BEFORE WRITING ANY NUMBER FROM IT, AND SEE "script reached its end" BEFORE EVERY COMMIT.
Routes B and C empty. SW1 paper shadow: 4 of 20 done (-3.35R). Payout date Fri 08-14 ($0 unless balance > $25,000).
VARIANT CAP (coach 08-10): at most 3 variants per idea, named up front in the pre-registration. (FX had 3, named before code: FX1, FX2,
FX0; its 7 numbered items were KILL LINES, not variants. I say so once, and from now on I keep kill lines to as few as do the job, so
the two are not confused.)

## Funded trades
| # | time (London) | side | lots | entry | stop | exit | R | $ | tag | note |
|---|---|---|---|---|---|---|---|---|---|---|
| (paper) | Mon 08-10 08:00 | buy | NO LIVE TRADE (monitor -0.345R) | paper | paper | paper clock exit | (-0.80 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 24; SW1 shadow trade 5 opened (sell 1.09629) |
| (paper) | Tue 08-11 08:00 | buy | NO LIVE TRADE (monitor -0.396R) | paper | paper | paper clock exit | (+1.66 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 25; SW1 shadow trade 5 stopped (-1.01R net) |

## Mon 08-10
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-10`:
- 3-day gap +84.1 pips -> A2 side BUY. 5-day gap -18.3 -> UN3 DISAGREE (disagree day 18 of 30). Night 00:00-07:00: 1.09502-1.09741, last 1.09731 (range 23.9, net +8.0).
- Friday's London day: 1.08553-1.09783, close 1.09647 (range 123.0); it made the 3-day high.
- Monitor for today -0.345R (MO1), -0.265R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); routes B and C empty. NO ORDER.
- A2 paper plan: buy at the 08:00 open, stop 40 pips below, out 12:00.
- SW1 SHADOW trade 5 (tool `bt/sw1_shadow.py 2015-08-11 signal`): Fri close 1.09647 vs 07-24 close 1.09812 = -16.5 pips -> paper SELL at the
  08:00 open, stop 120 above, target 240 below, else out 12:00 Mon 08-17. (It sells while A2 buys.)
- How I feel: fine.
  08:00 London (PAPER): pre-entry hour 1.09570-1.09734 = 16.4 pips (PH2 quiet: full unit on paper). A2 paper BUY near 1.09629 (engine fixes the fill), paper stop about 1.09229. SW1 shadow SELL at the same open, stop about 1.10829, target about 1.07229. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper buy best +18.1, worst -4.7, last +1.3. Before advancing to noon: clock only.
  12:00 London (PAPER; 16 candles, 08:00-12:00): A2 paper buy closed by the clock about 31 pips against, 5 pips from the stop at its worst (best +18.1, worst -35.0, last -30.7).
  -> Mon result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.345R -> paper). VALID: no order placed. Checked: call committed before the bell;
     trade list still ends with #230 of 07-07; sim balance $24,926.03 unchanged. Trade mistakes 0; process mistakes 0.
     PAPER A2, day 24 (engine, `python bt/coin_control.py 2015-08-11 --check 2015-08-10`): buy, clock exit, -0.80R; the other side +0.74R.
     A2 paper running from 07-08: 24 days, -4.24R.
     SW1 SHADOW trade 5: OPEN (sell 1.09629, stop 1.10829, target 1.07229, clock 12:00 Mon 08-17); the afternoon rose to 1.10185, 56 pips against. Running -3.35R (4 of 20 done).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: A2 paper fell then the afternoon went its way; old song.
     Paper lines: UN3 DISAGREED (day 80): disagree days +3.43R in 18; agree days -12.72R in 62. PH2 (day 72): quiet (16.4) -> full = -0.80R;
     46 lively days -8.06R, 21 full-stop mornings; 26 quiet -2.77R; PH2 about -6.79R against A2's -10.85R.
     MO PAPER RULE (day 30 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -0.80R (running -7.04R).
     For Tuesday (tool): MO1 -0.396R -> paper; MO3 -0.274R -> paper.

## Tue 08-11
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-11`:
- 3-day gap +112.9 pips -> A2 side BUY. 5-day gap +69.4 -> UN3 agree. Night 00:00-07:00: 1.09604-1.10321, last 1.09692 (range 71.7, net -48.5: a big night against the buy).
- Monday's London day: 1.09254-1.10414, close 1.10185 (range 116.0); it made the 3-day high.
- Monitor for today -0.396R (MO1), -0.274R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); routes B and C empty. NO ORDER.
- A2 paper plan: buy at the 08:00 open, stop 40 pips below, out 12:00.
- SW1 shadow trade 5: open (sell 1.09629, stop 1.10829, target 1.07229, clock 12:00 Mon 08-17); the night brought it back near its entry. Nothing to do.
- Coach 08-11: "a2 paper is bleeding, review its last 10 losers by eye and tag each valid vs mistake" - done after the close today.
- How I feel: a falling night under a buy signal; I tested that picture twice (ON, NA) and it was a story both times.
  08:00 London (PAPER): pre-entry hour 1.09632-1.09839 = 20.7 pips (PH2 quiet: full unit on paper). A2 paper BUY near 1.09667 (engine fixes the fill), paper stop about 1.09267. SW1 shadow untouched. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper buy best +82.4, worst -1.7, last +70.6. The falling night turned at the bell. Before advancing to noon: clock only.
  12:00 London (PAPER; 16 candles, 08:00-12:00): A2 paper buy closed by the clock about 68 pips ahead (best +82.4, worst -1.7, last +67.6).
  -> Tue result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.396R -> paper). VALID: no order placed. Checked: call committed before the bell;
     trade list still ends with #230 of 07-07; sim balance $24,926.03 unchanged. Trade mistakes 0; process mistakes 0.
     PAPER A2, day 25 (engine, `python bt/coin_control.py 2015-08-12 --check 2015-08-11`): buy, clock exit, +1.66R; the other side -1.00R (stopped).
     A2 paper running from 07-08: 25 days, -2.58R.
     SW1 SHADOW trade 5 (tool `bt/sw1_shadow.py 2015-08-12`): sell 1.09629 (Mon) -> STOPPED 1.10830 at 14:20 Tue, -1.00R, 1 night, financing -0.008R,
     net -1.01R. Running -4.36R after 5 of 20 (max DD 4.36R; early-close line 6R: 1.64R of room left).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: the picture I distrusted at 07:00 (falling night under a buy) was the best paper morning in weeks. Good reminder that the ON/NA kills were right.
     Paper lines: UN3 agreed, +1.66R (agree days -11.06R in 63; disagree +3.43R in 18; day 81). PH2 (day 73): quiet (20.7) -> full = +1.66R;
     46 lively days -8.06R, 21 full-stop mornings; 27 quiet -1.11R; PH2 about -5.13R against A2's -9.19R.
     MO PAPER RULE (day 31 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +1.66R (running -5.38R).
     For Wednesday (tool): MO1 -0.395R -> paper; MO3 -0.283R -> paper.

## Forward tally

## 08-10 test: idea AR, Asia-hours reversion to midnight's price (journal/2015-idea-AR-asia-reversion.md; 3 variants named up front)
117 nights: -0.024R, and -0.170R at a 2.5-pip night spread; follow -0.157R. Killed on all four lines. Reversion lost before 04-07 and paid
after, at night too: the regime, not a rule. Idea 124, variants 346.
