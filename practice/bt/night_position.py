"""Idea NP (journal/2015-idea-NP-night-position.md), built from bt/no_chase_hour.py: A2 filter. pos = where the 08:00 open sits in the
00:00-08:00 London range, turned to A2's side (1 = at the night's edge in A2's direction). Skip when pos >= 1 - Q (NP1/NP2) or pos <= Q
(NP0 control). hour = NC1's signed hour (overlap check). usage: python bt/night_position.py END count | check DATE | test Q1 Q2"""
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
    n_ = m5[(m5.time >= d) & (m5.time < d + 8 * H)]
    if d + 7 * H in op.index and d + 8 * H in op.index and len(n_) >= 80:
        hi, lo, o = n_.high.max(), n_.low.min(), op[d + 8 * H]; p = min(max((o - lo) / (hi - lo), 0), 1); p = p if r.side > 0 else 1 - p
        rows.append(dict(day=r.tag, R=r.R, side=r.side, pos=p, hour=(op[d + 8 * H] - op[d + 7 * H]) / PIP * r.side, late=r.tag >= MID))
F = pd.DataFrame(rows)
if MODE == "count":
    print(f"A2 days with both candles: {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]})")
    for Q in (0.10, 0.15, 0.20, 0.25): s_ = F.pos >= 1 - Q; c = F.pos <= Q; ov = (s_ & (F.hour >= 15)).sum(); print(f"Q = {Q:.2f}: skip {int(s_.sum())} = {s_.mean():.0%} (before {MID} {int((s_ & ~F.late).sum())}, from {int((s_ & F.late).sum())}) | also NC1 skip days (hour >= +15): {int(ov)} = {ov / max(s_.sum(), 1):.0%} | control skip {int(c.sum())}")
    sys.exit()
if MODE == "check": print(F[F.day == sys.argv[3]].round(2).to_string(index=False)); sys.exit()
X1, X2 = float(sys.argv[3]), float(sys.argv[4]); rng = np.random.default_rng(38)
def gap(mask, X):
    s, k = X[mask], X[~mask]; return k.R.mean() - s.R.mean(), s, k
res = {}
for name, mask in ((f"NP1 skip when the open is in the outer {X1:g} of the night on A2's side", F.pos >= 1 - X1), (f"NP2 skip at outer {X2:g}", F.pos >= 1 - X2), (f"NP0 skip at the outer {X1:g} on the OTHER side (control)", F.pos <= X1)):
    g, s, k = gap(mask, F); a = gap(mask[~F.late], F[~F.late]); b = gap(mask[F.late], F[F.late]); res[name[:3]] = g
    print(f"{name}: skipped {len(s)} avg {s.R.mean():+.3f} net {s.R.sum():+.2f} | kept {len(k)} avg {k.R.mean():+.3f} net {k.R.sum():+.2f} | gap (kept - skipped) {g:+.3f} | before {MID}: gap {a[0]:+.3f} (skipped {len(a[1])}) | from: gap {b[0]:+.3f} (skipped {len(b[1])}) | A2 all {F.R.sum():+.2f} -> kept {k.R.sum():+.2f}")
    if name.startswith("NP1"):
        K = [s.R.mean() < 0 and g >= 0.30, a[0] > 0 and b[0] > 0, None, None]; m = mask.values; Rv = F.R.values; c = 0
        for _ in range(10000):
            p_ = rng.permutation(m); c += (Rv[~p_].mean() - Rv[p_].mean()) >= g
        pval = c / 10000
K[2] = res["NP1"] > res["NP0"]; K[3] = pval < 0.10
print(f"(R = engine A2 R after costs 1.0 + 0.1) NP1 gap shuffle p {pval:.4f} | NP0 gap {res['NP0']:+.3f}"); print("KILL LINES NP1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
