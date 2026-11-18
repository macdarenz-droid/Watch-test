# My 10 worst losing trades so far, replayed on the chart by eye (coach 05-27)
Coach: "pull your 10 worst losing trades so far, replay each on the chart by eye and write what a better trader would have done (valid loss or mistake).
only change a rule if the same mistake shows up repeatedly."
Sim clock Thu 2015-05-28 01:00 London. Trade log: sim/trades.csv, 97 trades, 39 losers, 21 full stops.
## Selection rule (written before any chart was drawn)
"Worst" = most money lost, from the trade log. That gives: 03-19 (-$193.64), 03-09 (-$188.47), 04-23 (-$130.82), 04-24 (-$128.34), 05-04 (-$128.34),
02-20 (-$128.03), 04-20 (-$127.72), 05-15 (-$127.72), and then four trades tied at -$127.10 for the last two places (04-07, 04-16, 05-11, 05-18).
Tie rule, decided now: the two EARLIEST (04-07, 04-16), because 05-11 and 05-18 were on my charts in the reviews of 05-12 and 05-19 and I want fresh eyes.
Honest limit: every one of the 10 is a full stop of about -1.00R, because one trade a day at fixed risk cannot lose more. "Worst by money" therefore
means "the stops, earliest and biggest-size first". The two March trades are bigger only because the challenge account ran 0.47 lots.
The list: 02-20, 03-09, 03-19, 04-07, 04-16, 04-20, 04-23, 04-24, 05-04, 05-15.
What I will ask of each chart, in this order: (1) at 08:00, with only what was on the screen then, was the entry the rule? (2) was anything on the
screen that a better trader would have used and my rule ignores? (3) after the entry, did I do anything other than the plan? (4) what happened after
the stop? (5) tag: valid loss, or mistake (mine or the rule's)?

## The charts and the facts
Charts: `python bt/week_charts.py charts/worst10_a.png 2015-02-20 2015-03-09 2015-03-19 2015-04-07 2015-04-16` and `..._b.png 2015-04-20 2015-04-23
2015-04-24 2015-05-04 2015-05-15` (M15, previous day 12:00 to trade day 20:00 London, engine A2 trade drawn). Facts per day from bt/wl_table.py and a
python print (engine figures; the engine's stop minute can differ a little from my live fill, e.g. 04-23).
Note on the two columns "valid?" and "better trader": the first asks whether I followed my rule; the second is hindsight-free - only what was on the
screen at 08:00.

| # | day | what the chart shows (by eye) | facts at 08:00 (tool) | after the stop | did I follow the plan? | what a better trader would have done | tag |
|---|---|---|---|---|---|---|---|
| 1 | Fri 02-20 buy | flat night sliding lower; entry sits ON yesterday's low; it never lifts, grinds down for six hours, then rallies 130 pips after 15:00 | signal 7 days old, 0 rising closes; pre-hour 23 pips; best +3 | noon -36; later +73 | yes | probably the same trade; maybe passed because price sat under all of yesterday with no rising close behind the signal | valid loss |
| 2 | Mon 03-09 sell | rising night; the 08:00 candle jumps 40 pips; price runs to yesterday's high, pokes my stop by a wick at 10:10, falls 50 pips | signal 11 days old, 7 falling closes; pre-hour 14; best +2 | noon +3 | yes | the same trade and the same stop (it was just beyond yesterday's high); a poke | valid loss |
| 3 | Thu 03-19 buy | the morning after a 400 pip evening spike; price has been falling for ten hours; pre-hour drops 76 pips; I buy into it | flip day; pre-hour range 115 pips, 76 against me; night -139; best -1; stopped in 15 minutes | noon -12; later -98 | yes (my call that day said "expect a wild market; plan unchanged") | STOOD ASIDE: an hour of 115 pips makes a 40 pip stop smaller than the noise | valid by my rule; the rule was blind here |
| 4 | Tue 04-07 buy | 60 pip drop the evening before, flat night at the bottom of yesterday's range; +18 then an 89 pip fall in the second hour | signal 3 days old, 0 rising closes; pre-hour 31, 21 against me | noon -64; never came back | yes | the same trade; nothing on the screen warned of the second-hour fall | valid loss |
| 5 | Thu 04-16 buy | slow slide into the entry, dips, stop taken by 1.4 pips at the low of the day, then +105 pips by noon | flip day; pre-hour 40; best +18 | noon +46; later +151 | yes | the same trade; the purest poke I have | valid loss |
| 6 | Mon 04-20 buy | bought a small pop at the top of the pre-hour; falls at once and keeps falling | pre-hour 31, 13 with me; best +3 | noon -68 | yes | the same trade | valid loss |
| 7 | Thu 04-23 sell | sold the low of the night, below yesterday's low; V-turn within 30 minutes; rallies 160 pips all day | pre-hour 33, 22 with me; entry beyond yesterday's low; best +20 | noon -54; later -159 | yes | waited: selling a new low after an hour that already ran my way is paying the worst price of the morning | valid loss (a chase the rule allows) |
| 8 | Fri 04-24 buy | an 83 pip breakout candle in the pre-hour; I buy its top, above yesterday's high; +25, then it fades back through the whole candle | flip day; pre-hour range 83, 61 with me; best +25 | noon -59 | yes | STOOD ASIDE or waited: same reason as #3, mirrored - the hour before entry was twice my stop | valid by my rule; the rule was blind here |
| 9 | Mon 05-04 buy | pre-hour spikes up 30 pips and fully reverses; five red candles in a row into and through my entry | signal 7 days old, 0 rising closes; pre-hour 44, 19 against me; best +2 | noon -51 | yes | passed, or waited for the fall to stop: buying the fifth red candle | valid loss |
| 10 | Fri 05-15 buy | pre-hour V: dips, rallies 44 pips; I buy its top; falls 60 pips; the day then rallies 143 pips in the afternoon | pre-hour 44, 31 with me; best +5 | noon -57; later +51 | yes | the same trade, or waited; the day's direction was right and the morning was not | valid loss |

## Count of what I saw (the ten), then the SAME things counted on all 102 A2 days (winners beside losers - my method rule)
| situation at 08:00 | in the ten worst | all history: n, wins, avg R, full stops |
|---|---|---|
| my own execution mistake (late entry, moved stop, second trade, size) | 0 of 10 | - |
| poke: stop passed by a few pips, price then back or my way | 2 (03-09, 04-16) | not a 08:00 fact; SA: wider stops cost 9.6R to 21.5R |
| pre-hour ran 20+ pips WITH me (I buy the top / sell the bottom) | 3 (04-23, 04-24, 05-15) | 16, 8 wins, +0.041R, 5 stops |
| entry beyond yesterday's extreme, my way | 2 (04-23, 04-24) | 10, 4 wins, -0.143R, 4 stops |
| pre-hour ran 20+ pips AGAINST me (falling knife) | 2 (03-19, 04-07) | 17, 9 wins, +0.216R, 3 stops |
| entry at the far end of yesterday's range with no close behind the signal | 3 (02-20, 04-07, 05-04) | 10, 5 wins, +0.069R, 3 stops |
| flip day | 3 (03-19, 04-16, 04-24) | 23, 15 wins, +0.292R, 6 stops |
| PRE-HOUR RANGE 60 PIPS OR MORE | 2 (03-19: 115, 04-24: 83) | 4, 0 wins, -3.18R, 3 stops (03-12 -0.12R, 03-19, 03-27, 04-24) |
All A2 days for scale: 102 trades, +0.342R, 21 full stops. By pre-hour range: under 30 pips 56 trades +0.550R (6 stops); 30-45 pips 26 trades +0.017R
(10 stops); 45-60 pips 16 trades +0.424R (2 stops); 60 or more 4 trades, none won.

## What the replay says
1. MISTAKES OF MINE: none. All ten were the rule, entered on time, stop untouched, one trade. The tags I gave on the day stand: ten valid losses.
2. WHAT A BETTER TRADER WOULD HAVE DONE: on six of the ten, the same trade. On two (04-23, 05-04) he might have waited, but the groups those belong to
   ("chase", "falling knife") are not losing groups on all history - the knife group is even above +0.2R. My eye says "obviously wrong" on the chart;
   the count says the same picture won as often as not. That is hindsight wearing a better trader's coat.
3. THE ONE THING THAT REPEATS AND HAS NO WINNER BESIDE IT: an hour before entry that is bigger than my stop by half or more (60+ pips). Two of my ten worst;
   four cases in 102 days; four losses, -3.18R. Both chart replays said the same sentence: the 40 pip stop is inside the noise of that morning.
   - It is not the "lively hour" of PH2 (30+ pips): the 45-60 pip mornings are fine (+0.42R in 16). It is only the extreme.
   - Four cases. All four are lived days, which is the coach's bar - and four is still four. It is also the 67th time I have looked for something.
4. RULE CHANGE? NO. The coach's test is "the same mistake shows up repeatedly". It shows up twice in ten and four times in a hundred. That earns a
   line in the notebook, not a line in the rule. What I do instead, written now:
   - COUNTS-ONLY line from today: every live day with a pre-entry hour of 60 pips or more, with A2's result. History: 4 cases, 0 wins, -3.18R. Look at
     10 cases. If at 10 cases the group is still without a winner or below -0.5R a trade, I bring the coach a proposal ("no trade after a 60+ pip hour")
     with the lived record. Until then A2 trades those mornings at full size, as it did on the four.
   - PH2 on paper already halves them (they are a subset of its lively days), so the paper record will show the half-size version for free.
5. Pokes: 2 of 10, and the two that hurt most to look at (04-16: +151 pips after stopping me by 1.4). Nothing to do: SA priced that cure last week.
6. What I notice about myself: on the charts I wanted to call #7, #8, #9 and #10 mistakes. With the base rates beside them only #3 and #8 keep anything,
   and those two are the same single observation. The replay's real use was to show me again how much my eye over-reads a losing chart.
Counts: this review is counted as idea 67 with no rule variant run; 8 descriptive splits looked at (listed above), none adopted. Variants stay 186.
