#!/bin/sh
# compact multi-timeframe look (closed candles + partial), via sim.py only
python sim.py now | head -2
for tf in D1:${1:-6} H4:${2:-8} H1:${3:-10} M15:${4:-0}; do
  n=${tf#*:}; t=${tf%:*}; [ "$n" = 0 ] && continue
  echo "-- $t"; python sim.py bars --tf $t --n $n | grep -v London | awk '{printf "%s %s %s %s %s %s %s\n",$1,substr($2,1,5),$3,$4,$5,$6,$9}'
done
