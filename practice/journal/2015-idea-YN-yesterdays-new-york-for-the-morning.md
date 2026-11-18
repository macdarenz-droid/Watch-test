# Idea YN: yesterday's New York afternoon and the next London morning (idea 132; coach 08-12: best idea, hypothesis + kill line + min sample first)
Written Wed 2015-08-12 evening (clock Wed 08-12 22:00 London; no new day yet), before any count or outcome.

## Searched with short words in several forms ("afternoon", "NY", "next morning", "fade", "13:00")
The NY afternoon was used once: as the DIRECTION FOR A NIGHT TRADE (NF, 00:00-07:00), killed. Idea N/NR traded the NY session itself.
Never: yesterday's NY afternoon as the direction for the next LONDON MORNING. Not A2 by construction (a 4-hour window, not 3 days), but
it may line up with A2 often; that is counted before any outcome.

## Hypothesis
The London morning takes back yesterday's New York afternoon: positions put on in New York are trimmed when London opens.
(My own support: the night gives back part of yesterday's move 63% of the time (NF); since April moves come back (MC, AR).)

## Rule (London time, one trade a day)
Yesterday's NY move = yesterday's 17:00 open minus yesterday's 13:00 open. If |move| >= N pips: at 08:00 market order AGAINST it, stop 40,
out 12:00 (A2's frame).
## Order of work
Step 1 counts only for N = 0 (any move), 10, 20: trades, before / from 04-07, and the share on A2's side. Step 2: N = the LARGEST grid
value with 80+ trades and 35+ from 04-07 (once-a-day line). If that N has 70%+ of its trades on A2's side or on A2's OPPOSITE side, the
idea is A2 (or its mirror) in disguise and is killed before any outcome. Step 3 one run.
THE THREE VARIANTS (named now): YN1 (judged) the chosen N; YN2 (dose) the next larger N on the grid (or 30 if the chosen is 20);
YN0 (control) YN1's days traded WITH yesterday's NY move.
## Power, stated up front: at 80-150 trades the error on the average is about +-0.16R to +-0.22R; a no-edge rule clears +0.10R roughly
one time in four to one in six. ANY PASS IS PROVISIONAL until it holds on lived days in a pre-registered forward count.
## Kill lines (four, all must pass, for YN1)
K1 average >= +0.10R after costs (1.0 + 0.1). K2 net above zero before 04-07 AND from 04-07. K3 stressed (2.0 + 0.5) average above zero.
K4 YN1 minus YN0 above zero, sign-flip p < 0.10.
My guess: positive after 04-07, negative before (K2 fails).

## Step 1, counts only (tool `python bt/ny_to_london.py 2015-08-13 count`; no outcomes)
158 days; median |NY move| 32.9 pips. N = 0: 158 trades (66 / 92), fade on A2's side 39%. N = 10: 143 (63 / 80), 37%. N = 20: 114 (51 / 63), 35%.
## Step 2, by the lines written first
Largest N with 80+ and 35+ from 04-07: **N = 20** (114 / 63). Disguise check: the fade is on A2's side 35% of the time, i.e. on A2's
OPPOSITE side 65%: under the 70% line either way, so not A2 or its mirror in disguise (but leaning to the mirror: noted).
So YN1 = fade at N 20 (judged); YN2 = fade at N 30 (the grid ended at 20; 30 as written); YN0 = follow at N 20.
Worked cases: Wed 08-12, yesterday's NY move -0.9 pips -> no trade. Tue 08-11, 08-10's NY move +32.8 -> YN1 SELLS at 08:00 (A2 bought):
that morning A2's paper buy made +1.66R, so the sell should be a full stop. Mon 08-10, Friday's NY +23.0 -> sell; A2's buy lost -0.80R
there, so the sell should win about that much less costs.

## Step 3, result (one run: `test 20 30`)
Tool: `python bt/ny_to_london.py 2015-08-13 test 20 30`. Hand checks: 08-11 the fade sold 1.09666, stopped 1.10068, -1.00R (as written); 08-10 the
fade sold 1.09628, out 12:00 at 1.09333, +0.74R (as written: A2's -0.80R less costs on the other side).
| variant | trades | wins | avg R | net | stops | before 04-07 | from 04-07 | stressed avg |
|---|---|---|---|---|---|---|---|---|
| YN1 fade yesterday's NY move, N 20 (JUDGED) | 114 | 48% | +0.070 (+-0.17) | +8.01 | 32 | +3.66 | +4.35 | +0.028 |
| YN2 the same, N 30 | 87 | 49% | +0.091 (+-0.20) | +7.92 | 26 | +6.13 | +1.79 | +0.049 |
| YN0 follow, N 20 (control) | 114 | 44% | -0.008 (+-0.20) | -0.90 | 42 | -0.65 | -0.25 | -0.049 |
YN1 minus YN0 +0.078R (sign-flip p 0.66). YN1: K1 FAIL (+0.070R, line +0.10R) | K2 PASS | K3 PASS | K4 FAIL. **YN IS KILLED.**
Said straight, because it is the nearest miss in weeks:
1. YN1 is positive before AND after 04-07 and at stressed costs, the first judged rule in a month to hold across the regime date. Its
   dose line goes the right way (N 30: +0.091R). But its average is under my +0.10R line, it does not beat its own control by more than
   noise (p 0.66), and the error bar (+-0.17R) is twice the average. By my lines it is dead, and a pass would only have been provisional.
2. I do not lower K1 to +0.07R after seeing +0.070R, and I do not pick YN2 as the "real" rule.
3. What it would need, if my coach ever wants it: a pre-registered forward count on lived days, frozen exactly as YN1, after SW1's shadow
   ends. I start nothing.
Counts: idea 132; variants 356-358; second setups tried 30, none alive.
