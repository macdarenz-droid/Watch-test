# Idea RT: the first touch of a round number in the day (idea 121; coach 08-06: next backtest). Written Thu 2015-08-06 22:00 London, before any code.

## Where it comes from
Round numbers are in every one of my 07:00 calls as landmarks, and they were tested once only as an A2 filter (RN, January, 19 trades,
nothing). I have never asked what the price DOES at one. Many traders are said to place orders at them; I have no source for that and
do not rely on it. The question is simply counted.

## Hypothesis
The first time in a London day that the price reaches a 50-pip level (1.xx00 or 1.xx50) it bounces off it more often than it goes through.

## Rule (London time, 08:00-17:00 signals, one position at a time)
Touch = the first M5 candle of the day whose high reaches a level from below (the previous candle closed under it), or whose low reaches
it from above, and the price was at least 15 pips away from that level at some point in the hour before (a fresh approach, not a
drift along it). Each level is used once a day.
- RT1 (judged): at the next candle's open, market order AWAY from the level (bounce: a touch from below -> sell), stop 30 pips,
  out 2 hours after entry.
- RT2: "00" levels only (1.xx00).
- RT0 (control): the THROUGH trade (break) on RT1's signals, same stop and exit.
Three variants, no more. Costs on (1.1 pips = 3.7% of a 30-pip risk); stressed 2.0 + 0.5. $125 = 1R.

## Cases before outcomes
Count RT1 / RT2 trades before and from 04-07, the number of days, and the 5 busiest days. Under 150 RT1 trades or under 60 from
04-07 -> not judgeable -> killed for sample.
Power: about 250 trades, spread about 1R -> error about 0.13R on the average (two standard errors); p-values are meaningful here.

## Kill lines for RT1 (all must pass)
K1 average >= +0.10R. K2 net above zero before 04-07 AND from 04-07. K3 net above zero without its best 5 trades AND without its
5 busiest days. K4 bounce minus break above zero with sign-flip p < 0.05. K5 stressed average above zero. K6 max drawdown <= 8R.
K7 RT2 ("00" only) average >= RT1's (if round numbers matter, the rounder one should matter more).
Pass = a pre-registered rule that passed on lived days: eligible for route C after my coach's word. Fail = killed.
My guess: a coin minus costs again (about -0.04R), like SF; K1 fails.

## Counts and worked case (tool, before outcomes)
Tool: `python bt/round_touch.py 2015-08-07 count` / `check 2015-07-13` (no outcomes).
- RT1 (50-pip levels): 228 trades (97 before 04-07, 131 from) on 146 days; the 5 busiest days hold 15; 110 touches from below, 118 from above.
  RT2 (100-pip levels): 136 trades (63 / 73) on 120 days. Judgeable by my line (150 / 60).
- Worked case Mon 07-13: the price fell from 1.1186 after 08:00; the 08:05 candle reached 1.1150 from above (fresh: it was 15+ pips
  higher in the hour before) -> RT1 BUYS at the 08:10 open (bounce), stop 30 below, out 10:10. I know that morning fell 132 pips by
  10:00, so this must be a full stop for the bounce and a winner for the break. The next level, 1.1100, was reached while that trade
  was open, so it is skipped and used up for the day; the second signal is 1.1050 at 13:05.

## Result (one run)
Tool: `python bt/round_touch.py 2015-08-07 test`. Hand check 07-13: the bounce bought 1.11475 at 08:10 and was stopped at 1.11163, -1.04R;
the break sold 1.11463, out 10:10 at 1.10760, +2.35R. As I wrote first.
| variant | trades | wins | avg R | net | full stops | before 04-07 | from 04-07 | without best 5 | without 5 busiest days | stressed avg | max DD |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RT1 bounce, 50-pip levels (JUDGED) | 228 | 40% | -0.159 (+-0.12) | -36.34 | 90 | -9.99 | -26.35 | -51.13 | -31.61 | -0.212 | 42.18R |
| RT2 bounce, 100-pip levels | 136 | 35% | -0.279 (+-0.15) | -37.91 | 64 | -16.17 | -21.74 | -46.63 | -33.57 | -0.350 | 39.51R |
| RT0 break on RT1's signals (control) | 228 | 48% | +0.034 (+-0.13) | +7.71 | 70 | -1.52 | +9.22 | -5.61 | +3.16 | -0.032 | 10.52R |
Bounce minus break -0.193R (sign-flip p 0.096). RT1: all seven kill lines FAIL. **RT IS KILLED.**
What I learned:
1. My hypothesis was backwards, the fourth wrong-way guess in a fortnight (SR, EV, MF's dropped window, RT). On the first touch of the
   day the price does NOT bounce off a round number; the bounce lost 0.16R a trade, far more than the 0.04R the costs take, and it was
   worse at the "rounder" 00 levels (-0.28R). If anything the level is a place the price goes THROUGH.
2. The break side made +0.034R, under my line, negative before 04-07 and at stressed costs, and the difference has p 0.096. It was the
   control, it is the mirror on the same data, and my coach has told me not to test that. Noted, not promoted.
3. Practical, for every call I write: a round number in front of a trade is not a reason to expect it to stop. My calls have called
   them "landmarks"; from now on I write them as information, never as a target or a wall.
Counts: idea 121; variants 335-337; second setups tried 23, none alive.
