"""Idea BE (journal/2015-07-02-replay-last-20-exits-and-idea-BE.md; kill lines written first): A2 with the stop moved to the entry once the trade has
been +X pips (BE1 25, BE2 30, BE3 = X1 20). Judged on the A2 days BEFORE the replayed twenty (before 2015-06-05); the twenty shown separately.
usage: python bt/break_even.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; CUT = "2015-06-05"; NAMES = {"BE1 +25": "BE1", "BE2 +30": "BE2", "BE3 +20 (X1)": "X1"}
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
def raw(n):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
    return t
a = raw("A2").groupby("tag").R.sum()
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; print(f"{d}: A2 {a[d]:+.2f}R | " + " | ".join(f"{k}: {(lambda r: f'{r.reason} {r.exit_time.strftime(chr(37)+chr(72)+chr(58)+chr(37)+chr(77))} {r.R:+.2f}R')(raw(v)[lambda t: t.tag == d].iloc[0])}" for k, v in NAMES.items())); sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
J = a.index < CUT; early = a.index < "2015-03-02"; best = a >= 1.60
print(f"A2: all {len(a)} days {a.sum():+.2f}R | JUDGED (before {CUT}): {int(J.sum())} days {a[J].sum():+.2f}R, dd {dd(a[J]):.2f} | replayed twenty: {int((~J).sum())} days {a[~J].sum():+.2f}R | best days in the judged set: {int((best & J).sum())}")
for k, v in NAMES.items():
    r = raw(v).groupby("tag").R.sum().reindex(a.index); df = r - a; f = df[J]; ch = f[f.abs() > 0.02]; up, dn = ch[ch > 0], ch[ch < 0]
    print(f"{k}: JUDGED net {r[J].sum():+.2f} ({f.sum():+.2f} vs A2) | before 03-02 {df[J & early].sum():+.2f} | 03-02..06-04 {df[J & ~early].sum():+.2f} | changed days {len(ch)}: better {len(up)} ({up.sum():+.2f}R), worse {len(dn)} ({dn.sum():+.2f}R) | without its best day {f.sum() - (up.max() if len(up) else 0):+.2f} | dd {dd(r[J]):.2f} | on the best days {df[J & best].sum():+.2f} || the replayed twenty (not judged): {df[~J].sum():+.2f}R")
    K = [f.sum() >= 1.0, df[J & early].sum() > 0 and df[J & ~early].sum() > 0, len(up) >= len(dn) and f.sum() - (up.max() if len(up) else 0) > 0, dd(r[J]) <= dd(a[J]) + 1e-9, df[J & best].sum() >= -1.0]
    print("     KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)))
