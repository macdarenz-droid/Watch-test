"""Idea WD (journal/2015-idea-WD-day-of-week.md; kill lines written first): does A2 depend on the weekday? One spread statistic per variant
(largest weekday mean minus smallest) with a permutation test over the weekday labels. usage: python bt/weekday.py END"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END = sys.argv[1]; RISK, SL, NP = 125.0, 40, 20000; H = pd.Timedelta(hours=1); WD = ["Mon", "Tue", "Wed", "Thu", "Fri"]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = ta.groupby("tag").agg(R=("R", "sum"), side=("side", "first"), stop=("reason", lambda x: (x == "sl").any())); rows = []
for d in A.index:
    dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + 8 * H) & (m5.time <= dd_ + 12 * H)]; r = {}
    for side in (1, -1):
        acct = Account()
        for _, bar in x.iterrows():
            if bar.time == dd_ + 8 * H: acct.market(side, round(RISK / (SL * 10), 3), sl=bar.open - side * SL * PIP, tag=d)
            if acct.positions and bar.time >= dd_ + 12 * H: acct.close()
            acct.on_bar(bar)
        r[side] = acct.trades[-1]["pnl"] / RISK
    s = int(A.side[d]); rows.append(dict(tag=d, wd=dd_.strftime("%a"), R=A.R[d], mine=r[s], adv=r[s] - r[-s], stop=float(A.stop[d])))
D = pd.DataFrame(rows).set_index("tag"); n = len(D); half = np.arange(n) >= n // 2
print(f"mechanics: my side against engine A2, largest difference per day {(D.mine - D.R).abs().max():.3f}R | {n} days | per weekday: " + " ".join(f"{w} {int((D.wd == w).sum())}" for w in WD))
rng = np.random.default_rng(31); lab = D.wd.values
def spread(v, l): m = [v[l == w].mean() for w in WD]; return max(m) - min(m)
P = {}
for name, col in (("WD1 A2's R", "R"), ("WD2 side advantage", "adv"), ("WD3 full-stop rate", "stop")):
    v = D[col].values; real = spread(v, lab); k = sum(spread(v, rng.permutation(lab)) >= real for _ in range(NP)); p = (k + 1) / (NP + 1); P[name] = p
    typical = np.median([spread(v, rng.permutation(lab)) for _ in range(2000)])
    print(f"{name}: " + " | ".join(f"{w} {v[lab == w].mean():+.3f}" for w in WD) + f" || spread {real:.3f} (typical spread with no weekday effect {typical:.3f}) | permutation p = {p:.4f}")
m1 = D[~half].groupby("wd").R.mean().reindex(WD); m2 = D[half].groupby("wd").R.mean().reindex(WD)
print("A2's R by weekday, first half: " + " ".join(f"{w} {m1[w]:+.2f}" for w in WD) + f" (best {m1.idxmax()}, worst {m1.idxmin()}) | second half: " + " ".join(f"{w} {m2[w]:+.2f}" for w in WD) + f" (best {m2.idxmax()}, worst {m2.idxmin()})")
K = [P["WD1 A2's R"] < 0.05, m1.idxmax() == m2.idxmax() and m1.idxmin() == m2.idxmin(), min((D.wd == w).sum() for w in WD) >= 20, min(P.values()) < 0.05 / 3]
print("KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)) + f" -> the claim 'the weekday matters' {'SURVIVES' if all(K) else 'is KILLED'}")
