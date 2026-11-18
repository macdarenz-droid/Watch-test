# One thing a better trader would improve on my best idea (A2): not being wicked out at the day's extreme. HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY RUN
Clock Fri 2015-04-17 01:00 London (end of released data). All lived history 01-06 .. 04-16 (explicit end date = the clock); costs on; London time.

## Why this one
My single best idea is still the only one I trade: A2. Entries (9 filters), exits (23 definitions), management and size are tested and closed. What my journal keeps
writing about the rule's losses is one specific thing, three times in six weeks:
- 03-09: stop taken, then the day went my way. - 04-08: stop taken by 2.3 pips at the high of the day, 110 pips my way afterwards. - 04-16 (yesterday): stop taken by 1.4 pips
  at the low of the day, +105 pips by noon.
A better trader does not leave a hard order sitting exactly where a spike can tag it. The usual professional answer is a stop "on a close": I am wrong when a candle CLOSES
beyond my level, not when one tick pokes through it, with a wider hard stop behind it for accidents.
I tested wider stops (S50/S60/80, January) - they lose because every loss gets bigger and the position smaller. A close-stop is a different thing: same size, same
level, it only forgives wicks.

## Counted before writing the test (occurrences and times only; nothing after any stop was looked at for this count)
73 A2 trades, 10 stopped out: 01-19 09:20, 01-27 08:10, 02-20 09:05, 03-02 09:55, 03-09 10:10, 03-19 08:15, 03-27 11:20, 04-07 09:15, 04-08 11:15, 04-16 10:00.
A close-stop can only differ from A2 on these 10 days (a candle cannot close beyond a level without touching it). Three of the ten are the days that gave me the idea.
That leaves SEVEN clean cases.

## What this test can and cannot do - said before it is run
- Seven cases cannot make a rule. My sample-size rule asks for 100 same-trade cases; stop-outs come about 40 times a year. A survivor here earns a forward PAPER tag only
  (one more line in the daily tally), to be looked at again after 30 further stop-outs. Nothing changes in the plan either way.
- It CAN be killed: if on the seven clean days the close-stop is no better than the hard stop, the three days I remember are just the ones I remember.
- What I remember about the seven (contamination, honestly): 04-07 fell 89 pips straight through the stop and 01-27 went fast - a close-stop loses MORE on days like that.
  I do not remember what happened after the stops on the other five.
- Cost I know in advance: when the stop is real, a close-stop exits at the next bar's open, beyond the level. Those losses will be bigger than -1R. The daily line (5%) is
  not in reach at 0.50%; the hard stop bounds the worst case.

## Hypothesis
Among my stop-outs, enough are wicks (price pokes through the 40 pip level and comes back before a candle closes beyond it) that exiting on a CLOSE beyond the level,
with a hard stop further out, makes the stop days cheaper in total - also on the seven days that did not inspire the idea.

## Variants (105, 106, 107; ideas -> 40), no others afterwards. Entry, direction, size (0.31 lots = $125 per 40 pips) and the 12:00 exit exactly A2.
- CS1: exit when a 5-MINUTE candle closes beyond the 40 pip level (at the next bar's open); hard stop order at 60 pips.
- CS2: exit when a 15-MINUTE candle closes beyond the level; hard stop at 60 pips. (More forgiving, slower.)
- CS3: as CS1 with the hard stop at 50 pips. (Less forgiving of deep wicks, smaller worst case.)
R per day stays "result / $125", so a close-stop loss shows as worse than -1.00R.

## KILL TEST (explicit). The three inspiring days (03-09, 04-08, 04-16) are REMOVED from every number; they are shown separately, labelled as what they are.
A variant survives the build only if ALL:
  K1. on the seven clean stop days together it is at least 1.0R better than A2;
  K2. at least 3 of the seven are improved, and no single day is more than 60% of the total improvement;
  K3. worst single day over all history not worse than -1.50R;
  K4. maximum drawdown over all history (inspiring days removed) not above A2's.
Survivor = paper tag as described above. No survivor = closed, and the sentence "stopped by 2 pips at the extreme" goes back to being the known price of a hard stop.
My guess, written now: most of the seven were real moves; the close-stop turns -1.00R into about -1.1 to -1.4R on four or five of them and saves one or two.
K1 fails for all three. CS2 (15-minute) is the most likely to both save a wick and take a -1.5R day, failing K3.
Before any total: mechanics hand-checked against the 5-minute candles on two days (one where the stop was a wick, one where it was real), as in the last two tests.

# RESULTS (kill lines above pushed in commit 0167aa0 before any code; one run: `python bt/ab_cstop.py CS1,CS2,CS3 2015-04-17 2015-03-09,2015-04-08,2015-04-16`)
73 days 01-06..04-16, engine, full costs. The script asserts that every variant is identical to A2 on all non-stop days (it is).

## Mechanics checked by hand on two days BEFORE the totals
- 04-16 (inspiring day, a wick): level 1.06259; the deepest poke beyond it before noon is 1.2 pips; no 5- or 15-minute candle closes beyond it. A2 is stopped at 10:00;
  all three variants hold to noon and close at 1.07125: +1.14R instead of -1.03R. Engine = candles.
- 04-07 (a real move): level 1.08813; price goes 47 pips beyond it. First 5-minute close beyond the level is the 09:20 candle -> CS1 exits at the 09:25 open, bid 1.08720
  less slippage = 1.08719, -1.26R. The 15-minute candle completes at 09:30 -> CS2 exits there, -1.26R. CS3's 50 pip hard stop is hit inside the 09:20 candle: -1.28R.
  A2: -1.03R. Engine = candles.

## The seven clean stop days (A2 -> variant; "close" = exited on a candle close, "sl" = the hard stop was hit first)
| day | A2 | CS1 (5-min close, hard 60) | CS2 (15-min close, hard 60) | CS3 (5-min close, hard 50) |
|---|---|---|---|---|
| 01-19 | -1.00 | -1.14 close | -1.33 close | -1.14 close |
| 01-27 | -1.00 | -1.01 close | -1.01 close | -1.01 close |
| 02-20 | -1.03 | -1.19 close | -1.10 close | -1.19 close |
| 03-02 | -1.00 | -1.02 close | -1.13 close | -1.02 close |
| 03-19 | -1.03 | -1.36 close | -1.53 sl | -1.28 sl |
| 03-27 | -1.00 | -1.00 close | -1.05 close | -1.00 close |
| 04-07 | -1.03 | -1.26 close | -1.26 close | -1.28 sl |
| sum vs A2 | - | -0.87R | -1.31R | -0.81R |
Improved days: 0 of 7, for every variant. Not one of the seven clean stop-outs was a wick.
The three inspiring days, NOT counted: 03-09 -1.00 -> -1.01 | 04-08 -1.00 -> -0.71 | 04-16 -1.03 -> +1.14 (same for all three variants).

## Totals without the inspiring days
| | net R | vs A2 | max DD | worst day (all history) |
|---|---|---|---|---|
| A2 | +36.71 | - | 1.87 | -1.03 |
| CS1 | +35.83 | -0.87 | 2.02 | -1.36 |
| CS2 | +35.40 | -1.31 | 1.94 | -1.53 |
| CS3 | +35.89 | -0.81 | 2.02 | -1.28 |

## Kill lines applied
| line | CS1 | CS2 | CS3 |
|---|---|---|---|
| K1 clean stop days at least 1.0R better | FAIL (-0.87R) | FAIL (-1.31R) | FAIL (-0.81R) |
| K2 at least 3 of 7 improved, none > 60% of the gain | FAIL (0 of 7) | FAIL (0 of 7) | FAIL (0 of 7) |
| K3 worst day >= -1.50R | PASS (-1.36) | FAIL (-1.53) | PASS (-1.28) |
| K4 max DD not above A2's (1.87R) | FAIL (2.02) | FAIL (1.94) | FAIL (2.02) |
VERDICT: NO SURVIVOR, no paper tag. Idea closed. The hard 40 pip stop stays. My guess was right in direction and too kind in degree: I expected one or two saved wicks
among the seven; there were none.

## What I learned
- When my stop is hit, it is almost always real. On 9 of my 10 stop-outs a candle then CLOSED beyond the level, usually within minutes, and waiting for that close
  only made the loss bigger (-1.0R -> -1.1 to -1.5R). The hard stop got me out at the best available price nine times in ten.
- "Stopped by a pip at the extreme, then it went my way" has happened exactly ONCE in 73 trades: yesterday. I had written it up as three.
  - 03-09: a candle closed beyond the level; the close-stop loses the same.
  - 04-08: the close-stop survives the 2.3 pip wick - and still loses 0.71R at noon. Checking this I found an ERROR IN MY OWN JOURNAL for 04-08: I wrote "by noon it was
    back at 1.0843". It was not. At 12:00 London price was 1.0872, 27 pips against me; 1.0843 came about 12:45-13:00 London. I had read a UTC hour as a London hour.
    So on 04-08 I was not "right and robbed by the spread": at my own exit time I was simply wrong, and the 110 pips came in the afternoon, when I am never in.
    Logged as process mistake P3 (a number in the journal read in the wrong time zone); the 04-08 entry gets a dated correction, the original line stays visible.
- So the story "three times in six weeks" that made me pick this idea was one real case, one misread and one half-truth. This is the cleanest example I have of how
  a loss I remember vividly grows in the retelling. The count took one command.
- What a better trader would improve here is not the stop. It is the note-taking: write the price AT NOON LONDON from the tool, every stopped day, before writing the story.
  That goes into the daily routine: on a stop-out day the result line must contain "price at 12:00 London: x (y pips from my entry)", read from the engine.
- Honest limits: 7 clean cases; this kills the idea on my history, it does not prove hard stops are best in general.
Counts: ideas 40, variants 107.
