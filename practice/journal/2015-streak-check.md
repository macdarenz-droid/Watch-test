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

# RESULTS (line above pushed before the numbers; `python bt/streak_check.py 2015-04-29`; 20,000 reshuffles per list, fixed seed)

## 1. What the backtest itself contains, next to live
| | trades | losers | full stops | avg loss | avg win | avg R | longest losing run | max drawdown |
|---|---|---|---|---|---|---|---|---|
| Backtest Jan-Feb (engine) | 39 | 36% | 8% | -0.46R | +1.04R | +0.50R | 3 | 1.87R |
| LIVE 03-02..04-28 (as traded) | 42 | 40% | 24% | -0.69R | +1.03R | +0.34R | 6 | 3.23R |
| All A2 (engine) | 81 | 38% | 16% | -0.59R | +1.04R | +0.42R | 6 | 3.28R |
Direct answer to the coach's question: in the backtest a 6+ losing run happened ZERO times (longest: 3), and its deepest drawdown was 1.87R.

## 2. How often the live event would happen by chance in 42 trades
| trades drawn from | losing run of 6 or more | max drawdown 3.23R or more | median longest run / 95th pct | median max DD / 95th pct |
|---|---|---|---|---|
| the backtest list (Jan-Feb) | 4.9% | 7.6% | 3 / 5 | 1.83R / 3.50R |
| all A2 trades | 7.4% | 26.3% | 3 / 6 | 2.50R / 4.94R |
| the live list itself | 9.2% | 46.4% | 3 / 6 | 3.12R / 6.27R |

## The line applied
- Losing run of 6+: 4.9% under the backtest list - UNDER my 5% line, by a tenth of a point. Drawdown of 3.23R: 7.6% - inside.
- They disagree, and I wrote beforehand that a disagreement is treated as OUTSIDE. So: by my own line the six-loss run is (just) outside what the January-February backtest
  would produce, and I owe the explanation. I am not going to argue with 0.1 of a percentage point in either direction: a run like this is roughly a 1-in-20 event
  for the backtest and a 1-in-11 to 1-in-14 event for the trades I have actually had since.
- My guess was the wrong way round (I expected the run inside and the drawdown outside). The drawdown is inside because three of the six losses were scratches.

## Which part of the setup changed (from the numbers, not from a story)
What did NOT change:
- The rule, the size, the stop, the times - identical; 0 trade mistakes in 42 live trades.
- The winners: 60% of trades live against 64%, average win +1.03R against +1.04R.
- The size of the London morning: average 08:00-12:00 range 64.6 pips in January-February, 66.1 pips in March-April (medians 59 and 61).
  So the 40 pip stop is NOT smaller against the morning than it was. (Checked today from the candles; I had expected to find wider mornings and did not.)
What DID change - one thing:
- How far price goes AGAINST my entry before noon. Mornings in which price travelled 40 pips or more against my entry: 7.7% in the backtest months (3 of 39),
  26.2% live (11 of 42) - March 23%, April 30%. Mornings going 40+ pips my way: 38.5% before, 50% live.
  The mornings move the same total distance, but they have become more one-way: when the 3-day direction is right it pays as before (or better), and when it is wrong
  it is wrong by a full stop three times as often. The losers changed from "small noon exits" (-0.46R on average) to "stops" (-0.69R).
- In rule terms: the DIRECTION call fails harder. Not more often (40% against 36% losers), harder.
Does my plan already allow for it? Yes, with nothing to spare in the story I tell myself:
- The planning edge is +0.18R, and live is +0.34R with the heavier losses already in it.
- The risk-size and survival runs since 04-10 use the full list, stops included; the weekend re-run used the 40 live trades as they are (own stop reached in 1.1% of
  two-year runs at 0.50%). The plan's sentence "drawdowns of 3-4% will happen" was written for percent of the account; the worst so far is 1.63%.
- What I had NOT priced in is the January-February picture of my losers as mostly small. For expectations I now use the live loss side: one trade in four is a
  full stop, a six-loss run is a once-in-a-few-months event, and a drawdown of about 5R inside any two months is the 95th percentile of the all-trades list (4.94R): one two-month stretch in twenty is worse.

## Decision
Keep trading the plan: same rule, same size, the two triggers as written. No change follows from this check, as stated before it was run.
One open thing for a future brick, NOT started: "the direction call fails harder since March" is a description, not a cause. Every attempt so far to see the hard failures
in advance (ten filters) has failed. If it is ever tested it needs a new, pre-registered idea about WHY direction fails by a full stop - not another filter drawn from the losers.
Counts unchanged: 46 ideas, 125 variants (this was a check with a pre-written line, not an idea).
