"""Idea RG (journal/2015-idea-RG-regime-or-noise.md; kill test written first): is the fall of the signal's side advantage a regime change or noise?
Side advantage per day = R(my side) - R(other side), both from the 08:00 open, 40 pip stop, noon exit, costs on (the loop of bt/coin_control.py).
Permutation tests on three pre-written splits. usage: python bt/regime_or_noise.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END = sys.argv[1]; RISK, SL, NP = 125.0, 40, 20000; H = pd.Timedelta(hours=1)
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = ta.groupby("tag").agg(R=("R", "sum"), side=("side", "first"))
rows = []
for d in A.index:
    dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + 8 * H) & (m5.time <= dd_ + 12 * H)]; r = {}
    for side in (1, -1):
        acct = Account()
        for _, bar in x.iterrows():
            if bar.time == dd_ + 8 * H: acct.market(side, round(RISK / (SL * 10), 3), sl=bar.open - side * SL * PIP, tag=d)
            if acct.positions and bar.time >= dd_ + 12 * H: acct.close()
            acct.on_bar(bar)
        t = acct.trades[-1]; r[side] = (t["pnl"] / RISK, t["reason"] == "sl")
    s = int(A.side[d]); rows.append(dict(tag=d, mine=r[s][0], other=r[-s][0], adv=r[s][0] - r[-s][0], asym=int(r[-s][1]) - int(r[s][1])))
D = pd.DataFrame(rows).set_index("tag"); n = len(D); v = D.adv.values
print(f"mechanics: my side against engine A2, largest difference per day {(D.mine - A.R).abs().max():.3f}R | {n} days | side advantage: mean {v.mean():+.3f}R, sd {v.std(ddof=1):.2f}R")
if "--check" in sys.argv: print(D.loc[sys.argv[sys.argv.index("--check") + 1]].round(2).to_string()); sys.exit()
half = n // 2; pair = np.array([0 if t[5:7] in ("01", "02") else 1 if t[5:7] in ("03", "04") else 2 for t in D.index]); idx = np.arange(n)
def s1(x): return x[:half].mean() - x[half:].mean()
def s2(x): m = [x[pair == k].mean() for k in (0, 1, 2)]; return max(m) - min(m)
def s3(x): return -np.corrcoef(idx, x)[0, 1]
rng = np.random.default_rng(5)
def perm(stat, block=1):
    real = stat(v); k = 0
    for _ in range(NP):
        if block == 1: x = rng.permutation(v)
        else:
            b = [v[i:i + block] for i in range(0, n, block)]; o = rng.permutation(len(b)); x = np.concatenate([b[i] for i in o])
        k += stat(x) >= real
    return real, (k + 1) / (NP + 1)
print("PERIOD MEANS of the side advantage (R a day) and stop asymmetry (other side stopped minus mine, per day):")
print(f"   halves: first {half} days ({D.index[0]}..{D.index[half-1]}) {v[:half].mean():+.3f}R, asym {D.asym.values[:half].mean():+.2f} | last {n-half} days ({D.index[half]}..{D.index[-1]}) {v[half:].mean():+.3f}R, asym {D.asym.values[half:].mean():+.2f}")
print("   calendar pairs: " + " | ".join(f"{nm} {int((pair == k).sum())} days {v[pair == k].mean():+.3f}R (my side {D.mine.values[pair == k].mean():+.3f}, other {D.other.values[pair == k].mean():+.3f}), asym {D.asym.values[pair == k].mean():+.2f}" for k, nm in enumerate(("Jan-Feb", "Mar-Apr", "May-Jun"))))
print("   by month: " + " ".join(f"{m}:{g.adv.mean():+.2f}({len(g)})" for m, g in D.groupby(D.index.str[:7])))
P = []
for name, st in (("RG1 halves (first minus last)", s1), ("RG2 calendar pairs (largest minus smallest)", s2), ("RG3 slide (minus the correlation with the day number)", s3)):
    real, p = perm(st); _, pb = perm(st, 5); P.append(p); print(f"{name}: statistic {real:+.3f} | permutation p = {p:.4f} | with 5-day blocks p = {pb:.4f}")
K = [p < 0.05 for p in P]; surv = sum(K) >= 2 and min(P) < 0.05 / 3
print("KILL TEST: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)) + f" | smallest p {min(P):.4f} (line 0.0167) -> the claim 'regime change, not noise' {'SURVIVES' if surv else 'is KILLED'}")
