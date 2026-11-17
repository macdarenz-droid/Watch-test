# Replay of my worst losing week (week 17, Mon 04-20 .. Fri 04-24) + idea NC (idea 138; coach 08-17)
Written Mon 2015-08-17 evening (clock Mon 08-17 22:00 London; no new data), before any count or outcome.

## Why week 17
By R it is my worst week, live and on A2's engine list: 5 live trades at 0.31 lots, -3.07R, -$394.94 (W26 -2.43R, W24 -2.29R). Week 24
was replayed on 06-18; week 17 never.

## Bar by bar (M15 charts, previous day 12:00 -> trade day 20:00; trade list; London time)
| day | A2 | the hour before the bell (07:00-08:00) | what happened | R | tag |
|---|---|---|---|---|---|
| Mon 04-20 | buy | jumped about 30 pips UP (with A2) | bought near the top; fell; stopped 09:40 | -1.00 | VALID |
| Tue 04-21 | buy | fell about 60 pips DOWN through yesterday's low (against A2) | bought near the bottom; flat to noon, rose after | -0.04 | VALID |
| Wed 04-22 | sell | rose about 35 pips UP (against A2) | sold; rose 40 more to 10:30; back to entry by noon | -0.02 | VALID |
| Thu 04-23 | sell | fell about 30 pips DOWN to a new low (with A2) | sold near the bottom; V-turn; stopped 09:51 | -1.00 | VALID |
| Fri 04-24 | buy | jumped about 70 pips UP (with A2) | bought near the top; drifted down; stopped 11:10 | -1.00 | VALID |
All five VALID (call before the bell, 08:00 market, stop never moved, noon or stop). 0 trade mistakes. (Process mistake P5 of 04-24 was
about paper tags, not these trades.)

## What a better trader would have done
On Mon, Thu and Fri he would have seen that the move A2 wanted had already happened in the hour before the bell, and not paid the top
(bottom) of it. On Tue and Wed, where A2 bought (sold) INTO the hour's move, he would have done what A2 did, and lost nothing.
CLEAREST LESSON: the three full stops are the three mornings where A2 entered at the end of a pre-bell run in its own direction.

## What I already know that touches it (stated before the test)
- H (January): "no chase" by where the price sat in yesterday's range: killed ("helps in a box, hurts in a trend").
- NM/NA: the whole night (00:00-08:00) against A2: killed twice. Different window and different sign.
- LM (05-07), a description written AFTER that test, never a rule: on 35 lively mornings to 05-06, A2 made +0.338R where it faded the
  hour and +0.005R where it chased it. That is the same idea seen on part of the same days: CONTAMINATION, declared.
- PH2: half size after any lively hour (range), on paper with its own gate. NC uses the hour's NET direction relative to A2, not its range.

## Idea NC: no chase of the pre-bell hour (an A2 filter; it changes only which days A2 trades)
Hour move = open of the 08:00 candle minus open of the 07:00 candle, signed by A2's side (positive = the hour ran A2's way).
Rule: skip A2's trade when the hour moved at least X pips A2's way. Everything else is A2.
ORDER OF WORK: step 1 counts only for X = 10, 15, 20 (skipped days, before / from 04-07). Step 2: X = the LARGEST grid value that skips
at least 15% of A2's days and at least 25 days in all. Step 3 one run on the engine's A2 list (history before 2015-08-18).
THE THREE VARIANTS (named now): NC1 (judged) skip at the chosen X; NC2 (dose) skip at the next larger X (or 25 if the chosen is 20);
NC0 (control) skip when the hour moved X or more AGAINST A2 (if any big pre-bell hour hurts, NC0 does as well as NC1 and the "chase"
story is wrong).
Power, stated up front (once-a-day): about 160 A2 days; a skipped group of 25-50 days has an error of about +-0.3R to +-0.4R on its average.
ANY PASS IS PROVISIONAL (plan section 9): it could only become a paper tag on A2 for a forward count, never a live rule now.
## Kill lines (four, all must pass, for NC1)
K1 the skipped days' average under A2 is below zero AND at least 0.30R below the kept days' average.
K2 the same sign (skipped below kept) before 04-07 AND from 04-07.
K3 NC1's skipped-minus-kept gap larger than NC0's (chasing is the problem, not any big hour).
K4 label shuffle (10,000) of NC1's gap: p < 0.10.
My guess: K1 passes (the week told me so), K2 fails: chasing paid in the trend months (H's "hurts in a trend").
