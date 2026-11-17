# Idea AL (idea 71): can my A2 alarm tell a dead edge from a live one? - PRE-REGISTRATION with worked cases (pushed before the script is written or run)
Sim clock Tue 2015-06-02 01:00 London. END 2015-06-02. June goal: every kill line below carries a worked prediction, computed by a python line before this push.
## Why this, at my deepest drawdown
- A2's judge is one sentence written on 04-24: "at 100 live trades: average >= +0.10R and max drawdown <= 8R". I lean on it every time I write "no rule
  changes". I have never asked whether that sentence can actually fail when it should.
- Today: 66 live trades, sum +13.24R, average +0.201R, sd 1.039R; max drawdown 4.45R. 34 trades to go.
- This is not a risk-size test and it changes nothing about how I trade. It tests the instrument I use to decide whether to KEEP trading the rule.
## Hypothesis (the claim under test)
"The alarm as written is a real judge of the edge from here": if A2's edge is gone from today, the alarm will probably fail at 100 trades; if the edge is
my planning edge, it will almost surely pass.
## Scenarios for the 34 trades to come, and the three alarms compared (variants: 3)
The 34 trades are drawn with replacement from the engine list of all A2 trades to END (105 trades, sd 1.052R), shifted to a true average of
Z0 = 0.00R (edge gone), Zm = -0.10R (worse than gone), Zp = +0.18R (planning edge). 20,000 runs each, appended to my REAL 66 live trades in order.
- AL1: the alarm as written (average of all 100 >= +0.10R AND max drawdown over the 100 <= 8R).
- AL2: judge only the 34 new trades: their average >= 0R.
- AL3: judge only the 34 new trades: their average >= +0.10R.
## WORKED CASES (normal approximation, python, before the push)
For AL1 the 34 trades must sum to at least 0.10 x 100 - 13.24 = -3.24R. The sd of a sum of 34 is 1.052 x sqrt(34) = 6.14R.
| true edge from now | AL1 passes | AL2 passes | AL3 passes |
|---|---|---|---|
| 0.00R | 70% | 50% | 29% |
| -0.10R | 49% | 29% | 13% |
| +0.18R | 94% | 84% | 67% |
(The drawdown half of AL1 is not in this approximation; the run will show whether it bites.)
## Kill lines for the claim (on AL1; one failure kills it)
- K1: with the edge at zero from now, AL1 FAILS in at least 50% of runs.   [worked: fails about 30% -> expect K1 to FAIL]
- K2: with the edge at -0.10R from now, AL1 FAILS in at least 80% of runs.  [worked: fails about 51% -> expect FAIL]
- K3: with the edge at +0.18R, AL1 PASSES in at least 90% of runs.          [worked: passes about 94% -> expect PASS]
Reported beside, same three numbers for AL2 and AL3, and the number of trades a fair judge needs (worked: about 154 trades to tell 0 from +0.18R with a
10% false alarm and 80% power).
## Consequences, written now
- If the claim dies (I expect it to): the alarm at 100 trades STAYS as written - I do not move a goalpost in a drawdown, in either direction. But I stop
  telling myself it protects me from a dead edge, and I bring the coach the table and one question: which judge do we use for the next 100 trades.
- No trading rule, size or stop changes by this test, whatever comes out.
My guess = the worked table. If the run differs from it by more than 5 points anywhere, I look for the reason before I write the verdict.

## Results (run once; `python bt/alarm_power.py 2015-06-02`; 20,000 runs per scenario; figures copied from the print)
Live: 66 trades, sum +13.24R, average +0.201R; 34 to come; engine list 105 trades, sd 1.052R.
| true edge of the 34 trades to come | AL1 as written PASSES | its average half alone | its drawdown half alone | AL2 (new trades avg >= 0) passes | AL3 (new trades avg >= +0.10R) passes |
|---|---|---|---|---|---|
| 0.00R (edge gone) | 47.3% | 69.3% | 47.6% | 49.3% | 28.5% |
| -0.10R | 29.0% | 48.4% | 29.2% | 28.5% | 13.2% |
| +0.18R (planning edge) | 79.7% | 93.8% | 79.8% | 84.1% | 66.3% |

## Run against the worked table (the rule I set: more than 5 points apart -> find the reason before the verdict)
- Average half of AL1: 69.3 / 48.4 / 93.8% against worked 70 / 49 / 94%. AL2: 49.3 / 28.5 / 84.1% against 50 / 29 / 84%. AL3: 28.5 / 13.2 / 66.3%
  against 29 / 13 / 67%. Within a point everywhere.
- AL1 as a whole is 15 to 23 points BELOW the worked figures. Reason, found before writing the verdict: the worked case left out the drawdown half and said
  so; that half is the one that binds. I stand 4.45R under my equity high today, so "max drawdown <= 8R" leaves only 3.55R of room, and a sum of 34 trades
  has an sd of 6.14R. A python line with the reflection rule gives about 44% for the drawdown half at zero edge; the run says 47.6%. The run is right and
  the reason is understood. (Not a number corrected after a push: the pre-registration named the gap. June count stays 0.)

## Kill lines (AL1)
| line | worked | result | verdict |
|---|---|---|---|
| K1: edge gone -> the alarm fails in at least 50% of runs | fails about 30% | fails 52.7% | PASS (barely, and only because of the drawdown half) |
| K2: edge -0.10R -> fails in at least 80% | fails about 51% | fails 71.0% | FAIL |
| K3: edge +0.18R -> passes in at least 90% | passes about 94% | passes 79.7% | FAIL |
VERDICT: the claim "the alarm as written is a real judge of the edge from here" is DEAD on K2 and K3.

## What it means, said plainly
- If A2's edge died today, my alarm would still PASS at trade 100 in almost half the runs (47%). If the edge is exactly what I plan with, the alarm
  would FAIL in one run in five (20%) - a false alarm, caused by nothing but the 4.45R I am already down. It is close to a coin on the first question and
  a leaky judge on the second.
- No alarm on 34 trades can do the job: AL2 fails a dead edge half the time and wrongly fails a live one 16% of the time; AL3 catches a dead edge 71% of
  the time and wrongly fails a live one a third of the time. One trade has an sd of about 1.05R; 34 of them cannot separate 0.00R from +0.18R.
  The worked figure: about 154 trades for a 10% false alarm and 80% power. That is seven months of trading.
- So the honest statement about my situation: at 66 live trades (+0.20R, +-0.26R) I do not know whether the edge is +0.18R, +0.30R or zero, and I will
  not know at 100 either. What protects the account in the meantime is not the alarm; it is the size rule (half size at 3% under the high-water, stop
  at 7%), which acts on money, not on statistics. TS and WS tested that part.
## What I do (as written before the run)
- The alarm at 100 trades STAYS exactly as written. I do not loosen it because it might fail me unfairly, and I do not tighten it in a drawdown.
- I stop writing "the alarm judges A2" as if that settled anything. From today the daily note reads the alarm's two numbers and nothing more.
- QUESTION FOR THE COACH (a proposal, not acted on): for the 100 trades AFTER the alarm, which judge do we use? My table says a fair one needs about
  150 trades and should not have a drawdown line anchored to wherever I happen to stand. I would propose: a rolling look every 50 trades at the average
  of ALL lived trades with its error band written beside it, and the money rule as the only automatic brake. I change nothing until told.
Counts: ideas 71, variants 198 (AL1 AL2 AL3). Adopted trading ideas: 0. On paper: UN3, PH2, MB1. Numbers or rules corrected after a push in June: 0.
