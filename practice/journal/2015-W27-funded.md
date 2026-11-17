# Journal - FUNDED ACCOUNT, week of 2015-06-29 (W27). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. Size 0.50% = $125 = 0.31 lots. All times London.
JUNE PROCESS GOAL (in front of every call until the month-end review on Wed 07-01): EVERY NUMBER AND EVERY TEST RULE GETS ONE WORKED CASE BEFORE IT IS PUSHED.
Numbers or rules corrected after a push in June so far: 3 (06-12 a stale paid-out label; 06-17 a wrong label on a test line; 06-18 "85 ideas" for 84; May: 5). One test earns one day; one at a time.
Start of week (from the tool, 06-26): tracker balance $24,711.65 (sim $25,278.69 minus $567.04 paid out), high-water $25,256.94, drawdown -2.16% (4.26R under the equity high, 6 losses in a row). Last week -2.43R. PAYOUT DATE this week: Fri 07-03. Month-end review: Wed 07-01.
SIZE RULE = the real safety rule (coach 06-02): half size from a day's close at or below 3% under the high-water ($24,499.23) until a new high-water; STOP at 7% under ($23,488.95).
WORRY LINES (frozen 06-25, in STATE's gates list): W1 lived average, W2 lived win rate, W3 full-stop share (crossed, reported), W4 drawdown beyond 8.55R or a losing run of 8, W5 fills, W6 a trade mistake.
RG (06-26): the signal's advantage over a coin has been about zero since mid-April and that is not noise. Coach 06-29: "don't change live rules off one test. write
a pre-set rule for what you'd do when the side advantage fades (e.g. a rolling check that cuts size or pauses), backtest it on your history first with a kill
test, then use your lived days as the out-of-sample check. survival first, funded account matters more than any one setup."
Paper tags, never live: UN3 (07:00), PH2 (08:00, before the order), MB1 (12:00, before 13:25). Counts-only: night-against, 10-day trend, +80 pip trades (GB1, judged at 15), 80+ pip pre-entry hours.
Bookkeeping command this week: `python bt/daily_numbers.py 567.04 25256.94`.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|

## Daily calls - each written at 07:00 London and committed before the entry bar; then a note before every advance

- **Mon 06-29 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-29`, `./look.sh` or a bar print. Friday's tag stands: VALID LOSS.
  Coach 06-29: see the header. Nothing live changes today.
  Plan line read (BD): the only way to lose the best days is not to trade the day or not to hold it to 12:00.
  Streak against the written numbers (06-24): 6 losses in a row (= lived worst; 95th percentile 7); 4.26R under the high (95th percentile 8.55R). A seventh
      loss is AT the edge of the 95% range; an eighth is worry line W4, written up and sent to the coach the same day.
  D1 (London days): Wed 06-24 close 1.12040 (0.62); Thu 06-25 close 1.12045 (0.69); Fri 06-26 high 1.12197 low 1.11301 close 1.11625 (0.36, range 89.6):
      flat in my morning, down in the afternoon to a new 3-day low, a close in the lower half.
  WEEKEND: Friday's last 1.11625; Sunday's first bar opened 1.10049: a gap DOWN of about 158 pips - by far the largest weekend gap in my history (median
      about 14 pips). Sunday evening low 1.09545; since then back up: last 1.10170, about 145 pips under Friday's close. Not in the 22:00 closes, so not in my signal.
  H4 (UTC bars): Fri 12:00 bar down to 1.11301; 16:00 bar back to 1.11697; Sunday bar 1.10049 -> low 1.09545, close 1.09743; tonight 00:00 bar up to 1.10325, close 1.10146; 04:00 bar 1.09851-1.10276, last 1.10170.
  H1: the night (00:00-07:00 London): open 1.09901, high 1.10325, low 1.09692, last 1.10170: range 63.3 pips (ratio 1.32), net +26.9 pips - a rising night after the gap, against a sell.
  M15: the last candle swung 1.09851-1.10202 (35 pips) and closed where it opened: nervous.
  Bias: SELL. 22:00 London closes: 06-26 1.11625 vs 06-23 1.11677 = -5 pips (3-day gap -5.2). Gap / ADR5 0.05: the smallest kind of signal. Fourth sell. The rule says any gap counts.
      (The price at 08:00 will be about 145 pips under the close the signal was read from. The signal is the 22:00 closes; idea FS.)
  UN3 PAPER TAG (never live): 5-day gap -186 pips (-186.2) -> SELL; agree: paper TRADES. Forward day 50, disagree days 11 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 42.
  MB1 PAPER TAG (never live, forward day 34): morning direction written at 12:00, before 13:25. Kept drawdown 5.66R; early-close line 6R.
  Levels: night high 1.10325; Sunday's open 1.10049; night low 1.09692; Sunday's low 1.09545; Friday's close 1.11625 (the gap's upper edge, 145 pips above).
  Rejection-day check: for a sell, Friday made the 3-day low (True) and closed at 0.36, not in the top third. Not a rejection day. 10-day trend: DOWN (1.11625 vs 06-12 1.12648); the sell is WITH it.
  SIZE RULE (the real safety rule): tracker balance $24,711.65, high-water $25,256.94, drawdown -2.16%; trigger 1 (half size) $24,499.23 not reached on a close -> FULL size, 0.31 lots. Trigger 2 (stop) $23,488.95.
      A full stop today leaves about $85 above the line. On a morning like this a stop can be filled worse than 1R (idea DC: a jump day about 3R = 1.5%);
      that would put tonight's close under the line and tomorrow at half size. The rule reads the close; today's size is not cut in advance.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: selling 150 pips under Friday after a gap that is already being bought back, on a 5 pip signal, on the seventh morning of a losing run, three days
      after a test said my side is a coin's side. Every part of me wants to stand aside. That is exactly the day the rule "no skips" was written for,
      and the coach's instruction is that a pre-set rule comes first and is tested first. Written, not a rule.

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 85 | 45 | +13.42 | +0.16 | 4.85R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 49 days, 11 disagree days of 30 | - | A2 on the disagree days +2.01R; on the agree days -3.26R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 41 days, 29 lively days of 60 | - | A2 on the lively days -2.76R (13 full-stop mornings), on the 12 quiet days -0.03R; PH2 about -1.40R vs A2 -2.81R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33) | 05-13 +0.64 (funded 34) | 05-14 +0.51 (funded 35) | 05-15 -1.00 (funded 36) | 05-18 -1.00 (funded 37) | 05-19 +2.17 (funded 38) | 05-20 -1.00 (funded 39) | 05-21 -1.00 (funded 40) | 05-22 -1.00 (funded 41) | 05-25 +0.69 (funded 42) | 05-26 -0.45 (funded 43) | 05-27 +0.91 (funded 44) | 05-28 +0.10 (funded 45) | 05-29 -1.00 (funded 46) | 06-01 -1.00 (funded 47) | 06-02 +1.51 (funded 48) | 06-03 -1.00 (funded 49) | 06-04 +2.87 (funded 50) | 06-05 -0.64 (funded 51) | 06-08 -1.00 (funded 52) | 06-09 -1.00 (funded 53) | 06-10 -0.14 (funded 54) | 06-11 -1.00 (funded 55) | 06-12 +0.85 (funded 56) | 06-15 +0.23 (funded 57) | 06-16 +1.60 (funded 58) | 06-17 +0.14 (funded 59) | 06-18 +1.20 (funded 60) | 06-19 -1.00 (funded 61) | 06-22 -1.00 (funded 62) | 06-23 -1.00 (funded 63) | 06-24 -0.13 (funded 64) | 06-25 -0.15 (funded 65) | 06-26 -0.15 (funded 66).
Loss tags, all live trades: valid loss 53 (-36.42R, from the tool) | my mistake 0. Process mistakes (funded): 4.

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 85 | 85 |
| Win rate | 64% | 53% | 53% |
| Avg R | +0.50 | +0.16 | +0.16 |
| +- 2 standard errors | 0.33 | 0.23 | 0.23 |
| Net R | +19.56 | +13.42 | +13.50 |
| Avg win / avg loss | +1.04 / -0.46 | +0.97 / -0.76 | +0.99 / -0.77 |
| Full stops | 3 (8%) | 27 (32%) | 27 (32%) |
| Max drawdown | 1.87R | 4.85R | 4.92R |
| Worst 10 trades in a row | +0.56R | -3.69R | -3.75R |
| Sells: n, avg R | 24, +0.70 | 45, +0.27 | 45, +0.27 |
| Buys: n, avg R | 15, +0.18 | 40, +0.04 | 40, +0.04 |
Live minus backtest: -0.34R per trade (noise band +-0.40R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): -0.08R. As traded vs engine on the same days: -0.07R over 85 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 85 done, avg +0.16R, max DD 4.85R. Planning edge +0.18R: live is -0.02R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 27 (+1.34R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 25 trades -0.41R; trend DOWN 13 trades -2.67R (look at 40 up-trend trades). MB1 paper from 05-13: 33 days, kept 11 trades (-4.90R, DD 5.66R); removed 20 (+12.58R); no break 2. +80 pip trades from 05-22: 3 of 15 (net trail +0.82R). Pre-entry hour 80+ pips: 4 of 10 (0 wins, -3.18R).
Normal worst, re-read 06-24 (bt/streak_check.py 2015-06-24, all 121 engine A2 trades reshuffled over 82 trades): longest losing run median 4, 95th pct 7; max drawdown median 4.52R, 95th pct 8.55R. (Written 05-19 for 56 trades: 6 in a row, 5.92R.) Live worst: 6 in a row (April and now), 4.85R (06-11). Now: 6 in a row, 4.26R under the high.

