"""Trade-management variants vs A2, per DAY (all parts of a position together, R of the $125), all history with an explicit end date, by period.
usage: python bt/ab_manage.py PM1,PM2,PM3 END [--days]"""
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
TA = raw("A2"); A = TA.groupby("tag").R.sum(); P = pd.Series(A.index.map(per), index=A.index)
def line(name, r):
    return (f"{name}: days={len(r)} win={100*(r>0).mean():.0f}% avg={r.mean():+.3f} net={r.sum():+.2f} ({100*r.sum()/A.sum():.0f}% of A2) dd={dd(r):.2f} score={r.sum()/dd(r):.1f} ({r.sum()/dd(r)/(A.sum()/dd(A)):.2f}x) sd={r.std(ddof=1):.2f} worst10={w10(r):+.2f}\n     " +
            " | ".join(f"{p}: net {r[P==p].sum():+.2f} ({100*r[P==p].sum()/A[P==p].sum():.0f}%) dd {dd(r[P==p]):.2f} (A2 {dd(A[P==p]):.2f})" for p in ("Jan", "Feb", "Mar-now")))
print(line("A2 ", A))
T2 = raw("PM2"); T1 = raw("PM1")
reached = sorted(set(T2[T2.reason == "tp"].tag)); back = sorted(set(T1[(T1.reason == "sl") & T1.tag.isin(reached) & (T1.pnl.abs() < 5)].tag))
above = [d for d in reached if A[d] >= 0.99]; mid = [d for d in reached if 0 <= A[d] < 0.99]; neg = [d for d in reached if A[d] < 0]
print(f"days that reached +1R before noon: {len(reached)} of {len(A)} | A2 at noon: above +1R {len(above)}, between 0 and +1R {len(mid)}, below 0 {len(neg)} | runner came back to entry (PM1): {len(back)}")
for p in ("Jan", "Feb", "Mar-now"): print(f"     {p}: reached {sum(per(d)==p for d in reached)} of {int((P==p).sum())} | above {sum(per(d)==p for d in above)} mid {sum(per(d)==p for d in mid)} below0 {sum(per(d)==p for d in neg)} | came back {sum(per(d)==p for d in back)}")
for k in ks:
    V = raw(k).groupby("tag").R.sum().reindex(A.index); assert V.notna().all(); df = V - A; ch = df[df.abs() > 0.02]   # 0.02R tolerance: two half-lots round differently from one position
    print(line(k, V)); print(f"     differs from A2 on {len(ch)} days: better on {(ch>0).sum()} ({ch[ch>0].sum():+.2f}R), worse on {(ch<0).sum()} ({ch[ch<0].sum():+.2f}R)")
    if "--days" in sys.argv: print("     " + " ".join(f"{d[5:]}:{A[d]:+.2f}>{V[d]:+.2f}" for d in ch.index))
