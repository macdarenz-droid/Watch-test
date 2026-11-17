"""Idea FS: A2 with a fresher direction. FS1 sign(07:00 today - 07:00 three trading days ago); FS2 sign(07:00 today - the 22:00 close three trading days
back that A2 uses); FS3 = A2's direction but no trade when FS2 disagrees. Entry 08:00, 40 pip stop, exit 12:00; own simulator (bt/confirm_entry.py at X = 0).
usage: python bt/fresh_signal.py END [--check DATE]"""
import sys, os, runpy
import pandas as pd, numpy as np
END = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__)); argv0 = sys.argv[:]; PIP = 1e-4
sys.argv = ["wl_table.py", END]; g = runpy.run_path(os.path.join(here, "wl_table.py"), run_name="lib"); sys.argv = argv0
F, m5, t, cl = g["F"], g["m5"], g["t"], g["cl"]
days = list(F.index); a2side = {d: (1 if F.side[d] == "B" else -1) for d in days}
p07, ref = {}, {}
for d in days:
    dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time < dd_ + pd.Timedelta(hours=7)) & (m5.time >= dd_ - pd.Timedelta(hours=6))]; p07[d] = x.close.iloc[-1]
    c = cl[cl.index < dd_]; ref[d] = (c.iloc[-1], c.iloc[-4]) if len(c) >= 4 else (np.nan, np.nan)
def sides(k):
    out = {}
    for i, d in enumerate(days):
        s = a2side[d]
        if k == "FS1" and i >= 3: s = 1 if p07[d] > p07[days[i - 3]] else -1
        if k in ("FS2", "FS3") and not np.isnan(ref[d][1]): s = 1 if p07[d] > ref[d][1] else -1
        out[d] = s
    return out
def one(d, s, sp=1.0, sl=0.1):
    dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + pd.Timedelta(hours=8)) & (m5.time <= dd_ + pd.Timedelta(hours=12))]; B = x.open.iloc[0]
    fill = B + (sp + sl) * PIP if s > 0 else B - sl * PIP; stp = B - s * 40 * PIP; risk = abs(fill - stp)
    for b in x.itertuples():
        if b.time >= dd_ + pd.Timedelta(hours=12): ex = b.open - sl * PIP if s > 0 else b.open + (sp + sl) * PIP; return (ex - fill) * s / risk, False
        if (b.low <= stp) if s > 0 else (b.high + sp * PIP >= stp): ex = stp - sl * PIP if s > 0 else stp + sl * PIP; return (ex - fill) * s / risk, True
    return 0.0, False
base = pd.DataFrame({d: one(d, a2side[d]) for d in days}, index=["R", "stop"]).T; a = base.R.astype(float)
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; i = days.index(d)
    print(f"{d}: A2 close {ref[d][0]:.5f} vs close 3 back {ref[d][1]:.5f} = {(ref[d][0]-ref[d][1])/PIP:+.0f} pips -> {'BUY' if a2side[d]>0 else 'SELL'} | FS1 07:00 {p07[d]:.5f} vs 07:00 three days ago {p07[days[i-3]]:.5f} = {(p07[d]-p07[days[i-3]])/PIP:+.0f} -> {'BUY' if sides('FS1')[d]>0 else 'SELL'} | FS2 {p07[d]:.5f} vs {ref[d][1]:.5f} = {(p07[d]-ref[d][1])/PIP:+.0f} -> {'BUY' if sides('FS2')[d]>0 else 'SELL'}"); sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
late = a.index >= "2015-03-02"; eng = t.groupby("tag").R.sum()
print(f"baseline A2 on this simulator: {len(a)} days net {a.sum():+.2f} (engine {eng.sum():+.2f}; stop days identical: {bool((base.stop.astype(bool) == (t.groupby('tag').reason.agg(lambda x: (x=='sl').any()))).all())}) dd {dd(a):.2f} | before 03-02 {a[~late].sum():+.2f} | from 03-02 {a[late].sum():+.2f}")
res = {}
for k in ("FS1", "FS2"):
    sd = sides(k); r = pd.Series({d: one(d, sd[d])[0] for d in days}); df = r - a; diff = pd.Series({d: sd[d] != a2side[d] for d in days}); res[k] = (df.sum(), df[~late].sum(), df[late].sum(), dd(r), int(diff.sum()), r[diff].sum(), a[diff].sum())
    print(f"{k}: net {r.sum():+.2f} ({df.sum():+.2f} vs A2) | before 03-02 {df[~late].sum():+.2f} | from 03-02 {df[late].sum():+.2f} | dd {dd(r):.2f} | direction differs on {int(diff.sum())} days ({int((diff&late).sum())} lived): variant {r[diff].sum():+.2f}R, A2 {a[diff].sum():+.2f}R on them")
    print("     differing days (variant / A2): " + " ".join(f"{d[5:]}:{r[d]:+.2f}/{a[d]:+.2f}" for d in diff[diff].index))
sd = sides("FS2"); rem = pd.Series({d: sd[d] != a2side[d] for d in days}); f3 = a.where(~rem, 0.0)
print(f"FS3 (no trade when FS2 disagrees): removed {int(rem.sum())} trades averaging {a[rem].mean():+.3f}R (net {a[rem].sum():+.2f}) | rule net {f3.sum():+.2f} ({f3.sum()-a.sum():+.2f} vs A2) dd {dd(f3):.2f}")
r2 = res["FS2"]; K = [r2[0] >= 2.0, r2[1] >= 0 and r2[2] >= 1.0, r2[3] <= dd(a) + 0.5, r2[4] >= 10 and r2[5] > 0 and r2[5] > r2[6], res["FS1"][0] >= -1.0]
print("KILL LINES for FS2: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)) + f" || FS3 own line (removed avg < 0 and n >= 10): {'PASS' if a[rem].mean() < 0 and rem.sum() >= 10 else 'FAIL'}")
