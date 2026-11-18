# New concept: how the 5 biggest days of Jan-Feb started (H1) + ONE trait turned into a test (written before any run)
Clock Wed 2015-03-11 00:00 UTC (end of released data). Jan-Feb only (END <= 2015-03-01); March is not used. Average day range in Jan-Feb: 126 pips (median 106).

## The five biggest days by high-low range, and their first hours
| Day | Range | Open->close | Where it opened vs the prior day's range | Before the start | The hour it started | Broke the prior day's high/low | Afterwards |
|---|---|---|---|---|---|---|---|
| Thu 01-22 | 334 pips | -245 | middle (0.53) | Asia 40 pips; London drifted UP +46 in two hours (wrong way) | 13:00 UTC: 125 pip candle, body -68 (scheduled news) | prior LOW at 13:00, same hour | 14:00 -99, 15:00 -46, kept falling to 21:00 |
| Fri 01-23 | 259 pips | -163 | at the bottom (0.09) | Asia 59 pips, slipped under the prior low at 05:00 | 08:00: 98 pip candle, body -74 | already under it since 05:00 | 09:00 -41, 11:00 -62; NY bounced half |
| Thu 01-15 | 225 pips | -159 | middle (0.48) | Asia 30 pips, dead | 09:00: 198 pip candle both ways, body -37 (shock) | prior LOW at 09:00, same hour | 10:00 -37, later 14:00 -68, 15:00 -45 |
| Tue 02-03 | 221 pips | +138 | upper part (0.66) | Asia 29 pips; London flat all morning | 13:00: 108 pip candle, body +95 | prior HIGH at 13:00, same hour | five more small up hours (+10 to +13 each) |
| Tue 01-27 | 199 pips | +142 | upper part (0.77) | Asia 35 pips, quiet shelf | 08:00: 104 pip candle, body +88 | prior HIGH at 08:00, same hour | two hours back (-19, -37), then +26 +38 +36 +28 |

## What they share
1. Nothing announced them: quiet Asia (29-59 pips), small candles before, and the open sat anywhere in the prior day's range. Two of the five first drifted the WRONG way.
2. Each began with ONE outsized hourly candle - 98 to 198 pips of range, three to five times a normal hour - not a slow build.
3. It came at a session open: 08:00 (London, twice), 09:00 (shock), 13:00 (US news hour, twice). Never in Asia, never mid-afternoon.
4. In four of five that same candle carried price out of the prior day's whole range (the fifth was already outside).
5. After the candle the day kept going the same way - sometimes after a two-hour pullback (01-27).
Something for my A2 head too: three of these five days started exactly when A2 enters or holds (08:00-09:00) and two started an hour after A2 is flat.

## Selection warning (the reason this needs a test, not a nod)
I picked the five BIGGEST days. A big day has, by construction, a big candle that was followed by more. The honest question is the reverse one:
of ALL the times a big hourly candle closes outside yesterday's range, how often does following it pay? The five days above cannot answer that - they are the answer key.

## ONE trait -> the test: idea M "ignition candle" (ideas -> 16). A separate setup, not a change to A2.
Setup: the first H1 candle of the day, between 07:00 and 16:00 UTC, that CLOSES beyond the prior trading day's high (or low) with a body of at least B pips in that direction.
Trade: market order in that direction at the open of the next hour; stop 40 pips; $125 risk; one trade per day; exit by the rule below; costs on.
Hypothesis: such a candle marks a day that keeps travelling, so following it for the rest of the day has positive expectancy after costs.
Variants (33, 34, 35), no others afterwards:
- M1: B = 40 pips, exit at 20:00 UTC.
- M2: B = 60 pips, exit at 20:00 UTC.
- M3: B = 40 pips, exit 4 hours after entry.

Kill tests (fixed now). Judged with the FIVE inspiring days removed (01-15, 01-22, 01-23, 01-27, 02-03) - my standing rule for ideas that come from looking at particular days.
Build - January: a variant survives only if, on the remaining days: at least 3 trades; avg R >= +0.30R; and net R still above 0 with its single best trade removed.
  Fewer than 3 remaining trades = "cannot be judged" = does not survive. Highest avg R among survivors = the candidate.
Check - February (CONTAMINATED: I know its path day by day), all three shown, only the candidate can be claimed: at least 3 trades; avg R >= +0.15R; net R above 0 without its best trade.
The full-month numbers WITH the inspiring days are reported too, clearly marked as flattered.
What a pass would earn: a forward paper tag only (a possible second setup for more trades per month). Not money.

My guess: with the five showpiece days removed, the setup triggers rarely and is about break-even - most big candles that poke outside yesterday's range are the END of a move
(my R1 detector had the wrong sign in February for a similar reason). I run it because a second, different setup is the one lever I have not found.
Nothing above has been run.

# RESULTS of idea M (run after commit a3b1803). M1/M2/M3 = variants 33/34/35; ideas 16. Costs on, $125 risk, stop 40. Jan-Feb only, one month per run (bt/ignite.py); March not used.

| Month | Variant | All triggers (FLATTERED: includes the inspiring days) trades / win / avg R / net R / max DD | Without the 5 inspiring days: trades / win / avg R / net R |
|---|---|---|---|
| Jan (build) | M1 body >= 40, exit 20:00 | 7 / 43% / -0.13 / -0.92 / 2.61R | 3 / 0% / -1.01 / -3.02 |
| Jan (build) | M2 body >= 60, exit 20:00 | 4 / 75% / +0.52 / +2.10 / 1.02R | 0 trades |
| Jan (build) | M3 body >= 40, exit after 4 hours | 7 / 43% / +0.08 / +0.57 / 2.67R | 3 / 0% / -1.01 / -3.02 |
| Feb (CONTAMINATED) | M1 | 2 / 100% / +1.31 / +2.63 / 0R | 1 / 100% / +1.54 / +1.54 |
| Feb (CONTAMINATED) | M2 | 2 / 100% / +1.31 / +2.63 / 0R | 1 / 100% / +1.54 / +1.54 |
| Feb (CONTAMINATED) | M3 | 2 / 100% / +1.11 / +2.23 / 0R | 1 / 100% / +1.55 / +1.55 |
January triggers (M1): 01-14 sell -1.00, 01-15* sell +0.41, 01-16 sell -1.00, 01-21 buy -1.02, 01-22* sell +2.06, 01-23* sell +0.65, 01-27* buy -1.02. February: 02-03* buy +1.09, 02-26 sell +1.54. (* = inspiring day)

## Build (January, inspiring days removed): NO SURVIVOR
- M1 and M3: the three other triggers were three full stops (01-14, 01-16, 01-21): avg -1.01R. M2: no trigger at all outside the showpiece days ("cannot be judged").
- Even WITH the showpiece days M1 loses in January (-0.13R per trade): one of the five "biggest days" itself was a full stop when entered after the candle (01-27: two-hour pullback),
  and two others paid little because the candle that qualified came late (01-15 and 01-22 only triggered at 14:00, after most of the move).
February: two triggers in the whole month, one of them a showpiece day. Nothing to judge. Closed.

## What I learned (the concept, not the rule)
- The selection warning was the whole story. Looking at the five biggest days, "one giant candle out of yesterday's range, then continuation" looked like a law.
  Counting every time that candle appeared: 9 triggers in two months, 5 on the days I had hand-picked, and the other 4 went 1 win, 3 full losses.
- By the time an hourly candle is big enough to notice, a 40 pip stop sits inside the normal pullback of that same move (01-27) or the move is mostly spent (01-14, 01-16, 01-21).
  Big days are obvious after the fact; entering after the proof costs the edge.
- Useful for how I read A2: three of the five giant days began in the 08:00-09:00 hour, where A2 is already in the market before the candle. Being positioned BEFORE the big hour
  with a small fixed stop is what A2 does; chasing after it is what M does. On this evidence the first is the better seat.
- A second setup for more trades per month is still missing. This one is not it.
- Counts: ideas 16, variants 35.
