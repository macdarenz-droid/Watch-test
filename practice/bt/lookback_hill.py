"""Idea LB: A2 with the signal's lookback 2 / 4 / 5 days instead of 3, on the days both have a trade. usage: python bt/lookback_hill.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
def raw(look):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run(f"LB{look}", m5, ret=True, entry_h=8, exit_h=12, sl=40, look=look)
    return t.groupby("tag").agg(R=("R", "sum"), side=("side", "first"))
A = raw(3); V = {k: raw(k) for k in (2, 4, 5)}
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; print(d, "sides: " + " | ".join(f"look {k}: {'BUY' if x.side[d] > 0 else 'SELL'} {x.R[d]:+.2f}R" for k, x in [(3, A)] + list(V.items()))); sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
def w10(r): return r.rolling(10).sum().min()
with contextlib.redirect_stdout(io.StringIO()): eng = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
print(f"check: lookback 3 through this script against engine A2: largest difference per day {(A.R - eng.groupby('tag').R.sum()).abs().max():.3f}R, days {len(A)}")
for k, X in V.items():
    c = A.index.intersection(X.index); a, v = A.R[c], X.R[c]; late = c >= "2015-03-02"; df = v - a; diff_dir = (A.side[c] != X.side[c]); top3 = df.nlargest(3).sum()
    print(f"LB{k}: common days {len(c)} | A2 net {a.sum():+.2f} (before 03-02 {a[~late].sum():+.2f}, from 03-02 {a[late].sum():+.2f}) dd {dd(a):.2f} worst10 {w10(a):+.2f}")
    print(f"     variant net {v.sum():+.2f} = {100*v.sum()/a.sum():.0f}% of A2 ({df.sum():+.2f}) | before 03-02 {v[~late].sum():+.2f} ({df[~late].sum():+.2f}) | from 03-02 {v[late].sum():+.2f} ({df[late].sum():+.2f}) | win {100*(v>0).mean():.0f}% (A2 {100*(a>0).mean():.0f}%) | dd {dd(v):.2f} worst10 {w10(v):+.2f} | opposite direction on {int(diff_dir.sum())} days: variant {v[diff_dir].sum():+.2f}R, A2 {a[diff_dir].sum():+.2f}R | diff without best 3 days {df.sum()-top3:+.2f}")
    K = [df.sum() >= 2.0, df[~late].sum() >= 0 and df[late].sum() >= 0, dd(v) <= dd(a) + 0.5 and w10(v) >= w10(a) - 0.5, df.sum() - top3 > 0]
    share = v.sum() / a.sum(); pos = v[~late].sum() > 0 and v[late].sum() > 0
    print("     CHALLENGER LINES: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)) + f" || share {100*share:.0f}%, positive in both halves: {pos}")
