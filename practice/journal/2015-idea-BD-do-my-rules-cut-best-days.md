# Idea BD: does any rule I trade by cut one of my best days? An audit with lines written BEFORE the script is run
Clock Wed 2015-06-17 01:00 London (end of released data). After funded day 58. Coach 06-16: "if a few best days carry most of your R, your job is to never
miss them. next test: what would make you skip or exit early on one of those days? check that none of your current rules cuts them."
June goal: every number and every test rule gets one worked case before it is pushed.
"Best day" is fixed now, before any run: an A2 day of +1.60R or more in the engine (the level of the 15th best day in idea BS; 15 days before 06-16, and
whatever joins them - today's +1.60R live may or may not reach it in the engine).

## Everything that can take a best day away from me (listed first, so nothing is checked only because it looks clean)
LIVE RULES
1. The 40 pip stop: the only rule that takes me out before noon. It could turn a would-be best day into -1R.
2. The size rule: half size after a close 3% under the high-water; no trading at 7% under. Half a best day, or none.
3. Days without a trade: the rule says one trade every weekday, no skips. A hole in the calendar would be a silent skip.
4. Me: a best day taken smaller, closed before the bell, or not taken. The engine against my own log.
NOT LIVE, but the things I have wanted to do (the answer to "what would make you skip or exit early"):
5. The paper tags: UN3 (skips disagree days), PH2 (half size on lively hours).
6. The killed exits most often on my mind: LK2 (half-lock at 10:00), GB2 (target +80), PM1 (partial at +1R).
The noon exit itself is not on the list: it is the same for every day and 30-odd exit tests have compared it; "after noon" was idea X (runner), killed.

## Checks, each with its alarm line and a worked case
- C1 stop. For every full-stop day: A2's result at noon WITHOUT a stop (engine, stop set 400 pips away, result in units of 40 pips).
  Hidden best day = that result >= +1.60R. ALARM if 2 or more hidden best days, or if the stop days together would have made more than 0R without the stop.
  Worked: 06-08 stopped, price at noon 0.5 pips under my entry -> about -0.01R; 06-09 at noon 31.5 pips against -> about -0.79R; 06-11 -0.81R (my notes). None hidden.
- C2 size rule. Days on the funded account traded at half size or not traded because of the rule. ALARM if a best day is among them.
  Worked: deepest lived drawdown -2.41% (06-11), the 3% line never closed under -> I expect none.
  And on the engine's whole history at 0.50% a trade from 01-06: would the 3% line ever have been crossed (max drawdown x 0.5% >= 3%, i.e. 6R)?
- C3 holes. Weekdays from 01-06 with a London morning in the data and no A2 trade in the engine; weekdays from 03-27 with an engine trade and no
  funded trade in my log. ALARM if any; each one named.
  Worked: 04-03 (Good Friday) was traded (+0.07R, funded 6); I know of no skipped day.
- C4 me. Every best day from 03-27: my logged R against the engine's R. ALARM if any differs by more than 0.15R or was not at full size / not held to noon.
  Worked: 06-04 engine +2.95R, log +2.87R (0.08: fills); 05-19 engine +2.18R, log +2.17R.
- C5 paper tags (not live; a count, no alarm): of the best days, how many UN3 would have skipped and how many PH2 would have halved, with the R.
  Worked: 05-19 UN3 disagree (skip, -2.18R) and lively (half); 06-04 UN3 agree, lively (half).
- C6 killed exits (not live; a count): the best days' R under LK2, GB2, PM1 against A2 (engine).
  Worked: 06-04 GB2 +1.97R against +2.95R (from idea GB).
VERDICT RULE, written now: if no alarm on C1-C4, the answer to the coach is "no current rule cuts them" and nothing changes. An alarm does not change a
rule by itself: it is written up with the cases and goes to the coach as a question. C5 and C6 are the price list of my temptations: written in the
plan as one line so that I read it when I want to skip.
Expectation: C1 at most one hidden best day and the stop days clearly negative without the stop; C2 none; C3 none; C4 all within 0.15R; C5 UN3 skips
2-4 of the best days and PH2 halves about half of them; C6 each exit gives back 5-10R on the best days.
Counts when run: idea 83; variants: one new run (A2 without a stop) = 232; LK2, GB2, PM1 are re-reads of frozen runs on a subset, not counted again.

## Mechanics check (checks pushed first in commit 399da81)
`--check 2015-06-09`: A2 -1.03R; at noon without a stop -0.80R (worked from my note: about -0.79R); UN3 agree; lively 48.5 pips: as logged on the day.

## RESULTS (`python bt/best_day_audit.py 2015-06-17`; figures copied from the print)
A2 to 06-16: 116 days, +35.21R. Best days (>= +1.60R): 15, +32.51R. The other 101 days: +2.70R. (Today's +1.60R live is +1.595R in the engine: a
hair under the line I fixed before the run, so it is not counted as a best day. I do not move the line.)
| check | result | alarm |
|---|---|---|
| C1 stop | 27 full-stop days: -27.44R as traded; at noon without a stop -22.91R (worst -1.77R; 11 days worse than -1R, -15.86R; 2 days positive, +1.19R). Hidden best days: 0. Best no-stop result: 04-16 +1.14R. | no |
| C2 size rule | engine history at 0.50%: max drawdown 4.92R = 2.46% (06-11); days closed at or under -3%: 0. Funded log: 58 trades, all 0.31 lots. | no |
| C3 holes | 116 weekdays with a London morning since 01-06, 116 engine trades; every engine day from 03-27 has a funded trade and the other way round. | no |
| C4 me | 7 best days since 03-27, all 0.31 lots, all closed at 12:00; log +13.74R against the engine's +13.96R; largest difference 0.08R (06-04, fills). | no |
| C5 paper tags (not live) | UN3 would have SKIPPED 1 best day (05-19, +2.18R). PH2 would have HALVED 6 (06-04, 03-23, 05-19, 04-30, 04-17, 03-10: 6.52R lost). Base rates: disagree 22% of all days, 7% of best days; lively 50% and 40%. | count |
| C6 killed exits (not live) | on the 15 best days: LK2 -3.39R, GB2 -4.08R, PM1 -8.83R against A2. On the other 101 days: -0.92R, +2.53R, +1.51R. All days: -4.31R, -1.55R, -7.32R. | count |
ANSWER TO THE COACH: no current rule cuts a best day. Nothing changes.

## One thing I got wrong in the script, said openly
The first print showed ALARM C3: five days (03-30 .. 04-03) with an engine trade and no funded trade. That was my parser, not my trading: those five
journal rows write the time as "07:00 (08:00 London)" and my pattern skipped them. All five are in the tracker (funded days 2-6) and in the W13 / W14
journals. Pattern fixed, C3 re-read: no hole. The alarm line itself was not touched. No pushed number was wrong; not a correction after a push.

## Expectation against the run
C1 "at most one hidden best day, stop days clearly negative without the stop": 0 hidden, -22.91R: yes. C2, C3, C4: none, as expected.
C5: I said UN3 skips 2-4 best days: it is 1 (06-02's +1.55R is under the line). PH2 "about half": 6 of 15.
C6: I said each exit gives back 5-10R on the best days: PM1 yes (-8.83R); LK2 (-3.39R) and GB2 (-4.08R) give back less than I thought.

## What I take from it
- What would make me skip or exit early on a best day is not in my rules. It is in my head, and it has a price list now:
  the partial costs 8.8R of the 32.5R, the +80 target 4.1R, the 10:00 lock 3.4R, the lively-hour half size 6.5R, the UN3 skip 2.2R.
  GB2 and PM1 EARN a little on the other 101 days (+2.53R, +1.51R) and that is exactly why they feel right on most days and are wrong in sum.
- The stop: never once has it taken me out of a day that would have been a best day; the best any stopped day did by noon was +1.14R (04-16).
  Not hidden either: on the 27 stop days the stop cost 4.53R against holding to noon (16 of them came back part of the way), and it saved 4.86R on
  the 11 days that went past -1R, with a worst of -1.77R. That trade-off was tested as its own question (SA, CS, WS: closed by the coach). I note it; I do not re-open it.
- The size rule has never been switched on, lived or in the engine's history. So I do not know from experience what half size on a best day feels
  like; I know its sign. Yesterday morning I was $285 from it. If it comes on, the rule is followed exactly as written (SZ, GD tested it).
- The real risk to the best days is the one this audit cannot see: a day I do not trade at all - illness, a release problem, a morning I talk myself
  out of. 15 days in 116 is one in eight. Missing one costs on average 2.2R, more than a month of the rest. "One trade every weekday, no skips" is
  the rule that protects the edge, more than any other line in the plan.
One line goes into the plan (below "How A2 is judged"): the price list, to be read when I want to skip, bank or halve.
Counts: ideas 83, variants 232 (one new run: A2 without a stop; LK2, GB2, PM1 re-read on a subset, not counted again). Adopted trading ideas: 0.
Numbers or rules corrected after a push in June: 1 (none today).
