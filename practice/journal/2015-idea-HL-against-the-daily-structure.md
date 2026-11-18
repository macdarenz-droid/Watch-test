# Idea HL: skip A2 when the daily lows (highs) are already turning against it (idea 150; coach 08-31: next backtest from my notes)
Written Mon 2015-08-31 22:00 London, before any count or outcome.
FROM MY NOTES: W06 (2015-02-02), carried from the W05 replay: "I sold into higher lows (Mon/Tue) and bought mid-range under resistance
(Fri). Hindsight, untested." The second half became idea C (midpoint; failed). The FIRST half was never tested.
Searched ("higher low", "lower high", "structure", "swing"): only a word in NT's prereg about nights. A2 reads 3-day CLOSES; this reads
daily LOWS for a sell and HIGHS for a buy - related but not the same fact (the XD lesson: check it does not just repeat A2; as a filter
on A2 it cannot be "A2 in disguise", but it can be empty if it never fires).

## Hypothesis
When A2 says sell but yesterday's low held above the day before's (buyers stepping in higher), the fall is tiring and A2's sell does worse;
mirror for buys under falling highs. Background, no source I can cite. Against it: SG/XS found stretched or small signals were NOT worse.

## Rule (an A2 filter; it changes only which days A2 trades; London days 22:00-22:00)
Steps against A2: for a SELL count rising lows in a row going back from yesterday (L1 > L2 = 1 step; also L2 > L3 = 2 steps);
for a BUY count falling highs (H1 < H2; H2 < H3). Skip A2 when steps >= N.
ORDER OF WORK: counts first for N = 1 and 2 (skipped days, before / from 04-07). N = the LARGEST that skips at least 15% of A2's days and
at least 25 days (the NC rule, reused unchanged). If neither does: killed for sample, no outcome run.
EXPECTED SAMPLE: about 160 A2 days; my guess N = 1 skips ~25-35%, N = 2 ~8-12% -> N = 1 likely.
THE THREE VARIANTS (named now): HL1 (judged) skip at the chosen N; HL2 (dose) skip at N = 2 (if the chosen is 2, HL2 = N = 3);
HL0 (control) skip when the steps go WITH A2 (falling lows for a sell / rising highs for a buy) >= the chosen N.
Power (once-a-day): a skipped group of 25-50 days has an error of about +-0.3R to +-0.4R. ANY PASS IS PROVISIONAL.
## KILL LINES (four, all must pass, for HL1). R = the engine's A2 R, after costs: spread 1.0 + slippage 0.1 pips (engine default).
K1 the skipped days' A2 average is below zero AND at least 0.30R below the kept days' average.
K2 the same sign (skipped below kept) before 04-07 AND from 04-07.
K3 HL1's kept-minus-skipped gap larger than HL0's.
K4 label shuffle (10,000) of HL1's gap: p < 0.10.
(No stressed-cost line: a filter only removes trades, each at A2's own costs; same frame as NC.)
My guess: K1 fails - A2's skipped days look like everyone else's.

## Counts (before outcomes; `python bt/daily_structure.py 2015-09-01 count`; 168 A2 days 01-08..08-31)
N = 1: skip 50 = 30% (21 before 04-07, 29 from) | control (with) 118. N = 2: 12 = 7% (6 / 6) | control 78. N = 3: 3 | control 44.
BY THE RULE WRITTEN FIRST: N = 1 (largest with 15%+ and 25+; N = 2 has 12). HL1 = 1, HL2 = 2 (12 days, dose only), HL0 = with >= 1.
Noted before the run: HL0 skips 118 of 168 (falling lows behind a sell are the normal case), so K3 compares a 50-day skip with a 118-day
skip. That is how it was written; I do not change it.
Worked case 08-31 (my hand reading of the call numbers, then the tool): A2 SELL; lows Tue 1.13968 > Wed 1.12914 > Thu 1.12030 > Fri 1.11559
= three falling lows, WITH the sell -> against 0, with 3 (tool: ag 0, wi 3). HL1 keeps the day.
One run next: `python bt/daily_structure.py 2015-09-01 test 1 2`.

## Result (one run; `python bt/daily_structure.py 2015-09-01 test 1 2`; R = the engine's A2 R AFTER COSTS spread 1.0 + slippage 0.1)
| variant | skipped: n, avg, net | kept: n, avg, net | gap (kept - skipped) | before 04-07 (skipped n) | from 04-07 (skipped n) |
|---|---|---|---|---|---|
| HL1 skip when 1+ step against A2 (JUDGED) | 50, +0.212, +10.59 | 118, +0.121, +14.22 | -0.091 | -0.155 (21) | +0.005 (29) |
| HL2 skip at 2+ steps (dose) | 12, +0.133, +1.60 | 156, +0.149, +23.22 | +0.016 | -0.310 (6) | +0.461 (6) |
| HL0 skip when 1+ step WITH A2 (control) | 118, +0.121, +14.22 | 50, +0.212, +10.59 | +0.091 | +0.155 (42) | -0.005 (76) |
A2 on all 168 days +24.82R; with HL1 +14.22R. HL1 shuffle p 0.712.
Kill lines, each value against its threshold (HL1):
K1 skipped average below zero AND 0.30R+ below kept: skipped +0.212R (above zero), gap -0.091R -> FAIL.
K2 same sign (skipped below kept) before AND from 04-07: -0.155 / +0.005 -> FAIL.
K3 HL1's gap larger than HL0's: -0.091 vs +0.091 -> FAIL.
K4 shuffle p < 0.10: 0.712 -> FAIL.
VERDICT: KILLED on all four (idea 150; variants HL1 HL2 HL0 counted). The W06 note was wrong: A2's sells into higher lows (buys under lower
highs) made MORE than its other days (+0.212R vs +0.121R). At N = 1 the control is just the other side of the same split (every day has
either a higher or a lower low), which I should have seen at the counts; it changes nothing in the verdict.
