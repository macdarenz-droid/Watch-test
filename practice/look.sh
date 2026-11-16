#!/bin/sh
# compact multi-timeframe look (closed candles + partial), via sim.py only
python sim.py now | head -2
for tf in D1:${1:-6} H4:${2:-8} H1:${3:-10} M15:${4:-0}; do
  n=${tf#*:}; t=${tf%:*}; [ "$n" = 0 ] && continue
  echo "-- $t"; python sim.py bars --tf $t --n $n | grep -v London | awk '{printf "%s %s %s %s %s %s %s\n",$1,substr($2,1,5),$3,$4,$5,$6,$9}'
done
python - <<'PY'
# daily closes at 22:00 LONDON time (= New York 17:00), last 6 trading days, for the trend rule (last vs 3 back). Uses bt/ideas.days (London clock).
import sys; sys.path.insert(0,'bt')
import ideas
from backtest import history
m5=ideas.days(history("M5")); cl=m5.groupby("day")["close"].last()
import datetime as dt
last=m5["time"].iloc[-1]; cl=cl[[d for d in cl.index if not (d==cl.index[-1] and last.hour<22 and (last+__import__("pandas").Timedelta(hours=2)).date()==d)]]
x=cl.tail(6); print("-- 22:00 London closes (trend rule: last vs 3 back): "+" | ".join(f"{d.strftime('%m-%d')} {v:.5f}" for d,v in x.items())+f"  => gap {((x.iloc[-1]-x.iloc[-4])*1e4):+.0f} pips -> {'BUY' if x.iloc[-1]>x.iloc[-4] else 'SELL'}")
PY
python - <<'PY'
# Asia (00:00-07:00 UTC) range today and its 5-day average, for the paper tags Q3 (skip if < 0.8 x avg) and Q1 (skip if < 20 pips). Closed candles only.
import sys; sys.path.insert(0,'bt')
import ideas, pandas as pd
from backtest import history
m5=ideas.days(history("M5")); a=m5[(m5.time.dt.hour<7)&(m5.time.dt.date==m5.day)]; g=a.groupby('day'); ar=(g.high.max()-g.low.min())*1e4
d=ar.index[-1]; prev=ar[ar.index<d].tail(5).mean()
print(f"-- Asia range {d}: {ar[d]:.1f} pips | 5-day avg {prev:.1f} | ratio {ar[d]/prev:.2f} | Q3 tag: {'SKIP' if ar[d]<0.8*prev else 'trade'} | Q1 tag: {'SKIP' if ar[d]<20 else 'trade'}")
PY
