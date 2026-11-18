"""Idea XT: A2 with a later closing time (XT1 12:30, XT2 13:00, XT3 13:25 London). Same signal, 08:00 entry, 40 pip stop. Own loop on the engine's Account
(the 12:00 version must reproduce engine A2). usage: python bt/exit_clock.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END = sys.argv[1]; RISK, SL = 125.0, 40
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = ta.groupby("tag").agg(R=("R", "sum"), side=("side", "first"))
def run(eh, em):
    acct = Account()
    for d in A.index:
        dd_ = pd.Timestamp(d, tz="UTC"); cut = dd_ + pd.Timedelta(hours=eh, minutes=em); x = m5[(m5.time >= dd_ + pd.Timedelta(hours=8)) & (m5.time <= cut)]
        for _, bar in x.iterrows():
            if bar.time == dd_ + pd.Timedelta(hours=8): acct.market(int(A.side[d]), round(RISK / (SL * 10), 3), sl=bar.open - A.side[d] * SL * PIP, tag=d)
            if acct.positions and bar.time >= cut: acct.close()
            acct.on_bar(bar)
        assert not acct.positions, d
    t = pd.DataFrame(acct.trades); t["R"] = t.pnl / RISK; return t.set_index("tag")
P0 = run(12, 0); a = A.R; print(f"check: the 12:00 version of this code against engine A2, largest difference per day: {(P0.R.reindex(a.index) - a).abs().max():.3f}R on {len(a)} days")
V = {"XT1 12:30": run(12, 30), "XT2 13:00": run(13, 0), "XT3 13:25": run(13, 25)}
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; r0 = P0.loc[d]; print(f"{d}: A2 exit {r0.exit:.5f} @{r0.exit_time.strftime('%H:%M')} {r0.reason} {r0.R:+.2f}R")
    for k, v in V.items(): r = v.loc[d]; print(f"   {k}: exit {r.exit:.5f} @{r.exit_time.strftime('%H:%M')} {r.reason} {r.R:+.2f}R")
    dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + pd.Timedelta(hours=12, minutes=20)) & (m5.time <= dd_ + pd.Timedelta(hours=13, minutes=30))]; print(x[["time", "open", "high", "low"]].assign(time=x.time.dt.strftime("%H:%M")).round(5).to_string(index=False)); sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
def w10(r): return r.rolling(10).sum().min()
late = a.index >= "2015-03-02"; open12 = (P0.reason.reindex(a.index) != "sl"); inprof = open12 & (a > 0); under = open12 & (a <= 0)
print(f"A2: {len(a)} days net {a.sum():+.2f} dd {dd(a):.2f} worst10 {w10(a):+.2f} | before 03-02 {a[~late].sum():+.2f} | from 03-02 {a[late].sum():+.2f} | still open at 12:00: {int(open12.sum())} (in profit {int(inprof.sum())}, under water {int(under.sum())})")
for k, v in V.items():
    r = v.R.reindex(a.index); df = r - a; top3 = df.nlargest(3).sum(); newstops = ((v.reason.reindex(a.index) == "sl") & open12).sum()
    print(f"{k}: net {r.sum():+.2f} = {100*r.sum()/a.sum():.0f}% of A2 ({df.sum():+.2f}) | before 03-02 {df[~late].sum():+.2f} | from 03-02 {df[late].sum():+.2f} | dd {dd(r):.2f} worst10 {w10(r):+.2f} | diff without best 3 days {df.sum()-top3:+.2f} | days better {int((df>0.02).sum())} worse {int((df<-0.02).sum())} | full stops after 12:00: {int(newstops)}")
    print(f"     in profit at noon ({int(inprof.sum())}): change per trade {df[inprof].mean():+.3f}R, total {df[inprof].sum():+.2f}, better on {int((df[inprof]>0.02).sum())} worse on {int((df[inprof]<-0.02).sum())} | under water at noon ({int(under.sum())}): change per trade {df[under].mean():+.3f}R, total {df[under].sum():+.2f}")
    K = [df.sum() >= 2.0, df[~late].sum() >= 0 and df[late].sum() >= 0, dd(r) <= dd(a) + 0.5 and w10(r) >= w10(a) - 0.5, df.sum() - top3 > 0, df[inprof].mean() > 0]
    print("     KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)))
