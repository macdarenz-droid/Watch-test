# How many trades before I trust anything? (written Fri 2015-04-03, before the next idea, as my coach asked)
Numbers from my own mechanical A2 trades, costs on: 64 trades, average +0.50R, standard deviation 1.02R per trade.

## 1. What a sample of trades can and cannot tell me
| Trades | How well I know an AVERAGE R (95% range, +/-) |
|---|---|
| 19 (my January) | +/- 0.46R |
| 40 | +/- 0.32R |
| 64 (everything I have) | +/- 0.25R |
| 100 | +/- 0.20R |
| 200 | +/- 0.14R |
| 400 | +/- 0.10R |
So A2's own edge is "+0.50R, give or take 0.25R" after three months. My planning number (+0.18R) is inside that range; so is +0.75R.

## 2. Filters (kept trades vs skipped trades - two separate groups, the hard case)
Smallest gap between kept and skipped trades that stands out from noise (about two standard errors), for a filter that skips 30%:
| Trades in the test | Smallest detectable gap |
|---|---|
| 19 | 1.03R |
| 40 | 0.71R |
| 100 | 0.45R |
| 200 | 0.32R |
| 400 | 0.22R |
| 800 | 0.16R |
Read the other way: to trust a filter whose kept trades beat its skipped trades by 0.5R I need about 80 trades; by 0.3R about 220; by 0.2R about 500; by 0.15R about 890.
On January's 19 trades a filter can only be noticed if its two groups differ by more than a full R. Every filter "survivor" I found on January (Q3, Y3, C1) was inside the noise;
so, to be fair, were some of the "failures". January can KILL a filter whose skipped trades are plainly the better half (H, NM, GAP: skipped trades +0.9R to +2.3R). It cannot confirm one.

## 3. Rule changes on the SAME trades (exit, stop, entry - paired comparisons, the easier case)
Here each trade is compared with itself, so the noise is the spread of the per-trade DIFFERENCE, which I measured on my old variants at 0.23R to 0.50R:
| Typical spread of the difference | Trades needed to trust +0.10R per trade | ...to trust +0.05R |
|---|---|---|
| 0.23-0.25R (a stop a little wider, break-even) | 22-26 | 86-104 |
| 0.39-0.50R (exit hour, trailing, tighter stop) | 61-100 | 241-400 |

## 4. My rule from now on (applies to every idea; replaces "a January pass + a month's check")
- JANUARY BUILD = A SCREEN THAT CAN ONLY KILL. Failing the build closes a variant. Passing it proves nothing; it only earns a forward paper tag.
- FILTERS: no filter is trusted, and none may touch the funded rule, before at least 200 trades it was not built on have been tagged (about ten months of live days),
  with kept-minus-skipped at least 0.3R and at least two standard errors. Interim looks (40 days) can kill early; they cannot adopt.
- SAME-TRADE CHANGES (exit / stop / entry): none is trusted before at least 100 trades it was not built on, with an average improvement of at least +0.10R and at least two
  standard errors (about five months of live days).
- A2 ITSELF: the forward kill test at 40 trades stays as an early alarm; the real statement about its edge comes at 200 forward trades (+/- 0.14R).
- Existing paper tags keep running under these numbers: F1 and Q1/Q3 are filters -> 200 forward days before any adoption question (they can still be killed at day 40).
- FUNDED FIRST, SIZE FOR SURVIVAL: because I cannot know my edge to better than +/- 0.25R, the funded size (0.50%) is set for the bottom of that range, and no paper tag,
  however good it looks at 20 or 40 trades, can raise it or change the rule. The brakes are the only thing that can change the size, and only downward.

## 5. A slip made while computing this, and what it showed (process mistake P2 in the tracker)
My script for section 3 printed the paired difference against A2 over ALL lived months for five old variants. For X1 (break-even), TR30 (trailing) and E1 (30 pip stop) that
includes March, the clean month I had deliberately not spent on them. No decision used it, but I have now seen it and cannot unsee it:
| Variant | Average difference vs A2 per trade, 64 trades | About two standard errors |
|---|---|---|
| X1 break-even after +20 | -0.05R | 0.06R |
| TR30 trailing | -0.06R | 0.12R |
| S50 stop 50 pips | -0.10R | 0.06R |
| ET11 exit at 11:00 | -0.10R | 0.10R |
| E1 stop 30 pips (same dollar risk) | +0.12R | 0.11R |
E1 is the surprise: closed in February because it was worse in that one month, it is ahead of A2 over all 64 trades by about its own noise. By the rule in section 4 that is NOT
enough (it needs 100 trades it was not built on; it was built on January and I have now seen everything since). The honest handling: say so, do not adopt, do not re-test it on
data I have already looked at, and ask my coach whether to carry E1 as a forward paper tag under the 100-trade rule from the next live day.
Guard added: research scripts must be given an explicit end date; nothing defaults to "all history".
