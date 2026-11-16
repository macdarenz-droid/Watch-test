# The "livelier hour before entry" idea. PRE-REGISTERED BEFORE TOUCHING ANY RESULT: hypothesis, kill lines, max 3 variants
Clock Thu 2015-04-30 01:00 London (end of released data). All lived history 01-06 .. 04-29 (explicit end 2015-04-30); costs on; London time.
Coach, 04-29: "the 'livelier hour' idea: prereg it properly before touching data, max 3 variants. And keep the drop that most-stretched = best trades in your notes,
don't filter winners away."

## What I have looked at so far - features only, no trade results
The range of the hour before my entry (07:00-08:00 London, twelve M5 candles; known at 08:00, when the order goes in):
median 20.7 pips in the backtest months (01-06..02-27), 31.1 pips live (03-02..04-29).
| pre-entry hour range | all 82 signal days | backtest months (39) | live months (43) |
|---|---|---|---|
| 25 pips or more | 45 (55%) | 14 | 31 |
| 30 pips or more | 30 (37%) | 6 | 24 |
| 35 pips or more | 22 (27%) | 4 | 18 |
| 40 pips or more | 15 (18%) | 2 | 13 |
So the supposed cause DID change (30+ pips: 15% of days before, 56% live) - the precondition the "choppier market" idea failed and this one passes.

## What I already know about results (contamination, plainly)
- I have never computed any result by pre-entry-hour range. But since 04-17 I have walked every live day bar by bar and wrote the hour before entry into my notes,
  so I remember about a dozen cases: lively hours before -1R days (04-16, 04-20, 04-24) and before scratches (04-21, 04-22, 04-27), and lively hours before good
  winners (04-10, 04-13, 04-15, 04-17). From memory it looks MIXED. One older note (04-09): "the 3 mornings with a 60+ pip hour before entry were all losers".
- So I do not expect a clean effect, and I say so before the run.

## Hypothesis
When the hour before my entry has already ranged 30 pips or more, London has started its move without me: I enter into a market that is already two-way, and the
morning goes a full stop (40+ pips) against my entry far more often than after a quiet hour. Full-stop mornings rose from 8% to 26% because lively pre-entry hours rose from 15% to 56% of days.

## Part 1 - does it EXPLAIN the change? (the explanation survives only if E1, E2 and E3 all hold)
"Full-stop morning" as in the last two tests: 40+ pips against the A2 entry between 08:00 and 12:00 London. "Lively" = pre-entry hour range of 30 pips or more.
  E1. Over all history, lively-hour mornings have a full-stop-morning rate at least TWICE that of quiet-hour mornings.
  E2. Inside the LIVE months alone (24 lively, 19 quiet days) the ratio is at least 1.5. (The backtest months have only 6 lively days: I report them, and I say now
      that six days cannot be read either way.)
  E3. Accounting with the all-history rates: (lively rate - quiet rate) x (live share of lively days - backtest share) must be at least HALF of the actual rise in
      full-stop mornings between the two periods.
The XS test's lesson is built in: I will ALSO print the average R of the lively group. If the lively mornings turn out to be good trades on average, that is
reported in the first line of the results, whatever E1-E3 say.

## Part 2 - variants (129, 130, 131; ideas -> 48), no others afterwards. Everything else exactly A2; derived from A2's own daily results.
- PH1: no trade when the pre-entry hour ranged 30 pips or more (30 days; 63% left alone).
- PH2: half size on those days.
- PH3: no trade when it ranged 40 pips or more (15 days; 82% left alone).
Filter kill lines (the build can only kill; a survivor = forward PAPER tag, no adoption question before 200 forward trades):
  K1. avg R per signal day at least A2's + 0.05R;
  K2. changed days worse under A2 than the others by at least 0.3R;
  K3. that gap at least +0.3R inside the live months (the backtest months are reported; PH3 has 2 days there, PH1 six);
  K4. at least 10 days changed and at least 60% left alone;
  K5. (the coach's line, "don't filter winners away") the variant's net R is at least 90% of A2's.
Sample, plainly: 30 lively days against about 52 quiet ones; 14-15 full-stop mornings in total, so each cell of Part 1 holds a handful of events. This can show a
strong concentration (say 10 of the 14 in the lively third) and nothing subtler.
My guess, written now: lively mornings carry about half of the full-stop mornings with 37% of the days - a ratio near 1.6, failing E1; E3 explains a third of the rise;
the lively group's average R is positive and not far below the rest; PH1-PH3 fail K1 and K5. The loss-side change stays unexplained and I stop looking for its cause.

# RESULTS (pre-registration above pushed in commit a9e62e3 before any result; labels checked on two days against my walk notes; one run: `python bt/pre_hour.py 2015-04-30`)
82 A2 trades 01-06..04-29, engine, full costs.

## First line, as promised: average R of the two groups
| | trades | win rate | avg R | net R | backtest months | live months |
|---|---|---|---|---|---|---|
| Quiet hour before entry (under 30 pips) | 52 | 69% | +0.572 | +29.73 | 33 trades, +0.565 | 19 trades, +0.583 |
| Lively hour before entry (30+ pips) | 30 | 50% | +0.146 | +4.37 | 6 trades, +0.150 | 24 trades, +0.144 |
Gap 0.43R; two standard errors +-0.47R (computed) - just INSIDE the noise band. The lively mornings are not losers: they earn +0.15R. They are not my winners either.

## Part 1 - does it explain the rise in full-stop mornings?
| | lively hour | quiet hour | ratio | share of days lively |
|---|---|---|---|---|
| All history | 9 of 30 = 30.0% | 5 of 52 = 9.6% | 3.12 | 37% |
| Backtest months | 1 of 6 = 16.7% | 2 of 33 = 6.1% | 2.75 (six days: not readable) | 15% |
| Live months | 8 of 24 = 33.3% | 3 of 19 = 15.8% | 2.11 | 56% |
Accounting: (30.0% - 9.6%) x (56% - 15%) = 8.2 points of the 17.9-point rise = 46%.
- E1 (at least twice the rate, all history): 3.12 -> PASS. (9 of 14 full-stop mornings fall in 37% of the days; one-sided exact test p about 0.02.)
- E2 (ratio at least 1.5 inside the live months): 2.11 -> PASS.
- E3 (explains at least half of the rise): 46% -> FAIL, by four points.
BY MY OWN RULE THE EXPLANATION DOES NOT SURVIVE: all three lines had to hold and the third does not. What I can say, and no more: the lively pre-entry hour is the
first thing I have found that goes WITH the full-stop mornings in both periods, and its increase accounts for a bit under half of the rise. The other half is still
unexplained (quiet-hour mornings also got worse live: 6% -> 16%, on 2 and 3 events).

## Part 2 - variants
| | changes | avg R / signal day (A2 +0.416) | net R (A2 +34.10) | max DD (A2 3.28) | gap all / live / backtest | full-stop mornings removed | winners removed | K1 | K2 | K3 | K4 | K5 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PH1 skip after a 30+ pip hour | 30 days | +0.363 | +29.73 (87%) | 1.87 | +0.43 / +0.44 / +0.42 | 9 of 14 | 15 of 51 | FAIL | PASS | PASS | PASS | FAIL |
| PH2 half size on those days | 30 days | +0.389 | +31.91 (94%) | 1.87 | same | - | - | FAIL | PASS | PASS | PASS | PASS |
| PH3 skip after a 40+ pip hour | 15 days | +0.386 | +31.64 (93%) | 3.22 | +0.31 / +0.37 / -0.21 | 4 of 14 | 8 of 51 | FAIL | PASS | PASS | PASS | PASS |
VERDICT BY THE KILL TEST AS WRITTEN: NO SURVIVOR. All three fail K1: removing or halving trades that still earn +0.15R lowers the average per signal day. PH1 also fails
the coach's line K5 (it throws away 13% of the profit and 15 winners). A2 unchanged. No tag awarded.

## My guess against what happened
"Ratio near 1.6, failing E1": WRONG - 3.12, E1 and E2 pass. "E3 explains a third": 46%. "The lively group's average is positive and not far below the rest": positive,
yes; "not far below" - it is 0.43R below. "PH1-PH3 fail K1 and K5": K1 yes; K5 only PH1. I underestimated this one; my memory of "mixed" cases was a dozen recent days.

## What this is and is not - said as carefully as the UN3 note
For it:
- Same picture in both periods: quiet-hour mornings +0.57R before and +0.58R live; lively-hour mornings +0.15R before and +0.14R live. I have not had a split this stable.
- It accounts for something I could not explain: live average +0.34R against +0.50R in the backtest. Backtest group averages on the live mix (56% lively) give
  0.44 x 0.565 + 0.56 x 0.15 = +0.33R. The whole live-vs-backtest gap is the mix of mornings - arithmetically. (Post hoc; it is one way of cutting 82 trades.)
- Halving size on those days (PH2) would have kept 94% of the profit with a maximum drawdown of 1.87R instead of 3.28R.
Against it:
- It failed the lines I wrote beforehand: E3 (46% < 50%) and K1 for every variant. The gap in average R is inside its noise band (0.43 against +-0.47).
- The backtest side rests on SIX lively days. "Stable in both periods" means 6 trades agree with 24.
- Without its three worst trades the lively group averages +0.28R; without its three best -0.06R. Thirty trades.
- It is my twelfth conditional split of the same 82 trades. One in twelve looking like this is not rare.
- The coach's warning stands: these 30 days include 15 winners (04-10, 04-13, 04-15, 04-17 among them). Skipping is out by K5; I would not skip them.
What I do: nothing to the rule or the size. The threshold, the definition and this table are frozen here.
QUESTION FOR MY COACH: this is the UN3 situation again, with a stronger explanation part and a failed profit line. May I log PH2 (half size after a 30+ pip pre-entry
hour) as a second forward PAPER tag under the same discipline as UN3 - its line written in the 08:00 note before the order (it is only known at 08:00), counting from the
next live day, promotion rule written before its first day, never live on a few good days? If the answer is no, I keep only a count in the live table
("live trades after a lively hour: n, average R, full-stop mornings") and look at it at 100 live trades.
Counts: ideas 48, variants 131.
