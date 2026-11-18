"""Idea NC (journal/2015-08-17-replay-week-17-and-idea-NC.md): A2 filter. hour = open(08:00) - open(07:00) London, signed by A2's side. Skip A2 when hour >= X (NC1/NC2)
or hour <= -X (NC0 control). Judged on the engine's A2 list before END. usage: python bt/no_chase_hour.py END count | check DATE | test X1 X2"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, PIP
END, MODE = sys.argv[1], sys.argv[2]; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = t.groupby("tag").agg(R=("R", "sum"), side=("side", "first")).reset_index(); rows = []
for r in A.itertuples():
    d = pd.Timestamp(r.tag, tz="UTC")
    if d + 7 * H in op.index and d + 8 * H in op.index: rows.append(dict(day=r.tag, R=r.R, side=r.side, hour=(op[d + 8 * H] - op[d + 7 * H]) / PIP * r.side, late=r.tag >= MID))
F = pd.DataFrame(rows)
if MODE == "count":
    print(f"A2 days with both candles: {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]})")
    for X in (10, 15, 20, 25): s = F.hour >= X; c = F.hour <= -X; print(f"X = {X}: skip (ran A2's way) {int(s.sum())} = {s.mean():.0%} (before {MID} {int((s & ~F.late).sum())}, from {int((s & F.late).sum())}) | control skip (ran against) {int(c.sum())}")
    sys.exit()
if MODE == "check": print(F[F.day == sys.argv[3]].round(2).to_string(index=False)); sys.exit()
X1, X2 = float(sys.argv[3]), float(sys.argv[4]); rng = np.random.default_rng(38)
def gap(mask, X):
    s, k = X[mask], X[~mask]; return k.R.mean() - s.R.mean(), s, k
res = {}
for name, mask in ((f"NC1 skip when the hour ran A2's way >= {X1:g}", F.hour >= X1), (f"NC2 skip at >= {X2:g}", F.hour >= X2), (f"NC0 skip when the hour ran AGAINST A2 >= {X1:g} (control)", F.hour <= -X1)):
    g, s, k = gap(mask, F); a = gap(mask[~F.late], F[~F.late]); b = gap(mask[F.late], F[F.late]); res[name[:3]] = g
    print(f"{name}: skipped {len(s)} avg {s.R.mean():+.3f} net {s.R.sum():+.2f} | kept {len(k)} avg {k.R.mean():+.3f} net {k.R.sum():+.2f} | gap (kept - skipped) {g:+.3f} | before {MID}: gap {a[0]:+.3f} (skipped {len(a[1])}) | from: gap {b[0]:+.3f} (skipped {len(b[1])}) | A2 all {F.R.sum():+.2f} -> kept {k.R.sum():+.2f}")
    if name.startswith("NC1"):
        K = [s.R.mean() < 0 and g >= 0.30, a[0] > 0 and b[0] > 0, None, None]; m = mask.values; Rv = F.R.values; c = 0
        for _ in range(10000):
            p_ = rng.permutation(m); c += (Rv[~p_].mean() - Rv[p_].mean()) >= g
        pval = c / 10000
K[2] = res["NC1"] > res["NC0"]; K[3] = pval < 0.10
print(f"NC1 gap shuffle p {pval:.4f} | NC0 gap {res['NC0']:+.3f}"); print("KILL LINES NC1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
