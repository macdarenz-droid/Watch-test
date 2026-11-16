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
