# Best 5 vs worst 5 of my whole history, on the chart + ONE difference turned into a test. KILL LINES WRITTEN FIRST (nothing has been run)
Clock Tue 2015-03-31 00:00 UTC (end of released data). 60 mechanical A2 trades, 01-06 .. 03-30, London time, costs on. Charts: bt/best_worst.py (M15, previous afternoon to London noon).

## The ten trades, and what could be measured AT the entry (pips signed in my trade direction; + = with me)
| | Day | Side | R | Night: 00:00 -> 08:00 entry | Hour before entry (07-08) | Asia range | Where in yesterday's range (1 = far end my way) | First hour AFTER entry | Worst point |
|---|---|---|---|---|---|---|---|---|---|
| best | Fri 01-23 | sell | +4.30 | +1 | -10 | 59 | 0.91 | +74 | 10 |
| best | Mon 03-23 | buy | +2.58 | -34 | -12 | 51 | 0.60 | 0 | 25 |
| best | Tue 02-17 | buy | +2.16 | +20 | +4 | 44 | 0.30 | 0 | 16 |
| best | Fri 03-06 | sell | +2.11 | +7 | -10 | 18 | 0.71 | +28 | 1 |
| best | Thu 01-15 | sell | +2.08 | +7 | -5 | 30 | 0.58 | +18 | 1 |
| worst | Thu 03-19 | buy | -1.03 | -139 | -76 | 162 | 0.29 | -52 | 30 (stopped) |
| worst | Fri 02-20 | buy | -1.03 | -10 | -5 | 17 | 0.00 | -26 | 39 (stopped) |
| worst | Tue 01-27 | sell | -1.00 | 0 | -5 | 35 | 0.23 | -88 | (stopped) |
| worst | Mon 01-19 | sell | -1.00 | +2 | +10 | 22 | 0.48 | -25 | (stopped) |
| worst | Mon 03-02 | sell | -1.00 | -18 | -4 | 23 | 0.96 | -14 | (stopped) |
(The seven full stops of my history are 01-19, 01-27, 02-20, 03-02, 03-09, 03-19, 03-27; the worst five are the first five by R.)

## What I see on the charts
- WINNERS: the night before is calm and, if anything, leaning my way; the hour before entry is small (14-33 pips); the leg starts at or after 08:00 and the first hour never closes against me.
- LOSERS: in four of five the last 12-18 hours had been going the OTHER way - 03-19 a 139 pip overnight fade of the spike, 02-20 a slide all night, 01-19 holding a V-bounce,
  03-02 a creeping Asia rally. My 3-day signal said one thing; the most recent half-day said the opposite, and London sided with the half-day within the first hour.
- What does NOT separate them: the hour before entry (small in nine of ten), the Asia range (tested: Q), yesterday's range position (winners 0.30-0.91, losers 0.00-0.96; tested: C, H),
  the first-hour break of the Asia range (tested: G), the weekday.
- The sharpest difference is AFTER the entry: the first hour closed against me in all five losers (-14 to -88 pips) and flat-or-with-me in all five winners. I have tested that
  twice (T1, T2: close at 09:00 if not working) and it failed - trades slightly under water at 09:00 went on to make money. I am not testing it a third time.
- The one AT-ENTRY difference left: the night. Night move with me or flat-positive in four of five winners (+1, +20, +7, +7; the exception 03-23 at -34);
  night against or dead flat in all five losers (-139, -18, -10, 0, +2).
  I noticed the same thing in my very first review (hand count on my live Jan-Feb trades: Asia against me, 8 trades, about +0.1R each; Asia with me by 10+ pips, 10 trades,
  about +1.0R each including the two shock days) and never turned it into a rule.

## The test: idea NM "the night has to agree" (ideas -> 25)
Hypothesis: A2's 3-day direction pays when the most recent hours do not contradict it. If price has moved AGAINST my side between 00:00 London and the 08:00 entry,
the trade has lower expectancy, and skipping it raises avg R without lowering net R.
Rule change (single): A2 exactly as frozen, plus: measure the move from the 00:00 London price to the 08:00 entry price, signed in my direction. Variants (60, 61, 62), no others:
- NM1: no trade if the night move is below 0 (any amount against).
- NM2: no trade if the night move is -15 pips or worse (clearly against).
- NM3: trade only if the night move is +5 pips or better (clearly with).

## Data, stated before running
- January = build. The inspiring days in January (01-15, 01-19, 01-23, 01-27) are removed from the judging - my standing rule for ideas that come from looking at particular days.
- Check = March lived days 03-02..03-30 with ITS inspiring days removed (03-02, 03-06, 03-19, 03-23). Use #3 of the clean month. With four of its most extreme days taken out and
  17 trades left, it can reject; it cannot confirm.
- February is shown (without 02-17, 02-20), labelled contaminated; and I already hold a hand count from my first review that favours this idea on Jan-Feb. So Jan-Feb agreeing is expected.

## KILL LINES (explicit)
Build (January without its four inspiring days) - a variant survives only if ALL:
  B1. kept avg R >= A2's avg R on the same days + 0.05R;
  B2. the trades it skips average LESS than the trades it keeps;
  B3. it skips at least 3 trades and keeps at least 60% of them.
  The survivor with the highest kept avg R is THE candidate. No survivor -> the idea's three variants are closed; nothing is claimed from March.
Check (March lived days without its four inspiring days) - the candidate passes only if ALL:
  C1. kept avg R >= A2's avg R on the same days + 0.15R;
  C2. the trades it skips average <= 0R (so it does not give up profit);
  C3. max drawdown <= A2's; and it keeps at least 60% of the trades.
A pass earns a FORWARD PAPER TAG only. It cannot change the funded rule.
My guess: NM1 and NM3 skip too many trades (fail B3); NM2 survives January; March is a coin toss because its trend days had nights going with me anyway.
