"""Idea AF: a separate afternoon trade in the direction of the day's 3-day signal. Market order at 13:30 London, stop 40 pips, close 17:00 London, $125 risk, costs on.
AF2 = every A2 day; AF1 = only after a scratch morning (A2 between -0.3R and +0.3R, not stopped); AF3 = only after a morning win > +0.3R.
usage: python bt/afternoon.py END DROP1,DROP2,... [--check DATE,DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END = sys.argv[1]; DROP = sys.argv[2].split(","); RISK, SL = 125.0, 40
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = ta.groupby("tag").agg(R=("R", "sum"), side=("side", "first"), stop=("reason", lambda x: (x == "sl").any()))
acct = Account()
for d in A.index:
    x = m5[(m5.time.dt.date == pd.Timestamp(d).date()) & (m5.time.dt.hour >= 13) & (m5.time.dt.hour <= 17)]
    for _, bar in x.iterrows():
        h, mnt = bar.time.hour, bar.time.minute
        if h == 13 and mnt == 30: acct.market(int(A.side[d]), round(RISK / (SL * 10), 2), sl=bar.open - A.side[d] * SL * PIP, tag=d)
        if acct.positions and h >= 17: acct.close()
        acct.on_bar(bar)
        if h >= 17: break
    assert not acct.positions, d
t = pd.DataFrame(acct.trades); t["R"] = t.pnl / RISK; F = t.set_index("tag")
if "--check" in sys.argv:
    for d in sys.argv[sys.argv.index("--check") + 1].split(","):
        x = m5[(m5.time.dt.date == pd.Timestamp(d).date())]; b = x[(x.time.dt.hour == 13) & (x.time.dt.minute == 30)].iloc[0]; c = x[(x.time.dt.hour == 17) & (x.time.dt.minute == 0)].iloc[0]
        pm = x[(x.time >= b.time) & (x.time < c.time)]; r = F.loc[d]
        print(f"{d} A2 side {int(A.side[d])} morning R {A.R[d]:+.2f} | 13:30 open (bid) {b.open:.5f} | 13:30-17:00 high {pm.high.max():.5f} low {pm.low.min():.5f} | 17:00 open {c.open:.5f}")
        print(f"   engine: side {r.side} lots {r.lots} entry {r.entry:.5f} @{r.entry_time.strftime('%H:%M')} sl {r.sl:.5f} exit {r.exit:.5f} @{r.exit_time.strftime('%H:%M')} {r.reason} R {r.R:+.2f}")
    sys.exit()
per = lambda d: "Jan" if d < "2015-02-01" else ("Feb" if d < "2015-03-01" else "Mar-now"); PS = ("Jan", "Feb", "Mar-now")
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
scr = (A.R.abs() <= 0.3) & ~A.stop; win = A.R > 0.3
print(f"A2 mornings to {END}: {len(A)} | inspiring days removed from every number: {' '.join(x[5:] for x in DROP)} -> their afternoon results (shown only): " + " ".join(f"{d[5:]}:{F.R[d]:+.2f}" for d in DROP))
keep = ~A.index.isin(DROP); base = None
for name, m in (("AF2 every day", keep), ("AF1 after a scratch morning", keep & scr), ("AF3 after a morning win", keep & win)):
    days = A.index[m]; r = F.R[days]; P = pd.Series(days.map(per), index=days); top3 = r.nlargest(3).sum(); a = A.R[days]
    corr = np.corrcoef(r, a)[0, 1]; onloss = r[a < 0].sum(); pp = {p: r[P == p].sum() for p in PS}; w10 = r.rolling(10).sum().min(); se = r.std(ddof=1) / np.sqrt(len(r))
    print(f"{name}: n={len(r)} win={100*(r>0).mean():.0f}% avg={r.mean():+.3f} (+-{2*se:.2f}) net={r.sum():+.2f} stops={int((F.reason[days]=='sl').sum())} dd={dd(r):.2f} worst10={w10:+.2f} | " +
          " ".join(f"{p} {v:+.2f} ({int((P==p).sum())})" for p, v in pp.items()) + f" | without best 3: {r.sum()-top3:+.2f} | corr with A2 morning {corr:+.2f}, net on A2 losing days {onloss:+.2f} ({int((a<0).sum())})")
    k1 = r.mean() >= 0.15; k2 = all(v > 0 for v in pp.values()); k3 = r.sum() - top3 > 0; k4 = dd(r) <= 5 and w10 >= -4; k5 = corr <= 0.30 and onloss >= 0
    k6 = "" if base is None else f" | K6 avg >= AF2 + 0.10 ({base:+.3f}): {'PASS' if r.mean() >= base + 0.10 else 'FAIL'}"
    if base is None: base = r.mean()
    print(f"     KILL LINES: K1 avg >= +0.15: {'PASS' if k1 else 'FAIL'} | K2 all periods positive: {'PASS' if k2 else 'FAIL'} | K3 positive without best 3: {'PASS' if k3 else 'FAIL'} | K4 dd, worst10: {'PASS' if k4 else 'FAIL'} | K5 independence: {'PASS' if k5 else 'FAIL'}{k6}")
