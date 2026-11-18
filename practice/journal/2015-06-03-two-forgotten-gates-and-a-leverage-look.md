# 06-03: looking for one way to make A2 better - a look I stopped, and two forward tests of March that were never judged
Sim clock Thu 2015-06-04 01:00 London. Coach 06-03: "next backtest should try to make A2 itself better (entries, filters or management), one idea, kill line
first, variants counted." June goal: no figure below without a tool print or python line behind it.

## 1. The idea I started with, and why I stopped before pre-registering it (counted: 3 looks)
From the MFE / MAE log (journal/mfe-mae-log.csv, 107 trades): only 2 of 64 winners ever went 30 pips against me. So a 30 pip stop at the same $ risk
(0.42 lots instead of 0.31) looks like free money. A crude python line on the log said: stop 35 / 30 / 25 pips -> +4.64R / +10.62R / +20.10R above A2,
with 28 / 35 / 44 trades stopped instead of 24.
Before writing a pre-registration I read my own record (STATE lines 39, 52, 229): I had this in March. "E1 (A2, 30 pip stop): gain is all January;
E raises drawdown; stop fitted in-sample" and on 04-03 "E1 +0.12R a trade over 64 trades - which the SS test explains as LEVERAGE".
It is leverage. Worked in pips with the SAME 0.31 lots (python from the log's own counts): a 30 pip stop saves 10 pips on each of 24 full stops (+6.0R),
turns 9 noon losers (old sum -2.06R) into -0.75R stops (-4.69R) and 2 winners (old sum +0.57R) into stops (-2.07R): net about -0.8R. Nothing.
The whole "+10.62R" is the bigger position: 1.33 times the lots, 1.33 times every pip - including the jump minute (DC's worst day would be 1.88% instead of
1.54%) and the stop slippage. A tighter stop at the same $ risk is a size increase wearing a management coat, and the coach closed the risk plan.
NOT pre-registered, NOT run on the engine. Counted as idea 73 with three looks (25 / 30 / 35) so the tally stays honest.
What saved me a wasted test: reading my own notes before the push. That is the June goal working one step earlier than I wrote it.

## 2. While reading: two forward kill tests written in March that I never judged (process mistake P10)
My Friday gates list was created on 05-06 (after P5). I built it from the paper tags I was carrying then. Two older forward tests were not on it:
idea W "no Friday trade" (written 03-03, judge after 8 unseen Fridays) and the N1 paper tag (NY fade, from 03-13, judge at 20 trades and 8 A2-losing days).
Both gates passed weeks ago. Neither touched a live trade. I apply both today, exactly as written, on my lived days. They are real tests: the kill
lines are three months old and the data is all forward.

### 2a. Idea W "no Friday trade" - kill test of journal/2015-loss-tags-and-next-change.md section 5, applied to the first 8 unseen Friday trades
(python on sim/trades.csv; unseen = from 03-03)
The 8 Fridays: 03-06 +2.12 | 03-13 +1.10 | 03-20 +1.04 | 03-27 -1.00 | 04-03 +0.07 | 04-10 +1.62 | 04-17 +1.70 | 04-24 -1.00.
| line (adopt only if ALL hold) | result | |
|---|---|---|
| 1. the 8 Friday trades net <= 0R | +5.64R | FAIL |
| 2. at least 5 of the 8 are losers | 2 | FAIL |
| 3. Monday-Thursday of the same period average above 0R | +0.258R in 31 trades | holds |
| 4. still <= 0R without the worst Friday | +6.64R | FAIL |
VERDICT: KILLED, as written ("any other outcome: killed, and I do not come back with 'first Fridays only'"). The gate was due on 04-24; applied 40 days late.
Reported beside: all 13 unseen Fridays to today: +3.53R, 5 losers, +0.272R a trade, against +0.208R for Monday-Thursday (54 trades). The last three
Fridays lost (05-15, 05-22, 05-29). Had I "discovered" Fridays again this week, the dead idea would have come back from the same kind of streak that made it.

### 2b. N1 paper tag (fade the London morning in New York) - kill test at the end of journal/2015-idea-N-second-setup.md
(`python bt/ny_fade.py 2015-03-13 END --overlap`)
Judging point: the 20th forward N1 trade (05-06) with at least 8 forward A2-losing days (there were 15 by then). At that point (END 2015-05-07) the print reads: 20 trades, 55% wins, average +0.06R, net +1.16R, max drawdown 4.53R, -1.86R without its best trade;
N1 losing days 9, of which A2 also lost 5 (56%); correlation +0.15; on A2's losing days -1.70R in 8 trades. Today (32 trades): average +0.17R, net +5.34R, max drawdown 4.53R, +1.25R without its best trade.
| line (passes only if ALL hold at the judging point) | at 20 trades | today, 32 trades (reported) |
|---|---|---|
| 1. average >= +0.20R | +0.06R: FAIL | +0.17R: FAIL |
| 2. net above 0 without its best trade | -1.86R: FAIL | +1.25R: holds |
| 3. max drawdown <= 4R | 4.53R: FAIL | 4.53R: FAIL |
| 4. net >= 0R on A2's losing days | -1.70R: FAIL | +5.88R: holds |
| 5. overlap <= 50% and correlation <= +0.30 | 56%, +0.15: FAIL (overlap) | 50%, -0.17: holds |
VERDICT: KILLED at its judging point ("fails any line -> killed, no second threshold, no other hours"). It is not re-judged on today's better-looking
numbers: all five of its lines failed when the gate fell, and two still fail today. Applied 28 days late.
A thing to say plainly: since its gate N1 made +4.18R in 12 trades (python: 5.34 - 1.16), +7.58R of it on days A2 lost and -3.40R on days A2 won. That is exactly the kind of late bloom my rules exist
to ignore: the test was written, the point came, it failed. If the coach wants it re-opened as a NEW forward tag with a new start date, that is his call.

## 3. Process mistake P10 and its fix
Two forward gates written before the gates list existed were never copied onto it; found 06-03 while reading my own record. No effect on any trade.
Fix, done today: I went through STATE.md for every line containing "pending", "forward", "judge at" or "status n/m" (grep print in the session) and
found no third one. The gates list in STATE now has a closing line: "every forward test ever written is either on this list or marked closed in its
own section" - and W and N1 are marked closed.

## 4. Where this leaves "make A2 better"
Today's honest score: one idea stopped at the look (leverage), two old ideas killed by their own forward tests. Nothing adopted.
The coach's brief stands and is not yet met by a fresh idea: tomorrow's test must be a NEW entry, filter or management idea with its kill line first.
Counts: ideas 73, variants 204 (three log looks at 25 / 30 / 35 pip stops; W1 and N1 were counted in March). Adopted trading ideas: 0.
On paper: UN3, PH2, MB1. Process mistakes: 10 (June: 1 - P10, a missed gate; numbers or rules corrected after a push in June: still 0).
