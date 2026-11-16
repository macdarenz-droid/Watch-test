"""Idea SZ: when to restore full size after the -3% half-size step. 2,000 x 500-day reshuffles of my own trade results, the SAME draws for every rule.
Rules: SZ0 restore at a new high-water (current) | SZ1 restore when drawdown < 1.5% | SZ2 half size only while drawdown >= 3% | SZ3 no half-size step.
All amounts in % of $25,000. usage: python bt/brake_rule.py END [--check]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; N, DAYS, RISK = 2000, 500, 0.5
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): e = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
allA = e.groupby("tag").R.sum().values
t = pd.read_csv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sim", "trades.csv"), parse_dates=["entry_time"]); t = t[t.entry_time >= "2015-03-02"]
live = (t.pnl / ((t.sl - t.entry).abs() * t.lots * 1e5)).values
LISTS = [(f"L live, {len(live)} trades ({live.mean():+.2f}R)", live), ("P planning edge (+0.18R)", allA - allA.mean() + 0.18), ("Z zero edge", allA - allA.mean())]
def sim(D, rule):
    n = D.shape[0]; bal = np.zeros(n); hw = np.zeros(n); paid = np.zeros(n); half = np.zeros(n, bool); alive = np.ones(n, bool); stopday = np.full(n, np.nan); low = np.zeros(n); halfdays = np.zeros(n); livedays = np.zeros(n)
    for i in range(D.shape[1]):
        rk = np.where(half, RISK / 2, RISK); livedays += alive; halfdays += alive & half
        bal = bal + np.where(alive, D[:, i] * rk, 0.0); low = np.minimum(low, bal)
        hw = np.where(alive, np.maximum(hw, bal), hw); dd = hw - bal
        s = alive & (dd >= 5.0); stopday[s] = i + 1; alive &= ~s
        if rule == "SZ0": half = (dd >= 3.0) | (half & (bal < hw))
        elif rule == "SZ1": half = (dd >= 3.0) | (half & (dd >= 1.5))
        elif rule == "SZ2": half = dd >= 3.0
        else: half = np.zeros(n, bool)
        if (i + 1) % 10 == 0:
            ok = alive & (bal > 0) & ~half; req = np.where(bal < 4.0, bal / 2, bal - 4.0); req = np.where(ok, req, 0.0)
            bal = bal - req; paid = paid + req; hw = hw - req
    st = ~np.isnan(stopday)
    return dict(stop=100 * st.mean(), stopday=np.nanmedian(stopday) if st.any() else float("nan"), paid=np.median(paid), paid_mean=paid.mean(), low=low.min(), half=100 * halfdays.sum() / livedays.sum())
if "--check" in sys.argv:      # mechanics on one hand-made sequence: 7 full stops, then winners
    seq = np.array([[-1.0] * 7 + [1.0] * 12 + [0.0] * 481])
    for rule in ("SZ0", "SZ1", "SZ2", "SZ3"):
        bal = 0.0; hw = 0.0; half = False; out = []
        for r in seq[0][:19]:
            rk = RISK / 2 if half else RISK; bal += r * rk; hw = max(hw, bal); dd = hw - bal
            half = {"SZ0": dd >= 3.0 or (half and bal < hw), "SZ1": dd >= 3.0 or (half and dd >= 1.5), "SZ2": dd >= 3.0, "SZ3": False}[rule]
            out.append(f"{bal:+.2f}{'h' if half else ''}")
        print(rule, " ".join(out), "| sim says:", {k: round(v, 2) for k, v in sim(seq, rule).items() if k in ("low", "half", "paid")})
    sys.exit()
print(f"{N} runs x {DAYS} days at {RISK}% | columns: own -5% stop reached (% of runs) | median day of the stop | median total payout (% of account) | mean payout | lowest balance in any run | share of days at half size")
for name, R in LISTS:
    rng = np.random.default_rng(53); D = rng.choice(R, size=(N, DAYS)); base = None; print(name)
    for rule in ("SZ0", "SZ1", "SZ2", "SZ3"):
        a = sim(D, rule)
        if base is None: base = a
        print(f"   {rule}: stop {a['stop']:5.1f}% ({a['stop']-base['stop']:+.1f}) | stop day {a['stopday']:5.0f} | payout median {a['paid']:6.1f}% ({100*(a['paid']/base['paid']-1) if base['paid'] else float('nan'):+.1f}%) mean {a['paid_mean']:6.1f}% | lowest {a['low']:+.2f}% | half size on {a['half']:4.1f}% of days")
