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
