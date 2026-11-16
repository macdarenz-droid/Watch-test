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

# RESULTS (kill test above pushed in commit 1ce4614 before any code; one run: `python bt/night.py 2015-04-22`)
76 nights per variant, 01-06..04-21, costs on, R of $125 (0.42 lots, 30 pip stop).

## Mechanics checked by hand on two nights BEFORE the totals (`--check 2015-04-16,2015-04-21`)
- 04-16: last 22:00 close 1.06834 above the previous one (1.06541), above 3 back (1.06022) and above the 17:00 price (1.05955): all three say BUY. 00:00 London open
  bid 1.06756 -> bought 1.06767 (spread + slippage), stop 1.06456. The night spiked to 1.0747 and came all the way back; 07:00 open 1.06781 -> closed 1.06780: +0.04R.
  (A 71 pip spike in my favour and four hundredths of an R: no target. Noted, not acted on.)
- 04-21: close 1.07374 above 3 back (NT1 buy) but below the previous close 1.08048 and below the 17:00 price 1.07623 (NT2, NT3 sell). Sold 1.07378, closed 1.07197: +0.61R;
  the NT1 buy at 1.07390 closed 1.07185: -0.69R. Engine = candles, both nights.

## Totals
| | nights | win rate | avg R | net R | full stops | max DD | worst 10 | Jan (19) | Feb (20) | Mar-now (37) | without best 3 | corr with A2 | net on A2's 27 losing mornings |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NT1 with the 3-day signal | 76 | 49% | -0.007 | -0.54 | 10 | 3.87R | -3.87R | -3.44 | +1.71 | +1.19 | -5.01 | +0.18 | -2.60 |
| NT2 with the 1-day direction | 76 | 37% | -0.208 | -15.79 | 17 | 17.22R | -6.73R | -6.91 | -2.31 | -6.58 | -19.75 | -0.03 | -3.43 |
| NT3 with the NY afternoon | 76 | 37% | -0.209 | -15.87 | 18 | 18.56R | -6.02R | -4.08 | -3.47 | -8.32 | -18.72 | -0.02 | -3.48 |

## Kill lines applied
| line | NT1 | NT2 | NT3 |
|---|---|---|---|
| K1 avg >= +0.15R | FAIL (-0.01) | FAIL (-0.21) | FAIL (-0.21) |
| K2 positive in each period | FAIL (Jan -3.44) | FAIL (all negative) | FAIL (all negative) |
| K3 positive without best 3 | FAIL | FAIL | FAIL |
| K4 DD <= 5R, worst 10 >= -4R | PASS | FAIL (DD 17R) | FAIL (DD 19R) |
| K5 independent of A2 | FAIL (-2.60R on A2's losing mornings) | FAIL | FAIL |
VERDICT: NO SURVIVOR. The hypothesis "the night continues the prevailing direction" is dead on 76 nights. No second setup here. A2 unchanged.

## My guess against what happened
"NT1 between -0.10R and +0.05R": -0.01R, right. "NT2 and NT3 the same": WRONG - they lose 0.21R a night, about five times the cost, in every period.

## What I learned
- The night has no memory of my 3-day direction: 49% winners, zero average. The hours I trade (08:00-12:00 London) are where the 3-day signal pays; the same signal at
  midnight is a coin that costs 1.1 pips to flip. That is useful to know about my own rule: the edge is in London's morning, not "in the trend".
- The night does have a memory of YESTERDAY, and it is a contrary one: after an up day (or an up New York afternoon) the night goes down more often than not - 63% of the time
  against the last move, -0.21R per continuation trade, negative in January, February and March-to-now.
- What I said beforehand I would do with a consistent loser: note it, and NOT test the mirror, because that is a fourth variant. So, noted. And before anyone (me) gets
  excited, the arithmetic: the mirror trade (fade yesterday's move from midnight to 07:00) would make about +0.21R minus two more costs = roughly +0.13R per trade on these
  76 nights - UNDER my +0.15R line for a stand-alone setup before it has even been run, with a win rate near 63% and losses that are full 30 pip stops; and it lives
  on the one cost I trust least (the sim's 1.0 pip spread at midnight). It is an observation for the parked list:
  "nights tend to give back part of the previous day's move (76 nights, about 0.2R, all three periods)". If my coach wants it tested it gets its own hypothesis and kill
  test, with a cost stress in the kill lines; I am not starting it myself today.
- It also explains two things in my own journal: why "the night went against me" was never a warning for A2 (NM test) - nights usually go against the last move, so it
  is the normal case - and why the trades after a day that "closed against me" were fine (RV test).
- Sample, plainly: 76 nights per variant is the same size as my A2 book; an average of -0.21R with a spread of about 0.8R is roughly 2.3 standard errors from zero.
  Enough to kill "continuation". Not enough to bank a fade.
Counts: ideas 43, variants 116.
