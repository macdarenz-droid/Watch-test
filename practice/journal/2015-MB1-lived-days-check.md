# My single best idea on my lived days only, costs on (coach 05-26) - PRE-REGISTRATION (pushed before the script is written or run)
Sim clock Wed 2015-05-27 01:00 London. END 2015-05-27.
Coach: "66 ideas and 185 variants is a lot of looks at the same history, so a backtest win on it is weaker than it looks. A2 stays as is unless something
beats it on your lived forward days too. next test: pick your single best idea and check it on your lived days only, with costs on."
## Which idea is "the single best", decided by a rule and not by which looks good today
Of 66 ideas exactly one passed its own pre-registered kill test: MB1 (the first break of the 12:00-13:25 London box between 13:25 and 14:30, taken only
when it goes the way the morning went; 30 pip stop; flat 17:00). UN3 and PH2 are on paper too, but both FAILED their kill tests and are tracked only by the
coach's leave. So the best idea is MB1 - even though I know its ten forward days look bad. Picking PH2 because its forward tally looks better this
month would be choosing the test by its answer.
## What "lived days" means here, said exactly
Lived days = the days I traded live, from 03-02 on (62 days to 05-26). For MB1 they come in two kinds, and I keep them apart:
- (a) 03-02 to 05-12: lived, but they were INSIDE the history MB1 was built on. Not out-of-sample for MB1.
- (b) 05-13 to 05-26: lived AFTER the rule was frozen (10 days). The only true forward days. Far too few to judge alone; reported, not judged.
## What I already know (contamination, added up on purpose)
From prints already in my journal: on 03-02..05-12 MB1 kept 19 trades at +0.248R and removed 27 at -0.293R (all days); since then kept 2 (-0.24R) and removed
7 (+8.64R). My own arithmetic from those prints: kept about 21 trades at about +0.21R; removed about 34 at about +0.02R. So I expect the answer below to be
"kept barely positive, removed no worse, the filter's gap gone". This is not a blind test and I do not present it as one. It is the coach's question
asked properly: all lived days, one script, costs on, lines written first.
## The claim and its kill lines (lived days 03-02..05-26, all days, nothing dropped; costs 1.0 pip spread + 0.1 slippage, and stressed 3.0 + 1.0)
Claim: "MB1 holds on my lived days." One failure and the claim is dead.
- L1: kept trades average at least +0.15R at normal costs and at least +0.05R at stressed costs.
- L2: the filter still does something: kept minus removed at least +0.20R per trade.
- L3: it beats A2 where the coach says it must: MB1's kept trades average at least A2's average R per trade on the same lived days.
- L4: max drawdown of the kept trades at most 5R.
- Reported, not judged (too few): the same figures on the 10 true forward days.
## Consequences, written now
- If the claim dies: MB1 is NOT closed by this (its tag has its own early-close lines: kept DD above 6R; net below -3R after 20 kept; average below 0 at
  40 kept - none reached). But its file and STATE get the sentence "does not hold on lived days, 05-26", and I stop calling it "the one that passed".
- If it holds: nothing changes either. Paper only until 100 forward kept trades.
- A2 is not touched by any outcome.
Hand-check before totals: one lived day against the figure in my journal.
My guess: stated above from my own arithmetic - L1 normal passes narrowly, stressed fails; L2 fails; L3 fails.

## Mechanics hand-check (`python bt/mb1_lived.py 2015-05-27 --check 2015-05-19`)
05-19: morning -88.7 pips, break DOWN, +0.76R (stressed +0.64R), MB1 keep, A2 that morning +2.18R: the figures of my journal for that day.

## Results (run once; `python bt/mb1_lived.py 2015-05-27`; figures copied from the print)
| lived days | A2 (days, avg R) | box trades | MB1 KEPT: n, wins, avg R, net, max DD | kept at stressed costs | REMOVED: n, avg R, net | kept minus removed | every box trade, no filter |
|---|---|---|---|---|---|---|---|
| ALL lived days 03-02..05-26 | 62, +0.232R | 55 | 21, 38%, +0.213R, +4.47R, 4.58R | +0.141R, +2.97R | 34, +0.021R, +0.73R | +0.191R | +0.095R, +5.20R |
| (a) inside MB1's build, 03-02..05-12 | 52, +0.305R | 46 | 19, 37%, +0.248R, +4.71R, 4.58R | +0.177R | 27, -0.293R, -7.91R | +0.541R | -0.070R, -3.20R |
| (b) true forward, 05-13..05-26 (reported, not judged) | 10, -0.149R | 9 | 2, 50%, -0.120R, -0.24R, 1.00R | -0.198R | 7, +1.234R, +8.64R | -1.354R | +0.933R, +8.40R |

## Kill lines (all lived days)
| line | result | verdict |
|---|---|---|
| L1 kept average >= +0.15R, stressed >= +0.05R | +0.213R; +0.141R | PASS |
| L2 kept minus removed >= +0.20R | +0.191R | FAIL (by 0.009R) |
| L3 kept average >= A2's average on the same days | +0.213R against +0.232R | FAIL (by 0.019R) |
| L4 max drawdown of kept trades <= 5R | 4.58R | PASS |
VERDICT: the claim "MB1 holds on my lived days" is DEAD by the lines I wrote. Two lines fail, both by a hair. I do not round a hair in my favour:
the lines were written first and that is the whole point of writing them first.

## My guess against what happened
From my own arithmetic I expected: L1 normal a narrow pass, stressed FAIL; L2 fail; L3 fail. Stressed costs passed (+0.141R); the rest as expected.
The arithmetic from old prints matched the tool to the last digit shown (+0.213R kept, +0.021R removed): this was not a blind test and I said so.

## What it means, said plainly
- On the days I lived, MB1's kept trades made about what an A2 trade makes (+0.21R against +0.23R), winning 38% of the time. It does not beat A2 on my
  lived days. By the coach's rule that ends any talk of it as a challenger: "A2 stays as is unless something beats it on your lived forward days too."
- The filter's whole edge sits in the days it was built on: +0.541R between kept and removed there, -1.354R on the ten days since. Seven removed trades
  made +8.64R (two of them +4.23R and +3.96R). Ten days prove nothing either way - but the one clean stretch I have points against it, and the built-in
  stretch is exactly where 66 ideas' worth of looking would put a mirage.
- What survives costs on lived days is modest and real-looking: kept trades +0.14R at triple costs. Not nothing; not a setup.
- The coach's point, in my own numbers: the backtest said kept +0.695R (30 trades, decision set). My lived days say +0.213R. A backtest win after 66
  ideas shrank to less than a third on the days I actually sat through.
## What I do
- MB1 stays a paper tag under its own rules (no early-close line is reached: kept DD 1.00R, 2 kept trades). Its file and STATE now carry:
  "does not hold on lived days (05-26): kept +0.213R vs A2 +0.232R; kept minus removed +0.191R; forward so far the filter is upside down."
  I stop calling it "the one idea that passed".
- A2: unchanged. Size, stop, clock, signal: unchanged.
- For every future survivor of a backtest: the lived-days-only table (this script's shape) is run BEFORE it gets a paper tag, not two weeks after.
Counts: ideas 66 (no new idea), variants 186 (one re-run of MB1 on lived days). Adopted trading ideas: 0. On paper: UN3, PH2, MB1.
