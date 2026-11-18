"""Idea AD (add at +1R) vs A2, per DAY (all parts together, R of the $125), all history with an explicit end date, by period, with the pre-registered kill lines K1-K5.
usage: python bt/ab_add.py AD1,AD2,AD3 END"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
ks, b = sys.argv[1].split(","), sys.argv[2]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]
def raw(n):
    with contextlib.redirect_stdout(io.StringIO()): return ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
def w10(r): return r.rolling(10).sum().min()
per = lambda d: "Jan" if d < "2015-02-01" else ("Feb" if d < "2015-03-01" else "Mar-now")
TA = raw("A2"); A = TA.groupby("tag").R.sum(); P = pd.Series(A.index.map(per), index=A.index); PS = ("Jan", "Feb", "Mar-now")
def line(name, r):
    return (f"{name}: days={len(r)} win={100*(r>0).mean():.0f}% avg={r.mean():+.3f} net={r.sum():+.2f} ({100*r.sum()/A.sum():.0f}%) dd={dd(r):.2f} worst10={w10(r):+.2f} worst day={r.min():+.2f} sd={r.std(ddof=1):.2f}\n     " +
            " | ".join(f"{p}: net {r[P==p].sum():+.2f} ({100*r[P==p].sum()/A[P==p].sum():.0f}%) dd {dd(r[P==p]):.2f} (A2 {dd(A[P==p]):.2f})" for p in PS))
print(line("A2 ", A))
for k in ks:
    T = raw(k); V = T.groupby("tag").R.sum().reindex(A.index); assert V.notna().all()
    n_parts = T.groupby("tag").size(); addd = sorted(n_parts[n_parts > 1].index)                       # days on which the add was opened
    adds = T[T.tag.isin(addd)].sort_values("entry_time").groupby("tag").tail(1)                         # the add = the later entry of the day
    first = TA.set_index("tag").loc[adds.tag]; late = ((adds.entry.values - first.entry.values) * first.side.values / 1e-4) - 40
    wrong = [d for d in addd if A[d] < 0.99]; right = [d for d in addd if A[d] >= 0.99]
    print(line(k, V))
    print(f"     adds opened on {len(addd)} days ({' '.join(f'{p} {sum(per(d)==p for d in addd)}' for p in PS)}) | add filled on average {late.mean():.1f} pips beyond the +40 level (worst {late.max():.1f}) | add stopped out on {int((adds.reason=='sl').sum())} days")
    print(f"     days A2 finished >= +1R ({len(right)}): variant - A2 = {(V[right]-A[right]).sum():+.2f}R | days it did not ({len(wrong)}): variant - A2 = {(V[wrong]-A[wrong]).sum():+.2f}R  [K5 limit -1.50R]")
    print("     not-above-1R days: " + " ".join(f"{d[5:]}:{A[d]:+.2f}>{V[d]:+.2f}" for d in wrong))
    k1 = dd(V) <= dd(A) + 1e-9; k2 = w10(V) >= w10(A) - 1e-9; k3 = V.min() >= -1.10
    k4 = all(V[P==p].sum() >= 1.05 * A[P==p].sum() and dd(V[P==p]) <= dd(A[P==p]) + 1e-9 for p in ("Feb", "Mar-now")); k5 = (V[wrong]-A[wrong]).sum() >= -1.5
    print(f"     KILL LINES: K1 maxDD {dd(V):.2f} <= {dd(A):.2f}: {'PASS' if k1 else 'FAIL'} | K2 worst10 {w10(V):+.2f} >= {w10(A):+.2f}: {'PASS' if k2 else 'FAIL'} | K3 worst day {V.min():+.2f} >= -1.10: {'PASS' if k3 else 'FAIL'} | K4 Feb & Mar-now +5% and DD: {'PASS' if k4 else 'FAIL'} | K5: {'PASS' if k5 else 'FAIL'}")
