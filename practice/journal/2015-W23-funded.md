# Journal - FUNDED ACCOUNT, week of 2015-06-01 (W23). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. Size 0.50% = $125 = 0.31 lots. All times London.
JUNE PROCESS GOAL (in front of every call, coach 06-01): EVERY NUMBER AND EVERY TEST RULE GETS ONE WORKED CASE BEFORE IT IS PUSHED. In a call or a note: no
figure without a tool print or a python line behind it. Count of numbers or rules corrected after a push in June so far: 0 (May: 5).
Start of week (from the tool, 05-29): tracker balance $24,914.52 (sim $25,389.36 minus $474.84 paid out), high-water $25,349.14, drawdown -1.71% (3.45R under the equity high). May -2.00R (review: journal/2015-05-month-end-review.md; coach: normal variance, no rule changes off one month). PAYOUT DATE this Friday 06-05.
SIZE RULE: half size from a day's close at or below 3% under the high-water ($24,588.67) until a new high-water; STOP at 7% under ($23,574.70; fixed for funded days 36-55; 11 done).
NORMAL WORST (written 05-19): 6 losses in a row; about 5.9R of drawdown. Live worst so far: 6 in a row (April), 3.69R (05-22).
Paper tags, never live: UN3 (07:00), PH2 (08:00, before the order), MB1 (12:00, before 13:25). Counts-only: night-against, 10-day trend, +80 pip trades, 80+ pip pre-entry hours.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| F47 | Mon 06-01 08:00 | buy | 0.31 | 1.09392 | 1.08982 | 1.08981 (stop, 09:38) | -1.00 | -$127.41 | VALID LOSS (valid setup, market disagreed) | flip day; +14.2 pips in the first candle, then down; low 1.08915 = 6.7 pips through the stop; price at 12:00 London 1.09225 (-16.7 from entry, 24.3 ABOVE the stop; -0.41R at noon without it): a poke; quiet pre-entry hour (26.7): PH2 paper full size; UN3 DISAGREE (paper skips); MB1 paper day 14: break UP against the morning, removed, -1.00R |

## Daily calls - each written at 07:00 London and committed before the entry bar; then a note before every advance
- **Mon 06-01 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-01`, `./look.sh` or a bar print taken at 07:00 with the full night in the feed (the partial print of the cut-off release was thrown away). Friday's tag stands: VALID LOSS.
  D1 (London days): Wed 05-27 close 1.09038 (0.77); Thu 05-28 close 1.09474 (0.88); Fri 05-29 high 1.10062 low 1.09258 close 1.09831 (0.71, range 80.4): a
      third rising close and a new 3-day high. The fall of May has turned up from the 1.0819 low.
  H4 (UTC bars): Fri 12:00 bar high 1.10062; 16:00 bar 1.09728-1.09978; Sunday bar down to 1.09521; tonight 00:00 bar low 1.09304; 04:00 bar 1.09490-1.09676.
  H1: the night (00:00-07:00 London): open 1.09681, high 1.09688, low 1.09304, last 1.09542: range 38.4 pips (ratio 0.94), net -13.9 pips - a slightly falling night, against my side.
  M15: 1.0957-1.0968, then one candle down to 1.09523; last close 1.09542.
  Bias: BUY. 22:00 London closes: 05-29 1.09831 vs 05-26 1.08719 = +111 pips (3-day gap +111.2). The signal FLIPPED to buy (flip day). Gap / ADR5 1.24: stretched.
  UN3 PAPER TAG (never live): 5-day gap -24 pips -> SELL; 3-day says BUY -> DISAGREE: paper SKIPS. Forward day 30, disagree day 7 of 30. Live trade at full size.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 22.
  MB1 PAPER TAG (never live, forward day 14; kept drawdown 4.00R, early-close line 6R): morning direction written at 12:00, before 13:25.
  Levels: night low 1.09304; Fri low 1.09258; night high 1.09688; Fri high 1.10062.
  Rejection-day check: for a buy, Friday would need the 3-day high (True) AND a close in the bottom third; it closed at 0.71. Not a rejection day.
  10-day-trend paper line: DOWN (1.09831 vs 05-15 1.14484); today's buy is against it.
  SIZE RULE: tracker balance $24,914.52, high-water $25,349.14, drawdown -1.71%; trigger 1 (half size) $24,588.67 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,574.70.
  Monday, first trade of June, after a losing month: the plan, the same size. Month-end review: done on 05-29 before the last test, as the coach ordered.
  Plan: BUY 0.31 at 08:00 London, stop 40 pips below the bid, never moved, close 12:00. One trade.
  Worry: a flip day against the 10-day trend and against UN3. FL says flip days are ordinary. Written, not a rule.
  08:00 London Mon: pre-entry hour 1.09346-1.09613 = 26.7 pips -> PH2 paper: QUIET, paper full size (decided before the order). Price 1.09382: night against me by 29.9 pips (counted); entry 16.0 pips better than at 07:00. Order: BUY 0.31, stop 40 pips below the bid (1.08982).
  08:15 London: filled BUY 1.09392, stop 1.08982 (41.0 pips from the fill). First candle read from the tool. No call that matters; hands off.
  09:00 London: first hour best +14.2, worst -34.8 (low 1.09044, 6.2 pips from the stop), last -32.8 pips: three falling candles after a first pop. Nothing to do; the stop is the stop. No call.
  10:00 London: STOPPED in the 09:30 London candle (low 1.08953, 2.9 pips through my level). Sim balance from the tool $25,261.95. One trade a day: done. I watch to noon only for the stop-day routine.
  12:00 London: price (bid, from the tool) 1.09225 = 16.7 pips under my entry and 24.3 pips ABOVE my stop; the morning low was 1.08915, 6.7 pips through my level. Without the stop about -0.41R at noon instead of -1.00R (python): a poke, the stop cost about 0.6R. Written, not a case for anything: SA priced wider stops on all history. MB1 paper (forward day 14), written before 13:25: open 08:00 1.09381, price at 12:00 1.09225 -> morning DOWN by about 16 pips (small morning) -> only a DOWN break of the 12:00-13:25 box counts. Exact figures from the tool afterwards.
  -> Mon result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: June goal read before the call; size rule read, no trigger,
     full size; call committed at 07:00 London on a complete print; PH2's range written at 08:00 before the order; BUY 0.31 at 08:00, stop never moved, one
     trade, nothing after the stop. Process: clean. Numbers corrected after a push in June: 0.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, the walk prints, the trade list and python lines.
     Result: bought 1.09392, stop 1.08982 (40 pips under the bid at the order; 41.0 from the fill, risk $127.10), STOPPED 09:38 London @1.08981, -$127.41 = -1.00R.
     Tracker balance $24,787.11 (sim $25,261.95 minus $474.84 paid out), high-water $25,349.14, drawdown -2.22%: a NEW DEEPEST (was -1.83% on 05-22).
     Size rule after the day: trigger 1 (half size) $24,588.67 NOT reached -> full size tomorrow. It is $198.44 away: one more full stop leaves about $70 of
     room, a second one triggers half size on that day's close. The rule decides on the close; I only read it. Trigger 2 (stop trading) $23,574.70.
     Funded totals from the log: 47 trades, 24 wins, 23 valid losses, +2.14R (March +0.97R, April +4.17R, May -2.00R, June -1.00R in 1 trade).
     AGAINST THE WRITTEN NUMBER (05-19: normal worst 6 losses in a row, about 5.9R): 2 in a row; 4.45R under the equity high (trade list) - a new live maximum
     drawdown (was 3.69R). Above the median worst case (3.09R), inside the 95th percentile (5.92R). The A2 alarm's lines (at 100 live trades: average
     >= +0.10R, max DD <= 8R) read +0.20R and 4.45R at 66 trades. Coach, 06-01: May was normal variance, no rule changes off one month. None made.
     How it feels: tired of stops, and aware that the half-size trigger is close. That awareness must not touch tomorrow's size: full, by the rule.
     Price at 12:00 London (stop-day routine): bid 1.09225 = 16.7 pips under my entry, 24.3 pips ABOVE the stop; morning low 1.08915 (6.7 pips through).
     About -0.41R at noon without the stop: a poke that cost about 0.6R.
     Paper tags: UN3 - seventh forward DISAGREE day - paper skips a -1.00R trade (disagree days: +1.42R after six, now +0.42R in 7; agree days -1.86R in 23; n = 7 of 30).
     PH2 (paper, forward day 22): QUIET hour (26.7) -> paper full size = -1.00R, same as live. Tally: 22 days, 17 lively (live -3.04R, 8 full-stop mornings),
     5 quiet (+0.06R, 2 full-stop mornings); PH2 total about -1.46R against A2's -3.00R.
     MB1 (paper, forward day 14; `python bt/morning_box.py 2015-06-02 --check 2015-06-01`): open 08:00 1.09381, open 12:00 1.09225 -> morning -15.6 pips (DOWN, small);
     the box broke UP -> against -> REMOVED; that trade lost -1.00R. Fourteen forward days: kept 5 (-3.24R, DD 4.00R), removed 8 (+7.64R), no break 1.
     Night count: against me by 29.9 pips -> live trade 18 of the count (running: 18 trades, +0.63R). 10-day-trend paper line: trend DOWN: 9 trades, -3.75R; trend UP: 10 trades, +0.48R.
     +80 pip trades: none (0 of 15). 80+ pip pre-entry hours: none (4 of 10).
     Payout date Friday 06-05: the balance is under $25,000; as it stands the request is $0.
     END OF RELEASED DATA (clock Tue 06-02 01:00 London).

- **Tue 06-02 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-02`, `./look.sh` or a bar print. Yesterday's tag stands: VALID LOSS.
  Coach 06-02, written into the plan before this call: do not decide from the alarm alone; A2 stays at the planned size; the drawdown / breach guard is the
      real safety rule; the edge is judged after a few hundred lived trades over 2-3 years. My question of yesterday is answered. Nothing in today's trade changes.
  D1 (London days): Thu 05-28 close 1.09474 (0.88); Fri 05-29 close 1.09831 (0.71); Mon 06-01 high 1.09885 low 1.08873 close 1.09259 (0.38, range 101.2): a
      lower close after three rising ones; neither a 3-day high nor a 3-day low. After stopping me it fell to 1.08873, rose to 1.09790 and came back.
  H4 (UTC bars): Mon 12:00 bar 1.08873-1.09790; 16:00 bar 1.09043-1.09429; tonight 00:00 bar 1.09159-1.09346; 04:00 bar high 1.09440.
  H1: the night (00:00-07:00 London): open 1.09281, high 1.09440, low 1.09159, last 1.09325: range 28.1 pips (ratio 0.69), net +4.4 pips - flat.
  M15: 1.0922-1.0944, last candle down to 1.09325.
  Bias: BUY. 22:00 London closes: 06-01 1.09259 vs 05-27 1.09038 = +22 pips (3-day gap +22.1). Gap / ADR5 0.22: a small signal.
  UN3 PAPER TAG (never live): 5-day gap -51 pips -> SELL; 3-day says BUY -> DISAGREE: paper SKIPS. Forward day 31, disagree day 8 of 30. Live trade at full size.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 23.
  MB1 PAPER TAG (never live, forward day 15; kept drawdown 4.00R, early-close line 6R): morning direction written at 12:00, before 13:25.
  Levels: night high 1.09440; Mon high 1.09885; night low 1.09159; Mon low 1.08873.
  Rejection-day check: Monday made neither the 3-day high nor the 3-day low. Not a rejection day. 10-day trend: DOWN (1.09259 vs 05-18 1.13141); the buy is against it.
  SIZE RULE (the real safety rule): tracker balance $24,787.11, high-water $25,349.14, drawdown -2.22%; trigger 1 (half size) $24,588.67 not reached ->
      FULL size, 0.31 lots. It is $198.44 away. Trigger 2 (stop) $23,574.70.
  Plan: BUY 0.31 at 08:00 London, stop 40 pips below the bid, never moved, close 12:00. One trade.
  Worry: a small signal, against UN3 and the 10-day trend, after two stops, with the half-size line close. None of that is in the rule. Written, not a rule.

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 66 | 38 | +13.24 | +0.20 | 4.45R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 30 days, 7 disagree days of 30 | - | A2 on the disagree days +0.42R; on the agree days -1.86R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 22 days, 17 lively days of 60 | - | A2 on the lively days -3.04R (8 full-stop mornings), on the 5 quiet days +0.06R; PH2 about -1.46R vs A2 -3.00R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33) | 05-13 +0.64 (funded 34) | 05-14 +0.51 (funded 35) | 05-15 -1.00 (funded 36) | 05-18 -1.00 (funded 37) | 05-19 +2.17 (funded 38) | 05-20 -1.00 (funded 39) | 05-21 -1.00 (funded 40) | 05-22 -1.00 (funded 41) | 05-25 +0.69 (funded 42) | 05-26 -0.45 (funded 43) | 05-27 +0.91 (funded 44) | 05-28 +0.10 (funded 45) | 05-29 -1.00 (funded 46) | 06-01 -1.00 (funded 47).
Loss tags, all live trades: valid loss 41 (-28.20R, from the log) | my mistake 0. Process mistakes (funded): 4.

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
As of live day Mon 2015-06-01:
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 66 | 66 |
| Win rate | 64% | 58% | 58% |
| Avg R | +0.50 | +0.20 | +0.20 |
| +- 2 standard errors | 0.33 | 0.26 | 0.26 |
| Net R | +19.56 | +13.24 | +13.36 |
| Avg win / avg loss | +1.04 / -0.46 | +0.93 / -0.79 | +0.94 / -0.80 |
| Full stops | 3 (8%) | 20 (30%) | 20 (30%) |
| Max drawdown | 1.87R | 4.45R | 4.54R |
| Worst 10 trades in a row | +0.56R | -3.69R | -3.75R |
| Sells: n, avg R | 24, +0.70 | 37, +0.29 | 37, +0.29 |
| Buys: n, avg R | 15, +0.18 | 29, +0.09 | 29, +0.09 |
Live minus backtest: -0.30R per trade (noise band +-0.42R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): -0.03R. As traded vs engine on the same days: -0.11R over 66 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 66 done, avg +0.20R, max DD 4.45R. Planning edge +0.18R: live is +0.02R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 18 (+0.63R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 10 trades +0.48R; trend DOWN 9 trades -3.75R (look at 40 up-trend trades). MB1 paper from 05-13: 14 days, kept 5 trades (-3.24R, DD 4.00R); removed 8 (+7.64R); no break 1. +80 pip trades from 05-22: 0 of 15. Pre-entry hour 80+ pips: 4 of 10 (0 wins, -3.18R).
Normal worst for 56 trades (bt/streak_check.py 2015-05-19, all 95 A2 trades reshuffled): longest losing run median 4, 95th pct 6; max drawdown median 3.09R, 95th pct 5.92R. Live worst: 6 in a row (April), 4.45R (06-01, now). Now: 2 in a row, 4.45R under the high.

## 06-01 research after funded day 47: idea AL, can my alarm tell a dead edge from a live one? (journal/2015-idea-AL-alarm-power.md). Worked predictions
for every kill line pushed first; one run of 20,000 futures appended to my 66 real trades. With the edge gone from today the alarm at 100 trades still
passes 47% of the time; with the planning edge it fails 20% of the time (the drawdown line, because I stand 4.45R down). K1 passes barely, K2 and K3 fail:
it is not a judge. The run differed from my worked table only where the pre-registration said it would (the drawdown half); reason found before the
verdict. Alarm unchanged; the size rule is the protection; a question goes to the coach. Counts: 71 ideas, 198 variants. June corrections after a push: 0.
