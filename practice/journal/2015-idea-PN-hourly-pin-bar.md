# Idea PN: the hourly pin bar (idea 135; coach 08-14: next backtest). Written Fri 2015-08-14 22:00 London (weekend), before any count or outcome.
Searched ("pin", "wick", "rejection"): only RV (04-xx), a DAILY "rejection day" used as an A2 filter (6 cases), and my 07-08 chart note
"H4 wicks at the ends". Never an hourly wick as a setup. Different from EN (engulfing: the body swallows the previous body) and IB (inside hour).

## Hypothesis
An hour that pushes one way and closes far back (a long wick) shows the push was refused; the next two hours go the other way.
Against it: every "it comes back" setup in the London day paid about zero after costs (SF, MF, FX, DT lost).

## Rule (London time; H1 candles; signal candles 07:00-16:00; one position at a time)
Pin = range >= 15 pips (fixed now, to skip near-empty hours) and one wick >= W of the range, with the close in the other 40% of the range.
Long LOWER wick -> BUY at the next H1 open; long UPPER wick -> SELL. Stop 20, out 2 hours after entry.
THE THREE VARIANTS (named now): PN1 (judged) W = 60%; PN2 (dose) W = 75%; PN0 (control) PN1's signals traded the other way.
MIN SAMPLE: PN1 120+ trades and 50+ from 04-07; else killed for sample, no outcome run.
## Kill lines (four, all must pass, for PN1)
K1 average >= +0.10R after costs (1.1 pips = 5.5% of a 20-pip risk). K2 net above zero before 04-07 AND from 04-07.
K3 stressed (2.0 + 0.5) average above zero. K4 PN1 minus PN0 above zero, sign-flip p < 0.05.
Worked case: read from the candles inside the trade window (the IB lesson), not from the day's close.
My guess: a coin minus costs.

## Counts (tool `python bt/pin_bar.py 2015-08-15 count`; built from bt/engulfing.py with only the signal function changed; no outcomes)
PN1 (W 60%): 223 trades (98 before 04-07, 125 from) on 126 days; 99 bullish, 124 bearish; 5 busiest days hold 18. Meets 120 / 50.
PN2 (W 75%): 73 trades (38 / 35): dose line only.
Worked case Fri 08-14, read from the window's own candles (IB lesson): the 12:00 H1 candle was a bearish pin -> PN1 SELLS at the 13:00
open 1.11706, stop 20 above (about 1.11906; the window's high was 1.11754, so not hit), out at the 15:00 open 1.11374 (+ spread on the
buy-back). By hand: about +32 pips = about +1.6R for PN1, and the control (a buy) about -1.7R... no: the control's stop is 20 below
1.11718, about 1.11518, and the window's low was 1.11254, so the control is a full stop, about -1.0R.

## Result (one run)
Tool: `python bt/pin_bar.py 2015-08-15 test`. Hand check 08-14: PN1 sold 1.11705, out 15:00 at 1.11385, +1.60R; the control was stopped at
1.11505, -1.06R. Both as worked out by hand from the window's candles before the run.
| variant | trades | wins | avg R | net | stops | before 04-07 | from 04-07 | stressed avg |
|---|---|---|---|---|---|---|---|---|
| PN1 away from the wick, W 60% (JUDGED) | 223 | 35% | -0.133 (+-0.17) | -29.76 | 117 | -11.09 | -18.67 | -0.216 |
| PN2 away from the wick, W 75% | 73 | 41% | -0.049 (+-0.29) | -3.61 | 36 | +5.66 | -9.28 | -0.125 |
| PN0 against PN1's signals (control) | 223 | 45% | +0.059 (+-0.17) | +13.10 | 87 | -1.43 | +14.53 | -0.028 |
PN1 minus PN0 -0.192R (sign-flip p 0.20). PN1: all four kill lines FAIL. **PN IS KILLED.**
What I learned: the "refused push" does not get refused again: trading away from an hourly wick lost -0.133R, more than costs, in both
periods; going WITH the wick's direction (the control) made +0.059R, all of it after 04-07 and negative at stressed costs. Another
textbook picture that my data does not support. With EN1 and IB, three hourly candle patterns, all killed; EN2's forward count remains
the only pattern line, and it waits.
Counts: idea 135; variants 362-364; second setups tried 32, none alive.
