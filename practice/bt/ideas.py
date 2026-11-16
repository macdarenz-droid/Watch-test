"""Backtests of my ideas on history BEFORE the clock only (backtest.history). Costs on.
usage: python bt/ideas.py [A1 A2 ...]"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pandas as pd
from backtest import history, Account, PIP
RISK = 125.0  # $ per trade = 0.5% of 25k

def days(m5):
    """trading day = UTC date after shifting +2h (Sunday evening belongs to Monday)."""
    m5 = m5.copy(); m5["day"] = (m5["time"] + pd.Timedelta(hours=2)).dt.date
    return m5

def trend_map(m5, look=3):
    cl = m5.groupby("day")["close"].last()
    out = {}
    ds = list(cl.index)
    for i, d in enumerate(ds):
        if i >= look + 1: out[d] = 1 if cl.iloc[i-1] > cl.iloc[i-1-look] else -1
        elif i >= 2: out[d] = 1 if cl.iloc[i-1] > cl.iloc[0] else -1
    return out

def run(name, m5, entry_h=7, exit_h=12, sl=40, tp=None, mode="open", look=3):
    tr = trend_map(m5, look); acct = Account(); risk_of = {}
    for d, g in m5.groupby("day"):
        if d not in tr or g["time"].iloc[0].weekday() == 6 and len(g) < 100: continue
        side = tr[d]; done = False
        asia = g[(g.time.dt.hour < 7) & (g.time.dt.date == d)]
        for _, b in g.iterrows():
            h = b.time.hour
            if b.time.date() != d: acct.on_bar(b); continue
            if not done and not acct.positions and entry_h <= h < exit_h:
                go = False
                if mode == "open": go = (h == entry_h and b.time.minute == 0)
                elif mode == "break" and len(asia):   # previous bar closed beyond Asia range, with trend
                    prev = g[g.time < b.time].iloc[-1]
                    go = prev.close < asia.low.min() if side < 0 else prev.close > asia.high.max()
                if go:
                    # market order queued now fills at THIS bar's open via on_bar below
                    px = b.open
                    s = px + side * -sl * PIP; t = px + side * tp * PIP if tp else None
                    oid = acct.market(side, round(RISK / (sl * 10), 2), sl=s, tp=t, tag=str(d)); done = True
            if acct.positions and h >= exit_h: acct.close()
            acct.on_bar(b)
    t = pd.DataFrame(acct.trades)
    if t.empty: print(name, "no trades"); return t
    t["R"] = t.pnl / RISK
    eq = t.R.cumsum(); dd = (eq.cummax().clip(lower=0) - eq).max()
    print(f"{name}: n={len(t)} win={100*(t.R>0).mean():.0f}% avgR={t.R.mean():+.2f} netR={t.R.sum():+.2f} maxDD={dd:.2f}R  Rs={[round(x,2) for x in t.R]}" if len(t) <= 12 else
          f"{name}: n={len(t)} win={100*(t.R>0).mean():.0f}% avgR={t.R.mean():+.2f} netR={t.R.sum():+.2f} maxDD={dd:.2f}R")
    return t

VARIANTS = {
 "A1": dict(entry_h=7, exit_h=12, sl=40),                 # sell/buy London open with trend, out at noon
 "A2": dict(entry_h=8, exit_h=12, sl=40),                 # wait out the first (fake) hour
 "A3": dict(entry_h=7, exit_h=16, sl=40, tp=60),          # fixed 1.5R target, hold into NY
 "B1": dict(mode="break", exit_h=12, sl=30),              # Asia range break with trend
 "B2": dict(mode="break", exit_h=16, sl=30, tp=45),
 "B3": dict(mode="break", exit_h=12, sl=40),
}
if __name__ == "__main__":
    m5 = days(history("M5"))
    print("history:", m5.time.iloc[0], "->", m5.time.iloc[-1])
    for k in (sys.argv[1:] or VARIANTS): run(k, m5, **VARIANTS[k])
