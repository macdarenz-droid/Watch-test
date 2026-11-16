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
