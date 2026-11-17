"""Idea GC (journal/2015-idea-GC-back-to-yesterdays-close.md): night = open(08:00) - yesterday's 22:00 London close. GC1 |night| >= 20 -> 08:00 market back toward
yesterday's close (target it), stop 30, out 12:00. GC2 |night| >= 30. GC0 = with the night, target the same distance beyond. usage: python bt/back_to_close.py END count | check DATE [x] | test"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 30; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open
days = [d for d in sorted(set(m5.time.dt.normalize())) if d.weekday() < 5 and len(m5[(m5.time >= d - 2 * H) & (m5.time < d + 22 * H)]) >= 200]
rows = []
for i in range(1, len(days)):
    d, p = days[i], days[i - 1]
    if d + 8 * H not in op.index or d + 12 * H not in op.index: continue
    yc = m5[(m5.time >= p - 2 * H) & (m5.time < p + 22 * H)].close.iloc[-1]; o8 = op[d + 8 * H]; nm = (o8 - yc) / PIP; ds = d.strftime("%Y-%m-%d")
    if nm != 0: rows.append(dict(day=ds, yclose=yc, o8=o8, night=nm, late=ds >= MID))
F = pd.DataFrame(rows)
if MODE == "count":
    print(f"days {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]}) | median |night| {F.night.abs().median():.1f} pips")
    for n, thr in (("GC1 >= 20", 20), ("GC2 >= 30", 30)): m = F.night.abs() >= thr; print(f"{n}: {int(m.sum())} days | before {MID}: {int((m & ~F.late).sum())} | from: {int((m & F.late).sum())} | night up {int((m & (F.night > 0)).sum())} down {int((m & (F.night < 0)).sum())}")
    sys.exit()
def trade(r, side, tp, costs=None):
    d = pd.Timestamp(r.day, tz="UTC"); x = m5[(m5.time >= d + 8 * H) & (m5.time <= d + 12 * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tp=tp(bar["open"]), tag="x")
        if acct.positions and bar["time"] >= d + 12 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
fade = lambda r: (-int(np.sign(r.night)), lambda e: r.yclose); follow = lambda r: (int(np.sign(r.night)), lambda e: e + np.sign(r.night) * abs(r.night) * PIP)
if MODE == "check":
    r = F[F.day == sys.argv[3]].iloc[0]; print(r.to_string())
    if len(sys.argv) > 4: s1, t1 = fade(r); s0, t0 = follow(r); print("GC1:", trade(r, s1, t1), "| GC0:", trade(r, s0, t0))
    sys.exit()
keep = {}; rng = np.random.default_rng(25)
for name, thr, how in (("GC1 back to yesterday's close, night >= 20", 20, fade), ("GC2 the same, night >= 30", 30, fade), ("GC0 with the night (control)", 20, follow)):
    J = F[F.night.abs() >= thr].reset_index(drop=True); res = []; rs = []
    for r in J.itertuples(): s, tp = how(r); res.append(trade(r, s, tp)); rs.append(trade(r, s, tp, (2.0, 0.5))[0])
    R = pd.Series([z[0] for z in res]); W = [z[1] for z in res]; Rs = pd.Series(rs); lt = J.late.values; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | targets {W.count('tp')} stops {W.count('sl')} clock {len(W) - W.count('tp') - W.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed avg {Rs.mean():+.3f}")
    if name.startswith("GC1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, Rs.mean() > 0, None]
diff = (keep["GC1"] - keep["GC0"]).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.05
print(f"GC1 minus GC0 {diff.mean():+.3f}R, sign-flip p {p:.4f}"); print("KILL LINES GC1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
