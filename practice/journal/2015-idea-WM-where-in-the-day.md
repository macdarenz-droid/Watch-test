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
