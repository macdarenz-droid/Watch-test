# Idea DH: "drive and hold" (idea 102; coach 07-10: biggest winners March-June by eye -> one rule, cases before outcomes)

Written Fri 2015-07-10 22:00 London (weekend), BEFORE any code. History available to me: 2015-01-02 .. 2015-07-10 only.

## 1. The by-eye review (study, not the test)
The 12 biggest A2 winners of March-June (engine list): 06-04 +2.95, 03-23 +2.58, 05-19 +2.18, 03-06 +2.11, 03-11 +1.97, 04-13 +1.96,
04-30 +1.88, 04-17 +1.73, 03-10 +1.72, 04-28 +1.65, 04-10 +1.60, 06-16 +1.59. Charts: M15, previous day 12:00 -> trade day 20:00.
What I see (by eye, sizes read off the chart, so rough):
1. DRIVE: on 8 of the 10 days where the chart shows the afternoon before, yesterday 12:00-20:00 London made a one-way move in the trade's
   direction (06-04 ~150 pips, 05-19 ~110, 04-10 ~130, 04-30 ~115, 04-17 ~70, 03-11 ~40, 04-28 ~40, 03-06 ~35). Not 03-10 (flat) and not
   06-16 (the afternoon went 80 pips AGAINST the sell). 03-23 and 04-13 are Mondays; my chart did not show Friday afternoon.
2. HOLD: the night after the drive was narrow and flat and gave back little of it (04-10 gave back the most, under half by eye).
3. The 07:00-08:00 hour often dipped against the trade first (06-04, 03-23, 04-13, 04-17, 03-10, 06-16). Close to BS/PH2 ground: not used.
Honest doubts written before counting anything:
- These are A2 winners, and yesterday's afternoon is part of the 3-day gap, so "drive in my direction" may be nothing but the A2 signal
  seen close up. The base rate on ALL days decides, and I count it before any outcome.
- 12 hand-picked days. Things tested near this: NY-afternoon direction for the NIGHT trade (killed), 1-day and 3-day direction for the
  morning, DF (fade yesterday's whole day, killed by a sign flip). NOT tested before: yesterday's afternoon drive + a holding night as
  the direction for 08:00-12:00.
- RG/WM: every direction idea worked in the morning before 04-07 and none after. A rule that only works before 04-07 earns nothing back.

## 2. The rule (one setup; London time)
- drive = open of the 20:00 M5 bar minus open of the 12:00 M5 bar of the previous trading day, in pips (Monday uses Friday).
- kept  = (open of today's 08:00 bar minus that 12:00 open) / drive. A holding night means kept >= 0.5 (at least half the drive is still there).
- DH1 (the judged rule): |drive| >= 30 pips and kept >= 0.5 -> at 08:00 market order in the drive's direction, stop 40 pips, close 12:00.
- DH2: the same with |drive| >= 50 pips (dose: a real trait should not get worse with a bigger drive).
- DH3: |drive| >= 30 pips with NO kept condition (does the holding night matter at all?).
Three variants, no more. Costs on (1.0 pip spread + 0.1 slippage); stressed run at 2.0 + 0.5. Risk unit as in every test ($125 = 1R).

## 3. Cases counted before outcomes
Step 1 (facts only, no trade results): count DH1/DH2/DH3 days in each part, and how often the DH1 direction equals the A2 direction; how
many of the 12 inspiring days are DH1 days against the share of ALL days that are DH1 days in A2's direction.
Parts: P1 = 01-05..02-27 (never looked at for this; old regime). P2 = 03-02..04-06 (inspiring months, old regime).
P3 = 04-07..07-10 (after the regime change; holds 8 of the 12 inspiring days).
The 12 inspiring days are DROPPED from every judged number.
If DH1 has fewer than 40 judged cases in all, or fewer than 15 in P3: NOT JUDGEABLE = killed for sample, without looking at outcomes.

## 4. Kill lines (DH1 must pass ALL; written before the run)
K1 average >= +0.10R per trade over all judged cases, after costs.
K2 net R above zero in P1 AND in P3 (each on its own). P3 is the one that matters for earning anything back.
K3 net R still above zero without its best two trades.
K4 better than the other side: mean of (DH side R minus opposite side R) above zero with a sign-flip p below 0.05 (10,000 flips).
K5 stressed costs: average still above zero.
K6 max drawdown <= 6R.
K7 dose: DH2 average >= DH1 average; and DH1 average >= DH3 average (else the holding night adds nothing and the picture was a story).
K8 not A2 in disguise: on days where DH1 and A2 point the same way the result tells me nothing new; DH1 must also be above zero on its
   own in P3, where A2 was about zero. (K2 already demands it; here I only report the split agree/disagree with A2.)
Pass = candidate for route B step B1 only on paper: with ~6 months of history the "never-looked-at part" is ~40 days; a pass here would
still need the 40 forward paper trades of B2. A fail = killed; no fourth variant, no re-cut of the parts.
Multiple looks: this is idea 102 on the same 6 months. One pass at p<0.05 is expected by luck every ~20 ideas; I will say so if it passes.

## 5. Worked case and counts (filled in from the tool BEFORE the test run)
Tool: `python bt/drive_hold.py 2015-07-11 count` and `... check 2015-06-04` (facts only; no trade result computed or seen yet).
- WORKED CASE 06-04: 06-03 12:00 open 1.11214, 20:00 open 1.12514 -> drive +130.0 pips; 06-04 08:00 open 1.12391 ->
  kept = (1.12391 - 1.11214) / 0.01300 = 0.905 -> DH1 yes, DH2 yes, DH3 yes -> BUY at 08:00, stop 40, out 12:00. (A2 also said buy.)
- CORRECTION OF MY EYE by the tool: I wrote "8 of 10 had the drive". The tool: 7 of the 12 are DH1 days in A2's direction, 1 is a DH1
  day against A2 (06-16), 4 are not DH1 days (03-06 drive only -22.7; 03-10 -5.3; 04-13 +23.7 and against the sell; 04-17 kept 0.43).
- BASE RATE: of the 87 A2 days of March-June, 32 = 37% are DH1 days in A2's direction. Among the 12 best: 7 = 58%. That is 7 where
  about 4.4 would be expected by the base rate: a lean, from 12 hand-picked days. Not much. Written before the outcomes.
- CASES (inspiring days dropped): 135 days with facts. DH1 58 judged (P1 19, P2 10, P3 29); DH2 40 (9 / 8 / 23); DH3 70 (22 / 14 / 34).
  DH1 points the same way as A2 on 35 of 57 days. Judgeable by my line (>= 40 in all, >= 15 in P3): yes. P1 with 19 cases can kill, not prove.

## 6. Result (one run, after the lines above were pushed)
