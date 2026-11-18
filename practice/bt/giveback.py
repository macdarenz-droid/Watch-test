"""Idea GB: managing a trade once it is +80 pips. GB1 = TW3 (trail 40 from +80), GB2 = target +80, GB3 = break-even from +80. Costs on.
Stage 1 BUILD = A2 days before FWD0 without the dropped day; forward days from FWD0 are printed beside and not judged.
usage: python bt/giveback.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; FWD0 = "2015-05-22"; DROP = ["2015-05-19"]; V = (("GB1", "TW3"), ("GB2", "GB2"), ("GB3", "GB3"))
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
def daily(n):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
    return t.groupby("tag").R.sum(), t
a, ta = daily("A2")
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; print(f"{d}: A2 {a[d]:+.2f}R | " + " | ".join(f"{k} {daily(n)[0][d]:+.2f}R" for k, n in V)); sys.exit()
build = (a.index < FWD0) & ~a.index.isin(DROP); fwd = a.index >= FWD0
print(f"BUILD: {int(build.sum())} A2 days before {FWD0} without {DROP[0]}: A2 net {a[build].sum():+.2f} | FORWARD: {int(fwd.sum())} days from {FWD0}: A2 net {a[fwd].sum():+.2f}")
for k, n in V:
    v = daily(n)[0].reindex(a.index); df = v - a; b = df[build]; ch = b[b.abs() > 0.02]; up, dn = ch[ch > 0], ch[ch < 0]; f = df[fwd]; fch = f[f.abs() > 0.02]
    print(f"{k}: BUILD net {b.sum():+.2f} vs A2 | changed days {len(ch)}: better {len(up)} ({up.sum():+.2f}R), worse {len(dn)} ({dn.sum():+.2f}R), worst single day {(dn.min() if len(dn) else 0):+.2f}R")
    print("     build changed days A2 > variant: " + " ".join(f"{d[5:]}:{a[d]:+.2f}>{v[d]:+.2f}" for d in ch.index))
    print(f"     dropped day {DROP[0][5:]}: {a[DROP[0]]:+.2f}>{v[DROP[0]]:+.2f} | FORWARD (not judged): {f.sum():+.2f} vs A2 on {len(fch)} changed days: " + " ".join(f"{d[5:]}:{a[d]:+.2f}>{v[d]:+.2f}" for d in fch.index))
    K = [b.sum() >= 1.0, (dn.min() if len(dn) else 0) >= -1.0, len(up) >= len(dn), len(ch) >= 8]
    print("     BUILD KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)))
