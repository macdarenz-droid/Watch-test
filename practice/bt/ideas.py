"""Backtests of my ideas on history BEFORE the clock only (backtest.history). Costs on.
usage: python bt/ideas.py [A1 A2 ...]"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pandas as pd
from backtest import history, Account, PIP
EFF = {}
RISK = 125.0  # $ per trade = 0.5% of 25k

def days(m5):
    """trading day = UTC date after shifting +2h (Sunday evening belongs to Monday)."""
    m5 = m5.copy(); t = m5["time"] + pd.Timedelta(hours=2)
    t = t + pd.to_timedelta((t.dt.weekday == 6).astype(int), unit="D")   # any Sunday bar belongs to Monday (fix: a 21:00 Sunday bar made a fake day)
    m5["day"] = t.dt.date
    return m5

def trend_map(m5, look=3):
    cl = m5.groupby("day")["close"].last()
    out = {}
    ds = list(cl.index)
    for i, d in enumerate(ds):
        if i >= look + 1: out[d] = 1 if cl.iloc[i-1] > cl.iloc[i-1-look] else -1
        elif i >= 2: out[d] = 1 if cl.iloc[i-1] > cl.iloc[0] else -1
    return out

def run(name, m5, entry_h=7, exit_h=12, sl=40, tp=None, mode="open", look=3, midfilter=False, since=None, pullback=False, ret=False, chase=None, eff=None, nofight=False):
    tr = trend_map(m5, look); acct = Account(); risk_of = {}
    cl = m5.groupby('day')['close'].last()
    hi = m5.groupby('day')['high'].max(); lo = m5.groupby('day')['low'].min(); dlist = list(hi.index)
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
                if go and midfilter:   # idea C: only trade on the trend side of yesterday's range midpoint
                    y = dlist[dlist.index(d) - 1]; mid = (hi[y] + lo[y]) / 2
                    if (side < 0 and b.open > mid) or (side > 0 and b.open < mid): go = False; done = True
                if go and nofight and len(asia):   # idea G: no trade if 07:00-08:00 already broke the Asia range against my direction
                    fh = g[(g.time.dt.date == d) & (g.time.dt.hour == 7)]
                    if len(fh) and ((side < 0 and fh.high.max() > asia.high.max()) or (side > 0 and fh.low.min() < asia.low.min())): go = False; done = True
                if go and eff is not None:    # idea F: 5-day efficiency decides whether the no-chase filter applies today
                    i = dlist.index(d)
                    if i < 6: go = False; done = True
                    else:
                        c = cl.iloc[i-6:i]; E = abs(c.iloc[-1] - c.iloc[0]) / c.diff().abs().sum(); EFF[d] = E
                        if E < eff:
                            y = dlist[i - 1]; pos = (b.open - lo[y]) / (hi[y] - lo[y]); pos = pos if side > 0 else 1 - pos
                            if pos >= 0.6: go = False; done = True
                if go and chase is not None:   # idea H: no trade if price already sits in the far part of yesterday's range, in my direction
                    y = dlist[dlist.index(d) - 1]; pos = (b.open - lo[y]) / (hi[y] - lo[y]); pos = pos if side > 0 else 1 - pos
                    if pos >= chase: go = False; done = True
                if go and pullback:    # idea D: yesterday must have closed AGAINST the trend (a pullback day)
                    i = dlist.index(d)
                    if (cl.iloc[i-1] - cl.iloc[i-2]) * side >= 0: go = False; done = True
                if go:
                    # market order queued now fills at THIS bar's open via on_bar below
                    px = b.open
                    s = px + side * -sl * PIP; t = px + side * tp * PIP if tp else None
                    oid = acct.market(side, round(RISK / (sl * 10), 2), sl=s, tp=t, tag=str(d)); done = True
            if acct.positions and h >= exit_h: acct.close()
            acct.on_bar(b)
    t = pd.DataFrame(acct.trades)
    if not t.empty and since: t = t[t.entry_time >= pd.Timestamp(since, tz="UTC")].reset_index(drop=True)
    if t.empty: print(name, "no trades"); return t
    t["R"] = t.pnl / RISK
    if ret: return t
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
 "D1": dict(entry_h=8, exit_h=12, sl=40, pullback=True),   # idea D v1: A2 only after a pullback day
 "E1": dict(entry_h=8, exit_h=12, sl=30),                  # idea E v1: A2 with a 30 pip stop (same $ risk, bigger size)
 "DE": dict(entry_h=8, exit_h=12, sl=30, pullback=True),   # D1 + E1 together
 "H1": dict(entry_h=8, exit_h=12, sl=40, chase=0.6),   # idea H: A2 + no-chase filter
 "H2": dict(entry_h=8, exit_h=12, sl=40, chase=0.7),
 "H3": dict(entry_h=8, exit_h=12, sl=40, chase=0.8),
 "F1": dict(entry_h=8, exit_h=12, sl=40, eff=0.5),      # idea F: straight week -> A2 every day; crooked week -> A2 + no-chase(0.6)
 "G1": dict(entry_h=8, exit_h=12, sl=40, nofight=True),   # idea G: A2, skip when the first London hour broke the Asia range against me
 "C1": dict(entry_h=8, exit_h=12, sl=40, midfilter=True),  # idea C v1: A2 + yesterday-midpoint filter
}
if __name__ == "__main__":
    m5 = days(history("M5"))
    print("history:", m5.time.iloc[0], "->", m5.time.iloc[-1])
    args = [a for a in sys.argv[1:] if not a.startswith("--since=")]
    since = next((a.split("=")[1] for a in sys.argv[1:] if a.startswith("--since=")), None)
    for k in (args or VARIANTS): run(k, m5, since=since, **VARIANTS[k])
