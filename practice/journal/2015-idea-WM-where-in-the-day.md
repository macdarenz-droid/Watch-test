# Idea WM: did the 3-day direction stop paying, or did it move to another part of the day? PRE-REGISTERED BEFORE ANY CODE
Clock Wed 2015-07-08 01:00 London (end of released data). After funded day 73. Coach 07-07: "pick your next backtest: something new about the market, not sizing again."
July goal: a worked case before every pushed number or rule; every file write read back.

## The question, and why it is new
RG showed that from about mid-April the 3-day direction is worth nothing over a coin BETWEEN 08:00 AND 12:00. My notes of the last weeks keep saying a
second thing: the move came, in my direction, AFTER I was out - 06-17 (the evening), 06-23 (the day ended about 90 pips under my entry), 06-26 ("the
fall came after noon"), 07-01 (stopped; the day closed 88 pips under my sell). Notes are the days I remember. The market question behind them:
is the 3-day direction now right about a DIFFERENT four hours of the day?
What is known: idea AF (04-2x, history to April): the afternoon in the signal's direction lost (-0.11R a trade; "the edge is 08:00-12:00 only; night
0.00R"). That was the first half of the history. Nobody has looked at the second half by time of day.

## What is measured (the same control as CO / RG, moved through the day)
For a window starting at hour H (London): on every A2 day, both sides are traded from the open of H with a 40 pip stop and closed 4 hours later,
costs on. SIDE ADVANTAGE of the window = R of the 3-day signal's side minus R of the other side. The signal is the day's own (22:00 closes), as for A2.
Reference, already known: the 08:00 window (A2 itself): first half about +0.98R a day, second half about +0.04R.
Variants (3 other windows): WM1 12:00-16:00; WM2 16:00-20:00; WM3 04:00-08:00 (the hours before my trade).
Halves by date as in RG.

## HYPOTHESIS: in the second half of the history the 3-day direction pays in one of the other windows
Kill lines (each window, on the SECOND half; one failure kills it):
- K1 size: mean side advantage at least +0.30R a day.
- K2 chance: a sign-flip test (the side advantage of each day multiplied by a random +1 / -1, 20,000 times) gives p < 0.05 for a mean this high.
- K3 both quarters: positive in the first AND the second half of the second half.
- K4 it is a MOVE, not a general property: the same window was NOT already this good in the first half (first-half mean below the second-half mean).
Four windows are on the table (three new + the reference): the claim survives only if a window passes all four AND its p is under 0.0125.
Worked case for the lines: 65 days with a mean of +0.30R and a standard deviation of about 1.8R: the mean is known to about 1.8 / sqrt(65) = 0.22R,
so +0.30R is 1.3 of those: p about 0.09: K2 FAILS. To pass with 65 days the window needs about +0.45R a day or more.
MECHANICS CHECK: the same code at H = 8 must reproduce my side of engine A2 exactly (largest difference per day printed).
What each outcome means: SURVIVES -> a paper line for that window (never live; a second trade in the day would need its own plan), judged on forward days.
KILLED -> the direction has not moved to another hour that I can find; my notes about afternoons are the days I remember. Either way no live change.
Worked expectation: the afternoon window positive but small in the second half (+0.1R to +0.25R), failing K1 or K2; the evening and the early
morning near zero. All three KILLED.
Counts when run: idea 99, variants 277-279.

## Mechanics check (kill lines pushed first in commit 07912d4)
The 08:00 window's signal side against the engine's A2: largest difference per day 0.000R on 131 days.
`--check 2015-07-01` (my sell): 08:00 window -1.00R, side advantage -0.60R (as logged that day); 12:00 window 0.00R; 16:00 window +1.50R: the day I
remembered as "the move came after I was out" is in the table as exactly that.

## RESULTS (one run: `python bt/window_of_day.py 2015-07-08`; halves 01-06 .. 04-06 / 04-07 .. 07-07; 20,000 sign flips; figures copied from the print)
| window (London) | FIRST half (65 days): side advantage a day | SECOND half (66 days): side advantage | signal side's own R a trade, second half | quarters of the second half | sign-flip p |
|---|---|---|---|---|---|
| reference 08:00-12:00 (A2) | +0.942R | -0.020R | -0.041R | +0.133 / -0.172 | 0.53 |
| WM1 12:00-16:00 | -0.351R | +0.046R | +0.058R | +0.080 / +0.011 | 0.43 |
| WM2 16:00-20:00 | -0.112R | -0.120R | -0.098R | -0.083 / -0.157 | 0.74 |
| WM3 04:00-08:00 | +0.020R | -0.210R | -0.130R | -0.082 / -0.338 | 0.89 |
| line (second half) | WM1 12-16 | WM2 16-20 | WM3 04-08 |
|---|---|---|---|
| K1 at least +0.30R a day | FAIL (+0.046) | FAIL | FAIL |
| K2 sign-flip p < 0.05 | FAIL (0.43) | FAIL | FAIL |
| K3 positive in both quarters | PASS | FAIL | FAIL |
| K4 better than in the first half | PASS | FAIL | FAIL |
VERDICT: all three KILLED. The 3-day direction has not moved to another part of the day.

## Expectation against the run
"The afternoon positive but small (+0.1R to +0.25R)": +0.05R - smaller still. "Evening and early morning near zero": -0.12R and -0.21R. All killed: yes.

## What this says about the market
- Since April the 3-day direction is worth nothing at ANY hour I can test: -0.02R in my window, +0.05R in the afternoon, -0.12R in the evening,
  -0.21R before the bell. It did not move; it went.
- My notes ("the move came after I was out") were true of the days I wrote them on - 07-01 is in the check, +1.50R in the evening window - and are
  not a pattern: over 66 days the afternoon and evening windows together are about zero for the signal's side.
- A fact about the FIRST half I had not seen in this form: from January to early April the direction paid +0.94R a day in the morning and was
  NEGATIVE in the afternoon (-0.35R): the morning's move was partly given back after noon. That is why the noon exit was so good then, why idea N
  (fade the morning in New York) passed its first build - and why it then died: since April the afternoon is +0.05R, no fade left either.
  Both things my record was built on - the morning with the signal, the afternoon against it - belong to the same three months.
- So the market since April, as far as my tools can describe it: days as large as before (June review), no multi-week direction, and a three-day
  lookback that says nothing about any four hours of the next day. This closes the question "is it just my window?". It is not the window.
- What it means for me: nothing new to do. The size is 0.16 lots by rule v3; W1 and W4 are the lines; MO is on paper and has had A2 off for six
  days. The next honest question about the market is not "where did the edge go" but "what, if anything, tells days of direction from days of
  range in advance" - and EF, VL, WD, BS, PZ have each answered "nothing I can measure" for one candidate.
Counts: ideas 99, variants 279 (WM1, WM2, WM3). Adopted trading ideas: 0. Rule change today by my own kill line (not an idea adopted from a test of
the market): size rule v3. July: numbers corrected after a push: 1; file errors found late: 0.
