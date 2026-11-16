"""Last-stretch sizing: reshuffle my OWN live results from the state of Mon 2015-03-23 07:00 (phase 2 at +3.08%, target +5%). One trade a day, brakes on. No price data."""
import numpy as np, pandas as pd, os
t = pd.read_csv(os.path.join(os.path.dirname(__file__), "..", "sim", "trades.csv"), parse_dates=["entry_time"])
t["R"] = t.pnl / ((t.sl - t.entry).abs() * t.lots * 1e5)
feb = t[(t.entry_time >= "2015-02-01") & (t.entry_time < "2015-03-01")].R.values; mar = t[t.entry_time >= "2015-03-01"].R.values
pics = {f"February ({feb.mean():+.2f}R)": feb, f"February, realistic costs ({feb.mean()-0.05:+.2f}R)": feb - 0.05, f"March forward, {len(mar)} lived ({mar.mean():+.2f}R)": mar,
        "zero edge": feb - feb.mean(), "-0.10R": feb - feb.mean() - 0.10}
N, DAYS, START = 20_000, 60, (25770.80 - 25000) / 250
def run(R, risk, seed=4):
    rng = np.random.default_rng(seed); d = rng.choice(R, size=(N, DAYS)); bal = np.full(N, START); peak = bal.copy(); br = np.zeros(N, bool); st = np.zeros(N, int); when = np.full(N, DAYS + 1)
    for i in range(DAYS):
        live = st == 0; r = np.where(br, 0.5, risk); bal = np.where(live, bal + d[:, i] * r, bal); peak = np.maximum(peak, bal)
        br = np.where(bal <= -4, True, br) & (bal < peak)
        for m, c in ((live & (bal >= 5), 1), (live & (bal <= -10), 3), (live & (bal <= -6), 2)):
            st = np.where(m & (st == 0), c, st); when = np.where(m & (when > DAYS), i + 1, when)
    f = lambda h: 100 * ((st == 1) & (when <= h)).mean()
    return f(10), f(20), 100 * (st == 2).mean(), 100 * (st == 3).mean(), np.median(when[st == 1]) if (st == 1).any() else float("nan")
print("finish within 10 days % / within 20 days % / my -6% brake within 60 days % / true breach % / median days")
for name, R in pics.items():
    print(name)
    for risk in (0.5, 0.75, 1.0):
        a = run(R, risk); print(f"   {risk:4.2f}%: {a[0]:5.1f} / {a[1]:5.1f} / {a[2]:5.2f} / {a[3]:4.2f} / {a[4]:.0f}")
