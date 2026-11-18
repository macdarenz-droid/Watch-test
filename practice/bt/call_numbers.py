"""Print every figure the 07:00 call needs, from the tool. usage: python bt/call_numbers.py DATE (today, clock at 07:00 London)"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd
from backtest import history
D = sys.argv[1]; m5 = ideas.days(history("M5")); hi = m5.groupby("day")["high"].max(); lo = m5.groupby("day")["low"].min(); cl = m5.groupby("day")["close"].last(); ds = list(cl.index)
for d in ds[-4:-1]: print("London day", d, "high", round(hi[d], 5), "low", round(lo[d], 5), "close", round(cl[d], 5), "close position", round((cl[d] - lo[d]) / (hi[d] - lo[d]), 2), "range", round((hi[d] - lo[d]) * 1e4, 1))
y = ds[-2]; print("yesterday made the 3-day high:", bool(hi[y] >= max(hi[ds[-4]], hi[ds[-3]])), "| the 3-day low:", bool(lo[y] <= min(lo[ds[-4]], lo[ds[-3]])))
x = m5[(m5.time.dt.date == pd.Timestamp(D).date()) & (m5.time.dt.hour < 7)]
print("night 00:00-07:00 London: open", round(x.open.iloc[0], 5), "high", round(x.high.max(), 5), "low", round(x.low.min(), 5), "last", round(x.close.iloc[-1], 5), "| range", round((x.high.max() - x.low.min()) * 1e4, 1), "| net", round((x.close.iloc[-1] - x.open.iloc[0]) * 1e4, 1))
i = len(ds) - 1; adr = (hi.iloc[i-5:i] - lo.iloc[i-5:i]).mean() * 1e4
print("3-day gap", round((cl.iloc[i-1] - cl.iloc[i-4]) * 1e4, 1), "| 5-day gap", round((cl.iloc[i-1] - cl.iloc[i-6]) * 1e4, 1), "| ADR5", round(adr, 1), "| gap / ADR5", round(abs(cl.iloc[i-1] - cl.iloc[i-4]) * 1e4 / adr, 2), "| 10-day trend:", "UP" if cl.iloc[i-1] > cl.iloc[i-11] else "DOWN", f"({cl.iloc[i-1]:.5f} vs {ds[i-11]} {cl.iloc[i-11]:.5f})")
