"""Funded risk-size test: 0.5 / 1.0 / 1.5 % on the A2 engine trade list (all history to END), 2,000 x 500-day reshuffles, plain and 5-trade blocks.
Static -10% line; my payout plan every 10 days; brakes ON (half size at -3% from high-water, stop at -5%) and OFF. All amounts in % of $25,000.
usage: python bt/risk_size.py END"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; N, DAYS, BLOCK = 2000, 500, 5
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
r = t.groupby("tag").R.sum(); full = r.values; nojan = r[r.index >= "2015-02-01"].values
print(f"A2 list to {END}: {len(full)} trades avg {full.mean():+.3f}R sd {full.std(ddof=1):.2f} worst {full.min():+.2f} | without January: {len(nojan)} trades avg {nojan.mean():+.3f}R")
SC = [("E1 full list", full), ("E2 no January", nojan), ("E3 planning +0.18R", full - full.mean() + 0.18), ("E4 zero edge", full - full.mean()), ("E5 -0.10R", full - full.mean() - 0.10)]
def draw(R, mode, rng):
    if mode == "plain": return rng.choice(R, size=(N, DAYS))
    nb = DAYS // BLOCK; st = rng.integers(0, len(R), size=(N, nb)); idx = (st[:, :, None] + np.arange(BLOCK)[None, None, :]) % len(R)   # blocks of consecutive real trades (wraps at the end)
    return R[idx.reshape(N, DAYS)]
def sim(D, risk, brakes):
    bal = np.zeros(N); hw = np.zeros(N); paid = np.zeros(N); half = np.zeros(N, bool); alive = np.ones(N, bool); breach = np.zeros(N, bool); stop = np.zeros(N, bool)
    maxdd = np.zeros(N); low = np.zeros(N); months = []; mstart = np.zeros(N)
    for i in range(DAYS):
        rk = np.where(half & brakes, risk / 2, risk); bal = bal + np.where(alive, D[:, i] * rk, 0.0)
        low = np.minimum(low, bal); b = alive & (bal <= -10.0); breach |= b; alive &= ~b
        hw = np.where(alive, np.maximum(hw, bal), hw); dd = hw - bal; maxdd = np.maximum(maxdd, dd)
        if brakes:
            s = alive & (dd >= 5.0); stop |= s; alive &= ~s
            half = (dd >= 3.0) | (half & (bal < hw))
        if (i + 1) % 21 == 0: months.append(np.where(alive | True, bal + paid - mstart, np.nan)); mstart = bal + paid
        if (i + 1) % 10 == 0:
            ok = alive & (bal > 0) & ~(half & brakes); req = np.where(bal < 4.0, bal / 2, bal - 4.0); req = np.where(ok, req, 0.0)
            bal = bal - req; paid = paid + req; hw = np.where(ok, bal, hw)
    M = np.array(months).T      # runs x months, % of 25k (months after a stop/breach are 0 and are excluded below)
    return dict(breach=breach.mean() * 100, stop=stop.mean() * 100, dd50=np.median(maxdd), dd95=np.percentile(maxdd, 95), ddmax=maxdd.max(), paid=np.median(paid), M=M, ended=breach | stop, low=low.min())
for mode in ("plain", "block"):
    print(f"\n===== reshuffle: {mode} ({N} runs x {DAYS} days) =====")
    for name, R in SC:
        rng = np.random.default_rng(41); D = draw(R, mode, rng)
        print(f"{name} (avg {R.mean():+.2f}R)")
        for risk in (0.5, 1.0, 1.5):
            a = sim(D, risk, False); b = sim(D, risk, True); m = a["M"][~a["ended"]].ravel() * 250 if (~a["ended"]).any() else np.array([np.nan])
            print(f"  {risk:.1f}%  OFF: breach {a['breach']:5.1f}% | maxDD med {a['dd50']:4.1f}% p95 {a['dd95']:4.1f}% worst {a['ddmax']:4.1f}% | month $ p5 {np.percentile(m,5):+7.0f} med {np.median(m):+6.0f} p95 {np.percentile(m,95):+6.0f} losing {100*(m<0).mean():3.0f}% | paid med {a['paid']:5.1f}% (${a['paid']*250*0.8:,.0f} mine)"
                  f"  ||  ON: breach {b['breach']:4.1f}% stop {b['stop']:5.1f}% maxDD p95 {b['dd95']:4.1f}% lowest {b['low']:+5.1f}% paid med {b['paid']:5.1f}%")
