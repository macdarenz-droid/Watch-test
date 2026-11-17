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
