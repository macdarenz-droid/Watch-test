"""Risk sizing from my OWN Jan-Feb live trades (sim/trades.csv) replayed at different risk per trade. No new strategy variant, no new candles.
R per trade is what I actually got (costs inside). Floating low inside each trade = worst adverse move in pips / 40 (from history M5), capped at the stop."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, pandas as pd
import review
from backtest import history
t = review.load(); f = review.features(t, history("M5"))
R = t.R.values; fl = -np.minimum(f.mae.values + 1.1, 40.4) / 40.0          # floating low in R (incl. spread), never beyond the stop
fl = np.minimum(fl, np.minimum(R, 0))                                     # a closed loss is at least as deep as its floating low
feb = (t.entry_time >= "2015-02-01").values
def path(R, fl, risk):
    bal = np.concatenate([[0], np.cumsum(R * risk)]); low = bal[:-1] + fl * risk     # equity low during each trade, % of 25k
    peak = np.maximum.accumulate(bal)[:-1]
    first8 = next((i + 1 for i, b in enumerate(bal[1:]) if b >= 8), None)
    return bal[-1], (R * risk).min(), (fl * risk).min(), (peak - np.minimum(low, bal[1:])).max(), low.min(), first8
print("REPLAY of my real trade sequence (one trade a day; % of the $25k account)")
print("set            risk   final%  worst closed day  worst floating day  max drawdown (incl. floating)  lowest equity vs start  +8% reached at trade")
for name, m in (("Jan+Feb (34)", np.ones(len(R), bool)), ("Feb only (20)", feb)):
    for risk in (0.5, 0.75, 1.0, 1.5):
        fin, wd, wf, dd, lo, n8 = path(R[m], fl[m], risk)
        print(f"{name:14s} {risk:4.2f}%  {fin:+6.2f}   {wd:+6.2f}            {wf:+6.2f}              {dd:5.2f}                          {lo:+6.2f}                  {n8}")
rng = np.random.default_rng(11); N = 200_000
def boot(Rs, risk, n=40):
    x = rng.choice(Rs, size=(N, n)) * risk; c = np.cumsum(x, axis=1); c0 = np.concatenate([np.zeros((N, 1)), c], axis=1)
    dd = (np.maximum.accumulate(c0, axis=1) - c0).max(1)
    hit = c >= 8; br = c <= -10
    fh = np.where(hit.any(1), hit.argmax(1), n + 1); fb = np.where(br.any(1), br.argmax(1), n + 1)
    return 100 * (fh < fb).mean(), 100 * (fb < fh).mean(), np.median(c[:, -1]), np.percentile(c[:, -1], 5), np.percentile(dd, 95), np.percentile(dd, 99), c.min(1).min()
print("\nBOOTSTRAP, 40 trades (~2 months), 200k paths. pass = +8% before -10%")
print("edge assumed           risk   pass%  breach%  median final%  5th pct final%  95th pct maxDD%  99th pct maxDD%")
for name, Rs in (("Feb real (+0.23R)", R[feb]), ("Feb zero edge", R[feb] - R[feb].mean()), ("Feb NEGATIVE (-0.10R)", R[feb] - R[feb].mean() - 0.10)):
    for risk in (0.5, 0.75, 1.0, 1.5):
        p, b, med, p5, d95, d99, _ = boot(Rs, risk)
        print(f"{name:22s} {risk:4.2f}%  {p:5.1f}  {b:6.2f}   {med:+6.2f}         {p5:+6.2f}          {d95:5.2f}            {d99:5.2f}")
print("\nLimits arithmetic: worst sim day = one full stop = -1.02R. Days of full stops in a row to breach 10%:", {r: int(10 // (1.02 * r)) + 1 for r in (0.5, 0.75, 1.0, 1.5)})
print("Stress day (stop jumped, 3R loss - not possible in this sim, possible in real life):", {r: f"{-3*r:.2f}%" for r in (0.5, 0.75, 1.0, 1.5)})
print("Needed avg R for +8% in 40 trades:", {r: f"{8/(40*r):+.2f}R" for r in (0.5, 0.75, 1.0, 1.5)})
