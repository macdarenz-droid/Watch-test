# Idea SH: does each London hour repeat yesterday's same hour? (idea 146; coach 08-26: next backtest). Written Wed 2015-08-26 22:00 London, before any count.
Searched ("same hour", "hour of the day", "seasonal", "time of day"): nothing. WM (07-07) compared 4-hour windows by A2's side; MH studied
big hours; none asked whether an hour's direction repeats the next day at the same clock time.
Background, no source I can cite: some flows (fixes, scheduled hedging) recur at the same clock time.

## Frequency check, on paper first
Several trades a day (up to nine hours, 08:00-17:00), so the 120 line applies; the count decides.

## Hypothesis
The move of the London hour H yesterday predicts the same hour H today, in the same direction.

## Rule (London time; hours starting 08:00, 09:00, ..., 16:00; each hour is its own trade, they do not overlap)
Yesterday's move in hour H = open of H+1 minus open of H, yesterday. If |move| >= X pips: at today's H open, market order in that direction,
stop 20, out at H+1 (one hour).
## Order of work: step 1 counts only for X = 5, 10, 15. Step 2: X = the LARGEST grid value with 120+ trades and 50+ from 04-07; none ->
killed for sample. Step 3 one run.
THE THREE VARIANTS (named now): SH1 (judged) the chosen X; SH2 (dose) the next larger X (or 20 if the chosen is 15); SH0 (control) SH1's
signals traded the other way.
## KILL LINES (four, all must pass, for SH1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 SH1's average R >= +0.10R.
K2 SH1's net R above zero BOTH before 04-07 AND from 04-07.
K3 SH1's average R at stressed costs above zero.
K4 SH1 minus SH0, trade by trade, above zero with sign-flip p < 0.05.
My guess: a coin minus costs (-0.06R).

## Step 1, counts only (tool `python bt/same_hour.py 2015-08-27 grid`)
1,506 day-hours (01-05..08-26); median |yesterday's same-hour move| 12.8 pips. X = 5: 1,173 trades (452 / 721). X = 10: 888 (352 / 536).
X = 15: 653 (249 / 404).
## Step 2: largest X with 120+ and 50+ from 04-07 = **X = 15** (653 / 404). SH1 = 15, SH2 = 20, SH0 = against at 15.
Note before the run: the hours of one day are not independent (a trending day moves several hours the same way), so 653 trades are fewer
independent cases than they look; the sign-flip p will be too optimistic. I say so now, not after the result.
Worked cases, Wed 08-26, read from the candles (R after costs 1.0 + 0.1):
- 08:00 hour: 08-25's 08:00 hour moved -39.9 -> SH1 SELLS at 1.14968, stop 20 above (about 1.15168 on the ask). The hour's high 1.15192 (+1 pip
  spread) passes it: FULL STOP, about -1.0R.
- 09:00 hour: 08-25's moved +27.3 -> SH1 BUYS at about 1.15144 (ask), stop about 1.14944. The hour's low 1.14713 passes it: FULL STOP, about -1.0R.

## Step 3, result (one run: `test 15 20`)
Tool: `python bt/same_hour.py 2015-08-27 test 15 20`. Hand check, 08-26 08:00 hour: SH1 sold 1.14967, stopped 1.15169, -1.01R (worked: a full stop). As written.
| variant (R after costs: spread 1.0 + slippage 0.1 pips; stressed 2.0 + 0.5) | trades | wins | avg R | net | stops | before 04-07 | from 04-07 | stressed avg |
|---|---|---|---|---|---|---|---|---|
| SH1 repeat yesterday's same hour, |move| >= 15 (JUDGED) | 653 | 44% | -0.014 (+-0.08) | -8.85 | 223 | -11.00 | +2.15 | -0.107 |
| SH2 repeat, |move| >= 20 | 461 | 43% | -0.016 (+-0.10) | -7.27 | 170 | -11.62 | +4.35 | -0.113 |
| SH0 against yesterday's same hour (control) | 653 | 42% | -0.098 (+-0.08) | -64.27 | 238 | -40.81 | -23.46 | -0.183 |
Kill lines, each against its written threshold:
K1 SH1's average >= +0.10R: -0.014R. FAIL.
K2 SH1's net above zero before AND from 04-07: -11.00R / +2.15R. FAIL.
K3 SH1's stressed average above zero: -0.107R. FAIL.
K4 SH1 minus SH0 above zero, p < 0.05: +0.085R, p 0.24 (and the p is optimistic, see the dependence note). FAIL.
**SH IS KILLED.**
What I learned: with 653 trades the answer is narrow and clear: an hour does not repeat yesterday's same hour after costs (-0.014R, +-0.08).
Both directions lose about the cost of trading; the "against" side loses more, so if anything there is a faint lean to repeat, worth far
less than the 5.5% of R a one-hour trade pays to the spread. Time-of-day flows, if they exist here, are smaller than my costs.
Counts: idea 146; variants 389-391; second setups tried 39, none alive.
