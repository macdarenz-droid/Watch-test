"""Idea BK (journal/2015-idea-BK-breakout-after-big-day.md; rule and kill lines pushed first). London time.
Box = 00:00-08:00 high/low; first M5 close outside it in 08:00-12:00 -> market at the next bar's open, stop 40, out 20:00.
BK1 after a big day (yesterday's London-day range > median of the last 10 incl. it) | BK0 after other days | BK2 range > 1.3 x median.
usage: python bt/breakout_big.py END count | check DATE | test"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 40; H = pd.Timedelta(hours=1); M = pd.Timedelta(minutes=5); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
rg = {}
for d in sorted(set(m5.time.dt.normalize())):
    x = m5[(m5.time >= d - 2 * H) & (m5.time < d + 22 * H)]
    if len(x) >= 200 and d.weekday() < 5: rg[d] = (x.high.max() - x.low.min()) / PIP
rg = pd.Series(rg); prev = rg.shift(1); med = rg.shift(1).rolling(10).median(); rows = []
for d in rg.index:
    if not np.isfinite(med[d]): continue
    n = m5[(m5.time >= d) & (m5.time < d + 8 * H)]; w = m5[(m5.time >= d + 8 * H) & (m5.time < d + 12 * H)]
    if len(n) < 60 or len(w) < 40: continue
    hi, lo = n.high.max(), n.low.min(); out = w[(w.close > hi) | (w.close < lo)]
    r = dict(day=d.strftime("%Y-%m-%d"), prev=prev[d], med=med[d], hi=hi, lo=lo, brk=len(out) > 0)
    if len(out): b = out.iloc[0]; r.update(side=1 if b.close > hi else -1, t_in=b.time + M)
    rows.append(r)
F = pd.DataFrame(rows); F["big"] = F.prev > F.med; F["big13"] = F.prev > 1.3 * F.med; F["late"] = F.day >= MID
V = {"BK1 after a big day": F.big & F.brk, "BK0 after other days": ~F.big & F.brk, "BK2 big x1.3": F.big13 & F.brk}
if MODE == "count":
    print(f"days with a flag: {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]}) | big {int(F.big.sum())} | big x1.3 {int(F.big13.sum())} | a close outside the box 08-12 on {int(F.brk.sum())} days")
    for k, v in V.items(): print(f"{k}: trades {int(v.sum())} | before {MID}: {int((v & ~F.late).sum())} | from {MID}: {int((v & F.late).sum())}")
    sys.exit()
def trade(r, costs=None):
    x = m5[(m5.time >= r.t_in) & (m5.time <= pd.Timestamp(r.day, tz="UTC") + 20 * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account(); s = int(r.side)
    for i, (_, bar) in enumerate(x.iterrows()):
        if i == 0: acct.market(s, round(RISK / (SL * 10), 3), sl=bar.open - s * SL * PIP, tag="x")
        if acct.positions and bar.time >= pd.Timestamp(r.day, tz="UTC") + 20 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1])
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
if MODE == "check":
    r = F[F.day == sys.argv[3]].iloc[0]; print(r.to_string())
    if len(sys.argv) > 4 and r.brk: print("trade:", trade(r))
    sys.exit()
T = F[F.brk].copy(); T["R"] = [trade(r)[0] for r in T.itertuples()]; T["why"] = [trade(r)[1] for r in T.itertuples()]; T["Rs"] = [trade(r, (2.0, 0.5))[0] for r in T.itertuples()]
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
avg = {}
for k, v in V.items():
    J = T[v[T.index]].reset_index(drop=True); a, b = J[~J.late], J[J.late]; avg[k[:3]] = J.R.mean()
    print(f"{k}: trades {len(J)} | avg {J.R.mean():+.3f}R | net {J.R.sum():+.2f} | wins {(J.R > 0).mean():.0%} | full stops {(J.why == 'sl').mean():.0%} | before {MID}: {len(a)} net {a.R.sum():+.2f} | from {MID}: {len(b)} net {b.R.sum():+.2f} | without best 2 {J.R.sum() - J.R.nlargest(2).sum():+.2f} | stressed avg {J.Rs.mean():+.3f} | max DD {dd(J.R):.2f}R")
    if k.startswith("BK1"): K = [J.R.mean() >= 0.10, a.R.sum() > 0 and b.R.sum() > 0, J.R.sum() - J.R.nlargest(2).sum() > 0, None, J.Rs.mean() > 0, dd(J.R) <= 6.0]
K[3] = avg["BK1"] - avg["BK0"] >= 0.15; K.append(avg["BK2"] >= avg["BK1"])
print("KILL LINES BK1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
