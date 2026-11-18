"""Variant vs A2 per SIGNAL DAY on all history with an explicit end date, split by period. A day the variant skips counts 0R for it.
usage: python bt/ab_period.py FL1,FL2,FL3 END [DROP_DATE,...]   (dropped days are removed from every number)"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
ks, b = sys.argv[1].split(","), sys.argv[2]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]
def get(n):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
    return t.groupby("tag").agg(R=("R", "sum"), side=("side", "first"))
DROP = sys.argv[3].split(",") if len(sys.argv) > 3 else []
A = get("A2"); A = A.drop([x for x in DROP if x in A.index]); per = lambda d: "Jan" if d < "2015-02-01" else ("Feb" if d < "2015-03-01" else "Mar-now")
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
print(f"A2 all history to {b}: days={len(A)} avg={A.R.mean():+.3f} net={A.R.sum():+.2f} dd={dd(A.R):.2f} | by period: " + " ".join(f"{p}: {len(x)}d {x.R.mean():+.2f}" for p, x in A.groupby(A.index.map(per), sort=False)))
for k in ks:
    V = get(k); V = V.drop([x for x in DROP if x in V.index]); J = A.join(V, rsuffix="_v", how="left"); J["Rv"] = J.R_v.fillna(0.0)
    ch = J[J.R_v.isna() | (J.side_v != J.side)]; un = J.drop(ch.index)
    print(f"{k}: avg per signal day {J.Rv.mean():+.3f} (A2 {J.R.mean():+.3f}) net={J.Rv.sum():+.2f} dd={dd(J.Rv):.2f} | changed days {len(ch)} ({100*len(un)/len(J):.0f}% left alone): A2 on changed {ch.R.mean():+.2f} vs on the others {un.R.mean():+.2f} (gap {un.R.mean()-ch.R.mean():+.2f}); variant on changed days {ch.Rv.mean():+.2f}")
    for p in ("Jan", "Feb", "Mar-now"):
        c = ch[ch.index.map(per) == p]; u = un[un.index.map(per) == p]
        print(f"     {p}: changed {len(c)}d A2 {c.R.mean() if len(c) else float('nan'):+.2f} | others {len(u)}d A2 {u.R.mean():+.2f} | gap {u.R.mean() - (c.R.mean() if len(c) else float('nan')):+.2f}")
    print("     changed days:", " ".join(f"{d[5:]}{r.R:+.2f}" for d, r in ch.iterrows()))
