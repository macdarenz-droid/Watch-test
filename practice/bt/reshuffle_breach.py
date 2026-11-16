"""1,000 reshuffled orders of my OWN trade list per cell: two-phase challenge (+8% then +5%, min 5 days each), 42 trading days, one trade a day.
Counts: passed both / breached 5% daily / breached 10% max / stopped by my -6% brake, with brakes on and off. No price data."""
import numpy as np, pandas as pd, os
t = pd.read_csv(os.path.join(os.path.dirname(__file__), "..", "sim", "trades.csv"), parse_dates=["entry_time"])
t["R"] = t.pnl / ((t.sl - t.entry).abs() * t.lots * 1e5)
full = t.R.values; fwd = t[t.entry_time >= "2015-03-01"].R.values; feb = t[(t.entry_time >= "2015-02-01") & (t.entry_time < "2015-03-01")].R.values
N, DAYS = 1000, 42
def orders(R, replace, seed):
    rng = np.random.default_rng(seed)
    return np.array([rng.choice(R, size=DAYS, replace=True) if replace else rng.permutation(R)[:DAYS] for _ in range(N)])
def run(seq, risk, brakes):
    out = dict(passed=0, daily=0, maxloss=0, brake=0, days=[])
    for s in seq:
        phase, bal, td, br, peak, done = 1, 0.0, 0, False, 0.0, None
        for i, r in enumerate(s):
            rk = 0.5 if (br and brakes) else risk; pnl = r * rk
            if pnl <= -5.0: done = "daily"; break
            bal += pnl; td += 1; peak = max(peak, bal)
            if bal <= -10.0: done = "maxloss"; break
            if brakes and bal <= -6.0: done = "brake"; break
            br = (bal <= -4.0) or (br and bal < peak)
            tgt = 8.0 if phase == 1 else 5.0
            if bal >= tgt and td >= 5:
                if phase == 2: done = "passed"; out["days"].append(i + 1); break
                phase, bal, td, br, peak = 2, 0.0, 0, False, 0.0
        if done: out[done] += 1
    return out
lists = (("L1 full list, 53 trades (avg %+.2fR), shuffled" % full.mean(), full, False), ("L2 forward only, %d trades (avg %+.2fR)" % (len(fwd), fwd.mean()), fwd, True), ("L3 zero edge (February shifted to 0R)", feb - feb.mean(), True))
for name, R, rep in lists:
    seq = orders(R, rep, 21); print(name); 
    ws = max((sum(1 for _ in g) for k, g in __import__("itertools").groupby(s < 0) if k) for s in seq[:1000] for _ in [0]) if False else None
    streak = max(max((len(list(g)) for k, g in __import__("itertools").groupby(s < 0) if k), default=0) for s in seq)
    print(f"   longest losing streak seen in any of the {N} orders: {streak} trades")
    for risk in (0.5, 0.75, 1.0):
        a = run(seq, risk, True); b = run(seq, risk, False); med = int(np.median(a["days"])) if a["days"] else None
        print(f"   {risk:4.2f}%  brakes ON: passed {a['passed']:4d} | daily breach {a['daily']} | max breach {a['maxloss']} | brake-stop {a['brake']:3d} | median days to pass {med}   ||  brakes OFF: passed {b['passed']:4d} | daily {b['daily']} | max breach {b['maxloss']}")
