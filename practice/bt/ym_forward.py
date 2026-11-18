"""Idea YM (journal/2015-idea-YM-yesterdays-midpoint.md), built from bt/closing_strength.py. side = sign(08:00 open - yesterday mid); dist = |open - mid| / yesterday range. Was: Idea CS (journal/2015-idea-CS-closing-strength.md): yesterday's London-day close position in its range; >= 1-Q -> buy 08:00, <= Q -> sell; stop 40, out 12:00.
usage: python bt/ym_forward.py END forward START   (frozen copy of bt/yesterday_mid.py, 2015-08-31; YM1 = Q 0.0)"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 40; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
a2 = ta.set_index("tag").side
days = [d for d in sorted(set(m5.time.dt.normalize())) if d.weekday() < 5 and len(m5[(m5.time >= d - 2 * H) & (m5.time < d + 22 * H)]) >= 200]; rows = []
for i in range(1, len(days)):
    d, p = days[i], days[i - 1]
    if d + 8 * H not in op.index or d + 12 * H not in op.index: continue
    y = m5[(m5.time >= p - 2 * H) & (m5.time < p + 22 * H)]; hi, lo, c = y.high.max(), y.low.min(), y.close.iloc[-1]; ds = d.strftime("%Y-%m-%d")
    mid = (hi + lo) / 2; o8 = op[d + 8 * H]
    rows.append(dict(day=ds, cpos=abs(o8 - mid) / (hi - lo), side0=1 if o8 > mid else -1, late=ds >= MID, a2=int(a2[ds]) if ds in a2.index else 0)) if o8 != mid else None
F = pd.DataFrame(rows)
def pick(Q): X = F[F.cpos >= Q].copy(); X["side"] = X.side0; return X.reset_index(drop=True)
if MODE == "count":
    print(f"days {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]})")
    for Q in (0.0, 0.25): X = pick(Q); print(f"Q = {Q:.2f}: {len(X)} trades | before {MID}: {int((~X.late).sum())} | from: {int(X.late.sum())} | buys {int((X.side > 0).sum())} sells {int((X.side < 0).sum())} | same side as A2: {int((X.side == X.a2).sum())} of {int((X.a2 != 0).sum())}")
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
if MODE == "forward":
    # YM1 forward count (journal/YM-forward-record.md): frozen rule, days from START (sys.argv[3]) to END; no other change.
    X = F[F.day >= sys.argv[3]].reset_index(drop=True); out = []
    for r in X.itertuples():
        y1 = trade(r.day, r.side0); y0 = trade(r.day, -r.side0); ys = trade(r.day, r.side0, (2.0, 0.5))
        out.append((r.day, r.side0, r.a2, y1[0], y0[0], ys[0])); print(f"{r.day} YM1 side {r.side0:+d} | A2 side {r.a2:+d} | {'AGREE' if r.side0 == r.a2 else 'DISAGREE'} | YM1 {y1[0]:+.2f}R ({y1[1]}) | YM0 {y0[0]:+.2f}R | YM1 stressed {ys[0]:+.2f}R")
    if out:
        R = pd.Series([o[3] for o in out]); R0 = pd.Series([o[4] for o in out]); Rs = pd.Series([o[5] for o in out]); dis = pd.Series([o[1] != o[2] for o in out])
        print(f"YM1 FORWARD (R after costs 1.0 + 0.1; stressed 2.0 + 0.5): {len(R)} of 80 trades | avg {R.mean():+.3f}R | net {R.sum():+.2f} | disagree days {int(dis.sum())} net {R[dis].sum():+.2f} | agree days {int((~dis).sum())} net {R[~dis].sum():+.2f} | YM1 - YM0 {(R - R0).mean():+.3f}R | stressed avg {Rs.mean():+.3f} | drawdown {(R.cumsum().cummax() - R.cumsum()).max():.2f}R (early close at 8R)")
    else: print("YM1 FORWARD: 0 trades")
    sys.exit()
Q1, Q2 = float(sys.argv[3]), float(sys.argv[4]); keep = {}; rng = np.random.default_rng(31)
for name, Q, sg in ((f"YM1 with the midpoint side, dist >= {Q1}", Q1, 1), (f"YM2 dist >= {Q2}", Q2, 1), (f"YM0 against, dist >= {Q1} (control)", Q1, -1)):
    X = pick(Q); res = [trade(r.day, sg * r.side) for r in X.itertuples()]; R = pd.Series([z[0] for z in res]); W = [z[1] for z in res]
    Rs = pd.Series([trade(r.day, sg * r.side, (2.0, 0.5))[0] for r in X.itertuples()]); lt = X.late.values; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | stops {W.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed avg {Rs.mean():+.3f} | on A2's side {(X.side * sg == X.a2).mean():.0%}")
    if name.startswith("YM1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, Rs.mean() > 0, None]; same = (X.side == X.a2).mean()
diff = (keep["YM1"] - keep["YM0"]).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.10
print(f"(R after costs 1.0 + 0.1; stressed 2.0 + 0.5) YM1 minus YM0 {diff.mean():+.3f}R, sign-flip p {p:.4f} | A2 in disguise: {same:.0%} on A2's side (void at 80%+)"); print("KILL LINES YM1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
