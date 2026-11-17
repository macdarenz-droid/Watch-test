# MO1 / MO3 - the side-advantage monitor: PRE-SET PAPER RULE (never live). Rules and judging: journal/2015-idea-MO-side-advantage-monitor.md
Monitor at 07:00 = average of (my side's R minus the other side's R) over the last N completed A2 days (MO1: 40, MO3: 60); below 0.00R -> A2 would be on PAPER that day.
Tool: `python bt/side_monitor.py END --state` (END = today's date; it prints the monitor for the day after the last completed day). Written in the 07:00 call before the entry bar.
JUDGING (fixed 06-29, before the run): after 60 lived days from 06-30, a variant goes to the coach only if (a) its R over the 60 days is not more than 1.0R below
A2-always's and (b) A2 averaged below +0.10R on the days the variant had it off. Otherwise closed. The live trade is A2 as always throughout.
| day | MO1 monitor -> state | MO3 monitor -> state | A2 live R | MO1 R (running) | MO3 R (running) | A2 R (running) |
|---|---|---|---|---|---|---|
