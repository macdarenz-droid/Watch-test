#!/bin/bash
# deploy-watch.sh: waits for the "Deploy Escobar Worker" run on a commit, then checks the live Worker's /health and POST /reports {}.
# Usage: ./deploy-watch.sh <full sha>. Gives up after about 60 min (80 polls of 45 s). Only the owner merges escobar-worker/** changes, which start the deploy.
# Prints "DEPLOY: <conclusion> <run url>", "health: <first 200 bytes>" and "reports {}: <http code>", or "DEPLOY: no completed run after 60 min".
# Needs the agent proxy's GitHub auth for curl (no token is stored in this file). The Worker URL is the app's built-in endpoint and is already public in the repo.
# Run with Bash run_in_background and timeout 7200000: the default 30 min kills it before the deploy finishes.
S=$1; U=https://marc-coach.mmarcdarenz.workers.dev
for i in $(seq 1 80); do
  r=$(curl -s "https://api.github.com/repos/macdarenz-droid/M-arc/actions/runs?head_sha=$S&per_page=50" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for x in d.get('workflow_runs',[]):
  if x['name'].startswith('Deploy Escobar Worker') and x['status']=='completed': print(x['conclusion'], x['html_url']); break" 2>/dev/null)
  if [ -n "$r" ]; then
    echo "DEPLOY: $r"
    echo "health: $(curl -s $U/health | head -c 200)"
    echo "reports {}: $(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'content-type: application/json' -d '{}' $U/reports)"
    exit 0
  fi
  sleep 45
done
echo "DEPLOY: no completed run after 60 min"
