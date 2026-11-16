# After a lively hour before entry: does the HOUR'S OWN direction tell me anything? HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY CODE OR RESULT
Clock Thu 2015-05-07 01:00 London (end of released data). All lived history 01-06 .. 05-06 (explicit end 2015-05-07); costs on; London time.

## Where it comes from
The PH test (04-30) left one finding standing: on mornings whose pre-entry hour (07:00-08:00 London) ranged 30+ pips, my 3-day signal earns little (+0.146R on 30
trades, against +0.572R after a quiet hour). PH2 is on paper for that. What I have NOT asked: if the 3-day direction is weak on those mornings, is there a better
direction? London has just moved 30-80 pips in one hour. Either that move carries on to noon (momentum) or it is given back (a false start). Both are stories;
I have a count for neither.
This is not an A2 filter: it is a separate trade on lively mornings only, with its own direction. It would matter in two ways: as a possible second setup, and as an
explanation of WHY A2 is weak there (if the hour's direction beats the 3-day direction on those days, A2 is simply facing the wrong way after London has spoken).

## Sample and contamination, plainly
- Lively mornings so far: 30 in the PH test to 04-29, plus the live days since - the script prints the exact count. About 34. That is the whole sample; each variant uses all of it.
- I have walked the last eleven live mornings bar by bar and remember several lively ones going both ways after 08:00 (04-24 and 05-06: the hour's move was given back;
  04-30 and 05-04: it carried on). From memory it looks like a coin. I expect nothing, and say so.
- The night-fade test taught me that a trade and its mirror can BOTH lose once each has a stop. So "follow" failing does not make "fade" work; both are run and both
  must pass on their own.

## Hypothesis
On lively mornings the direction of the pre-entry hour (its close against its open) carries information for 08:00-12:00 that the 3-day signal lacks: following it has
a positive expectancy of its own.

## Variants (142, 143, 144; ideas -> 53), no others afterwards. All: only on mornings with a pre-entry hour range of 30+ pips; market order at 08:00 London, stop 40 pips,
no target, close at 12:00 London, $125 risk, costs on. (Same hours as A2, so this could never be traded ON TOP of A2 at my size without a separate risk decision; that
question only arises for a survivor.)
- LM1: trade WITH the pre-entry hour's direction (07:00 open to 08:00).
- LM2: trade AGAINST it.
- LM3: trade with it only when the hour moved at least 20 pips net (a decided hour, not a round trip); otherwise no trade.

## KILL TEST (explicit). The build can only kill; a survivor gets a forward PAPER tag (100 forward trades at +0.15R, two standard errors).
A variant survives only if ALL:
  K1. average R per trade at least +0.15R;
  K2. net R positive in the backtest months (to 02-27) AND in the live months (from 03-02) - reported with their counts, since the backtest months have few lively days;
  K3. net R still positive without its three best trades;
  K4. maximum drawdown at most 5R;
  K5. it beats A2 ON THE SAME MORNINGS by at least 0.15R per trade (otherwise the 3-day direction is no worse there than the hour's own);
  K6. at least 20 trades.
My guess, written now: LM1 and LM2 both land between -0.15R and +0.10R; neither beats A2's +0.15R on those mornings; LM3 has under 20 trades or fails K1. No survivor:
on lively mornings there is no direction I can name at 08:00, and A2's weakness there is noise or volatility, not a wrong-way signal.
