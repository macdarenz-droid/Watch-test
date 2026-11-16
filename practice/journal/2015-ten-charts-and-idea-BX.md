# Ten charts of my setup, looked at one by one, BEFORE any idea - then base rates - then one pre-registration
Clock Tue 2015-05-12 01:00 London (end of released data). Coach, 05-11: "you're doing a test every few minutes now - slow down: quality over count. Next one, spend
longer on it - eyeball 10 charts of the setup first and write what you see before you pre-register."

## Part 1 - the ten charts
How they were chosen: not by me. A seeded random draw (seed 20150511) of 10 of the 90 A2 trades to 05-11, winners and losers as they come, so I cannot pick the days
that fit a story. M15 charts from the previous day 12:00 to the trade day 20:00 London, with the 07:00 call line, the entry, the stop and the noon exit
(bt/week_charts.py; charts/s10_a..d.png).
The draw: 01-08, 01-12, 02-06, 02-26, 03-05, 03-25, 04-16, 04-20, 04-21, 04-24. Results: +1.14, +1.35, -0.19, +0.01, +0.02, +0.91, -1.03, -1.03, -0.04, -1.03:
5 on the plus side, average +0.011R. All 90 trades: 57 wins, average +0.405R. So this draw is an UNLUCKY ten (three April full stops in it) and I read it knowing that.

What I see, chart by chart (written while looking, before any counting):
1. Thu 01-08 SELL +1.14R. Night drifts down gently, lower highs from midnight - with my side. Quiet hour before entry. From 08:00 a steady slide for two and a half
   hours, flat into noon. After 13:00 the whole morning is retraced.
2. Mon 01-12 SELL +1.35R. Flat-to-soft night. The entry candle itself is the breakdown. Falls until 11:00. From 13:00 a 50 pip rally.
3. Fri 02-06 BUY -0.19R. Yesterday evening spiked up; the night leaks lower for nine hours - against my buy. Morning sideways in 30 pips. At 13:30 a 130 pip collapse.
4. Thu 02-26 SELL +0.01R. Twenty hours in a 20 pip band. Morning: nothing. At 12:15 it breaks down and falls 160 pips by 18:00 - my direction, after I am out.
5. Thu 03-05 SELL +0.02R. Night drifts down with me, low at 06:30, a 20 pip bounce into my entry. Morning sideways. At 13:30 a spike UP of 50 pips, fully reversed in an hour.
6. Wed 03-25 BUY +0.91R. Day after a 130 pip fall. Range night. A 45 pip jump in the hour before entry; I buy the top of it; sideways two hours, then up from 10:30.
7. Thu 04-16 BUY -1.03R. Spike up at 01:00, then seven falling hours into and through my entry; stopped by a pip at 10:00; +100 pips by the afternoon.
8. Mon 04-20 BUY -1.03R. Lower highs all night; a bounce in the hour before entry; down from the first minute.
9. Tue 04-21 BUY -0.04R. Flat night, a 60 pip slide 06:00-08:30 into my buy; a base; the rally comes at 15:30.
10. Fri 04-24 BUY -1.03R. A 60 pip breakout candle in the hour before entry; I buy above it; rejected at 1.0900 and unwound by 11:15; 13:30 whips 40 pips both ways.

What the ten have in common, and what separates them (winners and losers side by side):
A. BEFORE the entry I can point at nothing that I have not already tested. The two clean winners (1, 2) had a quiet night drifting my way and a calm hour before
   entry; the three stops (7, 8, 10) had a night against me or a lively hour before entry. That is the night-against-me split (tested 03-31 and 04-23; live count since
   04-23: 9 such trades, +3.29R - the forward days are NOT confirming it) and the lively-hour split (PH, on paper as PH2). Chart 6 is a lively-hour chase that won.
B. DURING the morning the difference is plain and useless: winners trend from the first candle or from 10:30, scratches (4, 5, 9) sit in a 25-30 pip band, stops go
   against me inside the first hour. I have tested acting on the first hour four ways (09:00 exit, first-hour shape, time-decay stop, loss cut): all cost money.
C. AFTER noon is where my eye keeps going. In SIX of the ten charts the biggest move of the day starts after I am out, and in five of those it starts within a few
   minutes of 13:30 London: 3 (-130 pips), 4 (-160, from 12:15), 5 (a 50 pip spike and reversal), 9 (+90 from 15:30), 10 (a two-way whip), and 1 / 2 (the afternoon
   retraces the morning). Its direction has nothing to do with my signal: with me in 4 and 9, against me in 3, both ways in 5 and 10.
   I have tested the afternoon three times WITH A DIRECTION: as an exit (hold longer), as a fade of London's move (N, dead forward), and as a second trade in my
   signal's direction (AF: -0.11R on 75 afternoons, 43% full stops). I have never tested it WITHOUT a direction: let the market choose the side at 13:30 and follow the break.

## Part 2 - base rates on ALL days before I believe the ten (features only, no trade results; 89 A2 days with a full 08:00-20:00 session)
- Which London hour holds the day's biggest 60-minute range: 13:00-14:00 on 22% of days - the most frequent hour - then 08:00 (16%), 15:00 (15%), 09:00 (12%), 14:00 (10%).
  So "the biggest hour is around 13:30" is true on about one day in five, not six in ten. My ten charts exaggerated it.
- The afternoon (12:00-20:00) has a bigger range than the morning (08:00-12:00) on 65 of 89 days; medians 91.0 against 60.3 pips.
- The midday box (12:00-13:25 London) has a median range of 32.4 pips; the window 13:25-14:30 a median of 37.2 pips.
- In that window price leaves the box on 70 of 89 days: upward only on 33, downward only on 26, on BOTH sides on 11; on 19 days it stays inside.
- Clock caveat, from the same count: between 03-09 and 03-27 the US clock had moved and London's had not; the biggest hour was 12:00 on 13% of those 15 days and 13:00 on
  27%. One fixed London time (13:25) is used for all days; I do not tune it per period.
What the base rates say before any test: the afternoon is bigger than my morning, the box is left on four days in five, and on 11 of the 70 it is left on both sides
- a whipsaw rate of about one in six before any stop is considered.

## Part 3 - the idea, pre-registered. HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY CODE OR RESULT
### What I already know (contamination)
- AF (04-28): a 13:30 entry in my signal's direction with a 40 pip stop was a full stop on 32 of 75 afternoons. So this hour stops people out. A breakout follower is
  entered AT the moment of the move, which is exactly when a 30 pip stop is most at risk.
- NF (05-01): a trade and its mirror can both lose once each has a stop. So "the afternoon is big" does not mean "following its first move pays".
- The sim charges a fixed 1.0 pip spread. At a scheduled US release the real spread and slippage are several times that. A stand-alone trade at 13:30 is the worst
  possible place to trust the sim's costs, so the cost stress is a kill line, as in the night-fade test.
- From the ten charts I know five afternoons (3, 4 would have paid a break-follower; 5 and 10 whipped; 9 came later). They are in the sample; I do not remove
  them because they were drawn at random, not chosen, and I say so.

### Hypothesis
The first break of the 12:00-13:25 London range after 13:25 tends to carry on until 17:00 by enough to pay realistic costs: following it, in whichever direction it
goes, has a positive expectancy of its own, unrelated to my morning trade.

### Variants (151, 152, 153; ideas -> 56), no others afterwards. One trade a day at most, 13:25-14:30 London only, flat at 17:00, $125 risk; never open together with A2.
- BX1: a stop order at the box high and one at the box low; the first one touched is the trade; stop loss 30 pips; close at 17:00.
- BX2: as BX1, with the stop loss on the opposite side of the box (position sized so that this distance is $125); boxes wider than 60 pips are skipped.
- BX3: as BX1, only on days when the box is 30 pips or narrower (a quiet midday before the move).
Fills (my own small simulator, described so it can be checked): the entry is at the box edge - or at the bar's open if the bar opens beyond it - plus spread on buys
and slippage; if the entry bar also trades through the stop, the trade is counted as stopped in that bar (worst case); stops fill at the stop price plus slippage.

### KILL TEST (explicit). The build can only kill; a survivor gets a forward PAPER tag (100 forward trades at +0.15R, two standard errors, at the stressed cost).
A variant survives only if ALL:
  K1. average R per trade at least +0.15R at the sim's costs (1.0 pip spread, 0.1 slippage);
  K2. COST STRESS: 3.0 pip spread and 1.0 pip slippage on entry and on stop exits: average still at least +0.05R;
  K3. net R positive in each of the three periods (January, February, March-to-now) at the sim's costs;
  K4. net R still positive without its three best trades;
  K5. maximum drawdown at most 5R and the worst 10 trades in a row not worse than -4R;
  K6. independence from A2: correlation with A2's morning R at most +0.30 and net R not negative on the days A2's morning lost;
  K7. at least 50 trades (BX3 may fall short; then it fails).
My guess, written now: BX1 about zero at the sim's costs (between -0.10R and +0.10R) and clearly negative under the stress; BX2 a little better per trade because the
structural stop is wider than the whip; BX3 under 50 trades. No survivor. If so, the lesson of the ten charts is the one Part 2 already gave: the afternoon is big,
and big in both directions.
