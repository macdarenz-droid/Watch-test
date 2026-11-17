# Idea RA: the plan's weakest assumption - route A's gate (idea 110; coach 07-22). Written Wed 2015-07-22 22:00 London, before any code.

## The weakest assumption
Route A lets A2 back to money when "the 40-day side-advantage monitor reads >= +0.30R" (after 09-21, MO judged). The assumption inside:
a 40-day reading of +0.30R means the edge is back. I never tested how often a rule with NO edge shows that reading by chance. It is the
only door back for A2 and I chose the +0.30R by feel on 07-09. Every other number in the plan has had a test (size: SG, LF; stop: ST;
alarm: LR; exits: RC, BE).

## Hypothesis
With no edge at all, a 40-day average of the daily side advantage (my side's R minus the other side's) reaches +0.30R often enough to
open the door by luck.

## Method (fixed now)
- Daily side advantage as bt/side_monitor.py computes it. "No-edge A2" pool = the days 04-07..07-22, shifted so their mean is exactly zero.
- X1 single morning: 20,000 resamples of 40 days (with replacement); share with a mean >= +0.30R.
- X2 the way the rule is really used: 20,000 runs of 100 days; the door is checked every morning for 60 mornings (09-21 to mid-December);
  share of runs where it opens at least once.
- Power, same two numbers with the old edge: pool = the days 01-06..04-06 as they were (the healthy A2).
Two variants (single morning; 60 mornings). Limit: resampled days are independent; real days cluster a little.

## Kill line (for the GATE, written first)
- If a no-edge A2 opens the door on more than 5% of single mornings, or in more than 20% of 60-morning runs: THE GATE IS TOO WEAK. Then
  I compute the threshold that gives 5% on a single morning, report how often the healthy A2 would pass it, and PROPOSE it to my coach
  for the 09-21 review. I do not edit the return rule myself: no rule change off one test, and loosening is not on the table at all.
- If both are under those lines: the gate stands as written.
My guess: too weak. The daily advantage swings about 2R, so 40 days average to about +-0.3R by chance alone.
Worked case to check first: the tool's 40-day monitor for the morning of 07-23 must equal side_monitor's -0.406R.

## Facts and worked case (tool `python bt/gate_check.py 2015-07-23 facts`, before the resampling)
142 days. Last-40 mean = -0.406R = side_monitor's monitor for 07-23: the series is the same. No-edge pool: 77 days from 04-07 (mean -0.141R
before shifting, spread 1.89R). Healthy pool: 65 days to 04-06 (mean +0.942R, spread 1.57R).

## Result (one run)
