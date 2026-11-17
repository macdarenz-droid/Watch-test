# Week 31 (Mon 2015-07-27 .. Fri 07-31), funded account. A2 ON PAPER (rule alarm 07-08; return-to-live rule 07-09, gate +0.60R from 07-23). Account FLAT.
JULY GOAL: A WORKED CASE BEFORE EVERY PUSHED NUMBER OR TEST RULE, AND EVERY FILE WRITE READ BACK IN THE SAME COMMAND.
SW1 paper shadow: 1 of 20 done, trade 2 open. Payout date Fri 07-31 ($0 unless balance > $25,000). July month-end review on Mon 08-03.

## Funded trades
| # | time (London) | side | lots | entry | stop | exit | R | $ | tag | note |
|---|---|---|---|---|---|---|---|---|---|---|
| (paper) | Mon 07-27 08:00 | buy | NO LIVE TRADE (monitor -0.351R) | paper | paper | paper clock exit | (+0.95 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 14; SW1 shadow trade 2 stopped (-1.04R net) |
| (paper) | Tue 07-28 08:00 | buy | NO LIVE TRADE (monitor -0.267R) | paper | paper | paper clock exit | (-0.67 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 15; SW1 shadow trade 3 opened (buy 1.10562) |
| (paper) | Wed 07-29 08:00 | buy | NO LIVE TRADE (monitor -0.363R) | paper | paper | paper clock exit | (+0.10 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 16: flat morning |
| (paper) | Thu 07-30 08:00 | buy | NO LIVE TRADE (monitor -0.302R) | paper | paper | paper clock exit | (-0.11 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 17; SW1 shadow trade 3 stopped (-1.03R net) |

## Mon 07-27
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-07-27`:
- 3-day gap +47.0 pips -> A2 side BUY. 5-day gap +153.3 -> UN3 agree. Night 00:00-07:00: 1.09689-1.10144, last 1.10057 (range 45.5, net +31.0, with the buy).
- Friday's London day: 1.09253-1.09957, close 1.09812 (range 70.4).
- Monitor for today -0.351R (MO1), -0.273R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); route B: no tested setup. NO ORDER.
- A2 paper plan: buy at the 08:00 open, stop 40 pips below, out 12:00.
- SW1 shadow trade 2: open (sell 1.09560, stop 1.10760, target 1.07160, clock 12:00 Wed 07-29); the night is about 50 pips against it. Nothing to do.
- LM2: dead as a candidate (07-24); my question about a shadow was not answered, so there is none. I do not track it.
- How I feel: steady. Mistake to avoid: keeping a private tally of LM2 in my head.
  08:00 London (PAPER): pre-entry hour 1.10007-1.10402 = 39.5 pips (PH2 lively: half on paper). A2 paper BUY near 1.10280 (engine fixes the fill), paper stop about 1.09880. SW1 shadow untouched (about 72 pips against). No order.
  10:00 London (PAPER): A2 paper buy best +85.1, worst -29.7, last +49.8. A wide two-hour swing. The shadow sell is far against (the price is near 1.108). Before advancing to noon: clock only.
  CORRECTION to the 10:00 note: its "worst -29.7" included pre-entry prices (tool misuse, P12 below). True 08:00-10:00: best +85.1, worst -12.9, last +49.8.
  12:00 London (PAPER): A2 paper buy closed by the clock about 39 pips ahead (true 08:00-12:00: best +85.1, worst -12.9, last +39.2).
  -> Mon result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.351R -> paper). Checked: call committed before the bell; no order; trade list
     still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 14 (engine, `python bt/coin_control.py 2015-07-28 --check 2015-07-27`): buy, clock exit, +0.95R; the other side -1.00R (stopped).
     A2 paper running from 07-08: 14 days, -2.14R.
     SW1 SHADOW trade 2 (tool `bt/sw1_shadow.py 2015-07-28`): sell 1.09560 (Wed) -> STOPPED 1.10761 at 08:20 Mon, -1.00R, 5 nights, financing -0.042R,
     net -1.04R. Running -2.05R after 2 of 20 (max DD 2.05R; early-close line 6R). Next entry Tue 08:00: Mon close 1.10871 vs 07-13 close 1.10006 = +86.5 -> BUY.
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     PROCESS MISTAKE P12 found today (wrong window in my walk notes since 07-13): see the correction block below and in weeks 29 and 30.
     How it feels: annoyed at P12: ten days of notes with a number I had not understood. The check that caught it was the engine, as designed.
     Paper lines: UN3 agreed, +0.95R (agree days -10.69R in 54; disagree +3.50R in 16; day 70). PH2 (day 62): lively (39.5) -> half = +0.48R;
     43 lively days -7.34R, 21 full-stop mornings; 19 quiet -1.39R; PH2 about -5.05R against A2's -8.75R.
     MO PAPER RULE (day 20 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +0.95R (running -4.94R).
     For Tuesday (tool): MO1 -0.267R -> paper; MO3 -0.204R -> paper.

## Tue 07-28
Coach 07-28: no LM2 shadow while SW1 is 2 of 20 ("one shadow at a time"). LM2 stays dead; a fresh pre-registered re-test on new lived days only after SW1 finishes, if I still believe in it.
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-07-28`:
- 3-day gap +158.5 pips -> A2 side BUY. 5-day gap +262.1 -> UN3 agree. Night 00:00-07:00: 1.10716-1.10996, last 1.10793 (range 28.0, net -6.9).
- Monday's London day: 1.09689-1.11292, close 1.10871 (range 160.3); it made the 3-day high.
- Monitor for today -0.267R (MO1), -0.204R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); route B: no tested setup. NO ORDER.
- A2 paper plan: buy at the 08:00 open, stop 40 pips below, out 12:00.
- SW1 SHADOW trade 3 (tool `bt/sw1_shadow.py 2015-07-29 signal`): Mon close 1.10871 vs 07-13 close 1.10006 = +86.5 pips -> paper BUY at the 08:00
  open, stop 120 below, target 240 above, else out 12:00 Tue 08-04. Running -2.05R after 2 of 20.
- Walk notes today with the tool's window line read first: 8 candles at 10:00, 16 at 12:00.
- How I feel: fine. Mistake to avoid: P12's cousin, assuming a tool instead of reading its first line.
  08:00 London (PAPER): pre-entry hour 1.10544-1.10842 = 29.8 pips (PH2 quiet by 0.2 pips: full unit on paper), all of it downward. A2 paper BUY near 1.10562 (engine fixes the fill), paper stop about 1.10162. SW1 shadow BUY at the same open, stop about 1.09362, target about 1.12962. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC read from the tool): A2 paper buy best +18.1, worst -4.0, last +8.5. Before advancing to noon: clock only.
  12:00 London (PAPER; window 07:00-10:45 UTC read from the tool): A2 paper buy closed by the clock about 26 pips against (best +18.1, worst -29.6, last -25.7).
  -> Tue result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.267R -> paper). Checked: call committed before the bell; no order; trade list
     still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 15 (engine, `python bt/coin_control.py 2015-07-29 --check 2015-07-28`): buy, clock exit, -0.67R; the other side +0.61R.
     A2 paper running from 07-08: 15 days, -2.81R.
     SW1 SHADOW trade 3 (tool `bt/sw1_shadow.py 2015-07-29`): OPEN, buy 1.10562, stop 1.09362, target 1.12962, clock 12:00 Tue 08-04. Last price 1.10596. Running -2.05R (2 of 20 done).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: ordinary. The paper record alternates; I have stopped expecting it to tell me something each day.
     Paper lines: UN3 agreed, -0.67R (agree days -11.36R in 55; disagree +3.50R in 16; day 71). PH2 (day 63): quiet (29.8) -> full = -0.67R;
     43 lively days -7.34R, 21 full-stop mornings; 20 quiet -2.06R; PH2 about -5.72R against A2's -9.42R.
     MO PAPER RULE (day 21 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -0.67R (running -5.61R).
     For Wednesday (tool): MO1 -0.363R -> paper; MO3 -0.256R -> paper.

## Wed 07-29
Coach 07-29: at 20 paper days write a sober verdict on A2 "using the kill line you set, no moving it". Checked my files BEFORE the day:
I set NO separate 20-day line for the paper record. The lines that exist and apply: (1) the March alarm, already crossed 07-07 (drawdown
over 8R, or average under +0.10R) -> A2 off money; (2) the return rule: not before 09-21, MO judged, 40-day monitor >= +0.60R; back to paper
under 0.00R. I will write the day-20 verdict (Tue 08-04) against exactly these and invent no new line at day 20. Said to the coach today.
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-07-29`:
- 3-day gap +76.9 pips -> A2 side BUY. 5-day gap +125.4 -> UN3 agree. Night 00:00-07:00: 1.10461-1.10840, last 1.10504 (range 37.9, net -12.0).
- Tuesday's London day: 1.10221-1.10996, close 1.10596 (range 77.5).
- Monitor for today -0.363R (MO1), -0.256R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); route B: no tested setup. NO ORDER.
- A2 paper plan: buy at the 08:00 open, stop 40 pips below, out 12:00.
- SW1 shadow trade 3: open from Tue (buy 1.10562, stop 1.09362, target 1.12962, clock 12:00 Tue 08-04). Nothing to do.
- How I feel: steady. Mistake to avoid: making up a line for A2 because one was asked for.
  08:00 London (PAPER): pre-entry hour 1.10369-1.10554 = 18.5 pips (PH2 quiet: full unit on paper). A2 paper BUY near 1.10470 (engine fixes the fill), paper stop about 1.10070. SW1 shadow untouched. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper buy best +21.0, worst -16.9, last +15.7. Before advancing to noon: clock only.
  12:00 London (PAPER; window 07:00-10:45 UTC): A2 paper buy closed by the clock about 5 pips ahead (best +25.3, worst -16.9, last +4.8).
  -> Wed result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.363R -> paper). Checked: call committed before the bell; no order; trade list
     still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 16 (engine, `python bt/coin_control.py 2015-07-30 --check 2015-07-29`): buy, clock exit, +0.10R; the other side -0.16R.
     A2 paper running from 07-08: 16 days, -2.71R.
     SW1 SHADOW trade 3: still OPEN (buy 1.10562, stop 1.09362, target 1.12962, clock 12:00 Tue 08-04); the evening fell to 1.09818, about 74 pips against. Not managed.
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: nothing to report; a flat paper morning.
     Paper lines: UN3 agreed, +0.10R (agree days -11.26R in 56; disagree +3.50R in 16; day 72). PH2 (day 64): quiet (18.5) -> full = +0.10R;
     43 lively days -7.34R, 21 full-stop mornings; 21 quiet -1.96R; PH2 about -5.62R against A2's -9.32R.
     MO PAPER RULE (day 22 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +0.10R (running -5.51R).
     For Thursday (tool): MO1 -0.302R -> paper; MO3 -0.280R -> paper.

## Thu 07-30
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-07-30`:
- 3-day gap +0.6 pips -> A2 side BUY (any gap counts; the thinnest signal there is). 5-day gap +53.2 -> UN3 agree. Night 00:00-07:00: 1.09592-1.09891, last 1.09730 (range 29.9, net -16.0).
- Wednesday's London day: 1.09669-1.10840, close 1.09818 (range 117.1); it made the 3-day low.
- Monitor for today -0.302R (MO1), -0.280R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); route B: no tested setup. NO ORDER.
- A2 paper plan: buy at the 08:00 open, stop 40 pips below, out 12:00.
- SW1 shadow trade 3: open (buy 1.10562, stop 1.09362, target 1.12962, clock 12:00 Tue 08-04); about 83 pips against at the night's last price. Nothing to do.
- How I feel: fine. A buy on a 0.6-pip gap after a 117-pip down day looks silly; "looks silly" is not a rule.
  08:00 London (PAPER): pre-entry hour 1.09419-1.09729 = 31.0 pips (PH2 lively: half on paper), down and back up. A2 paper BUY near 1.09652 (engine fixes the fill), paper stop about 1.09252. SW1 shadow untouched. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper buy best +11.3, worst -19.1, last +2.8. Before advancing to noon: clock only.
  12:00 London (PAPER; 16 candles, 08:00-12:00): A2 paper buy closed by the clock about 3 pips against (best +19.5, worst -19.1, last -3.3).
  -> Thu result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.302R -> paper). Checked: call committed before the bell; no order; trade list
     still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 17 (engine, `python bt/coin_control.py 2015-07-31 --check 2015-07-30`): buy, clock exit, -0.11R; the other side +0.05R.
     A2 paper running from 07-08: 17 days, -2.82R.
     SW1 SHADOW trade 3 (tool `bt/sw1_shadow.py 2015-07-31`): buy 1.10562 (Tue) -> STOPPED 1.09361 at 13:30 Thu, -1.01R, 2 nights, financing -0.017R,
     net -1.03R. Running -3.08R after 3 of 20: three stops in three trades; max DD 3.08R; early-close line 6R. Next entry Fri 08:00:
     Thu close 1.09310 vs 07-16 close 1.08731 = +57.9 -> BUY.
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: the shadow is 0 for 3, each time entering after a 10-day move that then turned. On real money I would be asking to stop it. That is why it is paper with a fixed 20.
     Paper lines: UN3 agreed, -0.11R (agree days -11.37R in 57; disagree +3.50R in 16; day 73). PH2 (day 65): lively (31.0) -> half = -0.06R;
     44 lively days -7.45R, 21 full-stop mornings; 21 quiet -1.96R; PH2 about -5.68R against A2's -9.43R.
     MO PAPER RULE (day 23 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -0.11R (running -5.62R).
     For Friday (tool): MO1 -0.405R -> paper; MO3 -0.300R -> paper. Friday is a payout date: balance under $25,000 -> $0.

## Fri 07-31 (payout date; last trading day of July)
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-07-31`:
- 3-day gap -156.1 pips -> A2 side SELL. 5-day gap -51.7 -> UN3 agree. Night 00:00-07:00: 1.09311-1.09486, last 1.09342 (range 17.5, net +2.9).
- Thursday's London day: 1.08933-1.09891, close 1.09310 (range 95.8); it made the 3-day low.
- Monitor for today -0.405R (MO1), -0.300R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); route B: no tested setup. NO ORDER.
- A2 paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00.
- SW1 SHADOW trade 4 (tool `bt/sw1_shadow.py 2015-08-01 signal`): Thu close 1.09310 vs 07-16 close 1.08731 = +57.9 pips -> paper BUY at the 08:00
  open, stop 120 below, target 240 above, else out 12:00 Fri 08-07. Running -3.08R after 3 of 20. (It buys while A2 sells.)
- Payout date: tracker $24,358.99 is under $25,000 -> request $0. July month-end check after the close.
- How I feel: fine. Mistake to avoid: rushing the month-end numbers; every one from a tool or the trade list.

## Forward tally

## CORRECTION written Mon 2015-07-27 (PROCESS MISTAKE P12; found by me on 07-27 when the walk tool and the engine disagreed)
From Mon 07-13 to Mon 07-27 I called `bt/walk_numbers.py ... 24` and `... 48` for my 10:00 and 12:00 notes, believing the tool counted
M5 candles. It counts M15 candles: my windows were 6 and 12 hours, not 2 and 4, so some "best / worst" figures in the notes above include
prices from BEFORE the 08:00 entry. No result, tag, tally or decision is affected: every result came from the engine. The statements
"within 5 pips of the stop" (07-15), "1 pip from the stop" (07-21) and all "stopped" notes are true. Wrong figures, with the true ones
(08:00-10:00 | 08:00-12:00, pips from the engine's entry, recomputed from history):
| day | I wrote | true |
|---|---|---|
| 07-13 buy | best +10.5 | best +0.5; worst -132.3 as written; stopped 08:05 |
| 07-14 sell | best +12.2 | best +7.1; worst -60.6 / -65.8; stopped 09:25 |
| 07-15 sell | best +13.8 | best +8.1; worst -34.9 as written |
| 07-16 sell | worst -17.4, then -31.8 ("8.2 pips left") | worst -8.0 all morning; best +34.4 / +51.4 as written |
| 07-20 sell | best +20.1 at 10:00 | best -0.6 by 10:00, +15.0 by noon; worst -24.2 as written |
| 07-21 sell | best +17.1 | best +9.0; worst -34.3 / -39.0 as written |
| 07-22 buy | best +10.5 | best 0.0; worst -31.3 / -40.2; stopped 11:25 |
| 07-23 buy | worst -5.5 / -7.4 | worst -1.8; best +76.1 as written |
| 07-24 buy | best +5.1 | best 0.0; worst -59.5; stopped 08:30 |
| 07-27 buy | worst -29.7, then -59.1 | worst -12.9; best +85.1 as written |
(07-17: figures as written.) Cause: after a break in my work I assumed the candle size instead of reading the tool's first line. Fix: the tool now
prints its window in minutes and clock times; I use 8 and 16. July goal: "numbers corrected after a push" goes from 1 to 2 (one incident, ten days).

## 07-27 test: idea BS2, A2's buys against its sells (journal/2015-idea-BS2-buys-against-sells.md)
Outside the funded span: sells better by +0.278R, p 0.147; only January-February carries it; the paper days point the other way.
Lean dismissed (K1). Idea 113, variants 313.

## 07-28 test: idea SR, what happens after A2's stop (journal/2015-idea-SR-after-the-stop.md)
34 stops before 11:00. Other side to noon -0.169R; to 16:00 -0.214R; my own side again +0.029R. Killed on all six lines.
After the stop the move is spent; flat is right. Idea 114, variants 316.

## 07-29 test: idea EV, evening fade 17:00-21:00 (journal/2015-idea-EV-evening-fade.md)
Fade a 60+ pip day move at 17:00, stop 30, out 21:00: 51 trades -0.139R, negative in both periods. Killed (K1-K6).
The follow control made +0.099R: noted, not promoted. Idea 115, variants 319.

## 07-30 test: idea MF, the first two hours given back by noon (journal/2015-idea-MF-mid-morning-fade.md)
From three weeks of notes (8 of 14 mornings). Fade the 08-10 move at 10:00, judged before 06-05: 58 trades -0.040R; follow -0.063R.
Even the weeks where I saw it: -0.008R. Killed. Idea 116, variants 322.
