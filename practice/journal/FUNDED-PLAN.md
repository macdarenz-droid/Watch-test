# FUNDED ACCOUNT PLAN - $25,000 FundedNext funded account, from Fri 2015-03-27 (written before the first funded trade)
Coach's decision (2015-03-27): challenge #1 passed both phases on 03-23; attempt #2 is CANCELLED (3 trades, +$139.50, not continued). I trade the funded account from today.
In the sim the account was reset to a fresh $25,000 (the sim calls it "challenge #3"; that label is just the engine). The funded balance, payouts and drawdown are tracked by me
in journal/FUNDED-TRACKER.md, because the sim knows nothing about payouts and would "pass a phase" at +8%.

## The rules of the account
- 5% daily loss and 10% max loss, floating losses count. Max loss line: $22,500. Daily line: start-of-day balance - 5%.
- At most 3% risk open at any time. No profit target. 80% profit split. Payout every 14 days (I track the dates).
- Goal: steady monthly profit and safe payouts. NEVER breach. A breach here is not "an attempt counted" - it is the account gone.

## The trading rule: unchanged, in LONDON time (confirmed by my coach on 2015-03-31: "use London time consistently from now on")
A2 exactly as frozen: written call at 07:00 London, ALWAYS before the entry bar opens; direction = last 22:00 London close vs the close three trading days earlier; market order 08:00 London; stop 40 pips; close 12:00 London;
one trade per weekday, no skips; flat by noon and over weekends. One position, so risk open is my per-trade risk: far inside the 3% rule.

## Funded risk size: 0.50% per trade = $125 = 0.31 lots. Chosen from my reshuffle numbers, survival first.
| From the reshuffle test (1,000 orders, 42 days) | 0.50% | 0.75% | 1.00% |
|---|---|---|---|
| Zero-edge list: stopped by my -6% brake | 4 | 30 | 70 |
| Zero-edge list: raw 10% breach if I ignored my brakes | 0 | 4 | 13 |
| Full list / forward list: breach with brakes | 0 / 0 | 0 / 0 | 0 / 0 |
| Passed a +13% target in 2 months (full / forward) | 24 / 409 | 783 / 862 | 979 / 955 |
| Worst day (one stop) | -0.51% | -0.77% | -1.03% |
| Full stops in a row to the 10% line | 20 | 13 | 10 |
Why 0.50% and not the 0.75% the challenge rehearsal named:
1. The bottom row of that table is the only reason 0.75% was ever on the table - speed toward a target. A funded account has no target. Speed is worth nothing here;
   the one thing that matters in the top rows is how rarely the account gets into trouble, and 0.50% is the only size with a zero in the raw-breach row.
2. A challenge breach costs a fee and an attempt. A funded breach costs the account. The same 4-in-1,000 means something different.
3. The horizon is two years, not 42 days. Whatever small chance of trouble a size has per two months, I will face it about twelve times over.
4. The rule's own forward test is not finished (19 of 40 unseen trades). I do not yet KNOW which block of the table I am in. Until I do, the smallest size I have traded is the right one.
5. It is the size I have actually lived through 42 times: I know what -$125 feels like and that I follow the plan at that size.
What it should earn, honestly: about 21 trades a month x 0.5% x (+0.18R on a February-type month ... +0.5R on the blend) = roughly +2% to +5% a month before the split, some months flat or
slightly negative. That is "steady", and it is enough.

## Funded brakes (tighter than in the challenge, because the account itself is at stake)
- Drawdown is measured from the account HIGH-WATER balance (after payouts are taken out).
- 3% below the high-water mark, or balance at or below $24,250 whichever comes first -> risk halves to 0.25% ($62.50, 0.16 lots) until a new high-water mark.
- 5% below the high-water mark, or balance at or below $23,750 -> STOP trading, full review with my coach. That leaves at least 5% between me and the $22,500 line.
- Rule-level kill, unchanged: A2's forward test (40 unseen trades): if it averages below +0.10R or its drawdown passes 8R, I stop trading the rule for money.
- Daily loss: one trade a day, so the worst planned day is one stop = about -0.51% (a tenth of the 5% limit). After any loss: done for the day. Never a second trade.
- Never hold past 12:00 UTC, never over a weekend, never through scheduled US news (12:30 / 18:00 UTC) - the days that could jump a stop.

## Payouts (every 14 days; first funded day Fri 03-27 -> payout dates 04-10, 04-24, 05-08, ...)
- Survival first applies to payouts too: profit left in the account is extra distance from the $22,500 line.
- Until the balance has a buffer of $1,000 (+4%, i.e. $26,000): request half of the profit above $25,000 at each payout date, leave half in.
- Once the buffer exists: request everything above $26,000 at each payout date. I keep 80% of what is requested.
- No payout request while a brake is active.
- After a payout the high-water mark is reset to the balance after the payout.

## What stays the same about how I work
One live day at a time, call written before the clock moves; the day's result tagged valid / mistake before anything else; tracker updated the same day;
one honest test (hypothesis, kill lines written first, max 3 variants) earns the next day; paper tags (F1, Q3/Q1, Friday, N1) continue; everything counted in STATE.md.

## Process rules (added 2015-03-31)
- All clock times in my rules, journal and tools are London local time. The sim runs on UTC: I advance to 07:00 London with `python sim.py advance --until DATE T<UTC>` and trade with
  `python trade_a.py buy|sell --risk 125 --london` (default entry 08:00, exit 12:00, next call 07:00, all London; the helper converts to UTC, summer or winter).
- The call is written and committed to the journal BEFORE the entry bar opens - no exceptions. If I ever find the clock already at or past 08:00 London without a written call,
  I do not trade that day and log it as a process mistake.
- Two separate tallies: TRADE tags (valid setup / my mistake) and PROCESS mistakes (things I did wrong around the trade that did not change the trade). Both are in the tracker.
