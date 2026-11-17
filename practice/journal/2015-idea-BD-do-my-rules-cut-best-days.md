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
