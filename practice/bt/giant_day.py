"""Idea GA: A2 with no trade when yesterday's London-day range / the average of the five days before it >= 1.5 (GA1) / 1.3 (GA2) / 2.0 (GA3). Costs on.
usage: python bt/giant_day.py END DROP1,DROP2|none [--check DATE,DATE]"""
import sys, os, runpy
import pandas as pd, numpy as np
END, DROP = sys.argv[1], ([] if sys.argv[2] == "none" else sys.argv[2].split(",")); here = os.path.dirname(os.path.abspath(__file__)); argv0 = sys.argv[:]
sys.argv = ["wl_table.py", END]; g = runpy.run_path(os.path.join(here, "wl_table.py"), run_name="lib"); sys.argv = argv0
F, m5, t, cl = g["F"], g["m5"], g["t"], g["cl"]
rng = {}
for d in cl.index:
    y = m5[(m5.time >= d - pd.Timedelta(hours=2)) & (m5.time < d + pd.Timedelta(hours=22))]; rng[d] = (y.high.max() - y.low.min()) * 1e4
rng = pd.Series(rng); rows = {}; parts = {}
for ds in F.index:
    d = pd.Timestamp(ds, tz="UTC"); p = rng[rng.index < d]
    if len(p) >= 6: rows[ds] = p.iloc[-1] / p.iloc[-6:-1].mean(); parts[ds] = (p.iloc[-1], list(p.iloc[-6:-1].round(1)))
ratio = pd.Series(rows)
if "--check" in sys.argv:
    for d in sys.argv[sys.argv.index("--check") + 1].split(","): print(f"{d}: yesterday {parts[d][0]:.1f} pips; five days before {parts[d][1]} mean {np.mean(parts[d][1]):.2f} -> ratio {ratio[d]:.2f} | A2 {F.R[d]:+.2f}R")
    sys.exit()
a = F.R.reindex(ratio.index).drop(DROP, errors="ignore"); ra = ratio.reindex(a.index); stop = (t.reason == "sl").reindex(a.index); late = a.index >= "2015-03-02"
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
print(f"days {len(a)} (dropped {' '.join(DROP)}) | A2 net {a.sum():+.2f} avg {a.mean():+.3f} dd {dd(a):.2f} | before 03-02 {a[~late].sum():+.2f} | from 03-02 {a[late].sum():+.2f}")
res = {}
for k, th in (("GA1", 1.5), ("GA2", 1.3), ("GA3", 2.0)):
    sk = ra >= th; s = a[sk]; v = a.where(~sk, 0.0); res[k] = (s, v, sk)
    print(f"{k} (no trade at ratio >= {th}): skipped {int(sk.sum())}: wins {int((s>0).sum())}, avg {s.mean():+.3f}, net {s.sum():+.2f}, full stops {int(stop[sk].sum())} | lived among them {int((sk&late).sum())} (avg {a[sk&late].mean():+.3f}) | rule net {v.sum():+.2f} ({v.sum()-a.sum():+.2f} vs A2) dd {dd(v):.2f} | lived days: rule {v[late].sum():+.2f} vs A2 {a[late].sum():+.2f}")
    print("     skipped: " + " ".join(f"{d[5:]}:{ra[d]:.2f}:{a[d]:+.2f}" for d in s.index))
s1, v1, sk1 = res["GA1"]
K = [s1.mean() <= -0.50, v1.sum() >= a.sum() and dd(v1) <= dd(a) + 1e-9, res["GA2"][0].mean() < 0 and res["GA3"][0].mean() < 0, len(s1) >= 10, a[sk1 & late].mean() < 0 and v1[late].sum() >= a[late].sum()]
print("KILL LINES for GA1: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)))
