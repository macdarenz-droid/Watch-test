# Six losses in a row: inside or outside the normal range of my backtest? THE LINE BETWEEN "INSIDE" AND "OUTSIDE" IS WRITTEN BEFORE THE NUMBERS ARE RUN
Clock Wed 2015-04-29 01:00 London. Coach, 04-28: "check it against your backtest: how often did a 6+ streak happen there and what was the deepest drawdown? If it's
inside the normal range, keep trading the plan. If it's outside, write down which part of the setup changed."
(The run ended at six this morning with a +1.61R winner. The question is asked about the run, not about today.)

## What is measured (bt/streak_check.py, explicit end dates; no rule, no variant - counts stay 46 / 125)
The event: in my 42 live trades (03-02..04-28) there was a run of 6 losses in a row (-3.23R) and a maximum drawdown of 3.23R.
1. What the backtest itself contains (A2 engine, January-February, 39 trades - the record I had before I traded live): its longest losing run and its deepest drawdown.
2. How often such an event would happen by chance in 42 trades IF my trades came from the backtest's list: 20,000 reshuffles (drawn with replacement, fixed seed),
   counting (a) a losing run of 6 or more, (b) a maximum drawdown of 3.23R or more.
3. The same against the list of ALL A2 trades to today (81 trades), and - for what changed - the loss side of the two lists side by side
   (share of losers, share of full stops, average loss).

## THE LINE (written now)
- INSIDE the normal range: the event (a 6+ losing run in 42 trades) happens in at least 5% of the reshuffles of the BACKTEST list. Then: keep trading the plan, nothing to write.
- OUTSIDE: under 5%. Then I write down which part of the setup differs between backtest and live, from the numbers in step 3, and whether my plan already allowed for it.
- The same 5% line is applied separately to the drawdown of 3.23R, and I report both; if they disagree I say so and treat the result as "outside".
- Whatever the result: no rule or size change follows from this check (size is governed by the two triggers; the rule by the 100-trade alarm). It decides only whether I
  owe an explanation.
My guess, written now: the backtest list has 36% losers, so six in a row in 42 trades should come out around 5-8%: borderline inside. The drawdown of 3.23R against a
backtest maximum of 1.87R will be under 5%: outside. What changed will be the loss side: live has three times the share of full stops.
