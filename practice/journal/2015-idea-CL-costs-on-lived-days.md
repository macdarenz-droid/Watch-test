# Idea CL (idea 70): A2 on my LIVED days under worse costs - PRE-REGISTRATION with a worked case (pushed before the script is written or run)
Sim clock Fri 2015-05-29 22:00 London. END 2015-05-30. The May review is written (coach's order); this is the next test.
## Why this test
- The coach, 05-26: A2 is judged on my lived forward days, with costs on. My only cost stress of A2 (03, journal/2015-cost-stress-test.md) was on January
  and February - the backtest months, with 8% full stops. The lived days (from 03-02, 65 trades, 29% full stops, +0.22R a trade) have never been stressed.
- May left the live average's error band touching zero. Before I ask whether the edge is fading I should know how much of it is cost-sensitive at all.
- The sim charges 1.0 pip spread + 0.1 slippage. I do not know what a real account pays at 08:00 London; so the honest question is "how wrong can my cost
  assumption be before the lived edge is gone?"
## Hypothesis
On my lived days A2 keeps an average of at least +0.10R (the alarm's own line) at double costs (2.0 pip spread + 0.5 slippage) and stays above zero at
triple costs (3.0 + 1.0).
## Scenarios (3; same rule, same days, engine parameter costs = (spread, slippage); counted as variants)
- C15: 1.5 pip spread + 0.3 slippage. C2: 2.0 + 0.5. C3: 3.0 + 1.0.
## WORKED CASE, before the push (my June goal): Thu 05-28, my live sell, by a python line from figures in my journal
Bid at 08:00 1.09339, bid at 12:00 1.09285, morning's highest bid 1.09507, stop 40 pips above the 08:00 bid = 1.09739.
- Normal costs 1.0 / 0.1: entry 1.09338, exit 1.09296, +4.2 pips = +0.10R. (My live trade: entry 1.09338, exit 1.09296, +0.10R. The hand model is right.)
- Double 2.0 / 0.5: entry 1.09334, exit 1.09310, +2.4 pips = +0.06R. Stop touched? highest bid + 2.0 pips = 1.09527 < 1.09739: no.
- Triple 3.0 / 1.0: entry 1.09329, exit 1.09325, +0.4 pips = +0.01R. Stop: 1.09537 < 1.09739: no.
- So each trade pays 1.8 pips more at double costs (0.045R) and 3.8 pips more at triple (0.095R). Prediction worked from that: lived average +0.22R ->
  about +0.175R at double, about +0.125R at triple, BEFORE the one thing arithmetic cannot give: sells whose stop is touched earlier because the ask is
  further from the bid. That is the unknown this run measures.
## Kill lines (lived days 03-02 to 05-29; one failure kills the hypothesis)
- K1: average R at double costs >= +0.10R.   [worked: predicted +0.175R before extra stops -> expect PASS unless extra stops take 0.075R a trade]
- K2: average R at triple costs > 0R.        [worked: predicted +0.125R]
- K3: max drawdown at double costs <= 8R (the alarm's drawdown line).   [normal costs: 3.75R on the engine]
- K4: wider costs add at most 3 full stops at double costs.   [worked on 05-28: none added]
Reported beside: the same on the January-February days; the break-even extra cost in pips (lived average x 40 pips).
If a line fails: nothing about A2 changes by this test; it goes to the coach as "the lived edge does not survive cost X".
My guess: all four pass; break-even about 9 pips of extra round-trip cost (0.22R x 40 = 8.8, by python below when I run it).

## Mechanics check against the worked case (`python bt/costs_lived.py 2015-05-30 --check 2015-05-28`)
Engine, 05-28: normal entry 1.09338 exit 1.09296 +0.10R; double entry 1.09334 exit 1.09310 +0.06R; triple entry 1.09329 exit 1.09325 +0.01R; stop 1.09739
untouched in all. Every figure equals the hand-worked line in the pre-registration.

## Results (run once; `python bt/costs_lived.py 2015-05-30`; figures copied from the print)
| costs (spread / slippage, pips) | LIVED days from 03-02: trades, wins, avg R, net R, max DD, full stops | vs normal, per trade | backtest days before 03-02 (reported): avg R, net R, full stops |
|---|---|---|---|
| normal 1.0 / 0.1 | 65, 58%, +0.221R, +14.38R, 3.75R, 19 (10 sells, 9 buys) | - | +0.502R, +19.56R, 3 |
| C15 1.5 / 0.3 | 65, 57%, +0.201R, +13.05R, 3.92R, 19 | -0.021R | +0.463R, +18.06R, 4 |
| C2 double 2.0 / 0.5 | 65, 55%, +0.180R, +11.71R, 4.10R, 19 | -0.041R | +0.442R, +17.22R, 4 |
| C3 triple 3.0 / 1.0 | 65, 49%, +0.134R, +8.72R, 4.68R, 19 | -0.087R | +0.394R, +15.35R, 4 |
Break-even on lived days: 8.9 pips of extra round-trip cost (+0.221R x 40 pips).

## Kill lines
| line | worked prediction | result | verdict |
|---|---|---|---|
| K1 lived average at double costs >= +0.10R | about +0.175R before extra stops | +0.180R | PASS |
| K2 lived average at triple costs > 0R | about +0.125R | +0.134R | PASS |
| K3 max drawdown at double costs <= 8R | - | 4.10R | PASS |
| K4 at most 3 extra full stops at double costs | none on the worked day | 0 extra on lived days (1 extra in the backtest months) | PASS |
VERDICT: the hypothesis SURVIVES all four lines. It is a health check of the rule I already trade, so a pass changes nothing and earns no tag.

## Prediction against result
Predicted +0.175R and +0.125R; got +0.180R and +0.134R. The first forecast in a month that landed - because it was a worked case, not a guess. (The small
difference: the worked case assumed every trade pays the full exit cost; stopped trades pay the stop's slippage only.)

## What it tells me
- The lived edge is not a cost artefact. I would have to be wrong about my costs by almost 9 pips a round trip - eight times what the sim charges - before
  65 lived trades net to zero. Doubling the costs takes a fifth of the edge (0.041R of 0.221R); tripling takes two fifths.
- The one unknown the arithmetic could not give came out as zero: wider spreads did not push a single extra lived trade into its stop. My stops are not
  near-misses of the spread; when they are hit they are hit properly (the MFE / MAE log said the same from the other side).
- What it does NOT tell me: whether +0.221R is still the true average. Its error band is +-0.26R. Costs are simply not where my risk is; the size of the
  edge is, and only more lived trades can speak to that (the alarm at 100).
- At triple costs the win rate drops from 58% to 49%: a tenth of my winners are small enough for costs to turn them over. Worth knowing if a real
  account's 08:00 spread ever looks like 3 pips: the edge would still be positive on these days, the experience would feel like a losing system.
Counts: ideas 70, variants 195 (C15 C2 C3). Adopted trading ideas: 0. On paper: UN3, PH2, MB1.
June goal, first use: every kill line had a worked case in the pushed pre-registration; nothing needed correcting after the push.
