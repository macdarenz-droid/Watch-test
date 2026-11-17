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
| Thu 2015-07-23 (18; A2 on paper) | -0.406R -> PAPER | -0.222R -> PAPER | (paper +1.65) | 0.00 (0.00) | 0.00 (-1.80) | +1.65 (-4.86) |
| Fri 2015-07-24 (19; A2 on paper) | -0.346R -> PAPER | -0.226R -> PAPER | (paper -1.03) | 0.00 (0.00) | 0.00 (-1.80) | -1.03 (-5.89) |
| Mon 2015-07-27 (20; A2 on paper) | -0.351R -> PAPER | -0.273R -> PAPER | (paper +0.95) | 0.00 (0.00) | 0.00 (-1.80) | +0.95 (-4.94) |
| Tue 2015-07-28 (21; A2 on paper) | -0.267R -> PAPER | -0.204R -> PAPER | (paper -0.67) | 0.00 (0.00) | 0.00 (-1.80) | -0.67 (-5.61) |
| Wed 2015-07-29 (22; A2 on paper) | -0.363R -> PAPER | -0.256R -> PAPER | (paper +0.10) | 0.00 (0.00) | 0.00 (-1.80) | +0.10 (-5.51) |
| Thu 2015-07-30 (23; A2 on paper) | -0.302R -> PAPER | -0.280R -> PAPER | (paper -0.11) | 0.00 (0.00) | 0.00 (-1.80) | -0.11 (-5.62) |
| Fri 2015-07-31 (24; A2 on paper) | -0.405R -> PAPER | -0.300R -> PAPER | (paper -0.68) | 0.00 (0.00) | 0.00 (-1.80) | -0.68 (-6.30) |
| Mon 2015-08-03 (25; A2 on paper) | -0.406R -> PAPER | -0.347R -> PAPER | (paper +0.73) | 0.00 (0.00) | 0.00 (-1.80) | +0.73 (-5.57) |
| Tue 2015-08-04 (26; A2 on paper) | -0.338R -> PAPER | -0.285R -> PAPER | (paper -0.53) | 0.00 (0.00) | 0.00 (-1.80) | -0.53 (-6.10) |
| Wed 2015-08-05 (27; A2 on paper) | -0.319R -> PAPER | -0.257R -> PAPER | (paper +0.11) | 0.00 (0.00) | 0.00 (-1.80) | +0.11 (-5.99) |
| Thu 2015-08-06 (28; A2 on paper) | -0.333R -> PAPER | -0.280R -> PAPER | (paper +0.07) | 0.00 (0.00) | 0.00 (-1.80) | +0.07 (-5.92) |
| Fri 2015-08-07 (29; A2 on paper) | -0.283R -> PAPER | -0.295R -> PAPER | (paper -0.32) | 0.00 (0.00) | 0.00 (-1.80) | -0.32 (-6.24) |
| Mon 2015-08-10 (30; A2 on paper) | -0.345R -> PAPER | -0.265R -> PAPER | (paper -0.80) | 0.00 (0.00) | 0.00 (-1.80) | -0.80 (-7.04) |
| Tue 2015-08-11 (31; A2 on paper) | -0.396R -> PAPER | -0.274R -> PAPER | (paper +1.66) | 0.00 (0.00) | 0.00 (-1.80) | +1.66 (-5.38) |
| Wed 2015-08-12 (32; A2 on paper) | -0.395R -> PAPER | -0.283R -> PAPER | (paper +1.69) | 0.00 (0.00) | 0.00 (-1.80) | +1.69 (-3.69) |
| Thu 2015-08-13 (33; A2 on paper) | -0.337R -> PAPER | -0.218R -> PAPER | (paper -0.37) | 0.00 (0.00) | 0.00 (-1.80) | -0.37 (-4.06) |
| Fri 2015-08-14 (34; A2 on paper) | -0.409R -> PAPER | -0.186R -> PAPER | (paper +0.25) | 0.00 (0.00) | 0.00 (-1.80) | +0.25 (-3.81) |
| Mon 2015-08-17 (35; A2 on paper) | -0.342R -> PAPER | -0.147R -> PAPER | (paper -0.32) | 0.00 (0.00) | 0.00 (-1.80) | -0.32 (-4.13) |
| Tue 2015-08-18 (36; A2 on paper) | -0.300R -> PAPER | -0.186R -> PAPER | (paper +0.23) | 0.00 (0.00) | 0.00 (-1.80) | +0.23 (-3.90) |
| Wed 2015-08-19 (37; A2 on paper) | -0.234R -> PAPER | -0.163R -> PAPER | (paper +0.64) | 0.00 (0.00) | 0.00 (-1.80) | +0.64 (-3.26) |
| Thu 2015-08-20 (38; A2 on paper) | -0.196R -> PAPER | -0.173R -> PAPER | (paper +1.01) | 0.00 (0.00) | 0.00 (-1.80) | +1.01 (-2.25) |
| Fri 2015-08-21 (39; A2 on paper) | -0.139R -> PAPER | -0.144R -> PAPER | (paper -1.03) | 0.00 (0.00) | 0.00 (-1.80) | -1.03 (-3.28) |
| Mon 2015-08-24 (40; A2 on paper) | -0.151R -> PAPER | -0.127R -> PAPER | (paper +0.62) | 0.00 (0.00) | 0.00 (-1.80) | +0.62 (-2.66) |
