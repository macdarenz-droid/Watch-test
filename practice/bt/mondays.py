"""Idea MO: A2 without Mondays (MO1) / Mondays only when the weekend move (Friday 22:00 close -> Monday 08:00 open) is with the signal (MO2).
Decision set = history to END without the 24 days of the look table (bt/wl_table.py). usage: python bt/mondays.py END [--check DATE,DATE]"""
import sys, io, contextlib, os, runpy
import pandas as pd, numpy as np
END = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__)); argv0 = sys.argv[:]; PIP = 1e-4
sys.argv = ["wl_table.py", END]; g = runpy.run_path(os.path.join(here, "wl_table.py"), run_name="lib"); sys.argv = argv0
F, cl, at = g["F"].copy(), g["cl"], g["at"]
TABLE = list(F[F.R < 0].tail(12).index) + list(F[F.R > 0].tail(12).index)
def wk(ds):
    d = pd.Timestamp(ds, tz="UTC"); c = cl[cl.index < d]; s = 1 if F.side[ds] == "B" else -1; return (at(d, 8) - c.iloc[-1]) * s / PIP, c.index[-1].strftime("%a %m-%d"), c.iloc[-1], at(d, 8)
F["mon"] = F.wd == "Mon"; F["wkend"] = [wk(d)[0] if m else np.nan for d, m in zip(F.index, F.mon)]
if "--check" in sys.argv:
    for d in sys.argv[sys.argv.index("--check") + 1].split(","):
        w, cd, c, o = wk(d); print(f"{d} {F.wd[d]} side {F.side[d]} R {F.R[d]:+.2f} | last close before: {cd} {c:.5f} | open 08:00 {o:.5f} | weekend move in my direction {w:+.1f} pips -> MO2 {'keep' if w > 0 else 'remove'}")
    sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
def report(X, label):
    a = X.R; M = X[X.mon]; O = X[~X.mon]; late = X.index >= "2015-03-02"; h = lambda Y, l: Y.R[(Y.index >= "2015-03-02") == l]
    print(f"\n=== {label}: A2 {len(a)} trades avg {a.mean():+.3f} net {a.sum():+.2f} dd {dd(a):.2f} ===")
    print(f"Mondays: n={len(M)} wins {int((M.R>0).sum())} avg {M.R.mean():+.3f} net {M.R.sum():+.2f} | Tue-Fri: n={len(O)} avg {O.R.mean():+.3f} | before 03-02: Mon {h(M,False).mean():+.3f} ({len(h(M,False))}) vs Tue-Fri {h(O,False).mean():+.3f} | from 03-02: Mon {h(M,True).mean():+.3f} ({len(h(M,True))}) vs {h(O,True).mean():+.3f}")
    print("   by weekday: " + " | ".join(f"{w} {X.R[X.wd==w].mean():+.2f} ({int((X.wd==w).sum())})" for w in ("Mon", "Tue", "Wed", "Thu", "Fri")))
    k1 = M.R.mean() <= 0 and O.R.mean() - M.R.mean() >= 0.30; k2 = h(M, False).mean() < h(O, False).mean() and h(M, True).mean() < h(O, True).mean(); k4 = len(M) >= 12
    r1 = O.R; k3 = r1.sum() >= a.sum() and dd(r1) <= dd(a) + 1e-9
    print(f"MO1 Tue-Fri only: net {r1.sum():+.2f} (A2 {a.sum():+.2f}) dd {dd(r1):.2f} (A2 {dd(a):.2f}) | K1 {'PASS' if k1 else 'FAIL'} | K2 {'PASS' if k2 else 'FAIL'} | K3 {'PASS' if k3 else 'FAIL'} | K4 {'PASS' if k4 else 'FAIL'}")
    keep = M[M.wkend > 0]; rem = M[M.wkend <= 0]; r2 = X.R[~X.mon | (X.wkend > 0)]; k3b = r2.sum() >= a.sum() and dd(r2) <= dd(a) + 1e-9; kx = len(keep) > 0 and len(rem) > 0 and keep.R.mean() - rem.R.mean() >= 0.30
    print(f"MO2 Mondays only with the weekend move: kept Mondays n={len(keep)} avg {keep.R.mean():+.3f} | removed Mondays n={len(rem)} avg {rem.R.mean():+.3f} | net {r2.sum():+.2f} dd {dd(r2):.2f} | K1 {'PASS' if k1 else 'FAIL'} | K2 {'PASS' if k2 else 'FAIL'} | K3 {'PASS' if k3b else 'FAIL'} | K4 {'PASS' if k4 else 'FAIL'} | extra (kept - removed >= 0.30) {'PASS' if kx else 'FAIL'}")
report(F.drop(TABLE), f"DECISION SET (to {END}, 24 table days dropped)"); report(F, "reported only: all days")
