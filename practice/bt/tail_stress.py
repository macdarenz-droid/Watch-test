"""Idea TS: the funded survival sim of bt/risk_size.py (corrected high-water, brakes ON, 0.50%) with the down-tail of idea DC added.
T0 base; T1 every full stop gets the extra slippage of a DC1 stop day added (corrected 05-14; OLD_FLAWED=1 gives the first run); T2 = T1 + a -3.07R-type jump day with chance 1/92; T3 chance 2/92.
List: engine A2 to END shifted to +0.18R (the tail is added after the shift). usage: python bt/tail_stress.py END"""
import sys, io, contextlib, os, runpy
import numpy as np, pandas as pd
END = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__)); N, DAYS, BLOCK, RISK = 2000, 500, 5, 0.5
sys.argv = ["day_cushion.py", END, "--none"]
with contextlib.redirect_stdout(io.StringIO()): g = runpy.run_path(os.path.join(here, "day_cushion.py"))
t, S, JUMP = g["t"], g["S"], g["w2"]; W = S.worstR.dropna().values; EX = (S.worstR - S.engR).dropna().values
r = t.R.values; R = r - r.mean() + 0.18
print(f"A2 list to {END}: {len(r)} trades avg {r.mean():+.3f}R -> shifted to {R.mean():+.3f}R | full stops in the list (<= -0.95R): {(R<=-0.95).sum()} | DC1 results: {len(W)}, avg {W.mean():+.3f}R, worst {W.min():+.2f}R | extras: avg {EX.mean():+.4f}R | jump day {JUMP:+.2f}R")
def draw(mode, rng):
    if mode == "plain": return rng.choice(R, size=(N, DAYS))
    nb = DAYS // BLOCK; st = rng.integers(0, len(R), size=(N, nb)); idx = (st[:, :, None] + np.arange(BLOCK)[None, None, :]) % len(R); return R[idx.reshape(N, DAYS)]
def tail(D, k, p):
    if k == 0: return D
    rng = np.random.default_rng(77); D = D.copy(); m = D <= -0.95
    if os.environ.get("OLD_FLAWED") == "1": D[m] = rng.choice(W, size=m.sum())      # first run (P7): replaced shifted stops by DC1 results = milder stops. Kept only as a record.
    else: D[m] = D[m] + rng.choice(EX, size=m.sum())                               # corrected 05-14: the same stop plus the extra slippage DC1 measured
    if p > 0: j = rng.random(D.shape) < p; D[j] = JUMP
    return D
def sim(D):                     # as bt/risk_size.py sim(), brakes ON, high-water lowered by the payout
    bal = np.zeros(N); hw = np.zeros(N); paid = np.zeros(N); half = np.zeros(N, bool); alive = np.ones(N, bool); breach = np.zeros(N, bool); stop = np.zeros(N, bool); low = np.zeros(N); worstday = 0.0; hd = 0
    for i in range(DAYS):
        rk = np.where(half, RISK / 2, RISK); ch = np.where(alive, D[:, i] * rk, 0.0); bal = bal + ch; worstday = min(worstday, ch.min()); hd += (half & alive).sum()
        low = np.minimum(low, bal); b = alive & (bal <= -10.0); breach |= b; alive &= ~b
        hw = np.where(alive, np.maximum(hw, bal), hw); dd = hw - bal
        s = alive & (dd >= 5.0); stop |= s; alive &= ~s; half = (dd >= 3.0) | (half & (bal < hw))
        if (i + 1) % 10 == 0:
            ok = alive & (bal > 0) & ~half; req = np.where(bal < 4.0, bal / 2, bal - 4.0); req = np.where(ok, req, 0.0); bal = bal - req; paid = paid + req; hw = hw - req
    return dict(breach=breach.mean() * 100, stop=stop.mean() * 100, paid=np.median(paid), low=low.min(), worstday=worstday, half=100 * hd / (N * DAYS))
SC = (("T0 base", 0, 0), ("T1 badly filled stops", 1, 0), ("T2 + jump day 1/92", 1, 1 / 92), ("T3 + jump day 2/92", 1, 2 / 92)); out = {}
for mode in ("plain", "block"):
    D0 = draw(mode, np.random.default_rng(41)); print(f"\n== {mode} reshuffle, {N} runs x {DAYS} days, 0.50%, size rule ON ==")
    for name, k, p in SC:
        D = tail(D0, k, p); a = sim(D); out[(mode, name[:2])] = a
        print(f"{name}: list avg {D.mean():+.3f}R, jump days per run {((D == JUMP).sum(1)).mean():.1f} | account line breached {a['breach']:.1f}% | own -5% stop {a['stop']:.1f}% | median payout {a['paid']:.1f}% (${a['paid']*250*0.8:,.0f} mine) | lowest balance any run {a['low']:+.1f}% | worst single day {a['worstday']:+.2f}% | days at half size {a['half']:.0f}%")
w = lambda f: max(f("plain"), f("block"))
k1 = w(lambda m: max(out[(m, x)]["breach"] for x in ("T1", "T2", "T3"))); k2 = w(lambda m: out[(m, "T2")]["stop"] - out[(m, "T0")]["stop"]); k3 = min(out[(m, "T2")]["paid"] / out[(m, "T0")]["paid"] for m in ("plain", "block"))
print(f"\nKILL LINES: K1 breach <= 1.0% (worst {k1:.1f}%): {'PASS' if k1 <= 1.0 else 'FAIL'} | K2 own-stop rise under T2 <= 5 points (worst +{k2:.1f}): {'PASS' if k2 <= 5 else 'FAIL'} | K3 T2 payout >= 80% of T0 (worst {100*k3:.0f}%): {'PASS' if k3 >= 0.8 else 'FAIL'}")
