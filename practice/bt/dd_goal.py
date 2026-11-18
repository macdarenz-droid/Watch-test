"""Drawdown-goal test: is a filter's net R / max drawdown better than RANDOMLY skipping the same number of A2 trades? Jan-Feb only."""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, numpy as np, pandas as pd
from backtest import history
END = pd.Timestamp("2015-03-01", tz="UTC")
m5 = ideas.days(history("M5")); m5 = m5[m5.time < END]
def get(n):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
    return t.reset_index(drop=True)
def dd(R):
    eq = np.cumsum(R); return float((np.maximum(np.maximum.accumulate(eq), 0) - eq).max()) if len(R) else 0.0
def score(R):
    d = dd(R); return R.sum() / d if d > 1e-9 else np.inf
A = get("A2"); rng = np.random.default_rng(5)
def test(label, name, first, drop=None):
    a = A[A.entry_time >= pd.Timestamp(first, tz="UTC")]; v = get(name); v = v[v.entry_time >= pd.Timestamp(first, tz="UTC")]
    if drop: a = a[a.entry_time.dt.strftime("%Y-%m-%d") != drop]; v = v[v.entry_time.dt.strftime("%Y-%m-%d") != drop]
    keep = a.entry_time.isin(v.entry_time).values; Ra = a.R.values; k = int((~keep).sum()); n = len(Ra)
    sims = np.array([score(Ra[np.sort(rng.choice(n, n - k, replace=False))]) for _ in range(10_000)])
    s = score(Ra[keep]); p90 = np.percentile(sims[np.isfinite(sims)], 90); pct = 100 * (sims < s).mean()
    print(f"{label:24s} A2: n={n} net={Ra.sum():+.2f} dd={dd(Ra):.2f} score={score(Ra):.2f} | filter: n={keep.sum()} skipped={k} net={Ra[keep].sum():+.2f} ({100*Ra[keep].sum()/Ra.sum():.0f}% of A2) dd={dd(Ra[keep]):.2f} score={s:.2f} | random: median {np.median(sims):.2f}, 90th pct {p90:.2f} | filter beats {pct:.0f}% of random")
for lab, name, first in (("DD1 = Q3", "Q3", "2015-01-13"), ("DD2 = Q1", "Q1", "2015-01-01"), ("DD3 = F1", "F1", "2015-01-12")):
    test(lab, name, first); test(lab + " without 01-23", name, first, drop="2015-01-23")
