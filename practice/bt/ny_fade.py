"""Idea N: at the entry hour, if price has moved >= X pips since 08:00 UTC, trade AGAINST that move; SL 40, $125, close at the exit hour. Costs on (backtest.Account, M5).
usage: python bt/ny_fade.py START END [--overlap]   (nothing at or after END is loaded)"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
a, b = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 40
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]
def run(X, eh, xh):
    acct = Account()
    for d, x in m5.groupby("day"):
        x = x[x.time.dt.date == d]; p8 = x[(x.time.dt.hour == 8) & (x.time.dt.minute == 0)]
        if p8.empty: continue
        p8 = p8.open.iloc[0]; done = False
        for _, bar in x.iterrows():
            h, mnt = bar.time.hour, bar.time.minute
            if not done and h == eh and mnt == 0:
                move = (bar.open - p8) / PIP; done = True
                if abs(move) >= X:
                    side = -1 if move > 0 else 1
                    acct.market(side, round(RISK / (SL * 10), 2), sl=bar.open - side * SL * PIP, tag=str(d))
            if acct.positions and h >= xh: acct.close()
            acct.on_bar(bar)
        if acct.positions: acct.close()
    t = pd.DataFrame(acct.trades)
    if t.empty: return t
    t["R"] = t.pnl / RISK; return t[t.entry_time >= pd.Timestamp(a, tz="UTC")].reset_index(drop=True)
def st(t):
    if len(t) == 0: return "n= 0"
    eq = t.R.cumsum(); dd = (eq.cummax().clip(lower=0) - eq).max(); best = t.R.max()
    return f"n={len(t):2d} win={100*(t.R>0).mean():3.0f}% avg={t.R.mean():+.2f} net={t.R.sum():+6.2f} dd={dd:.2f} | net without best ({best:+.2f}) {t.R.sum()-best:+.2f}"
with contextlib.redirect_stdout(io.StringIO()): A = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = A[A.entry_time >= pd.Timestamp(a, tz="UTC")]; A["d"] = A.entry_time.dt.date
print(a, "..", b, "| A2:", st(A).split(" |")[0])
for k, kw in (("N1", dict(X=30, eh=13, xh=17)), ("N2", dict(X=50, eh=13, xh=17)), ("N3", dict(X=30, eh=12, xh=16))):
    t = run(**kw); print(f"  {k} {st(t)}")
    if "--overlap" in sys.argv and len(t):
        t["d"] = t.entry_time.dt.date; m = t.merge(A[["d", "R"]], on="d", suffixes=("", "_a"))
        lose = m[m.R < 0]; both = lose[lose.R_a < 0]
        corr = np.corrcoef(m.R, m.R_a)[0, 1] if len(m) > 2 else float("nan")
        print(f"      overlap: {k} losing days {len(lose)}, of which A2 also lost {len(both)} ({100*len(both)/max(len(lose),1):.0f}%) | corr of daily R with A2 {corr:+.2f} on {len(m)} shared days | on A2's losing days {k} made {m[m.R_a<0].R.sum():+.2f}R in {int((m.R_a<0).sum())} trades; on A2's winning days {m[m.R_a>0].R.sum():+.2f}R in {int((m.R_a>0).sum())}")
