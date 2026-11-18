# Idea MPG: the moving-average pullback, re-registered with a count grid (idea 137; coach 08-17: "finish setting up your current backtest
# prereg, then trade monday ... before running outcomes"). Written Mon 2015-08-17 before the 07:00 call, before any outcome.

## Why a re-registration is allowed here
MP (idea 136) was killed for sample with `test` NEVER run: no MP outcome has been seen. Its file named the fix (a count grid with a choosing
rule written first). Everything else is MP's rule, unchanged: H1 SMA20; rising = SMA20 now minus SMA20 five hours earlier >= S pips;
long when rising, the candle's low touches the SMA20 and the candle closes above it (short the mirror); signal candles 07:00-16:00 London;
next H1 open; stop 20; out 3 hours after entry; one position at a time; costs 1.0 + 0.1; stressed 2.0 + 0.5.
DATA END FIXED NOW: history before 2015-08-15 (the same data MP was counted on). Monday 08-17 and later are not in this test.

## Order of work
Step 1 counts only for S = 0, 3, 5 (S = 5 is MP's own count: 115). Step 2: S = the LARGEST grid value with 120+ trades and 50+ from 04-07;
none -> killed for sample. Step 3: one outcome run, only AFTER Monday 08-17's paper day is journaled (coach).
THE THREE VARIANTS (named now): MPG1 (judged) the chosen S; MPG2 (dose) S = 15 (MP's dose line, unchanged); MPG0 (control) MPG1's
signals traded the other way.
## Kill lines (four, MP's, unchanged): K1 average >= +0.10R. K2 net above zero before 04-07 AND from 04-07. K3 stressed average above zero.
K4 MPG1 minus MPG0 above zero, sign-flip p < 0.05. Any pass is provisional until it holds on lived days (plan section 9).

## Step 1, counts only (tool `python bt/ma_pullback_grid.py 2015-08-15 grid`; no outcomes)
S = 0: 183 trades (72 before 04-07, 111 from) on 116 days. S = 3: 145 (55 / 90) on 104 days. S = 5: 115 (41 / 74) on 86 days.
## Step 2, by the line written first: largest S with 120+ and 50+ from 04-07 = **S = 3** (145 / 90). MPG1 = slope 3; MPG2 = slope 15; MPG0 = control.
Script check before any outcome: my first copy of the script stored all three variants under one key ("MPG"), which would have made the
control comparison K4 compare MPG1 with itself. Fixed (keys MPG1 / MPG2 / MPG0) before the run; found by reading the script's lines back.
Outcome run: `MPG_S=3 python bt/ma_pullback_grid.py 2015-08-15 test`, AFTER Monday 08-17 is journaled.
Worked case (read from its own window's candles, written after Monday was journaled, before the outcome run): Fri 08-14, the 07:00 H1
candle touched a rising SMA20 and closed above it -> MPG1 BUYS at the 08:00 open (1.11630 bid + spread), stop 20 below (about 1.11441).
The window 08:00-11:00 had a low of 1.11242, below the stop: a FULL STOP, about -1.0R. (A2's 40-pip paper stop that morning survived by 1.3 pips.)

## Step 3, result (one run: `MPG_S=3 python bt/ma_pullback_grid.py 2015-08-15 test`)
Hand check 08-14: MPG1 bought 1.11641 and was stopped at 1.11429, -1.06R, as worked out from the window; the control sold 1.11629, out 11:00 at 1.11511, +0.59R.
| variant | trades | wins | avg R | net | stops | before 04-07 | from 04-07 | stressed avg |
|---|---|---|---|---|---|---|---|---|
| MPG1 pullback to a rising SMA20, slope 3 (JUDGED) | 145 | 35% | +0.011 (+-0.24) | +1.62 | 74 | -0.08 | +1.70 | -0.092 |
| MPG2 the same, slope 15 | 41 | 46% | +0.399 (+-0.54) | +16.35 | 19 | +1.67 | +14.67 | +0.316 |
| MPG0 against MPG1's signals (control) | 145 | 34% | -0.119 (+-0.25) | -17.29 | 78 | +11.97 | -29.27 | -0.224 |
MPG1 minus MPG0 +0.130R (sign-flip p 0.51). MPG1: all four kill lines FAIL. **MPG IS KILLED.**
What I learned: 1. Buying the touch of a gently rising average is a coin (+0.011R) that loses at stressed costs. 2. MPG2 (+0.399R on 41
steep-trend pullbacks) is the dose line and the second "hint" in a week (after EN2). 41 trades, an error of +-0.54R, almost all after
04-07: it says almost nothing. I note it and do NOT start a second forward line: EN2 is waiting its turn behind SW1, one line at a time.
3. The fixed data end and the order (prereg, count, fix the key bug, journal Monday, then run) worked as written.
Counts: idea 137; variants 365-367; second setups tried 33, none alive.
