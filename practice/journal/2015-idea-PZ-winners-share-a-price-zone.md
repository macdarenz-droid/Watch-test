# Review of my funded-day winners: what do they share at entry? One trait as a rule: idea PZ, the price zone. STUDY ON FUNDED DAYS; KILL TEST ON THE DAYS BEFORE; WRITTEN BEFORE THE TEST
Clock Thu 2015-06-25 01:00 London (end of released data). After funded day 64. Coach 06-24: "review your funded-day winners, what do they share at
entry? turn one shared trait into a testable rule with a kill test."
June goal: every number and every test rule gets one worked case before it is pushed.
Method, from MH: a trait found on one part of the history is judged on a part it was not found on. Study = the 64 funded days (03-27 .. 06-24).
Kill test = the 58 A2 days before 03-27, about which the study script prints nothing.

## The review (`python bt/winners_review.py 2015-06-25 study`; engine A2 on the funded days: 31 winners +29.51R, 33 losers -26.93R; entry-time facts only)
| at 08:00 | winners (31) | losers (33) |
|---|---|---|
| sells | 55% | 42% |
| flip day | 23% | 30% |
| signal 3 or more days old | 52% | 52% |
| yesterday closed my way | 68% | 67% |
| the hour before the bell moved my way | 35% | 36% |
| the hour before the bell moved AGAINST me by 10+ pips | 52% | 33% |
| the night moved my way | 45% | 39% |
| where the 08:00 price sits in yesterday's range, measured in my direction (0 = far end against me, 1 = the extreme I trade toward): median | 0.67 | 0.57 |
| - in the bottom quarter (under 0.25) | 6 | 10 |
| - 0.25 to 0.50 | 2 | 4 |
| - 0.50 to 0.75 | 10 | 11 |
| - 0.75 to 1.00 | 11 | 3 |
| - beyond yesterday's extreme (1.00 or more) | 2 | 5 |
| Monday / Tuesday / Wednesday / Thursday / Friday | 5 / 6 / 7 / 7 / 6 | 8 / 7 / 6 / 5 / 7 |
What the winners share: almost nothing that the losers do not share too. Age, run, night, weekday: the same. Two lines differ:
(a) more winners than losers came after an hour that moved against me (a better entry price) - the neighbourhood of H, LE, ET, LD: tested and closed;
(b) eleven winners against three losers entered in the OUTER QUARTER of yesterday's range on my side, but not beyond it. That is the one trait that
    stands out, and I have never tested the position in yesterday's range as a rule (it was only printed for 24 days on 05-18).
Said before testing: (b) is the best of about fifteen lines I just looked at, on 14 days. One line in fifteen stands out by chance. That is exactly
why the kill test is on other days.
Worked case of the trait (`check 2015-06-24`): sell at 1.11975; yesterday's range 1.11351 - 1.13472; position = (1.13472 - 1.11975) / 0.02121 = 0.70 (tool: 0.704).
Not in the outer quarter (0.75-1.00); in the outer half.

## HYPOTHESIS: A2 does better when the 08:00 price sits in the outer part of yesterday's range on my side, without being beyond it
Variants (3 zones of the same trait): PZ1 0.75 to 1.00 (the trait as found); PZ2 0.50 to 1.00 (wider); PZ3 0.75 and above (including beyond the extreme).
Each compares A2's result on days IN the zone with days OUTSIDE it, on the 58 held-out days before 03-27 (`python bt/winners_review.py 2015-06-25 test LO HI`).
Kill lines (held-out days; one failure kills the variant):
- K1: days in the zone average at least 0.20R more than the others.
- K2: the win rate in the zone is higher than outside.
- K3 sample: at least 10 held-out days in the zone and 15 outside.
- K4: the held-out difference is at least half of the difference on the funded days (a trait that shrinks to less than half was mostly the search).
Worked case for the lines: zone 13 days at +0.70R, others 45 days at +0.40R -> difference +0.30R: K1 pass; if the funded difference was +0.90R, K4 FAILS (0.30 < 0.45).
A survivor: a count in the daily call (never a skip, never a size: A2 has no skips and both groups are likely positive). Killed: closed, and
"where the price sits in yesterday's range" joins the list of things that do not separate my days.
Worked expectation, written now: on the funded days the zone will show a large difference (it was picked for it: 11 winners of 14). On the held-out days
I expect a difference near zero, sign unknown: KILLED on K1 and K4 - the eighth winner-trait or loser-trait that has twins. I would be glad to be wrong.
Counts when run: idea 89, variants 248-250.
