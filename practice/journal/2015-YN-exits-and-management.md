# YN exits and management (coach 09-01: "150 ideas and nothing alive means pick your single best near-miss and work on its exits/management,
# not a new entry"). Idea 151. Written Tue 2015-09-01 22:00 London, before any code or outcome.

## Which near miss, by a rule written now
Candidates = killed ideas that were positive in BOTH periods and positive at stressed costs, and are not frozen or already counted forward.
YM1 (+0.113R) and NC1 are excluded: forward counts running, the coach said do not tune YM on the same data; EN2 is running forward too.
SW1 is closed by its own line; LM2 and BX2 are closed for good. That leaves YN1 (fade yesterday's NY afternoon move, 13:00-17:00 London,
when it was 20+ pips, at the next 08:00; stop 40, out 12:00): 114 trades +0.070R (+-0.17), +3.66R / +4.35R, stressed +0.028R,
control -0.008R, p 0.66 (journal/2015-idea-YN-yesterdays-new-york-for-the-morning.md). It is the single best by that rule.
THE ENTRY IS NOT TOUCHED: N = 20, 08:00 market against yesterday's NY move, 40-pip stop at the start. Only what happens after.
Note: YN was run on history to 08-14; the days since (08-17..09-01) are new to it. This test uses all history to 09-01.

## Hypothesis
YN is a fade of a move that went too far; a fade's profit, if any, comes early (the snap-back) and then the London morning's own trend
takes over. So a shorter hold (or locking the trade once it has snapped back) keeps more of it than A2's noon clock. Background, no
source I can cite. Against it: for A2 every earlier exit, partial and break-even lost (ET/XT/BE/PM/LK) - noon was the top of the hill.

## THE THREE VARIANTS (named now; base YN1 is the reference, not a variant)
E1 earlier clock: out at 10:00 instead of 12:00.
E2 later clock: out at 16:00 instead of 12:00.
E3 break-even: once a closed M5 candle shows the trade 20+ pips in profit (buy: high - entry; sell: entry - (low + that candle's spread)),
   the stop moves to the entry price for the rest of the trade; otherwise as base (out 12:00). Checked on the candle AFTER it happens.
## KILL LINES (four, all must pass, for EACH variant against base YN1, paired day by day). All R after costs: spread 1.0 + slippage 0.1
## pips (engine default); stressed 2.0 + 0.5.
K1 the variant's average R >= +0.10R AND at least +0.05R above base's average.
K2 variant minus base, summed, above zero before 04-07 AND from 04-07.
K3 the variant's average R at stressed costs above zero.
K4 variant minus base, paired, sign-flip p < 0.10.
Three looks at the same days: a single pass at p just under 0.10 is about what luck gives one time in four over three tries. ANY PASS
IS A HINT ONLY: it could become a frozen forward count (one at a time, coach's word), never a rule or money.
Worked case (base mechanics, from the window, before outcomes): to be written from the tool's check line after the code, before the run.
My guess: E1 and E3 cut winners the way they did for A2; E2 adds noise.

## Worked case (written from my 08-28 walk notes BEFORE the tool shows that day's exits)
Fri 08-28: NY on Thu 08-27 moved -68.7 pips (tool's signal list) -> YN fades it = BUY at the 08:00 open (~1.1264 in my walk).
My walk (sell-side numbers, so turned over for a buy): the 07:00-07:45 UTC candles went to about +46.7 for a buy; at 10:00 London about
+25.4; at noon about +16.6. So: base (noon) ~ +16.6 pips = about +0.4R; E1 (10:00) ~ +25.4 = about +0.6R; E2 unknown (after my walk);
E3: +20 reached in the 07:15 UTC candle -> stop to entry; never came back to entry by noon in my notes -> same as base.
Tool check next: `python bt/yn_exits.py 2015-09-02 check 2015-08-28 x`; then one run.

Tool check 08-28 (mechanics): base +0.37R (entry 1.12650, out 1.12797), E1 +0.58R, E2 -1.03R (stopped in the afternoon), E3 = base.
Matches the worked case (+0.4R / +0.6R / same).

## Result (one run; `python bt/yn_exits.py 2015-09-02 run`; ALL R AFTER COSTS spread 1.0 + slippage 0.1; stressed 2.0 + 0.5)
YN1 days 127 (01-05..08-31; 51 before 04-07, 76 from).
| exit | avg R | net R | wins | before 04-07 | from 04-07 | stressed avg | max DD | minus base (before / from) | p |
|---|---|---|---|---|---|---|---|---|---|
| base YN1 out 12:00 | +0.032 (+-0.16) | +4.08 | 46% | +3.66 | +0.42 | -0.010 | 10.24R | - | - |
| E1 out 10:00 | +0.012 (+-0.13) | +1.51 | 48% | +2.29 | -0.78 | -0.031 | 9.93R | -0.020 (-1.38 / -1.20) | 0.683 |
| E2 out 16:00 | +0.088 (+-0.23) | +11.20 | 44% | +12.13 | -0.93 | +0.048 | 14.69R | +0.056 (+8.47 / -1.35) | 0.483 |
| E3 break-even at +20 | +0.050 (+-0.15) | +6.31 | 34% | +3.87 | +2.45 | -0.019 | 10.86R | +0.018 (+0.21 / +2.02) | 0.524 |
Kill lines, each value against its threshold:
E1: K1 +0.012R (needs >= +0.10R and >= +0.082R) FAIL | K2 -1.38 / -1.20 FAIL | K3 -0.031 FAIL | K4 p 0.683 FAIL.
E2: K1 +0.088R FAIL | K2 +8.47 / -1.35 FAIL | K3 +0.048 PASS | K4 p 0.483 FAIL.
E3: K1 +0.050R FAIL | K2 +0.21 / +2.02 PASS | K3 -0.019 FAIL | K4 p 0.524 FAIL.
VERDICT: no exit change passes; all three KILLED (idea 151; variants E1 E2 E3 counted).

## The bigger finding: YN itself on days it had not seen
YN was tested on history to 08-14 (114 trades, +0.070R, +3.66R / +4.35R). The SAME frozen entry and exit now has 127 trades and +0.032R;
from 04-07 +0.42R. So the 13 new trades (08-17..08-31) lost about 3.9R (net +8.01R -> +4.08R; from the two runs' printed nets).
Stressed it is now below zero. The near miss did not hold on its first unseen days. 13 trades is small, but it is the direction that
counts for a near miss: it moved away from the line, not toward it.
Reading: exits cannot rescue an entry with no edge; the later clock (E2) only adds variance (DD 14.69R) and all its gain is before 04-07.
The A2 lesson holds here too: management does not make an edge.
