"""Idea SR (journal/2015-idea-SR-after-the-stop.md): after A2's stop is hit before 11:00 London, trade from the next M5 bar's open.
SR1 against A2's side, stop 40, out 12:00 | SR2 against, out 16:00 | SR3 A2's own side again, out 12:00 (control). usage: python bt/after_stop.py END count | check DATE | test"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 40; H = pd.Timedelta(hours=1); M = pd.Timedelta(minutes=5)
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
rows = []
for r in t[t.reason == "sl"].itertuples():
    d = pd.Timestamp(r.tag, tz="UTC"); x = m5[(m5.time >= d + 8 * H) & (m5.time < d + 12 * H)]; s = int(r.side)
    hit = x[(x.low <= r.sl) if s > 0 else (x.high + 1e-4 >= r.sl)]          # first M5 bar that touches the stop (ask side for a short)
    if hit.empty: continue
    t_in = hit.time.iloc[0] + M
    if t_in <= d + 11 * H and t_in in set(m5.time): rows.append(dict(day=r.tag, a2side=s, a2stop=r.sl, hit=hit.time.iloc[0], t_in=t_in))
F = pd.DataFrame(rows); half = len(F) // 2; F["second"] = F.index >= half
if MODE == "count":
    print(f"A2 trades {len(t)} | full stops {int((t.reason == 'sl').sum())} | stopped with an entry bar at or before 11:00: {len(F)} | first half {half} ({F.day.iloc[0]}..{F.day.iloc[half - 1]}) | second half {len(F) - half} ({F.day.iloc[half]}..{F.day.iloc[-1]}) | before 04-07: {int((F.day < '2015-04-07').sum())}"); sys.exit()
def trade(r, side, xh, costs=None):
    d = pd.Timestamp(r.day, tz="UTC"); x = m5[(m5.time >= r.t_in) & (m5.time <= d + xh * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= d + xh * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    tr = acct.trades[-1]; return tr["pnl"] / RISK, tr["reason"], tr["entry"], tr["exit"]
if MODE == "check":
    r = F[F.day == sys.argv[3]].iloc[0]; print(f"{r.day}: A2 side {r.a2side}, stop {r.a2stop:.5f} touched in the {r.hit.strftime('%H:%M')} candle -> entry at the {r.t_in.strftime('%H:%M')} open")
    if len(sys.argv) > 4: print("SR1:", trade(r, -r.a2side, 12), "| SR3:", trade(r, r.a2side, 12))
    sys.exit()
def dd(q): eq = q.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
avg = {}
for name, sg, xh in (("SR1 against, out 12:00", -1, 12), ("SR2 against, out 16:00", -1, 16), ("SR3 same side again, out 12:00", 1, 12)):
    R = pd.Series([trade(r, sg * r.a2side, xh)[0] for r in F.itertuples()]); W = [trade(r, sg * r.a2side, xh)[1] for r in F.itertuples()]; Rs = pd.Series([trade(r, sg * r.a2side, xh, (2.0, 0.5))[0] for r in F.itertuples()]); avg[name[:3]] = R.mean()
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | full stops {W.count('sl')} | first half {R[~F.second].sum():+.2f} | second half {R[F.second].sum():+.2f} | without best 2 {R.sum() - R.nlargest(2).sum():+.2f} | stressed avg {Rs.mean():+.3f} | max DD {dd(R):.2f}R")
    if name.startswith("SR1"): K = [R.mean() >= 0.10, R[~F.second].sum() > 0 and R[F.second].sum() > 0, R.sum() - R.nlargest(2).sum() > 0, None, Rs.mean() > 0, dd(R) <= 6.0]
K[3] = avg["SR1"] > avg["SR3"]; print("KILL LINES SR1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
