#!/bin/bash
# ci-watch.sh: waits until every check run on each given commit is complete and the four required ones (guard, source-gate, visual-gate-tz, android-gate) exist.
# After a red source-gate or visual-gate-tz, android-gate still gets a check run with conclusion "skipped" (seen on 74a4e68), so the line still appears. Add ht10-gate to req when HT-10's CI job lands.
# Usage: ./ci-watch.sh <label>:<full sha> [<label>:<full sha> ...]   e.g. ./ci-watch.sh TRAIN6:0123abcd...
# Prints "CI <label> <sha7>: guard=success source-gate=success ..." once per commit, then exits when all are done. Polls every 90 s.
# Needs the agent proxy's GitHub auth for curl (no token is stored in this file).
# Run with Bash run_in_background and timeout 7200000: the default 30 min kills it while a queue of CI runs is still waiting.
declare -A done
while true; do
  left=0
  for a in "$@"; do
    l=${a%%:*}; s=${a#*:}
    [ -n "${done[$s]}" ] && continue
    left=1
    r=$(curl -s "https://api.github.com/repos/macdarenz-droid/M-arc/commits/$s/check-runs?per_page=50" | python3 -c "
import json,sys
try: d=json.load(sys.stdin)
except Exception: sys.exit()
runs=d.get('check_runs',[])
req={'guard','source-gate','visual-gate-tz','android-gate'}
if not req <= {x['name'] for x in runs} or any(x['status']!='completed' for x in runs): sys.exit()
print(' '.join(f\"{x['name']}={x['conclusion']}\" for x in runs))" 2>/dev/null)
    if [ -n "$r" ]; then echo "CI $l ${s:0:7}: $r"; done[$s]=1; fi
  done
  [ $left = 0 ] && exit 0
  sleep 90
done
