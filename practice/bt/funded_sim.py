"""Funded account survival: 1,000 reshuffled orders x 500 trading days of my OWN trade results. Static -10% line, my brakes (half size at -3% from high-water, stop at -5%),
my payout policy every 10 trading days. All amounts in % of $25,000. No price data."""
import numpy as np, pandas as pd, os
t = pd.read_csv(os.path.join(os.path.dirname(__file__), "..", "sim", "trades.csv"), parse_dates=["entry_time"])
t["R"] = t.pnl / ((t.sl - t.entry).abs() * t.lots * 1e5)
full = t.R.values; fwd = t[t.entry_time >= "2015-03-01"].R.values; feb = t[(t.entry_time >= "2015-02-01") & (t.entry_time < "2015-03-01")].R.values
lists = ((f"L1 full, {len(full)} trades ({full.mean():+.2f}R)", full), (f"L2 forward only, {len(fwd)} ({fwd.mean():+.2f}R)", fwd), (f"L3 February at realistic costs ({feb.mean()-0.05:+.2f}R)", feb - 0.05),
         ("L4 zero edge", feb - feb.mean()), ("L5 -0.10R", feb - feb.mean() - 0.10))
N, DAYS = 1000, 500
def run(R, risk, brakes, seed=31):
    rng = np.random.default_rng(seed); D = rng.choice(R, size=(N, DAYS)); res = dict(breach=0, stop=0, alive=0, paid=[], stopday=[], negm=[])
    for s in D:
        bal, hw, paid, half, end, months, mstart = 0.0, 0.0, 0.0, False, None, [], 0.0
        for i, r in enumerate(s):
            rk = risk / 2 if (half and brakes) else risk
            bal += r * rk
            if bal <= -10.0: end = "breach"; break
            hw = max(hw, bal); dd = hw - bal
            if brakes and dd >= 5.0: end = "stop"; res["stopday"].append(i + 1); break
            half = dd >= 3.0 or (half and bal < hw)
            if (i + 1) % 21 == 0: months.append(bal + paid - mstart); mstart = bal + paid
            if (i + 1) % 10 == 0 and not half and bal > 0:
                req = bal / 2 if bal < 4.0 else bal - 4.0
                if bal >= 4.0 and bal / 2 > req: req = bal - 4.0
                bal -= req; paid += req; hw = bal
        res[end or "alive"] += 1; res["paid"].append(paid)
        if months: res["negm"].append(np.mean(np.array(months) < 0))
    return res
print("per 1,000 two-year runs: breached / ended by my -5% stop / alive after 500 days | median payout requested (% of 25k, and my 80% in $) | share of losing months | median day of the stop")
for name, R in lists:
    print(name)
    for risk in (0.25, 0.5, 0.75):
        a = run(R, risk, True); b = run(R, risk, False); mp = np.median(a["paid"])
        sd = int(np.median(a["stopday"])) if a["stopday"] else None
        print(f"   {risk:4.2f}%  brakes ON: {a['breach']:3d} / {a['stop']:4d} / {a['alive']:4d} | payout {mp:6.1f}% (${mp*250*0.8:,.0f}) | losing months {100*np.mean(a['negm']):3.0f}% | stop day {sd}   ||  brakes OFF: breached {b['breach']:4d}")
