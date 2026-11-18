"""Idea LD: quiet pre-entry hour (07:00-08:00 range < 30 pips) -> A2 at 08:00; lively -> same signal entered later (LD1 08:15, LD2 08:30, LD3 09:00),
40 pip stop from the bid at that time, out 12:00. Control: the same delay on quiet days. Reuses part() of bt/split_entry.py.
usage: python bt/late_lively.py END DROP1,DROP2|none [--check DATE]"""
import sys, io, contextlib, os, runpy
import pandas as pd, numpy as np
END, DROP = sys.argv[1], ([] if sys.argv[2] == "none" else sys.argv[2].split(",")); here = os.path.dirname(os.path.abspath(__file__)); argv0 = sys.argv[:]; PIP = 1e-4
sys.argv = ["split_entry.py", END]; buf = io.StringIO()
with contextlib.redirect_stdout(buf): g = runpy.run_path(os.path.join(here, "split_entry.py"))
sys.argv = argv0; print(buf.getvalue().splitlines()[0])
part, A, m5, dd, w10 = g["part"], g["A"], g["m5"], g["dd"], g["w10"]
P = {"LD1 08:15": part(8, 15), "LD2 08:30": part(8, 30), "LD3 09:00": part(9, 0)}; P0 = part(8, 0)
pre = {}
for d in A.index:
    dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + pd.Timedelta(hours=7)) & (m5.time < dd_ + pd.Timedelta(hours=8))]; pre[d] = (x.high.max() - x.low.min()) / PIP
pre = pd.Series(pre)
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; print(f"{d}: pre-entry hour {pre[d]:.1f} pips | A2 {A.R[d]:+.2f}R")
    for k, v in P.items(): r = v.loc[d]; print(f"   {k}: entry {r.entry:.5f} sl {r.sl:.5f} exit {r.exit:.5f} @{r.exit_time.strftime('%H:%M')} {r.reason} R {r.R:+.2f}")
    sys.exit()
idx = A.index.drop(DROP); a = A.R[idx]; liv = pre[idx] >= 30; late = idx >= "2015-03-02"; s0 = (P0.reason.reindex(idx) == "sl")
print(f"decision set: {len(idx)} days (dropped {' '.join(DROP)}) | A2 net {a.sum():+.2f} (before 03-02 {a[~late].sum():+.2f}, from 03-02 {a[late].sum():+.2f}) dd {dd(a):.2f} worst10 {w10(a):+.2f}")
print(f"lively days {int(liv.sum())} (before 03-02 {int((liv & ~late).sum())}, from 03-02 {int((liv & late).sum())}): A2 avg {a[liv].mean():+.3f}, full stops {int(s0[liv].sum())} | quiet days {int((~liv).sum())}: A2 avg {a[~liv].mean():+.3f}, full stops {int(s0[~liv].sum())}")
for k, v in P.items():
    r = v.R.reindex(idx); st = (v.reason.reindex(idx) == "sl"); assert r.notna().all()
    mix = a.where(~liv, r); df = mix - a; top3 = df.nlargest(3).sum(); gl = (r - a)[liv]; gq = (r - a)[~liv]
    print(f"{k}: net {mix.sum():+.2f} ({df.sum():+.2f} vs A2) | before 03-02 {df[~late].sum():+.2f} | from 03-02 {df[late].sum():+.2f} | dd {dd(mix):.2f} worst10 {w10(mix):+.2f} | diff without best 3 days {df.sum()-top3:+.2f}")
    print(f"     lively days: late entry avg {r[liv].mean():+.3f} vs 08:00 {a[liv].mean():+.3f} (per day {gl.mean():+.3f}, total {gl.sum():+.2f}), full stops {int(st[liv].sum())} vs {int(s0[liv].sum())}, better on {int((gl>0.02).sum())} worse on {int((gl<-0.02).sum())} | CONTROL quiet days: late avg {r[~liv].mean():+.3f} vs 08:00 {a[~liv].mean():+.3f} (per day {gq.mean():+.3f}, total {gq.sum():+.2f})")
    K = [df.sum() >= 2.0, df[~late].sum() >= 0 and df[late].sum() >= 0, dd(mix) <= dd(a) + 0.5 and w10(mix) >= w10(a) - 0.5, df.sum() - top3 > 0, st[liv].sum() < s0[liv].sum() and r[liv].mean() > a[liv].mean() and gq.mean() < gl.mean()]
    print("     KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)) + f" | sample (lively >= 30): {'PASS' if liv.sum() >= 30 else 'FAIL'}")
