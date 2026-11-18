"""Market facts by period (no trade results): daily range, trend vs chop, how often session moves hold. London time, history only.
usage: python bt/market_compare.py END   -> Jan-Apr (01-05..04-30) vs the last 30 trading days before END, plus May-early June between them."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, PIP
END = sys.argv[1]; H = pd.Timedelta(hours=1)
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open; rows = []
for d in sorted(set(m5.time.dt.normalize())):
    x = m5[(m5.time >= d - 2 * H) & (m5.time < d + 22 * H)]
    if len(x) < 200 or d.weekday() > 4 or any(d + k * H not in op.index for k in (0, 8, 10, 12, 16, 20)): continue
    p = {k: op[d + k * H] for k in (0, 8, 10, 12, 16, 20)}; mo = m5[(m5.time >= d + 8 * H) & (m5.time < d + 12 * H)]
    night, morn, aft = (p[8] - p[0]) / PIP, (p[12] - p[8]) / PIP, (p[20] - p[12]) / PIP; first, second = (p[10] - p[8]) / PIP, (p[12] - p[10]) / PIP
    up, dn = (mo.high.max() - p[8]) / PIP, (p[8] - mo.low.min()) / PIP
    rows.append(dict(day=d, rng=(x.high.max() - x.low.min()) / PIP, body=abs(x.close.iloc[-1] - x.open.iloc[0]) / (x.high.max() - x.low.min()), close=x.close.iloc[-1],
                     morn_rng=(mo.high.max() - mo.low.min()) / PIP, night_morn=np.sign(night) == np.sign(morn), first_second=np.sign(first) == np.sign(second),
                     morn_aft=np.sign(morn) == np.sign(aft), morn_kept=(np.sign(morn) * (p[20] - p[8]) / PIP) >= 0.5 * abs(morn),
                     whip=(min(up, dn) >= 25), morn_eff=abs(morn) / ((mo.high.max() - mo.low.min()) / PIP)))
F = pd.DataFrame(rows).set_index("day"); ch = F.close.diff(); F["cont1"] = np.sign(ch) == np.sign(ch.shift(1)); F["st10"] = (F.close - F.close.shift(10)).abs() / PIP / F.rng.rolling(10).sum()
last30 = F.iloc[-30:]; P = {"Jan-Apr": F[F.index < "2015-05-01"], "May..before last 30": F[(F.index >= "2015-05-01") & (F.index < last30.index[0])], f"last 30 ({last30.index[0].strftime('%m-%d')}..{last30.index[-1].strftime('%m-%d')})": last30}
print("period | days | median day range | median morning range | body share of day | 10-day straightness | day continues yesterday | night->morning same way | 08-10 -> 10-12 same way | morning -> afternoon same way | half the morning move kept at 20:00 | morning goes 25+ pips BOTH ways | morning net / morning range")
for k, X in P.items():
    print(f"{k} | {len(X)} | {X.rng.median():.0f} | {X.morn_rng.median():.0f} | {X.body.median():.2f} | {X.st10.median():.2f} | {X.cont1.mean():.0%} | {X.night_morn.mean():.0%} | {X.first_second.mean():.0%} | {X.morn_aft.mean():.0%} | {X.morn_kept.mean():.0%} | {X.whip.mean():.0%} | {X.morn_eff.median():.2f}")
