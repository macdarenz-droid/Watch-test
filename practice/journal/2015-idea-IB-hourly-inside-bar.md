# Idea IB: the hourly inside bar breaks out (idea 134; coach 08-13: next backtest). Written Thu 2015-08-13 22:00 London, before any count or outcome.
Searched with short words ("inside", "mother", "nr4", "pattern", "engulf"): only EN (engulfing, killed; EN2 now a forward count) and BS's
"nr4" as a day feature. No inside-bar rule ever. NOT built from EN2's numbers: a different pattern (contraction, then a break), and its
direction comes from the break, not from a reversal hour.

## Hypothesis
An hour that stays inside the previous hour's range is a pause; the first break of the previous ("mother") hour's range in the next two
hours carries on. Against it: watched levels break but did not carry past a 25-pip stop (MB2), and chasing short bursts lost (SF, FX, LM).

## Rule (London time; H1 candles; inside candle 07:00-15:00; one position at a time)
Inside = this H1 candle's high <= the previous candle's high and its low >= the previous candle's low. Then, within the next 2 hours, the
first M5 candle that CLOSES beyond the mother candle's high (low) -> market at the next M5 open in that direction, stop 20, out 2 hours later.
THE THREE VARIANTS (named now): IB1 (judged) every inside hour; IB2 (dose) only when the inside candle's range is <= 50% of the mother's
(a tighter pause); IB0 (control) IB1's signals traded the other way.
MIN SAMPLE (several trades a week): 120+ trades and 50+ from 04-07, else killed for sample with no outcome run.
## Kill lines (four, all must pass, for IB1)
K1 average >= +0.10R after costs (1.1 pips = 5.5% of a 20-pip risk). K2 net above zero before 04-07 AND from 04-07.
K3 stressed (2.0 + 0.5) average above zero. K4 IB1 minus IB0 above zero, sign-flip p < 0.05.
My guess: a coin minus costs (about -0.06R), negative after 04-07.
