"""Idea SG: growth against risk for three sizes under today's money rules (journal/2015-idea-SG-size-for-growth.md; lines S1-S5 written first).
Machinery of bt/guard_dead_edge.py with the risk per trade as a parameter and the firm's 5% daily line added.
usage: python bt/sizing_growth.py END BAL0 HW0 [risks] [edges]"""
import sys, io, contextlib, os, runpy
import numpy as np
END, BAL0, HW0 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
RISKS = [float(x) for x in sys.argv[4].split(",")] if len(sys.argv) > 4 else [0.50, 0.75, 1.00]
EDGES = [float(x) for x in sys.argv[5].split(",")] if len(sys.argv) > 5 else [0.0, 0.10, 0.18, 0.20]
here = os.path.dirname(os.path.abspath(__file__)); N, DAYS, BLOCK, STOPAT = 2000, 500, 5, 7.0
sys.argv = ["day_cushion.py", END, "--none"]
with contextlib.redirect_stdout(io.StringIO()): g = runpy.run_path(os.path.join(here, "day_cushion.py"))
r = g["t"].R.values; S = g["S"]; EX = (S.worstR - S.engR).dropna().values; WORST = float(S.worstR.min())
def draw(R, mode, rng):
    if mode == "plain": return rng.choice(R, size=(N, DAYS))
    nb = DAYS // BLOCK; st = rng.integers(0, len(R), size=(N, nb)); idx = (st[:, :, None] + np.arange(BLOCK)[None, None, :]) % len(R); return R[idx.reshape(N, DAYS)]
def fills(D):
    rng = np.random.default_rng(77); D = D.copy(); m = D <= -0.95; D[m] = D[m] + rng.choice(EX, size=m.sum()); return D
def sim(D, RISK):
    bal = np.full(N, BAL0); hw = np.full(N, HW0); paid = np.zeros(N); alive = np.ones(N, bool); breach = np.zeros(N, bool); stop = np.zeros(N, bool); low = np.full(N, BAL0)
    half = (hw - bal) >= 3.0; alive300 = None; hd = 0
    for i in range(DAYS):
        rk = np.where(half, RISK / 2, RISK); pl = np.where(alive, D[:, i] * rk, 0.0); hd += (half & alive).sum()
        day5 = alive & (pl <= -5.0 * (100 + bal) / 100); bal = bal + pl
        low = np.minimum(low, bal); b = alive & ((bal <= -10.0) | day5); breach |= b; alive &= ~b
        hw = np.where(alive, np.maximum(hw, bal), hw); dd = hw - bal
        s = alive & (dd >= STOPAT); stop |= s; alive &= ~s; half = (dd >= 3.0) | (half & (bal < hw))
        if (i + 1) % 10 == 0:
            ok = alive & (bal > 0) & ~half; req = np.where(bal < 4.0, bal / 2, bal - 4.0); req = np.where(ok, req, 0.0); bal = bal - req; paid = paid + req; hw = hw - req
        if i + 1 == 300: alive300 = alive.mean() * 100
    mine = paid * 250 * 0.8          # 1% of $25,000 = $250; my 80%
    return dict(breach=breach.mean() * 100, stop=stop.mean() * 100, low=low.min(), alive300=alive300, half=100 * hd / (N * DAYS),
                mine=np.median(mine), mine10=np.percentile(mine, 10), mine90=np.percentile(mine, 90), mean=mine.mean(), tot=np.median(bal + paid - BAL0))
print(f"list to {END}: {len(r)} trades, mean {r.mean():+.3f}R | worst real-fill day in the history {WORST:+.2f}R | start balance {BAL0:+.3f}% high-water {HW0:+.3f}% | half at 3%, stop at {STOPAT}% | {N} runs x {DAYS} days")
out = {}
for mode in ("plain", "block"):
    print(f"== {mode} ==")
    for mu in EDGES:
        D = fills(draw(r - r.mean() + mu, mode, np.random.default_rng(41)))
        for R in RISKS:
            a = sim(D, R); out[(mode, mu, R)] = a
            print(f"edge {mu:+.2f}R risk {R:.2f}%: breached {a['breach']:.2f}% | own stop {a['stop']:.1f}% | trading after 300 days {a['alive300']:.1f}% | lowest {a['low']:+.2f}% | half-size days {a['half']:.0f}% | MY payout median ${a['mine']:,.0f} (10th-90th ${a['mine10']:,.0f}-${a['mine90']:,.0f}; mean ${a['mean']:,.0f}) | median account result {a['tot']:+.1f}%")
M = ("plain", "block")
if 0.50 in RISKS and set((0.0, 0.10, 0.18)) <= set(EDGES):
    for R in RISKS:
        s1 = max(out[(m, e, R)]["breach"] for m in M for e in EDGES) <= 0.5 and min(out[(m, e, R)]["low"] for m in M for e in EDGES) >= -9
        s2 = max(out[(m, 0.18, R)]["stop"] for m in M) <= 5.0; s3 = min(out[(m, 0.10, R)]["alive300"] for m in M) >= 85
        g_ = min(out[(m, 0.18, R)]["mine"] / out[(m, 0.18, 0.50)]["mine"] for m in M); s4 = g_ >= 1.25; JUMP = 3.07; wd = JUMP * R; s5 = wd <= 2.5   # S5 as worked in the pre-registration: the hypothetical jump day of idea DC (-3.07R), not the worst real fill (printed in the header)
        print(f"LINES risk {R:.2f}%: S1 breach {'PASS' if s1 else 'FAIL'} | S2 own stop at +0.18R {'PASS' if s2 else 'FAIL'} | S3 +0.10R trading after 300 days {'PASS' if s3 else 'FAIL'} | S4 growth x{g_:.2f} {'PASS' if s4 else ('FAIL' if R != 0.50 else 'base')} | S5 worst day {wd:.2f}% {'PASS' if s5 else 'FAIL'}")
