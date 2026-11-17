# Journal - FUNDED ACCOUNT, week of 2015-07-06 (W28). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. All times London.
>>> HALF SIZE IS ON (size rule, trigger 1): 0.16 lots = 0.25% = $62.50 a trade, every day, from Mon 07-06 until the tracker balance makes a new high-water (above $25,256.94).
    It came on by the rule on the close of Fri 07-03 ($24,489.07, $10.16 under $24,499.23). Coach 07-06: "that's the system working, not a failure."
JULY PROCESS GOAL (in front of every call): A WORKED CASE BEFORE EVERY PUSHED NUMBER OR TEST RULE, AND EVERY FILE WRITE READ BACK IN THE SAME COMMAND.
July so far: numbers corrected after a push: 1 (07-03, a unit); file errors found late: 0.
Start of week (from the tool, 07-03): tracker balance $24,489.07 (sim $25,056.11 minus $567.04 paid out), high-water $25,256.94, drawdown -3.04% (6.07R under the equity high). Last week -1.80R.
SIZE RULE: half size until a new high-water ($767.87 away); STOP TRADING at 7% under the high-water ($23,488.95; $1,000.12 away). No payout request while half size is on (next date Fri 07-17).
WORRY LINES (frozen 06-25): W1 lived average, W2 lived win rate, W3 full-stop share (crossed, reported), W4 drawdown beyond 8.55R or a losing run of 8, W5 fills, W6 a trade mistake.
Paper, never live: UN3 (07:00), PH2 (08:00, before the order), MO1 / MO3 monitor (07:00; day 5 of 60 on Monday). Counts-only: night-against, 10-day trend, +80 pip trades (GB1, judged at 15), 80+ pip pre-entry hours.
Bookkeeping command this week: `python bt/daily_numbers.py 567.04 25256.94`. R is always result / amount risked, so a half-size stop is still -1.00R (-$62.50).
Coach 07-06: next brick - position sizing math: how the half-size / full-size ladder affects drawdown and recovery time against flat sizing, pre-registered, max 3 variants.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|

## Daily calls - each written at 07:00 London and committed before the entry bar; then a note before every advance

- **Mon 07-06 call, written 07:00 London (06:00 UTC), before the entry bar.** JULY GOAL read first. Figures from `python bt/call_numbers.py 2015-07-06`, `./look.sh`, `python bt/side_monitor.py 2015-07-06 --state` or a bar print. Friday's tag stands: VALID LOSS.
  Coach 07-06: see the header. WD killed properly; half size from Monday by my rule.
  Plan line read (BD): the only way to lose the best days is not to trade the day or not to hold it to 12:00.
  SIZE RULE, read word for word: "HALF size (0.16 lots) from a day's CLOSE at or below 3% under the high-water mark, until a new high-water." The trigger
      came on at Friday's close. The balance ($24,489.07) is not above the high-water ($25,256.94) -> TODAY IS HALF SIZE: 0.16 LOTS. Not 0.31 because
      it is "only ten dollars"; not zero because it is a Monday after a gap. Trigger 2 (stop trading) $23,488.95.
  D1 (London days): Wed 07-01 close 1.10523 (0.08); Thu 07-02 close 1.10832 (0.57); Fri 07-03 high 1.11177 low 1.10650 close 1.11092 (0.84, range 52.7):
      a small day closing near its high. Second higher close.
  WEEKEND: Friday's last 1.11092; Sunday's first bar opened 1.09932: a gap DOWN of about 116 pips - the second big gap in two weekends. Sunday evening
      low 1.09690; since then bought back: last 1.10682, about 41 pips under Friday's close. Not in the 22:00 closes, so not in my signal.
  H4 (UTC bars): Fri 12:00 bar 1.10790-1.11081; 16:00 bar low 1.10650, close 1.11059; Sunday bar 1.09932 -> low 1.09690, close 1.09945; tonight 00:00 bar up to 1.10566, close 1.10363; 04:00 bar 1.10109-1.10880, last 1.10682.
  H1: the night (00:00-07:00 London): open 1.10217, high 1.10880, low 1.09915, last 1.10682: range 96.5 pips (ratio 2.59: a wild night), net +46.5 pips - rising, AGAINST a sell.
  M15: the last two candles rose 60 pips (1.1026 -> 1.1088) and gave 20 back.
  Bias: SELL. 22:00 London closes: 07-03 1.11092 vs 06-30 1.11445 = -35 pips (3-day gap -35.3). Gap / ADR5 0.24. Fourth sell.
  UN3 PAPER TAG (never live): 5-day gap -53 pips (-53.3) -> SELL; agree: paper TRADES. Forward day 55, disagree days 12 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 47.
  MO PAPER RULE (never live; day 5 of 60): MO1 (40 days) monitor -0.227R -> A2 would be on PAPER today. MO3 (60 days) monitor +0.022R -> A2 as usual.
  Levels: night high 1.10880; Fri close 1.11092 (the gap's upper edge); Fri high 1.11177; night low 1.09915; Sunday's low 1.09690.
  Rejection-day check: for a sell, Friday did not make the 3-day low. Not a rejection day. 10-day trend: DOWN (1.11092 vs 06-19 1.13487); the sell is WITH it.
  Plan: SELL 0.16 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: last Monday's picture again - a gap down being bought back, and I sell into it. Last Monday lost. One case. Written, not a rule.

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 90 | 47 | +11.62 | +0.13 | 6.07R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 54 days, 12 disagree days of 30 | - | A2 on the disagree days +2.49R; on the agree days -5.54R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 46 days, 32 lively days of 60 | - | A2 on the lively days -3.20R (14 full-stop mornings), on the 14 quiet days -1.39R; PH2 about -2.98R vs A2 -4.61R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33) | 05-13 +0.64 (funded 34) | 05-14 +0.51 (funded 35) | 05-15 -1.00 (funded 36) | 05-18 -1.00 (funded 37) | 05-19 +2.17 (funded 38) | 05-20 -1.00 (funded 39) | 05-21 -1.00 (funded 40) | 05-22 -1.00 (funded 41) | 05-25 +0.69 (funded 42) | 05-26 -0.45 (funded 43) | 05-27 +0.91 (funded 44) | 05-28 +0.10 (funded 45) | 05-29 -1.00 (funded 46) | 06-01 -1.00 (funded 47) | 06-02 +1.51 (funded 48) | 06-03 -1.00 (funded 49) | 06-04 +2.87 (funded 50) | 06-05 -0.64 (funded 51) | 06-08 -1.00 (funded 52) | 06-09 -1.00 (funded 53) | 06-10 -0.14 (funded 54) | 06-11 -1.00 (funded 55) | 06-12 +0.85 (funded 56) | 06-15 +0.23 (funded 57) | 06-16 +1.60 (funded 58) | 06-17 +0.14 (funded 59) | 06-18 +1.20 (funded 60) | 06-19 -1.00 (funded 61) | 06-22 -1.00 (funded 62) | 06-23 -1.00 (funded 63) | 06-24 -0.13 (funded 64) | 06-25 -0.15 (funded 65) | 06-26 -0.15 (funded 66) | 06-29 -1.00 (funded 67) | 06-30 +0.48 (funded 68) | 07-01 -1.00 (funded 69) | 07-02 +0.08 (funded 70) | 07-03 -0.36 (funded 71).
Loss tags, all live trades: valid loss 56 (-38.79R, from the tool) | my mistake 0. Process mistakes (funded): 11 (P11 06-30).

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 90 | 90 |
| Win rate | 64% | 52% | 52% |
| Avg R | +0.50 | +0.13 | +0.13 |
| +- 2 standard errors | 0.33 | 0.22 | 0.22 |
| Net R | +19.56 | +11.62 | +11.71 |
| Avg win / avg loss | +1.04 / -0.46 | +0.94 / -0.76 | +0.96 / -0.77 |
| Full stops | 3 (8%) | 29 (32%) | 29 (32%) |
| Max drawdown | 1.87R | 6.07R | 6.18R |
| Worst 10 trades in a row | +0.56R | -4.88R | -4.94R |
| Sells: n, avg R | 24, +0.70 | 49, +0.20 | 49, +0.20 |
| Buys: n, avg R | 15, +0.18 | 41, +0.05 | 41, +0.05 |
Live minus backtest: -0.37R per trade (noise band +-0.40R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): -0.10R. As traded vs engine on the same days: -0.09R over 90 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 90 done, avg +0.13R, max DD 6.07R. Planning edge +0.18R: live is -0.05R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 31 (+0.54R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 25 trades -0.41R; trend DOWN 18 trades -4.47R (look at 40 up-trend trades). MB1: CLOSED 06-30. MO paper rule from 06-30: day 4 of 60 (MO1 0.00R, MO3 -0.80R, A2 -0.80R). +80 pip trades from 05-22: 3 of 15 (net trail +0.82R). Pre-entry hour 80+ pips: 5 of 10 (0 wins, -4.18R).
Normal worst, re-read 06-24 (bt/streak_check.py 2015-06-24, all 121 engine A2 trades reshuffled over 82 trades): longest losing run median 4, 95th pct 7; max drawdown median 4.52R, 95th pct 8.55R. Live worst: 7 in a row (06-19 .. 06-29), 6.07R (07-03, now). Now: 1 in a row, 6.07R under the high. HALF SIZE ON from 07-06.

