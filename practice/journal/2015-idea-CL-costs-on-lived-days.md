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
