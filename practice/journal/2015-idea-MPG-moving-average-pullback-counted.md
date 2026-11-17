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
