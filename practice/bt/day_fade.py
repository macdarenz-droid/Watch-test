"""Idea DF (journal/2015-idea-DF-big-days-are-not-followed.md; setup and kill test written first): at 08:00 London trade AGAINST yesterday's body
(22:00 close minus the previous 22:00 close), stop 40 pips, out 21:00. DF1 every day; DF2 body >= 40 pips; DF3 body >= 80 pips. Judged before 2015-06-08.
Engine Account for costs. usage: python bt/day_fade.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END = sys.argv[1]; RISK, SL = 125.0, 40; H = pd.Timedelta(hours=1); CUT, MID = "2015-06-08", "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
a2 = ta.groupby("tag").R.sum(); cl = {}
for d in sorted(set(m5.time.dt.normalize())):
    x = m5[(m5.time >= d - 2 * H) & (m5.time < d + 22 * H)]
    if len(x) > 100 and d.weekday() < 5: cl[d] = x.close.iloc[-1]
cl = pd.Series(cl); body = (cl.diff() / PIP)
def run(costs=None):
    rows = []
    for i in range(2, len(cl)):
        d = cl.index[i]; yb = body.iloc[i - 1]
        if not np.isfinite(yb) or yb == 0: continue
        side = -1 if yb > 0 else 1; x = m5[(m5.time >= d + 8 * H) & (m5.time <= d + 21 * H)]
        if x.empty or x.time.iloc[0] != d + 8 * H: continue
        acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()   # as bt/ideas.py does
        for _, bar in x.iterrows():
            if bar.time == d + 8 * H: acct.market(side, round(RISK / (SL * 10), 3), sl=bar.open - side * SL * PIP, tag=d.strftime("%Y-%m-%d"))
            if acct.positions and bar.time >= d + 21 * H: acct.close()
            acct.on_bar(bar)
        if acct.positions: acct.close(); acct.on_bar(x.iloc[-1])
        t = acct.trades[-1]; rows.append(dict(day=d.strftime("%Y-%m-%d"), side=side, yb=yb, R=t["pnl"] / RISK, why=t["reason"], entry=t["entry"], exit=t["exit"]))
    return pd.DataFrame(rows)
T = run(); S = run((2.0, 0.5))
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; r = T[T.day == d].iloc[0]; print(f"{d}: yesterday's body {r.yb:+.1f} pips -> {'BUY' if r.side > 0 else 'SELL'} {r.entry:.5f} -> {r.why} {r.exit:.5f} {r.R:+.2f}R"); sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
avg = {}
for name, X in (("DF1 every day", 0), ("DF2 body >= 40 pips", 40), ("DF3 body >= 80 pips", 80)):
    t = T[T.yb.abs() >= X]; s = S[S.yb.abs() >= X]; J = t[t.day < CUT].reset_index(drop=True); SJ = s[s.day < CUT]; st = t[t.day >= CUT]; e = J.day < MID
    daily = J.set_index("day").R; c = daily.corr(a2.reindex(daily.index)); avg[name[:3]] = J.R.mean()
    print(f"{name}: JUDGED {len(J)} trades | avg {J.R.mean():+.3f}R | net {J.R.sum():+.2f} | wins {(J.R > 0).mean():.0%} | full stops {(J.why == 'sl').mean():.0%} | before {MID}: {int(e.sum())} avg {J.R[e].mean():+.3f} net {J.R[e].sum():+.2f} | {MID}..06-05: {int((~e).sum())} avg {J.R[~e].mean():+.3f} net {J.R[~e].sum():+.2f}")
    print(f"     without its 3 best {J.R.sum() - J.R.nlargest(3).sum():+.2f} | max DD {dd(J.R):.2f}R | stressed avg {SJ.R.mean():+.3f} | corr with A2 {c:+.2f} || studied window (NOT judged): {len(st)} trades avg {st.R.mean():+.3f} net {st.R.sum():+.2f}")
    K = [J.R.mean() >= 0.10, J.R[e].sum() > 0 and J.R[~e].sum() > 0, J.R.sum() - J.R.nlargest(3).sum() > 0, dd(J.R) <= 8.0, SJ.R.mean() >= 0.05, len(J) >= 60]
    print("     KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
print(f"K7 dose: DF1 {avg['DF1']:+.3f} -> DF2 {avg['DF2']:+.3f} -> DF3 {avg['DF3']:+.3f}: {'PASS' if avg['DF2'] >= avg['DF1'] and avg['DF3'] >= avg['DF2'] else 'FAIL'}")
