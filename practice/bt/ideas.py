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
    m5 = m5.copy()
    # LONDON CLOCK (decided 2015-03-30): every hour in my rules is London local time. Re-label each candle with London wall-clock time (kept tz-"UTC" for the engine).
    # In winter London = UTC, so nothing changes for Jan-Mar 27; in summer time 08:00 here means 08:00 London = 07:00 UTC.
    m5["time"] = m5["time"].dt.tz_convert("Europe/London").dt.tz_localize(None).dt.tz_localize("UTC")
    t = m5["time"] + pd.Timedelta(hours=2)
    t = t + pd.to_timedelta((t.dt.weekday == 6).astype(int), unit="D")   # any Sunday bar belongs to Monday (fix: a 21:00 Sunday bar made a fake day)
    m5["day"] = t.dt.date
    return m5

def trend_map(m5, look=3, strict=False):
    cl = m5.groupby("day")["close"].last()
    out = {}
    ds = list(cl.index)
    for i, d in enumerate(ds):
        if i >= look + 1: out[d] = 1 if cl.iloc[i-1] > cl.iloc[i-1-look] else -1
        elif i >= 2 and not strict: out[d] = 1 if cl.iloc[i-1] > cl.iloc[0] else -1
    return out

def run(name, m5, entry_h=7, exit_h=12, sl=40, tp=None, mode="open", look=3, midfilter=False, since=None, pullback=False, ret=False, chase=None, eff=None, nofight=False, hourcheck=None, strict=False, nofri=False, be=None, runner=None, asiamin=None, asiarel=None, costs=None, wall=None, weekbias=None, vol=None, night=None, effchase=0.6):
    tr = trend_map(m5, look, strict); acct = Account() if costs is None else Account(spread=costs[0] * PIP, slippage=costs[1] * PIP); risk_of = {}   # costs = (spread pips, slippage pips)
    cl = m5.groupby('day')['close'].last()
    _a = m5[(m5.time.dt.hour < 7) & (m5.time.dt.date == m5.day)]; _g = _a.groupby('day'); arng = (_g['high'].max() - _g['low'].min()) / PIP   # Asia 00-07 range per day, pips
    _wk = {d: pd.Timestamp(d).isocalendar()[:2] for d in m5['day'].unique()}; _first = {}
    for d in sorted(_wk): _first.setdefault(_wk[d], d)                      # first trading day of each week (Monday, incl. Sunday evening)
    _dopen = m5.groupby('day')['open'].first()
    hi = m5.groupby('day')['high'].max(); lo = m5.groupby('day')['low'].min(); dlist = list(hi.index)
    for d, g in m5.groupby("day"):
        if d not in tr or g["time"].iloc[0].weekday() == 6 and len(g) < 100: continue
        side = tr[d]; done = False; running = False
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
                elif mode == "anybreak" and len(asia):   # idea K: previous bar closed beyond the Asia range on EITHER side -> that side
                    prev = g[g.time < b.time].iloc[-1]
                    if prev.close > asia.high.max(): side, go = 1, True
                    elif prev.close < asia.low.min(): side, go = -1, True
                if go and midfilter:   # idea C: only trade on the trend side of yesterday's range midpoint
                    y = dlist[dlist.index(d) - 1]; mid = (hi[y] + lo[y]) / 2
                    if (side < 0 and b.open > mid) or (side > 0 and b.open < mid): go = False; done = True
                if go and night is not None and len(asia):     # idea NM: the move from 00:00 London to the entry must not be against my side; night = minimum pips with me
                    nm = (b.open - asia.open.iloc[0]) * side / PIP
                    if nm < night: go = False; done = True
                if go and weekbias is not None:      # idea Y: which side of the week's open / Monday's range
                    fd = _first[_wk[d]]; wopen = _dopen[fd]; wside = 1 if b.open > wopen else -1
                    if weekbias == "dir": side = wside
                    elif weekbias == "agree":
                        if wside != side: go = False; done = True
                    elif weekbias == "monrange":
                        if d == fd or pd.Timestamp(fd).weekday() != 0: go = False; done = True
                        elif b.open > hi[fd]: side = 1
                        elif b.open < lo[fd]: side = -1
                        else: go = False; done = True
                if go and (asiamin is not None or asiarel is not None) and len(asia):   # idea Q: no trade after a dead Asia session
                    ar = (asia.high.max() - asia.low.min()) / PIP
                    if asiamin is not None and ar < asiamin: go = False; done = True
                    if asiarel is not None:
                        prev5 = arng[arng.index < d].tail(5)
                        if len(prev5) < 5 or ar < asiarel * prev5.mean(): go = False; done = True
                if go and nofri and b.time.weekday() == 4: go = False; done = True   # idea W: no Friday trade
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
                            if pos >= effchase: go = False; done = True
                if go and chase is not None:   # idea H: no trade if price already sits in the far part of yesterday's range, in my direction
                    y = dlist[dlist.index(d) - 1]; pos = (b.open - lo[y]) / (hi[y] - lo[y]); pos = pos if side > 0 else 1 - pos
                    if pos >= chase: go = False; done = True
                if go and pullback:    # idea D: yesterday must have closed AGAINST the trend (a pullback day)
                    i = dlist.index(d)
                    if (cl.iloc[i-1] - cl.iloc[i-2]) * side >= 0: go = False; done = True
                if go:
                    # market order queued now fills at THIS bar's open via on_bar below
                    px = b.open
                    sl_d, mult = sl, 1.0       # idea V: stop or size by recent volatility; vol = ("atr", k) | ("yday", k) | ("size", ref)
                    if vol is not None:
                        i = dlist.index(d); dr = [(hi[x] - lo[x]) / PIP for x in dlist[max(0, i-5):i]]
                        if vol[0] == "atr" and i >= 5: sl_d = min(70, max(25, vol[1] * sum(dr) / 5))
                        elif vol[0] == "yday" and i >= 5: sl_d = min(70, max(25, vol[1] * dr[-1]))
                        elif vol[0] == "size" and i >= 5: mult = min(1.5, max(0.6, vol[1] / (sum(dr) / 5)))
                    s = px + side * -sl_d * PIP; t = px + side * tp * PIP if tp else None
                    if wall is not None:      # idea Z: take profit 2 pips in front of a standing N-day extreme (wall = (N days, min age in days))
                        N, minage = wall; i = dlist.index(d)
                        if i >= N:
                            win = dlist[i-N:i]
                            if side > 0:
                                w = max(hi[x] for x in win); age = i - max(k for k in range(i-N, i) if hi[dlist[k]] == w); cand = w - 2 * PIP
                                if age >= minage and cand - px >= 10 * PIP: t = cand
                            else:
                                w = min(lo[x] for x in win); age = i - max(k for k in range(i-N, i) if lo[dlist[k]] == w); cand = w + 2 * PIP
                                if age >= minage and px - cand >= 10 * PIP: t = cand
                    oid = acct.market(side, round(mult * RISK / (sl_d * 10), 3), sl=s, tp=t, tag=str(d)); done = True
            if hourcheck is not None and acct.positions and h == entry_h + 1 and b.time.minute == 0:   # idea T: one-hour check at this bar's open
                p = acct.positions[0]; pips = ((b.open - p.entry) if p.side > 0 else (p.entry - (b.open + acct.spread))) / PIP
                if pips < hourcheck: acct.close()
            if acct.positions and h >= exit_h:
                p = acct.positions[0]
                if runner is not None and not running and h == exit_h and b.time.minute == 0:      # idea X2: at the exit time, a trade >= +runner pips becomes a runner
                    pips = ((b.open - p.entry) if p.side > 0 else (p.entry - (b.open + acct.spread))) / PIP
                    if pips >= runner: running = True; acct.modify(p.id, sl=p.entry + p.side * 20 * PIP)   # lock +20 pips
                if not running or h >= 16: acct.close()
            acct.on_bar(b)
            if be is not None:                                                                    # idea X1: after +be pips my way, stop to entry (from the next bar)
                for p in acct.positions:
                    fav = ((b.high - p.entry) if p.side > 0 else (p.entry - (b.low + acct.spread))) / PIP
                    if fav >= be and ((p.side > 0 and p.sl < p.entry) or (p.side < 0 and p.sl > p.entry)): acct.modify(p.id, sl=p.entry)
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
 "T1": dict(entry_h=8, exit_h=12, sl=40, hourcheck=0),     # idea T: close at 09:00 if not in profit
 "T2": dict(entry_h=8, exit_h=12, sl=40, hourcheck=-10),   # idea T: close at 09:00 if worse than -10 pips
 "K1": dict(mode="anybreak", entry_h=7, exit_h=12, sl=40),   # idea K: first break of the Asia range from 07:00, either side
 "K2": dict(mode="anybreak", entry_h=8, exit_h=12, sl=40),   # idea K: same, watching from 08:00
 "L1": dict(entry_h=8, exit_h=12, sl=40, look=2, strict=True),    # idea L: lookback 2 days
 "L2": dict(entry_h=8, exit_h=12, sl=40, look=5, strict=True),    # idea L: lookback 5 days
 "L3": dict(entry_h=8, exit_h=12, sl=40, look=10, strict=True),   # idea L: lookback 10 days
 "W1": dict(entry_h=8, exit_h=12, sl=40, nofri=True),   # idea W: A2 Monday-Thursday only
 "X1": dict(entry_h=8, exit_h=12, sl=40, be=20),       # idea X: break-even stop after +20 pips
 "X2": dict(entry_h=8, exit_h=12, sl=40, runner=40),   # idea X: trades >= +40 pips at noon run to 16:00 with +20 locked
 "X3": dict(entry_h=8, exit_h=12, sl=40, tp=60),       # idea X: take profit at +60 pips
 "Q1": dict(entry_h=8, exit_h=12, sl=40, asiamin=20),    # idea Q: skip if Asia range < 20 pips
 "Q2": dict(entry_h=8, exit_h=12, sl=40, asiamin=25),    # idea Q: skip if Asia range < 25 pips
 "Q3": dict(entry_h=8, exit_h=12, sl=40, asiarel=0.8),   # idea Q: skip if Asia range < 0.8 x its 5-day average
 "Z1": dict(entry_h=8, exit_h=12, sl=40, wall=(5, 2)),    # idea Z: TP in front of a 5-day extreme that is >= 2 days old
 "Z2": dict(entry_h=8, exit_h=12, sl=40, wall=(10, 2)),   # idea Z: 10-day, >= 2 days old
 "Z3": dict(entry_h=8, exit_h=12, sl=40, wall=(10, 1)),   # idea Z: 10-day, any age (control)
 "Y1": dict(entry_h=8, exit_h=12, sl=40, weekbias="dir"),        # idea Y: side of the week's opening price
 "Y2": dict(entry_h=8, exit_h=12, sl=40, weekbias="monrange"),   # idea Y: Tue-Fri, outside Monday's range
 "Y3": dict(entry_h=8, exit_h=12, sl=40, weekbias="agree"),      # idea Y: A2 only when it agrees with the week-open side
 "V1": dict(entry_h=8, exit_h=12, sl=40, vol=("atr", 0.30)),    # idea V: stop = 0.30 x 5-day avg daily range (25-70 pips)
 "V2": dict(entry_h=8, exit_h=12, sl=40, vol=("yday", 0.32)),   # idea V: stop = 0.32 x yesterday's range (25-70 pips)
 "V3": dict(entry_h=8, exit_h=12, sl=40, vol=("size", 131)),    # idea V: 40 pip stop, size x 131 / 5-day avg range (0.6-1.5)
 "ET10": dict(entry_h=8, exit_h=10, sl=40),   # idea E-time: A2, out at 10:00
 "ET11": dict(entry_h=8, exit_h=11, sl=40),   # out at 11:00
 "ET13": dict(entry_h=8, exit_h=13, sl=40),   # out at 13:00
 "S50": dict(entry_h=8, exit_h=12, sl=50),   # idea S: wider fixed stop, same $ risk
 "S60": dict(entry_h=8, exit_h=12, sl=60),
 "S80": dict(entry_h=8, exit_h=12, sl=80),
 "CP1": dict(entry_h=9, exit_h=13, sl=40),    # clock shift +1h (09:00-13:00)
 "CM1": dict(entry_h=7, exit_h=11, sl=40),    # clock shift -1h (07:00-11:00)
 "C9": dict(entry_h=9, exit_h=12, sl=40),     # late entry 09:00, exit 12:00
 "NM1": dict(entry_h=8, exit_h=12, sl=40, night=0),      # idea NM: skip if the night moved against me at all
 "NM2": dict(entry_h=8, exit_h=12, sl=40, night=-14.999), # skip if -15 pips or worse
 "NM3": dict(entry_h=8, exit_h=12, sl=40, night=5),      # trade only if +5 pips or better
 "FR1": dict(entry_h=8, exit_h=12, sl=40, eff=0.5, effchase=0.5),   # F1 neighbour: stricter no-chase
 "FR2": dict(entry_h=8, exit_h=12, sl=40, eff=0.5, effchase=0.7),   # F1 neighbour: looser no-chase
 "FR3": dict(entry_h=8, exit_h=12, sl=40, eff=0.6, effchase=0.6),   # F1 neighbour: higher efficiency threshold
 "C1": dict(entry_h=8, exit_h=12, sl=40, midfilter=True),  # idea C v1: A2 + yesterday-midpoint filter
}
if __name__ == "__main__":
    m5 = days(history("M5"))
    print("history:", m5.time.iloc[0], "->", m5.time.iloc[-1])
    args = [a for a in sys.argv[1:] if not a.startswith("--since=")]
    since = next((a.split("=")[1] for a in sys.argv[1:] if a.startswith("--since=")), None)
    for k in (args or VARIANTS): run(k, m5, since=since, **VARIANTS[k])
