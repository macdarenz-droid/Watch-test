"""Idea WS: the TS simulation (bt/tail_stress.py, corrected tail, unchanged list / shift / seeds / payout rule) with the personal stop and the size as parameters.
REF stop 5% size 0.50 | WS1 stop 7% size 0.50 | WS2 stop 5% size 0.40 | WS3 stop 7% size 0.40. usage: python bt/wider_stop.py END"""
import sys, io, contextlib, os, runpy
import numpy as np
END = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__)); sys.argv = ["tail_stress.py", END]
with contextlib.redirect_stdout(io.StringIO()): g = runpy.run_path(os.path.join(here, "tail_stress.py"))
draw, tail, N, DAYS, R, JUMP = g["draw"], g["tail"], g["N"], g["DAYS"], g["R"], g["JUMP"]
def sim(D, risk, stopat):       # tail_stress.sim with two parameters; nothing else changed
    bal = np.zeros(N); hw = np.zeros(N); paid = np.zeros(N); half = np.zeros(N, bool); alive = np.ones(N, bool); breach = np.zeros(N, bool); stop = np.zeros(N, bool); low = np.zeros(N); hd = 0
    for i in range(DAYS):
        rk = np.where(half, risk / 2, risk); bal = bal + np.where(alive, D[:, i] * rk, 0.0); hd += (half & alive).sum()
        low = np.minimum(low, bal); b = alive & (bal <= -10.0); breach |= b; alive &= ~b
        hw = np.where(alive, np.maximum(hw, bal), hw); dd = hw - bal
        s = alive & (dd >= stopat); stop |= s; alive &= ~s; half = (dd >= 3.0) | (half & (bal < hw))
        if (i + 1) % 10 == 0:
            ok = alive & (bal > 0) & ~half; req = np.where(bal < 4.0, bal / 2, bal - 4.0); req = np.where(ok, req, 0.0); bal = bal - req; paid = paid + req; hw = hw - req
    return dict(breach=breach.mean() * 100, stop=stop.mean() * 100, paid=np.median(paid), low=low.min(), half=100 * hd / (N * DAYS))
V = (("REF stop 5% size 0.50", 0.5, 5.0), ("WS1 stop 7% size 0.50", 0.5, 7.0), ("WS2 stop 5% size 0.40", 0.4, 5.0), ("WS3 stop 7% size 0.40", 0.4, 7.0)); T = (("T1", 1, 0), ("T2", 1, 1 / 92), ("T3", 1, 2 / 92)); out = {}
print(f"list to {END}: {len(R)} trades, shifted avg {R.mean():+.3f}R, jump {JUMP:+.2f}R")
for mode in ("plain", "block"):
    D0 = draw(mode, np.random.default_rng(41)); print(f"== {mode} ==")
    for tn, k, p in T:
        D = tail(D0, k, p)
        for vn, risk, st in V:
            a = sim(D, risk, st); out[(mode, tn, vn[:3])] = a
            print(f"{tn} {vn}: breached {a['breach']:.1f}% | own stop {a['stop']:.1f}% | median payout {a['paid']:.1f}% (${a['paid']*250*0.8:,.0f} mine) | lowest balance {a['low']:+.2f}% | days at half size {a['half']:.0f}%")
M = ("plain", "block"); o = lambda m, t, v, f: out[(m, t, v)][f]
k1 = max(o(m, t, "WS1", "breach") for m in M for t in ("T1", "T2", "T3")); lowest = min(o(m, t, "WS1", "low") for m in M for t in ("T1", "T2", "T3"))
k2 = min(o(m, "T2", "REF", "stop") - o(m, "T2", "WS1", "stop") for m in M)
dom = [(m, t) for m in M for t in ("T1", "T2") if o(m, t, "WS2", "stop") < o(m, t, "WS1", "stop") and o(m, t, "WS2", "paid") > o(m, t, "WS1", "paid")]
print(f"KILL LINES for WS1: K1 breached <= 1.0% (worst {k1:.1f}%) and no run below -9% (lowest {lowest:+.2f}%): {'PASS' if k1 <= 1.0 and lowest >= -9 else 'FAIL'} | K2 own stop under T2 at least 10 points under REF (smallest gap {k2:.1f}): {'PASS' if k2 >= 10 else 'FAIL'} | K3 WS2 better on both in {len(dom)} of 4 cases {dom}: {'PASS' if len(dom) < 4 else 'FAIL'}")
