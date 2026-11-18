"""Idea ET: A2 entered earlier (ET1 07:00, ET2 07:30, ET3 07:45 London), same signal, 40 pip stop from the bid at the entry, exit 12:00. Reuses part() of bt/split_entry.py.
usage: python bt/earlier_entry.py END [--check DATE]"""
import sys, io, contextlib, os, runpy
import pandas as pd, numpy as np
END = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__)); argv0 = sys.argv[:]; PIP = 1e-4
sys.argv = ["split_entry.py", END]; buf = io.StringIO()
with contextlib.redirect_stdout(buf): g = runpy.run_path(os.path.join(here, "split_entry.py"))
sys.argv = argv0; print(buf.getvalue().splitlines()[0])
part, A, m5, dd, w10 = g["part"], g["A"], g["m5"], g["dd"], g["w10"]; a = A.R
P = {"ET1 07:00": part(7, 0), "ET2 07:30": part(7, 30), "ET3 07:45": part(7, 45)}
pre = {}
for d in A.index:
    dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + pd.Timedelta(hours=7)) & (m5.time < dd_ + pd.Timedelta(hours=8))]; pre[d] = (x.high.max() - x.low.min()) / PIP
pre = pd.Series(pre); lively = pre >= 30
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; print(f"{d}: A2 side {int(A.side[d])} R {a[d]:+.2f} | pre-entry hour range {pre[d]:.1f} pips")
    for k, v in P.items(): r = v.loc[d]; print(f"   {k}: entry {r.entry:.5f} sl {r.sl:.5f} exit {r.exit:.5f} @{r.exit_time.strftime('%H:%M')} {r.reason} R {r.R:+.2f}")
    sys.exit()
late = a.index >= "2015-03-02"
print(f"A2: {len(a)} days net {a.sum():+.2f} dd {dd(a):.2f} worst10 {w10(a):+.2f} | before 03-02 {a[~late].sum():+.2f} | from 03-02 {a[late].sum():+.2f} | lively days {int(lively.sum())} ({a[lively].sum():+.2f}R) quiet {int((~lively).sum())} ({a[~lively].sum():+.2f}R)")
for k, v in P.items():
    r = v.R.reindex(a.index); assert r.notna().all(); df = r - a; top3 = df.nlargest(3).sum()
    gl, gq = df[lively].sum(), df[~lively].sum()
    print(f"{k}: net {r.sum():+.2f} ({r.sum()-a.sum():+.2f} vs A2) win {100*(r>0).mean():.0f}% stops {int((v.reason=='sl').sum())} dd {dd(r):.2f} worst10 {w10(r):+.2f} | before 03-02 {r[~late].sum():+.2f} ({df[~late].sum():+.2f}) | from 03-02 {r[late].sum():+.2f} ({df[late].sum():+.2f}) | diff without best 3 days {df.sum()-top3:+.2f} | gain on lively days {gl:+.2f}, on quiet days {gq:+.2f} | days better {int((df>0.02).sum())} worse {int((df<-0.02).sum())}")
    K = [df.sum() >= 2.0, df[~late].sum() >= 0 and df[late].sum() >= 0, dd(r) <= dd(a) + 0.5 and w10(r) >= w10(a) - 0.5, df.sum() - top3 > 0, gl > 0 and gl > gq]
    print("     KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)))
