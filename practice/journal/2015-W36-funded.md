# Week 36 (Mon 2015-08-31 .. Fri 09-04), funded account. A2 ON PAPER (alarm 07-08; return rule 07-09, gate +0.60R). Account FLAT.
AUGUST GOAL (closes at the 09-01 review): READ A TOOL'S OWN HEADER LINE BEFORE WRITING ANY NUMBER FROM IT, AND SEE "script reached its end" BEFORE EVERY COMMIT.
Routes B and C empty. Paper forward counts (no money): EN2 (from 08-28), YM1 and NC1 (from 08-31, coach 08-28). August month-end review Tue 09-01.
Next payout date Fri 09-11.

## Funded trades
| # | time (London) | side | lots | entry | stop | exit | R | $ | tag | note |
|---|---|---|---|---|---|---|---|---|---|---|
| (paper) | Mon 08-31 08:00 | sell | NO LIVE TRADE (monitor -0.203R) | paper | paper | paper clock exit | (+0.31 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 39; NC1 day 1 = SKIP tag; YM1 day 1 agree |

## Mon 08-31
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-31`:
- 3-day gap -334.1 pips -> A2 side SELL. 5-day gap -202.8 -> UN3 agree. Night 00:00-07:00: 1.11970-1.12624, last 1.12503 (range 65.4, net +52.6, against the sell).
- Friday's London day: 1.11559-1.13097, close 1.11800 (range 153.8, close position 0.16); it made the 3-day low. ADR5 230.9 (tool). 10-day trend UP.
- Monitor for today -0.203R (MO1), -0.211R (MO3) -> BOTH PAPER. Route A closed until 09-21; routes B and C empty. NO ORDER.
- A2 paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00.
- Forward counts (paper): YM1 day 1 and NC1 day 1 - both read from their tools at 08:00 / after the day; EN2 after the day.
- How I feel: fine; three new paper lines at once, so I read each from its tool and write nothing from memory.
  08:00 London (PAPER): pre-entry hour 1.12236-1.12535 = 29.9 pips (just under 30: PH2 quiet, full), net -27.2 = WITH the sell (ran A2's way).
     NC1 (paper tag, frozen X = 15): the hour ran ~27 pips A2's way -> NC1 would SKIP. Tool confirms after the day: hour +27.2 signed, skip True.
     A2 paper SELL near 1.12236 (engine fixes the fill), paper stop about 1.12636. No order.
  10:00 London (PAPER; 8 candles, 07:00-08:45 UTC): best +22.2, worst -5.8, last +22.2. Stop 34.2 pips away at the worst.
  12:00 London (PAPER; 16 candles, 08:00-12:00): clock exit about +12.7 (best +26.0, worst -5.8).
  -> Mon result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.203R -> paper). VALID: no order placed. Checked: call committed before the bell (dc91692);
     sim balance $24,926.03 unchanged, trading days 73. Trade mistakes 0; process mistakes 0. (The feed had normal London candles on 08-31.)
     PAPER A2, day 39 (engine, costs on 1.0 + 0.1; `python bt/coin_control.py 2015-09-01 --check 2015-08-31`): sell, clock exit, +0.31R; the other side -0.37R.
     A2 paper running from 07-08: 39 days, -1.56R.
     NC1 FORWARD day 1 (`python bt/no_chase_hour.py 2015-09-01 check 2015-08-31`): hour +27.2 A2's way -> SKIP day 1 of 30; A2 on that day +0.31R
       (a skip that would have missed a winner). NC0 (hour 15+ against): no.
     YM1 FORWARD day 1 (`python bt/ym_forward.py 2015-09-01 forward 2015-08-31`): SELL, AGREE with A2; YM1 +0.31R, YM0 -0.37R, stressed +0.27R.
       1 of 80; disagree days 0 of 25.
     EN2 FORWARD (`python bt/en2_forward.py 2015-08-28 2015-09-01`): 0 trades so far.
     Paper lines: UN3 agreed (day 95): agree days -11.33R in 73; disagree days +4.72R in 22. PH2 (day 87): quiet (29.9) -> full = +0.31R;
     51 lively -7.80R; 36 quiet +0.67R; PH2 about -3.74R against A2's -8.17R.
     MO PAPER RULE (day 45 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +0.31R (running -4.36R).
     For Tuesday (tool): MO1 -0.177R -> paper; MO3 -0.183R -> paper. Tuesday 09-01: August month-end review.
     How it feels: calm. First NC1 skip tag was a winner; one day says nothing.

## 08-31 evening test: idea 150 HL, skip A2 against the daily lows/highs (journal/2015-idea-HL-against-the-daily-structure.md)
From my W06 note ("sold into higher lows"). Prereg, counts (N = 1 by rule, 50 skips) and worked case pushed before the run. R = engine A2 after
costs 1.0 + 0.1: skipped days +0.212R vs kept +0.121R, gap -0.091R, p 0.71 -> KILLED on all four lines. Ideas 150, variants 400.
