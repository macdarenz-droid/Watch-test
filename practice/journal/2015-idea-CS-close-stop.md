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
