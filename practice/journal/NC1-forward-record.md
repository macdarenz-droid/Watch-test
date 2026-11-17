# NC1 forward count - PAPER ONLY (coach 08-28 evening: start on paper, checks already written, no changes, no live money until it passes)
STARTED Mon 2015-08-31, written before any 08-31 candle was read.
Rule frozen as tested (journal/2015-08-17-replay-week-17-and-idea-NC.md): skip A2 when the hour move (08:00 open minus 07:00 open, signed by
A2's side) is >= +15 pips. A tag on A2's paper call; it touches no money (A2 is on paper).
Check already written there: "judged on at least 30 forward skip days with the same four lines" (K1-K4). Expected: about one skip a week
-> about 7 months.
OPEN QUESTION FOR THE COACH (not decided by me, no change made): K2 in the original is "the same sign before 04-07 AND from 04-07". On forward
days there is no 04-07 split. I record every day so any reading can be applied later, and I will ask before the judging day which split K2
means forward (e.g. first and second half of the forward days). Until answered I compute nothing on it.
Daily tool: `python bt/no_chase_hour.py END check DATE` (hour column = signed move). The control NC0 (hour >= 15 AGAINST A2) is logged too.
| day | A2 side | hour signed (pips) | NC1 | NC0 | A2 paper R |
|---|---|---|---|---|---|
| Mon 2015-08-31 | -1 | +27.2 | SKIP (1 of 30) | no | +0.31 |
