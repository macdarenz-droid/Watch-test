# "Coin-flip" signals: should small 3-day gaps be skipped? KILL LINES WRITTEN FIRST (nothing has been run)
Clock Fri 2015-04-03 01:00 London (end of released data). History before the clock; costs on; London time.

## Where it comes from
The oldest unanswered question in my journal. Since February I keep writing "coin flip" in my calls when the 3-day close gap is small (8, 9, 15, 22, 28, 31 pips...), and on
02-20 I queued it as "idea D: does A2 only pay when the 3-day gap is large?" - then never ran it. The only evidence I ever had was a hand count on my February live trades,
which pointed the OTHER way (9 trades with a gap under 35 pips made +3.72R; 11 with a bigger gap +0.92R). A worry I repeat in the journal every week deserves a real test.
Method-rule check: not a "best N vs worst N" idea; the feature (gap size) exists for every trade.

## Hypothesis
When the last close is within a few dozen pips of the close three days earlier, the direction signal is noise and the A2 trade has lower expectancy; skipping those days raises
avg R without lowering net R. (The opposite reading, which February hinted at: small-gap days are box days, where the morning swings are as tradeable as any.)

## Variants (72, 73, 74; ideas -> 29), no others afterwards. Everything else exactly A2.
- GAP25: no trade if the 3-day close gap is under 25 pips.
- GAP50: no trade if it is under 50 pips.
- GAPR: no trade if it is under 0.25 x the average daily range of the last 5 days (a gap smaller than a quarter of a normal day).

## Data
January = build. Check = March lived days 03-02..03-31 (22 trades), clean of builds: use #3 of the clean month, and only if a variant survives the build.
February is contaminated AND I hold the hand count above for it; shown only if there is a candidate.
What I know that could bias me: the February hand count; and that in March the small-gap days I remember (03-04, 03-17, 03-18, 03-30) were not losers.

## KILL LINES (explicit)
Build (January) - a variant survives only if ALL:
  B1. kept avg R >= A2's avg R + 0.05R;
  B2. the trades it skips average LESS than the trades it keeps;
  B3. it skips at least 3 trades and keeps at least 60%.
  The survivor with the highest kept avg R is THE candidate. No survivor -> closed; March is NOT run.
Check (March lived days) - the candidate passes only if ALL:
  C1. kept avg R >= A2's + 0.15R;  C2. skipped trades average <= 0R;  C3. max drawdown <= A2's and it keeps at least 60%.
A pass earns a FORWARD PAPER TAG only.
Whatever the result, one thing changes in my journal: if the filter fails, I stop writing "coin flip" as a worry in my calls - the gap size goes in as a number, without the adjective.
My guess: January has too few small-gap days to skip three (B3 fails) or the skipped ones are winners. No survivor.
