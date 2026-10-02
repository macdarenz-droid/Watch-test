#!/bin/bash
# branch-watch.sh: prints one line per new push to a fixed list of watched branches (research, drawing and card branches).
# Usage: ./branch-watch.sh. The branch list in the for-loop is a snapshot of 2026-09-30: edit it to the branches you watch. Polls every 90 s and never exits.
# Prints "push <branch> <sha7>". The first poll only records the starting commits.
# Needs the agent proxy's GitHub auth for curl (no token is stored in this file).
# Run with Bash run_in_background and timeout 7200000 so it outlives the default 30 min limit.
declare -A last
while true; do
  for b in claude/lib-8-pilot-a claude/lib-8-hinge-rows claude/lib-8-legs-core claude/lib-8-arms-machines claude/lib-26-flat-palm claude/howto-options claude/libht-research claude/ht-4b-lr23-revendor claude/bug-34-launch-first-frame claude/ht-3c-budgets claude/esc-report-app claude/bug-31-cite-tags claude/bug-32-crisis-prescreen claude/esc-w-cite-wording claude/lr23-plan claude/doc-5-policy-tone-main claude/doc-6-site-headings claude/copy-1-ui-explanations; do
    sha=$(curl -s "https://api.github.com/repos/macdarenz-droid/M-arc/branches/$b" | python3 -c "import json,sys
try: print(json.load(sys.stdin)['commit']['sha'][:7])
except Exception: pass" 2>/dev/null)
    [ -n "$sha" ] || sha=none
    if [ -z "${last[$b]}" ]; then last[$b]=$sha; continue; fi
    if [ "${last[$b]}" != "$sha" ] && [ "$sha" != none ]; then
      echo "push $b $sha"
      last[$b]=$sha
    fi
  done
  sleep 90
done
