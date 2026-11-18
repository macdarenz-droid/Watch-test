"""Idea MF (journal/2015-idea-MF-mid-morning-fade.md): move = open(10:00) - open(08:00) London. MF1 |move| >= 25 -> 10:00 market against it, stop 30, out 12:00.
MF2 |move| >= 40. MF0 = follow on MF1's days. Judged on days before 2015-06-05 only. usage: python bt/mid_morning_fade.py END count | check DATE [x] | test"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 30; H = pd.Timedelta(hours=1); MID, DROP = "2015-04-07", "2015-06-05"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open; rows = []
for d in sorted(set(m5.time.dt.normalize())):
    if d.weekday() > 4 or any(d + k * H not in op.index for k in (8, 10, 12)): continue
    mv = (op[d + 10 * H] - op[d + 8 * H]) / PIP; ds = d.strftime("%Y-%m-%d")
    if mv != 0: rows.append(dict(day=ds, o8=op[d + 8 * H], o10=op[d + 10 * H], move=mv, late=ds >= MID, dropped=ds >= DROP, back=np.sign(op[d + 12 * H] - op[d + 10 * H]) != np.sign(mv)))
F = pd.DataFrame(rows)
if MODE == "count":
    print(f"days {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]}) | judged (before {DROP}) {int((~F.dropped).sum())} | dropped window {int(F.dropped.sum())}")
    for n, thr in (("MF1 >= 25", 25), ("MF2 >= 40", 40)): m = F.move.abs() >= thr; print(f"{n}: judged {int((m & ~F.dropped).sum())} (before {MID}: {int((m & ~F.late).sum())}; {MID}..06-04: {int((m & F.late & ~F.dropped).sum())}) | dropped window {int((m & F.dropped).sum())}")
    L = F[F.day >= "2015-07-13"]; print(f"my 14 note days 07-13..07-30: {len(L)} days; 10-12 went against 08-10 on {int(L.back.sum())}; with |move| >= 25: {int((L.move.abs() >= 25).sum())} days, against on {int((L.back & (L.move.abs() >= 25)).sum())}"); sys.exit()
def trade(day, side, costs=None):
    d = pd.Timestamp(day, tz="UTC"); x = m5[(m5.time >= d + 10 * H) & (m5.time <= d + 12 * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= d + 12 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
if MODE == "check":
    r = F[F.day == sys.argv[3]].iloc[0]; print(r.to_string())
    if len(sys.argv) > 4: print("fade:", trade(r.day, -int(np.sign(r.move))), "| follow:", trade(r.day, int(np.sign(r.move))))
    sys.exit()
def dd(q): eq = q.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
avg = {}
for name, thr, sg in (("MF1 fade, move >= 25", 25, -1), ("MF2 fade, move >= 40", 40, -1), ("MF0 follow on MF1's days", 25, 1)):
    A = F[F.move.abs() >= thr].reset_index(drop=True); A["R"] = [trade(r.day, sg * int(np.sign(r.move)))[0] for r in A.itertuples()]; A["why"] = [trade(r.day, sg * int(np.sign(r.move)))[1] for r in A.itertuples()]; A["Rs"] = [trade(r.day, sg * int(np.sign(r.move)), (2.0, 0.5))[0] for r in A.itertuples()]
    J = A[~A.dropped].reset_index(drop=True); X = A[A.dropped]; R = J.R; a, b = R[~J.late], R[J.late]; avg[name[:3]] = R.mean()
    print(f"{name}: JUDGED trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | full stops {int((J.why == 'sl').sum())} | before {MID}: {len(a)} net {a.sum():+.2f} | {MID}..06-04: {len(b)} net {b.sum():+.2f} | without best 2 {R.sum() - R.nlargest(2).sum():+.2f} | stressed avg {J.Rs.mean():+.3f} | max DD {dd(R):.2f}R || DROPPED WINDOW (NOT JUDGED): {len(X)} trades avg {X.R.mean():+.3f} net {X.R.sum():+.2f}")
    if name.startswith("MF1"): K = [R.mean() >= 0.10, a.sum() > 0 and b.sum() > 0, R.sum() - R.nlargest(2).sum() > 0, None, J.Rs.mean() > 0, dd(R) <= 6.0, None]
K[3] = avg["MF1"] > avg["MF0"]; K[6] = avg["MF2"] >= avg["MF1"]; print("KILL LINES MF1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
