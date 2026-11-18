"""Idea GD: the size rule (half at 3% under the high-water, stop at 7%, 0.50%) when the true edge is 0 / -0.10 / +0.10 / +0.18R, from a given start state.
Machinery of bt/wider_stop.py and bt/tail_stress.py: engine A2 list shifted to the edge, real-fill extras added to full stops, payout rule, high-water lowered by payouts.
usage: python bt/guard_dead_edge.py END BAL0 HW0 [edges]   (BAL0, HW0 in % of 25,000; `0 0 0.18` with END 2015-05-16 is the regression against WS1 T1)"""
import sys, io, contextlib, os, runpy
import numpy as np
END, BAL0, HW0 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]); EDGES = [float(x) for x in sys.argv[4].split(",")] if len(sys.argv) > 4 else [0.0, -0.10, 0.10, 0.18]
here = os.path.dirname(os.path.abspath(__file__)); N, DAYS, BLOCK, RISK, STOPAT = 2000, 500, 5, 0.5, 7.0
sys.argv = ["day_cushion.py", END, "--none"]
with contextlib.redirect_stdout(io.StringIO()): g = runpy.run_path(os.path.join(here, "day_cushion.py"))
r = g["t"].R.values; S = g["S"]; EX = (S.worstR - S.engR).dropna().values
def draw(R, mode, rng):
    if mode == "plain": return rng.choice(R, size=(N, DAYS))
    nb = DAYS // BLOCK; st = rng.integers(0, len(R), size=(N, nb)); idx = (st[:, :, None] + np.arange(BLOCK)[None, None, :]) % len(R); return R[idx.reshape(N, DAYS)]
def fills(D):
    rng = np.random.default_rng(77); D = D.copy(); m = D <= -0.95; D[m] = D[m] + rng.choice(EX, size=m.sum()); return D
def sim(D):
    bal = np.full(N, BAL0); hw = np.full(N, HW0); paid = np.zeros(N); alive = np.ones(N, bool); breach = np.zeros(N, bool); stop = np.zeros(N, bool); low = np.full(N, BAL0)
    half = (hw - bal) >= 3.0; stopday = np.full(N, np.nan); hd = 0; alive300 = None
    for i in range(DAYS):
        rk = np.where(half, RISK / 2, RISK); bal = bal + np.where(alive, D[:, i] * rk, 0.0); hd += (half & alive).sum()
        low = np.minimum(low, bal); b = alive & (bal <= -10.0); breach |= b; alive &= ~b
        hw = np.where(alive, np.maximum(hw, bal), hw); dd = hw - bal
        s = alive & (dd >= STOPAT); stop |= s; stopday[s] = i + 1; alive &= ~s; half = (dd >= 3.0) | (half & (bal < hw))
        if (i + 1) % 10 == 0:
            ok = alive & (bal > 0) & ~half; req = np.where(bal < 4.0, bal / 2, bal - 4.0); req = np.where(ok, req, 0.0); bal = bal - req; paid = paid + req; hw = hw - req
        if i + 1 == 300: alive300 = alive.mean() * 100
    return dict(breach=breach.mean() * 100, stop=stop.mean() * 100, low=low.min(), alive300=alive300, medday=np.nanmedian(stopday) if stop.any() else float("nan"), half=100 * hd / max(alive.sum() * 0 + (N * DAYS), 1),
                lost=np.median((bal + paid - BAL0)[stop]) if stop.any() else float("nan"), paid=np.median(paid), endmed=np.median(bal + paid - BAL0))
print(f"list to {END}: {len(r)} trades | start balance {BAL0:+.3f}% high-water {HW0:+.3f}% (drawdown {HW0-BAL0:.3f}%) | stop at {STOPAT}% under the high-water, half size from 3%, {RISK}%")
out = {}
for mode in ("plain", "block"):
    print(f"== {mode} ==")
    for mu in EDGES:
        D = fills(draw(r - r.mean() + mu, mode, np.random.default_rng(41))); a = sim(D); out[(mode, mu)] = a
        print(f"edge {mu:+.2f}R (list after real fills {D.mean():+.3f}R): breached {a['breach']:.1f}% | own stop {a['stop']:.1f}% (median day {a['medday']:.0f}) | still trading after 300 days {a['alive300']:.1f}% | lowest balance {a['low']:+.2f}% | result incl. payouts when stopped, median {a['lost']:+.2f}% | median result after 500 days incl. payouts {a['endmed']:+.2f}% | median payout {a['paid']:.1f}% | days at half size {a['half']:.0f}% of all run-days")
if set((0.0, -0.10, 0.10)) <= set(EDGES):
    M = ("plain", "block"); k1 = max(out[(m, e)]["breach"] for m in M for e in (0.0, -0.10)) <= 1.0 and min(out[(m, e)]["low"] for m in M for e in (0.0, -0.10)) >= -9
    k2 = min(out[(m, -0.10)]["stop"] for m in M) >= 90; k3 = min(out[(m, 0.10)]["alive300"] for m in M) >= 85
    print(f"KILL LINES: K1 safety: {'PASS' if k1 else 'FAIL'} | K2 stops a -0.10R rule in >= 90%: {'PASS' if k2 else 'FAIL'} | K3 +0.10R still trading after 300 days in >= 85%: {'PASS' if k3 else 'FAIL'}")
