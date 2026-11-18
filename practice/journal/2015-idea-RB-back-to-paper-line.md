# Idea RB: the return rule's other half - "back to paper under 0.00R" (idea 117). Written Fri 2015-07-31 22:00 London, before any code.
On 07-22 I tested the door IN (the gate) and wrote that the door OUT (back to paper when the 40-day monitor is under 0.00R) had the same
kind of untested assumption. It decides how long a dead rule stays on money once it is in, and how often a healthy rule is thrown out.

## Hypothesis
With the gate at +0.60R and the exit at 0.00R, a no-edge A2 that gets in by luck stays in too long, because the 40-day average needs
weeks to fall from +0.60R to zero.

## Method (fixed now)
- Daily pairs (my side's R, side advantage) as bt/side_monitor.py computes them, resampled by day with replacement, 5,000 runs of 250 days.
- State machine exactly as the rule: paper until the 40-day mean advantage >= +0.60R; then live; back to paper when it is < exit line;
  live again at >= +0.60R. The first 40 days of each run only fill the window.
- NO-EDGE pool: days from 04-07, advantage shifted to mean zero and my-side R shifted to mean zero (a coin after costs would be
  slightly negative; zero is the kind assumption). HEALTHY pool: days to 04-06 as they were.
- RB1 exit 0.00R (as written). RB2 exit +0.20R. RB3 exit +0.30R. Three variants, no more.
- For each: share of the 210 days spent live; R earned while live per year; for the no-edge pool also the average length of a live spell.

## Kill line for the WRITTEN exit (0.00R), before the numbers
- TOO LAX if a no-edge A2 spends more than 10% of days live. TOO STRICT if the healthy A2 spends less than 85% of days live after its first entry.
- If it fails either: I report which of RB2/RB3 meets both lines and PROPOSE it to my coach. I edit nothing myself; and the gate is not
  part of this test (coach 07-24: the gate stays +0.60R).
- If it passes both: the exit stands as written.
My guess: no-edge live share under 10% (the gate is hard to pass), but each lucky spell lasts 30+ days; passes the line, with a warning.
Worked case first: the tool's last-40 mean for the morning of 08-03 must equal side_monitor's -0.406R.

## Facts and worked case (tool `python bt/exit_line_check.py 2015-08-01 facts`, before the runs)
149 days. Last-40 mean -0.406R = side_monitor's monitor for 08-03: the same series. No-edge pool: 84 days from 04-07 (advantage -0.127R,
my side -0.074R a day before shifting to zero). Healthy pool: 65 days to 04-06 (advantage +0.942R, my side +0.492R a day).

## Result (one run)
Tool: `python bt/exit_line_check.py 2015-08-01 test` (5,000 runs of 250 days each; gate +0.60R throughout).
| exit line | NO-EDGE A2: days live | gets in at all (in 210 days) | average live spell | HEALTHY A2: days live after its first entry | R while live |
|---|---|---|---|---|---|
| 0.00R (AS WRITTEN) | 8.6% | 41% of runs | 39 days | 100.0% | +102.8 |
| +0.20R | 6.2% | 41% | 27 days | 99.6% | +102.6 |
| +0.30R | 5.1% | 42% | 21 days | 98.8% | +101.5 |
**BY THE LINES WRITTEN FIRST THE EXIT AT 0.00R STANDS**: a no-edge A2 is live on 8.6% of days (line 10%), and a healthy A2 is never
thrown out (line 85%). I propose no change. My guess was right on both counts, including the warning:
1. Over about ten months of looking, a no-edge A2 gets through the +0.60R gate at least once in 41% of runs. The gate's "2% of
   mornings" and this "41% of runs" are the same fact seen over a longer time. Once in, it stays about 39 trading days.
2. What such a lucky spell costs: nothing on average if the rule is a true coin (-0.09R per run here), about 39 trades of pure variance
   at 0.16 lots, with the 7% stop-trading line and the size rule underneath. Survivable by design; not free of nerves.
3. A tighter exit (+0.20R or +0.30R) would shorten the lucky spell to 27 or 21 days at almost no cost to a healthy rule. I write that
   down for the 09-21 review as information. I do not propose it now: the written line passed its test, and changing a line that
   passed is the goalpost-moving my coach stopped on 07-24.
Limits: days resampled as independent; the no-edge pool is shifted to exactly zero (a real coin pays the spread and would lose a
little while live); 65 healthy days.
Counts: idea 117; variants 323-325.
