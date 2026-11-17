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
