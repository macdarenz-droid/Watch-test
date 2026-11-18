"""Idea XD (journal/2015-idea-XD-follow-yesterdays-3-day-break.md), built from bt/yesterday_mid.py. side = +1 if yesterday broke only the 3-day high, -1 only the low; cpos = yesterday close position toward the break. Was: Idea YM, built from bt/closing_strength.py. Was: Idea CS (journal/2015-idea-CS-closing-strength.md): yesterday's London-day close position in its range; >= 1-Q -> buy 08:00, <= Q -> sell; stop 40, out 12:00.
usage: python bt/closing_strength.py END count | check DATE [x] | test Q1 Q2"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 40; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
a2 = ta.set_index("tag").side
days = [d for d in sorted(set(m5.time.dt.normalize())) if d.weekday() < 5 and len(m5[(m5.time >= d - 2 * H) & (m5.time < d + 22 * H)]) >= 200]; rows = []
for i in range(3, len(days)):
    d, p = days[i], days[i - 1]
    if d + 8 * H not in op.index or d + 12 * H not in op.index: continue
    y = m5[(m5.time >= p - 2 * H) & (m5.time < p + 22 * H)]; hi, lo, c = y.high.max(), y.low.min(), y.close.iloc[-1]; ds = d.strftime("%Y-%m-%d")
    z = m5[(m5.time >= days[i - 3] - 2 * H) & (m5.time < days[i - 2] + 22 * H)]; up, dn = hi > z.high.max(), lo < z.low.min()
    if up == dn: continue
    sd = 1 if up else -1; cp = (c - lo) / (hi - lo); cp = cp if sd > 0 else 1 - cp
    rows.append(dict(day=ds, cpos=cp, side0=sd, late=ds >= MID, a2=int(a2[ds]) if ds in a2.index else 0))
F = pd.DataFrame(rows)
def pick(Q): X = F[F.cpos >= Q].copy(); X["side"] = X.side0; return X.reset_index(drop=True)
if MODE == "count":
    print(f"days {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]})")
    for Q in (0.0, 0.5): X = pick(Q); print(f"Q = {Q:.2f}: {len(X)} trades | before {MID}: {int((~X.late).sum())} | from: {int(X.late.sum())} | buys {int((X.side > 0).sum())} sells {int((X.side < 0).sum())} | same side as A2: {int((X.side == X.a2).sum())} of {int((X.a2 != 0).sum())}")
    sys.exit()
def trade(day, side, costs=None):
    d = pd.Timestamp(day, tz="UTC"); x = m5[(m5.time >= d + 8 * H) & (m5.time <= d + 12 * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= d + 12 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
if MODE == "check":
    r = F[F.day == sys.argv[3]].iloc[0]; print(r.to_string())
    if len(sys.argv) > 4: s = int(r.side0); print("with the close:", trade(r.day, s), "| against:", trade(r.day, -s))
    sys.exit()
Q1, Q2 = float(sys.argv[3]), float(sys.argv[4]); keep = {}; rng = np.random.default_rng(31)
for name, Q, sg in ((f"XD1 with yesterday's 3-day break, close pos >= {Q1}", Q1, 1), (f"XD2 close pos >= {Q2}", Q2, 1), (f"XD0 against, {Q1} (control)", Q1, -1)):
    X = pick(Q); res = [trade(r.day, sg * r.side) for r in X.itertuples()]; R = pd.Series([z[0] for z in res]); W = [z[1] for z in res]
    Rs = pd.Series([trade(r.day, sg * r.side, (2.0, 0.5))[0] for r in X.itertuples()]); lt = X.late.values; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | stops {W.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed avg {Rs.mean():+.3f} | on A2's side {(X.side * sg == X.a2).mean():.0%}")
    if name.startswith("XD1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, Rs.mean() > 0, None]; same = (X.side == X.a2).mean()
diff = (keep["XD1"] - keep["XD0"]).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.10
print(f"(R after costs 1.0 + 0.1; stressed 2.0 + 0.5) XD1 minus XD0 {diff.mean():+.3f}R, sign-flip p {p:.4f} | A2 in disguise: {same:.0%} on A2's side (void at 80%+)"); print("KILL LINES XD1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
