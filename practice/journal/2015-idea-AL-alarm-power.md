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
