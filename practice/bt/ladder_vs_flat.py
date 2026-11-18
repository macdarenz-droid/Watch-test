"""Idea LF (journal/2015-idea-LF-ladder-against-flat.md; lines written first): the half/full ladder against flat full and flat half.
Machinery of bt/sizing_growth.py with the half step as a switch; drawdown, time under water and recovery added.
usage: python bt/ladder_vs_flat.py END [--regress BAL0 HW0]"""
import sys, io, contextlib, os, runpy
import numpy as np
END = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__)); N, DAYS, BLOCK, STOPAT = 2000, 500, 5, 7.0
argv = sys.argv; sys.argv = ["day_cushion.py", END, "--none"]
with contextlib.redirect_stdout(io.StringIO()): g = runpy.run_path(os.path.join(here, "day_cushion.py"))
sys.argv = argv; r = g["t"].R.values; S = g["S"]; EX = (S.worstR - S.engR).dropna().values
def draw(R, mode, rng):
    if mode == "plain": return rng.choice(R, size=(N, DAYS))
    nb = DAYS // BLOCK; st = rng.integers(0, len(R), size=(N, nb)); idx = (st[:, :, None] + np.arange(BLOCK)[None, None, :]) % len(R); return R[idx.reshape(N, DAYS)]
def fills(D):
    rng = np.random.default_rng(77); D = D.copy(); m = D <= -0.95; D[m] = D[m] + rng.choice(EX, size=m.sum()); return D
def sim(D, RISK, ladder, BAL0, HW0):
    bal = np.full(N, BAL0); hw = np.full(N, HW0); paid = np.zeros(N); alive = np.ones(N, bool); breach = np.zeros(N, bool); stop = np.zeros(N, bool); low = np.full(N, BAL0)
    half = ((hw - bal) >= 3.0) & ladder; maxdd = hw - bal; uw = np.zeros(N); longest = np.zeros(N); rec = np.full(N, np.nan); start_under = (hw - bal) > 0
    for i in range(DAYS):
        rk = np.where(half, RISK / 2, RISK); pl = np.where(alive, D[:, i] * rk, 0.0); day5 = alive & (pl <= -5.0 * (100 + bal) / 100); bal = bal + pl
        low = np.minimum(low, bal); b = alive & ((bal <= -10.0) | day5); breach |= b; alive &= ~b
        newhigh = alive & (bal >= hw); rec = np.where(np.isnan(rec) & newhigh & start_under, i + 1, rec)
        hw = np.where(alive, np.maximum(hw, bal), hw); dd = hw - bal; maxdd = np.maximum(maxdd, np.where(alive | stop | breach, dd, 0))
        uw = np.where(alive & (dd > 0), uw + 1, 0); longest = np.maximum(longest, uw)
        s = alive & (dd >= STOPAT); stop |= s; alive &= ~s
        half = (((dd >= 3.0) | (half & (bal < hw))) & ladder) if ladder else half
        if (i + 1) % 10 == 0:
            ok = alive & (bal > 0) & ~half; req = np.where(bal < 4.0, bal / 2, bal - 4.0); req = np.where(ok, req, 0.0); bal = bal - req; paid = paid + req; hw = hw - req
    mine = paid * 250 * 0.8
    return dict(stop=stop.mean() * 100, breach=breach.mean() * 100, low=low.min(), dd=np.median(maxdd), uw=np.median(longest), mine=np.median(mine),
                r60=100 * np.mean(rec <= 60), r120=100 * np.mean(rec <= 120), r250=100 * np.mean(rec <= 250), rmed=np.nanmedian(rec) if np.isfinite(rec).any() else float("nan"))
POL = {"LF1 ladder 0.50% / 0.25%": (0.5, True), "LF2 flat full 0.50%": (0.5, False), "LF3 flat half 0.25%": (0.25, False)}
if "--regress" in sys.argv:
    b0, h0 = float(sys.argv[3]), float(sys.argv[4])
    for mode in ("plain", "block"):
        a = sim(fills(draw(r - r.mean() + 0.18, mode, np.random.default_rng(41))), 0.5, True, b0, h0); print(f"{mode}: own stop {a['stop']:.1f}% | breached {a['breach']:.2f}% | lowest {a['low']:+.2f}% | MY payout median ${a['mine']:,.0f}")
    sys.exit()
print(f"list to {END}: {len(r)} trades | {N} runs x {DAYS} days | stop at {STOPAT}% under the high-water")
res = {}
for state, (b0, h0) in (("FRESH (0%, 0%)", (0.0, 0.0)), ("NOW (-2.302%, +1.028%)", (-2.3016, 1.0278))):
    print("== start " + state + " ==")
    for mu in (0.18, 0.10, 0.0):
        for mode in ("plain", "block"):
            D = fills(draw(r - r.mean() + mu, mode, np.random.default_rng(41)))
            for k, (risk, lad) in POL.items():
                a = sim(D, risk, lad, b0, h0); res[(state[:3], mu, mode, k[:3])] = a
                rec = f" | new high-water within 60 / 120 / 250 days {a['r60']:.0f}% / {a['r120']:.0f}% / {a['r250']:.0f}% (median day {a['rmed']:.0f})" if state.startswith("NOW") else ""
                print(f"   edge {mu:+.2f}R {mode:5s} {k}: own stop {a['stop']:.1f}% | breach {a['breach']:.2f}% | median max DD {a['dd']:.2f}% | median longest under water {a['uw']:.0f} days | MY payout median ${a['mine']:,.0f}{rec}")
M = ("plain", "block"); g_ = lambda st, mu, m, k, f: res[(st, mu, m, k)][f]
K1 = all(g_(st, mu, m, "LF2", "stop") - g_(st, mu, m, "LF1", "stop") >= 5 for st in ("FRE", "NOW") for mu in (0.0, 0.10) for m in M)
K2 = all(g_("FRE", mu, m, "LF1", "dd") < g_("FRE", mu, m, "LF2", "dd") for mu in (0.18, 0.10, 0.0) for m in M)
k3 = min(g_("FRE", 0.18, m, "LF1", "mine") / g_("FRE", 0.18, m, "LF2", "mine") for m in M); K3 = k3 >= 0.80
k4 = min(g_("NOW", 0.18, m, "LF1", "r250") / g_("NOW", 0.18, m, "LF2", "r250") for m in M); K4 = k4 >= 0.60
k5a = min(g_("FRE", 0.18, m, "LF1", "mine") / g_("FRE", 0.18, m, "LF3", "mine") for m in M); k5b = max(g_("FRE", 0.0, m, "LF1", "stop") - g_("FRE", 0.0, m, "LF3", "stop") for m in M); K5 = k5a >= 1.25 and k5b <= 10
print(f"LINES FOR THE LADDER: K1 protection {'PASS' if K1 else 'FAIL'} | K2 depth {'PASS' if K2 else 'FAIL'} | K3 price {100*k3:.0f}% of flat full {'PASS' if K3 else 'FAIL'} | K4 recovery {100*k4:.0f}% of flat full's 250-day rate {'PASS' if K4 else 'FAIL'} | K5 against flat half: payout x{k5a:.2f}, stop +{k5b:.1f} points {'PASS' if K5 else 'FAIL'}")
