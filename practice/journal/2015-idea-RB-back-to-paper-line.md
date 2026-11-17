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
