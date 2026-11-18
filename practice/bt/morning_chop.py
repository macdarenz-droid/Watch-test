"""Idea MC (journal/2015-idea-MC-morning-chop-on-off.md): A2 on/off by the recent mornings. eff = |open12 - open08| / 08-12 range; whip = 25+ pips both ways from 08:00.
MC1 ON when mean eff of the last 10 days >= 0.47 | MC2 last 5 days | MC3 OFF when >= 2 whip mornings in the last 10.
usage: python bt/morning_chop.py END count | check DATE | step1 | step2"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, PIP
END, MODE = sys.argv[1], sys.argv[2]; H = pd.Timedelta(hours=1)
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open; rows = []
for d in sorted(set(m5.time.dt.normalize())):
    if d.weekday() > 4 or d + 8 * H not in op.index or d + 12 * H not in op.index: continue
    mo = m5[(m5.time >= d + 8 * H) & (m5.time < d + 12 * H)]
    if len(mo) < 40: continue
    rows.append(dict(day=d.strftime("%Y-%m-%d"), eff=abs(op[d + 12 * H] - op[d + 8 * H]) / (mo.high.max() - mo.low.min()), whip=min(mo.high.max() - op[d + 8 * H], op[d + 8 * H] - mo.low.min()) / PIP >= 25))
F = pd.DataFrame(rows).set_index("day"); F["me10"] = F.eff.shift(1).rolling(10).mean(); F["me5"] = F.eff.shift(1).rolling(5).mean(); F["w10"] = F.whip.shift(1).rolling(10).sum()
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
F = F.join(t.groupby("tag").R.sum().rename("R"), how="inner").dropna(subset=["me10"]); F["early"] = F.index < "2015-05-01"
V = {"MC1": F.me10 >= 0.47, "MC2": F.me5 >= 0.47, "MC3": F.w10 < 2}
if MODE == "check":
    d = sys.argv[3]; G = pd.DataFrame(rows).set_index("day"); i = list(G.index).index(d); print(G.iloc[i - 10:i].round(3).to_string()); print(F.loc[d, ["me10", "me5", "w10"]].round(3).to_string(), {k: bool(v[d]) for k, v in V.items()}); sys.exit()
if MODE == "count":
    print(f"A2 days with a state: {len(F)} ({F.index[0]}..{F.index[-1]}) | Jan-Apr {int(F.early.sum())} | from 05-01 {int((~F.early).sum())}")
    for k, v in V.items(): print(f"{k}: Jan-Apr ON {int((v & F.early).sum())} OFF {int((~v & F.early).sum())} | from 05-01 ON {int((v & ~F.early).sum())} OFF {int((~v & ~F.early).sum())}")
    sys.exit()
X = F[F.early] if MODE == "step1" else F[~F.early]
for k, v in V.items():
    on, off = X[v[X.index]], X[~v[X.index]]; print(f"{k} {'Jan-Apr' if MODE == 'step1' else 'from 05-01'}: ON {len(on)} avg {on.R.mean():+.3f} net {on.R.sum():+.2f} | OFF {len(off)} avg {off.R.mean():+.3f} net {off.R.sum():+.2f} | gap {on.R.mean() - off.R.mean():+.3f}")
    if k == "MC1" and MODE == "step1": print("   KILL LINES: K1 " + ("PASS" if on.R.mean() - off.R.mean() >= 0.30 else "FAIL") + " | K2 " + ("PASS" if off.R.mean() < 0.10 else "FAIL"))
if MODE == "step2":
    v = V["MC1"]; rng = np.random.default_rng(5); g = lambda lab: sum((F.R[lab & (F.early == e)].mean() - F.R[~lab & (F.early == e)].mean()) for e in (True, False)) / 2; obs = g(v); c = 0
    for _ in range(10000):
        lab = v.copy()
        for e in (True, False): idx = F.index[F.early == e]; lab[idx] = rng.permutation(v[idx].values)
        c += g(lab) >= obs
    print(f"MC1 pooled within-period gap {obs:+.3f}R, shuffle p {c / 10000:.4f}")
