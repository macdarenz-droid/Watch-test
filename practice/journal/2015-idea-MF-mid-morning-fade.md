# Idea MF: the first two hours are given back by noon (idea 116; coach 07-30: slow down, three weeks of chart notes by eye first)
Written Thu 2015-07-30 22:00 London, before any code.

## 1. The notes, 14 lived mornings 07-13..07-30 (my 08:00 / 10:00 / 12:00 walk notes, with the P12-corrected figures)
What I marked on each morning, from my own side's best / worst / last:
- BEST CAME EARLY AND WAS GIVEN BACK BY NOON (half or more of it): 07-15 (+8 -> -19), 07-17 (+14 -> +3), 07-20 (+15 -> +2),
  07-21 (+9 -> -30), 07-27 (+85 -> +39), 07-28 (+18 -> -26), 07-29 (+25 -> +5), 07-30 (+20 -> -3). 8 of 14.
- Stopped early, never in profit: 07-13, 07-14, 07-24. 3 of 14. (07-22 stopped late.)
- Ran and held to noon: 07-16, 07-23. 2 of 14.
- Lively pre-bell hour: 8 of 14 (PH2's count; its own gate).
The one I saw most: whatever the first two hours do, the next two take a good part of it back. It agrees with a number I already
have: MC (07-16) found "08-10 and 10-12 go the same way" on 48% of days in January-April and only 30% in the 30 days to 07-16.

## 2. Hypothesis
The 08:00-10:00 move is partly reversed between 10:00 and 12:00.
What I hold against it, written first: the 30% is from 06-05..07-16, the same weeks that put the picture in my head; before that the
share was 48-52%, a coin. So this may be six weeks of weather. The test has to be judged where I have NOT looked.

## 3. Rule (London time, one trade a day)
Move = open of the 10:00 candle minus open of the 08:00 candle.
- MF1 (judged): |move| >= 25 pips -> at 10:00 market order AGAINST it, stop 30 pips, out 12:00.
- MF2 (dose): |move| >= 40 pips.
- MF0 (control): the FOLLOW trade on MF1's days.
Three variants, no more. Costs on (1.0 + 0.1); stressed 2.0 + 0.5. $125 = 1R.

## 4. Sample: the inspiring window is DROPPED
Judged days = all days EXCEPT 06-05..07-30 (the MC window and the three weeks of notes). So: 01-05..06-04. The dropped window is printed
separately and labelled NOT JUDGED. Cases first: MF1 days before 04-07 and 04-07..06-04. Under 40 judged trades -> not judgeable -> killed.
Power: about 55 trades, spread about 1.0R -> error about 0.13R on the average; a no-edge rule clears +0.10R about one time in five.

## 5. Kill lines for MF1 on the judged days (all must pass)
K1 average >= +0.10R. K2 net above zero before 04-07 AND in 04-07..06-04. K3 net above zero without its best two trades.
K4 fade above follow (MF1 average > MF0 average; sign). K5 stressed average above zero. K6 max drawdown <= 6R. K7 dose: MF2 >= MF1.
Pass = route B step B1 candidate, then 40 forward paper trades (after SW1's shadow ends; one shadow at a time). Fail = killed, however
good the dropped window looks: that window is where I found it.
My guess: judged days about zero (K1 fails); the dropped window clearly positive. If so, it was weather.

## 6. Counts and worked case (tool, before outcomes)
Tool: `python bt/mid_morning_fade.py 2015-07-31 count` / `check 2015-07-28` (no outcomes).
- 150 days; judged (before 06-05) 110; dropped window 40. MF1 judged 58 trades (30 before 04-07, 28 in 04-07..06-04); dropped window 18.
  MF2 judged 28 (15 / 13); dropped 10. Judgeable (>= 40).
- My eye against the tool on the 14 note days: 10:00-12:00 went against 08:00-10:00 on 10 of 14 (I had marked 8 "given back" plus the
  stopped ones); on the 8 days with a move of 25+ pips, against on 5. So on the days the rule would actually trade, the picture is 5 of 8.
- Worked case, no trade: Tue 07-28, 08:00 open 1.10562, 10:00 open 1.10646, move +8.4 -> under 25, nothing.
- Worked case with a trade (in the dropped window; mechanics only): Mon 07-27, my walk had +49.8 pips at 10:00 and +39.2 at noon, the
  high already behind. So MF1 SELLS at 10:00, stop 30 above, out 12:00, and should make about +10 pips less costs = about +0.3R.

## 7. Result (one run)
Tool: `python bt/mid_morning_fade.py 2015-07-31 test`. Hand check 07-27: the fade sold 1.10777 at 10:00, out 12:00 at 1.10683, +0.31R: as I worked it out first.
| variant | judged trades | wins | avg R | net | before 04-07 | 04-07..06-04 | without best 2 | stressed avg | max DD | dropped window (NOT judged) |
|---|---|---|---|---|---|---|---|---|---|---|
| MF1 fade, move >= 25 (JUDGED) | 58 | 45% | -0.040 (+-0.20) | -2.33 | 30: -1.83 | 28: -0.50 | -6.42 | -0.123 | 4.38R | 18 trades, -0.008R each |
| MF2 fade, move >= 40 | 28 | 36% | -0.154 (+-0.25) | -4.30 | 15: -3.47 | 13: -0.83 | -6.61 | -0.265 | 4.63R | 10 trades, +0.150R each |
| MF0 follow on MF1's days | 58 | 45% | -0.063 (+-0.20) | -3.65 | 30: -1.67 | 28: -1.98 | -7.38 | -0.120 | 8.46R | 18 trades, -0.138R each |
MF1: K1, K2, K3, K5, K7 FAIL (K4, K6 pass and mean nothing). **MF IS KILLED.**
What I learned: 1. On the judged days neither side of the mid-morning pays: fade -0.04R, follow -0.06R. After 10:00 the rest of the
morning is a coin that costs the spread. 2. The surprise is the dropped window: even in the very weeks where I "saw it most", the fade
made -0.008R a trade on the days the rule trades. My guess ("the dropped window clearly positive") was wrong. The picture in my notes
was real as a description (10 of 14 mornings turned) and worthless as a trade: the turns were small, the mornings that did not turn
ran, and a 30-pip stop plus costs ate the rest. 3. What I see most in my notes is what my own position did (a small profit handed
back), not what the market offers. A note written with a position in mind is not a count.
Counts: idea 116; variants 320-322; second setups tried 21, none alive.
