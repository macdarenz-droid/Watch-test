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

# RESULTS of idea GAP (run after the pre-registration commit). GAP25/GAP50/GAPR = variants 72/73/74; ideas 29. Costs on, $125 risk, London time (bt/ab_drop.py).

## Build - January
| Rule | Trades | Win rate | Avg R | Net R | Max DD | Kept | Skipped: n / win / avg R |
|---|---|---|---|---|---|---|---|
| A2 (before) | 19 | 74% | +0.78 | +14.89 | 1.34R | - | - |
| GAP25: skip if the 3-day gap is under 25 pips | 16 | 69% | +0.75 | +12.08 | 1.34R | 84% | 3 / 100% / +0.94 |
| GAP50: skip if under 50 pips | 14 | 64% | +0.68 | +9.54 | 1.34R | 74% | 5 / 100% / +1.07 |
| GAPR: skip if under a quarter of the average daily range | 16 | 69% | +0.75 | +12.08 | 1.34R | 84% | 3 / 100% / +0.94 |
Small-gap days in January: 01-12 +1.35, 01-13 +1.40, 01-14 +1.13, 01-22 +1.19, 01-28 +0.28 - five days, five winners.

## Kill lines, applied
- B1 (kept avg R at least +0.05R above A2): +0.75, +0.68, +0.75 against +0.78 -> all fail (all WORSE).
- B2 (skipped trades worse than kept): the skipped trades average +0.94R to +1.07R - better than the kept ones -> all fail.
=> NO SURVIVOR. Closed. As written beforehand, March was NOT run for this idea (clean-month uses stay at 2).

## What it settles
- With my February hand count (small-gap days +3.72R in 9 trades), that is two months in which "coin-flip" days were the BETTER half of A2's trades, and none in which they
  were worse. The hypothesis is not just unproven; my worry was pointing the wrong way.
- Why, as far as I can see: a small 3-day gap usually means price has just pulled back inside a move or is swinging in a box - the entry is a pullback entry, which is where
  this rule has always done well. The gap being small does not mean the morning has no direction.
- Change to my journal, as promised: the word "coin flip" is retired from my calls. The gap goes in as a number. I have been attaching a worry to a number that, if anything,
  deserved the opposite.
- Counts: ideas 29, variants 74.
