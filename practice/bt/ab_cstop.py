"""Idea CS (stop on a candle close) vs A2 per day, all history with an explicit end date; inspiring days removed from every number and shown separately; kill lines K1-K4.
usage: python bt/ab_cstop.py CS1,CS2,CS3 END DROP1,DROP2,..."""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
ks, b, DROP = sys.argv[1].split(","), sys.argv[2], sys.argv[3].split(",")
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]
def raw(n):
    with contextlib.redirect_stdout(io.StringIO()): return ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
TA = raw("A2"); Afull = TA.groupby("tag").R.sum(); stops = sorted(TA[TA.reason == "sl"].tag); clean = [d for d in stops if d not in DROP]
A = Afull.drop(DROP)
print(f"A2 to {b}: {len(Afull)} days, {len(stops)} stop-outs, {len(clean)} clean | without the inspiring days: net {A.sum():+.2f} dd {dd(A):.2f} worst day {A.min():+.2f}")
for k in ks:
    T = raw(k); Vfull = T.groupby("tag").R.sum().reindex(Afull.index); assert Vfull.notna().all(); V = Vfull.drop(DROP)
    df = V - A; other = df[[d for d in df.index if d not in clean]]; assert other.abs().max() < 0.02, other[other.abs() >= 0.02]      # must be identical off the stop days
    g = df[clean]; imp = g[g > 0.02]; total = g.sum(); share = (imp.max() / imp.sum()) if len(imp) and imp.sum() > 0 else float("nan")
    rs = T.set_index("tag").reason
    print(f"{k}: net {V.sum():+.2f} ({total:+.2f} vs A2) dd {dd(V):.2f} worst day {Vfull.min():+.2f} | clean stop days A2 -> {k}: " + " ".join(f"{d[5:]}:{A[d]:+.2f}>{V[d]:+.2f}({rs[d]})" for d in clean))
    print(f"     inspiring days (NOT counted): " + " ".join(f"{d[5:]}:{Afull[d]:+.2f}>{Vfull[d]:+.2f}" for d in DROP))
    k1 = total >= 1.0; k2 = len(imp) >= 3 and share <= 0.60; k3 = Vfull.min() >= -1.50; k4 = dd(V) <= dd(A) + 1e-9
    print(f"     KILL LINES: K1 clean-day gain {total:+.2f} >= +1.00: {'PASS' if k1 else 'FAIL'} | K2 improved {len(imp)} of {len(clean)} (>=3), biggest share {share:.0%} (<=60%): {'PASS' if k2 else 'FAIL'} | K3 worst day {Vfull.min():+.2f} >= -1.50: {'PASS' if k3 else 'FAIL'} | K4 maxDD {dd(V):.2f} <= {dd(A):.2f}: {'PASS' if k4 else 'FAIL'}")
