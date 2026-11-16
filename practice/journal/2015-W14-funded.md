# Journal - FUNDED ACCOUNT, week of 2015-03-30 (W14). Plan: journal/FUNDED-PLAN.md. Tracker: journal/FUNDED-TRACKER.md. Size 0.50% = $125 = 0.31 lots.

## CLOCK DECISION, written Mon 03-30 at 07:00 UTC, BEFORE trading (my coach should check this)
The sim clock this morning reads "Mon 08:00 London | 07:00 UTC". London moved to summer time on Sunday; until now London time and UTC were the same, so I never had to say which
one my rule is written in. Every line of my plan says "08:00 UTC ... 12:00 UTC", but the rule was built, named and tested as a LONDON rule: "after the first London hour",
"out at London noon, before New York". From January to 03-27, 08:00 UTC WAS 08:00 London.
I have to choose one reading before the first trade where they differ, and I cannot test my way out of it (no summer-time history exists for me, and peeking is not allowed):
- Reading A (keep UTC): enter 08:00 UTC = 09:00 London, exit 12:00 UTC = 13:00 London. That would be a different moment of the trading day than anything I have traded or tested.
- Reading B (keep London time): enter 08:00 London = 07:00 UTC, exit 12:00 London = 11:00 UTC. The same moment of the day as all 54 live trades and every backtest.
  It also puts New York back where it was in Jan-Feb relative to my exit (US clocks changed on 03-08; with London changing too, noon London is 07:00 New York again).
DECISION: Reading B. The rule is in LONDON time and always was: call at 07:00 London, market order 08:00 London, close 12:00 London, daily closes for the trend rule taken at
22:00 London (= New York 17:00, the FX day's close). In UTC, while summer time lasts: call 06:00, entry 07:00, exit 11:00, closes at 21:00.
This is not a new variant and I am not counting it as one: it keeps the traded moment fixed while the UTC label moves. If my coach reads the rule the other way, I will follow that from the next day.
What it costs today: I advanced the clock to 07:00 UTC as usual before noticing, so today's call is written AT the entry time (08:00 London) instead of an hour before. The order is
still placed by the rule with no discretion, exactly as on every other day; I have simply seen one more hour of candles than usual when writing the notes. Recorded as a process slip.
For the record, the trend direction today is the same under either reading.

## Funded trades
| F# | Sim time in (UTC) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| F2 | Mon 03-30 07:00 (08:00 London) | sell | 0.31 | 1.08659 | 1.09064 | 1.08320 (11:00 UTC = 12:00 London) | +0.84 | +$105.09 | VALID (win) | first summer-time day, London-time reading; F1 trade, Q3 SKIP, Q1 trade; N1 no trade |

## Daily calls
- Mon 03-30 08:00 London (07:00 UTC) @1.0866. Fri: stopped me at 11:23, ran to 1.0949, closed 1.0887. Sunday opened flat; Asia 29 pips, slid to 1.0855 at midnight and has
  hovered 1.0859-1.0884 since.
  TREND RULE: SELL. Fri close 1.0887 < Tue 03-24 close 1.0919, by 31 pips - one of my "coin flips".
  Read: four days of 1.0800-1.1050 chop; price mid-range. No opinion worth writing.
  Levels: 1.0884 Asia high, 1.0855 Asia low, 1.0801 Fri low (65 pips below), 1.0949 Fri high. Week's open 1.0886 (price below it).
  Wall note: nothing that has held for days sits inside the stop distance in front of this sell (Fri low is one session old and 65 pips away).
  Paper tags (kept in UTC as defined, noted): F1 efficiency 0.23 (crooked) -> no-chase applies; price 0.56 down Friday's range -> F1 trades. Q3: Asia 29.3 vs 41.3 (0.71) -> SKIP. Q1: trade.
  N1 Friday: -1.00R (5 trades, -3.34R). Friday n/a.
  Funded check before the order: balance $24,877.55, high-water $25,000, drawdown -0.49% (brakes at -3% / -5%): full size allowed.
  Plan: SELL at 08:00 London (07:00 UTC, now), SL 40, out 12:00 London (11:00 UTC), 0.31 lots ($125 = 0.50%). Worst case -$129.
  -> Mon result, TAG FIRST: VALID (not a mistake). Checked: entry at 08:00 London (07:00 UTC) as decided and written before the trade, 0.31 lots, stop 40 pips (40.5 from the fill),
     SELL per the trend rule (31 pip gap), one trade, closed at 12:00 London (11:00 UTC), stop never moved.
     Result: sold 1.08659, closed @1.08320, +$105.09 = +0.84R. Funded balance $24,982.64 (-0.07%).
     What happened: London sold from its first minute - 1.0866 -> 1.0820 in the first hour - bounced back to 1.0870 (4 pips under water), and drifted down to 1.0831 by London noon.
     Honesty about the clock decision: under the other reading (enter 08:00 UTC = 09:00 London, exit 12:00 UTC) the same day would have been a sell at 1.0831 closed at about
     1.0837, a small loss. So the decision was worth roughly +1R today. That is ONE day and proves nothing about which reading is right; it only shows the choice is not cosmetic.
     Paper tags: F1 traded (+0.84R); Q3 SKIPPED (a winner); Q1 traded. N1 (now also on London time: fade at 13:00 London of the move since 08:00 London): move -29 pips, one pip
     short -> no trade. Friday n/a.
     END OF RELEASED DATA (clock Tue 03-31 00:00 UTC).

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 21 | 15 | +10.96 | +0.52 | 1.50R | kill test: 40 trades, avg >= +0.10R, DD <= 8R (21 of 40 done) |
| F1 paper tag | 18 (3 skips) | 14 | +12.42 | +0.69 | 1.01R | gate 2 needs 40 signal days (21 done) |
| Q3 dead-Asia tag (drawdown goal) | 11 (10 skips: 7 winners, 1 scratch, 2 losers) | 7 | +4.00 | +0.36 | 1.01R | 36% of A2's net (needs 85%) |
| Q1 dead-Asia tag (drawdown goal) | 20 (skip 03-06) | 14 | +8.84 | +0.44 | 1.50R | 81% of net, same DD |
| Friday tag (idea W) | 4 Fridays | 3 | +3.26 | - | - | 4 of 8 unseen Fridays: 3 winners, 1 loser |
| N1 paper tag (NY fade; from 03-13) | 5 (12 days) | 1 | -3.34 | -0.67 | 3.34R | judge at 20 trades AND 8 A2-losing days. A2-losing days so far: 3; N1 on them: -2.02R |
Days: ... 03-23 +2.52 | 03-24 +0.71 | 03-25 +0.89 | 03-26 -0.50 | 03-27 -1.00 (funded 1) | 03-30 +0.84 (funded 2).
Loss tags, all live trades: valid setup, market disagreed 19 (-10.66R) | my mistake 0.

## Coach ruling, Tue 2015-03-31
- "Use London time consistently from now on, and always write the call before the entry bar opens." The London-time reading stands; it is now the rule, not my interpretation.
- Monday's slip is logged as PROCESS MISTAKE P1 in the funded tracker (not a trade mistake: the trade itself is tagged valid). I own it: the clocks changing was knowable on Sunday
  from the sim's own time line, and I did not look.
- Guard built today: trade_a.py --london takes London times and converts them, so the entry can no longer drift with the UTC label; and my own rule is that with no written call
  before 08:00 London there is no trade that day.

## Daily calls (Tue) - written at 07:00 London, before the entry bar
- Tue 03-31 07:00 London @1.0783. Mon: fell from 1.0886 to 1.0810, closed 1.0833. Asia has dropped another 68 pips (1.0845 -> 1.0778), through Monday's low AND Friday's low (1.0801),
  and sits on its low. Asia range 67.7 pips against a 38 pip average: a lively night, and it moved WITH the signal.
  TREND RULE: SELL. Mon close 1.0833 < Wed 03-25 close 1.0971, by 139 pips.
  Read: lower highs since 1.1052 (03-26); two floors gave way overnight. The obvious worry is the one I always have - 55 pips under yesterday's close before London opens.
  Levels: 1.0845 Asia high, 1.0810 / 1.0801 broken floors (now ceilings), 1.0778 Asia low, 1.0767 last Monday's low, 1.0700. Week's open 1.0886.
  WALL NOTE (a real case for the file): 1.0767, the low of Mon 03-23, has stood for six trading days and is about 16 pips below a 1.0783 entry - INSIDE my stop distance,
  in front of the trade. Idea Z would have put a target 2 pips in front of it. I trade the frozen rule (no target) and record what happens at that level.
  Paper tags: F1 efficiency 0.46 (crooked) -> no-chase applies; price is below yesterday's whole range -> F1 would SKIP. Q3: Asia 67.7 vs 38.2 (1.77) -> trade. Q1: trade.
  N1 yesterday: no trade. Friday n/a. Month-end day (odd flows possible; no rule about it).
  Funded check: balance $24,982.64, high-water $25,000, drawdown -0.07% -> full size allowed.
  Plan: SELL 08:00 London, SL 40, out 12:00 London, 0.31 lots ($125 = 0.50%). Worst case -$129.
