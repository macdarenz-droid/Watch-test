"""Phase 2 odds from reshuffling my OWN live trade results (sim/trades.csv). No price data, no strategy variant.
One trade per day. Pass at +5% (>= 5 trading days). Breach at -10%. My plan's brakes: at -4% risk drops to 0.5% until a new phase high; at -6% I stop ("brake stop")."""
import numpy as np, pandas as pd, os
t = pd.read_csv(os.path.join(os.path.dirname(__file__), "..", "sim", "trades.csv"), parse_dates=["entry_time"])
t["R"] = t.pnl / ((t.sl - t.entry).abs() * t.lots * 1e5)
allR = t.R.values; feb = t[(t.entry_time >= "2015-02-01") & (t.entry_time < "2015-03-01")].R.values
sets = {f"A all {len(allR)} live ({allR.mean():+.2f}R)": allR, f"B February ({feb.mean():+.2f}R)": feb, "C February, zero edge": feb - feb.mean(), "D February, -0.10R": feb - feb.mean() - 0.10}
N, DAYS = 20_000, 60
def run(R, risk, start=0.0, brakes=True, seed=3):
    rng = np.random.default_rng(seed); draws = rng.choice(R, size=(N, DAYS))
    bal = np.full(N, start); peak = np.full(N, max(start, 0.0)); braked = np.zeros(N, bool)
    state = np.zeros(N, int)        # 0 running, 1 passed, 2 brake stop, 3 breach
    when = np.full(N, DAYS + 1)
    for d in range(DAYS):
        live = state == 0
        r = np.where(braked & brakes, 0.5, risk)
        bal = np.where(live, bal + draws[:, d] * r, bal)
        peak = np.maximum(peak, bal)
        if brakes:
            braked = np.where(bal <= -4, True, braked); braked = np.where(bal >= peak, False, braked) & (bal < peak)
        new_pass = live & (bal >= 5) & (d + 1 >= 5)
        new_breach = live & (bal <= -10)
        new_stop = live & brakes & (bal <= -6) & ~new_breach
        for m, code in ((new_pass, 1), (new_breach, 3), (new_stop, 2)):
            state = np.where(m & (state == 0), code, state); when = np.where(m & (when > DAYS), d + 1, when)
    out = {}
    for h in (20, 40, 60):
        out[h] = (100 * ((state == 1) & (when <= h)).mean(), 100 * ((state == 2) & (when <= h)).mean(), 100 * ((state == 3) & (when <= h)).mean())
    med = np.median(when[state == 1]) if (state == 1).any() else float("nan")
    return out, med
print("pass% / brake-stop% / breach% within 20, 40, 60 trading days | median days to pass (among passers)")
for name, R in sets.items():
    print(name)
    for risk in (0.5, 0.75, 1.0):
        o, med = run(R, risk)
        print(f"   {risk:4.2f}%: " + " | ".join(f"{h}d {o[h][0]:5.1f} / {o[h][1]:4.1f} / {o[h][2]:4.2f}" for h in (20, 40, 60)) + f" | median {med:.0f}")
print("\nFrom where I stand today (phase 2 at -0.75% after one loss), 0.75% only:")
for name, R in sets.items():
    o, med = run(R, 0.75, start=-0.75)
    print(f"   {name:28s} " + " | ".join(f"{h}d {o[h][0]:5.1f} / {o[h][1]:4.1f} / {o[h][2]:4.2f}" for h in (20, 40, 60)) + f" | median {med:.0f}")
print("\nNo brakes, true breach only (-10%), 60 days:")
for name, R in sets.items():
    print(f"   {name:28s} " + " | ".join(f"{risk:.2f}%: breach {run(R, risk, brakes=False)[0][60][2]:5.2f}" for risk in (0.5, 0.75, 1.0)))
