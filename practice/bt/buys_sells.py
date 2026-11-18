"""Idea BS2 (journal/2015-idea-BS2-buys-against-sells.md): A2 engine trades by side, outside the funded span 03-27..07-07.
usage: python bt/buys_sells.py END count | test"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END, MODE = sys.argv[1], sys.argv[2]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
t = t.assign(stop=t.reason == "sl"); P = t[t.tag < "2015-03-27"]; Q = t[t.tag > "2015-07-07"]; F = t[(t.tag >= "2015-03-27") & (t.tag <= "2015-07-07")]; U = pd.concat([P, Q])
if MODE == "count":
    for n, x in (("P before funding", P), ("Q paper days", Q), ("P+Q", U), ("funded span (engine list, for reference)", F)): print(f"{n}: {len(x)} trades ({x.tag.iloc[0]}..{x.tag.iloc[-1]}) | buys {int((x.side > 0).sum())} | sells {int((x.side < 0).sum())}")
    print("first trade:", t.tag.iloc[0], "side", int(t.side.iloc[0])); sys.exit()
rng = np.random.default_rng(13)
def cmp(x, name):
    b, s = x[x.side > 0], x[x.side < 0]
    if len(b) < 2 or len(s) < 2: print(f"{name}: buys {len(b)} sells {len(s)}: too few"); return
    d = s.R.mean() - b.R.mean(); ds = b.stop.mean() - s.stop.mean(); lab = (x.side < 0).values; r = x.R.values; st = x.stop.values; c = cs = 0
    for _ in range(10000):
        l = rng.permutation(lab); c += (r[l].mean() - r[~l].mean()) >= d; cs += (st[~l].mean() - st[l].mean()) >= ds
    print(f"{name}: buys {len(b)} avg {b.R.mean():+.3f} stops {b.stop.mean():.0%} | sells {len(s)} avg {s.R.mean():+.3f} stops {s.stop.mean():.0%} | sells - buys {d:+.3f}R (p {c / 10000:.4f}) | stop rate buys - sells {ds:+.0%} (p {cs / 10000:.4f})")
cmp(U, "P+Q (JUDGED)"); cmp(P[P.tag < "2015-03-01"], "  Jan-Feb"); cmp(P[P.tag >= "2015-03-01"], "  March to 03-26"); cmp(Q, "  Q paper days 07-08.."); cmp(F, "funded span, engine list (where the lean was seen; reference only)")
