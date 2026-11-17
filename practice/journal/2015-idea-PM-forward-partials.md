# Idea PM again, forward (idea 79): partial at +1R and / or break-even - the April definitions judged on the days since - PRE-REGISTRATION with worked cases
(pushed before any run)
Sim clock Thu 2015-06-11 01:00 London. END 2015-06-11. Coach 06-09: ONE thing about managing A2 once I am in (his list: stop after a poke - done
yesterday -, partials, time exit); max 3 variants, costs on. Coach 06-10: re-testing only on forward days "is the honest way".
## Why this, today
Yesterday's trade was +86 pips and closed -0.14R. A partial at +1R is the textbook answer to exactly that day. I tested it on all history to 04-14
(idea PM, journal/2015-idea-PM-partial-breakeven.md): PM1 kept 83% of A2's net, PM2 85%, PM3 95%; all killed. The three definitions have been frozen
in bt/ideas.py since 04-15. The 41 trading days since are forward days for them. Said plainly, as with CS: the definitions are old, my reason for
looking again today is one painful trade - which is why the lines are the same hard ones.
## Definitions (unchanged since April)
- PM1: half off at +40 pips (+1R) and the other half's stop to break-even.
- PM2: half off at +40 pips, the other half keeps the original stop.
- PM3: no partial; once the trade has been +40 pips the whole position's stop goes to break-even.
## Decision set
Forward days only: every A2 day from 2015-04-15 to END. All days since January reported beside, deciding nothing.
## WORKED CASES (June goal; python line from my own trade tables, before this push)
- 06-10 (reached +86.3 pips, A2 -0.14R): PM1 = +0.5R for the half closed at +40 pips, runner stopped at the entry on the way back = about +0.48R.
  PM3 = whole position out at the entry = about -0.03R.
- 06-04 (A2 +2.87R, never back to the entry after +40): PM1 = 0.5 + 2.87 / 2 = +1.94R. PM3 = unchanged.
  The script's check of 06-10 and 06-04 must show these (to the few hundredths that fills cost).
- Rough expectation for PM1 on the forward days, from my trade tables: it gives up half of everything above 1R on six big winners (04-17, 04-28, 04-30,
  05-19, 06-02, 06-04): about -2.90R; it gains on four days that reached +40 pips and closed under 1R (05-13, 05-25, 05-27, 06-10): about +1.03R.
  Net about -1.9R. PM2 a little worse than PM1 (no break-even on 06-10); PM3 within a few tenths of A2 either way.
## Kill lines (each variant against A2 on the forward days, costs on; one failure kills it) - the same as CS forward
- K1: net R at least 1.0R above A2.                         [worked: PM1 about -1.9R -> expect FAIL]
- K2: improved days >= worsened days, and still ahead of A2 without its single best day.
- K3: max drawdown on the forward days not larger than A2's.
- K4: at stressed costs (2.0 pip spread, 0.5 slippage) not behind A2 at the same costs.
- K5 sample: at least 10 changed days.
A survivor: at most a forward paper tag. The live exit stays "whole position, 40 pip stop, 12:00" whatever comes out.
My guess = the worked expectation: all three killed on K1; PM3 the closest.
