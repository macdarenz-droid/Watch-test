"""Idea ST (journal/2015-idea-ST-stop-rules-against-worst-streaks.md; lines written first): the daily stop and the size rule against a continuing slide,
from a given state. ST1 ladder of full stops; ST2 slide at chosen true edges; ST3 the same with jump days. Machinery of bt/guard_dead_edge.py
(without jumps it must reproduce it). usage: python bt/stop_stress.py END BAL0 HW0 [edges]   (BAL0, HW0 in % of 25,000)"""
import sys, io, contextlib, os, runpy
import numpy as np
END, BAL0, HW0 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]); EDGES = [float(x) for x in sys.argv[4].split(",")] if len(sys.argv) > 4 else [0.0, -0.10, -0.20]
here = os.path.dirname(os.path.abspath(__file__)); N, DAYS, BLOCK, RISK, STOPAT, JUMP, PJ = 2000, 500, 5, 0.5, 7.0, -3.07, 1 / 20
sys.argv = ["day_cushion.py", END, "--none"]
with contextlib.redirect_stdout(io.StringIO()): g = runpy.run_path(os.path.join(here, "day_cushion.py"))
r = g["t"].R.values; S = g["S"]; EX = (S.worstR - S.engR).dropna().values
def draw(R, mode, rng):
    if mode == "plain": return rng.choice(R, size=(N, DAYS))
    nb = DAYS // BLOCK; st = rng.integers(0, len(R), size=(N, nb)); idx = (st[:, :, None] + np.arange(BLOCK)[None, None, :]) % len(R); return R[idx.reshape(N, DAYS)]
def fills(D):
    rng = np.random.default_rng(77); D = D.copy(); m = D <= -0.95; D[m] = D[m] + rng.choice(EX, size=m.sum()); return D
def jumps(D):
    rng = np.random.default_rng(99); D = D.copy(); m = (D <= -0.95) & (rng.random(D.shape) < PJ); D[m] = JUMP; return D, m.sum() / D.size
def sim(D):
    bal = np.full(N, BAL0); hw = np.full(N, HW0); paid = np.zeros(N); alive = np.ones(N, bool); breach = np.zeros(N, bool); stop = np.zeros(N, bool); low = np.full(N, BAL0)
    half = (hw - bal) >= 3.0; stopday = np.full(N, np.nan); worstday = 0.0; day5 = np.zeros(N, bool)
    for i in range(DAYS):
        rk = np.where(half, RISK / 2, RISK); pl = np.where(alive, D[:, i] * rk, 0.0); pct = -pl / (100 + bal) * 100; worstday = max(worstday, pct.max()); d5 = alive & (pct >= 5.0)
        bal = bal + pl; low = np.minimum(low, bal); b = alive & ((bal <= -10.0) | d5); day5 |= d5; breach |= b; alive &= ~b
        hw = np.where(alive, np.maximum(hw, bal), hw); dd = hw - bal
        s = alive & (dd >= STOPAT); stop |= s; stopday[s] = i + 1; alive &= ~s; half = (dd >= 3.0) | (half & (bal < hw))
        if (i + 1) % 10 == 0:
            ok = alive & (bal > 0) & ~half; req = np.where(bal < 4.0, bal / 2, bal - 4.0); req = np.where(ok, req, 0.0); bal = bal - req; paid = paid + req; hw = hw - req
    q = lambda p: np.nanpercentile(stopday, p) if stop.any() else float("nan")
    return dict(breach=breach.mean() * 100, day5=day5.mean() * 100, stop=stop.mean() * 100, low=low.min(), med=q(50), p10=q(10), worst=worstday, s60=100 * np.nanmean(np.where(stop, stopday <= 60, False)), s120=100 * np.nanmean(np.where(stop, stopday <= 120, False)))
# ST1 the ladder
fs = fills(np.full((1, 4000), -1.0))[0]; stopR = -fs.mean(); bal = 25000 * (1 + BAL0 / 100); hw = 25000 * (1 + HW0 / 100); l3, l7 = hw * 0.97, hw * 0.93; n = 0; half = bal <= l3; nh = None
print(f"state: balance ${bal:,.2f}, high-water ${hw:,.2f}, half-size line ${l3:,.2f}, stop line ${l7:,.2f} | list to {END}: {len(r)} trades | mean real-fill full stop {stopR:.3f}R (worst extra {EX.min():.2f}R)")
while bal > l7:
    cost = 125 * stopR * (0.5 if half else 1.0); bal -= cost; n += 1
    if not half and bal <= l3: half = True; nh = n
lastjump = bal + 125 * stopR * 0.5 - 125 * 3.07 * 0.5
print(f"ST1 LADDER: half size after full stop number {nh}; trading stops after stop number {n} in a row at ${bal:,.2f} = ${bal - 22500:,.2f} above $22,500 ({(bal - 22500) / 250:.2f}%) | if the last stop is a jump day: ${lastjump:,.2f} = ${lastjump - 22500:,.2f} above | pips through the stop to breach from there at half size ($1.6 a pip): {(lastjump - 22500) / 1.6:.0f}")
K1 = (lastjump - 22500) >= 625; res = []
for label, jp in (("ST2 SLIDE", False), ("ST3 SLIDE WITH JUMP DAYS (1 in 20 full stops = -3.07R)", True)):
    print(label + ":")
    for mode in ("plain", "block"):
        for mu in EDGES:
            D = fills(draw(r - r.mean() + mu, mode, np.random.default_rng(41))); share = 0.0
            if jp: D, share = jumps(D)
            a = sim(D); res.append((jp, a))
            print(f"   {mode} edge {mu:+.2f}R (after fills{' and jumps' if jp else ''} {D.mean():+.3f}R{f', jump days {share:.2%} of all days' if jp else ''}): BREACH {a['breach']:.2f}% (5%-day {a['day5']:.2f}%) | own 7% stop {a['stop']:.1f}% (median day {a['med']:.0f}, 10th pct day {a['p10']:.0f}; within 60 days {a['s60']:.0f}%, within 120 days {a['s120']:.0f}%) | lowest balance {a['low']:+.2f}% | worst single day {a['worst']:.2f}%")
K2 = all(a["breach"] <= 0.5 and a["low"] >= -9 for jp, a in res if not jp); K3 = all(a["breach"] <= 1.0 and a["low"] >= -9.5 for jp, a in res if jp); K4 = all(a["worst"] < 2.5 for _, a in res)
print(f"KILL LINES: K1 ladder {'PASS' if K1 else 'FAIL'} | K2 slide {'PASS' if K2 else 'FAIL'} | K3 slide with jumps {'PASS' if K3 else 'FAIL'} | K4 worst day {'PASS' if K4 else 'FAIL'}")
