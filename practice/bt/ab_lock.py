"""Idea LK (late profit lock) vs A2 per day, all history with an explicit end date, inspiring days dropped; kill lines K1-K4.
usage: python bt/ab_lock.py LK1,LK2,LK3 END DROP1,..."""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
ks, END, DROP = sys.argv[1].split(","), sys.argv[2], sys.argv[3].split(","); LIVE0 = "2015-03-02"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
def raw(n):
    with contextlib.redirect_stdout(io.StringIO()): return ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
def w10(r): return r.rolling(10).sum().min()
Af = raw("A2").groupby("tag").R.sum(); A = Af.drop(DROP); live = A.index >= LIVE0
print(f"A2 to {END} without {' '.join(DROP)}: days={len(A)} net={A.sum():+.2f} (backtest {A[~live].sum():+.2f}, live {A[live].sum():+.2f}) dd={dd(A):.2f} worst10={w10(A):+.2f}")
for k in ks:
    Vf = raw(k).groupby("tag").R.sum().reindex(Af.index); assert Vf.notna().all(); V = Vf.drop(DROP); df = V - A; ch = df[df.abs() > 0.02]
    up, dn = ch[ch > 0], ch[ch < 0]; share = up.max() / df.sum() if df.sum() > 0 and len(up) else float("nan")
    print(f"{k}: net={V.sum():+.2f} ({df.sum():+.2f} vs A2) | backtest {V[~live].sum():+.2f} ({df[~live].sum():+.2f}) live {V[live].sum():+.2f} ({df[live].sum():+.2f}) | dd={dd(V):.2f} worst10={w10(V):+.2f}")
    print(f"     changes {len(ch)} days: better on {len(up)} ({up.sum():+.2f}R), worse on {len(dn)} ({dn.sum():+.2f}R) | biggest gain {up.max() if len(up) else 0:+.2f}, biggest loss {dn.min() if len(dn) else 0:+.2f} | inspiring day(s), not counted: " + " ".join(f"{d[5:]}:{Af[d]:+.2f}>{Vf[d]:+.2f}" for d in DROP))
    print("     changed days A2>variant: " + " ".join(f"{d[5:]}:{A[d]:+.2f}>{V[d]:+.2f}" for d in ch.index))
    k1 = df.sum() >= 1.0; k2 = df[~live].sum() > 0 and df[live].sum() > 0; k3 = len(up) >= len(dn) and (not np.isnan(share)) and share <= 0.5; k4 = dd(V) <= dd(A) + 1e-9 and w10(V) >= w10(A) - 1e-9
    print(f"     KILL LINES: K1 at least +1.0R: {'PASS' if k1 else 'FAIL'} | K2 ahead in both periods: {'PASS' if k2 else 'FAIL'} | K3 improved >= worsened, no day > half the gain: {'PASS' if k3 else 'FAIL'} | K4 dd and worst10 not worse: {'PASS' if k4 else 'FAIL'}")
