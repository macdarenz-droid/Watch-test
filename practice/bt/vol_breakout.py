"""Idea VB (journal/2015-idea-VB-volatility-breakout.md; rule and kill lines pushed first). London time, M5.
Anchor = last night's 22:00 close; Yr = yesterday's London-day range. Levels anchor +- k*Yr. Touched before 08:00 -> no trade.
First M5 candle 08:00-15:55 touching a level -> market at the next candle's open on that side, stop 40, out 20:00. $125 = 1R.
VB1 k=0.5 (judged) | VB2 k=0.7 | VB0 = VB1 faded. usage: python bt/vol_breakout.py END count | check DATE | test"""
import sys, os, io, contextlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 40; H = pd.Timedelta(hours=1); M = pd.Timedelta(minutes=5); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A2 = t.groupby("tag")["side"].first().to_dict()
g = m5.groupby("day"); hi, lo, cl, n = g.high.max(), g.low.min(), g.close.last(), g.size(); ds = list(cl.index)
def signal(i, k):
    d, p = ds[i], ds[i - 1]; D = pd.Timestamp(d, tz="UTC")
    if D.weekday() > 4 or n[p] < 200: return None
    x = m5[m5.day == d]; night = x[x.time < D + 8 * H]; win = x[(x.time >= D + 8 * H) & (x.time < D + 16 * H)]
    if len(win) < 80 or len(night) < 60: return None
    yr = (hi[p] - lo[p]) / PIP; up, dn = cl[p] + k * yr * PIP, cl[p] - k * yr * PIP
    r = dict(day=str(d), anchor=cl[p], yr=round(yr, 1), up=round(up, 5), dn=round(dn, 5), night=bool((night.high >= up).any() or (night.low <= dn).any()), side=0, t_in=None, both=False)
    if not r["night"]:
        tch = win[(win.high >= up) | (win.low <= dn)]
        if len(tch):
            b = tch.iloc[0]; r["touch"] = str(b.time)[11:16]
            if b.high >= up and b.low <= dn: r["both"] = True
            else: r.update(side=1 if b.high >= up else -1, t_in=b.time + M)
    return r
def table(k):
    F = pd.DataFrame([s for s in (signal(i, k) for i in range(1, len(ds))) if s]); F["late"] = F.day >= MID; F["a2"] = F.day.map(A2); return F
def trade(r, flip=False, costs=None):
    D = pd.Timestamp(r.day, tz="UTC"); x = m5[(m5.time >= r.t_in) & (m5.time <= D + 20 * H)]; s = -int(r.side) if flip else int(r.side)
    if len(x) == 0: return None
    acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(s, round(RISK / (SL * 10), 3), sl=bar["open"] - s * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= D + 20 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    tr = acct.trades[-1]; return tr["pnl"] / RISK, tr["reason"], tr["entry"], tr["exit"], str(tr["exit_time"])[11:16]
F1, F2 = table(0.5), table(0.7)
if MODE == "count":
    for nm, F in (("VB1 k=0.5", F1), ("VB2 k=0.7", F2)):
        T = F[F.side != 0]; same = (T.side == T.a2).sum(); has = T.a2.notna().sum()
        print(f"{nm}: days {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]}) | touched in the night {int(F.night.sum())} | both levels in one candle {int(F.both.sum())} | no touch 08-16 {int(((F.side == 0) & ~F.night & ~F.both).sum())} | TRADES {len(T)} (buys {int((T.side > 0).sum())}, sells {int((T.side < 0).sum())}) | before {MID}: {int((~T.late).sum())} | from: {int(T.late.sum())} | on A2's side {same} of {has} = {100 * same / max(has, 1):.0f}%")
    print("(counts only, no outcomes) script reached its end"); sys.exit()
if MODE == "check":
    for nm, F in (("VB1", F1), ("VB2", F2)):
        r = F[F.day == sys.argv[3]].iloc[0]; print(nm, {k: r[k] for k in ("day", "anchor", "yr", "up", "dn", "night", "both", "side", "a2")}, "touch", r.get("touch"), "entry bar", str(r.t_in)[11:16] if r.side else None)
        if len(sys.argv) > 4 and r.side: print("   trade:", trade(r))
    sys.exit()
rng = np.random.default_rng(58)
def stats(nm, F, flip=False):
    T = F[F.side != 0]; res = [(r, trade(r, flip), trade(r, flip, (2.0, 0.5))) for r in T.itertuples()]; res = [z for z in res if z[1]]
    R = np.array([z[1][0] for z in res]); Rs = np.array([z[2][0] for z in res]); late = np.array([z[0].late for z in res]); sl = sum(z[1][1] == "sl" for z in res)
    dd = (np.maximum.accumulate(np.cumsum(R)) - np.cumsum(R)).max(); dd = max(dd, -np.cumsum(R).min()); wo2 = np.sort(R)[:-2].sum()
    p = (np.abs((rng.choice([-1, 1], (10000, len(R))) * R).mean(1)) >= abs(R.mean())).mean()
    print(f"{nm}: trades {len(R)} | avg {R.mean():+.3f}R | net {R.sum():+.2f} | wins {int((R > 0).sum())} | full stops {sl} | before {MID}: {R[~late].sum():+.2f} in {int((~late).sum())} | from: {R[late].sum():+.2f} in {int(late.sum())} | without best 2 {wo2:+.2f} | stressed avg {Rs.mean():+.3f} | max DD {dd:.2f}R | p {p:.4f}")
    return R, Rs, late, dd, wo2, p
R, Rs, late, dd, wo2, p = stats("VB1 k=0.5 (judged)", F1); stats("VB2 k=0.7 (dose)", F2); stats("VB0 = VB1 faded (control)", F1, True)
K = [R.mean() >= 0.10, R[~late].sum() > 0 and R[late].sum() > 0, wo2 > 0, Rs.mean() > 0, dd <= 6, R.mean() > 0 and p < 0.10]
print("VB1 kill lines: " + " ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)) + (" -> ALL PASS" if all(K) else " -> KILLED"))
print("(all R after costs 1.0 + 0.1; stressed 2.0 + 0.5; 1R = $125 = 40 pips) script reached its end")
