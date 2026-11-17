"""Idea MG (journal/2015-idea-MG-round-number-magnet.md): at 08:00 London the nearer 00 level at distance d in [5, W] pips; market toward it (target the level)
or away (control, target the same distance beyond), stop 30, out 12:00. R after costs 1.0 + 0.1; stressed 2.0 + 0.5. usage: python bt/magnet.py END count | check DATE [x] | test W1 W2"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 30; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
a2 = ta.set_index("tag").side; rows = []
for d in sorted(set(m5.time.dt.normalize())):
    if d.weekday() > 4 or d + 8 * H not in op.index or d + 12 * H not in op.index: continue
    o = op[d + 8 * H]; up = np.ceil(o * 100) / 100; dn = np.floor(o * 100) / 100; du, dd_ = (up - o) / PIP, (o - dn) / PIP
    lv, dist, side = (up, du, 1) if du <= dd_ else (dn, dd_, -1); ds = d.strftime("%Y-%m-%d")
    rows.append(dict(day=ds, o8=o, level=round(lv, 4), dist=dist, side=side, a2=int(a2[ds]) if ds in a2.index else 0, late=ds >= MID))
F = pd.DataFrame(rows)
def pick(W): return F[(F.dist >= 5) & (F.dist <= W)].reset_index(drop=True)
if MODE == "count":
    print(f"days {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]})")
    for W in (15, 20, 30, 40): X = pick(W); k = (X.a2 != 0).sum(); print(f"W = {W}: {len(X)} trades | before {MID}: {int((~X.late).sum())} | from: {int(X.late.sum())} | toward-the-level side = A2's side on {int((X.side == X.a2).sum())} of {k} ({(X.side == X.a2).sum() / max(k, 1):.0%})")
    sys.exit()
def trade(r, side, tp, costs=None):
    d = pd.Timestamp(r.day, tz="UTC"); x = m5[(m5.time >= d + 8 * H) & (m5.time <= d + 12 * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tp=tp(bar["open"]), tag="x")
        if acct.positions and bar["time"] >= d + 12 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
toward = lambda r: (r.side, lambda e: r.level); away = lambda r: (-r.side, lambda e: e - r.side * r.dist * PIP)
if MODE == "check":
    r = F[F.day == sys.argv[3]].iloc[0]; print(r.to_string())
    if len(sys.argv) > 4: s, tp = toward(r); s0, tp0 = away(r); print("toward:", trade(r, s, tp), "| away:", trade(r, s0, tp0))
    sys.exit()
W1, W2 = float(sys.argv[3]), float(sys.argv[4]); keep = {}; rng = np.random.default_rng(41)
for name, W, how in ((f"MG1 toward the 00 level, d 5-{W1:g}", W1, toward), (f"MG2 toward, d 5-{W2:g}", W2, toward), (f"MG0 away, d 5-{W1:g} (control)", W1, away)):
    X = pick(W); res = []; rs = []
    for r in X.itertuples(): s, tp = how(r); res.append(trade(r, s, tp)); rs.append(trade(r, s, tp, (2.0, 0.5))[0])
    R = pd.Series([z[0] for z in res]); Wh = [z[1] for z in res]; Rs = pd.Series(rs); lt = X.late.values; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | targets {Wh.count('tp')} stops {Wh.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed avg {Rs.mean():+.3f}")
    if name.startswith("MG1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, Rs.mean() > 0, None]
diff = (keep["MG1"] - keep["MG0"]).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.10
print(f"(R after costs 1.0 + 0.1; stressed 2.0 + 0.5) MG1 minus MG0 {diff.mean():+.3f}R, sign-flip p {p:.4f}"); print("KILL LINES MG1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
