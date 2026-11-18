# Idea BH (idea 68): no trade after a BIG pre-entry hour - PRE-REGISTRATION (pushed before any code or run)
Sim clock Thu 2015-05-28 01:00 London (unchanged: the replay was study and earned no day). END 2015-05-28: all my history before the clock, costs on.
Coach 05-27: "your blind spot (big pre-entry hour, 4 cases 0 wins) is a fine one: write the hypothesis and kill line first, test it on all your history
before your clock with costs on and the variant count updated, then results table in the journal."
## What I already know (contamination, stated before anything else)
From yesterday's replay table, all 102 A2 days: pre-entry hour (07:00-08:00 London) range of 60 pips or more = 4 trades (03-12 -0.12R, 03-19 -1.03R,
03-27 -1.00R, 04-24 -1.03R), 0 wins, -3.18R, 3 full stops; 80 or more = 3 trades, -2.18R; the 45-60 pip bucket = 16 trades, +0.424R.
So for the 60 pip line I know the skipped trades' total before I run anything. What I do NOT know: the result of the filtered rule as a whole
(net, drawdown, both halves), the 50 and 70 pip neighbours, and the mechanism check below. This test cannot "discover" the 60 pip result; it can
only tell me whether it is a clean, robust, big-enough thing or four trades with a story.
## Hypothesis
When the hour before my entry has ranged 60 pips or more (one and a half times my stop), the 40 pip stop is inside the morning's noise and A2 has no
edge: those trades lose, and leaving them out costs nothing.
## Variants (3; A2 unchanged on all other days; the range is known at 08:00, before the order; no trade that day = 0R)
- BH1: no trade when the pre-entry hour ranged 60 pips or more.
- BH2: the same at 50 pips or more (neighbour below).
- BH3: the same at 70 pips or more (neighbour above).
## Kill lines (all A2 days before 2015-05-28, costs on; one failure kills; written for BH1, the neighbours serve K3)
- K1: the skipped trades average -0.50R or worse. (Merely weak is not enough: PH's 30 pip line was "merely weak" and failed.)
- K2: the filter costs no money: net R of BH1 >= A2's net R, and max drawdown not larger.
- K3 robustness: the skipped groups of BH2 (50+) and BH3 (70+) also average below 0R. If a 10 pip change of the line flips the sign, I found a number.
- K4 SAMPLE: at least 10 skipped trades. Under 10 the verdict is "TOO THIN" whatever K1-K3 say: no rule, no paper tag, the counts-only line goes on.
  Said plainly now: there are 4. Thirty cannot be reached and ten cannot either; I expect this line to decide the test, and I am not lowering it
  to fit - it is the same line TW3 failed last week.
- K5 lived days (the coach's bar of 05-26): reported - how many of the skipped trades are lived days (from 03-02), and their average there.
## Mechanism reading (NOT a kill line; the one thing here I have not seen)
If "the stop is inside the noise" is the true story, the same four trades with an 80 pip stop at the same $ risk (engine variant S80) should lose
clearly less than with 40 pips. If they lose about as much, the mornings were simply wrong in direction and my story about noise is decoration.
Written now: "noise" if the four S80 results average at least 0.30R better than the four A2 results; otherwise "direction".
Hand-check before totals: the pre-entry range of two of the days against the figures in my journal (03-19: 115.3; 04-24: 83.0).
My guess: BH1 passes K1, K2, K3 and fails K4 -> TOO THIN. Mechanism: I do not know; I lean "noise" and write that I lean.

## Mechanics hand-check (`python bt/big_pre_hour.py 2015-05-28 --check 2015-03-19,2015-04-24`)
03-19: pre-entry hour 115.3 pips, A2 -1.03R. 04-24: 83.0 pips, A2 -1.03R. The figures of yesterday's replay table.

## Results (run once; `python bt/big_pre_hour.py 2015-05-28`; costs on; figures copied from the print)
A2: 102 days, net +34.84R, +0.342R a trade, max DD 3.75R; before 03-02 +19.56R, from 03-02 +15.28R.
| variant | skipped trades | wins | avg R of skipped | net of skipped | full stops | lived days among them | rule net R (vs A2) | max DD | before 03-02 / from 03-02 |
|---|---|---|---|---|---|---|---|---|---|
| BH1 no trade at 60+ pips | 4 | 0 | -0.795 | -3.18 | 3 | 4 (-0.795R) | +38.02 (+3.18) | 3.75R | +19.56 / +18.46 |
| BH2 no trade at 50+ pips | 14 | 7 | +0.115 | +1.60 | 5 | 13 (+0.040R) | +33.24 (-1.60) | 3.57R | +18.47 / +14.76 |
| BH3 no trade at 70+ pips | 4 | 0 | -0.795 | -3.18 | 3 | 4 (-0.795R) | +38.02 (+3.18) | 3.75R | +19.56 / +18.46 |
Skipped days of BH1 (= BH3; there is no day between 60 and 80 pips): 03-12 (85 pips) -0.12R; 03-19 (115) -1.03R; 03-27 (80) -1.00R; 04-24 (83) -1.03R.
The ten days BH2 adds (50 to 59 pips): 02-05 +1.09, 03-24 +0.73, 04-17 +1.73, 04-30 +1.88, 05-01 +0.45, 05-05 +0.87, 05-11 -1.03, 05-14 +0.53, 05-20 -1.00,
05-26 -0.46 = 7 wins in 10, +4.79R.

## Kill lines for BH1
| line | result | verdict |
|---|---|---|
| K1 skipped trades average -0.50R or worse | -0.795R | PASS |
| K2 costs no money (net >= A2, DD not larger) | +3.18R, DD 3.75R = 3.75R | PASS |
| K3 neighbours: skipped groups at 50+ and 70+ both below 0R | 70+: -0.795R (the same four trades); 50+: +0.115R | FAIL |
| K4 sample: at least 10 skipped trades | 4 | FAIL |
| K5 lived days (reported) | all 4 are lived days, -0.795R | - |
VERDICT: BH1 is KILLED on K3 and TOO THIN on K4. No rule, no paper tag. A2 trades these mornings as before.

## Mechanism reading
By the rule I wrote: the four days at an 80 pip stop (same $ risk) average -0.389R against -0.795R: difference +0.406R -> "noise".
I do NOT accept my own reading, and say why: I wrote the rule in R without thinking that at an 80 pip stop one R is twice as many pips, so the same
pips lost count half. In pips: 03-12 about -5 either way; 03-19 -12 pips at noon instead of -41 at the stop (better); 03-27 about -49 pips instead of
-40 (WORSE); 04-24 about -59 pips instead of -41 (WORSE). Two of four were worse with room to breathe: those mornings were wrong in direction, not shaken
out. Honest reading: MIXED, one clear noise case (03-19). The reading rule was badly designed - the same species as P7 (a line not worked by hand before
it was pushed). It was not a kill line and changes no verdict; logged as process mistake P9.

## My guess against what happened
"BH1 passes K1, K2, K3 and fails K4": K3 failed too. I had not looked at where 50 pips falls and assumed the neighbour would agree.

## What I learned
- The 60 pip line is a number, not a finding. Move it 10 pips down and the group it removes is a WINNING group: the ten mornings with a 50 to 59 pip
  hour before entry made +4.79R with 7 wins - including two of my best days of April (+1.73R, +1.88R). Above 60 pips there are four trades, all in six
  weeks of March and April, none since. A threshold that only works where I drew it, on four trades I had already seen, is exactly what the coach
  warned about on 05-26.
- The 70 pip neighbour taught nothing (the same four trades). With so few cases even my robustness check was half empty.
- What remains true and small: four mornings with an 80+ pip hour before entry, four losses. I keep counting (the counts-only line of yesterday stays,
  look at 10 cases), and I correct its wording: it is "80 pips or more" that has no winner; "60" was my rounding of where the data happened to break.
- The replay found this; the test took it apart in one run. Study gives me things to test; it does not give me rules. That is the order the coach set.
Counts: ideas 68, variants 189 (BH1 BH2 BH3). Adopted trading ideas: 0. On paper: UN3, PH2, MB1. Process mistakes: 9.
