"""Forward re-test of idea CS (stop on a candle close; definitions CS1 CS2 CS3 frozen in bt/ideas.py since 04-17) against A2 on days from FWD0. Costs on.
usage: python bt/cs_forward.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; FWD0 = "2015-04-20"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
def raw(n, costs=None):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run(n, m5, ret=True, costs=costs, **ideas.VARIANTS[n])
    return t
def daily(t): return t.groupby("tag").R.sum()
TA = raw("A2"); a = daily(TA); SA_ = daily(raw("A2", (2.0, 0.5)))
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]
    for n in ("A2", "CS1", "CS2", "CS3"):
        r = raw(n); r = r[r.tag == d].iloc[0]; print(f"{d} {n}: entry {r.entry:.5f} exit {r.exit:.5f} @{r.exit_time.strftime('%H:%M')} {r.reason} {r.R:+.2f}R")
    sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
stops = TA.groupby("tag").reason.agg(lambda x: (x == "sl").any()); fw = a.index >= FWD0
print(f"A2: all {len(a)} days net {a.sum():+.2f}, full stops {int(stops.sum())} | FORWARD from {FWD0}: {int(fw.sum())} days net {a[fw].sum():+.2f} dd {dd(a[fw]):.2f} worst day {a[fw].min():+.2f} full stops {int(stops[fw].sum())} | stressed forward {SA_[fw].sum():+.2f}")
for n in ("CS1", "CS2", "CS3"):
    v = daily(raw(n)).reindex(a.index); s = daily(raw(n, (2.0, 0.5))).reindex(a.index); df = (v - a); f = df[fw]; ch = f[f.abs() > 0.02]; up, dn = ch[ch > 0], ch[ch < 0]
    print(f"{n}: FORWARD net {v[fw].sum():+.2f} ({f.sum():+.2f} vs A2) | changed days {len(ch)}: better {len(up)} ({up.sum():+.2f}R), worse {len(dn)} ({dn.sum():+.2f}R) | without its best day {f.sum()-(up.max() if len(up) else 0):+.2f} | dd {dd(v[fw]):.2f} | worst day {v[fw].min():+.2f} | stressed vs A2 stressed {s[fw].sum()-SA_[fw].sum():+.2f} || all days since January: {df.sum():+.2f} vs A2 (before {FWD0}: {df[~fw].sum():+.2f})")
    print("     changed forward days A2 > variant: " + " ".join(f"{d[5:]}:{a[d]:+.2f}>{v[d]:+.2f}" for d in ch.index))
    K = [f.sum() >= 1.0, len(up) >= len(dn) and f.sum() - (up.max() if len(up) else 0) > 0, dd(v[fw]) <= dd(a[fw]) + 1e-9 and v[fw].min() >= -1.55, s[fw].sum() - SA_[fw].sum() >= 0, len(ch) >= 10]
    print("     KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)))
