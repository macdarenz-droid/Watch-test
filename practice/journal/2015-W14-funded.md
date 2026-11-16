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
| F3 | Tue 03-31 08:00 London | sell | 0.31 | 1.07858 | 1.08259 | 1.07401 (12:00 London) | +1.14 | +$141.67 | VALID (win) | call written before the entry bar; wall case logged; F1 SKIP, Q3 trade, Q1 trade |
| F4 | Wed 04-01 08:00 London | sell | 0.31 | 1.07618 | 1.08021 | 1.07581 (12:00 London) | +0.09 | +$11.47 | VALID (scratch win) | was +43 pips at 09:55 London, gave it back; F1, FR1, Q3, Q1 traded; N1 no trade |
| F5 | Thu 04-02 08:00 London | sell | 0.31 | 1.08092 | 1.08492 | 1.08191 (12:00 London) | -0.25 | -$30.69 | valid setup, market disagreed | sold after the 07-08 hour broke 1.0800; 35 pips against at worst; F1, FR1, Q3, Q1 traded; N1 no trade |

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
  -> Tue result, TAG FIRST: VALID (not a mistake). Checked: call written and committed at 07:00 London, before the entry bar; entry 08:00 London, 0.31 lots, stop 40 pips
     (40.1 from the fill), SELL per the trend rule (139 pip gap), one trade, closed at 12:00 London, stop never moved. Process: clean (first day on the --london helper; it converted correctly).
     Result: sold 1.07858, closed @1.07401, +$141.67 = +1.14R. Funded balance $25,124.31 (+0.50%) - a new high-water mark.
     What happened: London sold from the first minute: 1.0786 -> 1.0745 in the first hour, 1.0713 by 10:30 London, small bounce into noon. Never more than a pip against me.
     The wall case: 1.0767 (six days old, 16 pips in front of my entry) did not hold for a minute - price went straight through it to 1.0713. Idea Z's target would have banked
     about +0.4R instead of +1.14R. One case against "bank at the wall", filed.
     Paper tags: F1 SKIPPED (price below yesterday's whole range in a crooked week) and misses +1.14R; Q3 and Q1 traded. N1 (London time): morning -49 pips -> bought the fade at
     13:00 London, closed 17:00 London: see tally. Friday n/a.
     END OF RELEASED DATA (clock Wed 04-01 01:00 London). Feed check, as asked: the feed folder holds January, February and March only; the sim stopped at the end of 03-31.
     I can see in the git log that an April release was pushed and reverted; I have not opened it and nothing past 31 March is in my feed.

## MARCH 2015 - funded month summary (the account started on Fri 03-27: 3 trading days)
3 trades, 2 wins, +0.98R, +$124.31 (+0.50%). Worst day -0.49%. Deepest drawdown -0.49% (day 1). Trade tags: 3 valid, 0 my mistake. Process mistakes: 1 (P1, DST slip). Payouts: none due (first date 04-10).

## Wed 04-01, before the day is released: test of the day
F1 robustness (journal/2015-idea-FR-robustness.md): my most promising paper idea is NOT robust to its two numbers - one step stricter and its March lead of +0.33R becomes -3.10R.
It stays a paper tag with a tougher gate; the funded rule is untouched. FR1 is tracked beside F1 from now on.

## FIRST FUNDED MONTH-END CHECK - written Wed 04-01, 07:00 London, before today's entry
March 2015 in the funded account (started Fri 03-27; three trading days: 03-27, 03-30, 03-31):
| Item | March (funded) |
|---|---|
| Trades | 3 (2 wins, 1 loss) |
| Net R | +0.98R (-1.00, +0.84, +1.14) |
| P&L | +$124.31 (+0.50% of $25,000) |
| Balance, month end | $25,124.31 = high-water mark |
| Worst day | -$122.45 (-0.49%), Fri 03-27 |
| Deepest drawdown from high-water | -0.49% (after day 1; recovered on day 3). Brake levels -3% / -5% never near; account line $22,500 |
| TRADE tags | 3 valid setups (2 wins; 1 loss tagged "valid setup, market disagreed"); 0 "my mistake" |
| PROCESS mistakes | 1 (P1, Mon 03-30: DST slip - call written at the entry time instead of before the bar) |
| Payouts | none due (first payout date 04-10) |
| Rule-level check | A2 forward test 22 of 40 trades, +12.10R, max drawdown 1.50R (limit 8R) |
Honest reading: three days is not a month. The account is where it should be after three trades of a rule that wins two in three: slightly up, never in trouble.
The one thing I did wrong in March was not a trade; it was not looking at the clock. Fixed in the process, logged in the tracker.
Also recorded here because my coach asked: yesterday's test killed my own best filter (F1 is NOT robust to its two numbers; full write-up journal/2015-idea-FR-robustness.md).
It stays a paper tag with a tougher gate; nothing from it touches this account.

## Daily calls (Wed) - written at 07:00 London, before the entry bar
- Wed 04-01 07:00 London @1.0780. Tue: sold off to 1.0713, closed 1.0731 on the lows. Asia has bounced 53 pips (1.0740 -> 1.0792) and is holding near its high.
  TREND RULE: SELL. Tue close 1.0731 < Thu 03-26 close 1.0875, by 144 pips.
  Read: five lower closes in six days; this morning is the first real bounce of the leg, back up toward the floors that broke yesterday (1.0801 / 1.0810, 20-30 pips above).
  A night against the signal - which my test on Monday showed was six winners of six in January when I tried to filter it. So no worry attached; just noted.
  Levels: 1.0792 Asia high, 1.0801 / 1.0810 old floors, 1.0845 Tue high; below 1.0740 Asia low, 1.0713 Tue low. Week's open 1.0886.
  Wall note: nothing that has held for days sits inside the stop distance in front of this sell (Tue low is one day old).
  Paper tags: F1 efficiency 0.59 (straight) -> trades; FR1 the same. Q3: Asia 61.4 vs 42.1 (1.46) -> trade. Q1: trade. N1 yesterday: +0.07R (6 trades, -3.27R). Friday n/a.
  Funded check: balance $25,124.31 = high-water, drawdown 0% -> full size allowed.
  Plan: SELL 08:00 London, SL 40, out 12:00 London, 0.31 lots ($125 = 0.50%). Worst case -$129.
  -> Wed result, TAG FIRST: VALID (not a mistake). Checked: call and month-end check written and committed at 07:00 London, before the entry bar; entry 08:00 London,
     0.31 lots, stop 40 pips (40.3 from the fill), SELL per the trend rule (144 pip gap), one trade, closed at 12:00 London, stop never moved. Process: clean.
     Result: sold 1.07618, closed @1.07581, +$11.47 = +0.09R. Funded balance $25,135.78 (+0.54%), a new high-water mark by eleven dollars.
     What happened: the 07-08 hour had already dropped 18 pips; London took it to 1.0718 by 09:55 (+43 pips for me, a full R on the table), then one hour gave back 55 pips
     (1.0774) and noon came 4 pips in profit. The afternoon whipped 1.0727-1.0800 around the 12:30-14:00 US data.
     Feeling: a full R evaporated in an hour and I closed for eleven dollars. That stings a little, and it is exactly the feeling that sells trailing stops to beginners.
     I have tested break-even, targets and a runner; I have never tested a trailing stop. So that is today's test - built on January, not on this morning.
     Paper tags: F1 and FR1 traded (straight week): +0.09R each. Q3 and Q1 traded. N1: move -14 pips at 13:00 London -> no trade. Friday n/a.
     END OF RELEASED DATA (clock Thu 04-02 01:00 London).

## Thu 04-02, before the day: yesterday's test, for the record in this journal
Trailing stop (journal/2015-idea-TR-trailing-stop.md): trail 20 once +20 / 30 once +30 / 20 once +40, built on January. All three WORSE than the fixed stop and noon exit
(+0.46 / +0.67 / +0.61R against +0.78R), drawdown unchanged at 1.34R. No survivor; March not run. The exit stays: 40 pips, out at 12:00 London.
Lesson kept: banking half of the best point is the price of staying in for the big days; a trail protects open profit, not the account.

## Daily calls (Thu) - written at 07:00 London, before the entry bar
- Thu 04-02 07:00 London @1.0783. Wed: 1.0718-1.0800 chop around US data, closed 1.0762. Asia 41 pips, dipped to 1.0750 at midnight and has climbed 40 pips, last hour +10.
  TREND RULE: SELL. Wed close 1.0762 < Fri 03-27 close 1.0887, by 125 pips.
  Read: lower highs all week (1.0895, 1.0845, 1.0800); price is pressing into yesterday's high from below. Long Easter weekend ahead and tomorrow is the first Friday (US jobs),
  so today may be people squaring up. No rule about that.
  Levels: 1.0791 Asia high, 1.0800 Wed high, 1.0810 / 1.0845 above; 1.0750 Asia low, 1.0718 Wed low, 1.0713 Tue low. Week's open 1.0886.
  Wall note: nothing that has held for days sits inside the stop distance in front of this sell.
  Paper tags: F1 efficiency 0.70 (straight) -> trades; FR1 the same. Q3: Asia 41.0 vs 47.7 (0.86) -> trade. Q1: trade. N1 yesterday: no trade. Friday n/a.
  Funded check: balance $25,135.78 = high-water, drawdown 0% -> full size allowed.
  Plan: SELL 08:00 London, SL 40, out 12:00 London, 0.31 lots ($125 = 0.50%). Worst case -$129.
  -> Thu result, TAG FIRST: VALID SETUP, MARKET DISAGREED (a loss; not a mistake). Checked: call written and committed at 07:00 London, before the entry bar; entry 08:00 London,
     0.31 lots, stop 40 pips (40.0 from the fill), SELL per the trend rule (125 pip gap), one trade, closed at 12:00 London, stop never moved. Process: clean.
     Result: sold 1.08092, closed @1.08191, -$30.69 = -0.25R. Funded balance $25,105.09 (+0.42%), drawdown -0.12% from the $25,135.78 high-water.
     What happened: the hour before my entry jumped 26 pips through 1.0800 (so I sold at 1.0809, above yesterday's high); London pushed on to 1.0844 in the first half hour -
     35 pips against, 5 from the stop - then sat 1.0808-1.0839 until noon. After my exit the US hours took it to 1.0905. A short squeeze before the long weekend; I was on the wrong side of it
     and the noon clock got me out 10 pips under water instead of 100.
     Paper tags: F1 and FR1 traded (-0.25R each); Q3 and Q1 traded. N1: move +20 pips at 13:00 London, under 30 -> no trade. Friday n/a.
     END OF RELEASED DATA (clock Fri 04-03 01:00 London). Tomorrow: unseen Friday 5 of 8 - Good Friday, and the first Friday of the month.

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 24 | 17 | +11.94 | +0.50 | 1.50R | kill test: 40 trades, avg >= +0.10R, DD <= 8R (24 of 40 done) |
| F1 paper tag | 20 (4 skips) | 15 | +12.26 | +0.61 | 1.01R | gate 2 at 40 signal days (24 done); NOT robust: needs FR1 within 1R of A2 at day 40 |
| FR1 (tracked only to judge F1) | 18 (6 skips) | 13 | +8.95 | +0.50 | 1.03R | 3.1R behind A2 |
| Q3 dead-Asia tag (drawdown goal) | 14 (10 skips) | 9 | +4.98 | +0.36 | 1.01R | 42% of A2's net (needs 85%) |
| Q1 dead-Asia tag (drawdown goal) | 23 (skip 03-06) | 16 | +9.82 | +0.43 | 1.50R | 82% of net, same DD |
| Friday tag (idea W) | 4 Fridays | 3 | +3.26 | - | - | 4 of 8 unseen Fridays: 3 winners, 1 loser |
| N1 paper tag (NY fade; London time from 03-30) | 6 (16 days) | 2 | -3.27 | -0.55 | 3.34R | judge at 20 trades AND 8 A2-losing days. A2-losing days so far: 4; N1 on them: -2.02R |
Days: ... 03-30 +0.84 (funded 2) | 03-31 +1.14 (funded 3) | 04-01 +0.09 (funded 4) | 04-02 -0.25 (funded 5).
Loss tags, all live trades: valid setup, market disagreed 20 (-10.91R) | my mistake 0. Process mistakes (funded): 1.

## Daily calls (Fri) - written at 07:00 London, before the entry bar
- Fri 04-03 07:00 London @1.0881. Thu: squeezed up 150 pips after my exit (1.0750 -> 1.0905), closed 1.0880. Asia 19 pips - dead flat, drifting up 15. Good Friday: much of
  Europe is closed, and it is the first Friday of the month (US jobs report 13:30 London). I expect a thin, waiting morning.
  TREND RULE FLIPS TO BUY: Thu close 1.0880 > Mon 03-30 close 1.0833, by 47 pips.
  Read: yesterday's rally broke the week's run of lower highs. Price sits in the top fifth of yesterday's range, 22 pips under its high.
  A holiday morning before big news is exactly when I would like to skip. The plan says no skips, and my tests of "dead Asia" (Q) and "Fridays" (W) do not support one:
  three of four unseen Fridays were winners. Risk is one stop; I am flat 90 minutes before the data.
  Levels: 1.0883 Asia high, 1.0905 Thu high, 1.0949 the 03-27 high; 1.0864 Asia low, 1.0800 below. Week's open 1.0886.
  Wall note: 1.0949 (five days old, standing) is 60+ pips above - outside reach. Thursday's high is one day old.
  Paper tags: F1 efficiency 0.02 (crooked) -> no-chase applies; price 0.84 up yesterday's range -> F1 SKIPS; FR1 SKIPS. Q3: Asia 18.9 vs 47.7 (0.40) -> SKIP. Q1: SKIP (under 20 pips).
  All four filters would sit this one out. FRIDAY TAG: unseen Friday 5 of 8. N1 yesterday: no trade.
  Funded check: balance $25,105.09, high-water $25,135.78, drawdown -0.12% -> full size allowed.
  Plan: BUY 08:00 London, SL 40, out 12:00 London, 0.31 lots ($125 = 0.50%). Worst case -$129. Flat for the long weekend.
