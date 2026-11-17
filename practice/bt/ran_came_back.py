"""Idea RC (journal/2015-idea-RC-ran-and-came-back-clock.md; lines written first). Part 1: share of A2 trades whose best open result reaches +1R (40 pips)
and what 12:00 leaves of them. Part 2: fixed exit at 11:00 / 11:30 / 12:30 against 12:00 (loop of bt/exit_clock.py). usage: python bt/ran_came_back.py END [--check DATE]"""
import sys, io, contextlib, os, runpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END = sys.argv[1]; RISK, SL = 125.0, 40; here = os.path.dirname(os.path.abspath(__file__))
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = ta.groupby("tag").agg(R=("R", "sum"), side=("side", "first")); a = A.R
argv = sys.argv; sys.argv = ["mfe_mae.py", END]
with contextlib.redirect_stdout(io.StringIO()): L = runpy.run_path(os.path.join(here, "mfe_mae.py"))["L"].set_index("date")
sys.argv = argv
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
P0 = run(12, 0); print(f"check: the 12:00 version of this loop against engine A2, largest difference per day: {(P0.R.reindex(a.index) - a).abs().max():.3f}R on {len(a)} days")
V = {"RC1 11:00": run(11, 0), "RC2 11:30": run(11, 30), "RC3 12:30": run(12, 30)}
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; print(f"{d}: A2 {a[d]:+.2f}R, best open {L.mfe[d]:+.1f} pips at {L.mfe_time[d]}")
    for k, v in V.items(): r = v.loc[d]; print(f"   {k}: exit {r.exit:.5f} @{r.exit_time.strftime('%H:%M')} {r.reason} {r.R:+.2f}R")
    sys.exit()
# Part 1
reach = (L.mfe >= 40).reindex(a.index)
def split(m, name):
    x = a[m]; print(f"{name}: {len(x)} trades ({len(x)/len(a):.0%}), at 12:00 total {x.sum():+.2f}R, avg {x.mean():+.2f}R | end at +1R or more: {int((x >= 1).sum())} ({(x >= 1).mean():.0%}) | between 0 and +1R: {int(((x > 0) & (x < 1)).sum())} ({((x > 0) & (x < 1)).mean():.0%}) | at or below 0: {int((x <= 0).sum())} ({(x <= 0).mean():.0%})")
print(f"\nPART 1 - {len(a)} A2 trades to {END}, net {a.sum():+.2f}R")
split(reach, "REACH +1R (best open >= 40 pips)"); split(~reach, "NEVER reach +1R")
g = (L.mfe - L.result_pips).reindex(a.index)[reach]; back = a[reach & (a <= 0)]
print(f"   give-back of the reachers (best minus result, pips): median {g.median():.0f}, 75th pct {g.quantile(.75):.0f}, max {g.max():.0f} | reached and ended at or below 0: " + " ".join(f"{d[5:]}:{v:+.2f}" for d, v in back.items()))
print(f"   when the best came (reachers): before 10:00 {int((L.mfe_time[reach] < '10:00').sum())} | 10:00-10:59 {int(((L.mfe_time[reach] >= '10:00') & (L.mfe_time[reach] < '11:00')).sum())} | 11:00 or later {int((L.mfe_time[reach] >= '11:00').sum())}")
# Part 2
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
late = a.index >= "2015-03-02"; best = a >= 1.60
print(f"\nPART 2 - A2: net {a.sum():+.2f}R, dd {dd(a):.2f} | before 03-02 {a[~late].sum():+.2f} | from 03-02 {a[late].sum():+.2f} | best days {int(best.sum())} ({a[best].sum():+.2f}R) | reachers {int(reach.sum())} ({a[reach].sum():+.2f}R)")
for k, v in V.items():
    r = v.R.reindex(a.index); df = r - a; up, dn = df[df > 0.02], df[df < -0.02]
    print(f"{k}: net {r.sum():+.2f} ({df.sum():+.2f} vs A2) | before 03-02 {df[~late].sum():+.2f} | from 03-02 {df[late].sum():+.2f} | better {len(up)} ({up.sum():+.2f}R) worse {len(dn)} ({dn.sum():+.2f}R) | without its best day {df.sum()-df.max():+.2f} | dd {dd(r):.2f} | on the best days {df[best].sum():+.2f} | on the reachers {df[reach].sum():+.2f} | on the non-reachers {df[~reach].sum():+.2f}")
    K = [df.sum() >= 1.0, df[~late].sum() > 0 and df[late].sum() > 0, len(up) >= len(dn) and df.sum() - df.max() > 0, dd(r) <= dd(a) + 1e-9, df[best].sum() >= -1.0, df[reach].sum() > 0]
    print("     KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)))
