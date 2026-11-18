# Replay of my worst week by eye, what a better trader would have done, and ONE lesson turned into a rule. HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY RUN
Clock Tue 2015-04-14 01:00 London (end of released data).

## Which week
By the rule as traded now (A2, engine, all history) I have had exactly one losing week: 02-16..02-20 (-0.03R). I replayed its last three days on 03-1x (idea Z, bank at the wall);
the week before that in line, 01-26..01-30 (+0.10R), is in journal/2015-W05-replay.md. Replaying either again would be repeating myself.
So I take the worst week I have NOT replayed, which is also the one that hurt most on the funded account: last week, 04-06..04-10. +0.18R on paper (+0.27, -1.03, -1.00, +0.33,
+1.60), but it contained my only back-to-back full stops as a funded trader and my deepest funded drawdown (-1.00%), in a week when the market fell 470 pips in a straight line.
A week with a 470 pip trend and a trend rule that makes +0.18R is a bad week whatever the sign.

## The replay (charts/w15_h1.png for the week; charts/w15_a.png, w15_b.png = M15 per day, London hours; drawn with chart.py and bt/week_charts.py)
- Mon 04-06 BUY +0.27R. Easter Monday. Friday's jobs-report spike (1.088 -> 1.101) made the 3-day signal a buy. Dead morning, I closed +11 pips at noon; at 13:00 it ran
  to 1.1035 - and by 16:30 the whole run was gone, and at 20:00 London one M15 candle fell 40 pips. The day closed at 1.0922, on its low, 113 pips under its high.
- Tue 04-07 BUY -1.03R. The rule still said buy (close 1.0922 against 1.0762 three days earlier). The chart did not: Monday had made a new high for the move and closed
  on its low; the night was a flat shelf UNDER the evening's fall (1.0925-1.0950); at 07:00 price sat 12 pips above Monday's low. I bought the shelf at 1.0922.
  09:00-09:30 it fell 89 pips through Monday's low and through my stop.
- Wed 04-08 SELL -1.00R. First day of the sell signal. From 22:00 the night climbed 45 pips in a slow, steady drift; a 20 pip green candle printed right before my entry.
  I sold 1.0845; it ground up to 1.08873 at 11:15 - 2.3 pips through the stop - and that was the high of the day. 110 pips lower by the evening.
- Thu 04-09 SELL +0.33R. Sold 1.0777, +46 pips in 50 minutes, three flat hours, closed +13. From 13:30 it fell another 110 pips without me.
- Fri 04-10 SELL +1.60R. Night shelf broke in the hour before entry; sold 1.0646 on Thursday's low; closed on the morning's low.

## What a better trader would have done
1. TUESDAY - not bought. They read Monday's candle, not the three-day arithmetic: a new high that is completely rejected, a close on the low, a shelf under the fall.
   At the very least flat; a good one sells the break of Monday's low. My rule saw "+160 pips in three days", all of which was Friday's spike, half already given back.
2. WEDNESDAY - sold later or higher: waited for the overnight up-drift to break before selling, or sold into it nearer 1.0885. I have tested the mechanical versions of
   both (limit entries LE, wider stops S50-80, the night-must-agree filter NM, entry time +-1h): none survived. This one stays "valid loss, price of the 40 pip stop".
3. THURSDAY - held the short into the afternoon. Exit hour (three tests), runner and trailing exits are all tested and closed; over all my history noon is the best exit.
   One week does not reopen it.
So the only part of the week that is (a) a decision the chart showed BEFORE the entry and (b) not yet tested in this form is Tuesday: the day after a REJECTION DAY.

## The lesson as a definition (London trading days, 22:00 to 22:00, as my rule already uses)
"Yesterday closed against me": yesterday's close is in the third of yesterday's range that is furthest from my side (a buy after a day that closed in its bottom third;
a sell after a day that closed in its top third).
"Rejection day": the same, AND yesterday made the highest high (lowest low for a sell) of the last three days - it tried to extend the trend and was thrown back.

## Counted on all history before writing the test (occurrences only, no results looked at in this count)
70 signal days to 04-13. Yesterday closed against me: 12 days. Rejection days: 6 (01-27, 02-16, 02-20, 03-13, 03-25, 04-07).
Honest contamination note: I did not look up results for this count, but I remember several of these dates from earlier work: 01-27, 02-16, 02-20 and 04-07 were losers,
03-13 was a winner. So I already half-know that the six rejection days look bad. Six cases (five without the day that inspired the idea) are far below what my
sample-size rule accepts for anything; the test below cannot make the rejection-day version a survivor, and I write that into the kill test rather than pretend.
Also known: idea D (trade ONLY after a pullback day) did well in Jan-Feb and idea C (yesterday's midpoint) was dropped - both say that "yesterday went against the
signal" is, on average, not a bad sign for this rule. That is the opposite of today's lesson.

## Hypothesis
When yesterday closed in the far third of its range against the 3-day signal, the signal is stale: the A2 trade the next morning has clearly lower expectancy than on
other days, in every part of my history. Skipping those days raises avg R per signal day.

## Variants (96, 97, 98; ideas -> 37), no others afterwards. Everything else exactly A2.
- RV1: no trade when yesterday closed against me (far third).
- RV2: no trade only after a rejection day (far third AND yesterday made the 3-day extreme on my side).
- RV3: on RV1 days, trade the OTHER side (what the better trader did on Tuesday).

## KILL TEST (explicit). The day that inspired the idea (04-07) is REMOVED from every number. The build can only kill; a survivor gets a forward paper tag
(a filter: no adoption question before 200 forward trades).
A variant survives only if ALL:
  K1. on all history its avg R per A2 signal day (a skipped day counts 0R) is at least A2's + 0.05R;
  K2. the days it changes are WORSE under A2 than the days it leaves alone, by at least 0.3R on average;
  K3. consistency: that is true in at least 2 of the 3 periods (January, February, March-to-now), and in no period are the changed days better than the others by more than 0.3R;
  K4. it changes at least 10 days and leaves at least 60% of the days alone.
RV2 changes 5 days after the removal: it FAILS K4 before it is run. I run it only to see whether "made the extreme" adds anything to RV1, and whatever it shows is an
observation for the parked list, not a result.
My guess: RV1 fails K2 or K3 (the pullback-day history says these days are not bad on average); RV3 fails K1; RV2's five days look bad and prove nothing.

## RESULTS (run once after the lines above were pushed: `python bt/ab_period.py RV1,RV2,RV3 2015-04-14 2015-04-07`; all history 01-06..04-13 WITHOUT 04-07, costs on)
A skipped day counts 0R. "Gap" = A2's avg R on the days left alone minus A2's avg R on the days the variant changes (positive = the changed days are the bad ones).

| | days changed | avg R / signal day | net R | max DD | gap all | gap Jan | gap Feb | gap Mar-now |
|---|---|---|---|---|---|---|---|---|
| A2 (69 days) | - | +0.505 | +34.85 | 1.87 | - | - | - | - |
| RV1 skip after "closed against me" | 11 (84% left) | +0.410 | +28.29 | 1.51 | -0.11 | +0.59 | -0.39 | -0.57 |
| RV2 skip after a rejection day | 5 (93% left) | +0.510 | +35.21 | 1.51 | +0.62 | +1.89 (1 day) | +1.01 (2 days) | -0.52 (2 days) |
| RV3 trade the other side on RV1 days | 11 (84% left) | +0.326 | +22.51 | 2.79 | -0.11 | +0.59 | -0.39 | -0.57 |

A2 on the 11 "closed against me" days: 01-12 +1.35, 01-27 -1.00, 01-29 +0.53, 02-05 +1.09, 02-16 -0.32, 02-17 +2.16, 02-20 -1.03, 02-25 +0.74, 03-13 +1.09, 03-20 +1.07, 03-25 +0.91
= +6.59R, +0.60R each - BETTER than the other 58 days (+0.49R each). The five rejection days: -1.00, -0.32, -1.03, +1.09, +0.91 = -0.35R.

## Kill lines applied
- K1 (avg >= A2 + 0.05R): RV1 -0.095, RV2 +0.005, RV3 -0.179 -> all FAIL.
- K2 (changed days worse by >= 0.3R): RV1 -0.11 (they are better), RV3 same -> FAIL. RV2 +0.62 passes on five days.
- K3 (true in >= 2 of 3 periods; never better by > 0.3R): RV1 and RV3 true only in January, and the changed days are better by 0.39R (Feb) and 0.57R (Mar-now) -> FAIL.
  RV2 true in Jan and Feb (3 days together), better by 0.52R in Mar-now -> FAIL.
- K4 (>= 10 days, >= 60% left alone): RV1, RV3 pass; RV2 FAILS (5 days), as written before the run.
VERDICT: NO SURVIVOR. Idea closed, no forward tag. A2 unchanged. All three guesses were right.

## What I learned
- "Yesterday closed against the signal" is not a warning for this rule. Those mornings made +0.60R per trade - above my average - and include two of my best days
  (02-17 +2.16, 01-12 +1.35). It is the pullback-day finding (idea D) again, now on 69 days instead of 39: the rule buys dips inside a trend, and that is where it earns.
  Tuesday 04-07 looked obviously wrong on the chart BECAUSE I knew the ending. On 11 mornings that looked the same way, skipping would have cost me 6.6R.
- The narrower "rejection day" (new extreme, then closed on the wrong end): 3 losers in January-February, 2 winners in March, 6th case Tuesday. Six cases in three and
  a half months, split 4-2. It cannot be tested on my history and will not be testable for a long time (about 20 cases a year). Parked as an observation, NOT a rule:
  "after a rejection day the trade has been -0.46R on average in 6 cases". I will note it in the call when it happens, and trade the rule anyway.
- What the better trader really had on Tuesday was not a filter but a reading of ONE chart, and I cannot count how often that reading is right. Every time I have turned
  such a reading into a rule (H no-chase, G first break, NM night, GAP, RN round numbers, FL flip days, FH first hour, now RV) the count over all days said the losers I
  was looking at had more winning twins than losing ones. Eight for eight. That is the lesson of the replay: the rule's losses are not avoidable by anything visible at 07:00
  that I have been able to define.
- The other two lessons of the week (Wednesday: stopped by 2 pips; Thursday: the move came after noon) were already tested in every mechanical form I can think of.
Counts: ideas 37, variants 98.
