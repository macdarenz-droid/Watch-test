"""Review of my live trades: per-trade context measured from history (before the clock). No strategy here.
All 'signed' numbers are in pips in the direction of my trade (+ = went my way)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pandas as pd
from backtest import history
P = 1e4
def load():
    t = pd.read_csv(os.path.join(os.path.dirname(__file__), "..", "sim", "trades.csv"), parse_dates=["entry_time", "exit_time"])
    t["n"] = range(1, len(t) + 1); t["R"] = t.pnl / 125.0
    return t
def features(t, m5):
    m5 = m5.set_index("time"); rows = []
    dclose = m5["close"][m5.index.hour < 22].resample("1D").last().dropna()   # 22:00 UTC closes, as I trade them
    for r in t.itertuples():
        d = r.entry_time.normalize(); s = r.side
        prev = m5[(m5.index < d) ].iloc[-288*3:]            # previous sessions
        y0 = prev.index[-1].normalize(); y = m5[(m5.index >= y0) & (m5.index < d)]
        if y.index[0].weekday() == 6 or len(y) < 100:        # Sunday stub -> use Friday
            y0 = m5[m5.index < y0].index[-1].normalize(); y = m5[(m5.index >= y0) & (m5.index < y0 + pd.Timedelta(days=1))]
        asia = m5[(m5.index >= d) & (m5.index < d + pd.Timedelta(hours=7))]
        h7 = m5[(m5.index >= d + pd.Timedelta(hours=7)) & (m5.index < d + pd.Timedelta(hours=8))]
        hold = m5[(m5.index >= r.entry_time) & (m5.index < r.exit_time)]
        aft = m5[(m5.index >= d + pd.Timedelta(hours=12)) & (m5.index < d + pd.Timedelta(hours=16))]
        e = h7.close.iloc[-1]
        wd = [x for x in dclose.index if x < d and x.weekday() < 5]
        gap = (dclose[wd[-1]] - dclose[wd[-4]]) * P * s
        ydir = (y.close.iloc[-1] - y.open.iloc[0]) * P * s
        pos = (e - y.low.min()) / (y.high.max() - y.low.min()); pos = pos if s > 0 else 1 - pos   # 1 = already at the far end in my direction
        mfe = ((hold.high.max() - r.entry) if s > 0 else (r.entry - hold.low.min())) * P
        mae = ((r.entry - hold.low.min()) if s > 0 else (hold.high.max() - r.entry)) * P
        rows.append(dict(n=r.n, day=d.strftime("%m-%d %a"), side="B" if s > 0 else "S", R=round(r.R, 2), gap3=round(gap), yday=round(ydir),
                         yrng=round((y.high.max() - y.low.min()) * P), pos=round(pos, 2), asia=round((asia.close.iloc[-1] - asia.open.iloc[0]) * P * s),
                         arng=round((asia.high.max() - asia.low.min()) * P), h7=round((h7.close.iloc[-1] - h7.open.iloc[0]) * P * s),
                         mfe=round(mfe), mae=round(mae), pm=round((aft.close.iloc[-1] - aft.open.iloc[0]) * P * s)))
    return pd.DataFrame(rows)
if __name__ == "__main__":
    f = features(load(), history("M5")); pd.set_option("display.width", 200)
    print(f.to_string(index=False)); f.to_csv(os.path.join(os.path.dirname(__file__), "review_features.csv"), index=False)
