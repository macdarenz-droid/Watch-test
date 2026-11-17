"""Idea SW (journal/2015-idea-SW-slow-A2.md; rule and kill lines pushed first). London time. Signal: 22:00 close vs the close N trading days earlier.
Entry 08:00 next trading day if flat; stop S pips, target 2S; time exit 12:00 on the Kth trading day after the entry day. One position at a time.
SW1 N=10 S=120 K=5 | SW2 N=3 S=120 K=5 | SW3 N=10 S=80 K=2.   usage: python bt/slow_a2.py END count | first | test"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK = 125.0; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")].reset_index(drop=True); cl = {}
for d in sorted(set(m5.time.dt.normalize())):
    x = m5[(m5.time >= d - 2 * H) & (m5.time < d + 22 * H)]
    if len(x) >= 200 and d.weekday() < 5: cl[d] = x.close.iloc[-1]
cl = pd.Series(cl); D = list(cl.index); bars = m5[m5.time >= D[11]]; REC = bars.to_dict("records")
def run(N, S, K, mirror=False, costs=None):
    acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account(); out = []; exit_at = None; info = None
    for bar in REC:
        t = bar["time"]; d = t.normalize(); bo = bar["open"]
        if not acct.positions and info is not None:
            tr = acct.trades[-1]; out.append(dict(info, R=tr["pnl"] / RISK, why=tr["reason"], exit=tr["exit"], exit_time=tr["exit_time"])); info = None
        if not acct.positions and info is None and t == d + 8 * H and d in cl.index:
            i = D.index(d)
            if i - 1 - N >= 0 and i + K < len(D) + K:   # signal from the previous trading day's close
                gap = cl.iloc[i - 1] - cl.iloc[i - 1 - N]
                if gap != 0:
                    s = (1 if gap > 0 else -1) * (-1 if mirror else 1)
                    acct.market(s, round(RISK / (S * 10), 3), sl=bo - s * S * PIP, tp=bo + s * 2 * S * PIP, tag="x")
                    exit_at = (D[i + K] if i + K < len(D) else pd.Timestamp("2100-01-01", tz="UTC")) + 12 * H; info = dict(day=d.strftime("%Y-%m-%d"), side=s, gap=gap / PIP, open8=bo)
        if acct.positions and exit_at is not None and t >= exit_at: acct.close()
        acct.on_bar(bar)
    if acct.positions: info = dict(info, R=np.nan, why="open at END", exit=np.nan, exit_time=None); out.append(info)
    elif info is not None: tr = acct.trades[-1]; out.append(dict(info, R=tr["pnl"] / RISK, why=tr["reason"], exit=tr["exit"], exit_time=tr["exit_time"]))
    return pd.DataFrame(out)
VAR = {"SW1 N=10 S=120 5 days": (10, 120, 5), "SW2 N=3 S=120 5 days": (3, 120, 5), "SW3 N=10 S=80 2 days": (10, 80, 2)}
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
for k, a in VAR.items():
    T = run(*a); done = T[T.why != "open at END"]; late = done.day >= MID
    if MODE == "count": print(f"{k}: trades {len(done)} (first entry {T.day.iloc[0]}) | before {MID}: {int((~late).sum())} | from {MID}: {int(late.sum())} | still open at END: {int((T.why == 'open at END').sum())}"); continue
    if MODE == "first": r = T.iloc[0]; print(f"{k}: first trade {r.day} gap {r.gap:+.1f} pips -> {'BUY' if r.side > 0 else 'SELL'} at the 08:00 open {r.open8:.5f}" + (f" -> {r.why} {r.exit:.5f} at {r.exit_time} {r.R:+.2f}R" if len(sys.argv) > 3 else "")); continue
    M = run(*a, mirror=True); M = M[M.why != "open at END"]; Sx = run(*a, costs=(2.0, 0.5)); Sx = Sx[Sx.why != "open at END"]
    print(f"{k}: trades {len(done)} | avg {done.R.mean():+.3f}R | net {done.R.sum():+.2f} | wins {(done.R > 0).mean():.0%} | sl {(done.why == 'sl').sum()} tp {(done.why == 'tp').sum()} time {(~done.why.isin(['sl', 'tp'])).sum()} | before {MID}: {int((~late).sum())} net {done.R[~late].sum():+.2f} | from {MID}: {int(late.sum())} net {done.R[late].sum():+.2f} | without best 2 {done.R.sum() - done.R.nlargest(2).sum():+.2f} | stressed avg {Sx.R.mean():+.3f} | max DD {dd(done.R):.2f}R | mirror: {len(M)} trades avg {M.R.mean():+.3f}")
    if k.startswith("SW1"):
        K_ = [done.R.mean() >= 0.15, done.R[~late].sum() > 0 and done.R[late].sum() > 0, done.R.sum() - done.R.nlargest(2).sum() > 0, None, Sx.R.mean() > 0, dd(done.R) <= 6.0]
        m = M.set_index("day").R.reindex(done.day).values; ok = ~np.isnan(m); diff = done.R.values[ok] - m[ok]; rng = np.random.default_rng(3)
        p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K_[3] = diff.mean() > 0 and p < 0.05
        print(f"   vs mirror on {int(ok.sum())} shared entry days: mean difference {diff.mean():+.3f}R, sign-flip p {p:.4f} | KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K_)) + f" | judgeable (>=30 trades, >=12 late): {len(done) >= 30 and late.sum() >= 12}")
