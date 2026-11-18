"""Idea UN: A2 on days when the 2-, 3- and 5-day direction signals agree vs days they do not. Variants derived from A2's own daily R (skip = 0R, half size = R/2).
usage: python bt/signal_agree.py END [--check]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = t.groupby("tag").R.sum(); T = {k: {str(d): v for d, v in ideas.trend_map(m5, k).items()} for k in (2, 3, 5)}
g = pd.DataFrame({"R": A, "s2": [T[2][d] for d in A.index], "s3": [T[3][d] for d in A.index], "s5": [T[5][d] for d in A.index]})
g["unan"] = (g.s2 == g.s3) & (g.s3 == g.s5); g["a35"] = g.s3 == g.s5
per = lambda d: "Jan" if d < "2015-02-01" else ("Feb" if d < "2015-03-01" else "Mar-now"); g["per"] = g.index.map(per); PS = ("Jan", "Feb", "Mar-now")
if "--check" in sys.argv:
    cl = m5.groupby("day")["close"].last(); ds = [str(d) for d in cl.index]
    for d in ("2015-02-10", "2015-04-16", "2015-04-20"):
        i = ds.index(d); print(d, "prev close", round(cl.iloc[i-1], 5), "| 2 back", round(cl.iloc[i-3], 5), "3 back", round(cl.iloc[i-4], 5), "5 back", round(cl.iloc[i-6], 5), "| signals", int(g.s2[d]), int(g.s3[d]), int(g.s5[d]), "unanimous", bool(g.unan[d]))
    print("days:", len(g), "| not unanimous:", int((~g.unan).sum()), "| 3 and 5 disagree:", int((~g.a35).sum())); sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
def st(x): return f"n={len(x):2d} win={100*(x>0).mean():3.0f}% avg={x.mean():+.3f} net={x.sum():+6.2f}"
print(f"A2 to {END}: {st(g.R)} dd={dd(g.R):.2f}")
for title, ok in (("all three agree vs not", g.unan), ("3-day and 5-day agree vs not", g.a35)):
    a, b = g.R[ok], g.R[~ok]; se = np.sqrt(a.var(ddof=1)/len(a) + b.var(ddof=1)/len(b))
    print(f"--- {title}\n  agree   : {st(a)}\n  disagree: {st(b)}\n  difference agree - disagree: {a.mean()-b.mean():+.3f}R (two standard errors +-{2*se:.2f}R)")
    for p in PS: print(f"     {p:8s} agree: {st(g.R[ok & (g.per==p)])} | disagree: {st(g.R[~ok & (g.per==p)])}")
for name, V, ch in (("UN1 skip unless all three agree", g.R.where(g.unan, 0.0), ~g.unan), ("UN2 half size unless all three agree", g.R.where(g.unan, g.R / 2), ~g.unan), ("UN3 skip when 3-day and 5-day disagree", g.R.where(g.a35, 0.0), ~g.a35)):
    gap = g.R[~ch].mean() - g.R[ch].mean(); gp = {p: g.R[~ch & (g.per==p)].mean() - g.R[ch & (g.per==p)].mean() for p in PS}
    k1 = V.mean() >= g.R.mean() + 0.05; k2 = gap >= 0.3; k3 = sum(v >= 0.3 for v in gp.values()) >= 2 and all(v >= -0.3 for v in gp.values()); k4 = ch.sum() >= 10 and (~ch).mean() >= 0.6
    print(f"{name}: avg/signal day {V.mean():+.3f} (A2 {g.R.mean():+.3f}) net {V.sum():+.2f} dd {dd(V):.2f} | changes {int(ch.sum())} days ({100*(~ch).mean():.0f}% left alone) | gap others-changed {gap:+.2f} | by period " + " ".join(f"{p} {v:+.2f}" for p, v in gp.items()) +
          f" | K1 {'PASS' if k1 else 'FAIL'} K2 {'PASS' if k2 else 'FAIL'} K3 {'PASS' if k3 else 'FAIL'} K4 {'PASS' if k4 else 'FAIL'}")
