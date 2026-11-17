# Idea TH: three hourly candles in a row the same way (idea 140; coach 08-19: next backtest). Written Wed 2015-08-19 22:00 London, before any count or outcome.
Searched ("in a row", "consecutive", "three hours"): only losing-streak statistics, never a run of same-direction hours as a setup.
Not EN/IB/PN (single-candle shapes) and not SF (one sharp 15-minute candle): TH is a steady run over three hours.

## Hypothesis
Three hourly candles closing the same way with a clear total move show steady pressure, not a burst; the next two hours carry on.
Against it: since April moves come back (MC, AR), and every follow rule lost after 04-07.

## Rule (London time; H1 candles; the third candle ends between 08:00 and 16:00; one position at a time)
Run = three consecutive H1 candles all closing up (or all down), and the move from the first one's open to the third one's close >= M pips.
Entry at the next H1 open WITH the run, stop 20, out 2 hours after entry.
## Order of work: step 1 counts only for M = 15, 25, 35. Step 2: M = the LARGEST grid value with 120+ trades and 50+ from 04-07
(several-a-week line); none -> killed for sample. Step 3 one run.
THE THREE VARIANTS (named now): TH1 (judged) the chosen M; TH2 (dose) the next larger M (or 45 if the chosen is 35); TH0 (control) TH1's
signals faded.
## KILL LINES (four, all must pass, for TH1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 TH1's average R >= +0.10R.
K2 TH1's net R above zero BOTH before 04-07 AND from 04-07.
K3 TH1's average R at stressed costs above zero.
K4 TH1 minus TH0, trade by trade, above zero with sign-flip p < 0.05.
My guess: positive before 04-07, negative after (K2 fails).

## Step 1, counts only (tool `python bt/three_hours.py 2015-08-20 grid`)
M = 15: 235 trades (95 before 04-07, 140 from). M = 25: 205 (84 / 121). M = 35: 167 (65 / 102).
## Step 2: largest M with 120+ and 50+ from 04-07 = **M = 35** (167 / 102). TH1 = 35, TH2 = 45 (as written), TH0 = fade at 35.
Worked case read from its own window (R after costs 1.0 + 0.1): Tue 08-18, three down hours ending with the 13:00 candle -> TH1 SELLS at the
14:00 open (bid 1.10315), stop 20 above (about 1.10515 on the ask). The window's high 1.10467 (+1 pip spread) stays under it; out at the
16:00 open 1.10334 + spread: about -3 pips = about -0.15R.

## Step 3, result (one run: `TH_M=35 TH_M2=45 python bt/three_hours.py 2015-08-20 test`)
Hand check 08-18: TH1 sold 1.10314, out 16:00 at 1.10345, -0.155R (worked: about -0.15R). As written.
| variant (R after costs: spread 1.0 + slippage 0.1 pips; stressed 2.0 + 0.5) | trades | wins | avg R | net | stops | before 04-07 | from 04-07 | stressed avg |
|---|---|---|---|---|---|---|---|---|
| TH1 with the run, M 35 (JUDGED) | 167 | 31% | -0.264 (+-0.17) | -44.10 | 94 | -22.14 | -21.96 | -0.352 |
| TH2 with the run, M 45 | 121 | 28% | -0.327 (+-0.21) | -39.52 | 76 | -18.31 | -21.21 | -0.416 |
| TH0 against TH1's signals (control) | 167 | 44% | +0.000 (+-0.18) | +0.07 | 73 | +8.72 | -8.65 | -0.078 |
Kill lines, each against its written threshold:
K1 TH1's average >= +0.10R: -0.264R. FAIL.
K2 TH1's net above zero before AND from 04-07: -22.14R / -21.96R. FAIL.
K3 TH1's stressed average above zero: -0.352R. FAIL.
K4 TH1 minus TH0 above zero, p < 0.05: -0.265R (p 0.087, the wrong sign). FAIL.
**TH IS KILLED.**
What I learned: the clearest result in weeks, and it is a "don't": buying after three up hours (selling after three down) lost a quarter of
R a trade in BOTH periods, and more for bigger runs (dose: -0.327R). The fade only breaks even (+0.000R), so the run is not followed by a
tradable turn either: the price simply stops going, and the 20-pip stop plus costs eat the follower. It is the burst lesson again, now
over three hours instead of fifteen minutes: entering after the move has happened is where my losses come from.
Counts: idea 140; variants 374-376; second setups tried 35, none alive.
