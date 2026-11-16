# TRADING PLAN v2 - one page (as of Thu 2015-03-12 00:00 UTC sim time). Supersedes the longer notes; details live in the files named in brackets.

## The rule (A2, frozen since 2015-01-09, never changed)
EURUSD only. 07:00 UTC: read D1/H4/H1 and write the call. Direction = last trading day's 22:00 UTC close vs the close three trading days earlier (lower -> sell, higher -> buy).
08:00 UTC: market order in that direction. Stop 40 pips from the 08:00 price, never moved. No target. 12:00 UTC: close at market. One trade per weekday, every weekday, no skips.
Flat by noon, flat over weekends. Every trade journaled before the clock moves; every loss tagged "valid setup, market disagreed" or "my mistake".

## Size and brakes (phase 2: $25,000, target $26,250, 5% daily / 10% max, min 5 trading days) [PLAN-v2-phase-handling, 2015-risk-math, 2015-phase2-size-test]
- 0.75% per trade = $187.50 = 0.47 lots. One trade a day, so the worst planned day is -0.77% against a 5% limit.
- Brake 1: balance <= $24,000 (-4%) -> 0.5% until a new phase high. Brake 2: balance <= $23,500 (-6%) -> stop, review, restart only with my coach.
- Finishing size 0.10 lots when the target is within $47. Target hit before 5 trading days -> 0.01 lots until 5 are logged.
- Raise to 1.00% only after the forward test passes (below). Never because of a winning streak.
- Rule-level kill test: first 40 trades on unseen days must average >= +0.10R with drawdown <= 8R, or I stop trading it for money. Now: 8 trades, +6.09R, all in one trend.

## What I expect (honest numbers, costs on)
| Sample | Trades | Win rate | Avg R | Status |
|---|---|---|---|---|
| January (the month the rule came from) | 19 | 74% | +0.78 | in-sample, one big downtrend |
| February (frozen rule, new month) | 20 | 55% | +0.23 | my only box-month evidence |
| March so far, traded forward one day at a time | 8 | 75% | +0.76 | unseen, but one straight fall |
Planning number: +0.23R. At that edge and 0.75%, phase 2 takes a median ~26 trading days; if the edge is zero my -6% brake ends it about 1 time in 10 within 60 days, with no breach.

## What I have ruled out, and why (16 ideas, 35 variants; hypothesis and kill test committed before every run since idea H)
| Tried | Result | Why it is out |
|---|---|---|
| Entry time 07:00 (A1); stop 40 / target 60 held to 16:00 (A3) | worse than A2 in both months | first hour is often a fake; NY gave the morning back in January |
| Asia-range break with trend (B1-B3) | similar per trade, fewer trades | the same bet as A2 in the same hours, not a second edge |
| Entry-location filters: midpoint (C1), pullback day (D1), no-chase (H1-H3) | help the box month, hurt the trend month | "don't chase" is a box lesson; in a trend the chasing entries were the best trades |
| Tighter stop 30 (E1); break-even stop, runner past noon, +60 target (X1-X3); 09:00 check (T1-T2) | each helps one month and hurts the other | the noon clock is the only exit acceptable in both; a trade's state at 09:00 predicts nothing |
| Don't fight the first-hour break (G1); first-break direction instead of the 3-day rule (K1-K2) | worse | first-hour breaks were fakes 5 times in 6; the 3-day direction beats the raw break in both months |
| Lookback 2 / 5 / 10 instead of 3 (L1-L3) | 2 and 5 positive, none better; 10 fails | the edge is short-term direction; the rule is not a lucky "3" |
| Regime detectors (F1 efficiency, R1 new extreme, R2 big days, R3 rule's own results) | none separates A2's good days from bad | "trend month vs box month" is visible afterwards, not at 07:00 |
| Dead-Asia filter (Q1-Q3), no-Friday (W1) | remove trades worth about zero | same total, fewer trades, smaller drawdown; not more profit. W1 and F1 still running as forward paper tags |
| Ignition-candle setup (M1-M3) | 3 full stops outside the hand-picked days | big days are only obvious afterwards; A2 is already in before the big hour |
Ruled out about myself: discretionary skips (my one skip cost +1.1R; "feel" is 1 right, 4 wrong) and rules made from replaying single days (they fix that day only).

## What is still open
A second, different setup for more trades per month; telling trend from box in advance; and whether the "fewer trades, smaller drawdown" filters do anything real (next test).

## How I work
Jan-Feb is mined out (35 variants on 39 trade-days): from here it can only reject ideas, not confirm them. Confirmation comes only from days traded forward, one at a time.
Every test: one question, kill test first, max 3 variants, one month per command, inspiring days removed, everything counted in STATE.md.
