# Idea CS again, forward (idea 78): a stop on a candle CLOSE - the April definitions judged on the days since - PRE-REGISTRATION with worked cases
(pushed before the script is written or run)
Sim clock Wed 2015-06-10 01:00 London. END 2015-06-10. Coach 06-09: ONE thing about how I manage A2 once I am in - "stop placement after a poke" is his first
example; hypothesis and kill line first, max 3 variants, costs on.
## Why this one, and why it is a fair test now
- My stop has been taken by a small poke and then proved right about the level five or six times in four weeks: 05-18 (10.3 pips), 05-20 (4.8), 06-01 (6.7),
  06-08 (7.8), 06-09 (0.2 pips at the first touch). SA showed that a WIDER stop at the same $ risk costs far more than it saves. A stop that asks for
  a candle CLOSE beyond the level is a different tool: same level, same size, it only ignores wicks.
- I tested exactly this in April (idea CS, journal/2015-idea-CS-close-stop.md): three definitions, 10 stop-outs, 7 clean, 0 of 7 improved, killed. The coach
  called it honest and thin. The definitions have sat frozen in bt/ideas.py since 04-17 (CS1, CS2, CS3). Every day after that is a FORWARD day for
  them: 15 more full stops, none of which shaped the definitions.
- What is NOT clean, said plainly: I choose to come back to it now BECAUSE of the pokes I have just watched. The definitions are old; the timing of
  the re-test is not innocent. That is why the lines below are hard and why a pass could only earn a paper tag.
## The three definitions (unchanged since April; engine parameter cstop = (candle minutes, hard stop pips); size from the 40 pip level, i.e. the same 0.31 lots)
- CS1: exit when a 5-minute candle CLOSES beyond the 40 pip level (at the next candle's open); hard stop order at 60 pips.
- CS2: the same on a 15-minute close; hard stop 60 pips.
- CS3: 5-minute close; hard stop 50 pips.
Risk said now: the hard stop is further away at the SAME size, so a single day can lose up to about 1.5R (CS1, CS2) or 1.25R (CS3) instead of 1R.
## Decision set
Forward days only: every A2 day from 2015-04-20 (the first day after the April test) to END. All days from January are reported beside and decide nothing.
## WORKED CASES (June goal; python line from my own walk prints, before this push)
- 06-08, sell, stop level 1.11714: the 08:45 M15 candle's bid high was 1.11782 (ask 1.11792: touches the level) but it closed at 1.11665 (ask 1.11675:
  NOT beyond). Hard stop 60 pips is near 1.1191: not touched. Held to noon: exit about 1.11323 -> about -0.7 pips = -0.02R, against A2's -1.00R.
  The script's check of 06-08 must show CS2 held to 12:00 at about -0.02R (CS1 depends on 5-minute closes I have not seen).
- Rough expectation from my stop-day notes: gains on the eight days I noted as pokes or part-pokes about +6.1R; cost on about 17 real stops (a close
  beyond the level and an exit one candle later, say 0.25R worse each) about -4.3R; net about +1.8R on all days since January. Rough in both halves:
  I do not know the 5-minute closes, and a real break that runs to the hard stop costs 0.5R, not 0.25R.
## Kill lines (each variant against A2 on the forward days, costs on; one failure kills it)
- K1: net R at least 1.0R above A2.                              [worked: about +1.8R on all days, most of it forward -> could pass; I do not know]
- K2: improved days >= worsened days, and still ahead of A2 without its single best day.
- K3: max drawdown on the forward days not larger than A2's, and no day worse than -1.55R.
- K4: at stressed costs (2.0 pip spread, 0.5 slippage) still not behind A2 at the same costs.
- K5 sample: at least 10 changed days on the forward set.
A survivor gets the lived-days table (here: the same forward set, already lived) and then at most a forward PAPER tag; the live stop stays a hard
40 pip order whatever comes out.
My guess (kept to show I cannot guess): CS2 about +1R ahead on the forward days and failing K2 because 04-16-style days are rare; CS1 worse than CS2.

## Mechanics check against the worked case (`python bt/cs_forward.py 2015-06-10 --check 2015-06-08`)
06-08: A2 stopped 08:50, -1.00R. CS2 (15-minute close): held, exit 12:00 @1.11323, -0.02R - the worked case exactly. CS1 and CS3 (5-minute close): a
5-minute candle DID close beyond the level; exit 08:55 @1.11742, -1.06R. (The rough expectation's 17 x 0.25R is 4.25R exactly; I wrote "about -4.3R".)

## Results (run once; `python bt/cs_forward.py 2015-06-10`; costs on; figures copied from the print)
A2 on the FORWARD days (37 days from 04-20): net -1.71R, max DD 4.54R, worst day -1.03R, 16 full stops; at stressed costs -3.19R.
| variant | forward net (vs A2) | changed days | better / worse | without its best day | max DD | worst day | stressed vs A2 stressed | all days since January vs A2 (before 04-20) |
|---|---|---|---|---|---|---|---|---|
| CS1 5-min close, hard 60 | -3.08 (-1.37) | 11 | 0 / 11 (-1.33R) | -1.37 | 5.14R | -1.22R | -1.33 | +0.21 (+1.58) |
| CS2 15-min close, hard 60 | -1.99 (-0.28) | 11 | 3 (+1.30R) / 8 (-1.53R) | -1.27 | 5.26R | -1.53R | -0.70 | +0.87 (+1.15) |
| CS3 5-min close, hard 50 | -3.34 (-1.63) | 11 | 0 / 11 (-1.59R) | -1.63 | 5.28R | -1.28R | -1.73 | +0.01 (+1.65) |
CS2's changed forward days (A2 -> CS2): 04-23 -1.00 -> -1.06 | 04-24 -1.03 -> -1.14 | 05-04 -1.03 -> -1.13 | 05-11 -1.03 -> -0.95 | 05-12 -1.00 -> -1.07 |
05-15 -1.03 -> -1.39 | 05-18 -1.03 -> -1.15 | 05-21 -1.00 -> -1.23 | 06-03 -1.03 -> -1.53 | 06-08 -1.00 -> -0.02 | 06-09 -1.03 -> -0.79.

## Kill lines (forward days)
| line | CS1 | CS2 | CS3 |
|---|---|---|---|
| K1 at least +1.0R above A2 | FAIL (-1.37) | FAIL (-0.28) | FAIL (-1.63) |
| K2 improved >= worsened, ahead without its best day | FAIL (0 / 11) | FAIL (3 / 8; -1.27 without 06-08) | FAIL (0 / 11) |
| K3 drawdown not larger, no day worse than -1.55R | FAIL (5.14R) | FAIL (5.26R) | FAIL (5.28R) |
| K4 not behind at stressed costs | FAIL | FAIL | FAIL |
| K5 at least 10 changed days | PASS (11) | PASS (11) | PASS (11) |
VERDICT: all three KILLED a second time, now on forward days that never shaped them. No tag. The stop stays a hard 40 pip order.

## Worked expectation against the run
I expected about +1.8R (gains about +6.1R on eight "poke" days, costs about -4.25R). The run: -0.28R for the best version; its gains are +1.30R on three days.
The reason, found in the day list: my noon routine calls a stop a "poke" when the price is back inside the level BY NOON. That is not the same as "only a
wick went through". On 05-18 a 15-minute candle CLOSED beyond the level (CS2 exits at -1.15R); 05-20 and 06-01 do not even appear among the changed days
(the close-stop exits at about the same price); only 06-08 was a true wick. I counted eight pokes; by the rule's own definition there was one and two
halves. My expectation was built on my own label, not on the candles. No pushed figure of record needed correcting; the label itself is corrected below.

## What I learned
- A stop on a close does not fix my "pokes", because most of them are not wicks: the market trades through the level, a candle closes there, and THEN
  it comes back. A close-stop pays 0.1R to 0.5R more on every real break (11 of 11 worse on the 5-minute version) to save one day in five weeks.
- April said 0 of 7 improved; the 37 forward days say 0 of 11 (5-minute) and 3 of 11 (15-minute), net negative, deeper drawdown, a worst day of -1.53R.
  Same answer from data the idea had never seen. That is what a real kill looks like, and it took a frozen definition to get it.
- My stop-day routine keeps its noon price (it is useful), but the word changes from today: "price back inside the stop by noon", not "poke". A poke
  is a wick, and I have had about one.
- Stop placement, summed up: tighter is leverage (06-03 look), wider loses 9.6R to 21.5R (SA), on a close loses on forward days (CS twice), time-decay
  loses (TD). The hard 40 pip stop has now been attacked from all four sides.
Counts: ideas 78, variants 219 (CS1 CS2 CS3 re-run forward, counted again). Adopted trading ideas: 0. On paper: UN3, PH2, MB1.
Numbers or rules corrected after a push in June: 0.
