# The parked night observation, tested properly: FADE yesterday's move from midnight to 07:00. HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY CODE OR RUN
Clock Fri 2015-05-01 22:00 London (weekend, end of released data). All lived history 01-06 .. 05-01 (explicit end 2015-05-02); costs on; London time.

## Why this one now
Entries on A2: 14 filters and splits, none adopted (two on paper). Exits and management: 29 definitions, closed yesterday. Size: decided by two triggers.
What my plan has listed as open since March is a second, different setup; six have failed (Asia break, ignition candle, NY fade, range fade, night continuation,
afternoon trade). One observation from those tests is still parked with a note "not tested; needs its own hypothesis and kill test with a cost stress": on 04-22 the
night CONTINUATION trades lost 0.21R a night in every period - nights tend to give back part of the previous day's move. The coach asked for the next backtest and
set no direction, so I take the parked item and give it the test I said it would need. I flagged on 04-22 that it would wait for the coach's word; I am telling the
coach in today's message that I went ahead, and why.

## Contamination - this is the most contaminated test I have run, and the kill lines are built around that
- I have SEEN the mirror: NT2 (with yesterday's close-to-close direction) -0.208R on 76 nights, NT3 (with the New York afternoon) -0.209R, both negative in January,
  February and March-to-now. A fade is the same trades with the sign flipped, minus two more costs, with different stop-outs. Arithmetic says about +0.13R.
- So the average and the per-period signs are essentially known. A test of those alone would be theatre. The lines that are NOT known to me: what the stops do to the
  mirror (a 30 pip stop cuts different trades when the side is flipped), the cost stress, the drawdown, and the relation to A2.
- I wrote on 04-22 that +0.13R is "under my +0.15R line before it has been run". I keep that line. I expect a narrow fail, and I will not move the line.

## Hypothesis
Between 00:00 and 07:00 London the market gives back part of the previous day's move often enough that a trade AGAINST that move has a positive expectancy of its own,
large enough to survive realistic night costs, in every part of my history, and unrelated to my morning trade.

## Variants (135, 136, 137; ideas -> 50), no others afterwards. All: market order at 00:00 London, stop 30 pips, no target, close at market at 07:00 London (before my
07:00 call, so it never overlaps A2 in time or risk), $125 risk (0.42 lots), one trade per night before each weekday.
- NF1: against the 1-day direction (last 22:00 close vs the previous 22:00 close).
- NF2: against the New York afternoon (last 22:00 close vs the 17:00 London price that day).
- NF3: only on nights when both of those point the same way (yesterday AND its afternoon moved in one direction) - fade it; otherwise no trade.

## KILL TEST (explicit) for a stand-alone setup. The build can only kill; a survivor gets a forward PAPER tag (100 forward trades, at least +0.15R per trade at two
standard errors, judged at the STRESSED cost) - never a live trade from a backtest, and certainly not from this one.
A variant survives only if ALL:
  K1. average R per trade at least +0.15R at the sim's costs (1.0 pip spread + 0.1 slippage);
  K2. COST STRESS: re-run with a 2.5 pip spread + 0.1 slippage (I do not know real midnight spreads; the feed's own spread column is wider at night than by day,
      and I would rather be wrong on the expensive side): average still at least +0.05R;
  K3. net R positive in each of the three periods (January, February, March-to-now) at the sim's costs;
  K4. net R still positive without its three best trades;
  K5. maximum drawdown at most 5R and the worst 10 trades in a row not worse than -4R;
  K6. independence from A2: correlation of its nightly R with A2's R the same morning at most +0.30, and net R not negative on the mornings A2 lost.
My guess, written now: NF1 and NF2 come out at +0.10R to +0.14R: fail K1 narrowly, and fail K2 (at 2.5 pips the average drops by about 0.10R to roughly zero).
NF3 has fewer trades and may look better per trade; if it clears K1 it will fail K2 or K4. No survivor. If one does survive every line, it is a paper tag and nothing more.

# RESULTS (kill test above pushed in commit 69d4eca before any code; one run: `python bt/night_fade.py 2015-05-02`)
84 nights 01-06..05-01 (NF3: 58), R of $125 (0.42 lots, 30 pip stop), at the sim's costs and at a 2.5 pip spread.

## Mechanics checked on one night before the totals (`--check 2015-04-21`)
Monday 04-20 fell (close 1.07374 under the previous 1.08048 and under the 17:00 price 1.07623): all three fade variants BUY at midnight. 00:00 open bid 1.07379 ->
bought 1.07390, stop 1.07079; the night low was 1.07136 (not stopped); closed 07:00 at 1.07185: -0.69R. At a 2.5 pip spread the entry is 1.07405: -0.74R. Engine = candles.

## Totals
| | nights | win rate | avg R (+- 2 SE) | net R | full stops | max DD | worst 10 | Jan | Feb | Mar-now | without best 3 | avg at 2.5 pip spread | corr with A2 | net on A2's losing mornings |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NF1 against the 1-day direction | 84 | 45% | +0.032 (+-0.16) | +2.73 | 13 | 4.77R | -3.80R | +4.39 | -0.01 | -1.65 | -2.75 | -0.026 | +0.03 | -4.11 |
| NF2 against the NY afternoon | 84 | 45% | +0.016 (+-0.16) | +1.36 | 13 | 5.75R | -3.71R | +1.56 | +1.15 | -1.35 | -4.20 | -0.047 | -0.03 | -3.50 |
| NF3 only when both agree | 58 | 45% | +0.069 (+-0.19) | +4.02 | 8 | 4.05R | -3.68R | +3.90 | +0.78 | -0.67 | -1.46 | +0.016 | +0.04 | -3.47 |

## Kill lines applied
| line | NF1 | NF2 | NF3 |
|---|---|---|---|
| K1 avg >= +0.15R | FAIL (+0.03) | FAIL (+0.02) | FAIL (+0.07) |
| K2 stressed avg >= +0.05R | FAIL (-0.03) | FAIL (-0.05) | FAIL (+0.02) |
| K3 positive in each period | FAIL | FAIL | FAIL |
| K4 positive without best 3 | FAIL | FAIL | FAIL |
| K5 DD <= 5R, worst 10 >= -4R | PASS | FAIL | PASS |
| K6 independent of A2 | FAIL (-4.11R on A2's losing mornings) | FAIL | FAIL |
VERDICT: NO SURVIVOR, and not narrowly. The night fade earns nothing. Idea closed; the parked observation is taken off the list. A2 unchanged.

## My guess against what happened - the arithmetic I trusted was wrong
I wrote, twice, that the mirror of a -0.21R trade should make about +0.13R after costs, and I guessed +0.10R to +0.14R. It makes +0.03R / +0.02R.
Where the missing tenth of an R went - my reading, NOT checked night by night: the two trades are not mirror images once each has its own 30 pip stop.
On a two-way night (30 pips one way, then back) one of the two is stopped for a full -1R while the other earns only what is left at 07:00; which one is stopped
depends on the order. Both sides pay the stop on such nights. The numbers that ARE measured: continuation (NT2, 76 nights, run on 04-22) -0.21R and fade (NF1, 84 nights,
today) +0.03R - together about -0.18R a night, of which two sets of costs are 0.07R (2 x 1.1 pips on a 30 pip stop). The remaining 0.10R I attribute to those stop-outs;
the samples differ by eight nights, so this is an estimate.
- Lesson, general and worth keeping: "this loses consistently, so the opposite wins" is only true for trades without stops. With a stop on each side, both can lose.
  I will not write "the mirror would make about X" again without running it.
- What is left of the 04-22 observation: nights do go against yesterday's move slightly more often than with it - and it is not tradeable with a 30 pip stop at any
  cost level I believe in. With March-to-now negative in all three variants, there is not even a period to argue from.
- Seven second setups tried, none alive: Asia break, ignition candle, NY fade, range fade, night continuation, afternoon trade, night fade. The record says the
  one edge I have is the 3-day direction between 08:00 and 12:00 London.
Counts: ideas 50, variants 137.
