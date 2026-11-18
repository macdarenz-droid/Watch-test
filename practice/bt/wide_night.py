"""Idea WN (journal/2015-idea-WN-wide-night-skip.md), built from bt/no_chase_hour.py. ratio = night range (00:00-07:00) / median of the 20 nights before. Skip A2 when ratio >= W (WN1/WN2); control WN0 skips the same share of the narrowest nights. Was: Idea NC (journal/2015-08-17-replay-week-17-and-idea-NC.md): A2 filter. hour = open(08:00) - open(07:00) London, signed by A2's side. Skip A2 when hour >= X (NC1/NC2)
or hour <= -X (NC0 control). Judged on the engine's A2 list before END. usage: python bt/no_chase_hour.py END count | check DATE | test X1 X2"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, PIP
END, MODE = sys.argv[1], sys.argv[2]; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = t.groupby("tag").agg(R=("R", "sum"), side=("side", "first")).reset_index(); nr = {}
for d in sorted(set(m5.time.dt.normalize())):
    x = m5[(m5.time >= d) & (m5.time < d + 7 * H)]
    if d.weekday() < 5 and len(x) >= 60: nr[d.strftime("%Y-%m-%d")] = (x.high.max() - x.low.min()) / PIP
nr = pd.Series(nr); med = nr.shift(1).rolling(20).median(); rows = []
for r in A.itertuples():
    if r.tag in med.index and np.isfinite(med[r.tag]): rows.append(dict(day=r.tag, R=r.R, side=r.side, hour=nr[r.tag] / med[r.tag], late=r.tag >= MID))
F = pd.DataFrame(rows)
if MODE == "count":
    print(f"A2 days with a 20-night median: {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]})")
    for W in (1.3, 1.5, 1.8, 2.0): s = F.hour >= W; print(f"W = {W}: skip {int(s.sum())} = {s.mean():.0%} (before {MID} {int((s & ~F.late).sum())}, from {int((s & F.late).sum())})")
    sys.exit()
if MODE == "check": print(F[F.day == sys.argv[3]].round(2).to_string(index=False)); sys.exit()
X1, X2 = float(sys.argv[3]), float(sys.argv[4]); rng = np.random.default_rng(38)
def gap(mask, X):
    s, k = X[mask], X[~mask]; return k.R.mean() - s.R.mean(), s, k
res = {}
n1 = int((F.hour >= X1).sum()); low = F.hour.rank(method="first") <= n1
for name, mask in ((f"WN1 skip after a night >= {X1:g} x median", F.hour >= X1), (f"WN2 skip at >= {X2:g}", F.hour >= X2), (f"WN0 skip the {n1} narrowest nights (control)", low)):
    g, s, k = gap(mask, F); a = gap(mask[~F.late], F[~F.late]); b = gap(mask[F.late], F[F.late]); res[name[:3]] = g
    print(f"{name}: skipped {len(s)} avg {s.R.mean():+.3f} net {s.R.sum():+.2f} | kept {len(k)} avg {k.R.mean():+.3f} net {k.R.sum():+.2f} | gap (kept - skipped) {g:+.3f} | before {MID}: gap {a[0]:+.3f} (skipped {len(a[1])}) | from: gap {b[0]:+.3f} (skipped {len(b[1])}) | A2 all {F.R.sum():+.2f} -> kept {k.R.sum():+.2f}")
    if name.startswith("WN1"):
        K = [s.R.mean() < 0 and g >= 0.30, a[0] > 0 and b[0] > 0, None, None]; m = mask.values; Rv = F.R.values; c = 0
        for _ in range(10000):
            p_ = rng.permutation(m); c += (Rv[~p_].mean() - Rv[p_].mean()) >= g
        pval = c / 10000
K[2] = res["WN1"] > res["WN0"]; K[3] = pval < 0.10
print(f"(R after costs 1.0 + 0.1) WN1 gap shuffle p {pval:.4f} | WN0 gap {res['WN0']:+.3f}"); print("KILL LINES WN1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
