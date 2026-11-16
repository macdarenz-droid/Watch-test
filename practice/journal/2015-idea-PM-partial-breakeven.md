# Trade management on A2: partial at +1R and break-even stop vs my current exit, on ALL history. HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY RUN
Clock Wed 2015-04-15 01:00 London (end of released data). Coach's brick. All lived history 01-06 .. 04-14 (explicit end date = the clock), shown by period; costs on; London time.

## What I already know - said first, because this is not a fresh idea
- I tested exactly this on 04-03 (journal/2015-idea-SO-scale-out.md): half off at +40 pips (SO40) and the same with the runner's stop moved to entry (SO40BE).
  JANUARY ONLY, 19 days: both kept 78% of A2's net R with the same drawdown; no survivor. The break-even version was identical to the plain one because no runner came back.
- A break-even stop on the WHOLE position was tested once, at +20 pips (X1, January): no survivor. Never at +1R.
- On 04-07 the coach pointed out that my builds were January only, and January was my trendiest month (+0.78R per trade against +0.23R in February). A partial and a
  break-even stop are tools for choppy markets, so January was the month least able to show what they do. That is a fair reason to look again on everything.
- My own rules say "old variants are not re-run on the wider build" and "the exit lever is closed". I make an exception because the coach set this brick, and I mark it:
  two of the three variants below are RE-RUNS of January-tested definitions on 3.5 months; their January numbers are already known to me (78%).
  So January cannot count as evidence here; February and March-to-now are the periods that are new for this question.

## How the engine does it (read in bt/ideas.py and backtest.py before writing this, not assumed)
- Position = two equal halves, same entry, same 40 pip stop, $125 total risk. First half has a take-profit 40 pips from the entry decision price. Result per DAY = both halves, in R of the $125.
- Break-even: after the bar in which the first half is banked, the stop of the second half is moved to its entry price, working from the NEXT 5-minute bar (I cannot know the
  order of prices inside one bar, so the engine never uses a moved stop in the bar that moved it). A break-even exit costs 0.1 pip of slippage; the spread was paid at entry.
- If stop and target are both touched in one bar, the engine takes the stop. Everything at noon is closed at market as now.

## Hypothesis
Over all my history (not just the January trend), banking half at +1R and protecting the rest at break-even gives a steadier curve - clearly shallower drawdown per unit of
profit - at a small cost in total profit, because outside trend months a good part of the trades that reach +1R give some of it back before noon.
Counter-case (January, and the first-hour and trailing tests): the profit lives in the days that run; noon already protects the open profit; drawdowns are made of days that never reach +1R.

## Variants (99, 100, 101; ideas -> 38), no others afterwards. Entry, direction, stop, size and the 12:00 exit exactly A2.
- PM1: half off at +1R (40 pips) AND the remaining half's stop to break-even. (= SO40BE re-run on all history. The coach's variant.)
- PM2: half off at +1R, the remaining half keeps the original stop. (= SO40 re-run. Shows what the partial does by itself.)
- PM3: no partial; when the trade has been +1R in my favour the stop of the WHOLE position goes to break-even. (New. Shows what the break-even stop does by itself.)

## What I will look at before the totals (so the totals do not surprise me into a story)
How many of the days reached +1R before noon; of those, how many were above +1R at noon, how many between 0 and +1R, how many came back to the entry price.
PM1 can only differ from A2 on days that reach +1R: on a day that closes above +1R it loses half the excess; on a day that comes back it keeps +0.5R (and 0 on the rest
instead of whatever noon gave). So the whole question is the ratio of "ran on" to "came back" days, weighted by how far they ran.

## KILL TEST (explicit). Same-trade comparison per day, engine, full costs. The build can only kill; a survivor gets a forward paper tag (same-trade change: 100 forward
trades; at least +0.10R per trade better, or the same R with a drawdown at most 70% of A2's, at two standard errors).
A variant survives only if ALL:
  K1. net R over all history >= 95% of A2's;
  K2. score (net R / max drawdown) >= 1.25 x A2's;
  K3. in BOTH periods that are new for this question (February; March-to-now) its net R is >= 95% of A2's in that period, or its max drawdown inside that period is
      at most 70% of A2's with net R >= 85%;
  K4. the worst 10-trade stretch (lowest sum of 10 consecutive days) is not worse than A2's.
Also reported, not kill lines: win rate, spread (sd) of daily results, January separately.
My guess, written now: about half of all days reach +1R and most of those close above it, so PM1 and PM2 keep roughly 80-85% of net R with the same drawdown and fail K1 and K2.
PM3 differs from A2 on only a handful of days and lands within 2R of it either way; fails K2. If February shows PM1 clearly ahead I will say so, and it still needs 100 forward trades.
