"""MB1 on lived days only (from 03-02), costs on and stressed, against A2 on the same days. Uses bt/morning_box.py unchanged (its T and TS tables).
usage: python bt/mb1_lived.py END [--check DATE]"""
import sys, io, contextlib, os, runpy
import pandas as pd, numpy as np
END = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__)); argv0 = sys.argv[:]; LIVE0, FWD0 = "2015-03-02", "2015-05-13"
sys.argv = ["morning_box.py", END]
with contextlib.redirect_stdout(io.StringIO()): g = runpy.run_path(os.path.join(here, "morning_box.py"))
sys.argv = argv0; T, TS, A = g["T"], g["TS"], g["A"]
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; r = T.loc[d]; print(f"{d}: morning {r.morn:+.1f} pips | break {'UP' if r.side>0 else 'DOWN'} {r.R:+.2f}R (stressed {TS.R[d]:+.2f}R) | MB1 {'keep' if r.MB1 else 'remove'} | A2 that morning {A[d]:+.2f}R"); sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max() if len(r) else 0.0
def block(lo, hi, label):
    t = T[(T.index >= lo) & (T.index < hi)]; ts = TS.reindex(t.index); a = A[(A.index >= lo) & (A.index < hi)]
    k, r, ks = t.R[t.MB1], t.R[~t.MB1], ts.R[t.MB1]
    print(f"{label}: A2 days {len(a)}, A2 avg {a.mean():+.3f}R net {a.sum():+.2f} | box trades {len(t)} | KEPT n={len(k)} win {100*(k>0).mean():.0f}% avg {k.mean():+.3f} net {k.sum():+.2f} dd {dd(k):.2f} | stressed avg {ks.mean():+.3f} net {ks.sum():+.2f} | REMOVED n={len(r)} avg {r.mean():+.3f} net {r.sum():+.2f} | kept - removed {k.mean()-r.mean():+.3f} | all box trades (no filter) avg {t.R.mean():+.3f} net {t.R.sum():+.2f}")
    return k, r, ks, a
k, r, ks, a = block(LIVE0, END, f"LIVED DAYS {LIVE0}..{END}")
block(LIVE0, FWD0, "  (a) lived, inside MB1's build 03-02..05-12"); block(FWD0, END, "  (b) true forward 05-13 on (reported, not judged)")
L = [k.mean() >= 0.15 and ks.mean() >= 0.05, k.mean() - r.mean() >= 0.20, k.mean() >= a.mean(), dd(k) <= 5]
print("KILL LINES: " + " | ".join(f"L{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(L)))
