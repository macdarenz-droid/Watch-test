#!/bin/bash
# apk-watch.sh: waits for the build-apk workflow run on a commit (main's "M/ARC gate" run) to complete, then reports once.
# Usage: ./apk-watch.sh <full sha>
# Prints "APK run <id> <status> <conclusion> | steps: <the Sign / fingerprint step results> | artifacts: <name> id=<id> expired=<bool>". The artifact link is https://github.com/macdarenz-droid/M-arc/actions/runs/<run>/artifacts/<id>.
# Needs the agent proxy's GitHub auth for curl (no token is stored in this file).
# Run with Bash run_in_background and timeout 7200000: the default 30 min kills it before the build finishes.
SHA=$1; R=https://api.github.com/repos/macdarenz-droid/M-arc
while true; do
  out=$(curl -s "$R/actions/runs?head_sha=$SHA&per_page=20" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for r in d.get('workflow_runs',[]):
  if 'build-apk' in r['path']: print(r['id'], r['status'], r['conclusion'], r['html_url']); break
" 2>/dev/null)
  set -- $out
  if [ -n "$1" ] && [ "$2" = completed ]; then
    RID=$1
    steps=$(curl -s "$R/actions/runs/$RID/jobs?per_page=50" | python3 -c "
import json,sys
for j in json.load(sys.stdin).get('jobs',[]):
  for s in j.get('steps',[]):
    if 'ingerprint' in s['name'] or 'Sign' in s['name']: print(j['name'],'|',s['name'],'=',s['conclusion'])")
    arts=$(curl -s "$R/actions/runs/$RID/artifacts" | python3 -c "
import json,sys
print('; '.join(f\"{a['name']} id={a['id']} expired={a['expired']}\" for a in json.load(sys.stdin).get('artifacts',[])))")
    echo "APK run $RID $3 $4 | steps: $(echo $steps | tr '\n' ' ') | artifacts: $arts"
    exit 0
  fi
  sleep 60
done
