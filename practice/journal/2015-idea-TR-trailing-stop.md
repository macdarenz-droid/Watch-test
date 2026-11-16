# Trailing stop: the one exit I have never tested. KILL LINES WRITTEN FIRST (nothing has been run)
Clock Thu 2015-04-02 01:00 London (end of released data). History before the clock; costs on; London time.

## Where it comes from (measured on all trades, not on today)
Across all my rule trades the average best point is about 40-43 pips in my favour and I bank about half of it (46% in Jan-Feb, 50% in March) because the noon clock closes whatever
is left. Today was a sharp example (+43 pips at 09:55, closed +4), but one morning is not a reason; the half-banked average is.
What I have tested on the exit side: tighter and wider fixed stops, break-even after +20 (X1: hurt January - winners dip back to entry), a +60 target (X3), a runner past noon (X2),
a 09:00 check (T), other exit hours (ET), a wall target (Z), volatility stops (V). A stop that FOLLOWS the price has never been run.
Method-rule check: not a "best N vs worst N" idea; the feature (share of the best point banked) is measured on every trade.

## Hypothesis
Once a morning trade is well in profit, a stop that trails the best price keeps more of the move than the noon clock gives back, by enough to raise avg R without raising
drawdown. The counter-case I expect from X1: London legs pull back 20-30 pips and then continue, so a trail takes me out of the trades that would have been my biggest.

## Variants (69, 70, 71; ideas -> 28), no others afterwards. Entries, initial 40 pip stop, size and the 12:00 London exit exactly A2.
- TR20: once the trade has been 20 pips in profit, the stop trails 20 pips behind the best price (so it starts at break-even).
- TR30: once 30 pips in profit, the stop trails 30 pips behind the best price.
- TR40: once 40 pips (+1R) in profit, the stop trails 20 pips behind the best price (locks at least +0.5R on trades that have already paid 1R).
The stop only ever moves in my favour; it is updated at the close of each 5-minute candle and applies from the next one.

## Data
January = build. Check = March lived days 03-02..03-31 (22 trades), clean of builds - this would be use #3 of the clean month, and only if a variant survives the build.
February shown only if a candidate exists, labelled contaminated.

## KILL LINES (explicit)
Build (January) - a variant survives only if BOTH:
  B1. avg R >= A2's avg R + 0.05R;
  B2. max drawdown <= A2's + 0.25R.
  The survivor with the highest avg R is THE candidate. No survivor -> closed; March is NOT run.
Check (March lived days) - the candidate passes only if BOTH:
  C1. avg R >= A2's avg R on those days;
  C2. max drawdown <= A2's.
A pass earns a FORWARD PAPER TAG only. The funded exit stays: stop 40 pips, out at 12:00 London.
My guess: TR20 behaves like the break-even stop and loses most in January; TR30 loses less; TR40 is the only one with a chance, because it leaves the first R alone.
