"""Idea LM2 out of sample (journal/2015-idea-LM2-out-of-sample.md): lively pre-bell hour (07:00-08:00 London range >= 30 pips) -> 08:00 market AGAINST the hour's
net move (LM2) or with it (LM1, control), stop 40, out 12:00. Judged only from 2015-05-07. usage: python bt/lively_fade_oos.py END count | old | test [DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 40; H = pd.Timedelta(hours=1); START, HALF = "2015-05-07", "2015-06-16"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
rows = []
for ds in sorted(set(ta.tag)):
    d = pd.Timestamp(ds, tz="UTC"); h = m5[(m5.time >= d + 7 * H) & (m5.time < d + 8 * H)]; o8 = m5[m5.time == d + 8 * H]
    if len(h) < 12 or o8.empty: continue
    rng = (h.high.max() - h.low.min()) / PIP; net = (o8.open.iloc[0] - h.open.iloc[0]) / PIP
    if rng >= 30 and net != 0: rows.append(dict(day=ds, rng=rng, net=net, hour=1 if net > 0 else -1))
F = pd.DataFrame(rows); NEW = F[F.day >= START].reset_index(drop=True); OLD = F[F.day < START].reset_index(drop=True)
def trade(day, side, costs=None):
    d = pd.Timestamp(day, tz="UTC"); x = m5[(m5.time >= d + 8 * H) & (m5.time <= d + 12 * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= d + 12 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"]
if MODE == "count": print(f"lively mornings with a net move: to 05-06 {len(OLD)} | unseen {START}..: {len(NEW)} ({NEW.day.iloc[0]}..{NEW.day.iloc[-1]}) | first half (before {HALF}) {int((NEW.day < HALF).sum())} | second half {int((NEW.day >= HALF).sum())} | hour up {int((NEW.hour > 0).sum())} down {int((NEW.hour < 0).sum())}"); sys.exit()
if MODE == "old": r = np.array([trade(x.day, -x.hour)[0] for x in OLD.itertuples()]); print(f"MECHANICS on the May sample (days to 05-06): {len(r)} trades, net {r.sum():+.2f}R, avg {r.mean():+.3f}R (May's journal: 35 trades, +7.11R, +0.203R)"); sys.exit()
NEW["R"] = [trade(x.day, -x.hour)[0] for x in NEW.itertuples()]; NEW["why"] = [trade(x.day, -x.hour)[1] for x in NEW.itertuples()]; NEW["chase"] = [trade(x.day, x.hour)[0] for x in NEW.itertuples()]; NEW["Rs"] = [trade(x.day, -x.hour, (2.0, 0.5))[0] for x in NEW.itertuples()]
r = NEW.R; dd = (r.cumsum().cummax().clip(lower=0) - r.cumsum()).max(); h1, h2 = r[NEW.day < HALF], r[NEW.day >= HALF]
print(f"LM2 UNSEEN {NEW.day.iloc[0]}..{NEW.day.iloc[-1]}: trades {len(r)} | wins {(r > 0).mean():.0%} | avg {r.mean():+.3f}R (+-{2 * r.std(ddof=1) / np.sqrt(len(r)):.2f}) | net {r.sum():+.2f} | full stops {int((NEW.why == 'sl').sum())}")
print(f"   first half {len(h1)}: {h1.sum():+.2f} | second half {len(h2)}: {h2.sum():+.2f} | without best 3 {r.sum() - r.nlargest(3).sum():+.2f} | max DD {dd:.2f}R | stressed avg {NEW.Rs.mean():+.3f} | LM1 chase on the same mornings: avg {NEW.chase.mean():+.3f} net {NEW.chase.sum():+.2f}")
K = [r.mean() >= 0.15, h1.sum() > 0 and h2.sum() > 0, r.sum() - r.nlargest(3).sum() > 0, dd <= 5, NEW.Rs.mean() > 0, r.mean() > NEW.chase.mean()]
print("   KILL LINES: " + " | ".join(f"U{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)) + f" | judgeable (>= 25): {len(r) >= 25}")
if len(sys.argv) > 3: print(NEW[NEW.day == sys.argv[3]].round(2).to_string(index=False))
