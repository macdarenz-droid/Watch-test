#!/bin/sh
# compact multi-timeframe look (closed candles + partial), via sim.py only
python sim.py now | head -2
for tf in D1:${1:-6} H4:${2:-8} H1:${3:-10} M15:${4:-0}; do
  n=${tf#*:}; t=${tf%:*}; [ "$n" = 0 ] && continue
  echo "-- $t"; python sim.py bars --tf $t --n $n | grep -v London | awk '{printf "%s %s %s %s %s %s %s\n",$1,substr($2,1,5),$3,$4,$5,$6,$9}'
done
echo "-- 22:00 closes (trend rule: last vs 3 back)"; python sim.py bars --tf H1 --n 150 | awk '$2 ~ /^21:/ && $8 > 500{printf "%s %s | ", substr($1,6), $6} END{print ""}'
python - <<'PY'
# Asia (00:00-07:00 UTC) range today and its 5-day average, for the paper tags Q3 (skip if < 0.8 x avg) and Q1 (skip if < 20 pips). Closed candles only.
import sys; sys.path.insert(0,'bt')
import ideas, pandas as pd
from backtest import history
m5=ideas.days(history("M5")); a=m5[(m5.time.dt.hour<7)&(m5.time.dt.date==m5.day)]; g=a.groupby('day'); ar=(g.high.max()-g.low.min())*1e4
d=ar.index[-1]; prev=ar[ar.index<d].tail(5).mean()
print(f"-- Asia range {d}: {ar[d]:.1f} pips | 5-day avg {prev:.1f} | ratio {ar[d]/prev:.2f} | Q3 tag: {'SKIP' if ar[d]<0.8*prev else 'trade'} | Q1 tag: {'SKIP' if ar[d]<20 else 'trade'}")
PY
