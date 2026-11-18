# Idea LB (idea 65): the 3-day lookback on ALL history - is it the top of a hill or a spike? - PRE-REGISTRATION (pushed before any code or run)
Sim clock Fri 2015-05-22 22:00 London. END 2015-05-23 (history to the clock).
## Why this, and why now is not a reason to change anything
- The coach's last three directions are done: entry minute (ET: 08:00 is the top of a hill), stop distance (SA: 40 pips holds), exit rule (TW: too thin).
  The one number of A2 I have never re-tested on all history is the one that DEFINES the edge: the direction signal's lookback of 3 days.
- It was chosen on January and checked on February (idea L: lookback 2 / 5 / 10: Jan +0.49 / +0.49 / +0.03R against +0.75R; Feb +0.14 / +0.26 against
  +0.23R). 60 live trades have been made since, none of which took part in choosing it.
- I am in my deepest drawdown (3.69R, inside the normal range I wrote down on 05-19). This test is NOT a search for a better lookback to switch to on a
  losing week: a survivor could only get a forward paper tag, and A2's own judge stays the alarm at 100 live trades. What I want is the shape: if 3 days
  sits on a hill (its neighbours work too), the edge is a property of "recent direction"; if it is a spike, I chose a lucky number in January.
## What I looked at first
No chart can show this; the look is my own record: idea L's lines above, and UN's note that a majority vote of the 2-, 3- and 5-day signals differs from
the 3-day signal on only 3 of 76 days - so the neighbours mostly trade the same direction, and the differences will come from a few dozen days.
## Variants (3; A2 exactly, only the lookback changes; 1 trade a day at 08:00, 40 pip stop, out 12:00 London)
- LB2: last 22:00 close against the close 2 trading days earlier. LB4: 4 days earlier. LB5: 5 days earlier.
(Lookback 1 was idea K's "yesterday's direction" and is dead; 10 was dead in January and February.)
## Data
All days before 2015-05-23 on which A2 and the variant both have a trade (a longer lookback needs more closes at the very start of January; the number of
common days is printed). Nothing dropped: there are no inspiring days. Known beforehand: the Jan and Feb averages above, and my whole live record.
## Kill lines for a CHALLENGER (each variant against A2 on the common days; one failure kills it as a challenger)
- K1: net R at least 2.0R above A2.
- K2: not behind A2 in either half (before 03-02; from 03-02).
- K3: max drawdown at most 0.5R above A2's and worst 10 in a row at most 0.5R worse.
- K4: still ahead of A2 without its 3 best difference-days.
## The reading that matters more (written now so I cannot bend it afterwards)
- HILL: lookbacks 2 and 4 each keep at least 60% of A2's net R AND are positive in both halves.
- SPIKE: either of them keeps 30% or less, or is negative in a half. A spike is written to the coach as a warning about A2. It changes no rule by itself.
- Anything between: "unclear", said as such.
Hand-check before totals: the three signals of one day worked from the 22:00 closes of my own call, against the script.
My guess, written now (I cannot guess these; kept to show it): LB2 about 70% of A2, LB4 about 85%, LB5 about 75%; none passes K1; reading HILL.

## Mechanics hand-check (`python bt/lookback_hill.py 2015-05-23 --check DATE`)
- Lookback 3 through this script reproduces engine A2 on all 99 days (largest difference 0.000R).
- 05-19, from the 22:00 closes in my own calls (05-18 1.13141; 05-14 1.14097; 05-13 1.13536; 05-12 1.12127; 05-11 1.11546): 2-day 1.13141 < 1.14097 SELL;
  3-day < 1.13536 SELL; 4-day > 1.12127 BUY; 5-day > 1.11546 BUY. The script: SELL +2.18R | SELL +2.18R | BUY -1.03R | BUY -1.03R. Same.
- 05-22: all four SELL by hand and by script.
- Note: the engine fills the first days of January with a shorter lookback when there are not enough closes yet, so all variants have 99 common days.

## Results (run once; `python bt/lookback_hill.py 2015-05-23`; figures copied from the print)
A2 on the 99 days (engine): net +33.70R (before 03-02 +19.56R, from 03-02 +14.14R), win 61%, max DD 3.75R, worst 10 in a row -3.75R.
| lookback | net R | share of A2 | before 03-02 (vs A2) | from 03-02 (vs A2) | wins | max DD | worst 10 | days with the opposite direction: variant / A2 on them | diff without best 3 days |
|---|---|---|---|---|---|---|---|---|---|
| 2 days | +18.44 | 55% | +12.80 (-6.75) | +5.64 (-8.51) | 53% | 4.39R | -4.21 | 16 days: -6.32R / +8.94R | -19.36 |
| 3 days (A2) | +33.70 | 100% | +19.56 | +14.14 | 61% | 3.75R | -3.75 | - | - |
| 4 days | +26.31 | 78% | +14.26 (-5.30) | +12.05 (-2.09) | 54% | 7.60R | -6.96 | 17 days: -4.35R / +3.05R | -13.05 |
| 5 days | +29.23 | 87% | +16.17 (-3.39) | +13.05 (-1.09) | 57% | 6.60R | -5.92 | 21 days: -3.48R / +1.00R | -11.65 |
Challenger lines: K1, K2, K3, K4 all FAIL for all three. No challenger; no tag.

## The reading, by the rule I wrote before the run
HILL needed lookbacks 2 AND 4 at 60% or more, positive in both halves. Lookback 4 keeps 78%, lookback 2 keeps 55%: five points short. SPIKE needed 30% or
less, or a negative half: neither is anywhere near that - every neighbour is positive in both halves. By my own written rule the reading is "UNCLEAR",
and I report it as that rather than round 55% up.
What the table says beyond the label, said carefully:
- 3 days is the best lookback I have measured on all history, in both halves, and it was the best in January too. Nothing beats it; nothing is close on
  drawdown (the 4- and 5-day versions go through 6.6R to 7.6R drawdowns against 3.75R).
- Its neighbours all make money in both halves: 55% / 78% / 87% of A2's net for 2 / 4 / 5 days. That is not what a lucky number looks like; a lucky
  number has dead neighbours (the 10-day lookback was dead in January and February). But the slope on the short side is steep: one day shorter loses
  almost half.
- On the days where a neighbour points the other way, A2 was the one that made money each time (+8.94R against -6.32R on 16 days for the 2-day signal).
  This is also the UN3 question from the other side: the 5-day signal disagreed on 21 days and A2 made +1.00R on them - about nothing, which is what the
  paper tag is there to settle.
- So: the edge is "the direction of the last few days", it is there for every lookback from 2 to 5, and 3 is the best member of the family rather than
  an island. I trust the signal a little more after this than before; I cannot call it a clean hill.

## My guess against what happened
"LB2 70%, LB4 85%, LB5 75%; none passes K1; HILL": 55%, 78%, 87%; none passes; UNCLEAR. Wrong on two numbers and on the label.

## What I do with it
Nothing changes. A2 keeps the 3-day lookback; UN3 stays the paper line for 3-day against 5-day; the alarm at 100 live trades stays A2's judge.
With ET, SA, TW and this, every number in the rule (direction lookback, entry minute, stop distance, exit clock) has now been re-tested on all history
and none moved. The losing run is not explained by a wrong setting. It is, as far as I can measure, variance inside the range I wrote down on 05-19.
Counts: ideas 65, variants 182 (LB2 LB4 LB5). Adopted trading ideas: 0. On paper: UN3, PH2, MB1.
