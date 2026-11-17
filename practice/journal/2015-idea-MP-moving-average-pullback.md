# Idea MP: buy the pullback to a rising hourly moving average (idea 136; coach 08-14: next backtest). Written Fri 2015-08-14 22:00 London, before any count.
Searched ("moving average", "sma", "ema", "ma20"): no moving average anywhere in 135 ideas or in bt/. The most common trend setup in basic
chart lessons (general background, no source I can cite): in a trend, wait for the price to pull back to its average, enter with the trend.
Not A2 (no 3-day close, any hour of the day) and not a burst chase (it enters on a pullback, not after a jump).

## Hypothesis
When the hourly 20-period average is rising (falling), a pullback that touches it is bought (sold) and the trend resumes.
Against it: since April moves do not hold (MC); and every "follow" rule in my record lost after 04-07.

## Rule (London time; H1 candles; signal candles 07:00-16:00; one position at a time)
SMA20 = mean of the last 20 H1 closes (including the signal candle). Rising = SMA20 now minus SMA20 five hours earlier >= S pips.
Long signal: rising, the candle's low touches or crosses the SMA20, and the candle closes ABOVE it. Short: the mirror.
Entry at the next H1 open, stop 20, out 3 hours after entry.
THE THREE VARIANTS (named now): MP1 (judged) S = 5 pips; MP2 (dose) S = 15 pips (a steeper trend); MP0 (control) MP1's signals traded the other way.
MIN SAMPLE: MP1 120+ trades and 50+ from 04-07; else killed for sample, no outcome run.
## Kill lines (four, all must pass, for MP1)
K1 average >= +0.10R after costs (1.1 pips = 5.5% of a 20-pip risk). K2 net above zero before 04-07 AND from 04-07.
K3 stressed (2.0 + 0.5) average above zero. K4 MP1 minus MP0 above zero, sign-flip p < 0.05.
Worked case read from its own window's candles. My guess: positive before 04-07, negative after (K2 fails).
