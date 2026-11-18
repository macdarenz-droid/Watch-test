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

## Mechanics check (rule and kill test pushed first in commit b6fb05e)
My side against the engine's A2: largest difference per day 0.000R on 125 days. The rolling-weight function, by hand on six days
(+1, -2, -1, +3, -5, +1 with N = 2): days 3, 4 and 6 off, day 5 on - the script printed exactly that before any result was read.

## RESULTS (one run: `python bt/side_monitor.py 2015-06-30`; figures copied from the print)
(1) REAL HISTORY 01-06 .. 06-29 (125 days): A2 always +32.05R, max drawdown 5.40R.
| variant | net R | against A2 always | max DD | days not at full size | A2 on those days |
|---|---|---|---|---|---|
| MO1 N=40 pause | +33.15R | +1.10R | 4.54R | 5, all in June (first 06-11, last 06-29) | -1.10R |
| MO2 N=40 half | +32.60R | +0.55R | 4.85R | the same 5 | -1.10R |
| MO3 N=60 pause | +32.05R | 0.00R | 5.40R | 0 | - |
Pools: ALIVE = all 125 days (my side +0.256R a day, side advantage +0.495R); DEAD = the 42 days from 05-01 (my side -0.093R, side advantage -0.112R).
(2)-(4) BUILT WORLDS, 2,000 runs x 500 days, medians:
| world | policy | total R (10th pct) | max drawdown | days not at full size |
|---|---|---|---|---|
| ALIVE | A2 always | +128.1R (+97.8) | 7.8R | - |
| ALIVE | MO1 / MO2 / MO3 | +123.5R / +125.9R / +126.3R | 7.8R / 7.6R / 7.8R | 4% / 4% / 1% |
| DEAD | A2 always | -46.5R (-75.7) | 55.1R | - |
| DEAD | MO1 / MO2 / MO3 | -19.0R / -33.3R / -18.6R | 25.3R / 40.6R / 24.6R | 60% each |
| SWITCH (250 alive, 250 dead) | A2 always | +40.9R (+10.2) | 31.8R | - |
| SWITCH | MO1 / MO2 / MO3 | +52.3R / +46.2R / +53.5R | 15.8R / 24.1R / 15.8R | 31% / 31% / 30% (3% / 3% / 1% of the alive half; 59% / 59% / 58% of the dead half) |
| line | MO1 N=40 pause | MO2 N=40 half | MO3 N=60 pause |
|---|---|---|---|
| K1 ALIVE keeps at least 85% | PASS (96%) | PASS (98%) | PASS (99%) |
| K2 DEAD drawdown at most 70% of A2's | PASS (46%) | FAIL (74%) | PASS (45%) |
| K3 SWITCH total higher than A2's | PASS (+11.4R) | PASS (+5.4R) | PASS (+12.6R) |
| K4 real history not more than 1R worse | PASS (+1.10R) | PASS (+0.55R) | PASS (0.00R) |
VERDICT: MO1 and MO3 SURVIVE the kill test. MO2 (half size) is KILLED on K2: halving a dead rule only halves the damage.

## Expectation against the run
Real history "saves 1-3R": +1.10R (MO1). ALIVE "about 4% of days off": 4%. SWITCH pass: yes. DEAD "MO1 near the 70% line": WRONG - 46%, well inside:
I had the monitor off 60% of the time right, and forgot that the drawdown is cut by more than the share of days. "MO2 fails K2": yes. "MO3 slower": it is
not slower in the built worlds; on real history it has not triggered at all yet.

## What the survivors are worth - read strictly
- For: the cost of false alarms is small (4-5R of 128R when the edge is alive) and the saving when the edge dies is large (a dead two-year run
  loses 19R instead of 46R; a switch run makes 52R instead of 41R with half the drawdown). The asymmetry is the reason to have such a rule.
- Against, not hidden: (1) REAL HISTORY has one fade and the monitor has been off for FIVE days of it. +1.10R on five days is nothing. Everything
  else in the table is my own days re-dealt: it shows that the rule does what its arithmetic says, not that the future looks like either pool.
  (2) In the DEAD world the monitor still LOSES 19R and still has a 25R drawdown - it is off only 60% of the time, because a 40-day average
  cannot tell -0.1R from +0.1R reliably. A 25R drawdown is 12.5% at my size. THE MONITOR IS NOT A SURVIVAL RULE. The survival rule is the one
  already live - half size at 3%, stop at 7% - which ends a dead run at about -5%. The monitor would only make the walk to that line slower and cheaper.
  (3) The DEAD pool is the 42 worst-defined days I have (chosen because they are the fade). A real dead edge might be 0.00R, not -0.09R.
  (4) Two variants of three passing lines that I wrote yesterday with the answer half in view (I knew June was bad) is weaker than it looks.
- So, exactly as written before the run: NOTHING GOES LIVE. MO1 and MO3 become PRE-SET PAPER RULES from the next live day. Each morning
  `python bt/side_monitor.py END --state` prints both monitors and the state each would put A2 in; it is written in the 07:00 call, before the entry bar;
  the live trade is A2 as always. The daily row goes in journal/MO-monitor-paper-rule.md.
- OUT-OF-SAMPLE JUDGING, as fixed before the run: after 60 lived days from 06-30 (about 09-21), a variant goes to the coach as a proposal only if (a) over
  those 60 days its R is not below A2-always's by more than 1.0R and (b) A2 averaged below +0.10R on the days the variant had it off. Otherwise closed.
- State for the next live day (tool): MO1 monitor -0.086R -> PAUSE on paper. MO3 monitor +0.011R -> as usual. LIVE: A2 at the size the size rule gives.
Counts: ideas 93, variants 261 (MO1, MO2, MO3). Adopted trading ideas: 0. On paper: UN3, PH2, MB1, MO1, MO3; forward count with a judging rule: GB1.
Numbers or rules corrected after a push in June: 3 (none today).
