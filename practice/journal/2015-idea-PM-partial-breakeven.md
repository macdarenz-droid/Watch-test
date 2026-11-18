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

## RESULTS (run once after the lines above were pushed: `python bt/ab_manage.py PM1,PM2,PM3 2015-04-15 --days`; 71 days 01-06..04-14, engine, full costs, per day)

### First the look I promised myself: what happens to trades that reach +1R
| | days | reached +1R before noon | of those, at noon: above +1R | between 0 and +1R | below 0 | runner came back to entry |
|---|---|---|---|---|---|---|
| January | 19 | 10 | 10 | 0 | 0 | 0 |
| February | 20 | 6 | 4 | 1 | 1 | 1 |
| March-to-now | 32 | 17 | 11 | 5 | 1 | 4 |
| all | 71 | 33 | 25 | 6 | 2 | 5 |
A trade that reaches +1R finishes the morning above +1R three times in four. January was the extreme (10 of 10), but February and March say the same thing more quietly (15 of 23).

### Totals
| | win days | avg R / day | net R (vs A2) | max DD | score net/DD (vs A2) | sd of days | worst 10 days | Jan | Feb | Mar-now |
|---|---|---|---|---|---|---|---|---|---|---|
| A2: whole position, noon | 66% | +0.468 | +33.21 | 2.03 | 16.3 | 1.04 | -1.37 | +14.89 (dd 1.34) | +4.67 (dd 1.87) | +13.65 (dd 2.03) |
| PM1: half at +1R, runner to break-even | 69% | +0.388 | +27.52 (83%) | 2.03 | 13.5 (0.83x) | 0.85 | -1.38 | +11.59 (78%, dd 1.34) | +4.80 (103%, dd 1.03) | +11.13 (82%, dd 2.03) |
| PM2: half at +1R only | 69% | +0.396 | +28.12 (85%) | 2.03 | 13.8 (0.85x) | 0.85 | -0.91 | +11.59 (78%, dd 1.34) | +4.62 (99%, dd 1.20) | +11.91 (87%, dd 2.03) |
| PM3: whole position to break-even after +1R | 62% | +0.446 | +31.65 (95%) | 2.31 | 13.7 (0.84x) | 1.04 | -2.31 | +14.89 (100%) | +4.67 (100%) | +12.09 (89%, dd 2.31) |
PM1 differs from A2 on the 33 days that reached +1R: better on 6 (+2.35R together), worse on 27 (-8.02R). PM2: better on 8 (+2.35R), worse on 25 (-7.43R).
PM3 differs on 4 days: better on 1 (+0.12R), worse on 3 (-1.67R): 03-12 -0.12 -> 0.00 | 03-24 +0.73 -> 0.00 | 03-30 +0.85 -> 0.00 | 04-01 +0.09 -> 0.00.

### Checked by hand against the 5-minute candles before believing the table (two days, the two kinds of case that matter)
- 03-24 buy 1.09531: first candle 38.9+ pips up is 08:35 (best +45.5) -> half banked at 1.09920, +0.49R. Later the low touches my entry price by 0.1 pip at 09:45 ->
  the break-even stop takes the runner at -0.00R. Noon was 1.09822: A2 +0.73R, PM2 +0.85R, PM1 +0.49R, PM3 0.00R. The engine's numbers match the candles.
- 02-19 buy 1.14104: best price of the morning +39.6 pips at 08:30. That fills the half's target (38.9 pips from my fill, see below) but does not reach the 40.0 that
  moves PM3's stop. Then -25 pips, noon -0.36R for A2; PM1 +0.48R, PM2 +0.30R, PM3 = A2. Matches.
- Two things the hand check showed that the table hides: (1) the half's target sits 40 pips from the price I decide at, which for a buy is 38.9 pips from my fill
  (spread and slippage) - so "+1R" is really +0.97R on buys; (2) two of the five "came back" days were decided by a fraction of a pip (03-24 by 0.1, 02-19 by 0.7).
  With real fills either could have gone the other way. Five cases, two of them coin flips: I cannot say anything precise about how often a +1R trade comes back.
- Also checked: daily R is the sum of both halves over the same $125; a full stop is -1.00R in every variant; the 71 "differences" the first print showed were rounding of
  two half-lots (0.1562 x 2 against 0.312) - with a 0.02R tolerance the variants differ from A2 on exactly the 33 days that reached +1R (PM3: 4 days).

## Kill lines applied
| line | PM1 | PM2 | PM3 |
|---|---|---|---|
| K1 net R >= 95% of A2 | FAIL (83%) | FAIL (85%) | PASS (95.3%, barely) |
| K2 score >= 1.25x A2 | FAIL (0.83x) | FAIL (0.85x) | FAIL (0.84x) |
| K3 Feb AND Mar-now: net >= 95%, or DD <= 70% with net >= 85% | Feb PASS (103%, DD 55% of A2's); Mar-now FAIL (82%, same DD) | Feb PASS (99%); Mar-now FAIL (87%, same DD) | Feb PASS; Mar-now FAIL (89%, DD higher) |
| K4 worst 10 days not worse than A2 (-1.37) | FAIL by 0.01 (-1.38) | PASS (-0.91) | FAIL (-2.31) |
VERDICT: NO SURVIVOR. Idea closed, no forward tag. Exit stays "40 pip stop, whole position, out 12:00 London". My guess was right for PM1 and PM2 (83-85%, same drawdown);
for PM3 I guessed "within 2R either way" - it is 1.6R behind with a deeper drawdown.

## What I learned
- The coach's suspicion about January was fair and partly right: outside January the partial costs much less. In February PM1 made slightly MORE than A2 with almost half
  the drawdown (one day, 02-19, does all of it: -0.36R became +0.48R). So this is not the 78% story everywhere.
- But over the two months that are new for this question together (Feb + Mar-now, 52 days): A2 +18.32R, PM1 +15.93R (87%), PM2 +16.53R (90%). And the maximum drawdown over all
  history does not move at all (2.03R, the 04-07/04-08 stops plus the days around them): a partial cannot touch a drawdown, because a drawdown is made of days that never
  reach +1R. What gets smaller is the spread of the good days (sd 1.04 -> 0.85). That looks steadier and is not safer.
- Why it costs: a trade that reaches +1R before noon finishes above +1R three times in four (25 of 33). Banking half there sells the part of my rule that pays.
  The 27 worse days cost 8.0R; the 6 better days gave back 2.4R.
- The break-even stop by itself (PM3) is the worst of the three for a funded account: it rarely matters (4 days in 71), and when it does it mostly takes me out of trades
  that were fine at noon (03-24 +0.73R, 03-30 +0.85R). It made the worst 10-day stretch deeper (-2.31R against -1.37R) because it turned two winners inside a losing
  stretch into zeros. "Protecting" a winner removed the cushion I needed that week.
- If I ever want a calmer curve, the honest tool is the one from the weekend's test: a smaller size. Halving the size halves the drawdown AND keeps the shape of the edge;
  the partial keeps the drawdown and cuts the edge by 15%.
- Honest limits: 71 days; 5 come-back cases; January known beforehand; one pass, no thresholds tuned. The partial at +1R has now been tested on everything I have and
  fails both times. I will not look at it again unless the forward record changes character (many more come-back days), which the tally would show.
Counts: ideas 38, variants 101 (two of the three are re-runs of January-tested definitions on the full history, made at the coach's request and marked as such).
