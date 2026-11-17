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
