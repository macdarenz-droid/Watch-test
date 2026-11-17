# MO1 / MO3 - the side-advantage monitor: PRE-SET PAPER RULE (never live). Rules and judging: journal/2015-idea-MO-side-advantage-monitor.md
Monitor at 07:00 = average of (my side's R minus the other side's R) over the last N completed A2 days (MO1: 40, MO3: 60); below 0.00R -> A2 would be on PAPER that day.
Tool: `python bt/side_monitor.py END --state` (END = today's date; it prints the monitor for the day after the last completed day). Written in the 07:00 call before the entry bar.
JUDGING (fixed 06-29, before the run): after 60 lived days from 06-30, a variant goes to the coach only if (a) its R over the 60 days is not more than 1.0R below
A2-always's and (b) A2 averaged below +0.10R on the days the variant had it off. Otherwise closed. The live trade is A2 as always throughout.
| day | MO1 monitor -> state | MO3 monitor -> state | A2 live R | MO1 R (running) | MO3 R (running) | A2 R (running) |
|---|---|---|---|---|---|---|
| Tue 2015-06-30 (1) | -0.086R -> PAPER | +0.011R -> as usual | +0.48 | 0.00 (0.00) | +0.48 (+0.48) | +0.48 (+0.48) |
| Wed 2015-07-01 (2) | -0.095R -> PAPER | +0.078R -> as usual | -1.00 | 0.00 (0.00) | -1.00 (-0.52) | -1.00 (-0.52) |
| Thu 2015-07-02 (3) | -0.152R -> PAPER | +0.096R -> as usual | +0.08 | 0.00 (0.00) | +0.08 (-0.44) | +0.08 (-0.44) |
| Fri 2015-07-03 (4) | -0.173R -> PAPER | +0.077R -> as usual | -0.36 | 0.00 (0.00) | -0.36 (-0.80) | -0.36 (-0.80) |
| Mon 2015-07-06 (5) | -0.227R -> PAPER | +0.022R -> as usual | -1.00 | 0.00 (0.00) | -1.00 (-1.80) | -1.00 (-1.80) |
| Tue 2015-07-07 (6) | -0.188R -> PAPER | -0.034R -> PAPER | -1.00 | 0.00 (0.00) | 0.00 (-1.80) | -1.00 (-2.80) |
| Wed 2015-07-08 (7; A2 itself on paper from today) | -0.171R -> PAPER | -0.048R -> PAPER | (paper -1.00) | 0.00 (0.00) | 0.00 (-1.80) | -1.00 (-3.80) |
| Thu 2015-07-09 (8; A2 on paper) | -0.235R -> PAPER | -0.105R -> PAPER | (paper +1.39) | 0.00 (0.00) | 0.00 (-1.80) | +1.39 (-2.41) |
| Fri 2015-07-10 (9; A2 on paper) | -0.202R -> PAPER | -0.064R -> PAPER | (paper -1.00) | 0.00 (0.00) | 0.00 (-1.80) | -1.00 (-3.41) |
| Mon 2015-07-13 (10; A2 on paper) | -0.227R -> PAPER | -0.166R -> PAPER | (paper -1.03) | 0.00 (0.00) | 0.00 (-1.80) | -1.03 (-4.44) |
| Tue 2015-07-14 (11; A2 on paper) | -0.302R -> PAPER | -0.188R -> PAPER | (paper -1.00) | 0.00 (0.00) | 0.00 (-1.80) | -1.00 (-5.44) |
| Wed 2015-07-15 (12; A2 on paper) | -0.433R -> PAPER | -0.222R -> PAPER | (paper -0.48) | 0.00 (0.00) | 0.00 (-1.80) | -0.48 (-5.92) |
| Thu 2015-07-16 (13; A2 on paper) | -0.425R -> PAPER | -0.237R -> PAPER | (paper +1.09) | 0.00 (0.00) | 0.00 (-1.80) | +1.09 (-4.83) |
| Fri 2015-07-17 (14; A2 on paper) | -0.308R -> PAPER | -0.163R -> PAPER | (paper +0.05) | 0.00 (0.00) | 0.00 (-1.80) | +0.05 (-4.78) |
| Mon 2015-07-20 (15; A2 on paper) | -0.260R -> PAPER | -0.119R -> PAPER | (paper +0.04) | 0.00 (0.00) | 0.00 (-1.80) | +0.04 (-4.74) |
| Tue 2015-07-21 (16; A2 on paper) | -0.299R -> PAPER | -0.112R -> PAPER | (paper -0.74) | 0.00 (0.00) | 0.00 (-1.80) | -0.74 (-5.48) |
| Wed 2015-07-22 (17; A2 on paper) | -0.313R -> PAPER | -0.180R -> PAPER | (paper -1.03) | 0.00 (0.00) | 0.00 (-1.80) | -1.03 (-6.51) |
