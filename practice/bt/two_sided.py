"""Idea SD: is A2's edge two-sided? A2 trades split by side and by agreement with the 10-day trend; variants SD1-SD3 are derived from A2's own daily R
(a skipped day = 0R, a half-size day = half the R), so they are exact. usage: python bt/two_sided.py END [--check]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
cl = m5.groupby("day")["close"].last(); ds = [str(d) for d in cl.index]; cl.index = ds
g = t.groupby("tag").agg(R=("R", "sum"), side=("side", "first"))
def big(d, N=10):
    i = ds.index(d)
    return np.nan if i - 1 - N < 0 else (1.0 if cl.iloc[i-1] > cl.iloc[i-1-N] else -1.0)
g["big"] = [big(d) for d in g.index]; g["agree"] = np.where(g.big.isna(), np.nan, (g.big == g.side).astype(float))
per = lambda d: "Jan" if d < "2015-02-01" else ("Feb" if d < "2015-03-01" else "Mar-now"); g["per"] = g.index.map(per); PS = ("Jan", "Feb", "Mar-now")
if "--check" in sys.argv:      # mechanics only: closes and labels for a few days, no results
    print(f"first close in history {ds[0]} {cl.iloc[0]:.5f} | last {ds[-1]} {cl.iloc[-1]:.5f}")
    for d in ("2015-01-20", "2015-03-24", "2015-04-17"):
        i = ds.index(d); print(d, "side", int(g.side[d]), "| prev close", round(cl.iloc[i-1], 5), "| 3 back", round(cl.iloc[i-4], 5), "| 10 back", round(cl.iloc[i-11], 5), "| big", g.big[d], "agree", g.agree[d])
    sys.exit()
def st(x): return f"n={len(x):2d} win={100*(x>0).mean():3.0f}% avg={x.mean():+.3f} net={x.sum():+6.2f} se={x.std(ddof=1)/np.sqrt(len(x)):.2f}" if len(x) > 1 else f"n={len(x)}"
def block(title, a, b, na, nb):
    A, B = g.R[a], g.R[b]; diff = A.mean() - B.mean(); se = np.sqrt(A.var(ddof=1)/len(A) + B.var(ddof=1)/len(B))
    print(f"--- {title}\n  {na:8s}: {st(A)}\n  {nb:8s}: {st(B)}\n  difference {na} - {nb}: {diff:+.3f}R (two standard errors: +-{2*se:.2f}R)")
    for p in PS: print(f"     {p:8s} {na}: {st(g.R[a & (g.per==p)])} | {nb}: {st(g.R[b & (g.per==p)])}")
    small = g.R[b]; d1 = small.mean() >= 0.10; d2 = small.mean() >= A.mean() / 3; d3 = sum(g.R[b & (g.per==p)].sum() > 0 for p in PS) >= 2
    print(f"  D1 {nb} avg {small.mean():+.3f} >= +0.10: {'PASS' if d1 else 'FAIL'} | D2 >= one third of {na} ({A.mean()/3:+.3f}): {'PASS' if d2 else 'FAIL'} | D3 {nb} net positive in >= 2 of 3 periods: {'PASS' if d3 else 'FAIL'}")
    return d1 and d2 and d3
print(f"A2 to {END}: {st(g.R)}")
ok1 = block("by side", g.side < 0, g.side > 0, "sells", "buys")
ok2 = block("by the 10-day trend (undefined days left out)", g.agree == 1, g.agree == 0, "with", "against")
print(f"HYPOTHESIS 'A2 is two-sided': by side {'SURVIVES' if ok1 else 'KILLED'}; by 10-day trend (D4) {'SURVIVES' if ok2 else 'KILLED'} -> {'SURVIVES' if ok1 and ok2 else 'KILLED'}")
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
A = g.R
for name, V, ch in (("SD1 sells only", A.where(g.side < 0, 0.0), g.side > 0), ("SD2 skip when against the 10-day trend", A.where(g.agree != 0, 0.0), g.agree == 0), ("SD3 half size when against", A.where(g.agree != 0, A / 2), g.agree == 0)):
    gap = A[~ch].mean() - A[ch].mean(); gp = {p: A[~ch & (g.per==p)].mean() - A[ch & (g.per==p)].mean() for p in PS}
    k1 = V.mean() >= A.mean() + 0.05; k2 = gap >= 0.3; k3 = sum(v >= 0.3 for v in gp.values()) >= 2 and all(v >= -0.3 for v in gp.values()); k4 = ch.sum() >= 10 and (~ch).mean() >= 0.6
    print(f"{name}: avg/signal day {V.mean():+.3f} (A2 {A.mean():+.3f}) net {V.sum():+.2f} dd {dd(V):.2f} (A2 {dd(A):.2f}) | changes {int(ch.sum())} days | gap others-changed {gap:+.2f} | by period " + " ".join(f"{p} {v:+.2f}" for p, v in gp.items()) +
          f" | K1 {'PASS' if k1 else 'FAIL'} K2 {'PASS' if k2 else 'FAIL'} K3 {'PASS' if k3 else 'FAIL'} K4 {'PASS' if k4 else 'FAIL'}")
