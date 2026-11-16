# A second setup with its own sample: does the Asia night continue the prevailing direction? HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY RUN
Clock Wed 2015-04-22 01:00 London (end of released data). All lived history 01-06 .. 04-21 (explicit end date 2015-04-22); costs on; London time.

## Why this one - and what I looked at and dropped first
The coach asked for a test with enough trades to mean something. Looked at and dropped, plainly:
- "Why are my live losses deeper?" (live-vs-backtest table: full stops 22% live vs 8% in the backtest). Before building anything I checked whether the difference is even
  real: 8 of 37 against 3 of 39 is a gap of 14 points with a standard error of about 8 - under two standard errors. And the obvious explanation, volatility, is weak:
  5-day average daily range was 145 pips in January, 117 in February, 163 in March, 135 in April (counted today, no trade results) - live is not clearly wilder -
  and idea V already found the London-morning range unrelated to the 5-day range and tested volatility-scaled stops and size (no survivor). Re-running V is against my
  own rule. So: no test; the stop-rate line stays in the daily table and I will look again when live has 100 trades.
- More conditions on A2: ten filters tested, the one interesting leftover (UN3) is on paper. More would be mining 75 trades.
What my plan has listed as OPEN since March is "a second, different setup". Everything I have tried trades London or New York hours. I have never tested the one
session I look at every morning in my call and describe in words: the night. A night trade would be flat before my 07:00 call, so it never overlaps A2 in time or risk.
It has one trade per night: about 75 cases per variant - the same sample as A2 itself.

## What I know and do not know (honestly)
- My calls describe nights both ways ("gave it all back", "lower highs all night", "quiet shelf"); I have no count. The NM test said A2 does a little BETTER when the
  night went against it - which hints that nights often run against the 3-day direction - but that was about A2's result, not about the night's own profit.
- A random direction loses the costs: 1.1 pips on a 30 pip stop = -0.04R per trade. Nights are small (Asia range 35-50 pips), so costs matter more than in A2.
- The sim charges a fixed 1.0 pip spread at all hours. I do not know real night spreads at a broker; around the 22:00 London rollover they are certainly wider.
  I therefore enter at 00:00 London, not at 22:00, and any survivor would need a cost stress before anything else.

## Hypothesis
Between 00:00 and 07:00 London the market, on average, continues in the prevailing short-term direction by enough to pay costs: a with-direction night trade has a
positive expectancy of its own, in every part of my history.

## Variants (114, 115, 116; ideas -> 43), no others afterwards. Three definitions of "prevailing direction", all known at 22:00 London; everything else identical:
market order at 00:00 London, stop 30 pips, no target, close at market at 07:00 London, $125 risk (0.42 lots), one trade per night before each weekday, costs on.
- NT1: the 3-day signal (last 22:00 close vs the close 3 trading days earlier) - the same direction A2 will trade that morning.
- NT2: the 1-day direction (last 22:00 close vs the previous 22:00 close).
- NT3: the New York afternoon (last 22:00 close vs the price at 17:00 London the same day).

## KILL TEST (explicit) for a stand-alone setup. The build can only kill; a survivor gets a cost-stress run and a forward PAPER tag (100 forward trades, at least +0.15R
per trade at two standard errors) - never a live trade from a backtest.
A variant survives only if ALL:
  K1. average R per trade over all history at least +0.15R;
  K2. net R positive in each of the three periods (January, February, March-to-now);
  K3. net R still positive without its three best trades;
  K4. maximum drawdown at most 5R and the worst 10 trades in a row not worse than -4R;
  K5. independence from A2: correlation of its nightly R with A2's R the same morning at most +0.30, and net R not negative on the mornings A2 lost.
My guess, written now: nights have no drift I can use. NT1 comes out between -0.10R and +0.05R per trade, NT2 and NT3 the same; all three fail K1, and at least two
fail K2. If one of them is strongly NEGATIVE (below -0.15R in all three periods) I will note it - a consistent loser is a fade - but I will not test the mirror now:
that would be a fourth variant.
