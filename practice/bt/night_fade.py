"""Idea NF: night fade. Market order at 00:00 London AGAINST yesterday's move, stop 30 pips, close 07:00 London, $125 risk; costs = (spread pips, slippage pips).
NF1 = against the 1-day direction; NF2 = against the NY afternoon (22:00 close vs 17:00 price); NF3 = only when both point the same way.
usage: python bt/night_fade.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END = sys.argv[1]; RISK, SL = 125.0, 30
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
cl = m5.groupby("day")["close"].last(); ds = list(cl.index)
p17 = m5[(m5.time.dt.hour == 17) & (m5.time.dt.minute == 0)].groupby("day")["open"].first()
def direction(k, d):          # the side of the FADE trade
    i = ds.index(d)
    if i < 2: return None
    d1 = 1 if cl.iloc[i-1] > cl.iloc[i-2] else -1; y = ds[i-1]
    if y not in p17.index: return None
    ny = 1 if cl.iloc[i-1] > p17[y] else -1
    if k == "NF1": return -d1
    if k == "NF2": return -ny
    return -d1 if d1 == ny else None
G = {d: g for d, g in m5.groupby("day")}
def run(k, costs=(1.0, 0.1)):
    acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP)
    for d in ds:
        if pd.Timestamp(d).weekday() >= 5: continue
        side = direction(k, d)
        if side is None: continue
        x = G[d]; x = x[(x.time.dt.date == d) & (x.time.dt.hour <= 7)]
        if x.empty or not ((x.time.dt.hour == 0) & (x.time.dt.minute == 0)).any(): continue
        for _, bar in x.iterrows():
            h, mnt = bar.time.hour, bar.time.minute
            if h == 0 and mnt == 0: acct.market(side, round(RISK / (SL * 10), 2), sl=bar.open - side * SL * PIP, tag=str(d))
            if acct.positions and h >= 7: acct.close()
            acct.on_bar(bar)
            if h >= 7: break
        assert not acct.positions, d
    t = pd.DataFrame(acct.trades); t["R"] = t.pnl / RISK; return t
if "--check" in sys.argv:
    d0 = sys.argv[sys.argv.index("--check") + 1]; d = pd.Timestamp(d0).date(); i = ds.index(d)
    print(d0, "last 22:00 close", round(cl.iloc[i-1], 5), "| previous", round(cl.iloc[i-2], 5), "| 17:00 price", round(p17[ds[i-1]], 5), "| fade sides NF1/NF2/NF3:", direction("NF1", d), direction("NF2", d), direction("NF3", d))
    x = m5[(m5.time.dt.date == d) & (m5.time.dt.hour <= 7)]; print(f"   00:00 open (bid) {x.iloc[0].open:.5f} | night high {x[x.time.dt.hour<7].high.max():.5f} low {x[x.time.dt.hour<7].low.min():.5f} | 07:00 open {x[x.time.dt.hour==7].iloc[0].open:.5f}")
    for c in ((1.0, 0.1), (2.5, 0.1)):
        r = run("NF1", c); r = r[r.tag == d0].iloc[0]; print(f"   NF1 at spread {c[0]}: side {r.side} entry {r.entry:.5f} sl {r.sl:.5f} exit {r.exit:.5f} @{r.exit_time.strftime('%H:%M')} {r.reason} R {r.R:+.2f}")
    sys.exit()
with contextlib.redirect_stdout(io.StringIO()): A = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = A.groupby("tag").R.sum(); per = lambda d: "Jan" if d < "2015-02-01" else ("Feb" if d < "2015-03-01" else "Mar-now"); PS = ("Jan", "Feb", "Mar-now")
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
for k in ("NF1", "NF2", "NF3"):
    t = run(k); r = t.set_index("tag").R; rs = run(k, (2.5, 0.1)).set_index("tag").R; P = pd.Series(r.index.map(per), index=r.index); top3 = r.nlargest(3).sum(); m = pd.concat([r, A], axis=1, keys=["n", "a"]).dropna()
    corr = np.corrcoef(m.n, m.a)[0, 1]; onloss = m.n[m.a < 0].sum(); pp = {p: r[P == p].sum() for p in PS}; w10 = r.rolling(10).sum().min(); se = r.std(ddof=1) / np.sqrt(len(r))
    print(f"{k}: n={len(r)} win={100*(r>0).mean():.0f}% avg={r.mean():+.3f} (+-{2*se:.2f}) net={r.sum():+.2f} stops={int((t.reason=='sl').sum())} dd={dd(r):.2f} worst10={w10:+.2f} | " + " ".join(f"{p} {v:+.2f} ({int((P==p).sum())})" for p, v in pp.items()) +
          f" | without best 3: {r.sum()-top3:+.2f} | at 2.5 pip spread: avg {rs.mean():+.3f} net {rs.sum():+.2f} | corr with A2 {corr:+.2f}, net on A2's losing mornings {onloss:+.2f} ({int((m.a<0).sum())})")
    k1 = r.mean() >= 0.15; k2 = rs.mean() >= 0.05; k3 = all(v > 0 for v in pp.values()); k4 = r.sum() - top3 > 0; k5 = dd(r) <= 5 and w10 >= -4; k6 = corr <= 0.30 and onloss >= 0
    print(f"     KILL LINES: K1 avg >= +0.15: {'PASS' if k1 else 'FAIL'} | K2 stressed avg >= +0.05: {'PASS' if k2 else 'FAIL'} | K3 all periods positive: {'PASS' if k3 else 'FAIL'} | K4 positive without best 3: {'PASS' if k4 else 'FAIL'} | K5 dd, worst10: {'PASS' if k5 else 'FAIL'} | K6 independence: {'PASS' if k6 else 'FAIL'}")
