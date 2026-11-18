"""Idea GS (journal/2015-idea-GS-grace-stop.md): A2 with a wide disaster stop until a grace time, then A2's 40-pip stop. 1R = $125 = 40 pips.
usage: python bt/grace_stop.py END check DATE | run"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 40; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = t.groupby("tag").agg(R=("R", "sum"), side=("side", "first")).reset_index()
def trade(day, side, grace_h=None, wide=80, costs=None):
    d = pd.Timestamp(day, tz="UTC"); x = m5[(m5.time >= d + 8 * H) & (m5.time <= d + 12 * H)]
    acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account(); moved = grace_h is None
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * (SL if grace_h is None else wide) * PIP, tag="x")
        elif not moved and acct.positions and bar["time"] >= d + grace_h * H:
            p = acct.positions[0]; acct.modify(p.id, sl=p.entry - side * SL * PIP); moved = True
        if acct.positions and bar["time"] >= d + 12 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    tr = acct.trades[-1]; return tr["pnl"] / RISK, tr["reason"], tr["entry"], tr["exit"], str(tr["exit_time"])[11:16]
V = (("base A2 (stop 40 from 08:00)", None, 80), ("GS1 grace to 09:00, disaster 80", 9, 80), ("GS2 grace to 10:00, disaster 80", 10, 80), ("GS3 grace to 09:00, disaster 60", 9, 60))
if MODE == "check":
    r = A[A.tag == sys.argv[3]].iloc[0]; print(f"{r.tag} side {r.side:+d} | engine A2 R {r.R:+.2f}")
    for n, g, w in V: print(n, trade(r.tag, int(r.side), g, w))
    sys.exit()
lt = (A.tag >= MID).values; rng = np.random.default_rng(57); base = None
print(f"A2 days {len(A)} ({A.tag.iloc[0]}..{A.tag.iloc[-1]}); before {MID}: {(~lt).sum()}, from: {lt.sum()}")
for name, g, w in V:
    R = pd.Series([trade(r.tag, int(r.side), g, w)[0] for r in A.itertuples()]); Rs = pd.Series([trade(r.tag, int(r.side), g, w, (2.0, 0.5))[0] for r in A.itertuples()])
    dd = (R.cumsum().cummax() - R.cumsum()).max(); worst = R.min()
    line = f"{name}: avg {R.mean():+.3f}R | net {R.sum():+.2f} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed avg {Rs.mean():+.3f} | max DD {dd:.2f}R | worst trade {worst:+.2f}R"
    if base is None:
        base, bs, bdd = R, Rs, dd; print(line + f" | mechanics: engine A2 net {A.R.sum():+.2f}, largest day difference {np.abs(R.values - A.R.values).max():.3f}R"); continue
    df = (R - base).values; p = (np.abs((rng.choice([-1, 1], (10000, len(df))) * df).mean(1)) >= abs(df.mean())).mean()
    K = [df.mean() >= 0.05, df[~lt].sum() > 0 and df[lt].sum() > 0, Rs.mean() >= bs.mean(), df.mean() > 0 and p < 0.10, dd <= bdd]
    print(line + f" | minus base {df.mean():+.3f}R (before {df[~lt].sum():+.2f}, from {df[lt].sum():+.2f}), p {p:.4f}, days changed {(np.abs(df) > 1e-9).sum()} | " + " ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
print("(all R after costs 1.0 + 0.1; stressed 2.0 + 0.5; 1R = $125 = 40 pips) script reached its end")
