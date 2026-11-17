# Idea MC: what changed in the market, and a morning-chop on/off rule for A2 (idea 106; coach 07-16)
Written Thu 2015-07-16 22:00 London. Part 1 = market facts (no trade results). Part 2 written before any code for the test.

## 1. Market facts (tool `python bt/market_compare.py 2015-07-17`)
| | Jan-Apr (85 days) | May..06-04 (25) | last 30 (06-05..07-16) |
|---|---|---|---|
| median day range, pips | 124 | 118 | 126 |
| median 08-12 range | 60 | 62 | 68 |
| 10-day straightness of closes | 0.15 | 0.19 | 0.12 |
| today continues yesterday's direction | 47% | 56% | 33% |
| night -> morning the same way | 58% | 40% | 40% |
| 08-10 -> 10-12 the same way | 48% | 52% | 30% |
| half of the morning move still there at 20:00 | 67% | 44% | 47% |
| morning goes 25+ pips BOTH ways from 08:00 | 6% | 4% | 23% |
| morning net / morning range | 0.52 | 0.55 | 0.41 |
Read: the SIZE of days and mornings did not change. What changed is HOLDING: moves are taken back, inside the morning and from day to day.
30 days is a small sample; every share here is +-9 points or so.

## 2. ONE hypothesis
A2 follows a 3-day direction for four hours. It pays while mornings go one way and stops paying when mornings whip. The recent mornings
themselves say which market I am in.
State (known before the bell, no A2 result in it): ME = mean over the last 10 trading days of (|open 12:00 - open 08:00| / the 08-12 range).

## 3. On/off rule and variants (three, no more)
MC1 (judged): A2 ON when ME(10 days) >= 0.47, else OFF. (0.47 sits between the period medians 0.52 and 0.41; set from market facts, not results.)
MC2: the same with the last 5 days. MC3: OFF when 2 or more of the last 10 mornings went 25+ pips both ways.

## 4. Kill test (all inside a period, because a rule that only tells Jan-Apr from now is a calendar, not a rule)
Step 0: count ON and OFF days per period, before outcomes. Fewer than 15 ON or 15 OFF days in Jan-Apr -> not judgeable -> killed.
Step 1, Jan-Apr only (01-20..04-30, after the 10-day warm-up; history before I look at the lived months for this rule):
 K1 A2's average R on ON days is at least 0.30R above OFF days.
 K2 OFF days average under +0.10R (if OFF days still pay, switching off costs money).
 Any fail -> KILLED; I do not run the lived months.
Step 2 only after a pass, 05-01..07-16: K3 ON days above OFF days and ON days above zero. K4 label-shuffle inside periods (10,000), pooled gap p < 0.05.
Pass = paper line beside MO, never a live change now. My guess: K1 fails; EF (the daily version) died the same way.

## 5. Counts and worked case (tool, before outcomes)
Tool: `python bt/morning_chop.py 2015-07-17 count` / `check 2015-07-16` (no outcomes).
- 130 A2 days with a state (01-16..07-16; the warm-up ended 01-16, not 01-20 as I wrote): Jan-Apr 75, from 05-01 55.
- MC1: Jan-Apr ON 39 / OFF 36; from 05-01 ON 22 / OFF 33. MC2: 39 / 36; 24 / 31. MC3: 71 / 4 (NOT judgeable in Jan-Apr: 4 OFF days); 31 / 24.
- Worked case 07-16: mean of the last 10 mornings' eff = 0.499 -> MC1 ON (last 5: 0.695 -> MC2 ON; 1 whip morning in 10 -> MC3 ON).

## 6. Result
