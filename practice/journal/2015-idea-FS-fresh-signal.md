# Idea FS (idea 76): a fresher direction signal for A2 - PRE-REGISTRATION with worked cases (pushed before the script is written or run)
Sim clock Fri 2015-06-05 22:00 London. END 2015-06-06. Coach: one idea to make A2 itself better, kill line first, variants counted; one test, one day.
## The idea
A2 decides its direction from last night's 22:00 London close against the close three trading days earlier. By the time I enter at 08:00 that close is
ten hours old, and the night has traded since. Every other number of the rule has been re-tested on all history (lookback, entry minute, stop, exit
clock); the END POINT of the signal never has. Fresher version: use the price at 07:00 London today - the moment I write the call - instead of last
night's close.
Known against it, stated: on the days where a neighbour signal pointed the other way, A2 was the one that made money (LB: +8.94R against -6.32R on 16 days
for the 2-day lookback); the night trade in my direction earns nothing (NT: 0.00R) and nights tend to give back part of the day's move (NF). So the
night's news may be noise, and adding it to the signal may make it worse. Honest prior: no gain; maybe a loss.
## Variants (3; entry 08:00, 40 pip stop, exit 12:00, size - all A2; only the DIRECTION changes; own simulator of bt/confirm_entry.py at X = 0, whose stop days equal the engine's)
- FS1: sign of (07:00 price today - 07:00 price three trading days ago): same lookback, both ends at 07:00.
- FS2: sign of (07:00 price today - the 22:00 close three trading days back that A2 uses): only the near end is refreshed.
- FS3: A2's direction, but NO TRADE when FS2 points the other way (the night has cancelled the signal).
## WORKED CASES (June goal; python line from figures in my own 07:00 calls)
06-05: A2: close 06-04 1.12375 against close 06-01 1.09259 = +312 pips -> BUY. FS1: 07:00 today 1.12200 against 07:00 on 06-02 1.09325 = +288 pips -> BUY.
FS2: 1.12200 against 1.09259 = +294 pips -> BUY. All three agree; the script must print these three figures for 06-05.
Expectation worked from what I know: the signals can only differ when the 3-day gap is small against the night's move. My small-signal days
(gap / ADR5 under about 0.3) are roughly a quarter of all days, and a night moves 20 to 50 pips; so I expect the direction to differ on roughly 10 to 20
of 108 days. On those days, if the night carries no information, the variant is a coin against A2 - and SG showed small-signal days are ordinary A2
days (positive), so a coin that flips some of them should LOSE a little. Expected: FS1 and FS2 one to three R behind A2.
## Kill lines (FS2 is the main variant; against A2 on the same simulator, all A2 days before 2015-06-06, costs on; one failure kills)
- K1: net R at least 2.0R above A2.                                                [worked expectation: 1R to 3R BEHIND -> expect FAIL]
- K2: not behind A2 before 03-02 and at least +1.0R ahead on lived days.
- K3: max drawdown at most 0.5R larger than A2's.
- K4 where it differs: at least 10 days with a different direction, and on those days the variant's net is above 0R and above A2's net on them.
  [worked: 10 to 20 such days expected; the sample line may bind]
- K5 neighbour: FS1 not more than 1.0R behind A2.
FS3 (the filter) is judged by its own short line: the trades it removes must average below 0R and number at least 10; otherwise killed.
A survivor gets the lived-days table and then at most a forward paper tag.
My guess = the worked expectation: killed on K1.
