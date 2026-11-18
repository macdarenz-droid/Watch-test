"""Idea RF: in a 'crooked' week (5-day efficiency < 0.5) fade the edge of the previous five days' range at 08:00 London. SL 40, $125, out 12:00, costs on.
usage: python bt/range_fade.py START END   (explicit end date; nothing at or after END is loaded)"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
a, b = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 40
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]
g = m5.groupby("day"); HI, LO, CL = g.high.max(), g.low.min(), g.close.last(); days = list(HI.index)
def run(Q):
    acct = Account(); lots = round(RISK / (SL * 10), 3)
    for d, x in g:
        i = days.index(d)
        if i < 6: continue
        c = CL.iloc[i-6:i]; eff = abs(c.iloc[-1] - c.iloc[0]) / c.diff().abs().sum()
        hi5, lo5 = HI.iloc[i-5:i].max(), LO.iloc[i-5:i].min(); x = x[x.time.dt.date == d]
        for _, bar in x.iterrows():
            h, mnt = bar.time.hour, bar.time.minute
            if h == 8 and mnt == 0 and eff < 0.5:
                pos = (bar.open - lo5) / (hi5 - lo5)
                side = -1 if pos >= 1 - Q else (1 if pos <= Q else 0)
                if side: acct.market(side, lots, sl=bar.open - side * SL * PIP, tag=str(d))
            if acct.positions and h >= 12: acct.close()
            acct.on_bar(bar)
        if acct.positions: acct.close()
    t = pd.DataFrame(acct.trades)
    if not t.empty: t["R"] = t.pnl / RISK; t = t[t.entry_time >= pd.Timestamp(a, tz="UTC")].reset_index(drop=True)
    return t
with contextlib.redirect_stdout(io.StringIO()): A = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = A[A.entry_time >= pd.Timestamp(a, tz="UTC")]; A["d"] = A.entry_time.dt.date
print(a, "..", b, f"| A2: n={len(A)} avg={A.R.mean():+.2f} net={A.R.sum():+.2f}")
for k, Q in (("RF25", 0.25), ("RF15", 0.15), ("RF33", 0.33)):
    t = run(Q)
    if t.empty: print(f"  {k}: no trades"); continue
    eq = t.R.cumsum(); dd = (eq.cummax().clip(lower=0) - eq).max(); t["mon"] = t.entry_time.dt.strftime("%m"); t["d"] = t.entry_time.dt.date
    bym = " ".join(f"{m}:{len(x)}tr {x.R.sum():+.2f}R" for m, x in t.groupby("mon"))
    m = t.merge(A[["d", "R", "side"]], on="d", suffixes=("", "_a")); corr = np.corrcoef(m.R, m.R_a)[0, 1] if len(m) > 2 else float("nan")
    print(f"  {k}: n={len(t)} win={100*(t.R>0).mean():.0f}% avg={t.R.mean():+.2f} net={t.R.sum():+.2f} dd={dd:.2f} | without best ({t.R.max():+.2f}): {t.R.sum()-t.R.max():+.2f} | by month {bym}")
    print(f"        vs A2 on {len(m)} shared days: same side {int((m.side==m.side_a).sum())}, opposite {int((m.side!=m.side_a).sum())} | corr {corr:+.2f} | on A2's losing days {m[m.R_a<0].R.sum():+.2f}R in {int((m.R_a<0).sum())} | on A2's winning days {m[m.R_a>0].R.sum():+.2f}R in {int((m.R_a>0).sum())}")
