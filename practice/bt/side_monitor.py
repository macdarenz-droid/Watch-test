"""Idea MO (journal/2015-idea-MO-side-advantage-monitor.md; rule and kill test written first): a rolling monitor of the side advantage
(my side's R minus the other side's, 40 pip stop, 08:00 -> 12:00, costs on) that pauses or halves A2 while the last N days average below zero.
Real history + three built worlds. usage: python bt/side_monitor.py END [--state]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END = sys.argv[1]; RISK, SL = 125.0, 40; H = pd.Timedelta(hours=1); RUNS, DAYS = 2000, 500
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = ta.groupby("tag").agg(R=("R", "sum"), side=("side", "first")); rows = []
for d in A.index:
    dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + 8 * H) & (m5.time <= dd_ + 12 * H)]; r = {}
    for side in (1, -1):
        acct = Account()
        for _, bar in x.iterrows():
            if bar.time == dd_ + 8 * H: acct.market(side, round(RISK / (SL * 10), 3), sl=bar.open - side * SL * PIP, tag=d)
            if acct.positions and bar.time >= dd_ + 12 * H: acct.close()
            acct.on_bar(bar)
        r[side] = acct.trades[-1]["pnl"] / RISK
    s = int(A.side[d]); rows.append(dict(tag=d, mine=r[s], adv=r[s] - r[-s]))
D = pd.DataFrame(rows).set_index("tag"); print(f"mechanics: my side against engine A2, largest difference per day {(D.mine - A.R).abs().max():.3f}R | {len(D)} days")
VAR = {"MO1 N=40 pause": (40, 0.0), "MO2 N=40 half": (40, 0.5), "MO3 N=60 pause": (60, 0.0)}
def weights(adv, N, off):                     # adv: (runs, days). weight of day t from the mean of adv[t-N:t]
    c = np.cumsum(np.concatenate([np.zeros((adv.shape[0], 1)), adv], axis=1), axis=1); w = np.ones_like(adv)
    m = (c[:, N:-1] - c[:, :-N - 1]) / N; w[:, N:] = np.where(m < 0, off, 1.0); return w
def dd(eq): return (np.maximum.accumulate(np.maximum(eq, 0), axis=1) - eq).max(axis=1)
mine, adv = D.mine.values[None, :], D.adv.values[None, :]
if "--state" in sys.argv:
    for k, (N, off) in VAR.items():
        m = D.adv.rolling(N).mean(); print(f"{k}: monitor for the NEXT day after {D.index[-1]} = {m.iloc[-1]:+.3f}R -> {'A2 as usual' if m.iloc[-1] >= 0 else ('PAUSE (paper)' if off == 0 else 'HALF size')} | last 5 monitors: " + " ".join(f"{d[5:]}:{v:+.2f}" for d, v in m.shift(1).tail(5).items()))
    sys.exit()
print(f"(1) REAL HISTORY {D.index[0]}..{D.index[-1]}: A2 always {D.mine.sum():+.2f}R, max DD {dd(np.cumsum(mine, axis=1))[0]:.2f}R")
hist = {}
for k, (N, off) in VAR.items():
    w = weights(adv, N, off)[0]; r = w * D.mine.values; offd = D.index[w < 1]; hist[k] = r.sum() - D.mine.sum()
    print(f"   {k}: {r.sum():+.2f}R ({hist[k]:+.2f} vs A2 always) | max DD {dd(np.cumsum(r)[None, :])[0]:.2f}R | days not at full size {len(offd)} (first {offd[0] if len(offd) else '-'}, last {offd[-1] if len(offd) else '-'}); A2 on those days {D.mine.values[w < 1].sum():+.2f}R | off-days by month: " + " ".join(f"{m}:{c}" for m, c in pd.Series(offd.str[:7]).value_counts().sort_index().items()))
rng = np.random.default_rng(23); P_alive = D[["mine", "adv"]].values; P_dead = D[D.index >= "2015-05-01"][["mine", "adv"]].values
print(f"pools: ALIVE {len(P_alive)} days (my side {P_alive[:,0].mean():+.3f}R, side advantage {P_alive[:,1].mean():+.3f}R) | DEAD {len(P_dead)} days from 05-01 (my side {P_dead[:,0].mean():+.3f}R, side advantage {P_dead[:,1].mean():+.3f}R)")
def world(kind):
    a = P_alive[rng.integers(0, len(P_alive), size=(RUNS, DAYS))]; d = P_dead[rng.integers(0, len(P_dead), size=(RUNS, DAYS))]
    if kind == "ALIVE": return a
    if kind == "DEAD": return d
    x = a.copy(); x[:, DAYS // 2:] = d[:, DAYS // 2:]; return x
res = {}
for kind in ("ALIVE", "DEAD", "SWITCH"):
    x = world(kind); mi, ad = x[:, :, 0], x[:, :, 1]; base_tot = mi.sum(1); base_dd = dd(np.cumsum(mi, axis=1))
    print(f"({ {'ALIVE': 2, 'DEAD': 3, 'SWITCH': 4}[kind] }) {kind} world, {RUNS} runs x {DAYS} days: A2 always median total {np.median(base_tot):+.1f}R (10th pct {np.percentile(base_tot, 10):+.1f}), median max DD {np.median(base_dd):.1f}R")
    for k, (N, off) in VAR.items():
        w = weights(ad, N, off); r = w * mi; tot = r.sum(1); d_ = dd(np.cumsum(r, axis=1)); res[(kind, k)] = (np.median(tot), np.median(base_tot), np.median(d_), np.median(base_dd))
        print(f"   {k}: median total {np.median(tot):+.1f}R (10th pct {np.percentile(tot, 10):+.1f}) | median max DD {np.median(d_):.1f}R | days not at full size {100 * (w < 1).mean():.0f}%" + (f" (first half {100 * (w[:, :DAYS//2] < 1).mean():.0f}%, second half {100 * (w[:, DAYS//2:] < 1).mean():.0f}%)" if kind == "SWITCH" else ""))
for k in VAR:
    a, d, s = res[("ALIVE", k)], res[("DEAD", k)], res[("SWITCH", k)]
    K = [a[0] >= 0.85 * a[1], d[2] <= 0.70 * d[3], s[0] > s[1], hist[k] >= -1.0]
    print(f"KILL TEST {k}: K1 alive keeps {100*a[0]/a[1]:.0f}% {'PASS' if K[0] else 'FAIL'} | K2 dead DD {100*d[2]/d[3]:.0f}% of A2's {'PASS' if K[1] else 'FAIL'} | K3 switch {s[0]-s[1]:+.1f}R {'PASS' if K[2] else 'FAIL'} | K4 history {hist[k]:+.2f}R {'PASS' if K[3] else 'FAIL'}")
