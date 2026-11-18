"""Idea SO: A2 with a sit-out day decided by A2's own engine result the day before. SO1 after a full stop; SO2 after two losing days in a row;
SO3 after a full stop that came before 09:00 London. Costs on. usage: python bt/sit_out.py END"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
t = t.set_index("tag"); a = t.R; stop = t.reason == "sl"; early = stop & (t.exit_time.dt.hour < 9); loss = a < 0; late = a.index >= "2015-03-02"
skip = {"SO1": stop.shift(1, fill_value=False), "SO2": (loss.shift(1, fill_value=False) & loss.shift(2, fill_value=False)), "SO3": early.shift(1, fill_value=False)}
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
print(f"A2 to {END}: {len(a)} days net {a.sum():+.2f} avg {a.mean():+.3f} dd {dd(a):.2f} | full stops {int(stop.sum())} ({100*stop.mean():.0f}%), of which before 09:00: {int(early.sum())}")
print(f"after a full stop the next day is a full stop on {int((stop & skip['SO1']).sum())} of {int(skip['SO1'].sum())} days ({100*(stop & skip['SO1']).sum()/skip['SO1'].sum():.0f}%) against a base rate of {100*stop.mean():.0f}%")
res = {}
for k, sk in skip.items():
    s = a[sk]; v = a.where(~sk, 0.0); res[k] = (s, v, sk)
    print(f"{k}: skipped {int(sk.sum())}: wins {int((s>0).sum())}, avg {s.mean():+.3f}, net {s.sum():+.2f} | lived among them {int((sk&late).sum())} (avg {a[sk&late].mean():+.3f}) | rule net {v.sum():+.2f} ({v.sum()-a.sum():+.2f} vs A2) dd {dd(v):.2f} | lived days: rule {v[late].sum():+.2f} vs A2 {a[late].sum():+.2f}")
print("SO1 skipped days: " + " ".join(f"{d[5:]}:{a[d]:+.2f}" for d in a[skip['SO1']].index))
s1, v1, sk1 = res["SO1"]
K = [s1.mean() <= 0, v1.sum() >= a.sum() and dd(v1) <= dd(a) + 1e-9, a[sk1 & late].mean() <= 0, res["SO2"][0].mean() <= 0.10 and res["SO3"][0].mean() <= 0.10, len(s1) >= 15]
print("KILL LINES for SO1: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)))
