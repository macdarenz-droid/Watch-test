"""Idea QB (journal/2015-idea-QB-quiet-pre-hour-break.md). Box = 07:00-08:00 London (bid M5); quiet = box range <= Q pips;
first M5 CLOSE beyond the box 08:00-10:00 -> follow at the next M5 open, stop 20, out 12:00. Times are London labels from ideas.days.
usage: python bt/quiet_box.py END count | check DATE | run Q1 Q2"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 20; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
a2 = ta.set_index("tag").side
days = [d for d in sorted(set(m5.time.dt.normalize())) if d.weekday() < 5 and len(m5[(m5.time >= d - 2 * H) & (m5.time < d + 22 * H)]) >= 200]; rows = []
for d in days:
    b = m5[(m5.time >= d + 7 * H) & (m5.time < d + 8 * H)]; w = m5[(m5.time >= d + 8 * H) & (m5.time < d + 10 * H)]
    if len(b) < 10 or len(w) < 20: continue
    hi, lo = b.high.max(), b.low.min(); ds = d.strftime("%Y-%m-%d"); side = 0; t0 = None
    for r in w.itertuples():
        if r.close > hi: side = 1
        elif r.close < lo: side = -1
        if side: t0 = r.time + pd.Timedelta(minutes=5); break
    rows.append(dict(day=ds, box=(hi - lo) / PIP, side=side, t0=t0, late=ds >= MID, a2=int(a2[ds]) if ds in a2.index else 0))
F = pd.DataFrame(rows)
def pick(Q): return F[(F.box <= Q) & (F.side != 0)].reset_index(drop=True)
if MODE == "count":
    print(f"days {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]}) | quiet <= 30: {(F.box <= 30).sum()} | broke by 10:00 among them: {((F.box <= 30) & (F.side != 0)).sum()}")
    for Q in (20, 25, 30): X = pick(Q); print(f"Q = {Q}: {len(X)} trades | before {MID}: {int((~X.late).sum())} | from: {int(X.late.sum())} | buys {int((X.side > 0).sum())} sells {int((X.side < 0).sum())} | same side as A2: {int((X.side == X.a2).sum())} of {int((X.a2 != 0).sum())}")
    sys.exit()
def trade(r, side, costs=None):
    d = pd.Timestamp(r.day, tz="UTC"); x = m5[(m5.time >= r.t0) & (m5.time <= d + 12 * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= d + 12 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"]
if MODE == "check":
    print(F[F.day == sys.argv[3]].iloc[0].to_string()); sys.exit()
Q1, Q2 = float(sys.argv[3]), float(sys.argv[4]); keep = {}; rng = np.random.default_rng(31)
for name, Q, sg in ((f"QB1 follow the break, box <= {Q1}", Q1, 1), (f"QB2 box <= {Q2}", Q2, 1), (f"QB0 fade, box <= {Q1} (control)", Q1, -1)):
    X = pick(Q); res = [trade(r, sg * r.side) for r in X.itertuples()]; R = pd.Series([z[0] for z in res]); W = [z[1] for z in res]
    Rs = pd.Series([trade(r, sg * r.side, (2.0, 0.5))[0] for r in X.itertuples()]); lt = X.late.values; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | stops {W.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed avg {Rs.mean():+.3f} | on A2's side {(X.side * sg == X.a2).mean():.0%}")
    if name.startswith("QB1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, Rs.mean() > 0, None]
diff = (keep["QB1"] - keep["QB0"]).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.10
print(f"(R after costs 1.0 + 0.1; stressed 2.0 + 0.5) QB1 minus QB0 {diff.mean():+.3f}R, sign-flip p {p:.4f}"); print("KILL LINES QB1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
