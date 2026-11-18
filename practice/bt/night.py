"""Idea NT: night continuation. Market order at 00:00 London in the 'prevailing direction', stop 30 pips, close at 07:00 London, $125 risk, costs on (backtest.Account, M5).
Direction: NT1 = 3-day signal, NT2 = 1-day (last 22:00 close vs the previous one), NT3 = NY afternoon (last 22:00 close vs the 17:00 London price that day).
usage: python bt/night.py END [--check DATE,DATE]   (nothing at or after END is loaded)"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END = sys.argv[1]; RISK, SL = 125.0, 30
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
cl = m5.groupby("day")["close"].last(); ds = list(cl.index); tr3 = ideas.trend_map(m5, 3)
p17 = m5[(m5.time.dt.hour == 17) & (m5.time.dt.minute == 0)].groupby("day")["open"].first()
def direction(k, d):
    i = ds.index(d)
    if i < 2: return None
    if k == "NT1": return tr3.get(d)
    if k == "NT2": return 1 if cl.iloc[i-1] > cl.iloc[i-2] else -1
    y = ds[i-1]
    if y not in p17.index: return None
    return 1 if cl.iloc[i-1] > p17[y] else -1
def run(k):
    acct = Account(); G = {d: g for d, g in m5.groupby("day")}
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
    for d0 in sys.argv[sys.argv.index("--check") + 1].split(","):
        d = pd.Timestamp(d0).date(); i = ds.index(d); print("=====", d0, "| last 22:00 close", round(cl.iloc[i-1], 5), "| previous", round(cl.iloc[i-2], 5), "| 3 back", round(cl.iloc[i-4], 5), "| 17:00 price", round(p17[ds[i-1]], 5),
              "| directions NT1/NT2/NT3:", direction("NT1", d), direction("NT2", d), direction("NT3", d))
        x = m5[(m5.time.dt.date == d) & (m5.time.dt.hour <= 7)]; b0 = x.iloc[0]; b7 = x[x.time.dt.hour == 7].iloc[0]
        print(f"   00:00 open (bid) {b0.open:.5f} | night high {x[x.time.dt.hour<7].high.max():.5f} low {x[x.time.dt.hour<7].low.min():.5f} | 07:00 open (bid) {b7.open:.5f}")
        for k in ("NT1", "NT2", "NT3"):
            t = run(k); r = t[t.tag == d0].iloc[0]; print(f"   {k}: side {r.side} lots {r.lots} entry {r.entry:.5f} @{r.entry_time.strftime('%H:%M')} sl {r.sl:.5f} exit {r.exit:.5f} @{r.exit_time.strftime('%H:%M')} {r.reason} R {r.R:+.2f}")
    sys.exit()
with contextlib.redirect_stdout(io.StringIO()): A = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = A.groupby("tag").R.sum(); per = lambda d: "Jan" if d < "2015-02-01" else ("Feb" if d < "2015-03-01" else "Mar-now"); PS = ("Jan", "Feb", "Mar-now")
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
print(f"A2 to {END}: n={len(A)} avg={A.mean():+.3f} net={A.sum():+.2f}")
for k in ("NT1", "NT2", "NT3"):
    t = run(k); r = t.set_index("tag").R; P = pd.Series(r.index.map(per), index=r.index); top3 = r.nlargest(3).sum(); m = pd.concat([r, A], axis=1, keys=["n", "a"]).dropna()
    corr = np.corrcoef(m.n, m.a)[0, 1]; onloss = m.n[m.a < 0].sum(); pp = {p: r[P == p].sum() for p in PS}; w10 = r.rolling(10).sum().min()
    print(f"{k}: n={len(r)} win={100*(r>0).mean():.0f}% avg={r.mean():+.3f} net={r.sum():+.2f} stops={int((t.reason=='sl').sum())} dd={dd(r):.2f} worst10={w10:+.2f} | " + " ".join(f"{p} {v:+.2f} ({int((P==p).sum())})" for p, v in pp.items()) +
          f" | without best 3: {r.sum()-top3:+.2f} | corr with A2 {corr:+.2f}, net on A2's losing mornings {onloss:+.2f} ({int((m.a<0).sum())})")
    k1 = r.mean() >= 0.15; k2 = all(v > 0 for v in pp.values()); k3 = r.sum() - top3 > 0; k4 = dd(r) <= 5 and w10 >= -4; k5 = corr <= 0.30 and onloss >= 0
    print(f"     KILL LINES: K1 avg >= +0.15: {'PASS' if k1 else 'FAIL'} | K2 all periods positive: {'PASS' if k2 else 'FAIL'} | K3 positive without best 3: {'PASS' if k3 else 'FAIL'} | K4 dd <= 5R, worst10 >= -4R: {'PASS' if k4 else 'FAIL'} | K5 independence: {'PASS' if k5 else 'FAIL'}")
