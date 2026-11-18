"""Idea PS (journal/2015-idea-PS-probation-size.md): drawdown in dollars over 40 trades at three sizes, for a setup with a true edge of 0.00R or -0.10R.
Pool: the engine's A2 daily R from 2015-04-07, shifted to the wanted mean. usage: python bt/probation_size.py END facts | test"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END, MODE = sys.argv[1], sys.argv[2]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
R = t.groupby("tag").R.sum(); pool = R[R.index >= "2015-04-07"]
if MODE == "facts": w = pool[pool.index <= "2015-07-15"]; print(f"pool {len(pool)} trades ({pool.index[0]}..{pool.index[-1]}), mean {pool.mean():+.3f}R, spread {pool.std(ddof=1):.2f}R | the LR window to 07-15: {len(w)} trades, mean {w.mean():+.3f}R"); sys.exit()
rng = np.random.default_rng(83); N, T = 20000, 40
for edge in (0.0, -0.10):
    x = rng.choice((pool - pool.mean() + edge).values, (N, T)); eq = np.cumsum(x, axis=1); dd = (np.maximum.accumulate(np.maximum(eq, 0), axis=1) - eq).max(1); end = eq[:, -1]
    print(f"true edge {edge:+.2f}R: 40-trade result median {np.median(end):+.1f}R, 5% worst {np.percentile(end, 5):+.1f}R | max drawdown median {np.median(dd):.1f}R, 95% under {np.percentile(dd, 95):.1f}R, 99.5% under {np.percentile(dd, 99.5):.1f}R")
    for name, usd in (("PS1 $62.50", 62.50), ("PS2 $31.25", 31.25), ("PS3 $15.63", 15.625)):
        p1 = (dd * usd > 435).mean(); p2 = (dd * usd > 870).mean()
        print(f"   {name}: drawdown over $435 in {p1:.2%} | over $870 in {p2:.2%} | 5% worst 40-trade result ${np.percentile(end, 5) * usd:+.0f} | median ${np.median(end) * usd:+.0f}" + (f" | LINES: {'PASS' if p1 < 0.05 else 'FAIL'} / {'PASS' if p2 < 0.005 else 'FAIL'}" if edge < 0 else ""))
