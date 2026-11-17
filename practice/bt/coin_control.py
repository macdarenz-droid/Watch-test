"""Idea CO (journal/2015-idea-FS2-why-full-stops.md; hypothesis and kill test written first): on every A2 day trade BOTH sides from the 08:00 London open
with the same stop and the 12:00 exit, costs on (the engine's Account). The coin's stop rate = mean of the two sides. usage: python bt/coin_control.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END = sys.argv[1]; RISK = 125.0; F0 = "2015-03-27"; H = pd.Timedelta(hours=1)
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = ta.groupby("tag").agg(R=("R", "sum"), side=("side", "first"), stop=("reason", lambda x: (x == "sl").any()))
def run(SL):
    rows = []
    for d in A.index:
        dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + 8 * H) & (m5.time <= dd_ + 12 * H)]
        for side in (1, -1):
            acct = Account()
            for _, bar in x.iterrows():
                if bar.time == dd_ + 8 * H: acct.market(side, round(RISK / (SL * 10), 3), sl=bar.open - side * SL * PIP, tag=d)
                if acct.positions and bar.time >= dd_ + 12 * H: acct.close()
                acct.on_bar(bar)
            t = acct.trades[-1]; rows.append(dict(tag=d, side=side, R=t["pnl"] / RISK, stop=t["reason"] == "sl", mine=side == A.side[d]))
    return pd.DataFrame(rows)
T = {SL: run(SL) for SL in (40, 30, 50)}; t40 = T[40]; me = t40[t40.mine].set_index("tag")
print(f"mechanics: the control's A2 side against engine A2 at 40 pips: largest difference per day {(me.R - A.R).abs().max():.3f}R; stop days identical: {bool((me.stop == A.stop).all())} | {len(A)} days")
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; print(t40[t40.tag == d].round(2).to_string(index=False)); sys.exit()
res = {}
for SL, name in ((40, "CO1 40 pips"), (30, "CO2 30 pips"), (50, "CO3 50 pips")):
    t = T[SL]; print(name + ":")
    for per, m in (("BEFORE funding", t.tag < F0), ("FUNDED", t.tag >= F0)):
        g = t[m]; mine, other = g[g.mine], g[~g.mine]; coin = g.stop.mean(); both = g.groupby("tag").stop.sum()
        res[(SL, per)] = (coin, mine.stop.mean(), other.stop.mean())
        print(f"   {per}: {len(mine)} days | COIN stop rate {coin:.1%} | A2's side {mine.stop.mean():.1%} ({int(mine.stop.sum())}) | the other side {other.stop.mean():.1%} ({int(other.stop.sum())}) | days with neither side stopped {int((both == 0).sum())}, one {int((both == 1).sum())}, both {int((both == 2).sum())} | avg R: A2's side {mine.R.mean():+.3f}, other side {other.R.mean():+.3f}, coin {g.R.mean():+.3f}")
    if SL == 40:
        print("   by month (A2's side stop rate / coin's / days): " + " ".join(f"{mth}:{g[g.mine].stop.mean():.0%}/{g.stop.mean():.0%}/{g.tag.nunique()}" for mth, g in t.groupby(t.tag.str[:7])))
c0, a0, _ = res[(40, "BEFORE funding")]; c1, a1, _ = res[(40, "FUNDED")]
k4 = all(res[(s, "BEFORE funding")][1] < res[(s, "BEFORE funding")][0] and res[(s, "FUNDED")][1] >= res[(s, "FUNDED")][0] - 0.08 for s in (30, 50))
K = [abs(c1 - c0) <= 0.08, c0 - a0 >= 0.10, abs(a1 - c1) <= 0.08, k4]
print(f"KILL TEST (CO1): K1 coin {c0:.1%} -> {c1:.1%} ({(c1-c0)*100:+.1f} points) {'PASS' if K[0] else 'FAIL'} | K2 before: A2 {a0:.1%} against coin {c0:.1%} ({(a0-c0)*100:+.1f}) {'PASS' if K[1] else 'FAIL'} | K3 funded: A2 {a1:.1%} against coin {c1:.1%} ({(a1-c1)*100:+.1f}) {'PASS' if K[2] else 'FAIL'} | K4 other stop sizes {'PASS' if K[3] else 'FAIL'}")
