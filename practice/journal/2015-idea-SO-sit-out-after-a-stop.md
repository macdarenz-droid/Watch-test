# Idea SO (idea 77): sit out the day after a full stop - PRE-REGISTRATION with worked cases (pushed before the script is written or run)
Sim clock Tue 2015-06-09 01:00 London. END 2015-06-09. Coach 06-08: not another entry tweak - trade management or which days to sit out. One test, one day.
## Why this one
My stops come in bunches when I look back at them: six losses in a row in April, 05-11 / 05-12, 05-20 / 05-21 / 05-22, 06-01 / 06-03, and the block
reshuffles of my sims are a little different from the plain ones. If bad mornings cluster, the simplest sit-out rule is my own result: after a full
stop, skip tomorrow. It needs no market reading at all. I have grouped "day after a loss" once, on 34 trades in March (ten looks); it has never been tested.
Known against it, stated and added up on purpose: the day after each of my last 11 live full stops (from my trade tables) made +1.51, +2.87, -1.00,
-1.00, -1.00, +0.69, +2.17, -1.00, -1.00, +0.64, +0.85 = +3.73R, +0.34R a trade - an ordinary A2 average, with my two best days of the month in it.
I have seen these; they are contamination and they say "no". The honest prior is that this is the gambler's fallacy with a rule attached.
## Variants (3; A2 unchanged otherwise; a skipped day = 0R; "yesterday" = the previous A2 trading day; the rule looks only at A2's own engine results,
so a skipped day's would-be result still counts as "yesterday" for the next day - the paper record keeps running)
- SO1: no trade the day after a full stop.
- SO2: no trade after two losing days in a row (any loss).
- SO3: no trade the day after a full stop that came in the first hour (before 09:00): the "wrong from the first minute" kind.
## WORKED CASES (June goal; python line before this push)
- Mechanics: 06-01 was a full stop (09:38) -> SO1 skips 06-02 (A2 +1.51R live). 06-03 was a full stop at 08:11 -> SO1 and SO3 skip 06-04 (+2.87R).
  05-29 full stop -> skip 06-01 (-1.00R). The script must list 06-01, 06-02 and 06-04 among SO1's skipped days.
- Expectation: about 25 full stops in the engine list -> about 25 skipped days for SO1. If results are independent, those days average the usual
  +0.33R with a standard error of 0.21R, and an average of 0R or less would turn up by chance about 6% of the time.
## Kill lines (SO1 is the main variant; all A2 days before 2015-06-09, costs on, nothing dropped - what I have seen argues against the idea; one failure kills)
- K1: the skipped trades average 0R or less.                          [worked: under independence about +0.33R; my last 11 say +0.34R -> expect FAIL]
- K2: the rule costs no money: net R >= A2's and max drawdown not larger.
- K3 lived days: the skipped lived trades (from 03-02) average 0R or less.   [the backtest months have only 3 full stops: reported, not judged]
- K4 neighbours: the skipped groups of SO2 and SO3 average +0.10R or less.
- K5 sample: at least 15 skipped trades for SO1.                       [worked: about 25 -> expect PASS]
Also reported, because it is the real question behind the rule: after a full stop, how often is the next day a full stop too, against the base rate.
A survivor gets the lived-days table and then at most a forward paper tag.
My guess = the worked expectation: SO1's skipped days are ordinary; killed on K1 and K2.

## Mechanics check (in the run's own print)
SO1's skipped days include 06-01 (after the 05-29 stop), 06-02 (after 06-01) and 06-04 (after 06-03), as the worked case said. 24 skipped days.

## Results (run once; `python bt/sit_out.py 2015-06-09`; costs on; figures copied from the print)
A2: 110 days, net +34.73R, +0.316R a trade, max DD 4.54R; 25 full stops (23%), 6 of them before 09:00. Lived days +15.17R.
| variant | skipped | wins | avg R of skipped | net of skipped | lived among them (avg) | rule net (vs A2) | max DD | lived days: rule vs A2 |
|---|---|---|---|---|---|---|---|---|
| SO1 after a full stop | 24 | 15 | +0.416 | +9.97 | 21 (+0.401R) | +24.75 (-9.97) | 5.67R | +6.75 vs +15.17 |
| SO2 after two losing days | 17 | 11 | +0.481 | +8.17 | 13 (+0.446R) | +26.56 (-8.17) | 8.07R | +9.37 vs +15.17 |
| SO3 after a stop before 09:00 | 5 | 4 | +0.788 | +3.94 | 4 (+0.914R) | +30.79 (-3.94) | 5.31R | +11.51 vs +15.17 |
The question behind the rule: after a full stop the next day is a full stop on 7 of 24 days (29%), against a base rate of 23%.

## Kill lines for SO1
| line | worked expectation | result | verdict |
|---|---|---|---|
| K1 skipped trades average 0R or less | about +0.33R under independence | +0.416R | FAIL |
| K2 costs no money | - | -9.97R; drawdown 5.67R against 4.54R | FAIL |
| K3 lived skipped trades average 0R or less | my last 11: +0.34R | +0.401R in 21 | FAIL |
| K4 neighbours' skipped groups at +0.10R or less | - | +0.481R and +0.788R | FAIL |
| K5 at least 15 skipped trades | about 25 | 24 | PASS |
VERDICT: SO1 KILLED on four lines; SO2 and SO3 are worse ideas still. No tag.

## Worked expectation against the run
Expected about 25 skipped days averaging about +0.33R; got 24 averaging +0.416R. As predicted; nothing to explain.

## What I learned
- The day after a full stop is a slightly BETTER than average A2 day (+0.42R against +0.32R). Sitting out after a stop would have cost 10R in five months
  and made the drawdown deeper, because the recovery trades are exactly the ones it skips (05-19 +2.18R, 06-02 +1.55R, 06-04 +2.95R all follow a stop).
- Stops do cluster a little - 29% after a stop against 23% overall, 7 cases in 24 - and it does not matter: the 17 other days more than pay for them.
  "Bad mornings come in bunches" is true enough to feel and far too weak to trade.
- After two losing days in a row the next day averages +0.48R; sitting those out nearly doubles the drawdown (8.07R). The urge to step aside
  during a losing run is the most expensive instinct I have measured so far.
- This is the answer to the feeling I logged on 06-01 ("tired of stops, aware the half-size line is close"): the rule that keeps me in is worth more
  than any rule that takes me out. The only sit-out I have is the money rule, and GD showed what that one is for.
- Days to sit out, tested and dead: Fridays (W), Mondays (MO), after a wide day (GA), after a big pre-entry hour (BH, too thin), after a stop (SO).
  On paper: UN3 (signals disagree), PH2 (half size after a lively hour). None adopted.
Counts: ideas 77, variants 216 (SO1 SO2 SO3). Adopted trading ideas: 0. On paper: UN3, PH2, MB1. Numbers or rules corrected after a push in June: 0.
