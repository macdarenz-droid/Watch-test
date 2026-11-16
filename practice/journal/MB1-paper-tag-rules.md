# MB1 paper tag - rules written 2015-05-12 (sim clock Wed 05-13 01:00 London), before its first forward day
Source: journal/2015-review-losers-of-3-killed-ideas-and-idea-MB.md. PAPER ONLY. It never touches A2, the live size or the account.
## The paper rule (frozen)
- Box = high and low (bid) of 12:00-13:25 London. First break between 13:25 and 14:30 London. Stop 30 pips, flat 17:00. Fills as in bt/box_break.py (BX1).
- Take the break only if its side equals the sign of (12:00 open - 08:00 open), bid. Morning exactly 0.0: no trade.
## How it is logged
- At 12:00 London, after my A2 trade is closed, I write in the day's journal: "MB1 paper: morning UP/DOWN by x pips -> only an UP/DOWN break counts" - before the
  clock passes 13:25. The result is read the next day from `python bt/morning_box.py END --check DATE` (never from memory) and added to the table below.
- The REMOVED breaks (against the morning) are logged beside it, and each kept trade is marked small morning (< 20 pips) or large: that is the open question.
## First look and promotion (written now, cannot be moved)
- First look: 100 forward KEPT trades (my standing rule for a stand-alone setup). An interim look at 40 applies only the early-close lines.
- To pass at 100: avg >= +0.15R; at 3.0 pip spread and 1.0 slippage >= +0.05R; max DD <= 6R; kept minus removed >= +0.20R; positive without its best 3.
- Early close: forward DD of the kept trades above 6R at any time; or net below -3R after the first 20 kept trades; or at 40 kept trades an average below 0.
- A pass is NOT a live trade. It is a proposal to the coach: quarter size (0.25%), second trade of the day, open risk checked against the 3% rule.
- A few good paper days change nothing. A bad A2 week changes nothing. No re-scoring, no new variant of it while the tag runs.
## Forward tally (from Wed 2015-05-13)
| date | morning (pips) | break | kept / removed | R | kept total (n, R, DD) | removed total (n, R) | small / large morning (kept) |
|---|---|---|---|---|---|---|---|
