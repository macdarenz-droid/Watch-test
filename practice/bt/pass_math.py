"""Challenge arithmetic from my OWN live trade results (sim/trades.csv). No price data, no strategy variant.
Bootstrap: draw trades with replacement from a set of my R results, 1 trade per day; phase 1 passes at +8%, breaches at -10% total.
(Daily 5% limit cannot be hit: 1 trade/day, max loss 1R = the risk %.)"""
import numpy as np, pandas as pd, os
t = pd.read_csv(os.path.join(os.path.dirname(__file__), "..", "sim", "trades.csv"), parse_dates=["entry_time"]); t["R"] = t.pnl / 125.0
allR = t.R.values; jan = t[t.entry_time < "2015-02-01"].R.values; feb = t[t.entry_time >= "2015-02-01"].R.values
W = allR[allR > 0].mean(); L = -allR[allR < 0].mean()
print(f"live: n={len(allR)} win={100*(allR>0).mean():.0f}% avgR={allR.mean():+.2f} avg winner {W:+.2f}R avg loser {-L:+.2f}R | Jan n={len(jan)} {100*(jan>0).mean():.0f}% {jan.mean():+.2f} | Feb n={len(feb)} {100*(feb>0).mean():.0f}% {feb.mean():+.2f}")
print(f"\nREQUIRED avg R per trade for +8%, and win rate needed at my payoff (winner {W:+.2f}R / loser {-L:+.2f}R):")
for risk in (0.5, 0.75, 1.0):
    for n in (20, 40):
        need = 8.0 / (n * risk); p = (need + L) / (W + L)
        print(f"  risk {risk:.2f}%  {n} trades ({n//20} month): need {need:+.2f}R/trade -> win rate {100*p:5.0f}%   | losses in a row to breach 10%: {10/risk:.0f} full stops")
rng = np.random.default_rng(7); N = 100_000
def sim(R, risk, n):
    x = rng.choice(R, size=(N, n)) * risk; c = np.cumsum(x, axis=1)
    hit = (c >= 8.0); br = (c <= -10.0)
    fh = np.where(hit.any(1), hit.argmax(1), n + 1); fb = np.where(br.any(1), br.argmax(1), n + 1)
    return (fh < fb).mean() * 100, (fb < fh).mean() * 100, np.median(c[:, -1])
sets = {"all 34 live (avg %+.2f)" % allR.mean(): allR, "Feb only, out-of-sample (avg %+.2f)" % feb.mean(): feb, "Feb shifted to ZERO edge": feb - feb.mean(), "Jan only (avg %+.2f)" % jan.mean(): jan}
print("\nBOOTSTRAP: chance to reach +8pct / chance to breach -10pct, by risk and horizon")
for name, R in sets.items():
    print(" ", name)
    for risk in (0.5, 0.75, 1.0):
        a = sim(R, risk, 20); b = sim(R, risk, 40); c = sim(R, risk, 80)
        print(f"    risk {risk:.2f}%: 1 month pass {a[0]:4.0f}% breach {a[1]:4.1f}% | 2 months pass {b[0]:4.0f}% breach {b[1]:4.1f}% | 4 months pass {c[0]:4.0f}% breach {c[1]:4.1f}%")
