"""Idea RT (journal/2015-idea-RT-round-number-touch.md): first touch per London day of a 50-pip level (RT2: 100-pip levels only), 08:00-17:00 signals,
fresh approach (15+ pips away in the hour before). Next M5 open: away from the level (bounce) or through it (break), stop 30, out 2 hours later.
One position at a time. usage: python bt/round_touch.py END count | check DATE [x] | test"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 30; MID = "2015-04-07"; H = pd.Timedelta(hours=1); M = pd.Timedelta(minutes=5)
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")].reset_index(drop=True); times = set(m5.time)
def signals(step):
    out = []; busy = None
    for d in sorted(set(m5.time.dt.normalize())):
        if d.weekday() > 4: continue
        x = m5[(m5.time >= d + 7 * H) & (m5.time < d + 17 * H)].reset_index(drop=True); used = set()
        for i in range(12, len(x)):
            b, p = x.iloc[i], x.iloc[i - 1]
            if b.time < d + 8 * H: continue
            lv_up = np.floor(b.high / (step * PIP)) * step * PIP; lv_dn = np.ceil(b.low / (step * PIP)) * step * PIP; hits = []
            if p.close < lv_up <= b.high: hits.append((round(lv_up, 5), 1))     # reached from below
            if p.close > lv_dn >= b.low: hits.append((round(lv_dn, 5), -1))     # reached from above
            for lv, frm in hits:
                if lv in used: continue
                used.add(lv); w = x.iloc[i - 12:i]
                if (frm > 0 and (lv - w.low.min()) / PIP < 15) or (frm < 0 and (w.high.max() - lv) / PIP < 15): continue
                t_in = b.time + M; t_out = t_in + 2 * H
                if t_in not in times or (busy is not None and t_in < busy): continue
                out.append(dict(day=d.strftime("%Y-%m-%d"), t_touch=b.time, level=lv, frm=frm, t_in=t_in, t_out=t_out)); busy = t_out
    return pd.DataFrame(out)
S1 = signals(50); S2 = signals(100)
if MODE == "count":
    for n, S in (("RT1 50-pip levels", S1), ("RT2 100-pip levels", S2)):
        dc = S.day.value_counts(); print(f"{n}: trades {len(S)} | before {MID}: {int((S.day < MID).sum())} | from: {int((S.day >= MID).sum())} | on {S.day.nunique()} days | 5 busiest days hold {int(dc.head(5).sum())} | from below {int((S.frm > 0).sum())}, from above {int((S.frm < 0).sum())}")
    sys.exit()
def trade(r, side, costs=None):
    x = m5[(m5.time >= r.t_in) & (m5.time <= r.t_out)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= r.t_out: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
if MODE == "check":
    X = S1[S1.day == sys.argv[3]]; print(X[["t_touch", "level", "frm", "t_in", "t_out"]].to_string(index=False))
    if len(sys.argv) > 4 and len(X): r = X.iloc[0]; print("first touch -> bounce:", trade(r, -r.frm), "| break:", trade(r, r.frm))
    sys.exit()
def dd(q): eq = q.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
rng_ = np.random.default_rng(91); keep = {}
for name, S, sg in (("RT1 bounce, 50-pip levels", S1, -1), ("RT2 bounce, 100-pip levels", S2, -1), ("RT0 break on RT1's signals", S1, 1)):
    J = S.copy(); res = [trade(r, sg * r.frm) for r in J.itertuples()]; J["R"] = [z[0] for z in res]; J["why"] = [z[1] for z in res]; J["Rs"] = [trade(r, sg * r.frm, (2.0, 0.5))[0] for r in J.itertuples()]
    R = J.R.reset_index(drop=True); late = (J.day >= MID).values; top = J.day.value_counts().head(5).index; nb = J[~J.day.isin(top)].R; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | full stops {int((J.why == 'sl').sum())} | before {MID}: {R[~late].sum():+.2f} | from: {R[late].sum():+.2f} | without best 5 {R.sum() - R.nlargest(5).sum():+.2f} | without 5 busiest days {nb.sum():+.2f} | stressed avg {J.Rs.mean():+.3f} | max DD {dd(R):.2f}R")
    if name.startswith("RT1"): K = [R.mean() >= 0.10, R[~late].sum() > 0 and R[late].sum() > 0, (R.sum() - R.nlargest(5).sum() > 0) and nb.sum() > 0, None, J.Rs.mean() > 0, dd(R) <= 8.0, None]
diff = (keep["RT1"] - keep["RT0"]).values; p = (np.abs((rng_.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.05; K[6] = keep["RT2"].mean() >= keep["RT1"].mean()
print(f"bounce minus break {diff.mean():+.3f}R, sign-flip p {p:.4f}"); print("KILL LINES RT1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
