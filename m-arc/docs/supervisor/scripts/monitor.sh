#!/bin/bash
# monitor.sh: prints one line per new builder or reviewer comment, and per PR title change, on open PRs. Comments that start with "**Supervisor" or "**Paused" are skipped.
# Usage: [SINCE=<UTC time, e.g. 2026-10-01T08:00:00Z>] ./monitor.sh. Edit SKIP (PR numbers not tracked) before use. Polls every 60 s.
# Prints "#<pr> comment: <first line>" or "title: <pr> <title>". It never exits on its own; the Monitor tool's timeout ends it.
# Needs the agent proxy's GitHub auth for curl (no token is stored in this file).
# Run it with the Monitor tool (timeout_ms 1800000), so each printed line wakes the supervisor. Re-arm every 30 min with SINCE backdated 1-3 min so no comment is missed.
last=${SINCE:-$(date -u -d '-2 minutes' +%Y-%m-%dT%H:%M:%SZ)}
prev=""
SKIP="1 3 88 92 94 144 149 158"
while true; do
  now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  pulls=$(curl -s "https://api.github.com/repos/macdarenz-droid/M-arc/pulls?state=open&per_page=40" 2>/dev/null)
  nums=$(echo "$pulls" | python3 -c "
import json,sys
skip=set(map(int,'$SKIP'.split()))
try: d=json.load(sys.stdin)
except Exception: sys.exit()
for p in d:
  if isinstance(p,dict) and p['number'] not in skip: print(p['number'])
" 2>/dev/null)
  for n in $nums; do
    curl -s "https://api.github.com/repos/macdarenz-droid/M-arc/issues/$n/comments?since=$last&per_page=50" 2>/dev/null | python3 -c "
import json,sys
try: c=json.load(sys.stdin)
except Exception: sys.exit()
if not isinstance(c,list): sys.exit()
for x in c:
  b=x['body']
  if b.startswith('**Supervisor') or b.startswith('**Paused'): continue
  print('#$n comment:', b.split('\n')[0][:120], flush=True)
" || true
  done
  cur=$(echo "$pulls" | python3 -c "
import json,sys
try: d=json.load(sys.stdin)
except Exception: sys.exit()
for p in d:
  if isinstance(p,dict): print(p['number'], p['title'][:50])
" 2>/dev/null | sort)
  if [ -n "$prev" ] && [ -n "$cur" ]; then comm -13 <(echo "$prev") <(echo "$cur") | grep -v '\[fixing\]' | sed 's/^/title: /'; fi
  [ -n "$cur" ] && prev=$cur
  last=$now
  sleep 60
done
