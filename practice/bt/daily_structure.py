"""Idea HL (journal/2015-idea-HL-against-the-daily-structure.md), built from bt/no_chase_hour.py: A2 filter. against = consecutive steps
going back from yesterday of rising lows (A2 sell) / falling highs (A2 buy); with = falling lows (sell) / rising highs (buy).
Skip A2 when against >= N (HL1/HL2) or with >= N (HL0 control). usage: python bt/daily_structure.py END count | check DATE | test N1 N2"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, PIP
END, MODE = sys.argv[1], sys.argv[2]; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = t.groupby("tag").agg(R=("R", "sum"), side=("side", "first")).reset_index(); rows = []
lab = (m5.time + 2 * H).dt.normalize(); D = m5.assign(lab=lab).groupby("lab").agg(hi=("high", "max"), lo=("low", "min"), n=("open", "size"))
D = D[(D.index.weekday < 5) & (D.n >= 200)]; DL = list(D.index)
def steps(d, side, way):
    i = DL.index(d) if d in DL else None
    if i is None or i < 4: return None
    c = 0
    for k in (1, 2, 3):
        a_, b_ = D.iloc[i - k], D.iloc[i - k - 1]
        up_lo, dn_hi, dn_lo, up_hi = a_.lo > b_.lo, a_.hi < b_.hi, a_.lo < b_.lo, a_.hi > b_.hi
        ok = (up_lo if side < 0 else dn_hi) if way == "against" else (dn_lo if side < 0 else up_hi)
        if not ok: break
        c += 1
    return c
for r in A.itertuples():
    d = pd.Timestamp(r.tag, tz="UTC")
    ag, wi = steps(d, r.side, "against"), steps(d, r.side, "with")
    if ag is not None: rows.append(dict(day=r.tag, R=r.R, side=r.side, ag=ag, wi=wi, late=r.tag >= MID))
F = pd.DataFrame(rows)
if MODE == "count":
    print(f"A2 days with both candles: {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]})")
    for N in (1, 2, 3): s_ = F.ag >= N; c = F.wi >= N; print(f"N = {N}: skip (against) {int(s_.sum())} = {s_.mean():.0%} (before {MID} {int((s_ & ~F.late).sum())}, from {int((s_ & F.late).sum())}) | control skip (with) {int(c.sum())}")
    sys.exit()
if MODE == "check": print(F[F.day == sys.argv[3]].round(2).to_string(index=False)); sys.exit()
X1, X2 = int(sys.argv[3]), int(sys.argv[4]); rng = np.random.default_rng(38)
def gap(mask, X):
    s, k = X[mask], X[~mask]; return k.R.mean() - s.R.mean(), s, k
res = {}
for name, mask in ((f"HL1 skip when steps against A2 >= {X1}", F.ag >= X1), (f"HL2 skip at >= {X2}", F.ag >= X2), (f"HL0 skip when steps WITH A2 >= {X1} (control)", F.wi >= X1)):
    g, s, k = gap(mask, F); a = gap(mask[~F.late], F[~F.late]); b = gap(mask[F.late], F[F.late]); res[name[:3]] = g
    print(f"{name}: skipped {len(s)} avg {s.R.mean():+.3f} net {s.R.sum():+.2f} | kept {len(k)} avg {k.R.mean():+.3f} net {k.R.sum():+.2f} | gap (kept - skipped) {g:+.3f} | before {MID}: gap {a[0]:+.3f} (skipped {len(a[1])}) | from: gap {b[0]:+.3f} (skipped {len(b[1])}) | A2 all {F.R.sum():+.2f} -> kept {k.R.sum():+.2f}")
    if name.startswith("HL1"):
        K = [s.R.mean() < 0 and g >= 0.30, a[0] > 0 and b[0] > 0, None, None]; m = mask.values; Rv = F.R.values; c = 0
        for _ in range(10000):
            p_ = rng.permutation(m); c += (Rv[~p_].mean() - Rv[p_].mean()) >= g
        pval = c / 10000
K[2] = res["HL1"] > res["HL0"]; K[3] = pval < 0.10
print(f"(R = engine A2 R after costs 1.0 + 0.1) HL1 gap shuffle p {pval:.4f} | HL0 gap {res['HL0']:+.3f}"); print("KILL LINES HL1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
