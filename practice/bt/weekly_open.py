"""Idea WO (journal/2015-idea-WO-weekly-open.md; rule and kill lines pushed first). London time. Weekly open = open of the week's first M5 bar.
WO1 Tue-Fri 08:00, 30+ pips from the weekly open -> trade away from it, stop 40, out 20:00 | WO2 out 12:00 | WO3 side = Monday's 22:00 close vs weekly open (30+), out 20:00.
usage: python bt/weekly_open.py END count | check DATE | test"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 40; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
a2 = ta.set_index("tag").side
wk = (m5.time + pd.Timedelta(days=1)).dt.to_period("W-SUN").astype(str)   # Sunday evening bars belong to the week that follows
wopen = m5.groupby(wk).open.first(); wfirst = m5.groupby(wk).time.first(); rows = []
for d in sorted(set(m5.time.dt.normalize())):
    if d.weekday() not in (1, 2, 3, 4) or d + 8 * H not in op.index: continue
    w = str((d + pd.Timedelta(days=1)).to_period("W-SUN")); mon = d - pd.Timedelta(days=d.weekday()); x = m5[(m5.time >= mon) & (m5.time < mon + 22 * H)]
    if wfirst[w] > mon + 2 * H or x.empty: continue      # the week must start on Sunday evening / Monday early (no holiday-shortened start)
    dist = (op[d + 8 * H] - wopen[w]) / PIP; mdist = (x.close.iloc[-1] - wopen[w]) / PIP; ds = d.strftime("%Y-%m-%d")
    rows.append(dict(day=ds, wopen=wopen[w], o8=op[d + 8 * H], dist=dist, mdist=mdist, a2=int(a2[ds]) if ds in a2.index else 0, late=ds >= MID))
F = pd.DataFrame(rows)
VAR = {"WO1 away from the weekly open, out 20:00": (F.dist.abs() >= 30, np.sign(F.dist), 20), "WO2 the same, out 12:00": (F.dist.abs() >= 30, np.sign(F.dist), 12), "WO3 Monday's side, out 20:00": (F.mdist.abs() >= 30, np.sign(F.mdist), 20)}
if MODE == "check": print(F[F.day == sys.argv[3]].iloc[0].to_string()); sys.exit()
if MODE == "count":
    print(f"Tue-Fri days with a weekly open: {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]})")
    for k, (m, s, x) in VAR.items(): print(f"{k}: trades {int(m.sum())} | before {MID}: {int((m & ~F.late).sum())} | from {MID}: {int((m & F.late).sum())} | same side as A2: {int((m & (s == F.a2)).sum())} of {int((m & (F.a2 != 0)).sum())}")
    sys.exit()
def trade(day, side, xh, costs=None):
    d = pd.Timestamp(day, tz="UTC"); x = m5[(m5.time >= d + 8 * H) & (m5.time <= d + xh * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= d + xh * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    return acct.trades[-1]["pnl"] / RISK
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
for k, (m, s, xh) in VAR.items():
    J = F[m].copy(); J["side"] = s[m].astype(int); J["R"] = [trade(r.day, r.side, xh) for r in J.itertuples()]; J["O"] = [trade(r.day, -r.side, xh) for r in J.itertuples()]; J["Rs"] = [trade(r.day, r.side, xh, (2.0, 0.5)) for r in J.itertuples()]
    J = J.reset_index(drop=True); diff = (J.R - J.O).values; rng = np.random.default_rng(9); p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); sa = (J.side == J.a2).mean()
    print(f"{k}: trades {len(J)} | avg {J.R.mean():+.3f}R | net {J.R.sum():+.2f} | wins {(J.R > 0).mean():.0%} | before {MID}: {int((~J.late).sum())} net {J.R[~J.late].sum():+.2f} | from {MID}: {int(J.late.sum())} net {J.R[J.late].sum():+.2f} | without best 2 {J.R.sum() - J.R.nlargest(2).sum():+.2f} | vs opposite {diff.mean():+.3f}R p {p:.4f} | stressed avg {J.Rs.mean():+.3f} | max DD {dd(J.R):.2f}R | on A2's side {sa:.0%}")
    if k.startswith("WO1"):
        K = [J.R.mean() >= 0.10, J.R[~J.late].sum() > 0 and J.R[J.late].sum() > 0, J.R.sum() - J.R.nlargest(2).sum() > 0, diff.mean() > 0 and p < 0.05, J.Rs.mean() > 0, dd(J.R) <= 6.0, sa < 0.80]
        print("   KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
