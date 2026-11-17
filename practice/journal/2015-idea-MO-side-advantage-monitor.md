# Idea MO: a pre-set rule for when the side advantage fades - a rolling monitor that pauses or halves A2. RULE, SCENARIOS AND KILL TEST WRITTEN BEFORE ANY CODE
Clock Tue 2015-06-30 01:00 London (end of released data). After funded day 67 (7 losses in a row; half-size trigger $87 away).
Coach 06-29: "don't change live rules off one test. write a pre-set rule for what you'd do when the side advantage fades (e.g. a rolling check that
cuts size or pauses), backtest it on your history first with a kill test, then use your lived days as the out-of-sample check. survival first,
funded account matters more than any one setup."
June goal: every number and every test rule gets one worked case before it is pushed.

## The difficulty, said first
My history contains ONE fade (about mid-April). A monitor tuned on one event will look good on that event whatever it is. So the real history is only
one of four lines; the other three ask what the same rule would do in worlds I can build from my own days: one where the edge never fades (what do
false alarms cost?), one where it is gone throughout, and one where it dies half-way. A monitor that only pays on the one history I have is killed.

## The rule (fixed now)
SIDE ADVANTAGE of a day = R of my side minus R of the other side, both from the 08:00 open with the 40 pip stop and the noon exit (idea CO's control;
the other side is computed by the tool the next morning, so the rule never needs anything it does not have).
MONITOR at 07:00 on day t = the average side advantage of the last N completed A2 days (t-N .. t-1), whether those days were traded live or on paper.
- If the monitor is BELOW 0.00R: A2 is not traded at full size that day (variant: paused = on paper only; or half size).
- If it is at or above 0.00R: A2 is traded as usual. No other condition, no discretion. Until N days exist, A2 is traded as usual.
The threshold is zero because zero is what a coin is worth; I do not fit it.
Variants (3): MO1 N = 40, PAUSE (paper only).   MO2 N = 40, HALF size.   MO3 N = 60, PAUSE.
Worked case of the arithmetic: 40 days of which 39 average +0.10R and one is 06-23's -2.11R -> (39 x 0.10 - 2.11) / 40 = +0.045R -> trade as usual.
If the 39 average 0.00R -> -0.053R -> below zero -> pause (MO1, MO3) or half size (MO2) that day.
From RG's print: the last 62 days average +0.044R and May-June -0.073R, so I expect the 40-day monitor to be below zero today; the tool will say since when.

## The four tests
(1) REAL HISTORY, 01-06 .. 06-29 (125 days): A2's net R with each variant against A2 always.
(2)-(4) BUILT WORLDS: 2,000 runs of 500 trading days, each day drawn (as a pair: my side's R and the other side's R of the same real day) from a pool:
    ALIVE pool = all my real days (the whole record; my side averages about +0.28R, side advantage about +0.5R);
    DEAD pool = the days from 05-01 on (my side about -0.07R, side advantage about -0.07R).
    (2) ALIVE throughout. (3) DEAD throughout. (4) SWITCH: 250 days alive, then 250 days dead.
    Measured in R at full size = 1 (pause = 0, half = 0.5): total R and maximum drawdown in R, medians over the runs, and the share of days not at full size.
    The money rules (half size at 3%, stop at 7%) are NOT in this simulation: this test asks what the monitor adds or costs by itself.

## Kill test (one failure kills the variant)
- K1 false alarms: in the ALIVE world the variant keeps at least 85% of A2-always's median total R.
- K2 protection: in the DEAD world its median maximum drawdown is at most 70% of A2-always's.
- K3 the fade: in the SWITCH world its median total R is HIGHER than A2-always's.
- K4 real history: its net R is not more than 1.0R below A2-always's.
Worked case for the lines: ALIVE: A2-always about 500 x 0.28 = +140R; a variant that is off 5% of the days and loses those days' average keeps about
95% -> K1 pass. SWITCH: second half about 250 x -0.07 = -17R for A2-always; a variant paused 60% of that half loses about -7R -> about 10R higher -> K3 pass.
DEAD: with a true average of -0.07R the 40-day monitor (known to about 1.8 / sqrt(40) = 0.28R) is below zero only about 60% of the time, so the variant
still trades 40% of a dead rule's days: I expect the drawdown cut to be near the 70% line - K2 is the line I am least sure of.

## What a survivor is, and is NOT (coach: backtest first, then lived days as the out-of-sample check)
A survivor does NOT go live. It becomes a PRE-SET PAPER RULE from tomorrow: every morning the monitor is computed by the tool and written in the call
with the state it would put A2 in; the live trade is unchanged. OUT-OF-SAMPLE JUDGING, fixed now: after 60 lived days from 06-30, the variant goes
to the coach as a proposal only if (a) over those 60 days its R is not below A2-always's by more than 1.0R, and (b) on the days it had A2 off or at half,
A2 averaged below +0.10R. Otherwise it is closed. Until then the account's survival rests on what is already live: the size rule (half at 3%, stop at
7%), which GD showed caps a dead edge at about 5-6% whatever the cause.
If all three variants are killed: I say so, nothing changes, and the size rule and the worry lines remain the whole answer to a fading edge.
Worked expectation, written now: real history - the monitor goes below zero somewhere in late May or June and saves 1-3R: K4 pass. ALIVE: about 4% of
days off, K1 pass. SWITCH: K3 pass. DEAD: MO1 near the K2 line, MO2 (half size) FAILS K2 (it only halves), MO3 slower than MO1.
Counts when run: idea 93, variants 259-261.
