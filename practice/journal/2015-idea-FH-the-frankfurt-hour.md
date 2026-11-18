# Idea FH: does the 07:00-08:00 London hour carry on the night's move? (idea 143; coach 08-24: next backtest)
Written Mon 2015-08-24 22:00 London, before any count or outcome.
Searched ("07:00-08:00", "frankfurt", "earlier entry"): the hour was used as A2's EARLIER ENTRY (ET, A2's 3-day direction, killed), as a
feature (PH2 range, LM direction for the 08:00-12:00 trade, NC). Never traded on its own with the NIGHT's direction. Not GC/GC2 (those faded
the night through 08:00-12:00 and were killed for sample, outcomes unseen; FH trades only the hour 07:00-08:00, with the night).
Background, no source I can cite: continental European dealers start about an hour before London's 08:00.

## Hypothesis
A clear night move (00:00-07:00) carries on in the 07:00-08:00 hour as Europe arrives.
Against it: entering after a move has happened lost at every scale I tested (TH, RS0, FX0, LM1); and costs are heavy on a one-hour trade.

## Rule (London time, one trade a day)
Night move = open of the 07:00 candle minus open of the 00:00 candle. If |move| >= N pips: at 07:00 market order WITH it, stop 20, out 08:00.
## Order of work: step 1 counts only for N = 10, 20, 30 (and the share on A2's side). Step 2: N = the LARGEST grid value with 80+ trades and
35+ from 04-07 (once-a-day line); none -> killed for sample. 70%+ on A2's side or opposite -> killed as A2 in disguise. Step 3 one run.
THE THREE VARIANTS (named now): FH1 (judged) the chosen N; FH2 (dose) the next larger N (or 40 if the chosen is 30); FH0 (control) FH1's days faded.
Power (once-a-day): about +-0.2R on the average at 80-120 trades; a no-edge rule clears +0.10R about one time in four. ANY PASS IS PROVISIONAL.
## KILL LINES (four, all must pass, for FH1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 FH1's average R >= +0.10R.
K2 FH1's net R above zero BOTH before 04-07 AND from 04-07.
K3 FH1's average R at stressed costs above zero.
K4 FH1 minus FH0, trade by trade, above zero with sign-flip p < 0.10.
My guess: negative, like every follow-after-a-move rule.
Search also found G1 (January): A2 skipped when 07:00-08:00 broke the Asia range against it: an A2 filter, not a trade in the hour. FH stays new.

## Step 1, counts only (tool `python bt/frankfurt_hour.py 2015-08-25 count`; its header label "NY move" is inherited from the YN script it was
built from: here it is the NIGHT move 00:00 -> 07:00)
166 days; median |night move| 14.3 pips. N = 10: 106 trades (39 before 04-07, 67 from), follow side = A2's side 52%. N = 20: 61 (20 / 41), 42%.
N = 30: 33 (11 / 22), 50%.
## Step 2: largest N with 80+ and 35+ from 04-07 = **N = 10** (106 / 67). Not A2 in disguise (52%). FH1 = 10, FH2 = 20, FH0 = fade at 10.
Worked case, Mon 08-24 (read from today's call and 08:00 note, same window): night +45.0 -> FH1 BUYS at the 07:00 open (1.14363 bid + spread),
stop 20 below (about 1.14173). The hour's low 1.14202 stays 3 pips above the stop; out at the 08:00 open about 1.14650: about +27 pips =
about +1.35R. The fade would be stopped? Its stop about 20 above 1.14353 = 1.14553 on the ask; the hour's high 1.14733: yes, a full stop.

## Step 3, result (one run: `test 10 20`)
Hand check 08-24: follow +1.375R (worked about +1.35R); fade stopped -1.01R (worked: a full stop). As written.
| variant (R after costs: spread 1.0 + slippage 0.1 pips; stressed 2.0 + 0.5) | trades | wins | avg R | net | stops | before 04-07 | from 04-07 | stressed avg |
|---|---|---|---|---|---|---|---|---|
| FH1 follow the night, 07:00-08:00, N 10 (JUDGED) | 106 | 46% | +0.048 (+-0.22) | +5.07 | 33 | +6.46 | -1.39 | -0.034 |
| FH2 follow, N 20 | 61 | 39% | -0.082 (+-0.29) | -5.00 | 25 | -2.78 | -2.22 | -0.161 |
| FH0 fade, N 10 (control) | 106 | 42% | -0.146 (+-0.17) | -15.50 | 39 | -4.06 | -11.44 | -0.242 |
Kill lines, each against its written threshold:
K1 FH1's average >= +0.10R: +0.048R. FAIL.
K2 FH1's net above zero before AND from 04-07: +6.46R / -1.39R. FAIL.
K3 FH1's stressed average above zero: -0.034R. FAIL.
K4 FH1 minus FH0 above zero, p < 0.10: +0.194R, p 0.28. FAIL.
**FH IS KILLED.**
What I learned: the 07:00 hour is a coin after costs whichever way it is traded from the night's move; the bigger-night version (FH2) is
worse, so there is no dose. One-hour trades with a 20-pip stop start 5.5% of R behind and have little room to earn it back.
Counts: idea 143; variants 383-385; second setups tried 38, none alive.
