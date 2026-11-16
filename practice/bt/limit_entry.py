"""Idea LE: limit entry X pips better than the 08:00 London price instead of a market order. Direction, day, 40 pip stop, noon exit, $125: A2. Costs on. London clock.
usage: python bt/limit_entry.py START END"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd
from backtest import history, Account, Position, PIP
a, b = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 40
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]; tr = ideas.trend_map(m5)
def run(X=None, fallback=None, give_up=9):
    """X None = plain A2 (market at 08:00). fallback = (hour, minute) for a market entry if the limit is not filled; give_up = hour after which the order is cancelled."""
    acct = Account(); lots = round(RISK / (SL * 10), 3); days_sig = []
    for d, g in m5.groupby("day"):
        if d not in tr: continue
        side = tr[d]; lim = None; done = False; x = g[g.time.dt.date == d]
        if x.empty or not ((x.time.dt.hour == 8) & (x.time.dt.minute == 0)).any(): continue
        days_sig.append(d)
        for _, bar in x.iterrows():
            h, mnt = bar.time.hour, bar.time.minute; s = acct.spread
            if not done and h == 8 and mnt == 0:
                if X is None: acct.market(side, lots, sl=bar.open - side * SL * PIP, tag=str(d)); done = True
                else: lim = bar.open - side * X * PIP                       # buy below, sell above (bid prices)
            if lim is not None and not done:
                if fallback and (h, mnt) >= fallback:
                    acct.market(side, lots, sl=bar.open - side * SL * PIP, tag=str(d)); done = True; lim = None
                elif h >= give_up: lim = None; done = True
                else:
                    hit = (bar.low + s <= lim + s) if side > 0 else (bar.high >= lim)     # buy: ask touches lim+s i.e. bid low <= lim ; sell: bid high >= lim
                    if hit:
                        px = lim + s if side > 0 else lim                                  # long pays the ask, short sells the bid
                        acct.positions.append(Position(acct._next_id, side, lots, px, bar.time, px - side * SL * PIP, None, str(d))); acct._next_id += 1; done = True; lim = None
            if acct.positions and h >= 12: acct.close()
            acct.on_bar(bar)
        if acct.positions: acct.close()
    t = pd.DataFrame(acct.trades)
    if not t.empty: t["R"] = t.pnl / RISK; t = t[t.entry_time >= pd.Timestamp(a, tz="UTC")].reset_index(drop=True)
    nd = len([d for d in days_sig if pd.Timestamp(d, tz="UTC") >= pd.Timestamp(a, tz="UTC")])
    return t, nd
def st(t, nd):
    eq = t.R.cumsum(); dd = (eq.cummax().clip(lower=0) - eq).max()
    return f"days={nd} trades={len(t):2d} win={100*(t.R>0).mean():3.0f}% avg/trade={t.R.mean():+.2f} avg/day={t.R.sum()/nd:+.3f} net={t.R.sum():+6.2f} dd={dd:.2f} stops={int((t.reason=='sl').sum())}"
print(a, "..", b)
for name, kw in (("A2 market 08:00", dict()), ("LE5  (5 pips, market at 08:30)", dict(X=5, fallback=(8, 30))), ("LE10 (10 pips, market at 08:30)", dict(X=10, fallback=(8, 30))), ("LE10x (10 pips, else no trade)", dict(X=10, give_up=9))):
    t, nd = run(**kw); print(f"  {name:32s} {st(t, nd)}")
